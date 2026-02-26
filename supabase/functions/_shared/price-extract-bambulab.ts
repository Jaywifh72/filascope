// @ts-nocheck
/**
 * BAMBU LAB PRICE EXTRACTOR
 * Extracts prices from Bambu Lab's custom Next.js stores via JSON-LD.
 * US/CA/UK/EU/AU use custom platform. JP uses Shopify (handled separately).
 *
 * Self-contained — no imports from regional-fetch or price-utils.
 */

import type { PriceResponse } from './price-types.ts';

const TIMEOUT_MS = 15000;

const REGIONAL_HEADERS: Record<string, Record<string, string>> = {
  US: { "Accept-Language": "en-US,en;q=0.9", "CF-IPCountry": "US" },
  CA: { "Accept-Language": "en-CA,en;q=0.9", "CF-IPCountry": "CA" },
  UK: { "Accept-Language": "en-GB,en;q=0.9", "CF-IPCountry": "GB" },
  EU: { "Accept-Language": "de-DE,de;q=0.9", "CF-IPCountry": "DE" },
  AU: { "Accept-Language": "en-AU,en;q=0.9", "CF-IPCountry": "AU" },
};

function inferRegionFromUrl(url: string): string {
  if (url.includes("ca.store.bambulab")) return "CA";
  if (url.includes("uk.store.bambulab")) return "UK";
  if (url.includes("eu.store.bambulab")) return "EU";
  if (url.includes("au.store.bambulab")) return "AU";
  return "US";
}

function detectCurrency(url: string): string {
  const l = url.toLowerCase();
  if (l.includes("ca.store")) return "CAD";
  if (l.includes("uk.store")) return "GBP";
  if (l.includes("eu.store")) return "EUR";
  if (l.includes("au.store")) return "AUD";
  if (l.includes("jp.store")) return "JPY";
  return "USD";
}

function buildCleanUrl(url: string): string {
  return url.split("?")[0];
}

function extractJsonLdBlocks(html: string): any[] {
  const results: any[] = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    try {
      results.push(JSON.parse(match[1].trim()));
    } catch {
      // skip malformed blocks
    }
  }
  return results;
}

function scoreVariant(variant: any): number {
  let score = 0;
  const name = (variant.name || "").toLowerCase();
  const desc = (variant.description || "").toLowerCase();

  // Availability is king
  if (variant.offers?.availability?.includes("InStock")) score += 20;

  // Weight preference: 1kg
  if (name.includes("1kg") || name.includes("1000g") || name.includes("1 kg")) score += 10;
  if (name.includes("250g") || name.includes("0.25kg")) score -= 5;

  // Type preference: Refill > Spool
  if (name.includes("refill") || desc.includes("refill")) score += 15;
  if (name.includes("spool") || desc.includes("spool")) score += 5;

  // Valid price
  if (variant.offers?.price > 0) score += 5;

  return score;
}

function extractPriceFromJsonLd(
  blocks: any[],
): { price: number; currency: string; available: boolean } | null {
  for (const block of blocks) {
    // Handle ProductGroup with hasVariant
    if (block["@type"] === "ProductGroup" && Array.isArray(block.hasVariant)) {
      const candidates = block.hasVariant
        .filter((v: any) => v.offers?.price != null)
        .sort((a: any, b: any) => scoreVariant(b) - scoreVariant(a));
      if (candidates.length > 0) {
        const best = candidates[0];
        const price = parseFloat(String(best.offers.price));
        if (!isNaN(price) && price > 0) {
          return {
            price,
            currency: best.offers.priceCurrency || "USD",
            available: best.offers.availability?.includes("InStock") ?? false,
          };
        }
      }
    }

    // Handle single Product with single offer
    if (block["@type"] === "Product" && block.offers && !Array.isArray(block.offers)) {
      const price = parseFloat(String(block.offers.price));
      if (!isNaN(price) && price > 0) {
        return {
          price,
          currency: block.offers.priceCurrency || "USD",
          available: block.offers.availability?.includes("InStock") ?? false,
        };
      }
    }

    // Handle Product with array of offers
    if (block["@type"] === "Product" && Array.isArray(block.offers)) {
      const offer = block.offers.find((o: any) => o.price != null);
      if (offer) {
        const price = parseFloat(String(offer.price));
        if (!isNaN(price) && price > 0) {
          return {
            price,
            currency: offer.priceCurrency || "USD",
            available: offer.availability?.includes("InStock") ?? false,
          };
        }
      }
    }
  }
  return null;
}

/**
 * Main extraction function.
 * Returns PriceResponse for compatibility with get-current-price-v2 router.
 */
export async function extractBambuLabPrice(
  productUrl: string,
  preferredCurrency?: string,
  _targetWeightGrams?: number | null,
): Promise<PriceResponse> {
  const inferredRegion = inferRegionFromUrl(productUrl);
  const expectedCurrency = preferredCurrency || detectCurrency(productUrl);
  const cleanUrl = buildCleanUrl(productUrl);
  const regionHeaders = REGIONAL_HEADERS[inferredRegion] || REGIONAL_HEADERS.US;

  console.log(`[BAMBULAB] Extracting: ${cleanUrl} region=${inferredRegion} currency=${expectedCurrency}`);

  const fail = (error?: string, is404 = false): PriceResponse => ({
    success: false,
    price: null,
    compareAtPrice: null,
    currency: expectedCurrency,
    available: false,
    source: "bambulab-jsonld",
    fetchedAt: new Date().toISOString(),
    error,
    is404,
  });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        ...regionHeaders,
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      console.error(`[BAMBULAB] HTTP ${response.status} for ${cleanUrl}`);
      return fail(`HTTP ${response.status}`, response.status === 404);
    }

    const html = await response.text();

    if (!html || html.length < 1000) {
      console.error(`[BAMBULAB] HTML too short (${html.length} chars)`);
      return fail("HTML too short — likely error page");
    }

    const blocks = extractJsonLdBlocks(html);
    if (blocks.length === 0) {
      console.error(`[BAMBULAB] No JSON-LD found in ${cleanUrl}`);
      return fail("No JSON-LD blocks found");
    }

    const result = extractPriceFromJsonLd(blocks);
    if (!result) {
      console.error(`[BAMBULAB] JSON-LD found but no price extracted from ${cleanUrl}`);
      return fail("JSON-LD present but no valid price");
    }

    if (result.currency !== expectedCurrency) {
      console.log(
        `[BAMBULAB] Currency mismatch: got ${result.currency}, expected ${expectedCurrency}`,
      );
    }

    console.log(
      `[BAMBULAB] ✓ ${result.price} ${result.currency} available=${result.available}`,
    );

    return {
      success: true,
      price: result.price,
      compareAtPrice: null,
      currency: result.currency,
      available: result.available,
      source: "bambulab-jsonld",
      method: "bambulab_jsonld",
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[BAMBULAB] Error: ${msg}`);
    return fail(msg.includes("abort") ? "timeout" : msg);
  }
}
