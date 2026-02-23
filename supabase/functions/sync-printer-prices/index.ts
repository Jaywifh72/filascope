import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractPrice, type ExtractionResult, type BrandSyncConfig } from "../_shared/printer-price-extraction.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Regional column mapping
const REGION_MAP = {
  US: { urlCol: "product_url",    priceCol: "current_price_usd_store", msrpCol: "msrp_usd", currency: "USD", configUrlCol: "store_url_us" },
  CA: { urlCol: "product_url_ca", priceCol: "current_price_cad_store", msrpCol: "msrp_cad", currency: "CAD", configUrlCol: "store_url_ca" },
  UK: { urlCol: "product_url_uk", priceCol: "current_price_gbp_store", msrpCol: "msrp_gbp", currency: "GBP", configUrlCol: "store_url_uk" },
  EU: { urlCol: "product_url_eu", priceCol: "current_price_eur_store", msrpCol: "msrp_eur", currency: "EUR", configUrlCol: "store_url_eu" },
  AU: { urlCol: "product_url_au", priceCol: "current_price_aud_store", msrpCol: "msrp_aud", currency: "AUD", configUrlCol: "store_url_au" },
  JP: { urlCol: "product_url_jp", priceCol: "current_price_jpy_store", msrpCol: "msrp_jpy", currency: "JPY", configUrlCol: "store_url_jp" },
} as const;

