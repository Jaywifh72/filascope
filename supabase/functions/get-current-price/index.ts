import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getRegionHeaders, getSpoofedHeaders, isGeoRedirectDomain, isGeoRedirect, detectRegionFromUrl, type FetchMethod } from "../_shared/regional-fetch.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  available: boolean;
  compare_at_price: string | null;
  grams?: number;
}

interface ShopifyProduct {
  product: {
    id: number;
    title: string;
    variants: ShopifyVariant[];
  };
}

// Stock status types for granular reporting
type StockStatus = 'in_stock' | 'out_of_stock' | 'low_stock' | 'preorder' | 'unknown';

interface PriceResponse {
  success: boolean;
  price: number | null;
  compareAtPrice: number | null;
  weightGrams: number | null;
  diameterMm: number | null;
  variantTitle: string | null;
  currency: string;
  available: boolean;
  stockStatus?: StockStatus; // Granular stock status for UI display
  source: 'shopify' | 'firecrawl' | 'html' | 'cached';
  fetchedAt: string;
  error?: string;
  is404?: boolean; // Indicates product page not found
  refreshedAt?: string; // ISO timestamp when forceRefresh was used
  // New fields for currency validation
  sourceUrl?: string; // The actual URL that was scraped (may differ from input after regional transformation)
  detectedCurrency?: string; // Currency detected from page content (may differ from expected)
  currencyMismatch?: boolean; // True if detected currency doesn't match expected
  requestedCurrency?: string; // The currency the caller requested
}

interface BrandExtractionConfig {
  priceSectionAnchor?: string;
  pricePatterns?: string[];
  excludePatterns?: string[];
  priceRangeMin?: number;
  priceRangeMax?: number;
  currencyDetection?: string;
}

interface BrandConfig {
  id: string;
  brand_slug: string;
  brand_name: string;
  base_url: string;
  extraction_method: string;
  price_extraction_config: BrandExtractionConfig;
  extraction_working: boolean;
  default_currency: string | null;
}

// Regional store URL patterns for major brands
interface RegionalStoreConfig {
  pattern: 'subdomain' | 'path' | 'global';
  baseDomain: string;
  regions: Record<string, { subdomain?: string; pathPrefix?: string; domain?: string; currency: string }>;
  fallbackRegion?: string;
}

const REGIONAL_STORE_CONFIGS: Record<string, RegionalStoreConfig> = {
  'bambulab': {
    pattern: 'subdomain',
    baseDomain: 'store.bambulab.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'us', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
      JP: { subdomain: 'jp', currency: 'JPY' },
    }
  },
  'polymaker': {
    pattern: 'subdomain',
    baseDomain: 'polymaker.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'us', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },
  'elegoo': {
    pattern: 'subdomain',
    baseDomain: 'elegoo.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'us', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
    }
  },
  'anycubic': {
    pattern: 'subdomain',
    baseDomain: 'anycubic.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'store', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { domain: 'www.anycubic.au', currency: 'AUD' },
    }
  },
  'creality': {
    pattern: 'subdomain',
    baseDomain: 'store.creality.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'us', currency: 'USD' },
    }
  },
};

// Currency to region code mapping
const CURRENCY_TO_REGION: Record<string, string> = {
  'USD': 'US',
  'CAD': 'CA',
  'GBP': 'UK',
  'EUR': 'EU',
  'AUD': 'AU',
  'JPY': 'JP',
  'CNY': 'CN',
};

// Transform URL to regional store URL based on currency
function transformToRegionalUrl(url: string, requestedCurrency: string): { url: string; expectedCurrency: string; transformed: boolean } {
  const urlLower = url.toLowerCase();
  const regionCode = CURRENCY_TO_REGION[requestedCurrency] || 'US';
  
  // Find matching brand config
  for (const [brandKey, config] of Object.entries(REGIONAL_STORE_CONFIGS)) {
    if (!urlLower.includes(config.baseDomain.toLowerCase())) continue;
    
    // Check if the URL already matches a regional store — if so, keep it and use that region's currency
    try {
      const urlObj = new URL(url);
      const currentHost = urlObj.hostname.toLowerCase();
      for (const [regionKey, regionCfg] of Object.entries(config.regions)) {
        const rc = regionCfg as { subdomain?: string; domain?: string; currency: string };
        if (rc.domain && currentHost === rc.domain.toLowerCase()) {
          // URL already on a full-domain regional store (e.g. anycubic.au)
          console.log(`URL already on ${regionKey} regional store (${currentHost}), keeping as-is`);
          return { url, expectedCurrency: rc.currency, transformed: false };
        }
        if (rc.subdomain) {
          const expectedHost = `${rc.subdomain}.${config.baseDomain}`.toLowerCase();
          if (currentHost === expectedHost && regionKey !== regionCode) {
            // URL is on a different region's subdomain than requested — keep URL, use its native currency
            console.log(`URL already on ${regionKey} regional store (${currentHost}), keeping as-is with currency ${rc.currency}`);
            return { url, expectedCurrency: rc.currency, transformed: false };
          }
        }
      }
    } catch (_) { /* ignore parse errors, proceed with transformation */ }
    
    const regionConfig = config.regions[regionCode];
    if (!regionConfig) {
      // No regional store for this region, use fallback
      const fallbackConfig = config.regions[config.fallbackRegion || 'US'];
      console.log(`No ${regionCode} regional store for ${brandKey}, using fallback`);
      return { url, expectedCurrency: fallbackConfig?.currency || 'USD', transformed: false };
    }
    
    try {
      const urlObj = new URL(url);
      const originalHost = urlObj.hostname;
      
      if (config.pattern === 'subdomain') {
        // Replace subdomain: us.store.bambulab.com -> eu.store.bambulab.com
        if (regionConfig.domain) {
          // Full domain replacement (e.g., anycubic.au)
          urlObj.hostname = regionConfig.domain;
        } else if (regionConfig.subdomain) {
          // Subdomain replacement
          const hostParts = originalHost.split('.');
          if (hostParts.length >= 3) {
            hostParts[0] = regionConfig.subdomain;
          } else {
            hostParts.unshift(regionConfig.subdomain);
          }
          urlObj.hostname = hostParts.join('.');
        }
        
        const newUrl = urlObj.toString();
        if (newUrl !== url) {
          console.log(`Regional URL transformation: ${url} -> ${newUrl}`);
          return { url: newUrl, expectedCurrency: regionConfig.currency, transformed: true };
        }
      }
      // Add path prefix pattern handling here if needed
      
    } catch (e) {
      console.error('URL transformation error:', e);
    }
    
    return { url, expectedCurrency: regionConfig.currency, transformed: false };
  }
  
  // No transformation needed (global store or unknown brand)
  return { url, expectedCurrency: requestedCurrency, transformed: false };
}

// Detect currency from scraped page content
function detectCurrencyFromContent(markdown: string): string | null {
  // Look for explicit currency indicators
  const currencyPatterns: [RegExp, string][] = [
    [/\$[\d,]+(?:\.\d{2})?\s*EUR/i, 'EUR'],
    [/\€[\d,]+(?:\.\d{2})?/g, 'EUR'],
    [/EUR\s*\$?[\d,]+(?:\.\d{2})?/i, 'EUR'],
    [/\$[\d,]+(?:\.\d{2})?\s*CAD/i, 'CAD'],
    [/CA\$[\d,]+(?:\.\d{2})?/g, 'CAD'],
    [/CAD\s*\$?[\d,]+(?:\.\d{2})?/i, 'CAD'],
    [/\$[\d,]+(?:\.\d{2})?\s*GBP/i, 'GBP'],
    [/£[\d,]+(?:\.\d{2})?/g, 'GBP'],
    [/GBP\s*\$?[\d,]+(?:\.\d{2})?/i, 'GBP'],
    [/\$[\d,]+(?:\.\d{2})?\s*AUD/i, 'AUD'],
    [/AU\$[\d,]+(?:\.\d{2})?/g, 'AUD'],
    [/AUD\s*\$?[\d,]+(?:\.\d{2})?/i, 'AUD'],
    [/¥[\d,]+/g, 'JPY'], // Could also be CNY, context needed
    [/\$[\d,]+(?:\.\d{2})?\s*JPY/i, 'JPY'],
    [/JPY\s*\$?[\d,]+/i, 'JPY'],
    [/\$[\d,]+(?:\.\d{2})?\s*USD/i, 'USD'],
    [/US\$[\d,]+(?:\.\d{2})?/g, 'USD'],
  ];
  
  // Count currency occurrences
  const currencyCounts: Record<string, number> = {};
  
  for (const [pattern, currency] of currencyPatterns) {
    const matches = markdown.match(pattern);
    if (matches) {
      currencyCounts[currency] = (currencyCounts[currency] || 0) + matches.length;
    }
  }
  
  // Return the most common currency, or null if only $ with no currency code
  const entries = Object.entries(currencyCounts);
  if (entries.length === 0) return null;
  
  entries.sort((a, b) => b[1] - a[1]);
  const [topCurrency, topCount] = entries[0];
  
  // Only return if we have reasonable confidence
  if (topCount >= 2) {
    console.log(`Detected currency from content: ${topCurrency} (${topCount} occurrences)`);
    return topCurrency;
  }
  
  return null;
}

// Initialize Supabase client for brand config lookup
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseKey);
}

// Extract domain from URL for brand matching
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Find brand config based on URL domain
async function findBrandConfigByUrl(url: string): Promise<BrandConfig | null> {
  const domain = extractDomain(url);
  if (!domain) return null;
  
  const supabase = getSupabaseClient();
  
  // Query automated_brands table for matching base_url
  const { data, error } = await supabase
    .from('automated_brands')
    .select('id, brand_slug, brand_name, base_url, extraction_method, price_extraction_config, extraction_working, default_currency')
    .eq('is_visible', true)
    .order('brand_name');
  
  if (error || !data) {
    console.log('Error fetching brand configs:', error);
    return null;
  }
  
  // Find matching brand by domain
  const brand = data.find(b => {
    const brandDomain = extractDomain(b.base_url);
    return domain.includes(brandDomain) || brandDomain.includes(domain);
  });
  
  return brand || null;
}

// Log extraction attempt to database
async function logExtractionAttempt(
  brandId: string | null,
  brandSlug: string | null,
  productUrl: string,
  method: string,
  success: boolean,
  price: number | null,
  currency: string,
  errorMessage: string | null,
  rawSample: string | null,
  responseTimeMs: number
) {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('price_extraction_logs').insert({
      brand_id: brandId,
      brand_slug: brandSlug,
      product_url: productUrl,
      extraction_method: method,
      success,
      extracted_price: price,
      currency,
      error_message: errorMessage,
      raw_content_sample: rawSample?.substring(0, 500),
      response_time_ms: responseTimeMs,
    });
  } catch (err) {
    console.error('Failed to log extraction attempt:', err);
  }
}

// Rate limit manual refreshes: 1 per URL per minute (only successful extractions count)
async function canForceRefresh(productUrl: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('price_extraction_logs')
    .select('id')
    .eq('product_url', productUrl)
    .eq('extraction_method', 'manual_refresh')
    .eq('success', true)
    .gte('created_at', oneMinuteAgo)
    .limit(1);
  
  // Allow if no recent SUCCESSFUL manual refresh (failed extractions can be retried immediately)
  return !data || data.length === 0;
}

// Log broken URL (404) to database for admin review
async function logBrokenUrl(
  productUrl: string,
  errorType: string
) {
  try {
    const supabase = getSupabaseClient();
    const storeDomain = extractDomain(productUrl);
    
    // Upsert to handle duplicates - increment detection count
    const { data: existing } = await supabase
      .from('broken_product_urls')
      .select('id, detection_count')
      .eq('product_url', productUrl)
      .maybeSingle();
    
    if (existing) {
      // Update existing record
      await supabase
        .from('broken_product_urls')
        .update({
          detection_count: (existing.detection_count || 1) + 1,
          last_detected_at: new Date().toISOString(),
          error_type: errorType,
        })
        .eq('id', existing.id);
      console.log(`Updated broken URL record for: ${productUrl} (count: ${(existing.detection_count || 1) + 1})`);
    } else {
      // Insert new record
      await supabase
        .from('broken_product_urls')
        .insert({
          product_url: productUrl,
          store_domain: storeDomain,
          error_type: errorType,
          detection_count: 1,
          detected_at: new Date().toISOString(),
          last_detected_at: new Date().toISOString(),
        });
      console.log(`Logged new broken URL: ${productUrl}`);
    }
  } catch (err) {
    console.error('Failed to log broken URL:', err);
  }
}

// Check if a redirect URL is a valid product page (not homepage/category)
function isValidProductRedirect(originalUrl: string, newUrl: string): boolean {
  // Must be same domain
  const originalDomain = extractDomain(originalUrl);
  const newDomain = extractDomain(newUrl);
  if (originalDomain !== newDomain) {
    console.log(`Redirect to different domain rejected: ${newDomain}`);
    return false;
  }
  
  try {
    const newUrlObj = new URL(newUrl);
    const path = newUrlObj.pathname.toLowerCase();
    
    // Reject if redirected to homepage
    if (path === '/' || path === '') {
      console.log('Redirect to homepage rejected');
      return false;
    }
    
    // Reject common category/collection pages
    const categoryPatterns = [
      /^\/collections?\/?$/i,
      /^\/products?\/?$/i,
      /^\/shop\/?$/i,
      /^\/category\/?$/i,
      /^\/categories\/?$/i,
      /^\/search\/?$/i,
      /^\/filament\/?$/i,
      /^\/filaments?\/?$/i,
    ];
    
    if (categoryPatterns.some(p => p.test(path))) {
      console.log(`Redirect to category page rejected: ${path}`);
      return false;
    }
    
    // Likely a valid product page if it has product-like path structure
    const productPatterns = [
      /\/products?\//i,
      /\/p\//i,
      /\/item\//i,
      /-filament/i,
      /filament-/i,
    ];
    
    // If path looks like a product page or is just different, accept it
    return true;
  } catch {
    return false;
  }
}

