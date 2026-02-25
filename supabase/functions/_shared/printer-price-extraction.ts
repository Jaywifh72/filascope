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
  extraction_method: 'shopify_json' | 'json_ld_product' | 'json_ld_product_group' | 'meta_tags' | 'manual' | 'geo_blocked' | 'not_in_region' | 'firecrawl' | 'firecrawl_converted';
  confidence: 'high' | 'medium' | 'low';
  raw_variants_found: number;
  is_combo: boolean;
  requires_review: boolean;
  /** The slug that actually worked (may differ from URL slug if discovery was used) */
  discovered_slug?: string;
  /** Price anomaly detection results (populated by applyAnomalyCheck) */
  anomaly_severity?: 'critical' | 'warning' | null;
  anomaly_reason?: string | null;
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

// Creality myshopify.com backend domains for handle discovery AND direct price extraction
const CREALITY_MYSHOPIFY_MAP: Record<string, string> = {
  US: 'https://crealityusa.myshopify.com',
  CA: 'https://crealityca.myshopify.com',
  UK: 'https://crealityuk.myshopify.com',
  EU: 'https://crealityeu.myshopify.com',
  AU: 'https://crealityau.myshopify.com',
};

// Creality region-to-currency mapping
const CREALITY_CURRENCY_MAP: Record<string, string> = {
  US: 'USD', CA: 'CAD', UK: 'GBP', EU: 'EUR', AU: 'AUD', JP: 'JPY',
};

// Rough exchange rates from USD for cross-region price sanity checks (used by ALL brands)
const ROUGH_USD_TO_REGIONAL: Record<string, number> = {
  CA: 1.36, UK: 0.79, EU: 0.92, AU: 1.55, JP: 150,
};
// Alias for backward compat in Creality-specific code
const CREALITY_ROUGH_EXCHANGE_RATES = ROUGH_USD_TO_REGIONAL;

