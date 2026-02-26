// @ts-nocheck
// get-current-price-direct: Handles custom storefronts (Creality, Extrudr, TreeD, Prusa, Geeetech)
// Uses direct HTML fetch + JSON-LD extraction — no Firecrawl dependency for primary path.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/price-types.ts";
import type { PriceResponse, StockStatus, BrandConfig } from "../_shared/price-types.ts";
import {
  extractDomain, validateFilamentPrice, is404Content, isCloudflareBlock,
  detectStockStatus, extractWeightFromContent, extractDiameterFromContent,
  removeSavingsAmounts, extractSalePriceBeforeSave, getFirecrawlLocation,
  parsePriceForDomain, isEuropeanDecimalBrand,
} from "../_shared/price-utils.ts";
import {
  getSupabaseClient, findBrandConfigByUrl, logExtractionAttempt,
  canForceRefresh, logBrokenUrl, updateFilamentStockStatus,
} from "../_shared/price-db.ts";
import { normalizeCrealityUrl, transformToRegionalUrl, CURRENCY_TO_REGION } from "../_shared/price-regional.ts";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const PER_PRODUCT_TIMEOUT = 8000;

async function fetchWithTimeout(url: string, opts: RequestInit = {}): Promise<Response> {
  return await Promise.race([
    fetch(url, opts),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("TIMEOUT")), PER_PRODUCT_TIMEOUT)),
  ]) as Response;
}

// ============================================================
// CREALITY: Direct HTML + JSON-LD
// ============================================================

function extractCrealityPriceFromHtml(html: string, expectedCurrency: string, sourceUrl: string): PriceResponse | null {
  const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const product = items.find((item: any) => item["@type"] === "Product");
      if (product?.offers) {
        const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
        const inStockOffers = offers.filter((o: any) => o.price != null && String(o.availability || "").includes("InStock"));
        const validOffers = inStockOffers.length > 0 ? inStockOffers : offers.filter((o: any) => o.price != null);
        if (validOffers.length > 0) {
          const prices = validOffers.map((o: any) => parseFloat(String(o.price))).filter((p: number) => !isNaN(p) && p > 0);
          if (prices.length > 0) {
            const lowestPrice = Math.min(...prices);
            const highestPrice = Math.max(...prices);
            const compareAt = highestPrice > lowestPrice * 1.1 ? highestPrice : null;
            const detectedCurrency = validOffers[0].priceCurrency || expectedCurrency;
            return {
              success: true, price: lowestPrice, compareAtPrice: compareAt,
              currency: detectedCurrency, available: inStockOffers.length > 0,
              stockStatus: (inStockOffers.length > 0 ? "in_stock" : "out_of_stock") as StockStatus,
              source: "html", fetchedAt: new Date().toISOString(),
              detectedCurrency, sourceUrl,
            };
          }
        }
      }
    } catch (_e) { /* ignore parse errors */ }
  }
  return null;
}

function generateCrealitySlugVariants(originalSlug: string): string[] {
  const variants = new Set<string>();
  variants.add(originalSlug);
  const weightStripped = originalSlug
    .replace(/-3kg\b/gi, "").replace(/-1kg\b/gi, "").replace(/-500g\b/gi, "")
    .replace(/-1-75mm\b/gi, "").replace(/-175mm\b/gi, "").replace(/-+$/, "");
  if (weightStripped !== originalSlug) variants.add(weightStripped);
  const filamentPhraseRegex = /-3d-printing-filament(?:-\w+)*/gi;
  const withoutFilamentPhrase = originalSlug.replace(filamentPhraseRegex, "").replace(/-+$/, "");
  if (withoutFilamentPhrase !== originalSlug) variants.add(withoutFilamentPhrase);
  const candidates = Array.from(variants);
  for (const slug of candidates) {
    if (slug.startsWith("creality-")) variants.add(slug.slice("creality-".length));
    else variants.add(`creality-${slug}`);
  }
  return Array.from(variants).filter(s => s !== originalSlug && s.length > 3);
}

