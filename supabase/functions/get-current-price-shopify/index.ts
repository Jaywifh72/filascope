// @ts-nocheck
// get-current-price-shopify: Handles all Shopify-based stores
// Shopify JSON API with smart variant selection + Firecrawl fallback

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/price-types.ts";
import type { PriceResponse, ShopifyVariant, ShopifyProduct, StockStatus, BrandConfig, BrandExtractionConfig, ProductType } from "../_shared/price-types.ts";
import {
  extractDomain, validateFilamentPrice, validateProductPrice, is404Content,
  detectStockStatus, extractWeightFromContent, extractDiameterFromContent,
  getShopifyJsonUrl, extractVariantIdFromUrl, parseWeightFromTitle, parseDiameter,
  parsePackQuantity, getCurrencySymbol, removeSavingsAmounts, extractSalePriceBeforeSave,
  getFirecrawlLocation, parsePriceForDomain, isEuropeanDecimalBrand,
  detectCurrencyFromContent,
} from "../_shared/price-utils.ts";
import {
  getSupabaseClient, findBrandConfigByUrl, logExtractionAttempt,
  canForceRefresh, logBrokenUrl, updateFilamentStockStatus,
} from "../_shared/price-db.ts";
import { transformToRegionalUrl, CURRENCY_TO_REGION } from "../_shared/price-regional.ts";
import {
  getRegionHeaders, getSpoofedHeaders, isGeoRedirectDomain, isGeoRedirect,
  detectRegionFromUrl, type FetchMethod,
} from "../_shared/regional-fetch.ts";

const PER_PRODUCT_TIMEOUT = 8000;

async function fetchWithTimeout(url: string, opts: RequestInit = {}): Promise<Response> {
  return await Promise.race([
    fetch(url, opts),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("TIMEOUT")), PER_PRODUCT_TIMEOUT)),
  ]) as Response;
}

// ============================================================
// Smart Variant Selection
// ============================================================

function selectBestVariantByWeight(
  variants: ShopifyVariant[], productTitle: string, targetWeightGrams: number | null,
): ShopifyVariant {
  if (variants.length === 1) return variants[0];

  // If a target weight is specified, prefer closest match
  if (targetWeightGrams) {
    const withWeight = variants.map(v => {
      const w = parseWeightFromTitle(v.title) || v.grams || null;
      return { variant: v, weight: w, diff: w ? Math.abs(w - targetWeightGrams) : Infinity };
    });
    withWeight.sort((a, b) => a.diff - b.diff);
    if (withWeight[0].diff < Infinity) return withWeight[0].variant;
  }

  // Prefer consumer sizes (750g-1100g) over bulk
  const consumerVariants = variants.filter(v => {
    const w = parseWeightFromTitle(v.title) || v.grams || 1000;
    return w >= 750 && w <= 1100 && v.available;
  });
  if (consumerVariants.length > 0) {
    consumerVariants.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    return consumerVariants[0];
  }

  // Prefer available variants
  const available = variants.filter(v => v.available);
  if (available.length > 0) {
    available.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    return available[0];
  }

  // Fallback: cheapest
  const sorted = [...variants].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  return sorted[0];
}

// ============================================================
// Shopify JSON API Fetch
// ============================================================

function detectCurrencyFromUrl(url: string): string {
  const urlLower = url.toLowerCase();
  if (urlLower.includes(".ca") || urlLower.includes("ca.")) return "CAD";
  if (urlLower.includes(".co.uk") || urlLower.includes("uk.")) return "GBP";
  if (urlLower.includes(".eu") || urlLower.includes(".de") || urlLower.includes(".fr")) return "EUR";
  if (urlLower.includes(".au") || urlLower.includes("au.")) return "AUD";
  if (urlLower.includes(".jp") || urlLower.includes("jp.")) return "JPY";
  return "USD";
}

