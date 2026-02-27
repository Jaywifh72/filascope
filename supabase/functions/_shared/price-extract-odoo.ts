/**
 * ODOO E-COMMERCE PRICE EXTRACTOR
 * Dedicated extractor for Odoo-based stores (e.g. FormFutura).
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

/** Detect currency from URL domain */
function detectOdooCurrency(url: string): string {
  const l = url.toLowerCase();
  if (l.includes("fusionfilaments.com")) return "USD";
  return "EUR";
}

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
 * Normalize price strings with explicit European handling.
 * - "16,52" => 16.52
 * - "1.652" => 1652 (thousands separator)
 * - "1.652,50" => 1652.50
 */
function normalizeOdooEuroPrice(raw: string): number {
  let cleaned = raw.replace(/[€$£\s]/g, "").trim();

  // Remove any remaining non-numeric separators/characters
  cleaned = cleaned.replace(/[^\d,\.]/g, "");

  // Decimal comma at end => comma decimal; dots are thousands
  if (/,[\d]{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/\.[\d]{3}$/.test(cleaned) && !cleaned.includes(",")) {
    // Dot with 3 trailing digits => thousands separator
    cleaned = cleaned.replace(/\./g, "");
  } else {
    // Default simple normalization
    cleaned = cleaned.replace(/,/g, ".");
  }

  return parseFloat(cleaned);
}

function detectOdooStock(html: string): { available: boolean; stockStatus: StockStatus } {
  const outOfStock = /(out\s+of\s+stock|uitverkocht|niet\s+beschikbaar)/i.test(html);
  return outOfStock
    ? { available: false, stockStatus: "out_of_stock" }
    : { available: true, stockStatus: "in_stock" };
}

/**
 * Strategy A: JSON-LD offers.price
 */
function extractJsonLdOdooPrice(html: string): number | null {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      const stack: unknown[] = [parsed];

      while (stack.length > 0) {
        const current = stack.pop();
        if (!current) continue;

        if (Array.isArray(current)) {
          for (const item of current) stack.push(item);
          continue;
        }

        if (typeof current !== "object") continue;
        const node = current as Record<string, unknown>;

        const offers = node.offers;
        if (offers) {
          const offerList = Array.isArray(offers) ? offers : [offers];
          for (const offer of offerList) {
            if (!offer || typeof offer !== "object") continue;
            const offerNode = offer as Record<string, unknown>;
            const rawPrice = offerNode.price;
            if (rawPrice == null) continue;

            const price = typeof rawPrice === "number"
              ? rawPrice
              : normalizeOdooEuroPrice(String(rawPrice));

            if (!Number.isNaN(price) && price > 0 && price <= 500) {
              return price;
            }
          }
        }

        for (const value of Object.values(node)) {
          if (value && (typeof value === "object" || Array.isArray(value))) {
            stack.push(value);
          }
        }
      }
    } catch {
      // malformed JSON-LD block: continue
    }
  }

  return null;
}

/**
 * Strategy B: First currency price near product title H1.
 */
function extractCurrencyPriceNearH1(html: string, currencySymbol: string): number | null {
  const h1Match = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
  if (!h1Match || h1Match.index == null) return null;

  const start = Math.max(0, h1Match.index - 400);
  const end = Math.min(html.length, h1Match.index + h1Match[0].length + 2400);
  const windowHtml = html.slice(start, end);

  const escaped = currencySymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nearMatch = windowHtml.match(new RegExp(escaped + '\\s*([\\d]+[,.][\\d]+|[\\d]+)'));
  if (!nearMatch) return null;

  const price = normalizeOdooEuroPrice(nearMatch[1]);
  if (Number.isNaN(price) || price <= 0 || price > 500) return null;
  return price;
}

/**
 * Strategy C: Fallback to first currency token from page text.
 */
function extractAnyCurrencyPrice(html: string, currencySymbol: string): number | null {
  const textOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  const escaped = currencySymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fallbackMatch = textOnly.match(new RegExp(escaped + '\\s*[\\d,\\.]+'));
  if (!fallbackMatch) return null;

  const raw = fallbackMatch[0].replace(new RegExp(escaped + '\\s*'), "");
  const price = normalizeOdooEuroPrice(raw);

  if (Number.isNaN(price) || price <= 0 || price > 500) return null;
  return price;
}

export async function fetchOdooPrice(productUrl: string): Promise<PriceResponse> {
  const currency = detectOdooCurrency(productUrl);
  const currencySymbol = currency === "USD" ? "$" : "€";

  try {
    const resp = await withTimeout(
      fetch(productUrl, { headers: BROWSER_HEADERS, redirect: "follow" }),
      TIMEOUT_MS,
    );

    if (resp.status === 404 || resp.status === 410) {
      return fail(`HTTP ${resp.status}`, { is404: true, currency });
    }

    if (!resp.ok) {
      return fail(`HTTP ${resp.status}`, { currency });
    }

    const html = await resp.text();
    if (is404Content(html)) {
      return fail("soft_404", { is404: true, currency });
    }

    const { available, stockStatus } = detectOdooStock(html);

    const jsonLdPrice = extractJsonLdOdooPrice(html);
    if (jsonLdPrice !== null) {
      return {
        success: true, price: jsonLdPrice, compareAtPrice: null, currency,
        available, stockStatus, source: "html",
        fetchedAt: new Date().toISOString(), sourceUrl: productUrl,
      };
    }

    const nearH1Price = extractCurrencyPriceNearH1(html, currencySymbol);
    if (nearH1Price !== null) {
      return {
        success: true, price: nearH1Price, compareAtPrice: null, currency,
        available, stockStatus, source: "html",
        fetchedAt: new Date().toISOString(), sourceUrl: productUrl,
      };
    }

    const fallbackPrice = extractAnyCurrencyPrice(html, currencySymbol);
    if (fallbackPrice !== null) {
      return {
        success: true, price: fallbackPrice, compareAtPrice: null, currency,
        available, stockStatus, source: "html",
        fetchedAt: new Date().toISOString(), sourceUrl: productUrl,
      };
    }

    if (!available) {
      return fail("OUT_OF_STOCK_NO_PRICE", { available: false, stockStatus: "out_of_stock", currency });
    }

    return fail("No price found on Odoo page", { available, stockStatus, currency });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(msg === "TIMEOUT" ? "timeout" : msg, { currency });
  }
}
