/**
 * SHARED SHOPIFY PRICE EXTRACTOR
 * Shopify JSON API extraction with smart variant selection and geo-redirect handling.
 */

import type { PriceResponse, ShopifyVariant, ShopifyProduct } from "./price-types.ts";
import { withTimeout } from "./price-timeout.ts";
import {
  getShopifyJsonUrl, extractVariantIdFromUrl, parseWeightFromTitle,
  parseDiameter, parsePackQuantity,
} from "./price-utils.ts";
import { logBrokenUrl } from "./price-db.ts";
import {
  getRegionHeaders, getSpoofedHeaders, isGeoRedirectDomain, isGeoRedirect,
} from "./regional-fetch.ts";

const TIMEOUT_MS = 8000;

// ============================================================
// Variant Selection
// ============================================================

export function selectBestVariantByWeight(
  variants: ShopifyVariant[], productTitle: string, targetWeightGrams: number | null,
): ShopifyVariant {
  if (variants.length === 1) return variants[0];

  if (targetWeightGrams) {
    const withWeight = variants.map(v => {
      const w = parseWeightFromTitle(v.title) || v.grams || null;
      return { variant: v, diff: w ? Math.abs(w - targetWeightGrams) : Infinity };
    });
    withWeight.sort((a, b) => a.diff - b.diff);
    if (withWeight[0].diff < Infinity) return withWeight[0].variant;
  }

  // Prefer consumer sizes (750g–1100g)
  const consumer = variants.filter(v => {
    const w = parseWeightFromTitle(v.title) || v.grams || 1000;
    return w >= 750 && w <= 1100 && v.available;
  });
  if (consumer.length > 0) {
    consumer.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    return consumer[0];
  }

  const available = variants.filter(v => v.available);
  if (available.length > 0) {
    available.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    return available[0];
  }

  return [...variants].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
}

// ============================================================
// Currency Detection from URL
// ============================================================

function detectCurrencyFromUrl(url: string): string {
  const l = url.toLowerCase();
  if (l.includes(".ca") || l.includes("ca.")) return "CAD";
  if (l.includes(".co.uk") || l.includes("uk.")) return "GBP";
  if (l.includes(".eu") || l.includes(".de") || l.includes(".fr")) return "EUR";
  if (l.includes(".au") || l.includes("au.")) return "AUD";
  if (l.includes(".jp") || l.includes("jp.")) return "JPY";
  return "USD";
}

// ============================================================
// Main Extraction
// ============================================================

export async function extractShopifyPrice(
  productUrl: string, preferredCurrency: string, targetWeightGrams: number | null = null,
): Promise<PriceResponse> {
  const jsonUrl = getShopifyJsonUrl(productUrl);
  const regionMap: Record<string, string> = { CAD: "CA", GBP: "UK", EUR: "EU", AUD: "AU", JPY: "JP" };
  const targetRegion = regionMap[preferredCurrency] || "US";
  const isKnownGeoRedirector = isGeoRedirectDomain(productUrl);

  try {
    const regionHeaders = getRegionHeaders(targetRegion);
    const headers: Record<string, string> = { ...regionHeaders, Accept: "application/json" };
    let response: Response;

    if (isKnownGeoRedirector) {
      response = await withTimeout(fetch(jsonUrl, { headers, redirect: "manual" }), TIMEOUT_MS);
      if (response.status >= 300 && response.status < 400) {
        const redirectUrl = response.headers.get("location") || "";
        const full = redirectUrl.startsWith("/") ? `${new URL(jsonUrl).origin}${redirectUrl}` : redirectUrl;
        if (isGeoRedirect(jsonUrl, full)) {
          await response.text().catch(() => {});
          const spoofed = { ...getSpoofedHeaders(targetRegion), Accept: "application/json" };
          response = await withTimeout(fetch(jsonUrl, { headers: spoofed, redirect: "manual" }), TIMEOUT_MS);
          if (response.status >= 300 && response.status < 400) {
            await response.text().catch(() => {});
            response = await withTimeout(fetch(jsonUrl, { headers, redirect: "follow" }), TIMEOUT_MS);
          }
        } else {
          await response.text().catch(() => {});
          response = await withTimeout(fetch(full, { headers }), TIMEOUT_MS);
        }
      }
    } else {
      response = await withTimeout(fetch(jsonUrl, { headers }), TIMEOUT_MS);
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
    const variant = requestedVariantId
      ? (data.product.variants.find(v => String(v.id) === requestedVariantId) || selectBestVariantByWeight(data.product.variants, data.product.title, targetWeightGrams))
      : selectBestVariantByWeight(data.product.variants, data.product.title, targetWeightGrams);

    const price = parseFloat(variant.price);
    const compareAtPrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
    const wVariant = parseWeightFromTitle(variant.title);
    const wProduct = parseWeightFromTitle(data.product.title);
    const isReasonable = variant.grams && variant.grams >= 250 && variant.grams <= 3000;
    const singleWeight = wVariant || wProduct || (isReasonable ? variant.grams : null) || null;
    const pack = parsePackQuantity(data.product.title, variant.title);
    const weightGrams = singleWeight !== null ? singleWeight * pack : null;
    const diameterMm = parseDiameter(productUrl, variant.title) || parseDiameter(productUrl, data.product.title);
    const detectedCurrency = detectCurrencyFromUrl(productUrl);

    return {
      success: true, price, compareAtPrice, weightGrams, diameterMm,
      variantTitle: variant.title, currency: detectedCurrency, available: variant.available,
      source: "shopify", fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "shopify", fetchedAt: new Date().toISOString(), error: msg === "TIMEOUT" ? "timeout" : msg };
  }
}
