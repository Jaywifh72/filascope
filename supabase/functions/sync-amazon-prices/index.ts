import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PA-API endpoints per marketplace
const PA_API_HOSTS: Record<string, string> = {
  US: "webservices.amazon.com",
  UK: "webservices.amazon.co.uk",
  DE: "webservices.amazon.de",
  CA: "webservices.amazon.ca",
  FR: "webservices.amazon.fr",
  IT: "webservices.amazon.it",
  ES: "webservices.amazon.es",
  AU: "webservices.amazon.com.au",
  JP: "webservices.amazon.co.jp",
};

const MARKETPLACE_PARTNER_TAGS: Record<string, string> = {
  US: "filascope-20",
  UK: "filascope-21",
  DE: "filascope-21",
  CA: "filascope-20",
  FR: "filascope-21",
  IT: "filascope-21",
  ES: "filascope-21",
  AU: "filascope-22",
  JP: "filascope-22",
};

const MARKETPLACE_REGIONS: Record<string, string> = {
  US: "us-east-1",
  CA: "us-east-1",
  UK: "eu-west-1",
  DE: "eu-west-1",
  FR: "eu-west-1",
  IT: "eu-west-1",
  ES: "eu-west-1",
  AU: "us-west-2",
  JP: "us-west-2",
};

const MARKETPLACE_CURRENCIES: Record<string, string> = {
  US: "USD",
  CA: "CAD",
  UK: "GBP",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  AU: "AUD",
  JP: "JPY",
};

const MARKETPLACE_TO_REGION: Record<string, string> = {
  US: "US",
  CA: "CA",
  UK: "UK",
  DE: "EU",
  FR: "EU",
  IT: "EU",
  ES: "EU",
  AU: "AU",
  JP: "JP",
};

const RETAILER_SLUGS: Record<string, string> = {
  US: "amazon-us",
  UK: "amazon-uk",
  DE: "amazon-de",
  CA: "amazon-ca",
  FR: "amazon-fr",
  IT: "amazon-it",
  ES: "amazon-es",
  AU: "amazon-au",
  JP: "amazon-jp",
};

const MARKETPLACE_DOMAINS: Record<string, string> = {
  US: "amazon.com",
  UK: "amazon.co.uk",
  DE: "amazon.de",
  CA: "amazon.ca",
  FR: "amazon.fr",
  IT: "amazon.it",
  ES: "amazon.es",
  AU: "amazon.com.au",
  JP: "amazon.co.jp",
};

interface SyncRequest {
  marketplace?: string;
  brand_slug?: string;
  stale_only?: boolean;
  stale_days?: number;
  batch_size?: number;
  dry_run?: boolean;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body: SyncRequest = await req.json();
    const {
      marketplace,
      brand_slug,
      stale_only = true,
      stale_days = 7,
      batch_size = 10,
      dry_run = false,
    } = body;

    // Create sync run record
    const { data: syncRun, error: runError } = await supabase
      .from("amazon_sync_runs")
      .insert({
        run_type: "price_refresh",
        status: "running",
        brand_slug,
        marketplace,
      })
      .select()
      .single();

    if (runError) throw runError;
    const runId = syncRun.id;
    const startTime = Date.now();
    const errorLog: string[] = [];
    let totalItems = 0;
    let processed = 0;
    let pricesUpdated = 0;
    let errors = 0;
    let skipped = 0;
    let apiCallsUsed = 0;

    // Fetch mappings to sync
    let query = supabase
      .from("amazon_product_mappings")
      .select("*, filaments!inner(id, name, brand, weight)")
      .eq("is_active", true);

    if (marketplace) {
      query = query.eq("marketplace", marketplace);
    }

    // If stale_only, filter by listing's last_scraped_at
    // For now, get all mappings and filter in code
    const { data: mappings, error: mapError } = await query.limit(500);
    if (mapError) throw mapError;

