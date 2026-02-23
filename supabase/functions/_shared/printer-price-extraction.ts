/**
 * Shared Price Extraction Engine for Printers
 * 
 * 3-tier extraction: Shopify JSON → JSON-LD → Meta Tags
 * Fixes 5 critical bugs:
 *  1. Strikethrough price read as current price
 *  2. Combo variant picked instead of base model
 *  3. Region-encoded variants ignored (Sovol pattern)
 *  4. No fallback when Shopify .json blocked
 *  5. ProductGroup JSON-LD not handled
 */

export interface ExtractionResult {
  current_price: number | null;
  compare_at_price: number | null;
  currency: string;
  variant_name: string | null;
  extraction_method: 'shopify_json' | 'json_ld_product' | 'json_ld_product_group' | 'meta_tags' | 'manual';
  confidence: 'high' | 'medium' | 'low';
  raw_variants_found: number;
  is_combo: boolean;
  requires_review: boolean;
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

const COMBO_PATTERN = /combo|bundle|kit|pack|set|\bams\b|2\s*\*|3\s*\*/i;

/**
 * Select the best (base model) variant from a list.
 * Handles region-encoded titles (Sovol: "US / Only SV06") and combo exclusion.
 */
export function selectBestVariant(
  variants: NormalizedVariant[],
  targetRegion?: string
): { variant: NormalizedVariant; is_combo: boolean } | null {
  if (!variants || variants.length === 0) return null;

  let filtered = [...variants];

  // Step 1: Region filter (Sovol pattern: "US / Only SV06")
  if (targetRegion) {
    const regionUpper = targetRegion.toUpperCase();
    const regionFiltered = filtered.filter(v => {
      const parts = v.name.split(/\s*\/\s*/);
      if (parts.length >= 2) {
        return parts[0].trim().toUpperCase() === regionUpper;
      }
      return true; // Keep variants that don't encode region
    });
    if (regionFiltered.length > 0) {
      filtered = regionFiltered;
    }
  }

  // Step 2: Exclude combo/bundle/kit/pack/set/AMS variants
  const nonCombo = filtered.filter(v => !COMBO_PATTERN.test(v.name));

  let is_combo = false;
  let candidates: NormalizedVariant[];

  if (nonCombo.length > 0) {
    candidates = nonCombo;
  } else {
    // All variants are combos — use all, flag it
    candidates = filtered;
    is_combo = true;
  }

  // Step 3: Filter to available variants only
  const available = candidates.filter(v => v.available !== false);
  if (available.length > 0) {
    candidates = available;
  }
  // If none available, use all candidates anyway (prices still useful)

  // Step 4: Pick cheapest
  candidates.sort((a, b) => a.price - b.price);
  return { variant: candidates[0], is_combo };
}

/**
 * Tier 1: Shopify JSON API
 */
export async function extractFromShopifyJson(
  url: string,
  region?: string
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

    const selection = selectBestVariant(normalized, region);
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
  region?: string
): ExtractionResult | null {
  const jsonLdBlocks = html.match(
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!jsonLdBlocks) return null;

  for (const block of jsonLdBlocks) {
    try {
      const content = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      const parsed = JSON.parse(content);
      const result = processJsonLdObject(parsed, region);
      if (result) return result;
    } catch {
      // Invalid JSON, try next block
    }
  }
  return null;
}

function processJsonLdObject(
  obj: any,
  region?: string
): ExtractionResult | null {
  if (!obj) return null;

  // Handle @graph arrays
  if (Array.isArray(obj?.['@graph'])) {
    for (const item of obj['@graph']) {
      const result = processJsonLdObject(item, region);
      if (result) return result;
    }
    return null;
  }

  // Handle arrays at top level
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const result = processJsonLdObject(item, region);
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

    const selection = selectBestVariant(variants, region);
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
 * Orchestrator: tries Tier 1 → Tier 2 → Tier 3 → manual fallback
 * 
 * @param url - Product URL
 * @param region - Target region code (US, CA, EU, UK, AU)
 * @param oldPrice - Previous price for anomaly detection
 */
export async function extractPrice(
  url: string,
  region?: string,
  oldPrice?: number | null
): Promise<ExtractionResult> {
  // Tier 1: Shopify JSON
  const shopifyResult = await extractFromShopifyJson(url, region);
  if (shopifyResult && shopifyResult.current_price && shopifyResult.current_price > 0) {
    return applyAnomalyCheck(shopifyResult, oldPrice);
  }

  // Tier 2: Fetch HTML for JSON-LD and meta tags
  let html: string | null = null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (resp.ok) {
      html = await resp.text();
    } else {
      await resp.text().catch(() => {});
    }
  } catch (e) {
    console.error(`HTML fetch failed for ${url}:`, e);
  }

  if (html) {
    // Tier 2: JSON-LD
    const jsonLdResult = extractFromJsonLd(html, region);
    if (jsonLdResult && jsonLdResult.current_price && jsonLdResult.current_price > 0) {
      return applyAnomalyCheck(jsonLdResult, oldPrice);
    }

    // Tier 3: Meta tags
    const metaResult = extractFromMetaTags(html);
    if (metaResult && metaResult.current_price && metaResult.current_price > 0) {
      return applyAnomalyCheck(metaResult, oldPrice);
    }
  }

  // Tier 4: Manual fallback — do NOT overwrite existing price
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

/**
 * Safety rule: if new price differs from old by >40%, flag for review
 */
function applyAnomalyCheck(
  result: ExtractionResult,
  oldPrice?: number | null
): ExtractionResult {
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
