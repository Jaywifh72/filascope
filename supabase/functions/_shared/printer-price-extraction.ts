/**
 * Shared Price Extraction Engine for Printers
 * 
 * 3-tier extraction: Shopify JSON → JSON-LD → Meta Tags
 * Supports brand-specific config from brand_sync_config table.
 */

export interface ExtractionResult {
  current_price: number | null;
  compare_at_price: number | null;
  currency: string;
  variant_name: string | null;
  extraction_method: 'shopify_json' | 'json_ld_product' | 'json_ld_product_group' | 'meta_tags' | 'manual' | 'geo_blocked';
  confidence: 'high' | 'medium' | 'low';
  raw_variants_found: number;
  is_combo: boolean;
  requires_review: boolean;
}

/** Brand-specific extraction config loaded from brand_sync_config table */
export interface BrandSyncConfig {
  brand_id: string;
  store_platform: string;
  primary_extraction: string;
  fallback_extraction: string | null;
  shopify_json_available: boolean;
  json_ld_type: string;
  variant_region_in_title: boolean;
  variant_region_separator: string;
  variant_exclude_patterns: string[];
  variant_selection_strategy: string;
  price_field: string;
  compare_at_field: string;
  store_url_us: string | null;
  store_url_ca: string | null;
  store_url_uk: string | null;
  store_url_eu: string | null;
  store_url_au: string | null;
  store_url_jp: string | null;
  uses_geo_pricing: boolean;
  sync_notes: string | null;
}

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
}

interface NormalizedVariant {
  name: string;
  price: number;
  compare_at_price: number | null;
  available: boolean;
  id?: number | string;
}

const DEFAULT_COMBO_PATTERNS = ['combo', 'bundle', 'kit', 'pack', 'set', 'ams', '2*', '3*'];

function buildComboRegex(patterns: string[]): RegExp {
  const escaped = patterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // Word-boundary wrap short terms like 'ams'
  const parts = escaped.map(p => p.length <= 4 ? `\\b${p}\\b` : p);
  return new RegExp(parts.join('|'), 'i');
}

/**
 * Select the best (base model) variant from a list.
 * Handles region-encoded titles (Sovol: "US / Only SV06") and combo exclusion.
 */
export function selectBestVariant(
  variants: NormalizedVariant[],
  targetRegion?: string,
  config?: BrandSyncConfig
): { variant: NormalizedVariant; is_combo: boolean } | null {
  if (!variants || variants.length === 0) return null;

  let filtered = [...variants];
  const useRegionFilter = config?.variant_region_in_title ?? true;
  const regionSep = config?.variant_region_separator ?? ' / ';

  // Step 1: Region filter (Sovol pattern: "US / Only SV06")
  if (targetRegion && useRegionFilter) {
    const regionUpper = targetRegion.toUpperCase();
    const sepRegex = new RegExp(`\\s*${regionSep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim()}\\s*`);
    const regionFiltered = filtered.filter(v => {
      const parts = v.name.split(sepRegex);
      if (parts.length >= 2) {
        return parts[0].trim().toUpperCase() === regionUpper;
      }
      return true; // Keep variants that don't encode region
    });
    if (regionFiltered.length > 0) {
      filtered = regionFiltered;
    }
  }

  // Step 2: Exclude combo/bundle patterns
  const excludePatterns = config?.variant_exclude_patterns ?? DEFAULT_COMBO_PATTERNS;
  const comboRegex = buildComboRegex(excludePatterns);
  const nonCombo = filtered.filter(v => !comboRegex.test(v.name));

  let is_combo = false;
  let candidates: NormalizedVariant[];

  if (nonCombo.length > 0) {
    candidates = nonCombo;
  } else {
    candidates = filtered;
    is_combo = true;
  }

  // Step 3: Filter to available variants only
  const available = candidates.filter(v => v.available !== false);
  if (available.length > 0) {
    candidates = available;
  }

  // Step 4: Pick based on strategy
  const strategy = config?.variant_selection_strategy ?? 'cheapest_standalone';
  if (strategy === 'first') {
    return { variant: candidates[0], is_combo };
  }
  // Default: cheapest
  candidates.sort((a, b) => a.price - b.price);
  return { variant: candidates[0], is_combo };
}