// Auto-update filament URL when a valid redirect is detected
async function handleUrlRedirect(
  originalUrl: string,
  newUrl: string
): Promise<boolean> {
  try {
    // Validate the redirect
    if (!isValidProductRedirect(originalUrl, newUrl)) {
      console.log(`Invalid redirect rejected: ${originalUrl} -> ${newUrl}`);
      return false;
    }
    
    const supabase = getSupabaseClient();
    
    // Update filament(s) with the old URL to use the new URL
    const { data: updated, error } = await supabase
      .from('filaments')
      .update({ 
        product_url: newUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('product_url', originalUrl)
      .select('id, product_title');
    
    if (error) {
      console.error('Failed to update filament URL:', error);
      return false;
    }
    
    if (updated && updated.length > 0) {
      console.log(`Auto-updated ${updated.length} filament(s) URL: ${originalUrl} -> ${newUrl}`);
      
      // If there was a broken_product_urls record, mark it as resolved
      await supabase
        .from('broken_product_urls')
        .update({
          resolved_at: new Date().toISOString(),
          new_url: newUrl,
          notes: 'Auto-resolved via redirect detection',
        })
        .eq('product_url', originalUrl);
      
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('Error handling URL redirect:', err);
    return false;
  }
}

// ===== AUTO-RESOLUTION SYSTEM FOR 404 PRODUCT URLs =====

// Store search URL patterns - maps domains to search URL builders
const STORE_SEARCH_PATTERNS: Record<string, (query: string) => string> = {
  // Major stores with known search patterns
  'store.creality.com': (q) => `https://store.creality.com/search?q=${encodeURIComponent(q)}`,
  'us.store.bambulab.com': (q) => `https://us.store.bambulab.com/search?q=${encodeURIComponent(q)}`,
  'store.bambulab.com': (q) => `https://store.bambulab.com/search?q=${encodeURIComponent(q)}`,
  'www.prusa3d.com': (q) => `https://www.prusa3d.com/search/?s=${encodeURIComponent(q)}`,
  'prusa3d.com': (q) => `https://www.prusa3d.com/search/?s=${encodeURIComponent(q)}`,
  'us.polymaker.com': (q) => `https://us.polymaker.com/search?q=${encodeURIComponent(q)}`,
  'polymaker.com': (q) => `https://polymaker.com/search?q=${encodeURIComponent(q)}`,
  'www.esun3d.com': (q) => `https://www.esun3d.com/search?keyword=${encodeURIComponent(q)}`,
  'esun3d.com': (q) => `https://www.esun3d.com/search?keyword=${encodeURIComponent(q)}`,
  'overture3d.com': (q) => `https://overture3d.com/search?q=${encodeURIComponent(q)}`,
  'www.sunlu.com': (q) => `https://www.sunlu.com/search?q=${encodeURIComponent(q)}`,
  'sunlu.com': (q) => `https://www.sunlu.com/search?q=${encodeURIComponent(q)}`,
  'store.anycubic.com': (q) => `https://store.anycubic.com/search?q=${encodeURIComponent(q)}`,
  'www.elegoo.com': (q) => `https://www.elegoo.com/search?q=${encodeURIComponent(q)}`,
  'colorfabb.com': (q) => `https://colorfabb.com/search?q=${encodeURIComponent(q)}`,
  'fillamentum.com': (q) => `https://fillamentum.com/search?q=${encodeURIComponent(q)}`,
  'atomicfilament.com': (q) => `https://atomicfilament.com/search?q=${encodeURIComponent(q)}`,
  'ninjatek.com': (q) => `https://ninjatek.com/search?q=${encodeURIComponent(q)}`,
  'www.proto-pasta.com': (q) => `https://www.proto-pasta.com/search?q=${encodeURIComponent(q)}`,
  'amolen.com': (q) => `https://amolen.com/search?q=${encodeURIComponent(q)}`,
  'fiberlogy.com': (q) => `https://fiberlogy.com/search?q=${encodeURIComponent(q)}`,
  'www.3dfuel.com': (q) => `https://www.3dfuel.com/search?q=${encodeURIComponent(q)}`,
  'voxelpla.com': (q) => `https://voxelpla.com/search?q=${encodeURIComponent(q)}`,
  'ziro3d.com': (q) => `https://ziro3d.com/search?q=${encodeURIComponent(q)}`,
};

// Get store search URL using patterns or generic Shopify fallback
function getStoreSearchUrl(domain: string, query: string): string {
  const pattern = STORE_SEARCH_PATTERNS[domain] || STORE_SEARCH_PATTERNS[domain.replace('www.', '')];
  if (pattern) return pattern(query);
  
  // Generic Shopify fallback (most e-commerce stores use /search?q=)
  return `https://${domain}/search?q=${encodeURIComponent(query)}`;
}

interface ProductMetadata {
  id: string;
  product_title: string;
  material: string | null;
  vendor: string | null;
  net_weight_g: number | null;
  product_url: string | null; // Include product_url for resolution
}

// Extract slug from URL for fuzzy matching
function extractSlugFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const segments = urlObj.pathname.split('/').filter(s => s && s !== 'products' && s !== 'product');
    return segments[segments.length - 1] || null;
  } catch {
    return null;
  }
}

// Fetch product metadata from database for search resolution
// Supports fuzzy matching when exact URL match fails
async function getProductMetadataByUrl(productUrl: string): Promise<ProductMetadata | null> {
  const supabase = getSupabaseClient();
  
  // Try exact match first
  const { data, error } = await supabase
    .from('filaments')
    .select('id, product_title, material, vendor, net_weight_g, product_url')
    .eq('product_url', productUrl)
    .limit(1);
  
  if (error) {
    console.log('Error fetching product metadata:', error.message);
    return null;
  }
  
  if (data && data.length > 0) {
    console.log(`Found exact match: "${data[0].product_title}" (${data[0].vendor})`);
    return data[0];
  }
  
  // Fuzzy match: extract slug from URL and search by ILIKE
  console.log('No exact URL match, trying fuzzy slug match...');
  const slug = extractSlugFromUrl(productUrl);
  
  if (slug && slug.length > 5) {
    console.log(`Searching for products with URL containing slug: "${slug}"`);
    
    const { data: fuzzyData, error: fuzzyError } = await supabase
      .from('filaments')
      .select('id, product_title, material, vendor, net_weight_g, product_url')
      .ilike('product_url', `%${slug}%`)
      .limit(5);
    
    if (fuzzyError) {
      console.log('Error in fuzzy search:', fuzzyError.message);
      return null;
    }
    
    if (fuzzyData && fuzzyData.length > 0) {
      // Return the best match (first one that contains our slug)
      console.log(`Found fuzzy match: "${fuzzyData[0].product_title}" via slug "${slug}"`);
      console.log(`Database URL: ${fuzzyData[0].product_url}`);
      return fuzzyData[0];
    }
  }
  
  console.log('No product metadata found for URL:', productUrl);
  return null;
}

// Build optimized search query from product metadata
function buildSearchQuery(product: ProductMetadata): string {
  // Start with product title
  let query = product.product_title;
  
  // Remove common suffixes that don't help search
  // NOTE: RFID is intentionally KEPT as it's a key product differentiator for Creality
  query = query
    .replace(/3D\s*Print(ing)?\s*Filament/gi, '')
    .replace(/\d+\s*[gG]\s*/g, '')  // Remove weight like "1000g"
    .replace(/\d+\s*[kK][gG]\s*/g, '') // Remove weight like "1kg"
    .replace(/\d+\.\d+\s*mm/gi, '') // Remove diameter like "1.75mm"
    // REMOVED: .replace(/RFID/gi, '') - RFID is important for Creality products
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Limit length for search - take first 6 meaningful words
  const words = query.split(' ').filter(w => w.length > 1).slice(0, 6);
  return words.join(' ');
}

// Common abbreviations used in product URLs
const URL_ABBREVIATIONS: Record<string, string[]> = {
  'cf': ['carbon', 'fiber', 'fibre'],
  'gf': ['glass', 'fiber', 'fibre'],
  'hs': ['high', 'speed'],
  'ht': ['high', 'temp', 'temperature'],
  'rf': ['rfid'],
  'abs': ['abs'],
  'pla': ['pla'],
  'petg': ['petg'],
  'tpu': ['tpu'],
  'asa': ['asa'],
  'pc': ['polycarbonate'],
  'pa': ['nylon', 'polyamide'],
  'pro': ['pro', 'professional'],
  'plus': ['plus'],
  'max': ['max', 'maximum'],
  'lite': ['lite', 'light'],
  'matte': ['matte', 'matt'],
  'silk': ['silk'],
};

// Calculate similarity score between URL and product title
function calculateUrlSimilarity(url: string, productTitle: string): number {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();
    
    // Extract slug from URL (last path segment after /products/ or similar)
    const segments = path.split('/').filter(s => s && !['products', 'product', 'p'].includes(s));
    const slug = segments[segments.length - 1] || '';
    
    console.log(`Similarity check: slug="${slug}" vs title="${productTitle}"`);
    
    // Split slug into words (by hyphens/underscores)
    const slugWords = slug.split(/[-_]/).filter(w => w.length > 0);
    
    // Expand abbreviations in slug
    const expandedSlugWords: string[] = [];
    for (const word of slugWords) {
      expandedSlugWords.push(word);
      if (URL_ABBREVIATIONS[word]) {
        expandedSlugWords.push(...URL_ABBREVIATIONS[word]);
      }
    }
    
    // Normalize product title to meaningful words
    const stopWords = ['the', 'and', 'for', '3d', 'printing', 'filament', 'with', 'from', 'series', '1kg', '500g'];
    const titleWords = productTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.includes(w));
    
    if (titleWords.length === 0) return 0;
    
    // Count matching words (with expanded abbreviations)
    let matches = 0;
    for (const titleWord of titleWords) {
      const matched = expandedSlugWords.some(sw => 
        sw === titleWord || 
        sw.includes(titleWord) || 
        titleWord.includes(sw) ||
        (sw.length >= 3 && titleWord.startsWith(sw)) ||
        (titleWord.length >= 3 && sw.startsWith(titleWord))
      );
      if (matched) {
        matches++;
        console.log(`  Match: "${titleWord}" matched in slug`);
      }
    }
    
    const score = matches / titleWords.length;
    console.log(`  Score: ${matches}/${titleWords.length} = ${(score * 100).toFixed(0)}%`);
    
    return score;
  } catch {
    return 0;
  }
}

// Check if we can attempt auto-fix (rate limit: 1 attempt per URL per 24h)
async function canAttemptAutoFix(productUrl: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('url_auto_fixes')
    .select('id')
    .eq('original_url', productUrl)
    .gte('fixed_at', oneDayAgo)
    .limit(1);
  
  // Allow if no recent attempts
  return !data || data.length === 0;
}

interface SearchResolutionResult {
  success: boolean;
  newUrl: string | null;
  score: number;
  method: 'search_resolution';
}

// Attempt to resolve 404 by searching the store for the product
async function attemptSearchResolution(
  productUrl: string,
  storeDomain: string
): Promise<SearchResolutionResult> {
  console.log('=== SEARCH RESOLUTION ATTEMPT ===');
  console.log('Product URL:', productUrl);
  console.log('Store domain:', storeDomain);
  
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlApiKey) {
    console.log('✗ No FIRECRAWL_API_KEY for search resolution');
    return { success: false, newUrl: null, score: 0, method: 'search_resolution' };
  }
  
  // Rate limit check
  const canAttempt = await canAttemptAutoFix(productUrl);
  if (!canAttempt) {
    console.log('✗ Rate limited: already attempted auto-fix for this URL in last 24h');
    return { success: false, newUrl: null, score: 0, method: 'search_resolution' };
  }
  console.log('✓ Rate limit check passed');
  
  // Step 1: Get product metadata
  console.log('Fetching product metadata from database...');
  const product = await getProductMetadataByUrl(productUrl);
  if (!product) {
    console.log('✗ No product metadata found - cannot resolve');
    return { success: false, newUrl: null, score: 0, method: 'search_resolution' };
  }
  console.log('✓ Found product:', product.product_title);
  
  // Step 2: Build search query
  const searchQuery = buildSearchQuery(product);
  console.log(`Search query for "${product.product_title}": "${searchQuery}"`);
  
  // Step 3: Get store search URL
  const searchUrl = getStoreSearchUrl(storeDomain, searchQuery);
  console.log('Searching store:', searchUrl);
  
  // Step 4: Scrape search results with Firecrawl
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['links'],
        waitFor: 3000,
      }),
    });
    
    if (!response.ok) {
      console.error('Firecrawl search failed:', response.status);
      return { success: false, newUrl: null, score: 0, method: 'search_resolution' };
    }
    
    const data = await response.json();
    const links: string[] = data.data?.links || data.links || [];
    
    console.log(`Search returned ${links.length} total links`);
    
    // Step 5: Filter to product links only (excluding the original AND database URLs)
    const baseDomain = storeDomain.replace('www.', '');
    const originalUrlLower = productUrl.toLowerCase();
    // Also exclude the database URL (which may differ from frontend URL due to regional variations)
    const databaseUrlLower = product.product_url?.toLowerCase() || '';
    
    const productLinks = links.filter(link => {
      try {
        const linkUrl = new URL(link);
        // Must be same domain
        if (!linkUrl.hostname.includes(baseDomain)) return false;
        
        const linkLower = link.toLowerCase();
        
        // CRITICAL: Exclude the original broken URL to prevent self-resolution loops
        if (linkLower === originalUrlLower) {
          console.log('Excluding original URL from candidates:', link);
          return false;
        }
        
        // Also exclude the database URL if different from the frontend URL
        if (databaseUrlLower && linkLower === databaseUrlLower) {
          console.log('Excluding database URL from candidates:', link);
          return false;
        }
        
        // Must contain product indicators
        const path = linkUrl.pathname.toLowerCase();
        return path.includes('/products/') || 
               path.includes('/product/') ||
               path.includes('/p/') ||
               path.includes('/shop/');
      } catch {
        return false;
      }
    });
    
    console.log(`Found ${productLinks.length} product links on search page (excluding original)`);
    
    if (productLinks.length === 0) {
      console.log('✗ No alternative product URLs found - product may be discontinued');
      return { success: false, newUrl: null, score: 0, method: 'search_resolution' };
    }
    
    // Step 6: Score each link
    const scoredLinks = productLinks.map(url => ({
      url,
      score: calculateUrlSimilarity(url, product.product_title),
    }));
    
    // Log top candidates for debugging
    const topCandidates = scoredLinks.sort((a, b) => b.score - a.score).slice(0, 5);
    console.log('Top URL candidates:', topCandidates.map(c => `${c.url} (${(c.score * 100).toFixed(0)}%)`));
    
    // Step 7: Get best match with score >= 0.5 (lowered threshold for better matching)
    const bestMatch = topCandidates.find(l => l.score >= 0.5);
    
    if (bestMatch) {
      console.log(`✓ Best match found: ${bestMatch.url} (score: ${(bestMatch.score * 100).toFixed(0)}%)`);
      return {
        success: true,
        newUrl: bestMatch.url,
        score: bestMatch.score,
        method: 'search_resolution',
      };
    }
    
    console.log('No matching product found with score >= 0.7');
    return { success: false, newUrl: null, score: 0, method: 'search_resolution' };
  } catch (err) {
    console.error('Search resolution error:', err);
    return { success: false, newUrl: null, score: 0, method: 'search_resolution' };
  }
}