    if (!mappings || mappings.length === 0) {
      await supabase.from("amazon_sync_runs").update({
        status: "completed",
        total_items: 0,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      }).eq("id", runId);

      return new Response(JSON.stringify({
        runId,
        status: "completed",
        totalItems: 0,
        processed: 0,
        pricesUpdated: 0,
        newMappings: 0,
        errors: 0,
        apiCallsUsed: 0,
        durationMs: Date.now() - startTime,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Filter by brand if specified
    let filteredMappings = mappings;
    if (brand_slug) {
      filteredMappings = mappings.filter((m: any) =>
        m.filaments?.brand?.toLowerCase().replace(/\s+/g, "-") === brand_slug.toLowerCase()
      );
    }

    totalItems = filteredMappings.length;

    // Group by marketplace for batched PA-API calls
    const byMarketplace: Record<string, any[]> = {};
    for (const mapping of filteredMappings) {
      const mp = mapping.marketplace;
      if (!byMarketplace[mp]) byMarketplace[mp] = [];
      byMarketplace[mp].push(mapping);
    }

    // Look up retailer IDs
    const { data: retailers } = await supabase
      .from("retailers")
      .select("id, slug")
      .in("slug", Object.values(RETAILER_SLUGS));

    const retailerIdMap: Record<string, string> = {};
    retailers?.forEach((r: any) => {
      retailerIdMap[r.slug] = r.id;
    });

    // Process each marketplace
    for (const [mp, mpMappings] of Object.entries(byMarketplace)) {
      const retailerSlug = RETAILER_SLUGS[mp];
      const retailerId = retailerIdMap[retailerSlug];
      if (!retailerId) {
        errorLog.push(`No retailer found for ${retailerSlug}`);
        errors += mpMappings.length;
        continue;
      }

      // Batch ASINs (PA-API allows max 10 per request)
      for (let i = 0; i < mpMappings.length; i += batch_size) {
        const batch = mpMappings.slice(i, i + batch_size);
        const asins = batch.map((m: any) => m.asin);

        if (dry_run) {
          processed += batch.length;
          skipped += batch.length;
          continue;
        }

        try {
          // Call PA-API GetItems
          const accessKey = Deno.env.get("AMAZON_ACCESS_KEY");
          const secretKey = Deno.env.get("AMAZON_SECRET_KEY");
          const partnerTag = MARKETPLACE_PARTNER_TAGS[mp] || "filascope-20";

          if (!accessKey || !secretKey) {
            // Fallback: use SerpAPI for price lookup
            errorLog.push(`PA-API credentials not configured, skipping ${mp} batch`);
            skipped += batch.length;
            processed += batch.length;
            continue;
          }

          const host = PA_API_HOSTS[mp];
          const region = MARKETPLACE_REGIONS[mp];
          const path = "/paapi5/getitems";

          const payload = JSON.stringify({
            ItemIds: asins,
            ItemIdType: "ASIN",
            Resources: [
              "ItemInfo.Title",
              "Offers.Listings.Price",
              "Offers.Listings.SavingBasis",
              "Offers.Listings.DeliveryInfo.IsPrimeEligible",
              "Offers.Listings.MerchantInfo",
              "Offers.Listings.Promotions",
              "CustomerReviews.Count",
              "CustomerReviews.StarRating",
              "Images.Primary.Large",
              "ItemInfo.ByLineInfo",
            ],
            PartnerTag: partnerTag,
            PartnerType: "Associates",
            Marketplace: `www.${MARKETPLACE_DOMAINS[mp]}`,
          });

          // AWS Signature V4 signing
          const now = new Date();
          const dateStamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 8);
          const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z/, "Z");

          const canonicalHeaders = `content-encoding:amz-1.0\ncontent-type:application/json; charset=utf-8\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems\n`;
          const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";

          const encoder = new TextEncoder();
          const payloadHash = await crypto.subtle.digest("SHA-256", encoder.encode(payload));
          const payloadHashHex = Array.from(new Uint8Array(payloadHash)).map(b => b.toString(16).padStart(2, "0")).join("");

          const canonicalRequest = `POST\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHashHex}`;
          const credentialScope = `${dateStamp}/${region}/ProductAdvertisingAPI/aws4_request`;

          const canonicalRequestHash = await crypto.subtle.digest("SHA-256", encoder.encode(canonicalRequest));
          const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash)).map(b => b.toString(16).padStart(2, "0")).join("");

          const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHashHex}`;

          // HMAC chain
          async function hmacSha256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
            const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
            return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
          }

          const kDate = await hmacSha256(encoder.encode(`AWS4${secretKey}`), dateStamp);
          const kRegion = await hmacSha256(kDate, region);
          const kService = await hmacSha256(kRegion, "ProductAdvertisingAPI");
          const kSigning = await hmacSha256(kService, "aws4_request");

          const signatureBuffer = await hmacSha256(kSigning, stringToSign);
          const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

          const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

          const response = await fetch(`https://${host}${path}`, {
            method: "POST",
            headers: {
              "content-encoding": "amz-1.0",
              "content-type": "application/json; charset=utf-8",
              "host": host,
              "x-amz-date": amzDate,
              "x-amz-target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
              "Authorization": authHeader,
            },
            body: payload,
          });

          apiCallsUsed++;

          if (!response.ok) {
            const errText = await response.text();
            errorLog.push(`PA-API error for ${mp}: ${response.status} - ${errText.substring(0, 200)}`);
            errors += batch.length;
            processed += batch.length;
            continue;
          }

          const result = await response.json();
          const items = result.ItemsResult?.Items || [];

