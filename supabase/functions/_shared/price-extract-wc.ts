/**
 * SHARED WOOCOMMERCE PRICE EXTRACTOR
 * WC Store API v1 extraction with JSON-LD fallback.
 */

import type { PriceResponse } from "./price-types.ts";
import { withTimeout } from "./price-timeout.ts";
import { isCloudflareBlock } from "./price-utils.ts";

const WC_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

const PRICE_RANGE = { min: 5, max: 200 };
const TIMEOUT_MS = 8000;

const WC_STORE_CURRENCIES: Record<string, string> = {
  "azurefilm.com": "EUR",
  "ic3dprinters.com": "USD",
  "ninjatek.com": "USD",
};

function extractSlug(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    // Support both /product/slug/ and /shop/slug/ patterns
    const productMatch = pathname.match(/\/(?:product|shop)\/([^/?#]+)/);
    if (productMatch) return productMatch[1].trim() || null;
    return null;
  } catch { return null; }
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

// ============================================================
// WC Store API v1
// ============================================================

async function parseProduct(product: any, productUrl: string, domain: string, minorUnit?: number) {
  const prices = product?.prices;
  if (!prices?.price) return null;

  const mu = minorUnit ?? (Number.isFinite(Number(prices.currency_minor_unit)) ? Number(prices.currency_minor_unit) : 2);
  const divisor = Math.pow(10, mu);
  const rawPrice = parseInt(prices.price, 10);
  const rawRegular = parseInt(prices.regular_price || prices.price, 10);
  const rawSale = prices.sale_price ? parseInt(prices.sale_price, 10) : null;
  if (isNaN(rawPrice) || rawPrice <= 0) return null;

  const currency = String(prices.currency_code || "EUR").toUpperCase();
  let price = rawPrice / divisor;
  let compareAt: number | null = null;

  if (rawSale !== null && !isNaN(rawSale) && rawSale > 0 && rawSale < rawRegular) {
    price = rawSale / divisor;
    compareAt = rawRegular / divisor;
  } else if (!isNaN(rawRegular) && rawRegular > rawPrice) {
    compareAt = rawRegular / divisor;
  }
  if (!Number.isFinite(price) || price <= 0) return null;

  let available = product.is_in_stock === true;
  let method = "wc_store_api";

  if (product.type === "variable" && product.id) {
    const variation = await fetchVariations(Number(product.id), domain, mu);
    if (variation && variation.price > 0) {
      price = variation.price;
      compareAt = variation.compareAt;
      available = variation.available;
      method = "wc_store_api_variations";
    }
  }

  const alert = price < PRICE_RANGE.min || price > PRICE_RANGE.max;
  return {
    success: true, price,
    compareAtPrice: compareAt && compareAt > price * 1.05 ? compareAt : null,
    currency, available, stockStatus: available ? "in_stock" : "out_of_stock",
    source: "woocommerce" as const, method, status: alert ? "anomalous" : "ok",
    price_alert: alert, sourceUrl: productUrl,
  };
}

async function fetchVariations(productId: number, domain: string, minorUnit: number) {
  const url = `https://${domain}/wp-json/wc/store/v1/products/${productId}/variations`;
  try {
    const res = await withTimeout(fetch(url, { headers: WC_HEADERS }), TIMEOUT_MS);
    if (!res.ok) return null;
    const variations: any[] = await res.json();
    if (!Array.isArray(variations) || variations.length === 0) return null;
    const divisor = Math.pow(10, minorUnit);
    let cheapest: { price: number; compareAt: number | null; available: boolean } | null = null;
    for (const v of variations) {
      const p = v?.prices;
      if (!p?.price) continue;
      const raw = parseInt(p.price, 10);
      if (isNaN(raw) || raw <= 0) continue;
      const vPrice = raw / divisor;
      const inStock = v.is_in_stock !== false;
      const rawReg = parseInt(p.regular_price || p.price, 10);
      const cmp = !isNaN(rawReg) && rawReg > raw ? rawReg / divisor : null;
      if (inStock && (!cheapest || vPrice < cheapest.price)) {
        cheapest = { price: vPrice, compareAt: cmp, available: true };
      } else if (!cheapest && !inStock) {
        cheapest = { price: vPrice, compareAt: cmp, available: false };
      }
    }
    return cheapest;
  } catch { return null; }
}

// ============================================================
// Main Extraction
// ============================================================

export async function extractWooCommercePrice(
  productUrl: string, domain?: string,
): Promise<PriceResponse> {
  const d = domain || extractDomain(productUrl);
  const slug = extractSlug(productUrl);
  const defaultCurrency = WC_STORE_CURRENCIES[d] || "EUR";

  if (slug) {
    const apiUrl = `https://${d}/wp-json/wc/store/v1/products?slug=${encodeURIComponent(slug)}`;
    try {
      let res = await withTimeout(fetch(apiUrl, { headers: WC_HEADERS }), TIMEOUT_MS);
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 2000));
        res = await withTimeout(fetch(apiUrl, { headers: WC_HEADERS }), TIMEOUT_MS);
        if (res.status === 429) return { success: false, price: null, compareAtPrice: null, currency: defaultCurrency, available: false, source: "woocommerce", fetchedAt: new Date().toISOString(), error: "rate_limited", status: "rate_limited" };
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // If API returned variations instead of the parent, fetch parent's variations
          const firstItem = data[0];
          if (firstItem.type === "variation" && firstItem.parent > 0) {
            console.log(`[WC] Slug returned variation (parent=${firstItem.parent}), fetching parent variations`);
            const variation = await fetchVariations(firstItem.parent, d, 2);
            if (variation && variation.price > 0) {
              const alert = variation.price < PRICE_RANGE.min || variation.price > PRICE_RANGE.max;
              return {
                success: true, price: variation.price,
                compareAtPrice: variation.compareAt && variation.compareAt > variation.price * 1.05 ? variation.compareAt : null,
                currency: String(firstItem.prices?.currency_code || defaultCurrency).toUpperCase(),
                available: variation.available, stockStatus: variation.available ? "in_stock" : "out_of_stock",
                source: "woocommerce" as const, method: "wc_store_api_variations",
                status: alert ? "anomalous" : "ok", price_alert: alert,
                sourceUrl: productUrl, fetchedAt: new Date().toISOString(),
              } as PriceResponse;
            }
          }
          const parent = data.find((p: any) => p.type === "variable" && p.parent === 0);
          const product = parent || data.find((p: any) => p.type === "simple") || data[0];
          const result = await parseProduct(product, productUrl, d);
          if (result) return { ...result, fetchedAt: new Date().toISOString() } as PriceResponse;
        }
      } else {
        const body = await res.text().catch(() => "");
        if (isCloudflareBlock(body)) return { success: false, price: null, compareAtPrice: null, currency: defaultCurrency, available: false, source: "woocommerce", fetchedAt: new Date().toISOString(), error: "cloudflare_blocked", status: "blocked" };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "TIMEOUT") return { success: false, price: null, compareAtPrice: null, currency: defaultCurrency, available: false, source: "woocommerce", fetchedAt: new Date().toISOString(), error: "timeout" };
    }
  }

  // JSON-LD fallback
  try {
    let res = await withTimeout(fetch(productUrl, { headers: { "User-Agent": WC_HEADERS["User-Agent"], "Accept-Language": WC_HEADERS["Accept-Language"] }, redirect: "follow" }), TIMEOUT_MS);
    if (res.status === 429) {
      await new Promise(r => setTimeout(r, 2000));
      res = await withTimeout(fetch(productUrl, { headers: { "User-Agent": WC_HEADERS["User-Agent"] }, redirect: "follow" }), TIMEOUT_MS);
      if (res.status === 429) return { success: false, price: null, compareAtPrice: null, currency: defaultCurrency, available: false, source: "woocommerce", fetchedAt: new Date().toISOString(), error: "rate_limited" };
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (isCloudflareBlock(body)) return { success: false, price: null, compareAtPrice: null, currency: defaultCurrency, available: false, source: "woocommerce", fetchedAt: new Date().toISOString(), error: "cloudflare_blocked" };
      return { success: false, price: null, compareAtPrice: null, currency: defaultCurrency, available: false, source: "woocommerce", fetchedAt: new Date().toISOString(), error: `HTTP ${res.status}`, is404: res.status === 404 };
    }
    const html = await res.text();
    if (isCloudflareBlock(html)) return { success: false, price: null, compareAtPrice: null, currency: defaultCurrency, available: false, source: "woocommerce", fetchedAt: new Date().toISOString(), error: "cloudflare_blocked" };

    const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (ldMatch) {
      const ld = JSON.parse(ldMatch[1]);
      const graph = ld["@graph"] || [ld];
      const product = graph.find((n: any) => n["@type"] === "Product" || n["@type"] === "ProductGroup");
      if (product) {
        let offers = product.hasVariant?.[0]?.offers || product.offers;
        if (Array.isArray(offers)) offers = offers[0];
        if (offers?.price) {
          const price = parseFloat(String(offers.price).replace(",", "."));
          if (!isNaN(price) && price > 0) {
            const currency = String(offers.priceCurrency || defaultCurrency).toUpperCase();
            const available = offers.availability ? String(offers.availability).includes("InStock") : true;
            return {
              success: true, price, compareAtPrice: null, currency, available,
              stockStatus: available ? "in_stock" : "out_of_stock",
              source: "woocommerce", method: "json_ld", fetchedAt: new Date().toISOString(),
              sourceUrl: productUrl,
            };
          }
        }
      }
    }
  } catch (_) { /* fall through */ }

  return { success: false, price: null, compareAtPrice: null, currency: defaultCurrency, available: false, source: "woocommerce", fetchedAt: new Date().toISOString(), error: "No price extracted" };
}
