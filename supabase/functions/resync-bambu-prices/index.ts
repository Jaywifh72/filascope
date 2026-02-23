import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REGIONS = [
  { code: "US", domain: "us.store.bambulab.com", priceCol: "current_price_usd_store", msrpCol: "msrp_usd", currency: "USD" },
  { code: "CA", domain: "ca.store.bambulab.com", priceCol: "current_price_cad_store", msrpCol: "msrp_cad", currency: "CAD" },
  { code: "EU", domain: "eu.store.bambulab.com", priceCol: "current_price_eur_store", msrpCol: "msrp_eur", currency: "EUR" },
  { code: "UK", domain: "uk.store.bambulab.com", priceCol: "current_price_gbp_store", msrpCol: "msrp_gbp", currency: "GBP" },
  { code: "AU", domain: "au.store.bambulab.com", priceCol: "current_price_aud_store", msrpCol: "msrp_aud", currency: "AUD" },
] as const;

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
}

interface ShopifyProduct {
  product: {
    title: string;
    variants: ShopifyVariant[];
  };
}

function extractSlug(productUrl: string): string | null {
  try {
    const url = new URL(productUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    // Expected: /products/{slug}
    const prodIdx = parts.indexOf("products");
    if (prodIdx >= 0 && parts[prodIdx + 1]) {
      return parts[prodIdx + 1];
    }
    // Fallback: last path segment
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

function findBaseVariant(variants: ShopifyVariant[]): ShopifyVariant | null {
  // Filter out combo/bundle/AMS variants
  const excluded = /combo|bundle|ams/i;
  const baseVariants = variants.filter((v) => !excluded.test(v.title));

  if (baseVariants.length === 0) {
    // If all variants match exclusion, fall back to cheapest overall
    return variants.reduce((min, v) =>
      parseFloat(v.price) < parseFloat(min.price) ? v : min
    , variants[0]) || null;
  }

  // Return the cheapest base variant
  return baseVariants.reduce((min, v) =>
    parseFloat(v.price) < parseFloat(min.price) ? v : min
  , baseVariants[0]);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Dual auth: admin JWT or service_role key
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    let isAuthorized = false;

    if (token === serviceRoleKey) {
      isAuthorized = true;
    } else if (token) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getClaims(token);
      if (data?.claims?.sub) {
        // Check admin role
        const { data: roleData } = await userClient
          .from("user_roles")
          .select("role")
          .eq("user_id", data.claims.sub)
          .eq("role", "admin")
          .maybeSingle();
        if (roleData) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for DB operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get Bambu Lab brand ID
    const { data: brand } = await supabase
      .from("printer_brands")
      .select("id")
      .ilike("brand", "%bambu%")
      .maybeSingle();

    if (!brand) {
      return new Response(
        JSON.stringify({ error: "Bambu Lab brand not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all active Bambu Lab printers
    const { data: printers, error: printersError } = await supabase
      .from("printers")
      .select("id, model_name, product_url, current_price_usd_store, current_price_cad_store, current_price_eur_store, current_price_gbp_store, current_price_aud_store, msrp_usd, msrp_cad, msrp_eur, msrp_gbp, msrp_aud, shopify_variant_ids")
      .eq("brand_id", brand.id)
      .neq("status", "discontinued");

    if (printersError) {
      throw new Error(`Failed to fetch printers: ${printersError.message}`);
    }

    const timestamp = new Date().toISOString();
    const results: any[] = [];
    let totalUpdated = 0;
    let totalErrors = 0;
    let totalAnomalies = 0;

    for (const printer of printers || []) {
      const slug = extractSlug(printer.product_url || "");
      if (!slug) {
        totalErrors++;
        results.push({
          printer: printer.model_name,
          slug: null,
          error: "Could not extract slug from product_url",
          regions: {},
        });
        continue;
      }

      const regionResults: Record<string, any> = {};
      const priceUpdates: Record<string, any> = {};
      const currentVariantIds = (printer.shopify_variant_ids as Record<string, string>) || {};
      const newVariantIds = { ...currentVariantIds };

      for (const region of REGIONS) {
        const shopifyUrl = `https://${region.domain}/products/${slug}.json`;

        try {
          const resp = await fetch(shopifyUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; FilaScope/1.0)",
              Accept: "application/json",
            },
          });

          if (resp.status === 404) {
            regionResults[region.code] = { status: "not_found", error: "Product not found (404)" };
            totalErrors++;
            continue;
          }

          if (!resp.ok) {
            const text = await resp.text();
            regionResults[region.code] = { status: "error", error: `HTTP ${resp.status}: ${text.slice(0, 200)}` };
            totalErrors++;
            continue;
          }

          const data: ShopifyProduct = await resp.json();
          const variant = findBaseVariant(data.product.variants);

          if (!variant) {
            regionResults[region.code] = { status: "error", error: "No suitable variant found" };
            totalErrors++;
            continue;
          }

          const newPrice = parseFloat(variant.price);
          const compareAt = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
          const msrp = compareAt || newPrice;
          const oldPrice = (printer as any)[region.priceCol] as number | null;

          // Store variant ID for future tracking
          newVariantIds[region.code] = String(variant.id);

          // Determine status
          let status = "unchanged";
          if (oldPrice === null || oldPrice === undefined) {
            status = "new";
          } else if (Math.abs(newPrice - oldPrice) > 0.01) {
            status = "updated";
          }

          // Check for anomalous price changes (>20%)
          let isAnomaly = false;
          if (oldPrice && oldPrice > 0 && status === "updated") {
            const changePercent = Math.abs((newPrice - oldPrice) / oldPrice) * 100;
            if (changePercent > 20) {
              isAnomaly = true;
              totalAnomalies++;
            }
          }

          regionResults[region.code] = {
            oldPrice: oldPrice ?? null,
            newPrice,
            msrp,
            variantId: variant.id,
            variantTitle: variant.title,
            status,
            isAnomaly,
          };

          // Build update object for this region
          if (status !== "unchanged") {
            priceUpdates[region.priceCol] = newPrice;
            priceUpdates[region.msrpCol] = msrp;
            totalUpdated++;

            // Log to price_history
            await supabase.from("price_history").insert({
              printer_id: printer.id,
              product_type: "printer",
              price: newPrice,
              compare_at_price: compareAt,
              region: region.code,
              currency: region.currency,
              source: "bambu-resync",
              notes: `Auto-synced from Shopify. Variant: ${variant.title} (${variant.id})`,
            });
          }
        } catch (err) {
          regionResults[region.code] = {
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          };
          totalErrors++;
        }
      }

      // Apply price updates if any
      if (Object.keys(priceUpdates).length > 0) {
        const updatePayload = {
          ...priceUpdates,
          shopify_variant_ids: newVariantIds,
          prices_last_updated_at: timestamp,
        };

        const { error: updateError } = await supabase
          .from("printers")
          .update(updatePayload)
          .eq("id", printer.id);

        if (updateError) {
          console.error(`Failed to update printer ${printer.model_name}: ${updateError.message}`);
        }
      } else if (JSON.stringify(newVariantIds) !== JSON.stringify(currentVariantIds)) {
        // Update variant IDs even if prices didn't change
        await supabase
          .from("printers")
          .update({ shopify_variant_ids: newVariantIds })
          .eq("id", printer.id);
      }

      results.push({
        printer: printer.model_name,
        slug,
        regions: regionResults,
      });
    }

    const response = {
      success: true,
      brand: "bambu-lab",
      timestamp,
      results,
      summary: {
        printersChecked: printers?.length || 0,
        pricesUpdated: totalUpdated,
        errors: totalErrors,
        anomalies: totalAnomalies,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("resync-bambu-prices error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
