import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractPrice, type ExtractionResult, type BrandSyncConfig } from "../_shared/printer-price-extraction.ts";

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

function extractSlug(productUrl: string): string | null {
  try {
    const url = new URL(productUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const prodIdx = parts.indexOf("products");
    if (prodIdx >= 0 && parts[prodIdx + 1]) {
      return parts[prodIdx + 1];
    }
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
      const { data } = await userClient.auth.getClaims(token);
      if (data?.claims?.sub) {
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

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Load brand sync config for Bambu Lab
    const { data: syncConfig } = await supabase
      .from("brand_sync_config")
      .select("*")
      .eq("brand_id", "bambu-lab")
      .maybeSingle();

    const brandConfig: BrandSyncConfig | undefined = syncConfig ? syncConfig as BrandSyncConfig : undefined;

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
      .select("id, model_name, product_url, current_price_usd_store, current_price_cad_store, current_price_eur_store, current_price_gbp_store, current_price_aud_store, msrp_usd, msrp_cad, msrp_eur, msrp_gbp, msrp_aud, shopify_variant_ids, price_extraction_method, price_confidence, price_requires_review")
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
      let lastExtractionMethod: string | null = null;
      let lastConfidence: string | null = null;
      let requiresReview = false;

      for (const region of REGIONS) {
        const productUrl = `https://${region.domain}/products/${slug}`;
        const oldPrice = (printer as any)[region.priceCol] as number | null;

        try {
          // Use the shared 3-tier extraction engine with brand config
          const extraction: ExtractionResult = await extractPrice(
            productUrl,
            region.code,
            oldPrice,
            brandConfig
          );

          lastExtractionMethod = extraction.extraction_method;
          lastConfidence = extraction.confidence;

          // If extraction returned no price, don't overwrite existing
          if (!extraction.current_price || extraction.current_price <= 0) {
            regionResults[region.code] = {
              status: extraction.extraction_method === 'manual' ? 'extraction_failed' : 'not_found',
              error: 'No valid price extracted',
              extraction_method: extraction.extraction_method,
            };
            totalErrors++;
            continue;
          }

          const newPrice = extraction.current_price;
          const compareAt = extraction.compare_at_price;
          const msrp = compareAt || newPrice;

          // Determine status
          let status = "unchanged";
          if (oldPrice === null || oldPrice === undefined) {
            status = "new";
          } else if (Math.abs(newPrice - oldPrice) > 0.01) {
            status = "updated";
          }

          // Check for anomalous price changes
          let isAnomaly = false;
          if (extraction.requires_review) {
            isAnomaly = true;
            requiresReview = true;
            totalAnomalies++;
          }

          regionResults[region.code] = {
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

          // Only auto-update if confidence is not 'low' (>40% anomaly)
          if (status !== "unchanged" && !extraction.requires_review) {
            priceUpdates[region.priceCol] = newPrice;
            priceUpdates[region.msrpCol] = msrp;
            totalUpdated++;
          }

          // Always log to price_history (even anomalies, for audit)
          if (status !== "unchanged") {
            await supabase.from("price_history").insert({
              printer_id: printer.id,
              product_type: "printer",
              price: newPrice,
              compare_at_price: compareAt,
              region: region.code,
              currency: region.currency,
              source: "bambu-resync",
              notes: `Method: ${extraction.extraction_method}, Variant: ${extraction.variant_name || 'N/A'}, Confidence: ${extraction.confidence}${extraction.is_combo ? ' [COMBO]' : ''}${extraction.requires_review ? ' [REVIEW NEEDED]' : ''}`,
            });
          }

          // Track variant ID if from Shopify JSON
          if (extraction.extraction_method === 'shopify_json' && extraction.variant_name) {
            newVariantIds[region.code] = extraction.variant_name;
          }
        } catch (err) {
          regionResults[region.code] = {
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          };
          totalErrors++;
        }
      }

      // Apply price updates if any (never overwrite with null)
      if (Object.keys(priceUpdates).length > 0) {
        const updatePayload: Record<string, any> = {
          ...priceUpdates,
          shopify_variant_ids: newVariantIds,
          prices_last_updated_at: timestamp,
          price_extraction_method: lastExtractionMethod,
          price_confidence: lastConfidence,
          price_requires_review: requiresReview,
        };

        const { error: updateError } = await supabase
          .from("printers")
          .update(updatePayload)
          .eq("id", printer.id);

        if (updateError) {
          console.error(`Failed to update printer ${printer.model_name}: ${updateError.message}`);
        }
      } else {
        // Update metadata even if prices unchanged
        const metaUpdate: Record<string, any> = {
          price_extraction_method: lastExtractionMethod,
          price_confidence: lastConfidence,
          price_requires_review: requiresReview,
        };
        if (JSON.stringify(newVariantIds) !== JSON.stringify(currentVariantIds)) {
          metaUpdate.shopify_variant_ids = newVariantIds;
        }
        await supabase
          .from("printers")
          .update(metaUpdate)
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
