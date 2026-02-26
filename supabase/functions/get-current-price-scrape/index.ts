// @ts-nocheck
// get-current-price-scrape: Generic Firecrawl-based extraction for unknown platforms
// Fallback for any store not handled by shopify/direct/wc functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/price-types.ts";
import type { PriceResponse, ProductType, BrandConfig } from "../_shared/price-types.ts";
import {
  extractDomain, validateFilamentPrice, validateProductPrice, is404Content,
  detectStockStatus, extractWeightFromContent, extractDiameterFromContent,
  getCurrencySymbol, removeSavingsAmounts, extractSalePriceBeforeSave,
  getFirecrawlLocation, detectCurrencyFromContent,
} from "../_shared/price-utils.ts";
import {
  getSupabaseClient, findBrandConfigByUrl, logExtractionAttempt,
  canForceRefresh, logBrokenUrl, updateFilamentStockStatus,
} from "../_shared/price-db.ts";
import { transformToRegionalUrl } from "../_shared/price-regional.ts";

const PER_PRODUCT_TIMEOUT = 8000;

// ============================================================
// Firecrawl-Based Extraction
// ============================================================

async function fetchPriceWithFirecrawl(
  productUrl: string, preferredCurrency: string,
  brandConfig?: BrandConfig | null, productType: ProductType = "filament",
): Promise<PriceResponse> {
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!firecrawlApiKey) {
    return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: "Firecrawl not configured" };
  }

  const location = getFirecrawlLocation(preferredCurrency);

  try {
    let response: Response | null = null;
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        response = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { Authorization: `Bearer ${firecrawlApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: productUrl, formats: ["markdown"], onlyMainContent: true, waitFor: 3000, location }),
        });
        if (response.ok) break;
        if (attempt < 2 && [408, 500, 502, 503].includes(response.status)) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: `Firecrawl HTTP ${response.status}` };
      } catch (networkErr) {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue; }
        return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: `Network error: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}` };
      }
    }

    if (!response) return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: "No response" };

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || "";
    if (!markdown) return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: "No content" };

    if (is404Content(markdown)) {
      await logBrokenUrl(productUrl, "404_content");
      return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: "PRODUCT_PAGE_NOT_FOUND", is404: true };
    }

    // Extract price
    const priceRange = productType === "printer" ? { min: 99, max: 10000 } : { min: 10, max: 150 };
    
    // Try sale format
    const saleResult = extractSalePriceBeforeSave(markdown);
    if (saleResult.salePrice && saleResult.salePrice >= priceRange.min && saleResult.salePrice <= priceRange.max) {
      return {
        success: true, price: saleResult.salePrice,
        compareAtPrice: saleResult.compareAtPrice && saleResult.compareAtPrice > saleResult.salePrice * 1.05 ? saleResult.compareAtPrice : null,
        currency: preferredCurrency, available: true, source: "firecrawl", fetchedAt: new Date().toISOString(),
        weightGrams: extractWeightFromContent(markdown),
        diameterMm: extractDiameterFromContent(markdown, productUrl),
      };
    }

    // Generic extraction
    const cleaned = removeSavingsAmounts(markdown);
    const symbol = getCurrencySymbol(preferredCurrency);
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`${escaped}\\s*([\\d,]+(?:\\.\\d{2})?)`, "g");
    const prices = [...cleaned.matchAll(pattern)]
      .map(m => parseFloat(m[1].replace(",", "")))
      .filter(p => !isNaN(p) && p >= priceRange.min && p <= priceRange.max)
      .sort((a, b) => a - b);

    if (prices.length > 0) {
      const price = prices[0];
      const compareAt = prices.length > 1 && prices[1] > price * 1.1 ? prices[1] : null;
      const stock = detectStockStatus(markdown);
      return {
        success: true, price, compareAtPrice: compareAt, currency: preferredCurrency,
        available: stock !== "out_of_stock", stockStatus: stock === "unknown" ? "in_stock" : stock,
        source: "firecrawl", fetchedAt: new Date().toISOString(),
        weightGrams: extractWeightFromContent(markdown),
        diameterMm: extractDiameterFromContent(markdown, productUrl),
      };
    }

    // Fallback: try other currencies
    const detected = detectCurrencyFromContent(markdown);
    if (detected && detected !== preferredCurrency) {
      const altSymbol = getCurrencySymbol(detected);
      const altEscaped = altSymbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const altPattern = new RegExp(`${altEscaped}\\s*([\\d,]+(?:\\.\\d{2})?)`, "g");
      const altPrices = [...cleaned.matchAll(altPattern)]
        .map(m => parseFloat(m[1].replace(",", "")))
        .filter(p => !isNaN(p) && p > 5 && p < 200)
        .sort((a, b) => a - b);
      if (altPrices.length > 0) {
        return {
          success: true, price: altPrices[0],
          compareAtPrice: altPrices.length > 1 && altPrices[1] > altPrices[0] * 1.1 ? altPrices[1] : null,
          currency: detected, available: true, source: "firecrawl", fetchedAt: new Date().toISOString(),
          currencyMismatch: true, detectedCurrency: detected, requestedCurrency: preferredCurrency,
        };
      }
    }

    return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: "No valid price found" };
  } catch (error) {
    return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ============================================================
// Main Handler
// ============================================================

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { productUrl, forceRefresh, currency, productType = "filament" } = body;

    if (!productUrl) {
      return new Response(JSON.stringify({ success: false, error: "Missing productUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const startTime = Date.now();
    const preferredCurrency = currency || "USD";
    const { url: urlToFetch, expectedCurrency } = transformToRegionalUrl(productUrl, preferredCurrency);

    console.log(`[SCRAPE PRICE] ${productUrl} (currency: ${expectedCurrency})`);

    if (forceRefresh) {
      const allowed = await canForceRefresh(productUrl);
      if (!allowed) {
        return new Response(JSON.stringify({ success: false, error: "Rate limited" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const brandConfig = await findBrandConfigByUrl(productUrl);
    const result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, productType as ProductType);

    await logExtractionAttempt(
      brandConfig?.id || null, brandConfig?.brand_slug || null, productUrl,
      forceRefresh ? "manual_refresh" : "scrape_auto",
      result.success, result.price, result.currency,
      result.error || null, null, Date.now() - startTime,
    );

    if (result.success && result.price !== null) {
      await updateFilamentStockStatus(productUrl, result.available, result.stockStatus || "unknown", result.price, result.currency);
    }

    if (forceRefresh && result.success) result.refreshedAt = new Date().toISOString();

    return new Response(JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[SCRAPE PRICE] Handler error:", error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : "Unknown error",
      price: null, currency: "USD", available: false, source: "firecrawl", fetchedAt: new Date().toISOString(),
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