// Inverse: approximate conversion TO USD (for universal anomaly detection)
const TO_USD_RATE: Record<string, number> = {
  USD: 1.0, CAD: 0.74, GBP: 1.27, EUR: 1.08, AUD: 0.65, JPY: 0.0067, CNY: 0.14,
};

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
  config?: BrandSyncConfig,
  productTitle?: string
): Promise<ExtractionResult | null> {
  try {
    // Try the primary URL first
    const result = await _fetchShopifyJson(url, region, config);
    if (result) return result;

    // Slug discovery fallback: try alternate slugs on 404
    const slugMatch = url.match(/\/products\/([^/?#]+)/);
    if (slugMatch) {
      const originalSlug = slugMatch[1];
      const alternates: string[] = [];

      // Try stripping common brand prefixes
      const brandPrefixes = ['anycubic-', 'elegoo-', 'creality-', 'flashforge-', 'sovol-', 'qidi-', 'bambu-lab-', 'bambulab-'];
      for (const prefix of brandPrefixes) {
        if (originalSlug.startsWith(prefix)) {
          alternates.push(originalSlug.slice(prefix.length));
          break;
        }
      }

      // Try adding brand prefix (if URL domain hints at brand)
      const domain = new URL(url).hostname;
      if (domain.includes('anycubic') && !originalSlug.startsWith('anycubic-')) {
        alternates.push(`anycubic-${originalSlug}`);
      }

      for (const altSlug of alternates) {
        const altUrl = url.replace(`/products/${originalSlug}`, `/products/${altSlug}`);
        console.log(`[ShopifyJSON] Trying alternate slug: ${altSlug} for ${url}`);
        const altResult = await _fetchShopifyJson(altUrl, region, config);
        if (altResult) {
          console.log(`[ShopifyJSON] Alternate slug "${altSlug}" worked for ${url}`);
          altResult.discovered_slug = altSlug;
          return altResult;
        }
      }

      // Last resort: search the regional store's product catalog by title
      if (productTitle) {
        const storeOrigin = new URL(url).origin;
        const discoveredSlug = await discoverHandleFromCatalog(storeOrigin, originalSlug, productTitle);
        if (discoveredSlug) {
          const catUrl = url.replace(`/products/${originalSlug}`, `/products/${discoveredSlug}`);
          console.log(`[ShopifyJSON] Catalog discovery found slug "${discoveredSlug}" for "${productTitle}"`);
          const catResult = await _fetchShopifyJson(catUrl, region, config);
          if (catResult) {
            catResult.discovered_slug = discoveredSlug;
            return catResult;
          }
        }
      }
    }

    // All slug variants returned 404 — product likely doesn't exist in this region
    console.log(`[ShopifyJSON] Product not found in region for ${url} — marking as not_in_region`);
    return {
      current_price: null,
      compare_at_price: null,
      currency: '',
      variant_name: null,
      extraction_method: 'not_in_region' as const,
      confidence: 'high',
      raw_variants_found: 0,
      is_combo: false,
      requires_review: false,
    };
  } catch (e) {
    console.error(`Shopify JSON extraction failed for ${url}:`, e);
    return null;
  }
}

/**
 * Search a Shopify store's product catalog to discover the correct handle
 * when it differs from the source region's handle.
 */
async function discoverHandleFromCatalog(
  storeOrigin: string,
  expectedHandle: string,
  productTitle: string
): Promise<string | null> {
  try {
    console.log(`[CatalogDiscovery] Searching ${storeOrigin} for "${productTitle}"`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(`${storeOrigin}/products.json?limit=250`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FilaScope/1.0)',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      await resp.text().catch(() => {});
      return null;
    }

    const data = await resp.json();
    const products = data?.products;
    if (!Array.isArray(products)) return null;

    // Normalize the expected title: strip brand prefix, lowercase
    const normalizeTitle = (t: string) =>
      t.replace(/^anycubic\s+/i, '')
       .replace(/^elegoo\s+/i, '')
       .replace(/^creality\s+/i, '')
       .trim().toLowerCase();

    const normalizedExpected = normalizeTitle(productTitle);
    const normalizedHandle = expectedHandle.replace(/^anycubic-|^elegoo-|^creality-/i, '').replace(/-/g, ' ').toLowerCase();

    for (const product of products) {
      const pTitle = normalizeTitle(product.title || '');
      const pHandle = (product.handle || '').replace(/-/g, ' ').toLowerCase();
      const pHandleNormalized = pHandle.replace(/^anycubic |^elegoo |^creality /i, '');

      // Match by normalized title
      if (pTitle === normalizedExpected) {
        console.log(`[CatalogDiscovery] Title match: "${product.title}" → handle "${product.handle}"`);
        return product.handle;
      }
      // Match by normalized handle
      if (pHandleNormalized === normalizedHandle) {
        console.log(`[CatalogDiscovery] Handle match: "${product.handle}"`);
        return product.handle;
      }
    }

    console.log(`[CatalogDiscovery] No match found for "${productTitle}" in ${products.length} products`);
    return null;
  } catch (e) {
    console.error(`[CatalogDiscovery] Error:`, e);
    return null;
  }
}

/** Internal: fetch and parse a single Shopify .json endpoint */
async function _fetchShopifyJson(
  url: string,
  region?: string,
  config?: BrandSyncConfig
): Promise<ExtractionResult | null> {
  try {
    const jsonUrl = url.replace(/\/?(\?.*)?$/, '.json');
    console.log(`[ShopifyJSON:fetch] Fetching ${jsonUrl} for region=${region ?? 'none'}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Use region spoof headers for known geo-restricted domains
    const domain = new URL(url).hostname;
    const spoofHeaders = REGION_SPOOF_HEADERS[domain] || {};

    const resp = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        ...spoofHeaders,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log(`[ShopifyJSON:fetch] ${jsonUrl} → status=${resp.status}`);

    if (!resp.ok) {
      await resp.text().catch(() => {}); // drain body
      return null;
    }

    const data = await resp.json();
    const shopifyVariants: ShopifyVariant[] = data?.product?.variants || [];
    console.log(`[ShopifyJSON:fetch] Product found: ${!!data?.product}, variants: ${shopifyVariants.length}`);
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
    if (!selection) {
      console.log(`[ShopifyJSON:fetch] selectBestVariant returned null for ${jsonUrl} (${normalized.length} valid variants)`);
      return null;
    }

    const { variant, is_combo } = selection;
    console.log(`[ShopifyJSON:fetch] Selected variant: "${variant.name}" price=${variant.price} available=${variant.available}`);

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
    console.error(`[ShopifyJSON:fetch] Exception for ${url}:`, e);
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

  // Product → direct offers (may have multiple offers for variants)
  if (type === 'Product') {
    const offers = obj.offers;
    const offersArray = Array.isArray(offers) ? offers : (offers ? [offers] : []);

    if (offersArray.length > 1) {
      // Multi-offer handling: filter by availability and combo exclusion
      const variants: NormalizedVariant[] = [];
      for (const offer of offersArray) {
        const p = parseFloat(offer.price);
        if (isNaN(p) || p <= 0) continue;
        const avail = extractAvailability(offer);
        const name = offer.name || offer.description || offer.sku || '';
        variants.push({
          name,
          price: p,
          compare_at_price: null,
          available: avail,
          id: offer.sku || offer['@id'],
        });
      }

      if (variants.length > 0) {
        // Prefer InStock variants
        const inStock = variants.filter(v => v.available);
        const candidates = inStock.length > 0 ? inStock : variants;
        const allOutOfStock = inStock.length === 0 && variants.length > 0;

        const selection = selectBestVariant(candidates, region, config);
        if (selection) {
          return {
            current_price: selection.variant.price,
            compare_at_price: selection.variant.compare_at_price,
            currency: extractCurrency(offersArray[0]) || '',
            variant_name: selection.variant.name || obj.name || null,
            extraction_method: 'json_ld_product',
            confidence: 'high',
            raw_variants_found: variants.length,
            is_combo: selection.is_combo,
            requires_review: allOutOfStock,
          };
        }
      }
    }

    // Single offer or fallback
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
  config?: BrandSyncConfig,
  expectedCurrency?: string,
  productTitle?: string,
  usPriceForSanity?: number | null
): Promise<ExtractionResult> {
  const primary = config?.primary_extraction ?? 'shopify_json';
  const fallback = config?.fallback_extraction ?? 'meta_tags';
  console.log(`[extractPrice] URL=${url} region=${region ?? 'none'} primary=${primary} fallback=${fallback} expectedCurrency=${expectedCurrency ?? 'none'}`);

  // If manual_only, skip all auto-extraction
  if (primary === 'manual_only') {
    return manualFallback();
  }

  // ========== PRUSA DEDICATED PATH ==========
  // Prusa uses WooCommerce/Next.js with JS-rendered prices. Skip all standard tiers.
  if (isPrusaUrl(url)) {
    console.log(`[Prusa] Detected Prusa URL, using dedicated Firecrawl extraction`);
    return extractPrusaPrice(url, region, oldPrice, config, expectedCurrency, usPriceForSanity);
  }

  // ========== CREALITY DEDICATED PATH ==========
  // Creality uses a custom storefront that blocks Shopify JSON and often fails JSON-LD.
  // Route directly to dedicated extraction pipeline (myshopify.com backend).
  if (isCrealityUrl(url) && region && productTitle) {
    console.log(`[Creality] Detected Creality URL, using dedicated extraction pipeline for ${region}`);
    return extractCrealityRegionalPrice(url, region, productTitle, oldPrice, config, usPriceForSanity);
  }

  // ========== STANDARD EXTRACTION PATH ==========
  // Build ordered extraction tiers based on config
  const tiers: string[] = [primary];
  if (fallback && fallback !== primary) tiers.push(fallback);
  // Always add remaining tiers as final fallbacks
  for (const t of ['shopify_json', 'json_ld', 'meta_tags']) {
    if (!tiers.includes(t)) tiers.push(t);
  }

  // Skip shopify_json if config says it's not available
  const skipShopify = config?.shopify_json_available === false;
  let shopifyNotInRegion = false;

  let html: string | null = null;
  let fetchAttempted = false;
  let isGeoBlocked = false;
  let usedFirecrawlHtml = false;

  for (const tier of tiers) {
    if (tier === 'shopify_json' && !skipShopify) {
      const result = await extractFromShopifyJson(url, region, config, productTitle);
      if (result) {
        // If the product is not available in this region, return immediately
        if (result.extraction_method === 'not_in_region') {
          shopifyNotInRegion = true;
          // Don't fall through to other tiers — the product genuinely doesn't exist here
          break;
        }
        if (result.current_price && result.current_price > 0) {
          return applyAnomalyCheck(result, oldPrice, usPriceForSanity, expectedCurrency);
        }
      }
    }

    if (tier === 'json_ld' || tier === 'meta_tags') {
      // Fetch HTML once, reuse for both JSON-LD and meta tags
      if (!fetchAttempted) {
        fetchAttempted = true;
        html = await fetchHtml(url, region);
        // If fetchHtml returned null and this is a known geo-redirect domain, try Firecrawl
        if (html === null) {
          const domain = new URL(url).hostname;
          if (REGION_SPOOF_HEADERS[domain]) {
            isGeoBlocked = true;
            console.log(`[GeoBlock] Direct fetch failed for ${url}, trying Firecrawl...`);
            html = await fetchHtmlViaFirecrawl(url);
            if (html) {
              console.log(`[GeoBlock] Firecrawl HTML succeeded for ${url}`);
              usedFirecrawlHtml = true;
            }
          }
        }
      }
      if (html) {
        if (tier === 'json_ld') {
          const result = extractFromJsonLd(html, region, config);
          if (result?.current_price && result.current_price > 0) {
            return applyAnomalyCheck(result, oldPrice, usPriceForSanity, expectedCurrency);
          }
        }
        if (tier === 'meta_tags') {
          // When we used Firecrawl HTML, meta_tags picks up the default variant (often Combo).
          // Try Firecrawl markdown FIRST — it does proper variant selection.
          if (usedFirecrawlHtml) {
            console.log(`[Firecrawl-MD] Trying markdown extraction BEFORE meta_tags for ${url}`);
            const mdResult = await extractPriceFromFirecrawlMarkdown(url, region, config);
            if (mdResult?.current_price && mdResult.current_price > 0) {
              // Currency mismatch check: Firecrawl may render from wrong country
              if (expectedCurrency && mdResult.currency && mdResult.currency !== expectedCurrency) {
                console.log(`[Firecrawl-MD] Currency mismatch: got ${mdResult.currency}, expected ${expectedCurrency}. Rejecting.`);
              } else {
                return applyAnomalyCheck(mdResult, oldPrice, usPriceForSanity, expectedCurrency);
              }
            }
            console.log(`[Firecrawl-MD] Markdown extraction failed, falling through to meta_tags`);
          }
          // Also check currency mismatch for meta_tags from Firecrawl HTML
          const result = extractFromMetaTags(html);
          if (result?.current_price && result.current_price > 0) {
            if (usedFirecrawlHtml && expectedCurrency && result.currency && result.currency !== expectedCurrency) {
              console.log(`[Meta] Currency mismatch from Firecrawl HTML: got ${result.currency}, expected ${expectedCurrency}. Rejecting.`);
            } else {
              return applyAnomalyCheck(result, oldPrice, usPriceForSanity, expectedCurrency);
            }
          }
        }
      }
    }
  }

  // Tier 4 fallback: Firecrawl Markdown extraction — works for ALL sites as last resort
  const shouldTryFirecrawlMd = !usedFirecrawlHtml; // Haven't already tried it inline
  if (shouldTryFirecrawlMd) {
    console.log(`[Firecrawl-MD] Last resort markdown extraction for ${url}`);
    const mdResult = await extractPriceFromFirecrawlMarkdown(url, region, config);
    if (mdResult?.current_price && mdResult.current_price > 0) {
      if (expectedCurrency && mdResult.currency && mdResult.currency !== expectedCurrency) {
        console.log(`[Firecrawl-MD] Currency mismatch: got ${mdResult.currency}, expected ${expectedCurrency}. Rejecting.`);
      } else {
        return applyAnomalyCheck(mdResult, oldPrice, usPriceForSanity, expectedCurrency);
      }
    }
  }

  // If Shopify JSON confirmed product doesn't exist in this region, return that status
  if (shopifyNotInRegion) {
    return {
      current_price: null,
      compare_at_price: null,
      currency: '',
      variant_name: null,
      extraction_method: 'not_in_region',
      confidence: 'high',
      raw_variants_found: 0,
      is_combo: false,
      requires_review: false,
    };
  }

  // If we were geo-blocked and nothing worked, return geo_blocked
  if (isGeoBlocked) {
    return geoBlockedFallback();
  }

  return manualFallback();
}

/**
 * Tier 4: Firecrawl Markdown-based price extraction.
 * Uses Firecrawl to render the page and get markdown, then parses variant/price patterns.
 * Handles Bambu Lab and similar JS-rendered storefronts.
 */
async function extractPriceFromFirecrawlMarkdown(
  url: string,
  region?: string,
  config?: BrandSyncConfig
): Promise<ExtractionResult | null> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) return null;

  // Map region to Firecrawl location for geo-targeted rendering
  const REGION_TO_LOCATION: Record<string, { country: string; languages: string[] }> = {
    US: { country: 'US', languages: ['en-US'] },
    CA: { country: 'CA', languages: ['en-CA'] },
    UK: { country: 'GB', languages: ['en-GB'] },
    EU: { country: 'DE', languages: ['de-DE', 'en'] },
    AU: { country: 'AU', languages: ['en-AU'] },
    JP: { country: 'JP', languages: ['ja-JP'] },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const locationParam = region ? REGION_TO_LOCATION[region] : undefined;

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        waitFor: 3000,
        onlyMainContent: true,
        ...(locationParam && { location: locationParam }),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      await response.text().catch(() => {});
      return null;
    }

    const data = await response.json();
    const markdown = data?.data?.markdown || data?.markdown;
    if (!markdown || typeof markdown !== 'string') return null;

    console.log(`[Firecrawl-MD] Got ${markdown.length} chars of markdown for ${url}`);

    // Parse variants and prices from markdown
    // Pattern: "Variant : X Combo" followed by variant names and prices like "$299.00"
    // Or "# Product Name\n\n$399.00 USD$559.00 USD"
    return parseMarkdownPrices(markdown, region, config);
  } catch (e) {
    console.error(`[Firecrawl-MD] Error:`, e);
    return null;
  }
}

/**
 * Parse prices from Firecrawl markdown output.
 * Handles patterns like:
 *   "- A1 Combo\n\n$399.00\n\n- A1\n\n$299.00"
 *   or "# Product\n\n$299.00 USD"
 */
function parseMarkdownPrices(
  markdown: string,
  region?: string,
  config?: BrandSyncConfig
): ExtractionResult | null {
  // Strategy 1: Look for variant list pattern "- VariantName\n...\n$Price"
  const variants: NormalizedVariant[] = [];

  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Check if line starts with "- " and looks like a variant name (not a feature bullet)
    if (line.startsWith('- ') && line.length < 60 && !line.includes('Calibration') && !line.includes('Printing') && !line.includes('Nozzle') && !line.includes('Volume') && !line.includes('cable') && !line.includes('Shipping') && !line.includes('accessories') && !line.includes('Learn more') && !line.includes('http')) {
      const variantName = line.substring(2).trim();
      if (!variantName || variantName.length < 2) continue;
      // Look for a price in the next 12 lines (Bambu Lab has ~6 blank lines between name and price)
      for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
        const priceLine = lines[j].trim();
        // Stop if we hit another variant bullet
        if (priceLine.startsWith('- ') && priceLine.length > 2) break;
        const priceMatch = priceLine.match(/^[\$£€¥]([\d,]+(?:\.\d{1,2})?)\s*(?:USD|CAD|GBP|EUR|AUD|JPY)?$/);
        if (priceMatch) {
          const price = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (!isNaN(price) && price >= 50) {
            variants.push({
              name: variantName,
              price,
              compare_at_price: null,
              available: true,
            });
          }
          break;
        }
      }
    }
  }

  if (variants.length > 0) {
    console.log(`[Firecrawl-MD] Found ${variants.length} variants: ${variants.map(v => `${v.name}=$${v.price}`).join(', ')}`);
    const selection = selectBestVariant(variants, region, config);
    if (selection) {
      return {
        current_price: selection.variant.price,
        compare_at_price: selection.variant.compare_at_price,
        currency: detectCurrencyFromMarkdown(markdown) || '',
        variant_name: selection.variant.name,
        extraction_method: 'meta_tags', // closest available type
        confidence: 'medium',
        raw_variants_found: variants.length,
        is_combo: selection.is_combo,
        requires_review: false,
      };
    }
  }

  // Strategy 2: Find first price in format "$XXX.XX" near the product title
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    const titleIdx = markdown.indexOf(titleMatch[0]);
    const afterTitle = markdown.substring(titleIdx, titleIdx + 500);
    // Match price pattern: "$299.00 USD" or "$299.00"
    const priceMatch = afterTitle.match(/[\$£€¥]([\d,]+(?:\.\d{1,2})?)\s*(?:USD|CAD|GBP|EUR|AUD|JPY)?/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ''));
      if (!isNaN(price) && price >= 50) {
        // Check for compare-at price (second price on same line like "$399.00 USD$559.00 USD")
        const allPrices = afterTitle.match(/[\$£€¥]([\d,]+(?:\.\d{1,2})?)\s*(?:USD|CAD|GBP|EUR|AUD|JPY)?/g);
        let compareAt: number | null = null;
        if (allPrices && allPrices.length >= 2) {
          const second = parseFloat(allPrices[1].replace(/[^0-9.]/g, ''));
          if (!isNaN(second) && second > price) compareAt = second;
        }
        return {
          current_price: price,
          compare_at_price: compareAt,
          currency: detectCurrencyFromMarkdown(markdown) || '',
          variant_name: titleMatch[1],
          extraction_method: 'meta_tags',
          confidence: 'medium',
          raw_variants_found: 1,
          is_combo: false,
          requires_review: false,
        };
      }
    }
  }

  // Strategy 3: Inline sale/regular price pattern (FlashForge: "Sale price$299.00 USDRegular price$399.00 USD")
  const inlineSaleMatch = markdown.match(/Sale\s*price\s*[\$£€¥]?([\d,]+(?:\.\d{1,2})?)\s*(?:USD|CAD|GBP|EUR|AUD|JPY)?.*?Regular\s*price\s*[\$£€¥]?([\d,]+(?:\.\d{1,2})?)/i);
  if (inlineSaleMatch) {
    const salePrice = parseFloat(inlineSaleMatch[1].replace(/,/g, ''));
    const regularPrice = parseFloat(inlineSaleMatch[2].replace(/,/g, ''));
    if (!isNaN(salePrice) && salePrice >= 50) {
      return {
        current_price: salePrice,
        compare_at_price: !isNaN(regularPrice) && regularPrice > salePrice ? regularPrice : null,
        currency: detectCurrencyFromMarkdown(markdown) || '',
        variant_name: null,
        extraction_method: 'meta_tags',
        confidence: 'medium',
        raw_variants_found: 1,
        is_combo: false,
        requires_review: false,
      };
    }
  }

  // Strategy 4: Strikethrough pattern (FLSUN: "~~$1,499.00~~\n$599.00")
  const strikeMatch = markdown.match(/~~[\$£€¥]?([\d,]+(?:\.\d{1,2})?)~~[\s\S]{0,20}?[\$£€¥]([\d,]+(?:\.\d{1,2})?)/);
  if (strikeMatch) {
    const oldPrice = parseFloat(strikeMatch[1].replace(/,/g, ''));
    const newPrice = parseFloat(strikeMatch[2].replace(/,/g, ''));
    if (!isNaN(newPrice) && newPrice >= 50) {
      return {
        current_price: newPrice,
        compare_at_price: !isNaN(oldPrice) && oldPrice > newPrice ? oldPrice : null,
        currency: detectCurrencyFromMarkdown(markdown) || '',
        variant_name: null,
        extraction_method: 'meta_tags',
        confidence: 'medium',
        raw_variants_found: 1,
        is_combo: false,
        requires_review: false,
      };
    }
  }

  // Strategy 5: Any standalone price >= $50 in the first 1000 chars (last resort)
  const firstChunk = markdown.substring(0, 1000);
  const anyPriceMatch = firstChunk.match(/[\$£€¥]([\d,]+(?:\.\d{1,2})?)/);
  if (anyPriceMatch) {
    const price = parseFloat(anyPriceMatch[1].replace(/,/g, ''));
    if (!isNaN(price) && price >= 50) {
      return {
        current_price: price,
        compare_at_price: null,
        currency: detectCurrencyFromMarkdown(markdown) || '',
        variant_name: null,
        extraction_method: 'meta_tags',
        confidence: 'low',
        raw_variants_found: 0,
        is_combo: false,
        requires_review: true, // low confidence, flag for review
      };
    }
  }

  return null;
}

function detectCurrencyFromMarkdown(md: string): string | null {
  if (md.includes('USD')) return 'USD';
  if (md.includes('CAD')) return 'CAD';
  if (md.includes('GBP')) return 'GBP';
  if (md.includes('EUR')) return 'EUR';
  if (md.includes('AUD')) return 'AUD';
  if (md.includes('JPY')) return 'JPY';
  if (md.includes('$')) return 'USD';
  if (md.includes('£')) return 'GBP';
  if (md.includes('€')) return 'EUR';
  if (md.includes('¥')) return 'JPY';
  return null;
}
const REGION_SPOOF_HEADERS: Record<string, Record<string, string>> = {
  // Bambu Lab
  'us.store.bambulab.com': { 'Accept-Language': 'en-US,en;q=0.9', 'CF-IPCountry': 'US', 'X-Forwarded-For': '8.8.8.8' },
  'ca.store.bambulab.com': { 'Accept-Language': 'en-CA,en;q=0.9', 'CF-IPCountry': 'CA', 'X-Forwarded-For': '99.224.0.1' },
  'uk.store.bambulab.com': { 'Accept-Language': 'en-GB,en;q=0.9', 'CF-IPCountry': 'GB', 'X-Forwarded-For': '81.2.69.142' },
  'eu.store.bambulab.com': { 'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8', 'CF-IPCountry': 'DE', 'X-Forwarded-For': '85.214.132.117' },
  'au.store.bambulab.com': { 'Accept-Language': 'en-AU,en;q=0.9', 'CF-IPCountry': 'AU', 'X-Forwarded-For': '1.128.0.1' },
  'jp.store.bambulab.com': { 'Accept-Language': 'ja-JP,ja;q=0.9', 'CF-IPCountry': 'JP', 'X-Forwarded-For': '126.0.0.1' },
  // Elegoo
  'us.elegoo.com': { 'Accept-Language': 'en-US,en;q=0.9', 'CF-IPCountry': 'US', 'X-Forwarded-For': '8.8.8.8' },
  'ca.elegoo.com': { 'Accept-Language': 'en-CA,en;q=0.9', 'CF-IPCountry': 'CA', 'X-Forwarded-For': '99.224.0.1' },
  'uk.elegoo.com': { 'Accept-Language': 'en-GB,en;q=0.9', 'CF-IPCountry': 'GB', 'X-Forwarded-For': '81.2.69.142' },
  'eu.elegoo.com': { 'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8', 'CF-IPCountry': 'DE', 'X-Forwarded-For': '85.214.132.117' },
  'au.elegoo.com': { 'Accept-Language': 'en-AU,en;q=0.9', 'CF-IPCountry': 'AU', 'X-Forwarded-For': '1.128.0.1' },
  // QIDI Tech
  'us.qidi3d.com': { 'Accept-Language': 'en-US,en;q=0.9', 'CF-IPCountry': 'US', 'X-Forwarded-For': '8.8.8.8' },
  'eu.qidi3d.com': { 'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8', 'CF-IPCountry': 'DE', 'X-Forwarded-For': '85.214.132.117' },
  'ca.qidi3d.com': { 'Accept-Language': 'en-CA,en;q=0.9', 'CF-IPCountry': 'CA', 'X-Forwarded-For': '24.48.0.1' },
  'uk.qidi3d.com': { 'Accept-Language': 'en-GB,en;q=0.9', 'CF-IPCountry': 'GB', 'X-Forwarded-For': '178.79.163.0' },
  'au.qidi3d.com': { 'Accept-Language': 'en-AU,en;q=0.9', 'CF-IPCountry': 'AU', 'X-Forwarded-For': '1.128.0.1' },
  // FLSUN
  'us.store.flsun3d.com': { 'Accept-Language': 'en-US,en;q=0.9', 'CF-IPCountry': 'US', 'X-Forwarded-For': '8.8.8.8' },
  // Snapmaker
  'us.snapmaker.com': { 'Accept-Language': 'en-US,en;q=0.9', 'CF-IPCountry': 'US', 'X-Forwarded-For': '8.8.8.8' },
  'eu.snapmaker.com': { 'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8', 'CF-IPCountry': 'DE', 'X-Forwarded-For': '85.214.132.117' },
  // FlashForge
  'www.flashforge.com': { 'Accept-Language': 'en-US,en;q=0.9', 'CF-IPCountry': 'US', 'X-Forwarded-For': '8.8.8.8' },
  'ca.flashforge.com': { 'Accept-Language': 'en-CA,en;q=0.9', 'CF-IPCountry': 'CA', 'X-Forwarded-For': '99.224.0.1' },
  'eu.flashforge.com': { 'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8', 'CF-IPCountry': 'DE', 'X-Forwarded-For': '85.214.132.117' },
  'uk.flashforge.com': { 'Accept-Language': 'en-GB,en;q=0.9', 'CF-IPCountry': 'GB', 'X-Forwarded-For': '81.2.69.142' },
  'au.flashforge.com': { 'Accept-Language': 'en-AU,en;q=0.9', 'CF-IPCountry': 'AU', 'X-Forwarded-For': '1.128.0.1' },
  // Anycubic
  'store.anycubic.com': { 'Accept-Language': 'en-US,en;q=0.9', 'CF-IPCountry': 'US', 'X-Forwarded-For': '8.8.8.8' },
  'ca.anycubic.com': { 'Accept-Language': 'en-CA,en;q=0.9', 'CF-IPCountry': 'CA', 'X-Forwarded-For': '99.224.0.1' },
  'uk.anycubic.com': { 'Accept-Language': 'en-GB,en;q=0.9', 'CF-IPCountry': 'GB', 'X-Forwarded-For': '81.2.69.142' },
  'eu.anycubic.com': { 'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8', 'CF-IPCountry': 'DE', 'X-Forwarded-For': '85.214.132.117' },
  'www.anycubic.au': { 'Accept-Language': 'en-AU,en;q=0.9', 'CF-IPCountry': 'AU', 'X-Forwarded-For': '1.128.0.1' },
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

// Map store subdomains to region codes for geo-redirect detection
const DOMAIN_REGION_MAP: Record<string, string> = {
  'us.store.bambulab.com': 'US',
  'ca.store.bambulab.com': 'CA',
  'uk.store.bambulab.com': 'UK',
  'eu.store.bambulab.com': 'EU',
  'au.store.bambulab.com': 'AU',
  'jp.store.bambulab.com': 'JP',
  'us.elegoo.com': 'US',
  'ca.elegoo.com': 'CA',
  'uk.elegoo.com': 'UK',
  'eu.elegoo.com': 'EU',
  'au.elegoo.com': 'AU',
  'us.qidi3d.com': 'US',
  'eu.qidi3d.com': 'EU',
  'ca.qidi3d.com': 'CA',
  'uk.qidi3d.com': 'UK',
  'au.qidi3d.com': 'AU',
  'us.store.flsun3d.com': 'US',
  'us.snapmaker.com': 'US',
  'eu.snapmaker.com': 'EU',
  'www.flashforge.com': 'US',
  'ca.flashforge.com': 'CA',
  'eu.flashforge.com': 'EU',
  'uk.flashforge.com': 'UK',
  'au.flashforge.com': 'AU',
  // Anycubic
  'store.anycubic.com': 'US',
  'ca.anycubic.com': 'CA',
  'uk.anycubic.com': 'UK',
  'eu.anycubic.com': 'EU',
  'www.anycubic.au': 'AU',
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
            // Redirect goes to wrong region — reject and try Firecrawl
            console.log(`Geo-redirect ${requestDomain} → ${redirectDomain} (target: ${targetRegion || 'none'}). Will try Firecrawl.`);
            await resp.text().catch(() => {});
            // Return a special marker so caller can try Firecrawl
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

/**
 * Fetch HTML via Firecrawl API (bypasses geo-blocks via headless browser).
 * Returns raw HTML content or null on failure.
 */
async function fetchHtmlViaFirecrawl(url: string): Promise<string | null> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    console.log('FIRECRAWL_API_KEY not available, skipping Firecrawl fallback');
    return null;
  }

  try {
    console.log(`[Firecrawl] Fetching: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html'],
        waitFor: 3000,
        onlyMainContent: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error(`[Firecrawl] HTTP ${response.status}: ${errBody}`);
      return null;
    }

    const data = await response.json();
    const html = data?.data?.html || data?.html;
    if (html && typeof html === 'string' && html.length > 100) {
      console.log(`[Firecrawl] Got ${html.length} chars of HTML`);
      return html;
    }
    console.log('[Firecrawl] No usable HTML in response');
    return null;
  } catch (e) {
    console.error(`[Firecrawl] Error:`, e);
    return null;
  }
}

/**
 * Check if a URL belongs to Prusa Research's storefront
 */
function isPrusaUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes('prusa3d.com');
  } catch {
    return false;
  }
}

/**
 * Prusa-specific price extraction via Firecrawl.
 * Prusa's WooCommerce/Next.js storefront renders prices via client-side JS
 * with geo-detection, so standard HTML/JSON-LD/meta extraction won't work.
 * Uses Firecrawl with extended waitFor to allow the price widget to render.
 */
async function extractPrusaPrice(
  url: string,
  region?: string,
  oldPrice?: number | null,
  config?: BrandSyncConfig,
  expectedCurrency?: string,
  usPriceForSanity?: number | null
): Promise<ExtractionResult> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    console.log('[Prusa] FIRECRAWL_API_KEY not available, returning manual fallback');
    return manualFallback();
  }

  const REGION_TO_LOCATION: Record<string, { country: string; languages: string[] }> = {
    US: { country: 'US', languages: ['en-US'] },
    CA: { country: 'CA', languages: ['en-CA'] },
    UK: { country: 'GB', languages: ['en-GB'] },
    EU: { country: 'DE', languages: ['de-DE', 'en'] },
    AU: { country: 'AU', languages: ['en-AU'] },
    JP: { country: 'JP', languages: ['ja-JP'] },
  };

  try {
    const locationParam = region ? REGION_TO_LOCATION[region] : REGION_TO_LOCATION['US'];
    console.log(`[Prusa] Firecrawl scrape: ${url} region=${region || 'US'} waitFor=8000 onlyMainContent=false`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    // Prusa uses Global-e for pricing which renders prices via JS after geo-detection.
    // We need: longer wait, full page content (not just main), and HTML format to find
    // price elements that may not appear in markdown.
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        waitFor: 8000,
        onlyMainContent: false, // Critical: price widget is outside "main content"
        ...(locationParam && { location: locationParam }),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error(`[Prusa] Firecrawl HTTP ${response.status}: ${errBody}`);
      return manualFallback();
    }

    const data = await response.json();
    const markdown = data?.data?.markdown || data?.markdown || '';
    const html = data?.data?.html || data?.html || '';
    console.log(`[Prusa] Got ${markdown.length} chars markdown, ${html.length} chars HTML`);

    // Strategy 1: Try parsing from markdown first
    if (markdown) {
      const mdResult = parsePrusaMarkdownPrice(markdown, region, config);
      if (mdResult?.current_price && mdResult.current_price > 0) {
        if (expectedCurrency && mdResult.currency && mdResult.currency !== expectedCurrency) {
          // Prusa uses a single global store with ~1:1 USD/EUR pricing.
          // Firecrawl renders from EU, so we always get EUR. Accept the numeric value.
          console.log(`[Prusa] Currency mismatch: got ${mdResult.currency} ${mdResult.current_price}, expected ${expectedCurrency}. Accepting price (single global store).`);
          mdResult.currency = expectedCurrency;
          mdResult.requires_review = true;
          mdResult.confidence = 'low';
          mdResult.extraction_method = 'firecrawl_converted';
          return applyAnomalyCheck(mdResult, oldPrice, usPriceForSanity, expectedCurrency);
        } else {
          console.log(`[Prusa] Extracted from markdown: ${mdResult.current_price} ${mdResult.currency}`);
          return applyAnomalyCheck(mdResult, oldPrice, usPriceForSanity, expectedCurrency);
        }
      }
    }

    // Strategy 2: Parse from rendered HTML (Global-e injects prices into DOM elements)
    if (html) {
      const htmlResult = parsePrusaHtmlPrice(html, region, expectedCurrency);
      if (htmlResult?.current_price && htmlResult.current_price > 0) {
        if (expectedCurrency && htmlResult.currency && htmlResult.currency !== expectedCurrency) {
          console.log(`[Prusa] HTML currency mismatch: got ${htmlResult.currency} ${htmlResult.current_price}, expected ${expectedCurrency}. Accepting price (single global store).`);
          htmlResult.currency = expectedCurrency;
          htmlResult.requires_review = true;
          htmlResult.confidence = 'low';
          htmlResult.extraction_method = 'firecrawl_converted';
          return applyAnomalyCheck(htmlResult, oldPrice, usPriceForSanity, expectedCurrency);
        } else {
          console.log(`[Prusa] Extracted from HTML: ${htmlResult.current_price} ${htmlResult.currency}`);
          return applyAnomalyCheck(htmlResult, oldPrice, usPriceForSanity, expectedCurrency);
        }
      }
    }

    console.log('[Prusa] No price found in markdown or HTML — returning manual fallback');
    return manualFallback();
  } catch (e) {
    console.error('[Prusa] Extraction error:', e);
    return manualFallback();
  }
}

