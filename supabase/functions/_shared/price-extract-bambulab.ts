/**
 * BAMBU LAB JSON-LD PRICE EXTRACTOR
 * Dedicated extractor for Bambu Lab's Next.js stores (US/CA/UK/EU/AU).
 * JP remains on Shopify and is handled by the Shopify extractor.
 *
 * Fetches product HTML with geo-spoofed headers, parses JSON-LD
 * (ProductGroup / Product), and applies Bambu Lab–specific variant
 * selection (prefer Refill 1kg → Spool 1kg → first available).
 */

import type { PriceResponse } from "./price-types.ts";
import { withTimeout } from "./price-timeout.ts";
import { fetchRegionalStore, detectRegionFromUrl } from "./regional-fetch.ts";

const TIMEOUT_MS = 12_000;

// ── Variant scoring ─────────────────────────────────────────

interface BambuVariant {
  name: string;
  price: number;
  currency: string;
  available: boolean;
  compareAtPrice: number | null;
}

function parseVariants(product: any): BambuVariant[] {
  const variants: BambuVariant[] = [];

  const items: any[] = product.hasVariant ?? [];
  if (items.length === 0 && product.offers) {
    // Flat product – treat offers as a single variant
    const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
    for (const o of offers) {
      variants.push({
        name: product.name ?? "",
        price: parseFloat(String(o.price ?? "0").replace(",", ".")),
        currency: String(o.priceCurrency ?? "USD").toUpperCase(),
        available: String(o.availability ?? "").includes("InStock"),
        compareAtPrice: null,
      });
    }
    return variants;
  }

  for (const v of items) {
    const offers = Array.isArray(v.offers) ? v.offers : v.offers ? [v.offers] : [];
    for (const o of offers) {
      variants.push({
        name: v.name ?? "",
        price: parseFloat(String(o.price ?? "0").replace(",", ".")),
        currency: String(o.priceCurrency ?? "USD").toUpperCase(),
        available: String(o.availability ?? "").includes("InStock"),
        compareAtPrice: null,
      });
    }
  }
  return variants;
}

function scoreVariant(v: BambuVariant, targetWeightGrams: number | null): number {
  const lower = v.name.toLowerCase();
  let score = 0;

  // Weight matching (if target provided)
  if (targetWeightGrams) {
    if (targetWeightGrams <= 500 && lower.includes("0.25kg")) score += 50;
    else if (targetWeightGrams <= 750 && lower.includes("0.5kg")) score += 50;
    else if (targetWeightGrams <= 1100 && lower.includes("1kg")) score += 50;
    else if (lower.includes("1kg")) score += 20;
  } else {
    // Default: prefer 1kg
    if (lower.includes("1kg")) score += 30;
  }

  // Prefer refill (cheaper, standard SKU)
  if (lower.includes("refill")) score += 20;
  // Next: spool
  if (lower.includes("spool") || lower.includes("filament with spool")) score += 10;

  // Prefer available
  if (v.available) score += 5;

  return score;
}

function selectBestVariant(variants: BambuVariant[], targetWeightGrams: number | null): BambuVariant {
  if (variants.length <= 1) return variants[0];

  const scored = variants.map(v => ({ v, s: scoreVariant(v, targetWeightGrams) }));
  scored.sort((a, b) => b.s - a.s);
  return scored[0].v;
}

// ── JSON-LD parsing ─────────────────────────────────────────

function extractProductJsonLd(html: string): any | null {
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item["@graph"]) {
          const found = item["@graph"].find(
            (g: any) => g["@type"] === "ProductGroup" || g["@type"] === "Product",
          );
          if (found) return found;
        }
        if (item["@type"] === "ProductGroup" || item["@type"] === "Product") return item;
      }
    } catch { /* skip malformed block */ }
  }
  return null;
}

// ── Main extractor ──────────────────────────────────────────

export async function extractBambuLabPrice(
  productUrl: string,
  preferredCurrency: string,
  targetWeightGrams: number | null = null,
): Promise<PriceResponse> {
  const region = detectRegionFromUrl(productUrl) || "US";

  try {
    const fetchResult = await withTimeout(
      fetchRegionalStore(productUrl, region, { timeoutMs: TIMEOUT_MS }),
      TIMEOUT_MS + 2000,
    );

    if (!fetchResult.success || !fetchResult.response) {
      if (fetchResult.statusCode === 404) {
        return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "bambulab-jsonld", fetchedAt: new Date().toISOString(), is404: true, error: "HTTP 404" };
      }
      return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "bambulab-jsonld", fetchedAt: new Date().toISOString(), error: `Fetch failed (${fetchResult.statusCode})` };
    }

    if (fetchResult.warning) {
      console.warn(`[BAMBULAB] ${fetchResult.warning}`);
    }

    const html = await fetchResult.response.text();
    const product = extractProductJsonLd(html);

    if (!product) {
      return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "bambulab-jsonld", fetchedAt: new Date().toISOString(), error: "No ProductGroup/Product JSON-LD found" };
    }

    const variants = parseVariants(product);
    if (variants.length === 0) {
      return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "bambulab-jsonld", fetchedAt: new Date().toISOString(), error: "No variants in JSON-LD" };
    }

    const best = selectBestVariant(variants, targetWeightGrams);

    // Currency check
    if (best.currency !== preferredCurrency.toUpperCase()) {
      console.warn(`[BAMBULAB] Currency mismatch: JSON-LD=${best.currency}, expected=${preferredCurrency}`);
    }

    return {
      success: true,
      price: best.price,
      compareAtPrice: best.compareAtPrice,
      currency: best.currency,
      available: best.available,
      variantTitle: best.name || null,
      source: "bambulab-jsonld",
      method: "bambulab_jsonld",
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "bambulab-jsonld", fetchedAt: new Date().toISOString(), error: msg === "TIMEOUT" ? "timeout" : msg };
  }
}