async function attemptCrealitySlugDiscovery(
  baseUrl: string, originalSlug: string, expectedCurrency: string,
  filamentId: string | null, regionCode: string,
): Promise<PriceResponse | null> {
  // Check slug cache
  if (filamentId) {
    try {
      const supabase = getSupabaseClient();
      const { data: cached } = await supabase
        .from("product_regional_slugs").select("slug, verified")
        .eq("filament_id", filamentId).eq("region_code", regionCode).maybeSingle();
      if (cached?.verified && cached.slug && cached.slug !== originalSlug) {
        const testUrl = `${baseUrl}/products/${cached.slug}`;
        try {
          const resp = await fetchWithTimeout(testUrl, { headers: BROWSER_HEADERS, redirect: "follow" });
          if (resp.ok) {
            const html = await resp.text();
            if (!html.includes("Page not found") && !html.includes("template-404")) {
              const result = extractCrealityPriceFromHtml(html, expectedCurrency, testUrl);
              if (result) return result;
            }
          }
        } catch (_) { /* continue */ }
      }
    } catch (_) { /* non-fatal */ }
  }

  const variants = generateCrealitySlugVariants(originalSlug);
  for (const slug of variants) {
    const testUrl = `${baseUrl}/products/${slug}`;
    try {
      const resp = await fetchWithTimeout(testUrl, { headers: BROWSER_HEADERS, redirect: "follow" });
      if (!resp.ok) continue;
      const html = await resp.text();
      if (html.includes("Page not found") || html.includes("template-404")) continue;
      const result = extractCrealityPriceFromHtml(html, expectedCurrency, testUrl);
      if (result) {
        // Cache discovered slug
        if (filamentId) {
          try {
            const supabase = getSupabaseClient();
            await supabase.from("product_regional_slugs").upsert({
              filament_id: filamentId, region_code: regionCode, slug,
              verified: true, http_status: 200,
              verified_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            }, { onConflict: "filament_id,region_code" });
          } catch (_) { /* non-fatal */ }
        }
        return result;
      }
    } catch (_) { /* continue */ }
  }
  return null;
}

async function fetchCrealityPriceDirect(
  productUrl: string, expectedCurrency: string, filamentId?: string | null,
): Promise<PriceResponse> {
  const url = normalizeCrealityUrl(productUrl);
  console.log(`[CREALITY DIRECT] Fetching: ${url}`);
  try {
    const resp = await fetchWithTimeout(url, { headers: BROWSER_HEADERS, redirect: "follow" });
    if (resp.status === 404 || !resp.ok) {
      // Try slug discovery
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/products/");
      if (pathParts.length >= 2) {
        const slug = pathParts[1].replace(/\//g, "");
        const basePath = urlObj.pathname.replace(/\/products\/.*$/, "");
        const baseUrl = `${urlObj.origin}${basePath}`;
        const regionCode = CURRENCY_TO_REGION[expectedCurrency] || "US";
        const discovery = await attemptCrealitySlugDiscovery(baseUrl, slug, expectedCurrency, filamentId || null, regionCode);
        if (discovery) return discovery;
      }
      return { success: false, price: null, compareAtPrice: null, currency: expectedCurrency, available: false, source: "html", fetchedAt: new Date().toISOString(), error: `HTTP ${resp.status}`, is404: resp.status === 404 };
    }
    const html = await resp.text();
    if (is404Content(html)) {
      return { success: false, price: null, compareAtPrice: null, currency: expectedCurrency, available: false, source: "html", fetchedAt: new Date().toISOString(), error: "soft_404", is404: true };
    }
    const result = extractCrealityPriceFromHtml(html, expectedCurrency, url);
    if (result) return result;
    return { success: false, price: null, compareAtPrice: null, currency: expectedCurrency, available: false, source: "html", fetchedAt: new Date().toISOString(), error: "No JSON-LD price found" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "TIMEOUT") return { success: false, price: null, compareAtPrice: null, currency: expectedCurrency, available: false, source: "html", fetchedAt: new Date().toISOString(), error: "timeout", status: "rate_limited" };
    return { success: false, price: null, compareAtPrice: null, currency: expectedCurrency, available: false, source: "html", fetchedAt: new Date().toISOString(), error: msg };
  }
}

// ============================================================
// EXTRUDR: JSON-LD, EUR-only
// ============================================================

const EXTRUDR_REGION_CODES = ["de", "at", "gb", "fr", "it", "es", "nl", "pl", "cz", "eu", "ch"];

function normalizeExtrudrUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const hasRegion = EXTRUDR_REGION_CODES.some(r => path.match(new RegExp(`/en/${r}/`, "i")));
    if (!hasRegion && path.startsWith("/en/")) {
      urlObj.pathname = path.replace(/^\/en\//, "/en/de/");
      return urlObj.toString();
    }
    if (!path.startsWith("/en/")) {
      urlObj.pathname = "/en/de" + path;
      return urlObj.toString();
    }
  } catch (_) { /* ignore */ }
  return url;
}