/**
 * Tier 1: Shopify JSON API
 */
export async function extractFromShopifyJson(
  url: string,
  region?: string,
  config?: BrandSyncConfig
): Promise<ExtractionResult | null> {
  try {
    const jsonUrl = url.replace(/\/?(\?.*)?$/, '.json');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FilaScope/1.0)',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      await resp.text().catch(() => {}); // drain body
      return null;
    }

    const data = await resp.json();
    const shopifyVariants: ShopifyVariant[] = data?.product?.variants || [];
    if (shopifyVariants.length === 0) return null;

    const normalized: NormalizedVariant[] = shopifyVariants.map(v => ({
      name: v.title || '',
      price: parseFloat(v.price),
      compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
      available: v.available,
      id: v.id,
    })).filter(v => !isNaN(v.price) && v.price > 0);

    if (normalized.length === 0) return null;

    const selection = selectBestVariant(normalized, region, config);
    if (!selection) return null;

    const { variant, is_combo } = selection;

    return {
      current_price: variant.price,
      compare_at_price: variant.compare_at_price,
      currency: '', // caller determines currency from region
      variant_name: variant.name,
      extraction_method: 'shopify_json',
      confidence: 'high',
      raw_variants_found: shopifyVariants.length,
      is_combo,
      requires_review: false,
    };
  } catch (e) {
    console.error(`Shopify JSON extraction failed for ${url}:`, e);
    return null;
  }
}

/**
 * Tier 2: JSON-LD extraction from HTML
 * Handles both @type: "Product" and @type: "ProductGroup"
 * Bug 1 fix: uses offers.price as current, priceSpecification as strikethrough/MSRP
 * Bug 5 fix: iterates hasVariant[] for ProductGroup
 */
export function extractFromJsonLd(
  html: string,
  region?: string,
  config?: BrandSyncConfig
): ExtractionResult | null {
  const jsonLdBlocks = html.match(
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!jsonLdBlocks) return null;

  for (const block of jsonLdBlocks) {
    try {
      const content = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      const parsed = JSON.parse(content);
      const result = processJsonLdObject(parsed, region, config);
      if (result) return result;
    } catch {
      // Invalid JSON, try next block
    }
  }
  return null;
}

function processJsonLdObject(
  obj: any,
  region?: string,
  config?: BrandSyncConfig
): ExtractionResult | null {
  if (!obj) return null;

  // Handle @graph arrays
  if (Array.isArray(obj?.['@graph'])) {
    for (const item of obj['@graph']) {
      const result = processJsonLdObject(item, region, config);
      if (result) return result;
    }
    return null;
  }

  // Handle arrays at top level
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const result = processJsonLdObject(item, region, config);
      if (result) return result;
    }
    return null;
  }

  const type = obj['@type'];

  // ProductGroup → iterate hasVariant[]
  if (type === 'ProductGroup' && Array.isArray(obj.hasVariant)) {
    const variants: NormalizedVariant[] = [];
    for (const v of obj.hasVariant) {
      const price = extractPriceFromOffers(v.offers);
      if (price !== null && price > 0) {
        variants.push({
          name: v.name || v.title || '',
          price,
          compare_at_price: extractStrikethroughPrice(v.offers),
          available: extractAvailability(v.offers),
          id: v.sku || v['@id'],
        });
      }
    }
    if (variants.length === 0) return null;

    const selection = selectBestVariant(variants, region, config);
    if (!selection) return null;

    return {
      current_price: selection.variant.price,
      compare_at_price: selection.variant.compare_at_price,
      currency: extractCurrency(obj.hasVariant[0]?.offers) || '',
      variant_name: selection.variant.name,
      extraction_method: 'json_ld_product_group',
      confidence: 'high',
      raw_variants_found: variants.length,
      is_combo: selection.is_combo,
      requires_review: false,
    };
  }

  // Product → direct offers
  if (type === 'Product') {
    const price = extractPriceFromOffers(obj.offers);
    if (price === null || price <= 0) return null;

    return {
      current_price: price,
      compare_at_price: extractStrikethroughPrice(obj.offers),
      currency: extractCurrency(obj.offers) || '',
      variant_name: obj.name || null,
      extraction_method: 'json_ld_product',
      confidence: 'high',
      raw_variants_found: 1,
      is_combo: false,
      requires_review: false,
    };
  }

  return null;
}