async function fetchShopifyPrice(
  productUrl: string, preferredCurrency: string, targetWeightGrams: number | null = null,
): Promise<PriceResponse & { fetchMethod?: FetchMethod }> {
  const jsonUrl = getShopifyJsonUrl(productUrl);
  const regionFromCurrency: Record<string, string> = { CAD: "CA", GBP: "UK", EUR: "EU", AUD: "AU", JPY: "JP" };
  const targetRegion = regionFromCurrency[preferredCurrency] || "US";
  const isKnownGeoRedirector = isGeoRedirectDomain(productUrl);

  try {
    const regionHeaders = getRegionHeaders(targetRegion);
    const headers: Record<string, string> = { ...regionHeaders, Accept: "application/json" };
    let response: Response;
    let fetchMethod: FetchMethod = "direct";

    if (isKnownGeoRedirector) {
      response = await fetchWithTimeout(jsonUrl, { headers, redirect: "manual" });
      if (response.status >= 300 && response.status < 400) {
        const redirectUrl = response.headers.get("location") || "";
        const fullRedirect = redirectUrl.startsWith("/") ? `${new URL(jsonUrl).origin}${redirectUrl}` : redirectUrl;
        if (isGeoRedirect(jsonUrl, fullRedirect)) {
          await response.text().catch(() => {});
          const spoofedHeaders = { ...getSpoofedHeaders(targetRegion), Accept: "application/json" };
          response = await fetchWithTimeout(jsonUrl, { headers: spoofedHeaders, redirect: "manual" });
          fetchMethod = "spoofed";
          if (response.status >= 300 && response.status < 400) {
            await response.text().catch(() => {});
            response = await fetchWithTimeout(jsonUrl, { headers, redirect: "follow" });
            fetchMethod = "redirected";
          }
        } else {
          await response.text().catch(() => {});
          response = await fetchWithTimeout(fullRedirect, { headers });
        }
      }
    } else {
      response = await fetchWithTimeout(jsonUrl, { headers });
    }

    if (!response.ok) {
      if (response.status === 404) {
        await logBrokenUrl(productUrl, "404_http");
        return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "shopify", fetchedAt: new Date().toISOString(), error: "HTTP 404", is404: true };
      }
      return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "shopify", fetchedAt: new Date().toISOString(), error: `HTTP ${response.status}` };
    }

    const data: ShopifyProduct = await response.json();
    if (!data.product?.variants?.length) {
      return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "shopify", fetchedAt: new Date().toISOString(), error: "No variants found" };
    }

    const requestedVariantId = extractVariantIdFromUrl(productUrl);
    let variant: ShopifyVariant;
    if (requestedVariantId) {
      const matched = data.product.variants.find(v => String(v.id) === requestedVariantId);
      variant = matched || selectBestVariantByWeight(data.product.variants, data.product.title, targetWeightGrams);
    } else {
      variant = selectBestVariantByWeight(data.product.variants, data.product.title, targetWeightGrams);
    }

    const price = parseFloat(variant.price);
    const compareAtPrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
    const weightFromVariantTitle = parseWeightFromTitle(variant.title);
    const weightFromProductTitle = parseWeightFromTitle(data.product.title);
    const isReasonableGrams = variant.grams && variant.grams >= 250 && variant.grams <= 3000;
    const singleSpoolWeight = weightFromVariantTitle || weightFromProductTitle || (isReasonableGrams ? variant.grams : null) || null;
    const packQuantity = parsePackQuantity(data.product.title, variant.title);
    const weightGrams = singleSpoolWeight !== null ? singleSpoolWeight * packQuantity : null;
    const diameterMm = parseDiameter(productUrl, variant.title) || parseDiameter(productUrl, data.product.title);
    const detectedCurrency = detectCurrencyFromUrl(productUrl);

    return {
      success: true, price, compareAtPrice, weightGrams, diameterMm,
      variantTitle: variant.title, currency: detectedCurrency, available: variant.available,
      source: "shopify", fetchedAt: new Date().toISOString(), fetchMethod,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "shopify", fetchedAt: new Date().toISOString(), error: msg === "TIMEOUT" ? "timeout" : msg };
  }
}

// ============================================================
// Firecrawl Fallback
// ============================================================

