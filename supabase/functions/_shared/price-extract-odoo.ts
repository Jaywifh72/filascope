/**
 * ODOO E-COMMERCE PRICE EXTRACTOR
 * Dedicated extractor for Odoo-based stores (e.g. FormFutura).
 * Uses JSON-LD first, then HTML regex fallback with European decimal handling.
 */

import type { PriceResponse, StockStatus } from "./price-types.ts";
import { withTimeout } from "./price-timeout.ts";
import { is404Content } from "./price-utils.ts";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,nl;q=0.8",
};

const TIMEOUT_MS = 10000;

const fail = (error: string, extra?: Partial<PriceResponse>): PriceResponse => ({
  success: false,
  price: null,
  compareAtPrice: null,
  currency: "EUR",
  available: false,
  source: "html",
  fetchedAt: new Date().toISOString(),
  error,
  ...extra,
});

/**
 * Parse a European-formatted price string to a number.
 * "16,52" → 16.52 | "1.234,56" → 1234.56 | "234" → 234
 */
function parseEuropeanPrice(raw: string): number {
  let cleaned = raw.replace(/[^\d.,]/g, "").trim();
  if (!cleaned) return NaN;

  // "1.234,56" — dot is thousands, comma is decimal
  if (cleaned.includes(".") && cleaned.includes(",") && cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
    return parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  }
  // "16,52" — comma followed by exactly 2 digits → decimal comma
  if (/,\d{2}$/.test(cleaned) && !cleaned.includes(".")) {
    return parseFloat(cleaned.replace(",", "."));
  }
  // "1.652" with 3 digits after dot → thousands separator (unlikely for prices, but guard)
  if (/\.\d{3}$/.test(cleaned) && !cleaned.includes(",")) {
    return parseFloat(cleaned.replace(".", ""));
  }
  // Standard "16.52" or plain integer
  return parseFloat(cleaned.replace(",", ""));
}

/**
 * Detect stock status from Odoo HTML.
 */
function detectOdooStock(html: string): { available: boolean; stockStatus: StockStatus } {
  const lower = html.toLowerCase();
  const outOfStockPatterns = [
    "out of stock",
    "uitverkocht",
    "niet beschikbaar",
    "niet leverbaar",
    "temporarily unavailable",
    "currently unavailable",
    "sold out",
  ];
  for (const pattern of outOfStockPatterns) {
    if (lower.includes(pattern)) {
      return { available: false, stockStatus: "out_of_stock" };
    }
  }
  return { available: true, stockStatus: "in_stock" };
}

/**
 * Try to extract price from JSON-LD structured data.
 */
function extractJsonLdOdoo(html: string): { price: number; currency: string } | null {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item["@type"] === "Product" || item["@type"] === "IndividualProduct") {
          const offers = item.offers || item.Offers;
          if (!offers) continue;
          const offerList = Array.isArray(offers) ? offers : [offers];
          for (const offer of offerList) {
            const rawPrice = offer.price ?? offer.Price;
            if (rawPrice == null) continue;
            const price = typeof rawPrice === "string" ? parseEuropeanPrice(rawPrice) : Number(rawPrice);
            if (!isNaN(price) && price > 0 && price < 500) {
              const currency = offer.priceCurrency || offer.PriceCurrency || "EUR";
              return { price, currency: currency.toUpperCase() };
            }
          }
        }
      }
    } catch {
      // malformed JSON-LD, continue
    }
  }
  return null;
}

/**
 * Extract price from HTML using € symbol patterns.
 */
function extractHtmlPrice(html: string): number | null {
  // Pattern: €\s*price (with optional thousands sep and decimal comma)
  const euroPatterns = [
    /€\s*([\d]{1,3}(?:\.?\d{3})*,\d{2})\b/g,   // €16,52 or €1.234,56
    /€\s*([\d]+(?:\.\d{2})?)\b/g,                 // €16.52 or €16
    /EUR\s*([\d]{1,3}(?:\.?\d{3})*,\d{2})\b/gi,  // EUR 16,52
  ];

  const candidates: number[] = [];

  for (const pattern of euroPatterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(html)) !== null) {
      const price = parseEuropeanPrice(m[1]);
      if (!isNaN(price) && price >= 5 && price < 500) {
        candidates.push(price);
      }
    }
    if (candidates.length > 0) break; // use first matching pattern group
  }

  if (candidates.length === 0) return null;

  // Return the lowest reasonable price (likely the product price, not a "was" price)
  candidates.sort((a, b) => a - b);
  return candidates[0];
}

/**
 * Main Odoo price extraction function.
 */
export async function fetchOdooPrice(productUrl: string): Promise<PriceResponse> {
  try {
    const resp = await withTimeout(
      fetch(productUrl, { headers: BROWSER_HEADERS, redirect: "follow" }),
      TIMEOUT_MS,
    );

    if (resp.status === 404 || resp.status === 410) {
      return fail(`HTTP ${resp.status}`, { is404: true });
    }
    if (!resp.ok) {
      return fail(`HTTP ${resp.status}`);
    }

    const html = await resp.text();

    if (is404Content(html)) {
      return fail("soft_404", { is404: true });
    }

    const { available, stockStatus } = detectOdooStock(html);

    // Strategy 1: JSON-LD
    const jsonLd = extractJsonLdOdoo(html);
    if (jsonLd) {
      console.log(`[ODOO] JSON-LD price: ${jsonLd.price} ${jsonLd.currency} from ${productUrl}`);
      return {
        success: true,
        price: jsonLd.price,
        compareAtPrice: null,
        currency: jsonLd.currency,
        available,
        stockStatus,
        source: "html",
        method: "json_ld" as any,
        fetchedAt: new Date().toISOString(),
        sourceUrl: productUrl,
      };
    }

    // Strategy 2: HTML regex
    const htmlPrice = extractHtmlPrice(html);
    if (htmlPrice) {
      console.log(`[ODOO] HTML regex price: ${htmlPrice} EUR from ${productUrl}`);
      return {
        success: true,
        price: htmlPrice,
        compareAtPrice: null,
        currency: "EUR",
        available,
        stockStatus,
        source: "html",
        fetchedAt: new Date().toISOString(),
        sourceUrl: productUrl,
      };
    }

    // No price found — if page loaded but no price, may be out of stock
    if (!available) {
      return fail("OUT_OF_STOCK_NO_PRICE", { available: false, stockStatus: "out_of_stock" });
    }

    return fail("No price found on Odoo page");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(msg === "TIMEOUT" ? "timeout" : msg);
  }
}
