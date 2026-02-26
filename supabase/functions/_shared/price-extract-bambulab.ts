// @ts-nocheck
/**
 * BAMBU LAB PRICE EXTRACTOR
 * 
 * Extracts prices from Bambu Lab's custom Next.js store using JSON-LD.
 * Bambu Lab migrated from Shopify to a custom platform in early 2025.
 * Only JP remains on Shopify. All other regions (US, CA, UK, EU, AU) 
 * use this extractor.
 * 
 * Data source: Server-side rendered JSON-LD with ProductGroup schema
 * containing all variants with prices, currencies, and availability.
 */
import type { PriceResponse } from './price-types.ts';
import { withTimeout } from './price-db.ts';
import { 
  getRegionHeaders, getSpoofedHeaders, isGeoRedirectDomain
} from './regional-fetch.ts';
import { logBrokenUrl } from './price-db.ts';
import { parseWeightFromTitle, parseDiameter } from './price-utils.ts';

const TIMEOUT_MS = 15000; // 15 second timeout

interface BambuLabVariant {
  name: string;
  sku: string;
  offers: {
    price: number;
    priceCurrency: string;
    availability: string;
  };
}

interface BambuLabProductJsonLd {
  '@type': string;
  name: string;
  productGroupID: string;
  hasVariant: BambuLabVariant[];
  url: string;
}

/**
 * Extract JSON-LD ProductGroup data from HTML
 */
function extractProductJsonLd(html: string): BambuLabProductJsonLd | null {
  // Find all JSON-LD script blocks
  const blocks: string[] = [];
  let searchFrom = 0;
  const marker = 'application/ld+json">';

  while (true) {
    const idx = html.indexOf(marker, searchFrom);
    if (idx === -1) break;
    const contentStart = idx + marker.length;
    const endIdx = html.indexOf('</script>', contentStart);
    if (endIdx === -1) break;
    blocks.push(html.substring(contentStart, endIdx).trim());
    searchFrom = endIdx;
  }

  // Find the ProductGroup block
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block);

      if (parsed['@type'] === 'ProductGroup' && parsed.hasVariant?.length > 0) {
        return parsed as BambuLabProductJsonLd;
      }

      // Some pages might use Product instead of ProductGroup
      if (parsed['@type'] === 'Product' && parsed.offers) {
        return {
          '@type': 'Product',
          name: parsed.name,
          productGroupID: parsed.sku || '',
          url: parsed.url || '',
          hasVariant: [{
            name: parsed.name,
            sku: parsed.sku || '',
            offers: {
              price: typeof parsed.offers.price === 'number' ? parsed.offers.price : parseFloat(parsed.offers.price),
              priceCurrency: parsed.offers.priceCurrency,
              availability: parsed.offers.availability || '',
            }
          }]
        } as BambuLabProductJsonLd;
      }
    } catch (e) {
      // Invalid JSON, skip this block
      continue;
    }
  }

  return null;
}

/**
 * Select the best variant for price display.
 * Prefer: 1kg Refill > 1kg Spool > any available > first variant
 */
