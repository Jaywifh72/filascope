// @ts-nocheck
/**
 * BAMBU LAB PRICE EXTRACTOR
 * Uses Firecrawl with geo-targeting as PRIMARY method to bypass IP-based geo-detection.
 * Falls back to direct fetch, but treats currency mismatch as failure.
 *
 * US/CA/UK/EU/AU use custom Next.js platform. JP uses Shopify (handled separately).
 */

import type { PriceResponse } from './price-types.ts';

const TIMEOUT_MS = 15000;

const REGION_TO_COUNTRY: Record<string, string> = {
  US: "US",
  CA: "CA",
  UK: "GB",
  EU: "DE",
  AU: "AU",
};

const REGION_TO_CURRENCY: Record<string, string> = {
  US: "USD",
  CA: "CAD",
  UK: "GBP",
  EU: "EUR",
  AU: "AUD",
};

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

  if (variant.offers?.availability?.includes("InStock")) score += 20;
  if (name.includes("1kg") || name.includes("1000g") || name.includes("1 kg")) score += 10;
  if (name.includes("250g") || name.includes("0.25kg")) score -= 5;
  if (name.includes("refill") || desc.includes("refill")) score += 15;
  if (name.includes("spool") || desc.includes("spool")) score += 5;
  if (variant.offers?.price > 0) score += 5;

  return score;
}

function extractPriceFromJsonLd(
  blocks: any[],
): { price: number; currency: string; available: boolean } | null {
  for (const block of blocks) {
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

/* ─── Firecrawl geo-targeted extraction ─── */

async function extractViaFirecrawl(
  url: string,
  region: string,
  expectedCurrency: string,
): Promise<{ price: number; currency: string; available: boolean } | null> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) return null;

  const country = REGION_TO_COUNTRY[region] || "US";

  console.log(`[BAMBULAB] Firecrawl attempt: ${url} country=${country}`);

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["rawHtml"],
        waitFor: 3000,
        location: { country, languages: [country === "DE" ? "de" : "en"] },
      }),
    });

    if (!response.ok) {
      console.error(`[BAMBULAB] Firecrawl HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const html = data.data?.rawHtml || data.rawHtml || data.data?.html || data.html || "";

    if (!html || html.length < 500) {
      console.error(`[BAMBULAB] Firecrawl HTML too short (${html.length} chars)`);
      return null;
    }

    const blocks = extractJsonLdBlocks(html);
    if (blocks.length === 0) {
      console.error(`[BAMBULAB] Firecrawl: no JSON-LD found`);
      return null;
    }

    const result = extractPriceFromJsonLd(blocks);
    if (!result) {
      console.error(`[BAMBULAB] Firecrawl: JSON-LD found but no price`);
      return null;
    }

    // Strict currency validation — retry once on mismatch (Firecrawl geo-proxy is probabilistic)
    if (result.currency !== expectedCurrency) {
      console.warn(`[BAMBULAB] Firecrawl currency mismatch (attempt 1): got ${result.currency}, expected ${expectedCurrency}. Retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));

      // Retry: Firecrawl often routes through a different exit node on second attempt
      try {
        const retry = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url, formats: ["rawHtml"], waitFor: 3000, location: { country, languages: [country === "DE" ? "de" : "en"] } }),
        });
        if (retry.ok) {
          const retryData = await retry.json();
          const retryHtml = retryData.data?.rawHtml || retryData.rawHtml || retryData.data?.html || retryData.html || "";
          if (retryHtml.length >= 500) {
            const retryBlocks = extractJsonLdBlocks(retryHtml);
            const retryResult = retryBlocks.length > 0 ? extractPriceFromJsonLd(retryBlocks) : null;
            if (retryResult && retryResult.currency === expectedCurrency) {
              console.log(`[BAMBULAB] Firecrawl retry ✓ ${retryResult.price} ${retryResult.currency}`);
              return retryResult;
            }
            console.error(`[BAMBULAB] Firecrawl retry still mismatched: got ${retryResult?.currency || "null"}, expected ${expectedCurrency}`);
          }
        }
      } catch (retryErr) {
        console.error(`[BAMBULAB] Firecrawl retry error: ${retryErr instanceof Error ? retryErr.message : "Unknown"}`);
      }
      return null;
    }

    console.log(`[BAMBULAB] Firecrawl ✓ ${result.price} ${result.currency} available=${result.available}`);
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[BAMBULAB] Firecrawl error: ${msg}`);
    return null;
  }
}

/* ─── Direct fetch fallback ─── */

async function extractViaDirect(
  url: string,
  region: string,
  expectedCurrency: string,
): Promise<{ result: { price: number; currency: string; available: boolean } | null; contaminated: boolean }> {
  const regionHeaders = REGIONAL_HEADERS[region] || REGIONAL_HEADERS.US;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        ...regionHeaders,
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timer);

    console.log(`[BAMBULAB] Direct fetch: requested=${url} finalUrl=${response.url} status=${response.status}`);

    if (!response.ok) {
      return { result: null, contaminated: false };
    }

    const html = await response.text();
    if (!html || html.length < 1000) {
      return { result: null, contaminated: false };
    }

    const blocks = extractJsonLdBlocks(html);
    if (blocks.length === 0) {
      return { result: null, contaminated: false };
    }

    const result = extractPriceFromJsonLd(blocks);
    if (!result) {
      return { result: null, contaminated: false };
    }

    // Currency mismatch = geo contamination
    if (result.currency !== expectedCurrency) {
      console.error(`[BAMBULAB] Direct fetch GEO CONTAMINATION: got ${result.currency} (${result.price}), expected ${expectedCurrency}`);
      return { result: null, contaminated: true };
    }

    return { result, contaminated: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[BAMBULAB] Direct fetch error: ${msg}`);
    return { result: null, contaminated: false };
  }
}

/* ─── Main entry point ─── */

export async function extractBambuLabPrice(
  productUrl: string,
  preferredCurrency?: string,
  _targetWeightGrams?: number | null,
): Promise<PriceResponse> {
  const inferredRegion = inferRegionFromUrl(productUrl);
  const expectedCurrency = preferredCurrency || REGION_TO_CURRENCY[inferredRegion] || "USD";
  const cleanUrl = buildCleanUrl(productUrl);

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

  // 1. Try Firecrawl with geo-targeting (primary)
  const firecrawlResult = await extractViaFirecrawl(cleanUrl, inferredRegion, expectedCurrency);
  if (firecrawlResult) {
    return {
      success: true,
      price: firecrawlResult.price,
      compareAtPrice: null,
      currency: firecrawlResult.currency,
      available: firecrawlResult.available,
      source: "bambulab-jsonld",
      method: "bambulab_jsonld",
      fetchedAt: new Date().toISOString(),
    };
  }

  // 2. Fallback: direct fetch (with strict currency validation)
  console.log(`[BAMBULAB] Firecrawl failed/unavailable, trying direct fetch fallback`);
  const { result: directResult, contaminated } = await extractViaDirect(cleanUrl, inferredRegion, expectedCurrency);

  if (directResult) {
    console.log(`[BAMBULAB] Direct ✓ ${directResult.price} ${directResult.currency} available=${directResult.available}`);
    return {
      success: true,
      price: directResult.price,
      compareAtPrice: null,
      currency: directResult.currency,
      available: directResult.available,
      source: "bambulab-jsonld",
      method: "bambulab_jsonld",
      fetchedAt: new Date().toISOString(),
    };
  }

  if (contaminated) {
    return fail("geo_redirect_contamination");
  }

  return fail("No valid price extracted");
}