/**
 * Bug 1 fix: ALWAYS use offers.price as the current price.
 * offers.priceSpecification with StrikethroughPrice is the compare_at/MSRP.
 */
function extractPriceFromOffers(offers: any): number | null {
  if (!offers) return null;

  // offers can be a single object or array
  const offerObj = Array.isArray(offers) ? offers[0] : offers;
  if (!offerObj) return null;

  // Direct price field = current sale price
  const price = parseFloat(offerObj.price);
  if (!isNaN(price) && price > 0) return price;

  // Fallback: lowPrice for AggregateOffer
  const lowPrice = parseFloat(offerObj.lowPrice);
  if (!isNaN(lowPrice) && lowPrice > 0) return lowPrice;

  return null;
}

function extractStrikethroughPrice(offers: any): number | null {
  if (!offers) return null;
  const offerObj = Array.isArray(offers) ? offers[0] : offers;
  if (!offerObj) return null;

  // Look for priceSpecification with StrikethroughPrice
  const specs = offerObj.priceSpecification;
  if (!specs) return null;

  const specArr = Array.isArray(specs) ? specs : [specs];
  for (const spec of specArr) {
    const priceType = spec.priceType || '';
    if (priceType.includes('StrikethroughPrice') || priceType.includes('strikethrough')) {
      const p = parseFloat(spec.price);
      if (!isNaN(p) && p > 0) return p;
    }
  }

  return null;
}

function extractAvailability(offers: any): boolean {
  if (!offers) return true;
  const offerObj = Array.isArray(offers) ? offers[0] : offers;
  if (!offerObj) return true;

  const availability = offerObj.availability || '';
  if (typeof availability === 'string') {
    return !availability.includes('OutOfStock') && !availability.includes('Discontinued');
  }
  return true;
}

function extractCurrency(offers: any): string | null {
  if (!offers) return null;
  const offerObj = Array.isArray(offers) ? offers[0] : offers;
  return offerObj?.priceCurrency || null;
}

/**
 * Tier 3: Meta tag extraction (og:price:amount, product:price:amount)
 */