// Handle 404 with auto-resolution attempt, then log and return 404 response
async function handle404WithResolution(
  productUrl: string,
  preferredCurrency: string,
  brandConfig: BrandConfig | null,
  source: 'shopify' | 'firecrawl',
  errorType: string
): Promise<PriceResponse & { rawSample?: string }> {
  console.log('=== 404 RESOLUTION STARTED ===');
  console.log('Original URL:', productUrl);
  console.log('Brand config:', brandConfig?.brand_name || 'none');
  
  const storeDomain = extractDomain(productUrl);
  console.log('Store domain:', storeDomain);
  
  const resolution = await attemptSearchResolution(productUrl, storeDomain);
  console.log('Resolution result:', JSON.stringify(resolution));
  
  if (resolution.success && resolution.newUrl) {
    const supabase = getSupabaseClient();
    
    // Get the filament ID before updating (for logging)
    const product = await getProductMetadataByUrl(productUrl);
    console.log('Product for URL update:', product?.id || 'not found');
    
    // Update the filament record with new URL
    const { error: updateError } = await supabase
      .from('filaments')
      .update({ 
        product_url: resolution.newUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('product_url', productUrl);
    
    if (!updateError) {
      console.log(`✓ Auto-resolved URL: ${productUrl} -> ${resolution.newUrl}`);
      
      // Log the auto-fix to audit table
      await supabase
        .from('url_auto_fixes')
        .insert({
          filament_id: product?.id || null,
          original_url: productUrl,
          new_url: resolution.newUrl,
          resolution_method: resolution.method,
          similarity_score: resolution.score,
        });
      
      // Mark broken URL as resolved if exists
      await supabase
        .from('broken_product_urls')
        .update({
          resolved_at: new Date().toISOString(),
          new_url: resolution.newUrl,
          notes: `Auto-resolved via ${resolution.method} (score: ${(resolution.score * 100).toFixed(0)}%)`,
        })
        .eq('product_url', productUrl);
      
      // Retry price fetch with the new URL (using Firecrawl to avoid recursive resolution)
      console.log(`Retrying price fetch with resolved URL: ${resolution.newUrl}`);
      return await fetchPriceWithFirecrawl(resolution.newUrl, preferredCurrency, brandConfig, true);
    } else {
      console.error('Failed to update filament URL:', updateError);
    }
  }
  
  // Resolution failed - log broken URL for manual review
  console.log('=== 404 RESOLUTION FAILED - logging for manual review ===');
  await logBrokenUrl(productUrl, errorType);
  
  return {
    success: false,
    price: null,
    compareAtPrice: null,
    weightGrams: null,
    diameterMm: null,
    variantTitle: null,
    currency: preferredCurrency,
    available: false,
    source,
    fetchedAt: new Date().toISOString(),
    error: 'PRODUCT_PAGE_NOT_FOUND',
    is404: true,
  };
}

// ===== END AUTO-RESOLUTION SYSTEM =====

// Check if content indicates a 404/not found page
function is404Content(markdown: string): boolean {
  // Check first 3000 chars (lowercased) for 404 indicators - increased for Creality's verbose pages
  const checkContent = markdown.substring(0, 3000).toLowerCase();
  
  console.log('is404Content checking content sample:', checkContent.substring(0, 200));
  
  // FIRST: Check for common store-specific redirect patterns that indicate missing product
  // Creality redirects to shopping bag page when product doesn't exist
  const hasShoppingBag = checkContent.includes('shopping bag');
  const hasEmpty = checkContent.includes('empty');
  console.log(`Creality 404 check: shopping bag=${hasShoppingBag}, empty=${hasEmpty}`);
  
  if (hasShoppingBag && hasEmpty) {
    console.log('✓ Detected 404: Creality redirect to empty shopping bag page');
    return true;
  }
  
  // Check for "Oops! Page not found" with various punctuation
  if (/oops[!?.\s]*page\s*not\s*found/i.test(checkContent)) {
    console.log('✓ Detected 404: Oops page not found');
    return true;
  }
  
  const notFoundPatterns = [
    /page\s*(not\s*found|doesn'?t\s*exist)/i,
    /\b404\b/i,  // Simplified: just look for "404" as a word
    /product\s*(not\s*found|has\s*been\s*(deleted|removed))/i,
    /this\s*page\s*(doesn'?t|does\s*not)\s*exist/i,
    /we\s*couldn'?t\s*find\s*(the|this)\s*page/i,
    /sorry[,!]?\s*(this|the)?\s*page\s*(is|was|has)/i,
    /item\s*(no\s*longer|not)\s*available/i,
    /product\s*(is\s*)?no\s*longer\s*available/i,
    /oops[!?.\s]*(page|something)/i,
    /your\s*shopping\s*bag\s*is\s*empty/i, // Alternative Creality pattern
  ];
  
  for (const pattern of notFoundPatterns) {
    if (pattern.test(checkContent)) {
      console.log(`✓ Detected 404: matched pattern ${pattern}`);
      return true;
    }
  }
  
  console.log('No 404 patterns detected');
  return false;
}

// Default patterns to exclude discount/savings amounts from price extraction
const DEFAULT_EXCLUDE_PATTERNS = [
  'save\\s+\\$',           // "Save $7.26"
  'saving\\s+\\$',         // "Saving $10"
  'discount\\s+\\$',       // "Discount $5"
  'off\\s+\\$',            // "off $20"
  'coupon\\s+.*\\$',       // "$500 coupon"
  '\\$\\d+\\s*off',        // "$5 off"
  '\\$\\d+\\s*coupon',     // "$500 coupon"
  'student\\s*discount',   // Student discount sections
];

// CRITICAL: Remove promotional patterns from text BEFORE extracting prices
// This prevents capturing savings amounts, coupon values, etc. as product prices
function removeSavingsAmounts(text: string): string {
  let cleaned = text;
  
  // CRITICAL: Remove entire promotional lines/sections FIRST (before any price extraction)
  // Remove lines containing "coupon pack" - e.g., "💵 $500 coupon pack for your order!"
  cleaned = cleaned.replace(/[^\n]*\$\d+[^\n]*coupon\s*pack[^\n]*/gi, ' ');
  // Remove lines containing "obtain" + dollar amount (promotional signup)
  cleaned = cleaned.replace(/[^\n]*obtain[^\n]*\$\d+[^\n]*/gi, ' ');
  // Remove lines with "Subscribe" and dollar amounts
  cleaned = cleaned.replace(/[^\n]*subscribe[^\n]*\$\d+[^\n]*/gi, ' ');
  // Remove student discount promotional lines
  cleaned = cleaned.replace(/[^\n]*student\s*discount[^\n]*\$\d+[^\n]*/gi, ' ');
  
  // CRITICAL FIX: Remove "Save $X.XX" patterns BEFORE extracting any prices
  // This ensures we don't pick up savings amounts like $15.26 as the product price
  // Must use [\d,.]+ to capture full decimal prices like $15.26
  cleaned = cleaned.replace(/Save\s+\$[\d,.]+/gi, ' ');
  cleaned = cleaned.replace(/Saving\s+\$[\d,.]+/gi, ' ');
  cleaned = cleaned.replace(/You\s+save\s+\$[\d,.]+/gi, ' ');
  cleaned = cleaned.replace(/Savings:?\s*\$[\d,.]+/gi, ' ');
  
  // Remove "$X off" patterns
  cleaned = cleaned.replace(/\$[\d,.]+\s+off\b/gi, ' ');
  cleaned = cleaned.replace(/\$[\d,.]+\s+discount/gi, ' ');
  cleaned = cleaned.replace(/\$[\d,.]+\s+coupon/gi, ' ');
  cleaned = cleaned.replace(/💵?\s*\$[\d,.]+\s*coupon\s*pack/gi, ' ');
  cleaned = cleaned.replace(/💵\s*\$[\d,.]+/gi, ' '); // Remove emoji + price (like 💵 $500)
  
  return cleaned;
}

// Extract prices from text, ensuring we NEVER capture savings amounts
// Format: "$18.99 $34.25 Save $15.26" -> returns salePrice=18.99, compareAtPrice=34.25
function extractSalePriceBeforeSave(text: string): {
  salePrice: number | null;
  compareAtPrice: number | null;
} {
  console.log('extractSalePriceBeforeSave input sample:', text.substring(0, 300));
  
  // STEP 1: Clean the text by removing savings patterns FIRST
  const cleanedText = removeSavingsAmounts(text);
  console.log('After removing savings:', cleanedText.substring(0, 300));
  
  // STEP 2: Extract all dollar amounts from the CLEANED text
  // CRITICAL FIX: Use proper regex that captures full decimal prices
  // Pattern: $18.99 or $34.25 (dollar sign followed by digits, optional decimal with exactly 2 digits)
  const priceMatches = cleanedText.match(/\$(\d+(?:\.\d{2})?)/g);
  
  if (!priceMatches || priceMatches.length === 0) {
    console.log('No prices found in cleaned text');
    return { salePrice: null, compareAtPrice: null };
  }
  
  // Parse all found prices
  const prices = priceMatches
    .map(p => parseFloat(p.replace('$', '')))
    .filter(p => !isNaN(p) && p > 0);
  
  console.log('Extracted prices from cleaned text:', prices);
  
  if (prices.length === 0) {
    return { salePrice: null, compareAtPrice: null };
  }
  
  // STEP 3: The first price is typically the sale/current price
  // For format "$18.99 $34.25" - first is sale price, second is compare-at
  if (prices.length >= 2) {
    const [first, second] = prices;
    if (first < second) {
      // First is sale price, second is compare-at (original)
      console.log(`Identified: salePrice=$${first}, compareAtPrice=$${second}`);
      return { salePrice: first, compareAtPrice: second };
    } else if (second < first) {
      // Second is sale price, first is compare-at
      console.log(`Identified (reversed): salePrice=$${second}, compareAtPrice=$${first}`);
      return { salePrice: second, compareAtPrice: first };
    }
  }
  
  // Single price or equal prices - just return the first
  console.log(`Single/equal price: $${prices[0]}`);
  return { salePrice: prices[0], compareAtPrice: null };
}

// Apply configured price patterns to markdown content
function extractPriceWithConfig(
  markdown: string,
  config: BrandExtractionConfig,
  preferredCurrency: string
): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
  matchedPattern: string | null;
} {
  // Use higher minimum for filament to avoid capturing weights/discounts
  const priceRangeMin = config.priceRangeMin ?? 10;
  const priceRangeMax = config.priceRangeMax ?? 150;
  
  // First, try to extract using the Creality sale format pattern
  const saleResult = extractSalePriceBeforeSave(markdown);
  if (saleResult.salePrice && saleResult.salePrice >= priceRangeMin && saleResult.salePrice <= priceRangeMax) {
    // CRITICAL: Also validate compareAtPrice - it must be within reasonable range (not $500 coupon packs!)
    // Compare-at price should be reasonable (max 3x the sale price or within $200)
    const maxCompareAt = Math.min(200, saleResult.salePrice * 3);
    const validCompareAt = saleResult.compareAtPrice && 
      saleResult.compareAtPrice >= priceRangeMin && 
      saleResult.compareAtPrice <= maxCompareAt &&
      saleResult.compareAtPrice > saleResult.salePrice;
    
    console.log(`Sale format extraction: $${saleResult.salePrice}, compare: ${validCompareAt ? `$${saleResult.compareAtPrice}` : 'invalid/filtered'}`);
    return {
      price: saleResult.salePrice,
      compareAtPrice: validCompareAt ? saleResult.compareAtPrice : null,
      currency: preferredCurrency,
      available: true,
      matchedPattern: 'sale-before-save',
    };
  }
  
  // Remove savings amounts from the text
  let cleanedMarkdown = removeSavingsAmounts(markdown);
  
  // Combine default excludes with configured excludes for additional cleaning
  const excludePatterns = [
    ...DEFAULT_EXCLUDE_PATTERNS,
    ...(config.excludePatterns || [])
  ];
  
  // Pre-filter: Remove lines containing discount patterns
  for (const pattern of excludePatterns) {
    try {
      const lineExcludeRegex = new RegExp(`^.*${pattern}.*$`, 'gim');
      cleanedMarkdown = cleanedMarkdown.replace(lineExcludeRegex, '');
    } catch (e) {
      // Ignore invalid patterns
    }
  }
  
  // Determine search section using anchor text
  let priceSection = cleanedMarkdown;
  if (config.priceSectionAnchor) {
    const anchorRegex = new RegExp(config.priceSectionAnchor, 'i');
    const anchorIndex = cleanedMarkdown.search(anchorRegex);
    if (anchorIndex > -1) {
      priceSection = cleanedMarkdown.slice(Math.max(0, anchorIndex - 500), anchorIndex + 200);
    }
  }
  
  // Try configured price patterns first
  if (config.pricePatterns && config.pricePatterns.length > 0) {
    for (const pattern of config.pricePatterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        const match = priceSection.match(regex);
        if (match && match[1]) {
          const price = parseFloat(match[1].replace(',', ''));
          if (price >= priceRangeMin && price <= priceRangeMax) {
            console.log(`Pattern match: ${pattern} -> $${price}`);
            
            let compareAt: number | null = null;
            const allPrices = [...priceSection.matchAll(/\$(\d+(?:\.\d{2})?)/g)]
              .map(m => parseFloat(m[1]))
              .filter(p => p >= priceRangeMin && p <= priceRangeMax && p !== price);
            if (allPrices.length > 0) {
              const higherPrice = allPrices.find(p => p > price);
              if (higherPrice) compareAt = higherPrice;
            }
            
            return {
              price,
              compareAtPrice: compareAt,
              currency: preferredCurrency,
              available: true,
              matchedPattern: pattern,
            };
          }
        }
      } catch (e) {
        console.log(`Invalid price pattern: ${pattern}`);
      }
    }
  }
  
  // Fallback: find all prices in cleaned section, filter to valid range
  const allPrices = [...priceSection.matchAll(/\$(\d+(?:\.\d{2})?)/g)]
    .map(m => parseFloat(m[1]))
    .filter(p => p >= priceRangeMin && p <= priceRangeMax)
    .sort((a, b) => a - b);
  
  if (allPrices.length > 0) {
    const price = allPrices[0];
    const compareAt = allPrices.length > 1 && allPrices[1] > price * 1.1 ? allPrices[1] : null;
    return {
      price,
      compareAtPrice: compareAt,
      currency: preferredCurrency,
      available: true,
      matchedPattern: 'fallback-generic',
    };
  }
  
  return {
    price: null,
    compareAtPrice: null,
    currency: preferredCurrency,
    available: false,
    matchedPattern: null,
  };
}

// Legacy: Detect custom storefronts that don't support Shopify JSON API
function detectCustomStorefront(url: string): 'bambulab' | 'prusa' | 'opencart' | 'creality' | null {
  if (url.includes('store.bambulab.com')) return 'bambulab';
  if (url.includes('prusa3d.com')) return 'prusa';
  if (url.includes('geeetech.com')) return 'opencart';
  if (url.includes('store.creality.com')) return 'creality';
  return null;
}

// Product type for price validation (filament default, printer has higher range)
type ProductType = 'filament' | 'printer';

// Price range configurations per product type
const PRICE_RANGES: Record<ProductType, { min: number; max: number }> = {
  filament: { min: 10, max: 150 },
  printer: { min: 99, max: 10000 },
};

// Validate that a price is within reasonable range for the product type
// Minimum raised to $10 for filaments to avoid capturing weights, discount amounts, or shipping costs
// Printers use $99-$10000 range to avoid capturing accessory prices
function validateProductPrice(price: number, productType: ProductType = 'filament'): boolean {
  const range = PRICE_RANGES[productType];
  return price >= range.min && price <= range.max;
}

// Currency-aware filament price validation
const CURRENCY_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  USD: { min: 3, max: 200 },
  CAD: { min: 3, max: 200 },
  AUD: { min: 3, max: 200 },
  GBP: { min: 3, max: 150 },
  EUR: { min: 3, max: 200 },
  JPY: { min: 100, max: 30000 },
  default: { min: 1, max: 50000 },
};

function validateFilamentPrice(price: number, currency: string = 'USD'): boolean {
  const range = CURRENCY_PRICE_RANGES[currency] || CURRENCY_PRICE_RANGES.default;
  return price >= range.min && price <= range.max;
}

// Extract printer price from page content
// Uses higher price range ($99-$10000) appropriate for 3D printers
// NOTE: For printers, we use a different strategy than filaments:
// - Look for "From $XXX" patterns (Bambu Lab format)
// - Look for prices near the product title (first prominent price)
// - Avoid accessory/bundle prices that are usually lower
function extractPrinterPrice(markdown: string, preferredCurrency: string): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log(`Extracting PRINTER price from content, preferred currency: ${preferredCurrency}`);
  const range = PRICE_RANGES.printer;
  
  // Currency-specific patterns
  const currencySymbols: Record<string, { symbol: string; symbolEscaped: string }> = {
    USD: { symbol: '$', symbolEscaped: '\\$' },
    EUR: { symbol: '€', symbolEscaped: '€' },
    GBP: { symbol: '£', symbolEscaped: '£' },
    CAD: { symbol: 'CA$', symbolEscaped: '(?:CA)?\\$' },
    AUD: { symbol: 'A$', symbolEscaped: '(?:A)?\\$' },
    JPY: { symbol: '¥', symbolEscaped: '¥' },
  };
  
  const config = currencySymbols[preferredCurrency] || currencySymbols.USD;
  
  // STRATEGY 1: Look for "From $XXX" pattern (Bambu Lab, Prusa, etc.)
  // This is the main product starting price
  const fromPattern = new RegExp(`From\\s*${config.symbolEscaped}\\s*([\\d,]+(?:\\.\\d{2})?)`, 'gi');
  const fromMatches = [...markdown.matchAll(fromPattern)];
  if (fromMatches.length > 0) {
    const fromPrices = fromMatches
      .map(m => parseFloat(m[1].replace(',', '')))
      .filter(p => !isNaN(p) && p >= range.min && p <= range.max);
    
    if (fromPrices.length > 0) {
      // Take the first "From $XXX" price found (usually the main product)
      const price = fromPrices[0];
      console.log(`Found printer "From" price: ${config.symbol}${price}`);
      return { price, compareAtPrice: null, currency: preferredCurrency, available: true };
    }
  }
  
  // STRATEGY 2: Look near "Add to Cart" button - the price just before it is usually the main price
  // Focus on a smaller window to avoid accessory prices
  const addToCartMatch = markdown.match(/Add\s*to\s*Cart/i);
  if (addToCartMatch && addToCartMatch.index) {
    // Look in the 500 chars before "Add to Cart" for prices
    const beforeCartStart = Math.max(0, addToCartMatch.index - 500);
    const beforeCart = markdown.slice(beforeCartStart, addToCartMatch.index);
    
    const pricePattern = new RegExp(`${config.symbolEscaped}\\s*([\\d,]+(?:\\.\\d{2})?)`, 'g');
    const cartPrices = [...beforeCart.matchAll(pricePattern)]
      .map(m => parseFloat(m[1].replace(',', '')))
      .filter(p => !isNaN(p) && p >= range.min && p <= range.max);
    
    if (cartPrices.length > 0) {
      // Take the LAST price before Add to Cart (usually the current price)
      const price = cartPrices[cartPrices.length - 1];
      // Look for a compare-at price (strikethrough/original price is usually before the current)
      const compareAt = cartPrices.length > 1 && cartPrices[cartPrices.length - 2] > price * 1.05 
        ? cartPrices[cartPrices.length - 2] 
        : null;
      console.log(`Found printer price near Add to Cart: ${config.symbol}${price}${compareAt ? `, compare: ${config.symbol}${compareAt}` : ''}`);
      return { price, compareAtPrice: compareAt, currency: preferredCurrency, available: true };
    }
  }
  
  // STRATEGY 3: Look for the first prominent price in the upper portion of the page
  // Split markdown into lines and look for prices in the first 30%
  const lines = markdown.split('\n');
  const upperContent = lines.slice(0, Math.floor(lines.length * 0.3)).join('\n');
  
  const pricePattern = new RegExp(`${config.symbolEscaped}\\s*([\\d,]+(?:\\.\\d{2})?)`, 'g');
  const upperPrices = [...upperContent.matchAll(pricePattern)]
    .map(m => parseFloat(m[1].replace(',', '')))
    .filter(p => !isNaN(p) && p >= range.min && p <= range.max);
  
  console.log(`Found ${upperPrices.length} valid printer prices in upper content:`, upperPrices.slice(0, 5));
  
  if (upperPrices.length > 0) {
    // For printers, take the FIRST valid price (main product price appears first)
    const price = upperPrices[0];
    // Compare-at is usually the second price if it's higher
    const compareAt = upperPrices.length > 1 && upperPrices[1] > price * 1.05 ? upperPrices[1] : null;
    console.log(`Printer price (first in upper content): ${config.symbol}${price}${compareAt ? `, compare: ${config.symbol}${compareAt}` : ''}`);
    return { price, compareAtPrice: compareAt, currency: preferredCurrency, available: true };
  }
  
  // STRATEGY 4: Full page fallback - take first valid price
  const allPrices = [...markdown.matchAll(pricePattern)]
    .map(m => parseFloat(m[1].replace(',', '')))
    .filter(p => !isNaN(p) && p >= range.min && p <= range.max);
  
  if (allPrices.length > 0) {
    const price = allPrices[0];
    const compareAt = allPrices.length > 1 && allPrices[1] > price * 1.05 ? allPrices[1] : null;
    console.log(`Printer price (full page first): ${config.symbol}${price}${compareAt ? `, compare: ${config.symbol}${compareAt}` : ''}`);
    return { price, compareAtPrice: compareAt, currency: preferredCurrency, available: true };
  }
  
  console.log('No valid printer price found');
  return { price: null, compareAtPrice: null, currency: preferredCurrency, available: false };
}