async function fetchPriceWithFirecrawl(
  productUrl: string, preferredCurrency: string, brandConfig?: BrandConfig | null,
  productType: ProductType = "filament",
): Promise<PriceResponse> {
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!firecrawlApiKey) {
    return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: "Firecrawl not configured" };
  }

  const location = getFirecrawlLocation(preferredCurrency);
  const isBambuLab = productUrl.includes("store.bambulab.com");
  
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${firecrawlApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: productUrl, formats: ["markdown"], onlyMainContent: true,
        waitFor: 3000, location,
      }),
    });

    if (!response.ok) {
      return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: `Firecrawl error: ${response.status}` };
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || "";
    if (!markdown) {
      return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: "No content returned" };
    }

    if (is404Content(markdown)) {
      await logBrokenUrl(productUrl, "404_content");
      return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: "PRODUCT_PAGE_NOT_FOUND", is404: true };
    }

    // Extract price from markdown using brand config or generic extraction
    const symbol = getCurrencySymbol(preferredCurrency);
    const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
    // Filter to main product section (avoid cross-sell)
    const addToCartIndex = markdown.search(/Add\s*to\s*Cart/i);
    const priceSection = addToCartIndex > -1 ? markdown.slice(0, addToCartIndex + 200) : markdown.slice(0, Math.floor(markdown.length * 0.4));
    
    // Try sale format first
    const saleResult = extractSalePriceBeforeSave(priceSection);
    if (saleResult.salePrice && validateProductPrice(saleResult.salePrice, preferredCurrency, productType)) {
      return {
        success: true, price: saleResult.salePrice,
        compareAtPrice: saleResult.compareAtPrice && saleResult.compareAtPrice > saleResult.salePrice * 1.05 ? saleResult.compareAtPrice : null,
        currency: preferredCurrency, available: true, source: "firecrawl", fetchedAt: new Date().toISOString(),
        weightGrams: extractWeightFromContent(markdown),
        diameterMm: extractDiameterFromContent(markdown, productUrl),
      };
    }

    // Generic price extraction
    const cleanedMarkdown = removeSavingsAmounts(priceSection);
    const pricePattern = new RegExp(`${escapedSymbol}\\s*([\\d,]+(?:\\.\\d{2})?)`, "g");
    const priceRange = productType === "printer"
      ? { min: 99, max: 10000 }
      : { min: 10, max: 150 };
    
    const allPrices = [...cleanedMarkdown.matchAll(pricePattern)]
      .map(m => parseFloat(m[1].replace(",", "")))
      .filter(p => !isNaN(p) && p >= priceRange.min && p <= priceRange.max)
      .sort((a, b) => a - b);

    if (allPrices.length > 0) {
      const price = allPrices[0];
      const compareAt = allPrices.length > 1 && allPrices[1] > price * 1.1 ? allPrices[1] : null;
      const stock = detectStockStatus(markdown);
      return {
        success: true, price, compareAtPrice: compareAt, currency: preferredCurrency,
        available: stock !== "out_of_stock", stockStatus: stock === "unknown" ? "in_stock" : stock,
        source: "firecrawl", fetchedAt: new Date().toISOString(),
        weightGrams: extractWeightFromContent(markdown),
        diameterMm: extractDiameterFromContent(markdown, productUrl),
      };
    }

    // Try detected currency fallback
    const detectedCurrency = detectCurrencyFromContent(markdown);
    if (detectedCurrency && detectedCurrency !== preferredCurrency) {
      const altSymbol = getCurrencySymbol(detectedCurrency);
      const altEscaped = altSymbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const altPattern = new RegExp(`${altEscaped}\\s*([\\d,]+(?:\\.\\d{2})?)`, "g");
      const altPrices = [...cleanedMarkdown.matchAll(altPattern)]
        .map(m => parseFloat(m[1].replace(",", "")))
        .filter(p => !isNaN(p) && p > 5 && p < 200)
        .sort((a, b) => a - b);
      if (altPrices.length > 0) {
        return {
          success: true, price: altPrices[0],
          compareAtPrice: altPrices.length > 1 && altPrices[1] > altPrices[0] * 1.1 ? altPrices[1] : null,
          currency: detectedCurrency, available: true, source: "firecrawl", fetchedAt: new Date().toISOString(),
          currencyMismatch: true, detectedCurrency, requestedCurrency: preferredCurrency,
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
    const { productUrl, forceRefresh, filamentId, targetWeightGrams, currency, productType = "filament" } = body;

    if (!productUrl) {
      return new Response(JSON.stringify({ success: false, error: "Missing productUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const startTime = Date.now();
    const preferredCurrency = currency || "USD";
    const { url: urlToFetch, expectedCurrency } = transformToRegionalUrl(productUrl, preferredCurrency);

    console.log(`[SHOPIFY PRICE] ${productUrl} (currency: ${expectedCurrency})`);

    // Rate limit for manual refreshes
    if (forceRefresh) {
      const allowed = await canForceRefresh(productUrl);
      if (!allowed) {
        return new Response(JSON.stringify({ success: false, error: "Rate limited" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Try Shopify JSON first
    let result = await fetchShopifyPrice(urlToFetch, expectedCurrency, targetWeightGrams);

    // If Shopify JSON fails, try Firecrawl fallback
    if (!result.success && !result.is404) {
      console.log("[SHOPIFY PRICE] JSON API failed, trying Firecrawl fallback");
      const brandConfig = await findBrandConfigByUrl(productUrl);
      result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, productType as ProductType);
    }

    // Log extraction
    const brandConfig = await findBrandConfigByUrl(productUrl);
    await logExtractionAttempt(
      brandConfig?.id || null, brandConfig?.brand_slug || null, productUrl,
      forceRefresh ? "manual_refresh" : "shopify_auto",
      result.success, result.price, result.currency,
      result.error || null, null, Date.now() - startTime,
    );

    // Update DB on success
    if (result.success && result.price !== null) {
      await updateFilamentStockStatus(
        productUrl, result.available, result.stockStatus || "unknown",
        result.price, result.currency,
      );
    }

    if (forceRefresh && result.success) {
      result.refreshedAt = new Date().toISOString();
    }

    return new Response(JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[SHOPIFY PRICE] Handler error:", error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : "Unknown error",
      price: null, currency: "USD", available: false, source: "shopify", fetchedAt: new Date().toISOString(),
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