          // Process each item
          for (const mapping of batch) {
            const item = items.find((it: any) => it.ASIN === mapping.asin);

            if (!item) {
              errorLog.push(`ASIN ${mapping.asin} not found in PA-API response`);
              errors++;
              processed++;
              continue;
            }

            try {
              const listing = item.Offers?.Listings?.[0];
              const price = listing?.Price?.Amount;
              const currency = MARKETPLACE_CURRENCIES[mp];
              const compareAtPrice = listing?.SavingBasis?.Amount;
              const isPrime = listing?.DeliveryInfo?.IsPrimeEligible || false;
              const sellerName = listing?.MerchantInfo?.Name;
              const title = item.ItemInfo?.Title?.DisplayValue;
              const rating = item.CustomerReviews?.StarRating?.Value;
              const reviewCount = item.CustomerReviews?.Count;
              const imageUrl = item.Images?.Primary?.Large?.URL;
              const region = MARKETPLACE_TO_REGION[mp];
              const domain = MARKETPLACE_DOMAINS[mp];
              const productUrl = `https://${domain}/dp/${mapping.asin}`;

              // Check for promotions/coupons
              const promotions = listing?.Promotions || [];
              let couponPercent: number | null = null;
              let couponText: string | null = null;
              for (const promo of promotions) {
                if (promo.Type === "Coupon") {
                  couponPercent = promo.DiscountPercent;
                  couponText = `Save ${promo.DiscountPercent}% with coupon`;
                }
              }

              if (price != null) {
                // Upsert filament_listing
                const listingData = {
                  filament_id: mapping.filament_id,
                  retailer_id: retailerId,
                  product_url: productUrl,
                  current_price: price,
                  compare_at_price: compareAtPrice || null,
                  currency,
                  region,
                  available: true,
                  last_scraped_at: new Date().toISOString(),
                  scrape_source: "pa_api",
                  scrape_status: "success",
                };

                let listingId = mapping.listing_id;

                if (listingId) {
                  // Update existing listing
                  const { error: updateErr } = await supabase
                    .from("filament_listings")
                    .update(listingData)
                    .eq("id", listingId);

                  if (updateErr) {
                    errorLog.push(`Failed to update listing for ${mapping.asin}: ${updateErr.message}`);
                    errors++;
                  } else {
                    pricesUpdated++;
                  }
                } else {
                  // Create new listing
                  const { data: newListing, error: insertErr } = await supabase
                    .from("filament_listings")
                    .upsert(listingData, { onConflict: "filament_id,retailer_id,region" })
                    .select("id")
                    .single();

                  if (insertErr) {
                    errorLog.push(`Failed to create listing for ${mapping.asin}: ${insertErr.message}`);
                    errors++;
                  } else {
                    listingId = newListing.id;
                    pricesUpdated++;

                    // Link mapping to listing
                    await supabase
                      .from("amazon_product_mappings")
                      .update({ listing_id: listingId })
                      .eq("id", mapping.id);
                  }
                }

                // Upsert Amazon product details
                const detailsData = {
                  mapping_id: mapping.id,
                  rating: rating || null,
                  review_count: reviewCount || null,
                  buy_box_seller: sellerName || null,
                  is_sold_by_brand: sellerName ? sellerName.toLowerCase().includes(mapping.brand_name?.toLowerCase() || "") : null,
                  is_prime_eligible: isPrime,
                  coupon_text: couponText,
                  coupon_percent: couponPercent,
                  main_image_url: imageUrl || null,
                  stock_status: "in_stock",
                  last_fetched_at: new Date().toISOString(),
                };

                await supabase
                  .from("amazon_product_details")
                  .upsert(detailsData, { onConflict: "mapping_id" });

                // Update mapping title
                if (title) {
                  await supabase
                    .from("amazon_product_mappings")
                    .update({ amazon_title: title })
                    .eq("id", mapping.id);
                }
              } else {
                // No price = likely out of stock
                if (mapping.listing_id) {
                  await supabase
                    .from("filament_listings")
                    .update({ available: false, last_scraped_at: new Date().toISOString() })
                    .eq("id", mapping.listing_id);
                }

                await supabase
                  .from("amazon_product_details")
                  .upsert({
                    mapping_id: mapping.id,
                    stock_status: "out_of_stock",
                    last_fetched_at: new Date().toISOString(),
                  }, { onConflict: "mapping_id" });

                skipped++;
              }
            } catch (itemErr: any) {
              errorLog.push(`Error processing ${mapping.asin}: ${itemErr.message}`);
              errors++;
            }

            processed++;
          }

          // Rate limit: 1 request per second
          await new Promise((resolve) => setTimeout(resolve, 1100));
        } catch (batchErr: any) {
          errorLog.push(`Batch error for ${mp}: ${batchErr.message}`);
          errors += batch.length;
          processed += batch.length;
        }
      }
    }

    // Finalize sync run
    const durationMs = Date.now() - startTime;
    await supabase.from("amazon_sync_runs").update({
      status: errors > 0 && pricesUpdated === 0 ? "failed" : errors > 0 ? "partial" : "completed",
      total_items: totalItems,
      processed,
      prices_updated: pricesUpdated,
      errors,
      skipped,
      api_calls_used: apiCallsUsed,
      error_log: errorLog,
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
    }).eq("id", runId);

    return new Response(JSON.stringify({
      runId,
      status: errors > 0 && pricesUpdated === 0 ? "failed" : errors > 0 ? "partial" : "completed",
      totalItems,
      processed,
      pricesUpdated,
      newMappings: 0,
      errors,
      apiCallsUsed,
      durationMs,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("sync-amazon-prices error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