/**
 * Parse prices from Prusa's rendered markdown.
 * Prusa pages typically show prices like:
 *   "$1,349" or "$1,349 USD" or "from $1,349"
 *   Or in comparison tables: "| $1,349 |"
 *   Or near "Add to Cart" / "Buy" sections
 */
function parsePrusaMarkdownPrice(
  markdown: string,
  region?: string,
  config?: BrandSyncConfig
): ExtractionResult | null {
  // Prusa injects zero-width non-joiner (U+200C) between currency symbol and digits
  // e.g. "$‌1,299.00" — strip these invisible chars first for reliable parsing
  const cleanMarkdown = markdown.replace(/[\u200B-\u200F\u00AD\uFEFF\u200C]/g, '');
  
  // Prusa's cheapest active printer is ~$429 (MINI+). Use $250 min to filter out
  // accessories/shipping costs like "$200" that appear on product pages.
  const PRUSA_MIN_PRICE = 250;
  const PRUSA_MAX_PRICE = 5000;

  // Strategy 1: Look for prices near the product title (first 3000 chars — Prusa pages
  // have lots of images before the price appears)
  const topSection = cleanMarkdown.substring(0, 3000);

  // Pattern: "$X,XXX" or "$XXX" or "€X,XXX" with optional currency code
  const priceRegex = /[\$€£]([\d,]+(?:\.\d{1,2})?)\s*(?:USD|EUR|CAD|GBP|AUD)?/g;
  const prices: { value: number; index: number; currency: string }[] = [];

  let match;
  while ((match = priceRegex.exec(topSection)) !== null) {
    const price = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(price) && price >= PRUSA_MIN_PRICE && price <= PRUSA_MAX_PRICE) {
      const symbol = match[0].charAt(0);
      let currency = '';
      if (match[0].includes('USD') || symbol === '$') currency = 'USD';
      else if (match[0].includes('EUR') || symbol === '€') currency = 'EUR';
      else if (match[0].includes('GBP') || symbol === '£') currency = 'GBP';
      else if (match[0].includes('CAD')) currency = 'CAD';
      else if (match[0].includes('AUD')) currency = 'AUD';
      prices.push({ value: price, index: match.index, currency });
    }
  }

  if (prices.length > 0) {
    // Take the first valid price (closest to the product title)
    const best = prices[0];
    // Check for compare-at price (second price that's higher)
    let compareAt: number | null = null;
    if (prices.length >= 2 && prices[1].value > best.value) {
      compareAt = prices[1].value;
    }

    console.log(`[Prusa:MD] Found ${prices.length} prices in top section. Best: ${best.currency} ${best.value}`);
    return {
      current_price: best.value,
      compare_at_price: compareAt,
      currency: best.currency || detectCurrencyFromMarkdown(cleanMarkdown) || '',
      variant_name: null,
      extraction_method: 'firecrawl' as any,
      confidence: 'medium',
      raw_variants_found: prices.length,
      is_combo: false,
      requires_review: false,
    };
  }

  // Strategy 2: Scan full markdown for price in valid range
  const fullPriceRegex = /[\$€£]([\d,]+(?:\.\d{1,2})?)\s*(?:USD|EUR|CAD|GBP|AUD)?/g;
  while ((match = fullPriceRegex.exec(cleanMarkdown)) !== null) {
    const price = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(price) && price >= PRUSA_MIN_PRICE && price <= PRUSA_MAX_PRICE) {
      const symbol = match[0].charAt(0);
      let currency = '';
      if (match[0].includes('USD') || symbol === '$') currency = 'USD';
      else if (match[0].includes('EUR') || symbol === '€') currency = 'EUR';
      else if (match[0].includes('GBP') || symbol === '£') currency = 'GBP';

      console.log(`[Prusa:MD] Found price in full scan: ${currency} ${price}`);
      return {
        current_price: price,
        compare_at_price: null,
        currency: currency || detectCurrencyFromMarkdown(cleanMarkdown) || '',
        variant_name: null,
        extraction_method: 'firecrawl' as any,
        confidence: 'low',
        raw_variants_found: 0,
        is_combo: false,
        requires_review: true,
      };
    }
  }

  console.log(`[Prusa:MD] No price found in ${cleanMarkdown.length} chars (min: ${PRUSA_MIN_PRICE})`);
  return null;
}