async function fetchExtrudrPriceDirect(productUrl: string): Promise<PriceResponse> {
  const url = normalizeExtrudrUrl(productUrl);
  console.log(`[EXTRUDR DIRECT] Fetching: ${url}`);
  try {
    const resp = await fetchWithTimeout(url, { headers: BROWSER_HEADERS, redirect: "follow" });
    if (!resp.ok) return { success: false, price: null, compareAtPrice: null, currency: "EUR", available: false, source: "html", fetchedAt: new Date().toISOString(), error: `HTTP ${resp.status}` };
    const html = await resp.text();
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        const items = Array.isArray(parsed) ? parsed : [parsed];
        const product = items.find((i: any) => i["@type"] === "Product");
        if (product?.offers) {
          const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
          const validOffer = offers.find((o: any) => o.price != null);
          if (validOffer) {
            const price = parseFloat(String(validOffer.price));
            if (!isNaN(price) && price > 0) {
              const available = String(validOffer.availability || "").includes("InStock");
              return {
                success: true, price, compareAtPrice: null, currency: "EUR",
                available, stockStatus: available ? "in_stock" : "out_of_stock",
                source: "html", fetchedAt: new Date().toISOString(), sourceUrl: url,
              };
            }
          }
        }
      } catch (_) { /* try next */ }
    }
    return { success: false, price: null, compareAtPrice: null, currency: "EUR", available: false, source: "html", fetchedAt: new Date().toISOString(), error: "No JSON-LD price" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, price: null, compareAtPrice: null, currency: "EUR", available: false, source: "html", fetchedAt: new Date().toISOString(), error: msg === "TIMEOUT" ? "timeout" : msg };
  }
}

// ============================================================
// TREED: Backend API (EUR cents/kg)
// ============================================================

async function fetchTreeDPrice(productUrl: string): Promise<PriceResponse> {
  console.log(`[TREED DIRECT] Processing: ${productUrl}`);
  try {
    // Extract SKU/search from URL
    const urlObj = new URL(productUrl);
    let searchTerm = urlObj.pathname.split("/").pop() || "";
    searchTerm = searchTerm.replace(/-/g, " ").replace(/\+/g, "+");
    
    const apiUrl = `https://web-gateway.treedfilaments.com/s/search?q=${encodeURIComponent(searchTerm)}`;
    const resp = await fetchWithTimeout(apiUrl, {
      headers: {
        "User-Agent": BROWSER_HEADERS["User-Agent"],
        "Accept": "application/json",
        "Origin": "https://treedfilaments.com",
        "Referer": "https://treedfilaments.com/",
      },
    });
    if (!resp.ok) return { success: false, price: null, compareAtPrice: null, currency: "EUR", available: false, source: "html", fetchedAt: new Date().toISOString(), error: `API ${resp.status}` };
    
    const data = await resp.json();
    const products = data?.hits || data?.products || [];
    if (products.length === 0) return { success: false, price: null, compareAtPrice: null, currency: "EUR", available: false, source: "html", fetchedAt: new Date().toISOString(), error: "No products found" };
    
    const product = products[0];
    const priceEurCents = product.price || product.salePrice;
    if (!priceEurCents) return { success: false, price: null, compareAtPrice: null, currency: "EUR", available: false, source: "html", fetchedAt: new Date().toISOString(), error: "No price in API" };
    
    const price = priceEurCents / 100;
    const compareAt = product.listPrice ? product.listPrice / 100 : null;
    
    return {
      success: true, price, compareAtPrice: compareAt && compareAt > price * 1.05 ? compareAt : null,
      currency: "EUR", available: product.inStock !== false,
      stockStatus: product.inStock !== false ? "in_stock" : "out_of_stock",
      source: "html", fetchedAt: new Date().toISOString(), sourceUrl: productUrl,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, price: null, compareAtPrice: null, currency: "EUR", available: false, source: "html", fetchedAt: new Date().toISOString(), error: msg === "TIMEOUT" ? "timeout" : msg };
  }
}

// ============================================================
// PRUSA: Direct HTML + JSON-LD / __NEXT_DATA__
// ============================================================

async function fetchPrusaPriceDirect(productUrl: string): Promise<PriceResponse> {
  console.log(`[PRUSA DIRECT] Fetching: ${productUrl}`);
  try {
    const resp = await fetchWithTimeout(productUrl, { headers: BROWSER_HEADERS, redirect: "follow" });
    if (!resp.ok) return { success: false, price: null, compareAtPrice: null, currency: "EUR", available: false, source: "html", fetchedAt: new Date().toISOString(), error: `HTTP ${resp.status}` };
    const html = await resp.text();
    
    // Detect MK404 location gate
    if (/mk404/i.test(html) || /top\s*secret\s*printer/i.test(html)) {
      return { success: false, price: null, compareAtPrice: null, currency: "EUR", available: false, source: "html", fetchedAt: new Date().toISOString(), error: "LOCATION_GATE", notAvailableInRegion: true };
    }
    
    // Try JSON-LD
    const result = extractCrealityPriceFromHtml(html, "EUR", productUrl);
    if (result) return result;
    
    // Try __NEXT_DATA__
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const price = nextData?.props?.pageProps?.product?.price || nextData?.props?.pageProps?.price;
        if (price && typeof price === "number" && price > 0) {
          return {
            success: true, price, compareAtPrice: null, currency: "EUR",
            available: true, source: "html", fetchedAt: new Date().toISOString(), sourceUrl: productUrl,
          };
        }
      } catch (_) { /* ignore */ }
    }
    
    return { success: false, price: null, compareAtPrice: null, currency: "EUR", available: false, source: "html", fetchedAt: new Date().toISOString(), error: "No price found" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, price: null, compareAtPrice: null, currency: "EUR", available: false, source: "html", fetchedAt: new Date().toISOString(), error: msg === "TIMEOUT" ? "timeout" : msg };
  }
}

