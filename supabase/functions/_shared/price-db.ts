/**
 * SHARED PRICE DATABASE HELPERS
 * All database interaction helpers for price extraction edge functions.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { BrandConfig, StockStatus } from "./price-types.ts";
import { extractDomain } from "./price-utils.ts";

// ============================================================
// Supabase Client
// ============================================================

export function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// ============================================================
// Brand Config Lookup
// ============================================================

export async function findBrandConfigByUrl(url: string): Promise<BrandConfig | null> {
  const domain = extractDomain(url);
  if (!domain) return null;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("automated_brands")
    .select("id, brand_slug, brand_name, base_url, extraction_method, price_extraction_config, extraction_working, default_currency")
    .eq("is_visible", true)
    .order("brand_name");

  if (error || !data) return null;

  return data.find((b: any) => {
    const brandDomain = extractDomain(b.base_url);
    return domain.includes(brandDomain) || brandDomain.includes(domain);
  }) || null;
}

// ============================================================
// Extraction Logging
// ============================================================

export async function logExtractionAttempt(
  brandId: string | null, brandSlug: string | null, productUrl: string,
  method: string, success: boolean, price: number | null, currency: string,
  errorMessage: string | null, rawSample: string | null, responseTimeMs: number,
) {
  try {
    const supabase = getSupabaseClient();
    await supabase.from("price_extraction_logs").insert({
      brand_id: brandId, brand_slug: brandSlug, product_url: productUrl,
      extraction_method: method, success, extracted_price: price, currency,
      error_message: errorMessage, raw_content_sample: rawSample?.substring(0, 500),
      response_time_ms: responseTimeMs,
    });
  } catch (err) {
    console.error("Failed to log extraction attempt:", err);
  }
}

// ============================================================
// Rate Limiting
// ============================================================

export async function canForceRefresh(productUrl: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const { data } = await supabase
    .from("price_extraction_logs")
    .select("id")
    .eq("product_url", productUrl)
    .eq("extraction_method", "manual_refresh")
    .eq("success", true)
    .gte("created_at", oneMinuteAgo)
    .limit(1);
  return !data || data.length === 0;
}

// ============================================================
// Broken URL Tracking
// ============================================================

export async function logBrokenUrl(productUrl: string, errorType: string) {
  try {
    const supabase = getSupabaseClient();
    const storeDomain = extractDomain(productUrl);

    const { data: existing } = await supabase
      .from("broken_product_urls")
      .select("id, detection_count")
      .eq("product_url", productUrl)
      .maybeSingle();

    if (existing) {
      await supabase.from("broken_product_urls").update({
        detection_count: (existing.detection_count || 1) + 1,
        last_detected_at: new Date().toISOString(),
        error_type: errorType,
      }).eq("id", existing.id);
    } else {
      await supabase.from("broken_product_urls").insert({
        product_url: productUrl, store_domain: storeDomain, error_type: errorType,
        detection_count: 1, detected_at: new Date().toISOString(), last_detected_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Failed to log broken URL:", err);
  }
}

// ============================================================
// Regional Price Column Mapping
// ============================================================

const CURRENCY_TO_REGION: Record<string, string> = {
  USD: "US", CAD: "CA", GBP: "UK", EUR: "EU", AUD: "AU", JPY: "JP", CNY: "CN",
};

export function getRegionalPriceColumn(currency: string): string {
  const map: Record<string, string> = {
    USD: "variant_price", CAD: "price_cad", EUR: "price_eur",
    GBP: "price_gbp", AUD: "price_aud", JPY: "price_jpy",
  };
  return map[currency] || "variant_price";
}

// ============================================================
// Stock Status & Price Persistence
// ============================================================

export async function updateFilamentStockStatus(
  productUrl: string, available: boolean, stockStatus: StockStatus,
  price: number | null, currency: string = "USD",
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const selectCols = "id, variant_available, variant_price, price_eur, price_cad, price_gbp, price_aud, price_jpy";
    let filament: any = null;

    // Try exact match on product_url
    const { data: exactMatch } = await supabase
      .from("filaments").select(selectCols).eq("product_url", productUrl).maybeSingle();

    if (exactMatch) {
      filament = exactMatch;
    } else {
      // Try regional URL columns
      for (const col of ["product_url_eu", "product_url_ca", "product_url_uk", "product_url_au", "product_url_jp"]) {
        const { data } = await supabase.from("filaments").select(selectCols).eq(col, productUrl).maybeSingle();
        if (data) { filament = data; break; }
      }
    }

    if (!filament) return;

    const priceColumn = getRegionalPriceColumn(currency);
    const currentPrice = filament[priceColumn] as number | null;
    const stockChanged = filament.variant_available !== available;
    const priceDiffersSignificantly = price !== null && currentPrice !== null && Math.abs(price - currentPrice) > 0.5;

    if (!stockChanged && !priceDiffersSignificantly) return;

    // Discrepancy detection
    const regionCode = CURRENCY_TO_REGION[currency] || "US";
    let shouldPersistPrice = priceDiffersSignificantly && price !== null;

    if (priceDiffersSignificantly && price !== null && currentPrice !== null) {
      const changePercent = ((price - currentPrice) / currentPrice) * 100;
      const absChangePercent = Math.abs(changePercent);

      if (absChangePercent < 5) {
        await supabase.from("price_discrepancies").insert({
          filament_id: filament.id, old_price: currentPrice, new_price: price,
          price_change_percent: Math.round(changePercent * 100) / 100,
          currency, region: regionCode, status: "auto_approved", source_url: productUrl,
          reviewed_at: new Date().toISOString(), notes: "Auto-approved: change < 5%",
        });
      } else {
        await supabase.from("price_discrepancies").insert({
          filament_id: filament.id, old_price: currentPrice, new_price: price,
          price_change_percent: Math.round(changePercent * 100) / 100,
          currency, region: regionCode, status: "manual_review", source_url: productUrl,
          notes: absChangePercent > 20 ? "URGENT: Price change > 20%" : "Price change 5-20%, needs review",
        });
        shouldPersistPrice = false;
      }
    }

    const nowIso = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      variant_available: available, sync_status: "active", last_scraped_at: nowIso,
    };
    if (shouldPersistPrice && price !== null) {
      updateData[priceColumn] = price;
    }

    const { error } = await supabase.from("filaments").update(updateData).eq("id", filament.id);
    if (error) console.error("Failed to update filament stock status:", error);
    else {
      const pricingUpdate: Record<string, unknown> = { in_stock: available, last_verified_at: nowIso };
      if (shouldPersistPrice && price !== null) pricingUpdate.price_cents = Math.round(price * 100);
      await supabase.from("filament_prices").update(pricingUpdate)
        .eq("filament_id", filament.id).eq("currency_code", currency);
    }
  } catch (err) {
    console.error("Error updating filament stock status:", err);
  }
}