/**
 * Parse prices from Prusa's rendered HTML.
 * Global-e injects prices into specific DOM elements after JS rendering.
 * Look for price patterns in data attributes, spans with price classes, and text content.
 */
function parsePrusaHtmlPrice(
  html: string,
  region?: string,
  expectedCurrency?: string
): ExtractionResult | null {
  // Strip zero-width characters that Prusa injects (same issue as markdown)
  const cleanHtml = html.replace(/[\u200B-\u200F\u00AD\uFEFF\u200C]/g, '');
  const PRUSA_MIN_PRICE = 250;
  
  // Strategy 1: Look for Global-e price elements (data-ge-price, data-price attributes)
  const gePriceMatch = cleanHtml.match(/data-ge-price="([\d.]+)"/);
  if (gePriceMatch) {
    const price = parseFloat(gePriceMatch[1]);
    if (!isNaN(price) && price >= PRUSA_MIN_PRICE && price <= 5000) {
      console.log(`[Prusa:HTML] Found Global-e data attribute price: ${price}`);
      return {
        current_price: price,
        compare_at_price: null,
        currency: expectedCurrency || 'USD',
        variant_name: null,
        extraction_method: 'firecrawl' as any,
        confidence: 'medium',
        raw_variants_found: 1,
        is_combo: false,
        requires_review: false,
      };
    }
  }

  // Strategy 2: Look for price in elements with price-related classes
  const pricePatterns = [
    // Match $1,202.78 or €1,099.00 in span/div elements
    /<(?:span|div|p|strong)[^>]*>[\s]*(?:[\$\u20AC\u00A3])([\d,]+(?:\.\d{1,2})?)[\s]*<\/(?:span|div|p|strong)>/gi,
    // Match price with class containing "price"
    /class="[^"]*price[^"]*"[^>]*>[\s]*(?:[\$\u20AC\u00A3])?([\d,]+(?:\.\d{1,2})?)[\s]*(?:USD|EUR|GBP|CAD|AUD)?/gi,
    // Match data-price attributes
    /data-price="([\d.]+)"/gi,
    // Broader: any element containing a price-like value near "cart" or "buy"
    /(?:cart|buy|price|add to)[^<]{0,200}[\$\u20AC\u00A3]([\d,]+(?:\.\d{1,2})?)/gi,
  ];

  for (const pattern of pricePatterns) {
    let match;
    while ((match = pattern.exec(cleanHtml)) !== null) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price >= PRUSA_MIN_PRICE && price <= 5000) {
        const context = cleanHtml.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20);
        let currency = expectedCurrency || 'USD';
        if (context.includes('\u20AC') || context.includes('EUR')) currency = 'EUR';
        else if (context.includes('\u00A3') || context.includes('GBP')) currency = 'GBP';
        else if (context.includes('CA$') || context.includes('CAD')) currency = 'CAD';
        else if (context.includes('$')) currency = 'USD';

        console.log(`[Prusa:HTML] Found price via pattern: ${price} ${currency}`);
        return {
          current_price: price,
          compare_at_price: null,
          currency,
          variant_name: null,
          extraction_method: 'firecrawl' as any,
          confidence: 'medium',
          raw_variants_found: 1,
          is_combo: false,
          requires_review: false,
        };
      }
    }
  }

  // Strategy 3: Broad scan - find all price-like values in the printer range ($100-$5000)
  const broadRegex = /[\$\u20AC\u00A3]([\d,]+\.\d{2})/g;
  const foundPrices: { value: number; currency: string }[] = [];
  let bMatch;
  while ((bMatch = broadRegex.exec(cleanHtml)) !== null) {
    const price = parseFloat(bMatch[1].replace(/,/g, ''));
    if (!isNaN(price) && price >= PRUSA_MIN_PRICE && price <= 5000) {
      const symbol = bMatch[0].charAt(0);
      let currency = symbol === '\u20AC' ? 'EUR' : symbol === '\u00A3' ? 'GBP' : 'USD';
      foundPrices.push({ value: price, currency });
    }
  }

  if (foundPrices.length > 0) {
    const priceCounts = new Map<number, number>();
    for (const fp of foundPrices) {
      priceCounts.set(fp.value, (priceCounts.get(fp.value) || 0) + 1);
    }
    let bestPrice = foundPrices[0];
    let bestCount = 0;
    for (const [value, count] of priceCounts) {
      if (count > bestCount) {
        bestCount = count;
        bestPrice = foundPrices.find(fp => fp.value === value)!;
      }
    }

    console.log(`[Prusa:HTML] Broad scan found ${foundPrices.length} prices, best: ${bestPrice.value} ${bestPrice.currency} (appeared ${bestCount}x)`);
    return {
      current_price: bestPrice.value,
      compare_at_price: null,
      currency: bestPrice.currency,
      variant_name: null,
      extraction_method: 'firecrawl' as any,
      confidence: 'low',
      raw_variants_found: foundPrices.length,
      is_combo: false,
      requires_review: true,
    };
  }

  return null;
}

