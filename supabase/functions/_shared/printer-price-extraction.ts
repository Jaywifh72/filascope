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
  extraction_method: 'shopify_json' | 'json_ld_product' | 'json_ld_product_group' | 'meta_tags' | 'manual' | 'geo_blocked' | 'not_in_region';
  confidence: 'high' | 'medium' | 'low';
  raw_variants_found: number;
  is_combo: boolean;
  requires_review: boolean;
  /** The slug that actually worked (may differ from URL slug if discovery was used) */
  discovered_slug?: string;
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

// Creality myshopify.com backend domains for handle discovery
const CREALITY_MYSHOPIFY_MAP: Record<string, string> = {
  US: 'https://crealityusa.myshopify.com',
  CA: 'https://crealityca.myshopify.com',
  UK: 'https://crealityuk.myshopify.com',
  EU: 'https://crealityeu.myshopify.com',
  AU: 'https://crealityau.myshopify.com',
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
  } catch {
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
  productTitle?: string
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
          return applyAnomalyCheck(result, oldPrice);
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
            return applyAnomalyCheck(result, oldPrice);
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
                return applyAnomalyCheck(mdResult, oldPrice);
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
              return applyAnomalyCheck(result, oldPrice);
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
        return applyAnomalyCheck(mdResult, oldPrice);
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

  // Creality handle discovery: if JSON-LD failed on custom storefront,
  // try discovering the correct regional handle via myshopify.com backend
  if (isCrealityUrl(url) && region && region !== 'US' && productTitle) {
    console.log(`[Creality] JSON-LD failed for ${url}, attempting handle discovery via myshopify.com`);
    const discoveredHandle = await discoverCrealityRegionalHandle(region, productTitle);
    if (discoveredHandle) {
      // Rebuild URL with discovered handle
      const newUrl = url.replace(/\/products\/[^/?#]+/, `/products/${discoveredHandle}`);
      console.log(`[Creality] Discovered handle "${discoveredHandle}", retrying: ${newUrl}`);
      
      // Retry HTML fetch + JSON-LD with new URL
      const retryHtml = await fetchHtml(newUrl, region);
      if (retryHtml) {
        const retryResult = extractFromJsonLd(retryHtml, region, config);
        if (retryResult?.current_price && retryResult.current_price > 0) {
          retryResult.discovered_slug = discoveredHandle;
          return applyAnomalyCheck(retryResult, oldPrice);
        }
      }
      // Even if JSON-LD retry failed, still cache the discovered handle
      return {
        current_price: null,
        compare_at_price: null,
        currency: expectedCurrency || '',
        variant_name: null,
        extraction_method: 'manual' as const,
        confidence: 'low',
        raw_variants_found: 0,
        is_combo: false,
        requires_review: true,
        discovered_slug: discoveredHandle,
      };
    } else {
      // Handle not found in regional catalog — product doesn't exist in this region
      console.log(`[Creality] Product "${productTitle}" not found in ${region} catalog — marking not_in_region`);
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
 * Discover a Creality product's regional handle via the myshopify.com backend catalog.
 * Creality's custom storefront blocks /products.json, but the underlying Shopify stores
 * at crealityXX.myshopify.com expose the full catalog.
 */
async function discoverCrealityRegionalHandle(
  region: string,
  productTitle: string
): Promise<string | null> {
  const shopifyDomain = CREALITY_MYSHOPIFY_MAP[region];
  if (!shopifyDomain) {
    console.log(`[Creality] No myshopify.com domain mapped for region ${region}`);
    return null;
  }

  try {
    console.log(`[Creality] Searching ${shopifyDomain} for "${productTitle}"`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    // Fetch up to 250 products from the myshopify.com catalog
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
       .replace(/\s+/g, ' ')
       .trim()
       .toLowerCase();

    const normalizedSearch = normalize(productTitle);

    // Filter out non-printer products (accessories, bundles, filament, etc.)
    const EXCLUDE_KEYWORDS = /accessori|filament|nozzle|plate|enclosure|dryer|live exclusive|hub|upgrade|replacement|spare/i;
    const printerProducts = products.filter((p: any) => !EXCLUDE_KEYWORDS.test(p.title || ''));

    console.log(`[Creality] ${printerProducts.length} printer products after filtering`);

    // Try exact normalized match first
    for (const product of printerProducts) {
      const pTitle = normalize(product.title || '');
      if (pTitle === normalizedSearch) {
        console.log(`[Creality] Exact title match: "${product.title}" → handle "${product.handle}"`);
        return product.handle;
      }
    }

    // Try word-boundary contains: the search must appear as a complete word sequence
    // This prevents "K1" from matching "K1 MAX" or "K1C"
    const searchWordBoundary = new RegExp(`\\b${normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    for (const product of printerProducts) {
      const pTitle = normalize(product.title || '');
      // The catalog title must contain the search as a whole-word match
      // AND the search must be at least 50% of the catalog title length (prevents matching long unrelated titles)
      if (searchWordBoundary.test(pTitle) && normalizedSearch.length >= pTitle.length * 0.4) {
        console.log(`[Creality] Word-boundary match: "${product.title}" → handle "${product.handle}"`);
        return product.handle;
      }
    }

    // Try handle-based exact match (slugify search and compare directly)
    const searchSlug = normalizedSearch.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    for (const product of printerProducts) {
      const pHandle = (product.handle || '').toLowerCase();
      // Require exact slug match or the handle to start/end with the search slug
      if (pHandle === searchSlug || 
          pHandle === `creality-${searchSlug}` ||
          pHandle === `${searchSlug}-3d-printer`) {
        console.log(`[Creality] Exact handle match: "${product.handle}" for search "${searchSlug}"`);
        return product.handle;
      }
    }

    console.log(`[Creality] No match found for "${productTitle}" in ${products.length} ${region} products`);
    return null;
  } catch (e) {
    console.error(`[Creality] Handle discovery error for ${region}:`, e);
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
