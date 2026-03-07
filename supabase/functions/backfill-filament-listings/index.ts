import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RegionMapping {
  region: string;
  currency: string;
  priceCol: string;
  urlCol: string;
}

const REGION_MAPPINGS: RegionMapping[] = [
  { region: "US", currency: "USD", priceCol: "variant_price", urlCol: "product_url" },
  { region: "AU", currency: "AUD", priceCol: "price_aud", urlCol: "product_url_au" },
  { region: "CA", currency: "CAD", priceCol: "price_cad", urlCol: "product_url_ca" },
  { region: "EU", currency: "EUR", priceCol: "price_eur", urlCol: "product_url_eu" },
  { region: "UK", currency: "GBP", priceCol: "price_gbp", urlCol: "product_url_uk" },
  { region: "JP", currency: "JPY", priceCol: "price_jpy", urlCol: "product_url_jp" },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await anonClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client for writes
    const supabase = createClient(supabaseUrl, serviceKey);

    // Parse optional params
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const dryRun = body.dry_run === true;
    const vendorFilter = body.vendor as string | undefined;

    // Step 1: Load all retailers into a map
    console.log("Loading retailers...");
    const { data: retailers, error: retErr } = await supabase
      .from("retailers")
      .select("id, name, slug");
    if (retErr) throw new Error(`Failed to load retailers: ${retErr.message}`);

    const retailerBySlug = new Map<string, string>();
    const retailerByNameLower = new Map<string, string>();
    for (const r of retailers || []) {
      retailerBySlug.set(r.slug, r.id);
      retailerByNameLower.set(r.name.toLowerCase(), r.id);
    }

    // Cache vendor -> retailer_id
    const vendorRetailerCache = new Map<string, string>();

    async function resolveRetailerId(vendor: string): Promise<string> {
      const vendorLower = vendor.toLowerCase();
      if (vendorRetailerCache.has(vendorLower)) {
        return vendorRetailerCache.get(vendorLower)!;
      }

      // Try exact name match
      let retailerId = retailerByNameLower.get(vendorLower);
      if (retailerId) {
        vendorRetailerCache.set(vendorLower, retailerId);
        return retailerId;
      }

      // Try slug match
      const slug = slugify(vendor);
      retailerId = retailerBySlug.get(slug);
      if (retailerId) {
        vendorRetailerCache.set(vendorLower, retailerId);
        return retailerId;
      }

      // Try partial matches
      for (const [name, id] of retailerByNameLower.entries()) {
        if (name.includes(vendorLower) || vendorLower.includes(name)) {
          vendorRetailerCache.set(vendorLower, id);
          return id;
        }
      }

      // Create new retailer
      console.log(`Creating new retailer for vendor: ${vendor}`);
      const { data: newRetailer, error: createErr } = await supabase
        .from("retailers")
        .upsert(
          { name: vendor, slug },
          { onConflict: "slug" }
        )
        .select("id")
        .single();

      if (createErr || !newRetailer) {
        throw new Error(`Failed to create retailer for ${vendor}: ${createErr?.message}`);
      }

      retailerBySlug.set(slug, newRetailer.id);
      retailerByNameLower.set(vendorLower, newRetailer.id);
      vendorRetailerCache.set(vendorLower, newRetailer.id);
      return newRetailer.id;
    }

    // Step 2: Process filaments in batches
    const BATCH_SIZE = 100;
    const UPSERT_CHUNK = 200;
    let offset = 0;
    let totalProcessed = 0;
    let listingsCreated = 0;
    let listingsUpdated = 0;
    let errors: string[] = [];
    let skippedNoVendor = 0;
    let skippedNoPrice = 0;

    const selectCols = `id, vendor, variant_price, msrp, price_aud, price_cad, price_eur, price_gbp, price_jpy,
      product_url, product_url_au, product_url_ca, product_url_eu, product_url_uk, product_url_jp,
      primary_region, price_confidence, variant_compare_at_price`;

    console.log("Starting filament processing...");

    while (true) {
      let query = supabase
        .from("filaments")
        .select(selectCols)
        .range(offset, offset + BATCH_SIZE - 1);

      if (vendorFilter) {
        query = query.ilike("vendor", vendorFilter);
      }

      const { data: filaments, error: fetchErr } = await query;
      if (fetchErr) {
        errors.push(`Fetch error at offset ${offset}: ${fetchErr.message}`);
        break;
      }
      if (!filaments || filaments.length === 0) break;

      const listingsToUpsert: any[] = [];

      for (const f of filaments) {
        if (!f.vendor) {
          skippedNoVendor++;
          continue;
        }

        // Check if any price exists
        const hasAnyPrice =
          f.variant_price != null ||
          f.price_aud != null ||
          f.price_cad != null ||
          f.price_eur != null ||
          f.price_gbp != null ||
          f.price_jpy != null;

        if (!hasAnyPrice) {
          skippedNoPrice++;
          continue;
        }

        let retailerId: string;
        try {
          retailerId = await resolveRetailerId(f.vendor);
        } catch (e: any) {
          errors.push(`Retailer resolve failed for "${f.vendor}": ${e.message}`);
          continue;
        }

        for (const rm of REGION_MAPPINGS) {
          const price = f[rm.priceCol as keyof typeof f] as number | null;
          const url = f[rm.urlCol as keyof typeof f] as string | null;

          if (price == null || !url) continue;

          const primaryRegion = f.primary_region || "US";
          const isPrimary = rm.region === primaryRegion;

          // Determine compare_at_price
          let compareAtPrice: number | null = null;
          if (rm.region === "US" && f.variant_compare_at_price != null && f.variant_compare_at_price !== price) {
            compareAtPrice = f.variant_compare_at_price;
          } else if (f.msrp != null && f.msrp !== price) {
            compareAtPrice = f.msrp;
          }

          listingsToUpsert.push({
            filament_id: f.id,
            retailer_id: retailerId,
            product_url: url,
            current_price: price,
            compare_at_price: compareAtPrice,
            currency: rm.currency,
            region: rm.region,
            available: true,
            is_primary: isPrimary,
            product_type: "filament",
            price_source: "backfill_from_filaments",
            price_confidence: f.price_confidence || null,
            stock_level: null,
            scrape_status: null,
          });
        }

        totalProcessed++;
      }

      // Upsert in chunks
      if (!dryRun) {
        for (let i = 0; i < listingsToUpsert.length; i += UPSERT_CHUNK) {
          const chunk = listingsToUpsert.slice(i, i + UPSERT_CHUNK);
          const { error: upsertErr, count } = await supabase
            .from("filament_listings")
            .upsert(chunk, {
              onConflict: "filament_id,retailer_id,region",
              ignoreDuplicates: false,
            });

          if (upsertErr) {
            errors.push(`Upsert error at offset ${offset}, chunk ${i}: ${upsertErr.message}`);
          } else {
            listingsCreated += chunk.length;
          }
        }
      } else {
        listingsCreated += listingsToUpsert.length;
      }

      console.log(`Processed batch at offset ${offset}: ${filaments.length} filaments, ${listingsToUpsert.length} listings`);
      offset += BATCH_SIZE;

      // Safety: if we've processed a lot, break (edge function timeout)
      if (offset > 10000) {
        console.log("Reached 10k filament limit, stopping");
        break;
      }
    }

    // Step 3: Process product_regional_prices for additional listings
    console.log("Processing product_regional_prices...");
    let regionalPricesAdded = 0;

    const { data: regionalPrices, error: rpErr } = await supabase
      .from("product_regional_prices")
      .select("product_id, product_type, region_code, currency_code, current_price, compare_at_price, msrp, store_url_id")
      .eq("product_type", "filament")
      .not("current_price", "is", null);

    if (rpErr) {
      errors.push(`product_regional_prices fetch error: ${rpErr.message}`);
    } else if (regionalPrices && regionalPrices.length > 0) {
      // Get the filament IDs and their vendors for retailer resolution
      const filamentIds = [...new Set(regionalPrices.map((rp) => rp.product_id))];

      // Batch fetch filament vendors
      const filamentVendors = new Map<string, string>();
      for (let i = 0; i < filamentIds.length; i += 50) {
        const batch = filamentIds.slice(i, i + 50);
        const { data: fData } = await supabase
          .from("filaments")
          .select("id, vendor")
          .in("id", batch);
        if (fData) {
          for (const f of fData) {
            if (f.vendor) filamentVendors.set(f.id, f.vendor);
          }
        }
      }

      // Also fetch product_regional_urls for URLs
      const { data: regionalUrls } = await supabase
        .from("product_regional_urls")
        .select("product_id, region_code, url")
        .eq("product_type", "filament")
        .in("product_id", filamentIds);

      const urlMap = new Map<string, string>();
      if (regionalUrls) {
        for (const ru of regionalUrls) {
          urlMap.set(`${ru.product_id}:${ru.region_code}`, ru.url);
        }
      }

      const rpListings: any[] = [];
      for (const rp of regionalPrices) {
        const vendor = filamentVendors.get(rp.product_id);
        if (!vendor) continue;

        const url = urlMap.get(`${rp.product_id}:${rp.region_code}`);
        if (!url) continue;

        let retailerId: string;
        try {
          retailerId = await resolveRetailerId(vendor);
        } catch {
          continue;
        }

        rpListings.push({
          filament_id: rp.product_id,
          retailer_id: retailerId,
          product_url: url,
          current_price: rp.current_price,
          compare_at_price: rp.compare_at_price || rp.msrp || null,
          currency: rp.currency_code,
          region: rp.region_code,
          available: true,
          is_primary: false,
          product_type: "filament",
          price_source: "backfill_from_regional_prices",
          price_confidence: null,
          stock_level: null,
          scrape_status: null,
        });
      }

      if (!dryRun && rpListings.length > 0) {
        for (let i = 0; i < rpListings.length; i += UPSERT_CHUNK) {
          const chunk = rpListings.slice(i, i + UPSERT_CHUNK);
          const { error: upsertErr } = await supabase
            .from("filament_listings")
            .upsert(chunk, {
              onConflict: "filament_id,retailer_id,region",
              ignoreDuplicates: false,
            });
          if (upsertErr) {
            errors.push(`Regional prices upsert error: ${upsertErr.message}`);
          } else {
            regionalPricesAdded += chunk.length;
          }
        }
      } else {
        regionalPricesAdded = rpListings.length;
      }
    }

    const summary = {
      dry_run: dryRun,
      total_filaments_processed: totalProcessed,
      skipped_no_vendor: skippedNoVendor,
      skipped_no_price: skippedNoPrice,
      listings_from_filaments: listingsCreated,
      listings_from_regional_prices: regionalPricesAdded,
      total_listings: listingsCreated + regionalPricesAdded,
      retailers_created: vendorRetailerCache.size - retailerByNameLower.size,
      errors: errors.length > 0 ? errors.slice(0, 20) : [],
      error_count: errors.length,
    };

    console.log("Backfill complete:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Backfill error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