/**
 * Check if a URL belongs to Creality's custom storefront
 */
function isCrealityUrl(url: string): boolean {
  try {
    return new URL(url).hostname === 'store.creality.com';
  } catch {
    return false;
  }
}

/**
 * Full Creality regional extraction pipeline:
 * 1. Try direct fetch + JSON-LD on custom storefront (works for some pages)
 * 2. Discover regional handle via myshopify.com catalog
 * 3. Extract price directly from myshopify.com/{handle}.json (most reliable)
 * 4. Optionally retry JSON-LD on custom storefront with discovered handle
 * Returns null only if product genuinely not found in region.
 */
async function extractCrealityRegionalPrice(
  url: string,
  region: string,
  productTitle: string,
  oldPrice: number | null | undefined,
  config?: BrandSyncConfig,
  usPriceForSanity?: number | null
): Promise<ExtractionResult> {
  const currency = CREALITY_CURRENCY_MAP[region] || 'USD';

  // Helper: validate extracted price against US price to catch accessory matches
  const validateAgainstUsPrice = (extractedPrice: number): 'ok' | 'too_low' | 'too_high' => {
    if (!usPriceForSanity || usPriceForSanity <= 0 || region === 'US') return 'ok';
    const exchangeRate = CREALITY_ROUGH_EXCHANGE_RATES[region];
    if (!exchangeRate) return 'ok';
    const expectedRegionalPrice = usPriceForSanity * exchangeRate;
    const ratio = extractedPrice / expectedRegionalPrice;
    console.log(`[Creality-Sanity] ${region}: extracted=${extractedPrice}, expected≈${expectedRegionalPrice.toFixed(0)}, ratio=${ratio.toFixed(3)}`);
    if (ratio < 0.15) return 'too_low';
    if (ratio > 5.0) return 'too_high';
    return 'ok';
  };

  // Step 1: Try JSON-LD on the custom storefront URL directly
  const html = await fetchHtml(url, region);
  if (html && html.length > 2000) {
    const jsonLdResult = extractFromJsonLd(html, region, config);
    if (jsonLdResult?.current_price && jsonLdResult.current_price > 0) {
      if (!currency || jsonLdResult.currency === currency || !jsonLdResult.currency) {
        const sanity = validateAgainstUsPrice(jsonLdResult.current_price);
        if (sanity === 'ok') {
          console.log(`[Creality] JSON-LD success on custom storefront: ${url} → ${jsonLdResult.current_price} ${jsonLdResult.currency}`);
          return applyAnomalyCheck(jsonLdResult, oldPrice, usPriceForSanity, currency);
        }
        if (sanity === 'too_high') {
          console.log(`[Creality-Sanity] Price too high (${jsonLdResult.current_price}), flagging for review`);
          return { ...applyAnomalyCheck(jsonLdResult, oldPrice, usPriceForSanity, currency), requires_review: true };
        }
        console.log(`[Creality-Sanity] Price too low (${jsonLdResult.current_price}), likely accessory — skipping`);
      }
    }
  }

  // Step 2: Discover handle + extract price via myshopify.com
  const shopifyDomain = CREALITY_MYSHOPIFY_MAP[region];
  const usSlug = url.match(/\/products\/([^/?#]+)/)?.[1] || null;

  // Try myshopify discovery first (returns handle + price for immediate validation)
  let discoveredHandle: string | null = null;
  if (shopifyDomain) {
    const discoveryResult = await discoverCrealityRegionalHandle(region, productTitle, usSlug);
    if (discoveryResult) {
      // Validate discovered price immediately against US price
      const discoverySanity = validateAgainstUsPrice(discoveryResult.price);
      if (discoverySanity === 'ok' || discoverySanity === 'too_high') {
        discoveredHandle = discoveryResult.handle;
        console.log(`[Creality] Discovery price validation passed: ${discoveryResult.price} (${discoverySanity})`);
      } else {
        console.warn(`[Creality] Rejecting myshopify match for "${productTitle}" in ${region}: price ${discoveryResult.price} is too low (likely accessory "${discoveryResult.handle}")`);
        // Don't use this handle — fall through to search
      }
    }
  }

  // Step 3: If myshopify discovery failed or was rejected, try custom storefront search
  if (!discoveredHandle) {
    console.log(`[Creality] myshopify discovery failed/rejected for "${productTitle}" in ${region}, trying storefront search...`);
    discoveredHandle = await discoverCrealityHandleViaSearch(region, productTitle);
  }

  if (!discoveredHandle) {
    if (!shopifyDomain) {
      console.log(`[Creality] No myshopify.com domain for region ${region} and search failed — marking not_in_region`);
    } else {
      console.log(`[Creality] Product "${productTitle}" not found in ${region} catalog or search — not_in_region`);
    }
    return {
      current_price: null, compare_at_price: null, currency: '',
      variant_name: null, extraction_method: 'not_in_region',
      confidence: 'high', raw_variants_found: 0, is_combo: false, requires_review: false,
    };
  }

  console.log(`[Creality] Discovered handle "${discoveredHandle}" for "${productTitle}" in ${region}`);

  // Step 4: Extract price directly from myshopify.com/{handle}.json (most reliable!)
  if (shopifyDomain) {
    const myShopifyResult = await extractFromMyShopifyDirect(shopifyDomain, discoveredHandle, region, config);
    if (myShopifyResult?.current_price && myShopifyResult.current_price > 0) {
      const sanity = validateAgainstUsPrice(myShopifyResult.current_price);
      if (sanity === 'ok') {
        myShopifyResult.discovered_slug = discoveredHandle;
        console.log(`[Creality] myshopify.com direct extraction: ${discoveredHandle} → ${myShopifyResult.current_price} ${myShopifyResult.currency}`);
        return applyAnomalyCheck(myShopifyResult, oldPrice, usPriceForSanity, currency);
      }
      if (sanity === 'too_high') {
        myShopifyResult.discovered_slug = discoveredHandle;
        console.log(`[Creality-Sanity] myshopify price too high (${myShopifyResult.current_price}), flagging for review`);
        return { ...applyAnomalyCheck(myShopifyResult, oldPrice, usPriceForSanity, currency), requires_review: true };
      }
      console.log(`[Creality-Sanity] myshopify price too low (${myShopifyResult.current_price}), likely accessory — trying next method`);
    }
  }

  // Step 5: Fallback — try JSON-LD on custom storefront with discovered handle
  const CREALITY_REGION_PATHS: Record<string, string> = {
    US: '', CA: '/ca', UK: '/uk', EU: '/eu', AU: '/au', JP: '/jp',
  };
  const regionPath = CREALITY_REGION_PATHS[region] || '';
  const discoveredUrl = `https://store.creality.com${regionPath}/products/${discoveredHandle}`;
  console.log(`[Creality] Trying JSON-LD on discovered URL: ${discoveredUrl}`);
  const retryHtml = await fetchHtml(discoveredUrl, region);
  if (retryHtml && retryHtml.length > 2000) {
    const retryResult = extractFromJsonLd(retryHtml, region, config);
    if (retryResult?.current_price && retryResult.current_price > 0) {
      const sanity = validateAgainstUsPrice(retryResult.current_price);
      if (sanity === 'ok') {
        retryResult.discovered_slug = discoveredHandle;
        return applyAnomalyCheck(retryResult, oldPrice, usPriceForSanity, currency);
      }
      if (sanity === 'too_high') {
        retryResult.discovered_slug = discoveredHandle;
        return { ...applyAnomalyCheck(retryResult, oldPrice, usPriceForSanity, currency), requires_review: true };
      }
      console.log(`[Creality-Sanity] JSON-LD retry price too low (${retryResult.current_price}), rejecting`);
    }
  }

  // Handle was found but price extraction failed — flag for review
  return {
    current_price: null, compare_at_price: null, currency,
    variant_name: null, extraction_method: 'manual' as const,
    confidence: 'low', raw_variants_found: 0, is_combo: false,
    requires_review: true, discovered_slug: discoveredHandle,
  };
}

/**
 * Extract price directly from myshopify.com JSON endpoint.
 * This bypasses the custom storefront entirely and is the most reliable method.
 */
async function extractFromMyShopifyDirect(
  shopifyDomain: string,
  handle: string,
  region: string,
  config?: BrandSyncConfig
): Promise<ExtractionResult | null> {
  try {
    const jsonUrl = `${shopifyDomain}/products/${handle}.json`;
    console.log(`[Creality-MyShopify] Fetching: ${jsonUrl}`);
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
      console.log(`[Creality-MyShopify] HTTP ${resp.status} for ${jsonUrl}`);
      await resp.text().catch(() => {});
      return null;
    }

    const data = await resp.json();
    const variants: ShopifyVariant[] = data?.product?.variants || [];
    if (variants.length === 0) return null;

    const normalized: NormalizedVariant[] = variants.map(v => ({
      name: v.title || '',
      price: parseFloat(v.price),
      compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
      available: v.available,
      id: v.id,
    })).filter(v => !isNaN(v.price) && v.price > 0);

    if (normalized.length === 0) return null;

    const selection = selectBestVariant(normalized, region, config);
    if (!selection) return null;

    const currency = CREALITY_CURRENCY_MAP[region] || 'USD';

    return {
      current_price: selection.variant.price,
      compare_at_price: selection.variant.compare_at_price,
      currency,
      variant_name: selection.variant.name,
      extraction_method: 'shopify_json',
      confidence: 'high',
      raw_variants_found: variants.length,
      is_combo: selection.is_combo,
      requires_review: false,
    };
  } catch (e) {
    console.error(`[Creality-MyShopify] Error:`, e);
    return null;
  }
}

/**
 * Discover a Creality product's regional handle via the myshopify.com backend catalog.
 * Uses strict matching to prevent short model names (K1, K2) from matching accessories.
 * Returns handle + price so callers can immediately validate the match.
 */
async function discoverCrealityRegionalHandle(
  region: string,
  productTitle: string,
  usSlug?: string | null
): Promise<{ handle: string; price: number } | null> {
  const shopifyDomain = CREALITY_MYSHOPIFY_MAP[region];
  if (!shopifyDomain) {
    console.log(`[Creality] No myshopify.com domain mapped for region ${region}`);
    return null;
  }

  try {
    console.log(`[Creality] Searching ${shopifyDomain} for "${productTitle}"`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const resp = await fetch(`${shopifyDomain}/products.json?limit=250`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FilaScope/1.0)',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      console.log(`[Creality] myshopify.com returned ${resp.status} for ${region}`);
      await resp.text().catch(() => {});
      return null;
    }

    const data = await resp.json();
    const products = data?.products;
    if (!Array.isArray(products) || products.length === 0) {
      console.log(`[Creality] No products found in ${region} catalog`);
      return null;
    }

    console.log(`[Creality] Found ${products.length} products in ${region} catalog`);

    // Normalize title for matching
    const normalize = (t: string) =>
      t.replace(/^creality\s+/i, '')
       .replace(/\s+3d\s+printer$/i, '')
       .replace(/\(.*?\)/g, '') // Remove parenthetical text like "(2025 Version)"
       .replace(/[🔥🎁🎀✨💥]/g, '')
       .replace(/\s+/g, ' ')
       .trim()
       .toLowerCase();

    const normalizedSearch = normalize(productTitle);

    // Strict exclusion filter: remove accessories, filament, bundles, etc.
    const EXCLUDE_KEYWORDS = /accessori|filament|nozzle|plate|enclosure|dryer|live exclusive|hub|upgrade|replacement|spare|cable|brush|bearing|belt|fan|sensor|hotend|heat.?break|extruder|tool|mat|sheet|glass|kit|mount|cover|tube|clip|screw|bolt|motor|wheel|pulley|rail|guide|adapter|connector|mod\b|part\b|component|extrusion|board|gear|screen|door|hotbed|heating.?block/i;

    // Filter out accessories by keyword, product_type, AND minimum price
    const printerProducts = products.filter((p: any) => {
      const title = p.title || '';
      if (EXCLUDE_KEYWORDS.test(title)) return false;

      // Check product_type — if present, must contain "Printer" or be empty
      const pType = (p.product_type || '').toLowerCase();
      if (pType && !pType.includes('printer') && !pType.includes('3d printer')) {
        // If product_type explicitly indicates non-printer, exclude
        if (pType.includes('accessory') || pType.includes('accessories') || pType.includes('filament') || pType.includes('part') || pType.includes('spare')) {
          console.log(`[Creality] Filtered out "${title}" — product_type="${p.product_type}"`);
          return false;
        }
      }

      // Check minimum price: at least one variant must be > $50 (printers cost more)
      const variants = p.variants || [];
      if (variants.length > 0) {
        const maxPrice = Math.max(...variants.map((v: any) => parseFloat(v.price) || 0));
        if (maxPrice < 50) {
          console.log(`[Creality] Filtered out "${title}" — max variant price ${maxPrice} < $50`);
          return false;
        }
      }
      return true;
    });

    // Sort printer products by price descending — actual printers cost more than accessories
    printerProducts.sort((a: any, b: any) => {
      const aPrice = Math.max(...(a.variants || []).map((v: any) => parseFloat(v.price) || 0));
      const bPrice = Math.max(...(b.variants || []).map((v: any) => parseFloat(v.price) || 0));
      return bPrice - aPrice;
    });

    console.log(`[Creality] ${printerProducts.length} printer products after filtering`);

    // Helper: build result from a matched product
    const buildResult = (product: any): { handle: string; price: number } => {
      const variants = product.variants || [];
      const price = variants.length > 0 ? parseFloat(variants[0].price) || 0 : 0;
      return { handle: product.handle, price };
    };

    // Step 1: Exact normalized title match
    for (const product of printerProducts) {
      const pTitle = normalize(product.title || '');
      if (pTitle === normalizedSearch) {
        console.log(`[Creality] Exact title match: "${product.title}" → handle "${product.handle}"`);
        return buildResult(product);
      }
    }

    // Step 1b: Try matching by US slug — handles often match across regions
    if (usSlug) {
      for (const product of printerProducts) {
        const pHandle = (product.handle || '').toLowerCase();
        if (pHandle === usSlug.toLowerCase()) {
          console.log(`[Creality] US slug match: "${usSlug}" found in ${region} catalog → handle "${product.handle}"`);
          return buildResult(product);
        }
      }
      // Also try slug without brand prefix
      const strippedSlug = usSlug.replace(/^creality-/i, '').toLowerCase();
      if (strippedSlug !== usSlug.toLowerCase()) {
        for (const product of printerProducts) {
          const pHandle = (product.handle || '').toLowerCase();
          if (pHandle === strippedSlug || pHandle === `creality-${strippedSlug}`) {
            console.log(`[Creality] Stripped US slug match: "${strippedSlug}" → handle "${product.handle}"`);
            return buildResult(product);
          }
        }
      }
      // Try partial slug match: US slug contains or is contained by regional handle
      for (const product of printerProducts) {
        const pHandle = (product.handle || '').toLowerCase();
        const usSlugLower = usSlug.toLowerCase();
        // Only match if the overlap is substantial (>60% of the longer string)
        if (pHandle.includes(usSlugLower) || usSlugLower.includes(pHandle)) {
          const longer = Math.max(pHandle.length, usSlugLower.length);
          const shorter = Math.min(pHandle.length, usSlugLower.length);
          if (shorter / longer >= 0.6) {
            console.log(`[Creality] Partial US slug match: US="${usSlug}" ↔ Regional="${product.handle}"`);
            return buildResult(product);
          }
        }
      }
    }

    // Step 2: For short names (≤4 chars like K1, K2, K1C), require very strict matching
    if (normalizedSearch.length <= 4) {
      const searchSlug = normalizedSearch.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      for (const product of printerProducts) {
        const pHandle = (product.handle || '').toLowerCase();
        if (pHandle === searchSlug ||
            pHandle === `${searchSlug}-3d-printer` ||
            pHandle === `creality-${searchSlug}-3d-printer` ||
            pHandle === `creality-${searchSlug}`) {
          console.log(`[Creality] Exact handle match for short name: "${product.handle}"`);
          return buildResult(product);
        }
      }
      // Also try: short name as a standalone word in the title, but ONLY if product_type says "Printer"
      for (const product of printerProducts) {
        const pTitle = normalize(product.title || '');
        const pType = (product.product_type || '').toLowerCase();
        const shortRegex = new RegExp(`\\b${normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (shortRegex.test(pTitle) && pType.includes('printer')) {
          console.log(`[Creality] Short name word-boundary match with printer product_type: "${product.title}" → "${product.handle}"`);
          return buildResult(product);
        }
      }
      console.log(`[Creality] Short name "${normalizedSearch}" — no exact match found, skipping fuzzy`);
      return null;
    }

    // Step 3: Word-boundary match for longer names (≥5 chars)
    const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchWordBoundary = new RegExp(`\\b${escapedSearch}\\b`, 'i');
    for (const product of printerProducts) {
      const pTitle = normalize(product.title || '');
      if (searchWordBoundary.test(pTitle) && normalizedSearch.length >= pTitle.length * 0.5) {
        console.log(`[Creality] Word-boundary match: "${product.title}" → handle "${product.handle}"`);
        return buildResult(product);
      }
    }

    // Step 4: Handle-based exact match
    const searchSlug = normalizedSearch.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    for (const product of printerProducts) {
      const pHandle = (product.handle || '').toLowerCase();
      if (pHandle === searchSlug ||
          pHandle === `creality-${searchSlug}` ||
          pHandle === `${searchSlug}-3d-printer` ||
          pHandle === `creality-${searchSlug}-3d-printer`) {
        console.log(`[Creality] Handle match: "${product.handle}" for search "${searchSlug}"`);
        return buildResult(product);
      }
    }

    console.log(`[Creality] No match found for "${productTitle}" in ${products.length} ${region} products`);
    return null;
  } catch (e) {
    console.error(`[Creality] Handle discovery error for ${region}:`, e);
    return null;
  }
}

/**
 * Discover a Creality product's handle via the custom storefront's search page.
 * This catches products that exist on the storefront but NOT in myshopify.com catalogs.
 */
async function discoverCrealityHandleViaSearch(
  region: string,
  productTitle: string
): Promise<string | null> {
  const CREALITY_REGION_PATHS: Record<string, string> = {
    US: '', CA: '/ca', UK: '/uk', EU: '/eu', AU: '/au', JP: '/jp',
  };
  const regionPath = CREALITY_REGION_PATHS[region];
  if (regionPath === undefined) return null;

  try {
    // Clean the search query — strip "3D Printer" suffix for better results
    const searchQuery = productTitle
      .replace(/\s+3d\s+printer$/i, '')
      .replace(/^creality\s+/i, '')
      .trim();

    const searchUrl = `https://store.creality.com${regionPath}/search?q=${encodeURIComponent(searchQuery)}`;
    console.log(`[Creality-Search] Fetching: ${searchUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const resp = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      console.log(`[Creality-Search] HTTP ${resp.status}`);
      await resp.text().catch(() => {});
      return null;
    }

    const html = await resp.text();

    // Parse product links from search results
    // Pattern: href="/{region}/products/{handle}" or href="/products/{handle}"
    const linkPattern = regionPath
      ? new RegExp(`href=["']${regionPath.replace('/', '\\/')}\\/products\\/([^"'?#]+)["']`, 'gi')
      : /href=["']\/products\/([^"'?#]+)["']/gi;

    const handles: string[] = [];
    let match;
    while ((match = linkPattern.exec(html)) !== null) {
      const handle = match[1].toLowerCase();
      if (!handles.includes(handle)) handles.push(handle);
    }

    if (handles.length === 0) {
      console.log(`[Creality-Search] No product links found in search results`);
      return null;
    }

    console.log(`[Creality-Search] Found ${handles.length} product handles: ${handles.slice(0, 5).join(', ')}`);

    // Match: find the handle whose associated context best matches the product title
    const normalizedSearch = productTitle
      .replace(/^creality\s+/i, '')
      .replace(/\s+3d\s+printer$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    // Exclusion filter for search results too
    const SEARCH_EXCLUDE = /accessori|filament|nozzle|plate|enclosure|dryer|kit|mount|cover|tube|clip|screw|bolt|motor|wheel|pulley|rail|guide|adapter|extrusion/i;

    for (const handle of handles) {
      if (SEARCH_EXCLUDE.test(handle)) continue;
      // Check if the handle contains the key model words
      const handleWords = handle.replace(/-/g, ' ').toLowerCase();
      const searchWords = normalizedSearch.split(/\s+/);
      const matchingWords = searchWords.filter(w => w.length >= 2 && handleWords.includes(w));
      // Require at least 60% of search words to match
      if (matchingWords.length >= Math.ceil(searchWords.length * 0.6)) {
        console.log(`[Creality-Search] Best match: "${handle}" (${matchingWords.length}/${searchWords.length} words matched)`);
        return handle;
      }
    }

    // Fallback: if search query is very short (e.g., "K1"), require exact word boundary match in handle
    if (normalizedSearch.length <= 4) {
      const searchSlug = normalizedSearch.replace(/[^a-z0-9]+/g, '-');
      for (const handle of handles) {
        if (SEARCH_EXCLUDE.test(handle)) continue;
        if (handle === searchSlug ||
            handle === `${searchSlug}-3d-printer` ||
            handle === `creality-${searchSlug}-3d-printer` ||
            handle === `creality-${searchSlug}`) {
          console.log(`[Creality-Search] Exact handle match for short name: "${handle}"`);
          return handle;
        }
      }
    }

    console.log(`[Creality-Search] No matching handle found for "${productTitle}"`);
    return null;
  } catch (e) {
    console.error(`[Creality-Search] Error:`, e);
    return null;
  }
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
  oldPrice?: number | null,
  usPriceForSanity?: number | null,
  expectedCurrency?: string
): ExtractionResult {
  let anomaly_severity: 'critical' | 'warning' | null = null;
  let anomaly_reason: string | null = null;

  // Per-currency sanity check
  if (result.current_price && result.current_price > 0 && result.currency) {
    if (!validatePrinterPrice(result.current_price, result.currency)) {
      console.error(`Price ${result.current_price} ${result.currency} outside valid range — flagging for review`);
      return {
        ...result,
        confidence: 'low',
        requires_review: true,
        anomaly_severity: 'warning',
        anomaly_reason: `Price ${result.current_price} ${result.currency} outside valid range for this currency`,
      };
    }
  }

  // Cross-region anomaly detection: compare regional price to US price
  if (result.current_price && result.current_price > 0 && usPriceForSanity && usPriceForSanity > 0) {
    const currency = expectedCurrency || result.currency;
    const rate = TO_USD_RATE[currency];
    if (rate) {
      const equivalentUsd = result.current_price * rate;
      const ratio = equivalentUsd / usPriceForSanity;

      if (ratio < 0.15) {
        anomaly_severity = 'critical';
        anomaly_reason = `Price ${currency}${result.current_price} (~$${equivalentUsd.toFixed(0)}) is only ${(ratio * 100).toFixed(0)}% of US price $${usPriceForSanity} — likely matched wrong product (accessory?)`;
        console.error(`[AnomalyCheck] CRITICAL: ${anomaly_reason}`);
        return {
          ...result,
          confidence: 'low',
          requires_review: true,
          anomaly_severity,
          anomaly_reason,
        };
      } else if (ratio < 0.30) {
        anomaly_severity = 'warning';
        anomaly_reason = `Price ${currency}${result.current_price} (~$${equivalentUsd.toFixed(0)}) is ${(ratio * 100).toFixed(0)}% of US price $${usPriceForSanity} — unusually low`;
        console.warn(`[AnomalyCheck] WARNING: ${anomaly_reason}`);
      } else if (ratio > 3.0) {
        anomaly_severity = 'warning';
        anomaly_reason = `Price ${currency}${result.current_price} (~$${equivalentUsd.toFixed(0)}) is ${(ratio * 100).toFixed(0)}% of US price $${usPriceForSanity} — unusually high`;
        console.warn(`[AnomalyCheck] WARNING: ${anomaly_reason}`);
      }
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
        anomaly_severity: anomaly_severity || 'warning',
        anomaly_reason: anomaly_reason || `Price changed by ${changePercent.toFixed(0)}% from previous value $${oldPrice}`,
      };
    }
  }

  return {
    ...result,
    anomaly_severity,
    anomaly_reason,
    requires_review: result.requires_review || anomaly_severity === 'warning',
  };
}