export function extractFromMetaTags(html: string): ExtractionResult | null {
  // og:price:amount or product:price:amount
  const pricePatterns = [
    /<meta[^>]*(?:property|name)\s*=\s*["'](?:og:price:amount|product:price:amount)["'][^>]*content\s*=\s*["']([^"']+)["']/i,
    /<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*(?:property|name)\s*=\s*["'](?:og:price:amount|product:price:amount)["']/i,
  ];

  let price: number | null = null;
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const p = parseFloat(match[1]);
      if (!isNaN(p) && p > 0) {
        price = p;
        break;
      }
    }
  }

  // Try itemprop="price"
  if (price === null) {
    const itemPropMatch = html.match(
      /<[^>]*itemprop\s*=\s*["']price["'][^>]*content\s*=\s*["']([^"']+)["']/i
    );
    if (itemPropMatch?.[1]) {
      const p = parseFloat(itemPropMatch[1]);
      if (!isNaN(p) && p > 0) price = p;
    }
  }

  if (price === null) return null;

  // Try to get currency
  let currency = '';
  const currencyPatterns = [
    /<meta[^>]*(?:property|name)\s*=\s*["'](?:og:price:currency|product:price:currency)["'][^>]*content\s*=\s*["']([^"']+)["']/i,
    /<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*(?:property|name)\s*=\s*["'](?:og:price:currency|product:price:currency)["']/i,
  ];
  for (const pattern of currencyPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      currency = match[1];
      break;
    }
  }

  return {
    current_price: price,
    compare_at_price: null,
    currency,
    variant_name: null,
    extraction_method: 'meta_tags',
    confidence: 'medium',
    raw_variants_found: 0,
    is_combo: false,
    requires_review: false,
  };
}

/**
 * Orchestrator: uses brand config to determine extraction order.
 * If no config provided, defaults to: Shopify JSON → JSON-LD → Meta Tags → manual.
 * If config.primary_extraction is 'manual_only', skips all auto-extraction.
 */
export async function extractPrice(
  url: string,
  region?: string,
  oldPrice?: number | null,
  config?: BrandSyncConfig
): Promise<ExtractionResult> {
  const primary = config?.primary_extraction ?? 'shopify_json';
  const fallback = config?.fallback_extraction ?? 'meta_tags';

  // If manual_only, skip all auto-extraction
  if (primary === 'manual_only') {
    return manualFallback();
  }

  // Build ordered extraction tiers based on config
  const tiers: string[] = [primary];
  if (fallback && fallback !== primary) tiers.push(fallback);
  // Always add remaining tiers as final fallbacks
  for (const t of ['shopify_json', 'json_ld', 'meta_tags']) {
    if (!tiers.includes(t)) tiers.push(t);
  }

  // Skip shopify_json if config says it's not available
  const skipShopify = config?.shopify_json_available === false;

  let html: string | null = null;

  for (const tier of tiers) {
    if (tier === 'shopify_json' && !skipShopify) {
      const result = await extractFromShopifyJson(url, region, config);
      if (result?.current_price && result.current_price > 0) {
        return applyAnomalyCheck(result, oldPrice);
      }
    }

    if (tier === 'json_ld' || tier === 'meta_tags') {
      // Fetch HTML once, reuse for both JSON-LD and meta tags
      if (html === null) {
        html = await fetchHtml(url, region);
        // If fetchHtml returned null and this is a known geo-redirect domain, return geo_blocked
        if (html === null) {
          const domain = new URL(url).hostname;
          if (REGION_SPOOF_HEADERS[domain]) {
            return geoBlockedFallback();
          }
        }
      }
      if (html) {
        if (tier === 'json_ld') {
          const result = extractFromJsonLd(html, region, config);
          if (result?.current_price && result.current_price > 0) {
            return applyAnomalyCheck(result, oldPrice);
          }
        }
        if (tier === 'meta_tags') {
          const result = extractFromMetaTags(html);
          if (result?.current_price && result.current_price > 0) {
            return applyAnomalyCheck(result, oldPrice);
          }
        }
      }
    }
  }

  return manualFallback();
}

// Region-spoofing headers to bypass geo-redirects
const REGION_SPOOF_HEADERS: Record<string, Record<string, string>> = {
  'us.store.bambulab.com': { 'Accept-Language': 'en-US,en;q=0.9', 'CF-IPCountry': 'US', 'X-Forwarded-For': '8.8.8.8' },
  'ca.store.bambulab.com': { 'Accept-Language': 'en-CA,en;q=0.9', 'CF-IPCountry': 'CA', 'X-Forwarded-For': '99.224.0.1' },
  'uk.store.bambulab.com': { 'Accept-Language': 'en-GB,en;q=0.9', 'CF-IPCountry': 'GB', 'X-Forwarded-For': '81.2.69.142' },
  'eu.store.bambulab.com': { 'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8', 'CF-IPCountry': 'DE', 'X-Forwarded-For': '85.214.132.117' },
  'au.store.bambulab.com': { 'Accept-Language': 'en-AU,en;q=0.9', 'CF-IPCountry': 'AU', 'X-Forwarded-For': '1.128.0.1' },
  'jp.store.bambulab.com': { 'Accept-Language': 'ja-JP,ja;q=0.9', 'CF-IPCountry': 'JP', 'X-Forwarded-For': '126.0.0.1' },
};

// Per-currency price validation ranges for printers
const CURRENCY_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  USD: { min: 50, max: 15000 },
  CAD: { min: 60, max: 20000 },
  GBP: { min: 40, max: 12000 },
  EUR: { min: 45, max: 14000 },
  AUD: { min: 70, max: 22000 },
  JPY: { min: 5000, max: 2000000 },
};

/**
 * Validate that a printer price is within a sane range for its currency.
 * Rejects obviously wrong values (e.g., ¥2,210 for a printer).
 */
export function validatePrinterPrice(price: number, currency: string): boolean {
  const range = CURRENCY_PRICE_RANGES[currency];
  if (!range) return true; // Unknown currency, allow
  return price >= range.min && price <= range.max;
}

// Map Bambu Lab store subdomains to region codes
const DOMAIN_REGION_MAP: Record<string, string> = {
  'us.store.bambulab.com': 'US',
  'ca.store.bambulab.com': 'CA',
  'uk.store.bambulab.com': 'UK',
  'eu.store.bambulab.com': 'EU',
  'au.store.bambulab.com': 'AU',
  'jp.store.bambulab.com': 'JP',
};

async function fetchHtml(url: string, targetRegion?: string): Promise<string | null> {
  try {
    const requestDomain = new URL(url).hostname;
    const spoofHeaders = REGION_SPOOF_HEADERS[requestDomain] || {};

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    // First attempt: manual redirect to detect geo-redirects
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        ...spoofHeaders,
      },
      signal: controller.signal,
      redirect: 'manual',
    });
    clearTimeout(timeoutId);

    // Check for geo-redirect (3xx with different domain)
    if (resp.status >= 300 && resp.status < 400) {
      const location = resp.headers.get('location');
      if (location) {
        try {
          const redirectDomain = new URL(location, url).hostname;
          if (redirectDomain !== requestDomain) {
            // Check if the redirect destination matches our target region
            const redirectRegion = DOMAIN_REGION_MAP[redirectDomain];
            if (targetRegion && redirectRegion && redirectRegion === targetRegion) {
              // Redirect goes to the correct region — follow it
              console.log(`Geo-redirect ${requestDomain} → ${redirectDomain} matches target region ${targetRegion}, following.`);
              await resp.text().catch(() => {});
              const controller3 = new AbortController();
              const timeoutId3 = setTimeout(() => controller3.abort(), 10000);
              const resp3 = await fetch(location, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml',
                },
                signal: controller3.signal,
              });
              clearTimeout(timeoutId3);
              if (resp3.ok) return await resp3.text();
              await resp3.text().catch(() => {});
              return null;
            }
            // Redirect goes to wrong region — reject gracefully
            console.log(`Geo-redirect ${requestDomain} → ${redirectDomain} (target: ${targetRegion || 'none'}). Skipping — server location blocked.`);
            await resp.text().catch(() => {});
            return null;
          }
          // Same-domain redirect, follow it
          await resp.text().catch(() => {});
          const controller2 = new AbortController();
          const timeoutId2 = setTimeout(() => controller2.abort(), 10000);
          const resp2 = await fetch(location, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml',
              ...spoofHeaders,
            },
            signal: controller2.signal,
          });
          clearTimeout(timeoutId2);
          if (resp2.ok) return await resp2.text();
          await resp2.text().catch(() => {});
        } catch {
          await resp.text().catch(() => {});
        }
      }
      return null;
    }

    if (resp.ok) return await resp.text();
    await resp.text().catch(() => {});
  } catch (e) {
    console.error(`HTML fetch failed for ${url}:`, e);
  }
  return null;
}