// Detect granular stock status from page content
// Returns: 'preorder', 'low_stock', 'out_of_stock', or 'unknown'
function detectStockStatus(markdown: string): StockStatus {
  const content = markdown.toLowerCase();
  
  // Check for preorder patterns first (highest priority)
  const preorderPatterns = [
    /pre[- ]?order/i,
    /coming\s*soon/i,
    /available\s*for\s*pre[- ]?order/i,
    /reserve\s*now/i,
    /launching\s*soon/i,
  ];
  if (preorderPatterns.some(p => p.test(content))) {
    console.log('📦 Detected preorder status');
    return 'preorder';
  }
  
  // Check for low stock patterns
  const lowStockPatterns = [
    /only\s*\d+\s*left/i,
    /low\s*stock/i,
    /limited\s*(?:stock|quantity|availability)/i,
    /few\s*(?:remaining|left)/i,
    /hurry[,!]?\s*(?:only|just)/i,
    /almost\s*(?:gone|sold\s*out)/i,
  ];
  if (lowStockPatterns.some(p => p.test(content))) {
    console.log('⚠️ Detected low stock status');
    return 'low_stock';
  }
  
  // Check for sold out patterns
  const soldOutPatterns = [
    /sold\s*out/i,
    /out\s*of\s*stock/i,
    /currently\s*unavailable/i,
    /notify\s*(me\s*)?(when\s*)?(available|in\s*stock)/i,
    /back\s*in\s*stock\s*soon/i,
    /temporarily\s*out/i,
    /no\s*longer\s*available/i,
    /stock:\s*0/i,
    /availability:\s*(?:out\s*of\s*stock|unavailable)/i,
    /item\s*is\s*(?:currently\s*)?(?:unavailable|sold\s*out)/i,
  ];
  if (soldOutPatterns.some(p => p.test(content))) {
    console.log('❌ Detected out of stock status');
    return 'out_of_stock';
  }
  
  // No specific status detected
  return 'unknown';
}

// Legacy wrapper for backward compatibility
function detectSoldOutStatus(markdown: string): boolean {
  const status = detectStockStatus(markdown);
  return status === 'out_of_stock';
}