type RegionCode = keyof typeof REGION_MAP;

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function extractSlug(productUrl: string): string | null {
  try {
    const url = new URL(productUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const prodIdx = parts.indexOf("products");
    if (prodIdx >= 0 && parts[prodIdx + 1]) return parts[prodIdx + 1];
    // Try /product/ (WooCommerce)
    const prodIdx2 = parts.indexOf("product");
    if (prodIdx2 >= 0 && parts[prodIdx2 + 1]) return parts[prodIdx2 + 1];
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
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
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const { data: roleData } = await userClient
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
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

    // Parse request body
    let body: { brand_id?: string; printer_id?: string } = {};
    try { body = await req.json(); } catch { /* no body = sync all */ }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Load ALL brand_sync_config rows and build lookup
    const { data: allConfigs, error: configError } = await supabase
      .from("brand_sync_config")
      .select("*");

    if (configError) throw new Error(`Failed to load brand_sync_config: ${configError.message}`);

    const configByBrandId = new Map<string, BrandSyncConfig>();
    for (const c of allConfigs || []) {
      configByBrandId.set(c.brand_id, c as BrandSyncConfig);
    }

    // 2. Query printers with brand join
    let query = supabase
      .from("printers")
      .select(`
        id, model_name, product_url, product_url_ca, product_url_uk, product_url_eu, product_url_au,
        current_price_usd_store, current_price_cad_store, current_price_eur_store, current_price_gbp_store, current_price_aud_store, current_price_jpy_store,
        msrp_usd, msrp_cad, msrp_eur, msrp_gbp, msrp_aud, msrp_jpy, product_url_jp,
        shopify_variant_ids, price_extraction_method, price_confidence, price_requires_review,
        brand_id, status,
        printer_brands!inner ( id, brand )
      `)
      .neq("status", "discontinued");

    if (body.printer_id) {
      query = query.eq("id", body.printer_id);
    } else if (body.brand_id) {
      // Find brand by slug match
      const { data: brandRow } = await supabase
        .from("printer_brands")
        .select("id, brand")
        .then(({ data }) => ({
          data: data?.find(b => slugify(b.brand) === body.brand_id) || null,
        }));
      if (!brandRow) {
        return new Response(JSON.stringify({ error: `Brand not found for slug: ${body.brand_id}` }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      query = query.eq("brand_id", brandRow.id);
    }

    const { data: printers, error: printersError } = await query;
    if (printersError) throw new Error(`Failed to fetch printers: ${printersError.message}`);

    const timestamp = new Date().toISOString();
    const results: any[] = [];
    let totalUpdated = 0;
    let totalErrors = 0;
    let totalAnomalies = 0;
    let totalSkipped = 0;
    let totalManualOnly = 0;

    for (const printer of printers || []) {
      const brandName = (printer as any).printer_brands?.brand;
      if (!brandName) {
        totalErrors++;
        results.push({ printer: printer.model_name, brand: null, error: "No brand linked" });
        continue;
      }

      const brandSlug = slugify(brandName);
      const config = configByBrandId.get(brandSlug);

      // If no config exists, skip
      if (!config) {
        totalSkipped++;
        results.push({ printer: printer.model_name, brand: brandSlug, slug: null, skipped: true, reason: "No brand_sync_config entry" });
        continue;
      }

      // If manual_only, skip
      if (config.primary_extraction === "manual_only") {
        totalManualOnly++;
        results.push({ printer: printer.model_name, brand: brandSlug, slug: null, skipped: true, reason: "manual_only" });
        continue;
      }

      const slug = extractSlug(printer.product_url || "");
      if (!slug) {
        totalErrors++;
        results.push({ printer: printer.model_name, brand: brandSlug, slug: null, error: "Could not extract slug from product_url" });
        continue;
      }

      // Determine which regions to sync
      const regionsToSync: RegionCode[] = ["US"]; // Always sync US
      if (!config.uses_geo_pricing) {
        // Add regions that have a URL template in config OR a URL on the printer
        for (const rc of ["CA", "UK", "EU", "AU", "JP"] as RegionCode[]) {
          const regionMeta = REGION_MAP[rc];
          const configUrl = (config as any)[regionMeta.configUrlCol];
          const printerUrl = (printer as any)[regionMeta.urlCol];
          if (configUrl || printerUrl) {
            regionsToSync.push(rc);
          }
        }
      }

      const regionResults: Record<string, any> = {};
      const priceUpdates: Record<string, any> = {};
      let lastExtractionMethod: string | null = null;
      let lastConfidence: string | null = null;
      let requiresReview = false;

      for (const regionCode of regionsToSync) {
        const regionMeta = REGION_MAP[regionCode];

        // Build URL: config template > printer's own URL column > fallback
        let productUrl: string | null = null;
        const configTemplate = (config as any)[regionMeta.configUrlCol] as string | null;
        if (configTemplate && configTemplate.includes("{slug}")) {
          productUrl = configTemplate.replace("{slug}", slug);
        } else if (regionCode === "US" && printer.product_url) {
          productUrl = printer.product_url;
        } else {
          const printerRegionalUrl = (printer as any)[regionMeta.urlCol] as string | null;
          if (printerRegionalUrl) productUrl = printerRegionalUrl;
        }

        if (!productUrl) {
          regionResults[regionCode] = { status: "skipped", reason: "No URL available" };
          continue;
        }

        const oldPrice = (printer as any)[regionMeta.priceCol] as number | null;

        try {
          const extraction: ExtractionResult = await extractPrice(productUrl, regionCode, oldPrice, config);

          lastExtractionMethod = extraction.extraction_method;
          lastConfidence = extraction.confidence;

          if (!extraction.current_price || extraction.current_price <= 0) {
            regionResults[regionCode] = {
              status: extraction.extraction_method === "manual" ? "extraction_failed" : "not_found",
              error: "No valid price extracted",
              extraction_method: extraction.extraction_method,
            };
            totalErrors++;
            continue;
          }

          const newPrice = extraction.current_price;
          const compareAt = extraction.compare_at_price;
          const msrp = compareAt || newPrice;

          let status = "unchanged";
          if (oldPrice === null || oldPrice === undefined) {
            status = "new";
          } else if (Math.abs(newPrice - oldPrice) > 0.01) {
            status = "updated";
          }

          let isAnomaly = false;
          if (extraction.requires_review) {
            isAnomaly = true;
            requiresReview = true;
            totalAnomalies++;
          }

          regionResults[regionCode] = {
            oldPrice: oldPrice ?? null,
            newPrice,
            msrp,
            variantName: extraction.variant_name,
            status,
            isAnomaly,
            extraction_method: extraction.extraction_method,
            confidence: extraction.confidence,
            is_combo: extraction.is_combo,
            raw_variants_found: extraction.raw_variants_found,
          };

          // Only auto-update if not flagged for review
          if (status !== "unchanged" && !extraction.requires_review) {
            priceUpdates[regionMeta.priceCol] = newPrice;
            priceUpdates[regionMeta.msrpCol] = msrp;
            totalUpdated++;
          }

          // Log to price_history
          if (status !== "unchanged") {
            await supabase.from("price_history").insert({
              printer_id: printer.id,
              product_type: "printer",
              price: newPrice,
              compare_at_price: compareAt,
              region: regionCode,
              currency: regionMeta.currency,
              source: "price-sync",
              notes: `Brand: ${brandSlug}, Method: ${extraction.extraction_method}, Variant: ${extraction.variant_name || "N/A"}, Confidence: ${extraction.confidence}${extraction.is_combo ? " [COMBO]" : ""}${extraction.requires_review ? " [REVIEW NEEDED]" : ""}`,
            });
          }
        } catch (err) {
          regionResults[regionCode] = {
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          };
          totalErrors++;
        }
      }

      // Apply updates to printer record
      if (Object.keys(priceUpdates).length > 0) {
        await supabase
          .from("printers")
          .update({
            ...priceUpdates,
            prices_last_updated_at: timestamp,
            price_extraction_method: lastExtractionMethod,
            price_confidence: lastConfidence,
            price_requires_review: requiresReview,
          })
          .eq("id", printer.id);
      } else {
        // Update metadata even if prices unchanged
        await supabase
          .from("printers")
          .update({
            price_extraction_method: lastExtractionMethod,
            price_confidence: lastConfidence,
            price_requires_review: requiresReview,
          })
          .eq("id", printer.id);
      }

      results.push({
        printer: printer.model_name,
        brand: brandSlug,
        slug,
        regions: regionResults,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp,
      results,
      summary: {
        printersChecked: printers?.length || 0,
        pricesUpdated: totalUpdated,
        skipped: totalSkipped,
        errors: totalErrors,
        anomalies: totalAnomalies,
        manualOnly: totalManualOnly,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sync-printer-prices error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