function manualFallback(): ExtractionResult {
  return {
    current_price: null,
    compare_at_price: null,
    currency: '',
    variant_name: null,
    extraction_method: 'manual',
    confidence: 'low',
    raw_variants_found: 0,
    is_combo: false,
    requires_review: true,
  };
}

function geoBlockedFallback(): ExtractionResult {
  return {
    current_price: null,
    compare_at_price: null,
    currency: '',
    variant_name: null,
    extraction_method: 'geo_blocked',
    confidence: 'low',
    raw_variants_found: 0,
    is_combo: false,
    requires_review: false,
  };
}

/**
 * Safety rule: if new price differs from old by >40%, flag for review.
 * Also validates per-currency price ranges to catch geo-redirect corruption.
 */
function applyAnomalyCheck(
  result: ExtractionResult,
  oldPrice?: number | null
): ExtractionResult {
  // Per-currency sanity check
  if (result.current_price && result.current_price > 0 && result.currency) {
    if (!validatePrinterPrice(result.current_price, result.currency)) {
      console.error(`Price ${result.current_price} ${result.currency} outside valid range — flagging for review`);
      return {
        ...result,
        confidence: 'low',
        requires_review: true,
      };
    }
  }

  // Historical anomaly check
  if (oldPrice && oldPrice > 0 && result.current_price && result.current_price > 0) {
    const changePercent = Math.abs((result.current_price - oldPrice) / oldPrice) * 100;
    if (changePercent > 40) {
      return {
        ...result,
        confidence: 'low',
        requires_review: true,
      };
    }
  }
  return result;
}