// Update filament stock status in database when live check detects changes
async function updateFilamentStockStatus(
  productUrl: string,
  available: boolean,
  stockStatus: StockStatus,
  price: number | null
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    // Find the filament by URL (try both exact match and partial match)
    const { data: filament } = await supabase
      .from('filaments')
      .select('id, variant_available, variant_price')
      .eq('product_url', productUrl)
      .maybeSingle();
    
    if (!filament) {
      console.log('No filament found for URL, skipping DB update:', productUrl);
      return;
    }
    
    // Determine if we need to update
    const stockChanged = filament.variant_available !== available;
    const priceDiffersSignificantly = price !== null && 
      filament.variant_price !== null && 
      Math.abs(price - filament.variant_price) > 0.50;
    
    if (!stockChanged && !priceDiffersSignificantly) {
      console.log('No significant changes detected, skipping DB update');
      return;
    }
    
    // === DISCREPANCY DETECTION ===
    if (priceDiffersSignificantly && price !== null && filament.variant_price !== null) {
      const changePercent = ((price - filament.variant_price) / filament.variant_price) * 100;
      const absChangePercent = Math.abs(changePercent);
      
      if (absChangePercent < 5) {
        // Auto-approve: small change, update immediately
        console.log(`Price change ${changePercent.toFixed(1)}% < 5%, auto-approving`);
        await supabase.from('price_discrepancies').insert({
          filament_id: filament.id,
          old_price: filament.variant_price,
          new_price: price,
          price_change_percent: Math.round(changePercent * 100) / 100,
          currency: 'USD',
          region: 'US',
          status: 'auto_approved',
          source_url: productUrl,
          reviewed_at: new Date().toISOString(),
          notes: 'Auto-approved: change < 5%',
        });
      } else {
        // Manual review required: significant change
        const isUrgent = absChangePercent > 20;
        console.log(`Price change ${changePercent.toFixed(1)}% requires manual review${isUrgent ? ' (URGENT)' : ''}`);
        await supabase.from('price_discrepancies').insert({
          filament_id: filament.id,
          old_price: filament.variant_price,
          new_price: price,
          price_change_percent: Math.round(changePercent * 100) / 100,
          currency: 'USD',
          region: 'US',
          status: 'manual_review',
          source_url: productUrl,
          notes: isUrgent ? 'URGENT: Price change > 20%' : 'Price change 5-20%, needs review',
        });
        // Don't auto-update the price for large changes
        return;
      }
    }
    
    // Build update object
    const updateData: Record<string, unknown> = {
      variant_available: available,
      last_scraped_at: new Date().toISOString(),
    };
    
    // Only update price if it changed significantly and we got a valid price
    if (priceDiffersSignificantly && price !== null) {
      updateData.variant_price = price;
    }
    
    const { error } = await supabase
      .from('filaments')
      .update(updateData)
      .eq('id', filament.id);
    
    if (error) {
      console.error('Failed to update filament stock status:', error);
    } else {
      console.log(`✓ Updated filament ${filament.id}: available=${available}, stockStatus=${stockStatus}${priceDiffersSignificantly ? `, price=${price}` : ''}`);
    }
  } catch (err) {
    console.error('Error updating filament stock status:', err);
  }
}

// Legacy: Extract price specifically from Creality store pages
function extractCrealityPrice(markdown: string): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log('=== CREALITY EXTRACTION ===');
  console.log('Input markdown preview (first 500 chars):', markdown.substring(0, 500));
  console.log('Input markdown length:', markdown.length);
  
  // First, try the sale format pattern: "$18.99 $34.25 Save $15.26"
  const saleResult = extractSalePriceBeforeSave(markdown);
  console.log('Sale format extraction result:', JSON.stringify(saleResult));
  
  if (saleResult.salePrice && validateFilamentPrice(saleResult.salePrice)) {
    console.log(`✓ Creality sale format matched: $${saleResult.salePrice}, compare-at: $${saleResult.compareAtPrice}`);
    const result = { 
      price: saleResult.salePrice, 
      compareAtPrice: saleResult.compareAtPrice, 
      currency: 'USD', 
      available: true 
    };
    console.log('Final Creality price returned:', JSON.stringify(result));
    return result;
  }
  console.log('Sale format not matched, trying fallback methods...');
  
  // Remove savings amounts from text
  let cleanedMarkdown = removeSavingsAmounts(markdown);
  
  // Find price section near Add to Cart/Buy Now buttons
  const addToCartIndex = cleanedMarkdown.search(/Add\s*to\s*Cart/i);
  const buyNowIndex = cleanedMarkdown.search(/Buy\s*Now/i);
  const priceIndex = Math.max(addToCartIndex, buyNowIndex);
  
  let priceSection = '';
  if (priceIndex > -1) {
    priceSection = cleanedMarkdown.slice(Math.max(0, priceIndex - 500), priceIndex + 100);
  }
  
  // Look for explicit sale price patterns
  const saleMatch = cleanedMarkdown.match(/(?:Sale\s*price|Now|Special)\s*[:.]?\s*\$(\d+(?:\.\d{2})?)/i);
  
  // Pattern: Two prices adjacent (sale and regular)
  const dualPriceMatch = priceSection.match(/\$(\d+(?:\.\d{2})?)\s*(?:[\s\n~-]*)\$(\d+(?:\.\d{2})?)/);
  console.log('Dual price match result:', dualPriceMatch ? dualPriceMatch[0] : 'null');
  
  if (dualPriceMatch) {
    const price1 = parseFloat(dualPriceMatch[1]);
    const price2 = parseFloat(dualPriceMatch[2]);
    const salePrice = Math.min(price1, price2);
    const comparePrice = Math.max(price1, price2);
    console.log(`Dual price parsed: price1=$${price1}, price2=$${price2}, sale=$${salePrice}, compare=$${comparePrice}`);
    
    if (validateFilamentPrice(salePrice) && validateFilamentPrice(comparePrice, 10, 200)) {
      console.log(`✓ Found Creality dual price: $${salePrice}, compare-at: $${comparePrice}`);
      const result = { price: salePrice, compareAtPrice: comparePrice, currency: 'USD', available: true };
      console.log('Final Creality price returned:', JSON.stringify(result));
      return result;
    }
    console.log('Dual price validation failed');
  }
  
  // Extract all valid prices from the cleaned price section
  const allPricesInSection = priceSection.match(/\$(\d+(?:\.\d{2})?)/g);
  console.log('All prices in section (raw):', allPricesInSection);
  
  if (allPricesInSection) {
    const allParsed = allPricesInSection.map(p => parseFloat(p.replace('$', '')));
    console.log('All prices parsed:', allParsed);
    
    const validPrices = allParsed
      .filter(p => validateFilamentPrice(p))
      .sort((a, b) => a - b);
    console.log('Valid prices after filtering (min=$10, max=$150):', validPrices);
    
    if (validPrices.length > 0) {
      const price = validPrices[0];
      const compareAt = validPrices.length > 1 && validPrices[1] > price * 1.1 ? validPrices[1] : null;
      console.log(`✓ Found Creality price: $${price}${compareAt ? `, compare-at: $${compareAt}` : ''}`);
      const result = { price, compareAtPrice: compareAt, currency: 'USD', available: true };
      console.log('Final Creality price returned:', JSON.stringify(result));
      return result;
    }
  }
  
  // Try explicit sale match
  if (saleMatch) {
    const price = parseFloat(saleMatch[1]);
    if (validateFilamentPrice(price)) {
      console.log(`Found Creality explicit sale price: $${price}`);
      return { price, compareAtPrice: null, currency: 'USD', available: true };
    }
  }
  
  // Last resort: search full cleaned markdown
  console.log('=== CREALITY FALLBACK: Full markdown search ===');
  const allPricesRaw = [...cleanedMarkdown.matchAll(/\$(\d+(?:\.\d{2})?)/g)];
  console.log('All price matches in cleaned markdown:', allPricesRaw.length);
  console.log('First 10 price matches:', allPricesRaw.slice(0, 10).map(m => m[0]));
  
  const allPrices = allPricesRaw
    .map(m => parseFloat(m[1]))
    .filter(p => validateFilamentPrice(p))
    .sort((a, b) => a - b);
  
  console.log('Valid prices after filtering:', allPrices);
  
  if (allPrices.length > 0) {
    console.log(`Creality fallback: found ${allPrices.length} valid prices, using lowest: $${allPrices[0]}`);
    const result = {
      price: allPrices[0],
      compareAtPrice: allPrices.length > 1 && allPrices[1] > allPrices[0] * 1.1 ? allPrices[1] : null,
      currency: 'USD',
      available: true,
    };
    console.log('Final Creality price returned:', JSON.stringify(result));
    return result;
  }
  
  console.log('❌ No valid Creality price found');
  return { price: null, compareAtPrice: null, currency: 'USD', available: false };
}

// Detect Shopify stores known to use multi-currency
function isMultiCurrencyShopifyStore(url: string): boolean {
  const multiCurrencyDomains = ['polymaker.com', 'esun3d.com', 'sunlu.com', 'overture3d.com'];
  const urlLower = url.toLowerCase();
  return multiCurrencyDomains.some(domain => urlLower.includes(domain));
}

// Detect stores where Shopify JSON API returns unreliable prices
function shouldAlwaysUseFirecrawl(url: string): boolean {
  const unreliableJsonStores = ['amolen.com', 'store.bambulab.com'];
  const urlLower = url.toLowerCase();
  return unreliableJsonStores.some(domain => urlLower.includes(domain));
}

// Map currency to Firecrawl location settings
function getFirecrawlLocation(currency: string): { country: string; languages: string[] } {
  switch (currency) {
    case 'CAD': return { country: 'CA', languages: ['en-CA', 'en'] };
    case 'GBP': return { country: 'GB', languages: ['en-GB', 'en'] };
    case 'EUR': return { country: 'DE', languages: ['de-DE', 'en'] };
    case 'AUD': return { country: 'AU', languages: ['en-AU', 'en'] };
    case 'JPY': return { country: 'JP', languages: ['ja-JP', 'en'] };
    default: return { country: 'US', languages: ['en-US', 'en'] };
  }
}

// Legacy: Extract price from GEEETECH OpenCart pages
function extractOpenCartPrice(markdown: string): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log('Extracting OpenCart/GEEETECH price (legacy)...');
  
  const skuIndex = markdown.search(/SKU:\s*[\d\-]+/i);
  let priceSection = skuIndex > -1 ? markdown.slice(skuIndex, skuIndex + 500) : '';
  
  if (!priceSection) {
    const cartIndex = markdown.search(/Add\s*to\s*Cart/i);
    if (cartIndex > -1) {
      priceSection = markdown.slice(Math.max(0, cartIndex - 300), cartIndex);
    }
  }
  
  if (!priceSection) {
    const lines = markdown.split('\n');
    const startLine = Math.floor(lines.length * 0.15);
    const endLine = Math.floor(lines.length * 0.5);
    priceSection = lines.slice(startLine, endLine).join('\n');
  }
  
  const salePriceMatch = priceSection.match(/\$(\d+(?:\.\d{2})?)\s*(?:\n|\s)*\$(\d+(?:\.\d{2})?)/);
  if (salePriceMatch) {
    const price1 = parseFloat(salePriceMatch[1]);
    const price2 = parseFloat(salePriceMatch[2]);
    const salePrice = Math.min(price1, price2);
    const comparePrice = Math.max(price1, price2);
    
    if (salePrice >= 5 && salePrice <= 50 && comparePrice <= 60) {
      console.log(`Found OpenCart sale price: $${salePrice}, compare-at: $${comparePrice}`);
      return { price: salePrice, compareAtPrice: comparePrice, currency: 'USD', available: true };
    }
  }
  
  const allPrices = priceSection.match(/\$(\d+(?:\.\d{2})?)/g);
  if (allPrices) {
    const validPrices = allPrices.map(p => parseFloat(p.replace('$', ''))).filter(p => p >= 5 && p <= 50);
    if (validPrices.length > 0) {
      console.log(`Found OpenCart single price: $${validPrices[0]}`);
      return { price: validPrices[0], compareAtPrice: null, currency: 'USD', available: true };
    }
  }
  
  console.log('No valid OpenCart price found');
  return { price: null, compareAtPrice: null, currency: 'USD', available: false };
}

// Get currency symbol for a given currency code
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'CAD': 'CA$',
    'GBP': '£',
    'EUR': '€',
    'AUD': 'A$',
    'JPY': '¥',
    'CNY': '¥',
  };
  return symbols[currency] || '$';
}

// Build regex pattern for a specific currency
function buildCurrencyPricePattern(currency: string): RegExp {
  // Match: €22.99 EUR, $22.99 USD, From €22.99 EUR, etc.
  // Note: Bambu Lab EU format is "From €22.99 EUR" or "€22.99 EUR"
  const symbol = getCurrencySymbol(currency);
  const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Pattern: symbol + price + optional currency code
  // OR: "From" + symbol + price + optional currency code
  return new RegExp(
    `(?:From\\s*)?${escapedSymbol}\\s*([\\d,]+(?:\\.\\d{2})?)(?:\\s*${currency})?`,
    'gi'
  );
}

// Split markdown into main product section (before cross-sell/accessory widgets)
function getMainProductSection(markdown: string): string {
  const cutoffPatterns = [
    /(?:frequently\s+bought\s+together|discover\s+more|you\s+may\s+also\s+like|related\s+products|customers\s+also\s+bought|recommended\s+for\s+you)/i,
    /support\s+for\s+\w+.*?\$/i,
    /add\s+to\s+cart/i,
    /カートに追加/i,          // Japanese: "Add to Cart"
    /おすすめ商品/i,          // Japanese: "Recommended products"  
    /一緒に購入/i,            // Japanese: "Bought together"
  ];
  
  let cutoff = markdown.length;
  for (const pattern of cutoffPatterns) {
    const match = markdown.search(pattern);
    if (match > 0 && match < cutoff) {
      cutoff = match;
    }
  }
  
  // Use at least the first 40% of the page if markers found too early
  const minLength = Math.floor(markdown.length * 0.4);
  if (cutoff < minLength) {
    cutoff = minLength;
  }
  
  return markdown.substring(0, cutoff);
}

// Parse a price string that may use European decimal format (comma as decimal separator)
// Examples: "15,99" → 15.99, "1.299,00" → 1299.00, "15.99" → 15.99, "1,299.00" → 1299.00
function parseEuropeanPrice(raw: string): number {
  if (!raw) return NaN;
  const trimmed = raw.trim();
  
  // Detect European format: if the last separator is a comma and has exactly 2 digits after it
  // e.g. "15,99" or "1.299,99"
  const europeanMatch = trimmed.match(/^([\d.]*?)(\d+),(\d{2})$/);
  if (europeanMatch) {
    // European format: dots are thousand separators, comma is decimal
    const intPart = (europeanMatch[1] + europeanMatch[2]).replace(/\./g, '');
    return parseFloat(`${intPart}.${europeanMatch[3]}`);
  }
  
  // Standard format: commas are thousand separators, dot is decimal
  return parseFloat(trimmed.replace(/,/g, ''));
}