// ============================================================
// GEEETECH (OpenCart): JSON-LD
// ============================================================

async function fetchGeeetechPrice(productUrl: string): Promise<PriceResponse> {
  console.log(`[GEEETECH] Fetching: ${productUrl}`);
  try {
    const resp = await fetchWithTimeout(productUrl, { headers: BROWSER_HEADERS, redirect: "follow" });
    if (!resp.ok) return { success: false, price: null, compareAtPrice: null, currency: "USD", available: false, source: "html", fetchedAt: new Date().toISOString(), error: `HTTP ${resp.status}` };
    const html = await resp.text();
    const result = extractCrealityPriceFromHtml(html, "USD", productUrl);
    if (result) return result;
    return { success: false, price: null, compareAtPrice: null, currency: "USD", available: false, source: "html", fetchedAt: new Date().toISOString(), error: "No JSON-LD price" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, price: null, compareAtPrice: null, currency: "USD", available: false, source: "html", fetchedAt: new Date().toISOString(), error: msg === "TIMEOUT" ? "timeout" : msg };
  }
}

// ============================================================
// Main Router
// ============================================================

function detectStorefront(url: string): "creality" | "extrudr" | "treed" | "prusa" | "geeetech" | null {
  if (url.includes("store.creality.com") || url.includes("creality.com/ca/") || url.includes("creality.com/uk/") ||
      url.includes("creality.com/eu/") || url.includes("creality.com/au/") || url.includes("creality.com/jp/")) return "creality";
  if (url.includes("extrudr.com")) return "extrudr";
  if (url.includes("treedfilaments.com")) return "treed";
  if (url.includes("prusa3d.com")) return "prusa";
  if (url.includes("geeetech.com")) return "geeetech";
  return null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { productUrl, forceRefresh, filamentId, currency } = body;

    if (!productUrl) {
      return new Response(JSON.stringify({ success: false, error: "Missing productUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const storefront = detectStorefront(productUrl);
    if (!storefront) {
      return new Response(JSON.stringify({ success: false, error: "URL not supported by get-current-price-direct" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const startTime = Date.now();
    console.log(`[DIRECT PRICE] ${storefront}: ${productUrl}`);

    // Rate limit check for manual refreshes
    if (forceRefresh) {
      const allowed = await canForceRefresh(productUrl);
      if (!allowed) {
        return new Response(JSON.stringify({ success: false, error: "Rate limited: 1 refresh per minute per URL" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Regional URL transformation
    const preferredCurrency = currency || "USD";
    const { url: urlToFetch, expectedCurrency } = transformToRegionalUrl(productUrl, preferredCurrency);

    let result: PriceResponse;
    switch (storefront) {
      case "creality":
        result = await fetchCrealityPriceDirect(urlToFetch, expectedCurrency, filamentId);
        break;
      case "extrudr":
        result = await fetchExtrudrPriceDirect(urlToFetch);
        break;
      case "treed":
        result = await fetchTreeDPrice(urlToFetch);
        break;
      case "prusa":
        result = await fetchPrusaPriceDirect(urlToFetch);
        break;
      case "geeetech":
        result = await fetchGeeetechPrice(urlToFetch);
        break;
      default:
        result = { success: false, price: null, compareAtPrice: null, currency: expectedCurrency, available: false, source: "html", fetchedAt: new Date().toISOString(), error: "Unknown storefront" };
    }

    // Log extraction attempt
    const brandConfig = await findBrandConfigByUrl(productUrl);
    await logExtractionAttempt(
      brandConfig?.id || null, brandConfig?.brand_slug || null, productUrl,
      forceRefresh ? "manual_refresh" : `direct_${storefront}`,
      result.success, result.price, result.currency,
      result.error || null, null, Date.now() - startTime,
    );

    // Update stock/price in DB for successful extractions
    if (result.success && result.price !== null) {
      await updateFilamentStockStatus(
        productUrl, result.available, result.stockStatus || "unknown",
        result.price, result.currency,
      );
    }

    // Add refreshedAt for manual refreshes
    if (forceRefresh && result.success) {
      result.refreshedAt = new Date().toISOString();
    }

    return new Response(JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[DIRECT PRICE] Handler error:", error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : "Unknown error",
      price: null, currency: "USD", available: false, source: "html", fetchedAt: new Date().toISOString(),
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