function selectBestBambuLabVariant(
  variants: BambuLabVariant[],
  targetWeightGrams: number | null,
  productTitle: string,
): BambuLabVariant {
  if (variants.length === 1) return variants[0];

  const targetWeight = targetWeightGrams || 1000; // Default to 1kg

  // Score variants
  const scored = variants.map(v => {
    let score = 0;
    const name = v.name.toLowerCase();
    const isAvailable = v.offers.availability?.includes('InStock');

    // Weight matching
    if (name.includes('1kg') || name.includes('1000g')) {
      score += 100; // Strong preference for 1kg
    } else if (name.includes('250g') || name.includes('0.25kg')) {
      score += 10; // Low preference for 250g samples
    }

    // Type preference: Refill > Spool
    if (name.includes('refill')) score += 50;
    if (name.includes('filament with spool') || name.includes('with spool')) score += 30;

    // Availability bonus
    if (isAvailable) score += 20;

    // Price validity
    if (v.offers.price > 0) score += 10;

    return { variant: v, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  return scored[0].variant;
}

/**
 * Detect the expected currency for a Bambu Lab regional URL
 */
function detectBambuLabCurrency(url: string): string {
  const l = url.toLowerCase();
  if (l.includes('us.store') || l.includes('/us/')) return 'USD';
  if (l.includes('ca.store') || l.includes('/ca/')) return 'CAD';
  if (l.includes('uk.store') || l.includes('/uk/')) return 'GBP';
  if (l.includes('eu.store') || l.includes('/eu/')) return 'EUR';
  if (l.includes('au.store') || l.includes('/au/')) return 'AUD';
  if (l.includes('jp.store') || l.includes('/jp/')) return 'JPY';
  if (l.includes('cn.store') || l.includes('/cn/')) return 'CNY';
  return 'USD'; // Default
}

/**
 * Main extraction function
 */
export async function extractBambuLabPrice(
  productUrl: string,
  preferredCurrency: string,
  targetWeightGrams: number | null = null,
): Promise<PriceResponse> {
  const expectedCurrency = preferredCurrency || detectBambuLabCurrency(productUrl);

  console.log(`[BAMBULAB] Extracting price from ${productUrl}, expected currency: ${expectedCurrency}`);

  try {
    // Determine target region from currency
    const currencyToRegion: Record<string, string> = {
      USD: 'US', CAD: 'CA', GBP: 'UK', EUR: 'EU', AUD: 'AU', JPY: 'JP', CNY: 'CN'
    };
    const targetRegion = currencyToRegion[expectedCurrency] || 'US';

    // Build headers with geo-spoofing for the target region
    const regionHeaders = getRegionHeaders(targetRegion);
    const spoofedHeaders = getSpoofedHeaders(targetRegion);
    const headers: Record<string, string> = {
      ...regionHeaders,
      ...spoofedHeaders,
      'Accept': 'text/html,application/xhtml+xml',
    };

    // First attempt: fetch with manual redirect to detect geo-redirect
    let response = await withTimeout(
      fetch(productUrl, { headers, redirect: 'manual' }),
      TIMEOUT_MS
    );

    let finalUrl = productUrl;

    // Handle redirect
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('location') || '';
      const fullRedirectUrl = redirectUrl.startsWith('/') 
        ? `${new URL(productUrl).origin}${redirectUrl}` 
        : redirectUrl;

      console.log(`[BAMBULAB] Redirected to ${fullRedirectUrl}`);

      // Follow the redirect with spoofed headers
      if (fullRedirectUrl) {
        response = await withTimeout(
          fetch(fullRedirectUrl, { headers, redirect: 'follow' }),
          TIMEOUT_MS
        );
        finalUrl = fullRedirectUrl;
      }
    }

    // If still not OK, try following redirects
    if (!response.ok) {
      console.log(`[BAMBULAB] First attempt got ${response.status}, retrying with follow`);
      response = await withTimeout(
        fetch(productUrl, { headers, redirect: 'follow' }),
        TIMEOUT_MS
      );
    }

    if (!response.ok) {
      if (response.status === 404) {
        await logBrokenUrl(productUrl, '404_http');
      }
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        currency: expectedCurrency,
        available: false,
        source: 'bambulab-jsonld',
        fetchedAt: new Date().toISOString(),
        is404: response.status === 404,
      };
    }

    const html = await response.text();

    if (!html || html.length < 1000) {
      console.log(`[BAMBULAB] HTML too short (${html.length} chars), likely error page`);
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        currency: expectedCurrency,
        available: false,
        source: 'bambulab-jsonld',
        fetchedAt: new Date().toISOString(),
      };
    }

    // Extract JSON-LD
    const productData = extractProductJsonLd(html);

    if (!productData) {
      console.log(`[BAMBULAB] No ProductGroup JSON-LD found in HTML`);
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        currency: expectedCurrency,
        available: false,
        source: 'bambulab-jsonld',
        fetchedAt: new Date().toISOString(),
      };
    }

    console.log(`[BAMBULAB] Found ${productData.hasVariant.length} variants for "${productData.name}"`);

    // Select best variant
    const variant = selectBestBambuLabVariant(
      productData.hasVariant,
      targetWeightGrams,
      productData.name
    );

    const price = typeof variant.offers.price === 'number' 
      ? variant.offers.price 
      : parseFloat(String(variant.offers.price));
    const currency = variant.offers.priceCurrency || expectedCurrency;
    const isAvailable = variant.offers.availability?.includes('InStock') ?? false;

    // Warn if currency mismatch
    if (currency !== expectedCurrency) {
      console.log(`[BAMBULAB] Currency mismatch: got ${currency}, expected ${expectedCurrency}. URL may have geo-redirected.`);
    }

    // Validate price
    if (isNaN(price) || price <= 0) {
      console.log(`[BAMBULAB] Invalid price: ${price}`);
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        currency: expectedCurrency,
        available: false,
        source: 'bambulab-jsonld',
        fetchedAt: new Date().toISOString(),
      };
    }

    console.log(`[BAMBULAB] Success: ${productData.name} = ${price} ${currency} (${isAvailable ? 'in stock' : 'out of stock'})`);

    return {
      success: true,
      price,
      compareAtPrice: null, // JSON-LD doesn't include compare price
      currency,
      available: isAvailable,
      source: 'bambulab-jsonld',
      fetchedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error(`[BAMBULAB] Error extracting price: ${error.message}`);
    return {
      success: false,
      price: null,
      compareAtPrice: null,
      currency: expectedCurrency,
      available: false,
      source: 'bambulab-jsonld',
      fetchedAt: new Date().toISOString(),
    };
  }
}