// Helper: extract first valid price from matches (by page position, not lowest)
function extractFirstValidPrice(
  matches: RegExpMatchArray[],
  currency: string,
  groupIndex: number = 1,
  altGroupIndex?: number
): { price: number; compareAt: number | null } | null {
  const prices = matches
    .map(m => {
      const raw = m[groupIndex] || (altGroupIndex !== undefined ? m[altGroupIndex] : undefined);
      if (!raw) return NaN;
      return parseEuropeanPrice(raw);
    })
    .filter(p => !isNaN(p) && p > 0 && validateFilamentPrice(p, currency));
  
  if (prices.length === 0) return null;
  
  const price = prices[0]; // First by page position
  const compareAt = prices.length > 1 && prices[1] > price * 1.1 ? prices[1] : null;
  return { price, compareAt };
}

// Legacy: Extract price from Bambu Lab and generic stores
function extractBambuLabPrice(markdown: string, preferredCurrency: string): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log(`Extracting price from content, preferred currency: ${preferredCurrency}`);
  
  const upperMarkdown = getMainProductSection(markdown);
  console.log(`Main product section: ${upperMarkdown.length} of ${markdown.length} chars (${Math.round(upperMarkdown.length / markdown.length * 100)}%)`);
  
  const currencyPatterns = ['EUR', 'GBP', 'CAD', 'USD', 'AUD', 'JPY'];
  
  // PRIORITY 1: Look for prices in the preferred currency FIRST
  const preferredSymbol = getCurrencySymbol(preferredCurrency);
  
  // EUR-specific patterns for Bambu Lab EU store
  if (preferredCurrency === 'EUR') {
    const eurPatterns = [
      /From\s*€\s*([\d.,]+(?:\.\d{2})?)\s*EUR/gi,
      /€\s*([\d.,]+(?:\.\d{2})?)\s*EUR/gi,
      /€\s*([\d.,]+)/g,  // Matches €15,99 and €15.99
    ];
    
    for (const pattern of eurPatterns) {
      // Try upper section first
      const upperMatches = [...upperMarkdown.matchAll(new RegExp(pattern.source, pattern.flags))];
      const upperResult = extractFirstValidPrice(upperMatches, 'EUR');
      if (upperResult) {
        console.log(`Found EUR price (upper section): €${upperResult.price}${upperResult.compareAt ? `, compare-at: €${upperResult.compareAt}` : ''}`);
        return { price: upperResult.price, compareAtPrice: upperResult.compareAt, currency: 'EUR', available: true };
      }
      
      // Fall back to full page
      const fullMatches = [...markdown.matchAll(new RegExp(pattern.source, pattern.flags))];
      const fullResult = extractFirstValidPrice(fullMatches, 'EUR');
      if (fullResult) {
        console.log(`Found EUR price (full page): €${fullResult.price}${fullResult.compareAt ? `, compare-at: €${fullResult.compareAt}` : ''}`);
        return { price: fullResult.price, compareAtPrice: fullResult.compareAt, currency: 'EUR', available: true };
      }
    }
  }
  
  // JPY-specific patterns for Bambu Lab JP store
  if (preferredCurrency === 'JPY') {
    const jpyPatterns = [
      /[¥￥]\s*([\d,]+)\s*(?:円)?/g,           // ¥3,400 円 or ¥3,400 or ￥3,400
      /([\d,]+)\s*円/g,                         // 3,400円 (number followed by 円)
      /(?:税込|価格|通常価格)[^\d]*?([\d,]+)/g,  // 税込価格 3,400 (after price labels)
    ];
    
    for (const pattern of jpyPatterns) {
      // Try upper section first
      const upperMatches = [...upperMarkdown.matchAll(new RegExp(pattern.source, pattern.flags))];
      const pricesByPosition = upperMatches
        .map(m => ({
          price: parseFloat((m[1] || '').replace(/,/g, '')),
          index: m.index || 0,
        }))
        .filter(p => !isNaN(p.price) && p.price > 0 && validateFilamentPrice(p.price, 'JPY'))
        .sort((a, b) => a.index - b.index);
      
      if (pricesByPosition.length > 0) {
        const mainPrice = pricesByPosition[0].price;
        const compareAt = pricesByPosition.length > 1 && pricesByPosition[1].price > mainPrice * 1.1
          ? pricesByPosition[1].price : null;
        console.log(`Found JPY price (upper section): ¥${mainPrice}${compareAt ? `, compare-at: ¥${compareAt}` : ''} (from ${pricesByPosition.length} matches)`);
        return { price: mainPrice, compareAtPrice: compareAt, currency: 'JPY', available: true };
      }
      
      // Fall back to full page
      const fullMatches = [...markdown.matchAll(new RegExp(pattern.source, pattern.flags))];
      const fullByPosition = fullMatches
        .map(m => ({
          price: parseFloat((m[1] || '').replace(/,/g, '')),
          index: m.index || 0,
        }))
        .filter(p => !isNaN(p.price) && p.price > 0 && validateFilamentPrice(p.price, 'JPY'))
        .sort((a, b) => a.index - b.index);
      
      if (fullByPosition.length > 0) {
        const mainPrice = fullByPosition[0].price;
        const compareAt = fullByPosition.length > 1 && fullByPosition[1].price > mainPrice * 1.1
          ? fullByPosition[1].price : null;
        console.log(`Found JPY price (full page): ¥${mainPrice}${compareAt ? `, compare-at: ¥${compareAt}` : ''} (from ${fullByPosition.length} matches)`);
        return { price: mainPrice, compareAtPrice: compareAt, currency: 'JPY', available: true };
      }
    }
    
    console.log('No JPY price found with specific patterns, falling through to generic extraction...');
  }
  
  // GBP-specific patterns
  if (preferredCurrency === 'GBP') {
    const gbpPatterns = [
      /From\s*£\s*([\d,]+(?:\.\d{2})?)\s*GBP/gi,
      /£\s*([\d,]+(?:\.\d{2})?)\s*GBP/gi,
      /£\s*([\d,]+(?:\.\d{2})?)/g,
    ];
    
    for (const pattern of gbpPatterns) {
      const upperMatches = [...upperMarkdown.matchAll(new RegExp(pattern.source, pattern.flags))];
      const upperResult = extractFirstValidPrice(upperMatches, 'GBP');
      if (upperResult) {
        console.log(`Found GBP price (upper section): £${upperResult.price}${upperResult.compareAt ? `, compare-at: £${upperResult.compareAt}` : ''}`);
        return { price: upperResult.price, compareAtPrice: upperResult.compareAt, currency: 'GBP', available: true };
      }
      
      const fullMatches = [...markdown.matchAll(new RegExp(pattern.source, pattern.flags))];
      const fullResult = extractFirstValidPrice(fullMatches, 'GBP');
      if (fullResult) {
        console.log(`Found GBP price (full page): £${fullResult.price}${fullResult.compareAt ? `, compare-at: £${fullResult.compareAt}` : ''}`);
        return { price: fullResult.price, compareAtPrice: fullResult.compareAt, currency: 'GBP', available: true };
      }
    }
  }
  
  // Pattern for USD/CAD/AUD with $ symbol and currency code
  if (['USD', 'CAD', 'AUD'].includes(preferredCurrency)) {
    const dollarWithCodePattern = new RegExp(
      `From\\s*\\$\\s*([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency}|\\$\\s*([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency}`,
      'gi'
    );
    
    // Try upper section first
    const upperMatches = [...upperMarkdown.matchAll(new RegExp(dollarWithCodePattern.source, dollarWithCodePattern.flags))];
    if (upperMatches.length > 0) {
      const prices = upperMatches
        .map(m => parseFloat((m[1] || m[2]).replace(',', '')))
        .filter(p => !isNaN(p) && p > 0 && validateFilamentPrice(p, preferredCurrency));
      if (prices.length > 0) {
        const price = prices[0];
        const compareAt = prices.length > 1 && prices[1] > price * 1.1 ? prices[1] : null;
        console.log(`Found ${preferredCurrency} price (upper section): $${price}${compareAt ? `, compare-at: $${compareAt}` : ''}`);
        return { price, compareAtPrice: compareAt, currency: preferredCurrency, available: true };
      }
    }
    
    // Fall back to full page
    const fullMatches = [...markdown.matchAll(new RegExp(dollarWithCodePattern.source, dollarWithCodePattern.flags))];
    if (fullMatches.length > 0) {
      const prices = fullMatches
        .map(m => parseFloat((m[1] || m[2]).replace(',', '')))
        .filter(p => !isNaN(p) && p > 0 && validateFilamentPrice(p, preferredCurrency));
      if (prices.length > 0) {
        const price = prices[0];
        const compareAt = prices.length > 1 && prices[1] > price * 1.1 ? prices[1] : null;
        console.log(`Found ${preferredCurrency} price (full page): $${price}${compareAt ? `, compare-at: $${compareAt}` : ''}`);
        return { price, compareAtPrice: compareAt, currency: preferredCurrency, available: true };
      }
    }
  }
  
  // PRIORITY 2: Shopify multi-currency format (legacy)
  const shopifySaleRegex = new RegExp(
    `Sale\\s*price\\s*\\$([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency}[^\\d]*Regular\\s*price\\s*\\$([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency}`,
    'i'
  );
  const shopifySaleMatch = markdown.match(shopifySaleRegex);
  if (shopifySaleMatch) {
    const salePrice = parseFloat(shopifySaleMatch[1].replace(',', ''));
    const regularPrice = parseFloat(shopifySaleMatch[2].replace(',', ''));
    console.log(`Found Shopify sale format: $${salePrice} ${preferredCurrency}, regular: $${regularPrice}`);
    return { price: salePrice, compareAtPrice: regularPrice, currency: preferredCurrency, available: true };
  }
  
  // PRIORITY 3: Try other currencies as fallback
  for (const cur of currencyPatterns) {
    if (cur === preferredCurrency) continue;
    
    const symbol = getCurrencySymbol(cur);
    const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fallbackPattern = new RegExp(`${escapedSymbol}\\s*([\\d,]+(?:\\.\\d{2})?)(?:\\s*${cur})?`, 'g');
    
    // Try upper section first
    const upperMatches = [...upperMarkdown.matchAll(new RegExp(fallbackPattern.source, fallbackPattern.flags))];
    const upperResult = extractFirstValidPrice(upperMatches, cur);
    if (upperResult) {
      console.log(`Found ${cur} price (upper section, fallback): ${symbol}${upperResult.price}${upperResult.compareAt ? `, compare-at: ${symbol}${upperResult.compareAt}` : ''}`);
      return { price: upperResult.price, compareAtPrice: upperResult.compareAt, currency: cur, available: true };
    }
    
    // Fall back to full page
    const fullMatches = [...markdown.matchAll(new RegExp(fallbackPattern.source, fallbackPattern.flags))];
    const fullResult = extractFirstValidPrice(fullMatches, cur);
    if (fullResult) {
      console.log(`Found ${cur} price (full page, fallback): ${symbol}${fullResult.price}${fullResult.compareAt ? `, compare-at: ${symbol}${fullResult.compareAt}` : ''}`);
      return { price: fullResult.price, compareAtPrice: fullResult.compareAt, currency: cur, available: true };
    }
  }
  
  // PRIORITY 4: Last resort - any price with $ symbol and validation
  // Try upper section first
  const upperDollarPrices = [...upperMarkdown.matchAll(/\$([0-9,]+(?:\.[0-9]{2})?)/g)]
    .map(m => parseFloat(m[1].replace(/,/g, '')))
    .filter(p => validateFilamentPrice(p, 'USD'));
  
  if (upperDollarPrices.length > 0) {
    const price = upperDollarPrices[0];
    const compareAtPrice = upperDollarPrices.length > 1 && upperDollarPrices[1] > price * 1.1 ? upperDollarPrices[1] : null;
    console.log(`Found generic USD price (upper section): $${price}${compareAtPrice ? `, compare-at: $${compareAtPrice}` : ''}`);
    return { price, compareAtPrice, currency: 'USD', available: true };
  }
  
  // Fall back to full page
  const allDollarPrices = [...markdown.matchAll(/\$([0-9,]+(?:\.[0-9]{2})?)/g)]
    .map(m => parseFloat(m[1].replace(/,/g, '')))
    .filter(p => validateFilamentPrice(p, 'USD'));
  
  if (allDollarPrices.length > 0) {
    const price = allDollarPrices[0];
    const compareAtPrice = allDollarPrices.length > 1 && allDollarPrices[1] > price * 1.1 ? allDollarPrices[1] : null;
    console.log(`Found generic USD price (full page): $${price}${compareAtPrice ? `, compare-at: $${compareAtPrice}` : ''}`);
    return { price, compareAtPrice, currency: 'USD', available: true };
  }
  
  console.log('No valid price found in content');
  return { price: null, compareAtPrice: null, currency: preferredCurrency, available: false };
}

// Extract weight from page content
function extractWeightFromContent(markdown: string): number | null {
  const kgMatch = markdown.match(/\b(\d+(?:\.\d+)?)\s*kg\b/i);
  if (kgMatch) return Math.round(parseFloat(kgMatch[1]) * 1000);
  
  const gMatch = markdown.match(/\b(\d{3,4})\s*g(?:ram)?s?\b/i);
  if (gMatch) return Math.round(parseFloat(gMatch[1]));
  
  return null;
}

