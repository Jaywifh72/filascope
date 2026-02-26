/**
 * SHARED JSON-LD PRICE EXTRACTOR
 * Pure function — parses <script type="application/ld+json"> blocks for Product offers.
 * No fetch, no side effects.
 */

import type { StockStatus } from "./price-types.ts";

export interface JsonLdPriceResult {
  price: number;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
  stockStatus: StockStatus;
}

/**
 * Extract price from JSON-LD structured data in HTML.
 * Handles both single offers and offer arrays.
 */
export function extractJsonLdPrice(
  html: string, expectedCurrency: string, _sourceUrl: string,
): JsonLdPriceResult | null {
  const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];

      // Also check @graph arrays
      const allItems: any[] = [];
      for (const item of items) {
        if (item["@graph"] && Array.isArray(item["@graph"])) {
          allItems.push(...item["@graph"]);
        } else {
          allItems.push(item);
        }
      }

      const product = allItems.find(
        (i: any) => i["@type"] === "Product" || i["@type"] === "ProductGroup",
      );
      if (!product?.offers) continue;

      // Resolve offers — may be on hasVariant[0].offers
      let rawOffers = product.hasVariant?.[0]?.offers || product.offers;
      const offers = Array.isArray(rawOffers) ? rawOffers : [rawOffers];

      const inStock = offers.filter(
        (o: any) => o.price != null && String(o.availability || "").includes("InStock"),
      );
      const valid = inStock.length > 0
        ? inStock
        : offers.filter((o: any) => o.price != null);
      if (valid.length === 0) continue;

      const prices = valid
        .map((o: any) => parseFloat(String(o.price).replace(",", ".")))
        .filter((p: number) => !isNaN(p) && p > 0);
      if (prices.length === 0) continue;

      const lowest = Math.min(...prices);
      const highest = Math.max(...prices);
      const detectedCurrency = valid[0].priceCurrency || expectedCurrency;

      return {
        price: lowest,
        compareAtPrice: highest > lowest * 1.1 ? highest : null,
        currency: String(detectedCurrency).toUpperCase(),
        available: inStock.length > 0,
        stockStatus: inStock.length > 0 ? "in_stock" : "out_of_stock",
      };
    } catch (_) { /* try next block */ }
  }
  return null;
}
