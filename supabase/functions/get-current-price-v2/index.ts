// @ts-nocheck
// get-current-price-v2: Thin router dispatching to shared extractors.
// v2.4: Added ueeshop platform for esun3dstore.com (UeeShop/Shoplazza)
// No extraction logic in this file.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/price-types.ts";
import type { PriceResponse, ProductType } from "../_shared/price-types.ts";
import { detectPlatform } from "../_shared/price-platforms.ts";
import { transformToRegionalUrl } from "../_shared/price-regional.ts";
import {
  findBrandConfigByUrl, logExtractionAttempt,
  canForceRefresh, updateFilamentStockStatus,
} from "../_shared/price-db.ts";
import { extractShopifyPrice } from "../_shared/price-extract-shopify.ts";
import { fetchOdooPrice } from "../_shared/price-extract-odoo.ts";
import { extractWooCommercePrice } from "../_shared/price-extract-wc.ts";
import { extractFirecrawlPrice } from "../_shared/price-extract-firecrawl.ts";
import {
  fetchCrealityPrice, fetchExtrudrPrice, fetchTreeDPrice,
  fetchPrusaPrice, fetchGeeetechPrice, fetchBigCommercePrice,
  fetchWixPrice,
} from "../_shared/price-extract-direct.ts";
import { extractBambuLabPrice } from "../_shared/price-extract-bambulab.ts";

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
    let platform = detectPlatform(productUrl);
    const preferredCurrency = currency || "USD";
    
    // Override: esun3dstore.com is UeeShop, not Shopify (shared module may be cached)
    const lowerUrl = productUrl.toLowerCase();
    if (lowerUrl.includes("esun3dstore.com") || lowerUrl.includes("esun3dstoreeu.com")) {
      platform = "ueeshop";
    }
    
    const { url: urlToFetch, expectedCurrency } = transformToRegionalUrl(productUrl, preferredCurrency);

    console.log(`[PRICE-V2] platform=${platform} url=${productUrl} currency=${expectedCurrency}`);

    // Rate limit for manual refreshes
    if (forceRefresh) {
      const allowed = await canForceRefresh(productUrl);
      if (!allowed) {
        return new Response(JSON.stringify({ success: false, error: "Rate limited" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    let result: PriceResponse;

    switch (platform) {
      case "woocommerce":
        result = await extractWooCommercePrice(urlToFetch);
        // Firecrawl fallback if WC extraction fails (but not on 404)
        if (!result.success && !result.is404) {
          console.log("[PRICE-V2] WooCommerce failed, trying Firecrawl fallback");
          result = await extractFirecrawlPrice(urlToFetch, expectedCurrency, productType as ProductType);
        }
        break;

      case "creality":
        result = await fetchCrealityPrice(urlToFetch, expectedCurrency, filamentId);
        break;
      case "extrudr":
        result = await fetchExtrudrPrice(urlToFetch, expectedCurrency);
        // Firecrawl fallback if direct fetch fails (but not on 404)
        if (!result.success && !result.is404) {
          console.log("[PRICE-V2] Extrudr direct failed, trying Firecrawl fallback");
          result = await extractFirecrawlPrice(urlToFetch, expectedCurrency, productType as ProductType);
        }
        break;
      case "treed":
        result = await fetchTreeDPrice(urlToFetch);
        break;
      case "prusa":
        result = await fetchPrusaPrice(urlToFetch);
        // Firecrawl fallback only for transient extractor misses (not discontinued/404/geo-gated pages)
        if (!result.success && !result.is404 && !result.notAvailableInRegion) {
          console.log("[PRICE-V2] Prusa direct failed, trying Firecrawl fallback");
          result = await extractFirecrawlPrice(urlToFetch, expectedCurrency || "EUR", productType as ProductType);
        }
        break;
      case "geeetech":
        result = await fetchGeeetechPrice(urlToFetch);
        if (!result.success && !result.is404) {
          console.log("[PRICE-V2] Geeetech direct failed, trying Firecrawl fallback");
          result = await extractFirecrawlPrice(urlToFetch, expectedCurrency, productType as ProductType);
        }
        break;

      case "bigcommerce":
        result = await fetchBigCommercePrice(urlToFetch, expectedCurrency);
        if (!result.success) {
          console.log("[PRICE-V2] BigCommerce direct failed, trying Firecrawl fallback");
          result = await extractFirecrawlPrice(urlToFetch, expectedCurrency, productType as ProductType);
        }
        break;

      case "bambulab":
        result = await extractBambuLabPrice(urlToFetch, expectedCurrency, targetWeightGrams);
        break;

      case "ultimaker":
        // Ultimaker prices are CSV-seeded (manual pricing model).
        // ultimaker.com/materials/* are info pages, not store pages — skip scraping.
        result = {
          success: false, price: null, compareAtPrice: null, currency: "USD",
          available: false, source: "html" as const, fetchedAt: new Date().toISOString(),
          error: "Manual pricing — prices set via CSV seed sync",
        };
        break;

      case "ueeshop":
        // UeeShop/Shoplazza platform (e.g., ysfilament.com) — no API, use Firecrawl directly
        result = await extractFirecrawlPrice(urlToFetch, expectedCurrency, productType as ProductType, 5000);
        break;

      case "odoo":
        result = await fetchOdooPrice(productUrl);
        // Firecrawl fallback if direct fetch fails (including soft 404s from wrong platform detection)
        if (!result.success) {
          console.log("[PRICE-V2] Odoo direct failed, trying Firecrawl fallback");
          const odooCurrency = result.currency || "EUR";
          result = await extractFirecrawlPrice(productUrl, odooCurrency, productType as ProductType, 5000);
        }
        break;

      case "wix":
        result = await fetchWixPrice(urlToFetch);
        // Firecrawl fallback if Wix SSR extraction fails (but not on 404)
        if (!result.success && !result.is404) {
          console.log("[PRICE-V2] Wix direct failed, trying Firecrawl fallback");
          result = await extractFirecrawlPrice(urlToFetch, expectedCurrency, productType as ProductType, 5000);
        }
        // Paramount 3D price validation guard
        // PLA: ~$23.99, ABS: ~$21.99, ASA: ~$24.99, Nylon CF: ~$49.99
        if (result.success && result.price !== null && productUrl.includes("paramount-3d.com")) {
          if (result.price < 10 || result.price > 100) {
            console.warn(`[PRICE-V2] Paramount 3D price anomaly: $${result.price} at ${productUrl}`);
            result = { ...result, status: "anomalous", price_alert: true };
          }
        }
        break;

      case "magento":

      case "shopify":
      default: {
        result = await extractShopifyPrice(urlToFetch, expectedCurrency, targetWeightGrams);
        // Firecrawl fallback if Shopify JSON fails (but not on 404)
        if (!result.success && !result.is404) {
          console.log("[PRICE-V2] Shopify JSON failed, trying Firecrawl fallback");
          result = await extractFirecrawlPrice(urlToFetch, expectedCurrency, productType as ProductType);
        }
        // Mark Bambu Lab JP 404s as not-in-region (graceful skip)
        if (result.is404 && productUrl.includes("jp.store.bambulab.com")) {
          result.notAvailableInRegion = true;
        }
        break;
      }
    }

    // Log extraction
    const brandConfig = await findBrandConfigByUrl(productUrl);
    await logExtractionAttempt(
      brandConfig?.id || null, brandConfig?.brand_slug || null, productUrl,
      forceRefresh ? "manual_refresh" : `v2_${platform}`,
      result.success, result.price, result.currency,
      result.error || null, null, Date.now() - startTime,
    );

    // Persist on success
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
    console.error("[PRICE-V2] Handler error:", error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : "Unknown error",
      price: null, currency: "USD", available: false, source: "unknown", fetchedAt: new Date().toISOString(),
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