// Extract diameter from page content
function extractDiameterFromContent(markdown: string, url: string): number | null {
  const urlMatch = url.match(/[_-](1[.-]75|2[.-]85)/i);
  if (urlMatch) return parseFloat(urlMatch[1].replace('-', '.'));
  
  const contentMatch = markdown.match(/\b(1\.75|2\.85)\s*mm\b/i);
  if (contentMatch) return parseFloat(contentMatch[1]);
  
  return null;
}

// Fetch price using Firecrawl API
// skipResolution: set to true when called from resolution retry to prevent infinite loops
// productType: 'filament' (default) or 'printer' - affects price validation ranges
async function fetchPriceWithFirecrawl(
  productUrl: string, 
  preferredCurrency: string,
  brandConfig?: BrandConfig | null,
  skipResolution = false,
  productType: ProductType = 'filament'
): Promise<PriceResponse & { rawSample?: string }> {
  const startTime = Date.now();
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlApiKey) {
    console.error('FIRECRAWL_API_KEY not configured');
    return {
      success: false,
      price: null,
      compareAtPrice: null,
      weightGrams: null,
      diameterMm: null,
      variantTitle: null,
      currency: preferredCurrency,
      available: false,
      source: 'firecrawl',
      fetchedAt: new Date().toISOString(),
      error: 'Firecrawl not configured',
    };
  }
  
  const location = getFirecrawlLocation(preferredCurrency);
  
  console.log('=== FIRECRAWL REQUEST ===');
  console.log('URL:', productUrl);
  console.log('Location:', location.country);
  console.log('Currency:', preferredCurrency);
  console.log('Reason:', isGeoRedirectDomain(productUrl) ? 'geo-redirect-bypass' : 'standard');
  
  // For Creality stores, disable onlyMainContent as their pricing section is often excluded
  const isCreality = productUrl.includes('store.creality.com');
  const useMainContentOnly = !isCreality;
  
  try {
    const MAX_FIRECRAWL_RETRIES = 2;
    let response: Response | null = null;
    let lastNetworkError: string | null = null;
    
    for (let attempt = 0; attempt <= MAX_FIRECRAWL_RETRIES; attempt++) {
      try {
        response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: productUrl,
            formats: ['markdown'],
            onlyMainContent: useMainContentOnly,
            waitFor: isCreality ? 5000 : 3000,
            location: location,
          }),
        });
        lastNetworkError = null;
      } catch (networkErr) {
        // Network-level errors (TCP connection failures, DNS errors, timeouts)
        const errMsg = networkErr instanceof Error ? networkErr.message : String(networkErr);
        lastNetworkError = errMsg;
        console.error(`Firecrawl network error on attempt ${attempt + 1}/${MAX_FIRECRAWL_RETRIES + 1}: ${errMsg}`);
        
        if (attempt < MAX_FIRECRAWL_RETRIES) {
          const delayMs = 2000 * (attempt + 1);
          console.log(`Retrying after ${delayMs}ms...`);
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }
        
        // Exhausted retries on network error
        return {
          success: false,
          price: null,
          compareAtPrice: null,
          weightGrams: null,
          diameterMm: null,
          variantTitle: null,
          currency: preferredCurrency,
          available: false,
          source: 'firecrawl',
          fetchedAt: new Date().toISOString(),
          error: `Firecrawl network error: ${errMsg}`,
        };
      }
      
      if (response.ok) break;
      
      // Retry only on 5xx errors
      if (attempt < MAX_FIRECRAWL_RETRIES && [500, 502, 503].includes(response.status)) {
        const delayMs = 2000 * (attempt + 1);
        console.log(`Firecrawl returned ${response.status}, retrying (${attempt + 1}/${MAX_FIRECRAWL_RETRIES}) after ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }
      
      // Final failure or non-retryable error
      const errorText = await response.text();
      console.error(`Firecrawl API error: ${response.status} - ${errorText}`);
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: 'firecrawl',
        fetchedAt: new Date().toISOString(),
        error: `Firecrawl error: ${response.status}`,
      };
    }
    
    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || '';
    const metadata = data.data?.metadata || data.metadata || {};
    const sourceURL = metadata.sourceURL || metadata.url || null;
    
    // Detect URL redirects - Firecrawl returns the final URL after any redirects
    if (sourceURL && sourceURL !== productUrl) {
      console.log(`URL redirect detected: ${productUrl} -> ${sourceURL}`);
      
      // Attempt to auto-update the product URL if it's a valid redirect
      const updated = await handleUrlRedirect(productUrl, sourceURL);
      if (updated) {
        console.log('Product URL auto-updated from redirect');
      }
    }
    
    if (!markdown) {
      console.error('No markdown content returned from Firecrawl');
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: 'firecrawl',
        fetchedAt: new Date().toISOString(),
        error: 'No content returned',
      };
    }
    
    console.log('=== FIRECRAWL RESPONSE ===');
    console.log('Markdown length:', markdown?.length);
    console.log('First 2000 chars of markdown:', markdown?.substring(0, 2000));
    console.log('Contains $18.99:', markdown?.includes('$18.99'));
    console.log('Contains $24.99:', markdown?.includes('$24.99'));
    console.log('Contains $29.99:', markdown?.includes('$29.99'));
    console.log('Contains "Hyper ABS":', markdown?.includes('Hyper ABS'));
    console.log('Contains "Add to Cart":', markdown?.includes('Add to Cart'));
    
    // Check for 404/not found content BEFORE extracting prices
    if (is404Content(markdown)) {
      console.log(`Detected 404 content for: ${productUrl}`);
      
      // Attempt search resolution unless we're already in a resolution retry
      if (!skipResolution) {
        return await handle404WithResolution(productUrl, preferredCurrency, brandConfig || null, 'firecrawl', '404_content');
      }
      
      // We're in a resolution retry - just log and return 404
      await logBrokenUrl(productUrl, '404_content');
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: 'firecrawl',
        fetchedAt: new Date().toISOString(),
        error: 'PRODUCT_PAGE_NOT_FOUND',
        is404: true,
      };
    }
    
    let priceData: { price: number | null; compareAtPrice: number | null; currency: string; available: boolean };
    
    // For printers, use dedicated printer extraction with higher price range
    if (productType === 'printer') {
      console.log('Using PRINTER extraction (price range $99-$10000)');
      priceData = extractPrinterPrice(markdown, preferredCurrency);
    }
    // Use configured extraction if available and working
    else if (brandConfig && brandConfig.extraction_working && brandConfig.extraction_method !== 'auto') {
      console.log(`Using configured extraction for ${brandConfig.brand_name}`);
      const configResult = extractPriceWithConfig(
        markdown,
        brandConfig.price_extraction_config || {},
        brandConfig.default_currency || preferredCurrency
      );
      priceData = configResult;
      
      if (configResult.matchedPattern) {
        console.log(`Config extraction matched pattern: ${configResult.matchedPattern}`);
      }
    } else {
      // Legacy extraction logic for filaments
      const isOpenCart = productUrl.includes('geeetech.com');
      const isCreality = productUrl.includes('store.creality.com');
      
      if (isCreality) {
        priceData = extractCrealityPrice(markdown);
      } else if (isOpenCart) {
        priceData = extractOpenCartPrice(markdown);
      } else {
        priceData = extractBambuLabPrice(markdown, preferredCurrency);
      }
    }
    
    const weightGrams = extractWeightFromContent(markdown);
    const diameterMm = extractDiameterFromContent(markdown, productUrl);
    const responseTimeMs = Date.now() - startTime;
    
    // Log extraction attempt
    await logExtractionAttempt(
      brandConfig?.id || null,
      brandConfig?.brand_slug || null,
      productUrl,
      brandConfig?.extraction_method || 'legacy',
      priceData.price !== null,
      priceData.price,
      priceData.currency,
      priceData.price === null ? 'Could not extract price' : null,
      markdown.substring(0, 500),
      responseTimeMs
    );
    
    if (priceData.price === null) {
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams,
        diameterMm,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: 'firecrawl',
        fetchedAt: new Date().toISOString(),
        error: 'Could not extract price from page',
        rawSample: markdown.substring(0, 500),
      };
    }
    
    // Check stock availability from page content (in addition to price extraction)
    const stockStatus = detectStockStatus(markdown);
    const isSoldOut = stockStatus === 'out_of_stock';
    const available = priceData.available && !isSoldOut;
    
    console.log(`Firecrawl price extracted: ${priceData.price} ${priceData.currency} (compare: ${priceData.compareAtPrice}, available: ${available}, stockStatus: ${stockStatus})`);
    
    return {
      success: true,
      price: priceData.price,
      compareAtPrice: priceData.compareAtPrice,
      weightGrams,
      diameterMm,
      variantTitle: null,
      currency: priceData.currency,
      available: available,
      stockStatus: isSoldOut ? 'out_of_stock' : (stockStatus !== 'unknown' ? stockStatus : (available ? 'in_stock' : 'out_of_stock')),
      source: 'firecrawl',
      fetchedAt: new Date().toISOString(),
      rawSample: markdown.substring(0, 500),
    };
  } catch (error) {
    console.error('Firecrawl fetch error:', error);
    return {
      success: false,
      price: null,
      compareAtPrice: null,
      weightGrams: null,
      diameterMm: null,
      variantTitle: null,
      currency: preferredCurrency,
      available: false,
      source: 'firecrawl',
      fetchedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Parse weight from variant title
function parseWeightFromTitle(title: string): number | null {
  if (!title) return null;
  
  const kgMatch = title.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) return Math.round(parseFloat(kgMatch[1]) * 1000);
  
  const gMatch = title.match(/(\d+(?:\.\d+)?)\s*g(?:ram)?s?(?!\w)/i);
  if (gMatch) return Math.round(parseFloat(gMatch[1]));
  
  const lbMatch = title.match(/(\d+(?:\.\d+)?)\s*lb/i);
  if (lbMatch) return Math.round(parseFloat(lbMatch[1]) * 453.592);
  
  return null;
}

// ===== SMART VARIANT SELECTION =====
// Prefer consumer-sized spools (750g-1500g) over bulk (10kg) or samples (100g)

/** Preferred weight range for consumer spools (in grams) */
const PREFERRED_MIN_WEIGHT = 750;
const PREFERRED_MAX_WEIGHT = 1500;
const ACCEPTABLE_MAX_WEIGHT = 5500; // Up to 5kg spools are acceptable

interface VariantWithWeight {
  variant: ShopifyVariant;
  weightGrams: number | null;
}

/**
 * Select the best variant based on weight preference.
 * Priority: 1) ~1kg variants (750g-1500g), 2) acceptable range (up to 5.5kg), 3) first available
 */
function selectBestVariantByWeight(variants: ShopifyVariant[], productTitle: string, targetWeightGrams: number | null = null): ShopifyVariant {
  // Parse weights for all available variants
  const variantsWithWeights: VariantWithWeight[] = variants
    .filter(v => v.available !== false) // Include available or unknown availability
    .map(v => ({
      variant: v,
      weightGrams: parseWeightFromTitle(v.title) || 
                   (v.grams && v.grams >= 250 && v.grams <= 15000 ? v.grams : null)
    }));
  
  console.log('Variant weights:', variantsWithWeights.map(vw => 
    `"${vw.variant.title}" → ${vw.weightGrams}g, $${vw.variant.price}`
  ).join(' | '));
  
  // Priority 0: If target weight provided from database, find exact match first
  if (targetWeightGrams !== null && targetWeightGrams > 0) {
    const tolerance = targetWeightGrams * 0.1; // 10% tolerance
    const exactMatch = variantsWithWeights.find(vw => 
      vw.weightGrams !== null && 
      Math.abs(vw.weightGrams - targetWeightGrams) <= tolerance
    );
    if (exactMatch) {
      console.log(`✓ Exact weight match: "${exactMatch.variant.title}" (${exactMatch.weightGrams}g ≈ ${targetWeightGrams}g target)`);
      return exactMatch.variant;
    }
    console.log(`No exact match for ${targetWeightGrams}g target, falling back to priority system`);
  }
  
  // Priority 1: Find variants in preferred range (750g-1500g, typical 1kg spool)
  const preferredVariants = variantsWithWeights.filter(vw => 
    vw.weightGrams !== null && 
    vw.weightGrams >= PREFERRED_MIN_WEIGHT && 
    vw.weightGrams <= PREFERRED_MAX_WEIGHT
  );
  
  if (preferredVariants.length > 0) {
    // Pick the one closest to 1000g
    preferredVariants.sort((a, b) => 
      Math.abs(a.weightGrams! - 1000) - Math.abs(b.weightGrams! - 1000)
    );
    console.log(`✓ Selected preferred variant: "${preferredVariants[0].variant.title}" (${preferredVariants[0].weightGrams}g)`);
    return preferredVariants[0].variant;
  }
  
  // Priority 2: Find variants in acceptable range (up to 5.5kg) but not bulk
  const acceptableVariants = variantsWithWeights.filter(vw => 
    vw.weightGrams !== null && 
    vw.weightGrams >= 250 && 
    vw.weightGrams <= ACCEPTABLE_MAX_WEIGHT
  );
  
  if (acceptableVariants.length > 0) {
    // Pick the smallest acceptable weight (prefer smaller over bulk)
    acceptableVariants.sort((a, b) => a.weightGrams! - b.weightGrams!);
    console.log(`✓ Selected acceptable variant: "${acceptableVariants[0].variant.title}" (${acceptableVariants[0].weightGrams}g)`);
    return acceptableVariants[0].variant;
  }
  
  // Priority 3: Fallback to first available variant (original behavior)
  const availableVariant = variants.find(v => v.available);
  const fallback = availableVariant || variants[0];
  console.log(`⚠ No weight-matched variant found, using fallback: "${fallback.title}"`);
  return fallback;
}

// Parse pack quantity from product content
function parsePackQuantity(title: string, content?: string): number {
  const textToSearch = `${title} ${content || ''}`;
  
  const packMatch = textToSearch.match(/(\d+)\s*(?:pcs?|pack|rolls?|spools?|pieces?|x\s*\d)/i);
  if (packMatch) {
    const qty = parseInt(packMatch[1]);
    if (qty > 1 && qty <= 100) return qty;
  }
  
  return 1;
}

// Parse diameter from URL or title
function parseDiameter(url: string, title: string): number | null {
  const urlDashMatch = url.match(/[_-](1[.-]75|2[.-]85|3[.-]00?)/i);
  if (urlDashMatch) {
    const normalized = urlDashMatch[1].replace('-', '.').replace(',', '.');
    return parseFloat(normalized);
  }
  
  const titleMmMatch = title?.match(/(1\.75|2\.85|3\.00?)\s*mm/i);
  if (titleMmMatch) return parseFloat(titleMmMatch[1]);
  
  const titleDiamMatch = title?.match(/\b(1\.75|2\.85|3\.00?)\b/);
  if (titleDiamMatch) return parseFloat(titleDiamMatch[1]);
  
  return null;
}

// Detect platform from URL
function detectPlatform(url: string): 'shopify' | 'unknown' {
  const shopifyIndicators = ['/products/', '.myshopify.com', 'cdn.shopify.com'];
  
  for (const indicator of shopifyIndicators) {
    if (url.includes(indicator)) return 'shopify';
  }
  
  return 'unknown';
}

// Get Shopify JSON URL from product URL
function getShopifyJsonUrl(url: string): string {
  const cleanUrl = url.split('?')[0].split('#')[0];
  return cleanUrl.endsWith('.json') ? cleanUrl : `${cleanUrl}.json`;
}

// Extract variant ID from URL query parameter
function extractVariantIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('variant') || null;
  } catch {
    const match = url.match(/[?&]variant=(\d+)/);
    return match ? match[1] : null;
  }
}

// Detect currency from URL domain
function detectCurrencyFromUrl(url: string): string {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('.ca') || urlLower.includes('ca.')) return 'CAD';
  if (urlLower.includes('.co.uk') || urlLower.includes('uk.')) return 'GBP';
  if (urlLower.includes('.eu') || urlLower.includes('.de') || urlLower.includes('.fr') || urlLower.includes('.it')) return 'EUR';
  if (urlLower.includes('.au') || urlLower.includes('au.')) return 'AUD';
  if (urlLower.includes('.jp') || urlLower.includes('jp.')) return 'JPY';
  
  return 'USD';
}

// Fetch price from Shopify JSON API
async function fetchShopifyPrice(productUrl: string, preferredCurrency: string, targetWeightGrams: number | null = null): Promise<PriceResponse & { fetchMethod?: FetchMethod }> {
  const jsonUrl = getShopifyJsonUrl(productUrl);
  console.log(`Fetching Shopify JSON from: ${jsonUrl}`);
  
  // Determine target region from currency for geo-bypass headers
  const regionFromCurrency: Record<string, string> = {
    CAD: 'CA', GBP: 'UK', EUR: 'EU', AUD: 'AU', JPY: 'JP',
  };
  const targetRegion = regionFromCurrency[preferredCurrency] || 'US';
  const isKnownGeoRedirector = isGeoRedirectDomain(productUrl);
  
  try {
    // Build region-aware headers for Shopify JSON API
    const regionHeaders = getRegionHeaders(targetRegion);
    const headers: Record<string, string> = {
      ...regionHeaders,
      'Accept': 'application/json', // Override to request JSON
    };
    
    let response: Response;
    let fetchMethod: FetchMethod = 'direct';
    
    if (isKnownGeoRedirector) {
      // Method 1: Try with region headers, manual redirect handling
      console.log(`[GeoBypass] Shopify fetch using region headers for ${targetRegion}`);
      response = await fetch(jsonUrl, { headers, redirect: 'manual' });
      
      if (response.status >= 300 && response.status < 400) {
        const redirectUrl = response.headers.get('location') || '';
        const fullRedirect = redirectUrl.startsWith('/') ? `${new URL(jsonUrl).origin}${redirectUrl}` : redirectUrl;
        
        if (isGeoRedirect(jsonUrl, fullRedirect)) {
          console.log(`[GeoBypass] Geo-redirect detected: ${jsonUrl} → ${fullRedirect}, trying spoofed headers`);
          await response.text().catch(() => {}); // consume body
          
          // Method 2: Spoofed headers
          const spoofedHeaders = { ...getSpoofedHeaders(targetRegion), 'Accept': 'application/json' };
          response = await fetch(jsonUrl, { headers: spoofedHeaders, redirect: 'manual' });
          fetchMethod = 'spoofed';
          
          if (response.status >= 300 && response.status < 400) {
            console.log(`[GeoBypass] Spoofed headers still redirected, following redirect`);
            await response.text().catch(() => {});
            response = await fetch(jsonUrl, { headers, redirect: 'follow' });
            fetchMethod = 'redirected';
          }
        } else {
          // Legitimate redirect, follow it
          await response.text().catch(() => {});
          response = await fetch(fullRedirect, { headers });
        }
      }
    } else {
      response = await fetch(jsonUrl, { headers });
    }
    
    if (!response.ok) {
      console.error(`Shopify fetch failed: ${response.status} ${response.statusText}`);
      
      // Check for 404 specifically - attempt search resolution
      if (response.status === 404) {
        console.log(`Detected 404 for Shopify product: ${productUrl}`);
        return await handle404WithResolution(productUrl, preferredCurrency, null, 'shopify', '404_http');
      }
      
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: 'shopify',
        fetchedAt: new Date().toISOString(),
        error: `HTTP ${response.status}`,
      };
    }
    
    const data: ShopifyProduct = await response.json();
    
    if (!data.product?.variants?.length) {
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: 'shopify',
        fetchedAt: new Date().toISOString(),
        error: 'No variants found',
      };
    }
    
    const requestedVariantId = extractVariantIdFromUrl(productUrl);
    let variant: ShopifyVariant;
    
    if (requestedVariantId) {
      const matchedVariant = data.product.variants.find(v => String(v.id) === requestedVariantId);
      if (matchedVariant) {
        variant = matchedVariant;
        console.log(`Found requested variant ${requestedVariantId}: "${variant.title}"`);
      } else {
        console.log(`Requested variant ${requestedVariantId} not found, using smart weight selection`);
        variant = selectBestVariantByWeight(data.product.variants, data.product.title, targetWeightGrams);
      }
    } else {
      // No variant ID specified - use smart weight-based selection
      // This prevents picking bulk sizes (10kg @ $450) over consumer sizes (1kg @ $50)
      console.log(`No variant ID in URL, using smart weight selection for ${data.product.variants.length} variants`);
      variant = selectBestVariantByWeight(data.product.variants, data.product.title, targetWeightGrams);
    }
    
    const price = parseFloat(variant.price);
    const compareAtPrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
    
    const weightFromVariantTitle = parseWeightFromTitle(variant.title);
    const weightFromProductTitle = parseWeightFromTitle(data.product.title);
    const isReasonableGrams = variant.grams && variant.grams >= 250 && variant.grams <= 3000;
    let singleSpoolWeight = weightFromVariantTitle || weightFromProductTitle || (isReasonableGrams ? variant.grams : null) || null;
    
    const packQuantity = parsePackQuantity(data.product.title, variant.title);
    const weightGrams = singleSpoolWeight !== null ? singleSpoolWeight * packQuantity : null;
    
    console.log(`Weight extraction: variant="${variant.title}", product="${data.product.title}", singleSpool=${singleSpoolWeight}g, packQty=${packQuantity}, total=${weightGrams}g`);
    
    const diameterMm = parseDiameter(productUrl, variant.title) || parseDiameter(productUrl, data.product.title);
    const detectedCurrency = detectCurrencyFromUrl(productUrl);
    
    console.log(`Shopify price fetched: ${price} ${detectedCurrency} (weight: ${weightGrams}g, diameter: ${diameterMm}mm, available: ${variant.available})`);
    
    return {
      success: true,
      price,
      compareAtPrice,
      weightGrams,
      diameterMm,
      variantTitle: variant.title,
      currency: detectedCurrency,
      available: variant.available,
      source: 'shopify',
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Shopify fetch error:', error);
    return {
      success: false,
      price: null,
      compareAtPrice: null,
      weightGrams: null,
      diameterMm: null,
      variantTitle: null,
      currency: preferredCurrency,
      available: false,
      source: 'shopify',
      fetchedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productUrl, currency = 'USD', forceRefresh = false, targetWeightGrams = null, productType = 'filament' } = await req.json();
    
    if (!productUrl) {
      return new Response(
        JSON.stringify({ error: 'productUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Getting current price for: ${productUrl} (preferred currency: ${currency}${forceRefresh ? ', FORCE REFRESH' : ''})`);
    
    // Transform URL to regional store if applicable
    const { url: regionalUrl, expectedCurrency, transformed } = transformToRegionalUrl(productUrl, currency);
    const urlToFetch = regionalUrl;
    
    if (transformed) {
      console.log(`Transformed to regional URL: ${urlToFetch} (expected currency: ${expectedCurrency})`);
    }
    
    // Rate limit check for manual refresh
    if (forceRefresh) {
      const canRefresh = await canForceRefresh(productUrl);
      if (!canRefresh) {
        console.log('Rate limited: manual refresh already performed for this URL in last minute');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Rate limited: Please wait at least 1 minute between manual refreshes for this product',
            price: null,
            compareAtPrice: null,
            weightGrams: null,
            diameterMm: null,
            variantTitle: null,
            currency,
            available: false,
            source: 'firecrawl',
            fetchedAt: new Date().toISOString(),
            requestedCurrency: currency,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Manual refresh rate limit check passed');
    }
    
    // Look up brand config from database
    const brandConfig = await findBrandConfigByUrl(urlToFetch);
    if (brandConfig) {
      console.log(`Found brand config: ${brandConfig.brand_name} (method: ${brandConfig.extraction_method}, working: ${brandConfig.extraction_working})`);
      
      // If brand extraction is marked as not working, log and continue with fallback
      if (!brandConfig.extraction_working) {
        console.log(`Brand ${brandConfig.brand_name} extraction marked as not working, using fallback`);
      }
    }
    
    const startTime = Date.now();
    
    // Check for custom storefronts first (they don't support Shopify JSON)
    const customStorefront = detectCustomStorefront(urlToFetch);
    let result: PriceResponse;
    
    if (customStorefront) {
      console.log(`Detected custom storefront: ${customStorefront}, using Firecrawl (productType: ${productType})`);
      result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
    } else if (shouldAlwaysUseFirecrawl(urlToFetch)) {
      console.log(`Store has unreliable JSON API, using Firecrawl for accurate pricing (productType: ${productType})`);
      result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
    } else if (isGeoRedirectDomain(urlToFetch) && expectedCurrency !== 'USD') {
      console.log(`Geo-redirect domain with ${expectedCurrency}, using Firecrawl directly (productType: ${productType})`);
      result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
    } else if (brandConfig && brandConfig.extraction_method === 'firecrawl') {
      // Brand config explicitly requests Firecrawl
      console.log(`Brand config requests Firecrawl extraction (productType: ${productType})`);
      result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
    } else {
      // Try Shopify JSON API for standard stores
      const platform = detectPlatform(urlToFetch);
      
      if (platform === 'shopify') {
        const isMultiCurrency = isMultiCurrencyShopifyStore(urlToFetch);
        
        if (isMultiCurrency && currency !== 'USD') {
          console.log(`Multi-currency Shopify store detected (${currency} requested), using Firecrawl (productType: ${productType})`);
          result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
        } else {
          result = await fetchShopifyPrice(urlToFetch, expectedCurrency, targetWeightGrams);
          
          if (!result.success) {
            console.log(`Shopify failed, trying Firecrawl as fallback... (productType: ${productType})`);
            result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
          }
        }
      } else {
        console.log(`Unknown platform, trying Firecrawl... (productType: ${productType})`);
        result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
      }
    }

    // Add currency validation metadata to response
    result.sourceUrl = urlToFetch;
    result.requestedCurrency = currency;
    
    // Check for currency mismatch
    if (result.success && result.currency !== expectedCurrency) {
      result.currencyMismatch = true;
      result.detectedCurrency = result.currency;
      console.log(`⚠️ Currency mismatch: expected ${expectedCurrency} but got ${result.currency}`);
    } else if (result.success) {
      result.currencyMismatch = false;
      result.detectedCurrency = result.currency;
    }

    // Update database with fresh stock status if successful (async, non-blocking)
    if (result.success) {
      // Fire and forget - don't block the response
      updateFilamentStockStatus(
        productUrl, // Use original URL for DB lookup
        result.available,
        result.stockStatus || (result.available ? 'in_stock' : 'out_of_stock'),
        result.price
      ).catch(err => console.error('Background stock update failed:', err));
    }

    // Log manual refresh and add refreshedAt to response
    if (forceRefresh) {
      const responseTimeMs = Date.now() - startTime;
      await logExtractionAttempt(
        brandConfig?.id || null,
        brandConfig?.brand_slug || null,
        urlToFetch,
        'manual_refresh',
        result.success,
        result.price,
        result.currency,
        result.error || null,
        null,
        responseTimeMs
      );
      
      // Add refreshedAt to response
      if (result.success) {
        result.refreshedAt = new Date().toISOString();
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-current-price:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: 'USD',
        available: false,
        source: 'firecrawl',
        fetchedAt: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
