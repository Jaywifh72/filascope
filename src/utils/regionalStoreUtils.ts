import { supabase } from '@/integrations/supabase/client';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { REGION_FALLBACK_ORDER } from '@/config/regions';
import { CURRENCIES } from '@/config/currencies';

// =============================================================================
// Type Definitions
// =============================================================================

export interface RegionalStoreInfo {
  id: string;
  brand_id: string;
  region_code: RegionCode;
  store_name: string;
  base_url: string;
  product_url_pattern: string | null;
  currency_code: CurrencyCode;
  ships_from_country: string | null;
  free_shipping_threshold: number | null;
  estimated_shipping_days: number | null;
  is_primary: boolean;
  is_active: boolean;
  supports_local_shipping: boolean;
}

export interface RegionalPriceResult {
  displayPrice: number;
  displayCurrency: CurrencyCode;
  formattedPrice: string;
  originalPrice: number;
  originalCurrency: CurrencyCode;
  isConverted: boolean;
  conversionRate: number | null;
  store: RegionalStoreInfo | null;
  tooltipData: {
    originalFormatted: string;
    rateInfo: string;
  } | null;
}

export interface PriceDisplayOptions {
  showApproximate?: boolean;
  compact?: boolean;
  includeTooltip?: boolean;
}

export interface RegionalStoreUrlResult {
  url: string;
  storeRegion: RegionCode;
  isFromFallback: boolean;
}

export interface BestStoreResult {
  store: RegionalStoreInfo | null;
  isFallback: boolean;
}

// =============================================================================
// In-Memory Cache
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const storeCache = new Map<string, CacheEntry<RegionalStoreInfo | null>>();
const brandStoresCache = new Map<string, CacheEntry<RegionalStoreInfo[]>>();

function getCacheKey(brandName: string, region?: RegionCode): string {
  const normalizedBrand = brandName.toLowerCase().trim();
  return region ? `${normalizedBrand}_${region}` : normalizedBrand;
}

function isCacheValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Maps a country code to its corresponding region code
 */
function getRegionFromCountry(countryCode: string | null): RegionCode | null {
  if (!countryCode) return null;
  
  const countryToRegion: Record<string, RegionCode> = {
    'US': 'US',
    'CA': 'CA',
    'GB': 'UK',
    'UK': 'UK',
    'DE': 'EU',
    'FR': 'EU',
    'IT': 'EU',
    'ES': 'EU',
    'NL': 'EU',
    'BE': 'EU',
    'AT': 'EU',
    'PL': 'EU',
    'CZ': 'EU',
    'AU': 'AU',
    'NZ': 'AU',
    'JP': 'JP',
    'CN': 'CN',
    'HK': 'CN',
  };
  
  return countryToRegion[countryCode.toUpperCase()] || null;
}

/**
 * Interpolates product URL pattern with product identifier
 * Supports {sku}, {slug}, and {product} placeholders
 */
export function interpolateProductUrl(pattern: string, productSlug: string): string {
  return pattern
    .replace(/{sku}/gi, productSlug)
    .replace(/{slug}/gi, productSlug)
    .replace(/{product}/gi, productSlug);
}

/**
 * Transforms database row to RegionalStoreInfo
 */
function transformToStoreInfo(row: any, regionCode: RegionCode): RegionalStoreInfo {
  const shipsFromRegion = getRegionFromCountry(row.ships_from_country);
  
  return {
    id: row.id,
    brand_id: row.brand_id,
    region_code: regionCode,
    store_name: row.store_name,
    base_url: row.base_url,
    product_url_pattern: row.product_url_pattern,
    currency_code: row.currency_code as CurrencyCode,
    ships_from_country: row.ships_from_country,
    free_shipping_threshold: row.free_shipping_threshold,
    estimated_shipping_days: row.estimated_shipping_days,
    is_primary: row.is_primary ?? false,
    is_active: row.is_active ?? true,
    supports_local_shipping: shipsFromRegion === regionCode,
  };
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Get regional store info for a specific brand and region
 * Returns null if no store found
 */
export async function getRegionalStoreInfo(
  brandName: string | null,
  region: RegionCode
): Promise<RegionalStoreInfo | null> {
  if (!brandName) return null;

  const cacheKey = getCacheKey(brandName, region);
  const cached = storeCache.get(cacheKey);
  
  if (isCacheValid(cached)) {
    return cached.data;
  }

  try {
    // Query brand_regional_stores joining with automated_brands
    const { data, error } = await supabase
      .from('brand_regional_stores')
      .select(`
        *,
        automated_brands!inner(brand_name)
      `)
      .ilike('automated_brands.brand_name', brandName)
      .eq('region_code', region)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(`[regionalStoreUtils] Error fetching store for ${brandName}/${region}:`, error.message);
      return null;
    }

    const result = data ? transformToStoreInfo(data, region) : null;
    
    // Cache the result
    storeCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (err) {
    console.warn(`[regionalStoreUtils] Unexpected error fetching store:`, err);
    return null;
  }
}

/**
 * Get all active regional stores for a brand
 */
export async function getBrandRegionalStores(
  brandName: string | null
): Promise<RegionalStoreInfo[]> {
  if (!brandName) return [];

  const cacheKey = getCacheKey(brandName);
  const cached = brandStoresCache.get(cacheKey);
  
  if (isCacheValid(cached)) {
    return cached.data;
  }

  try {
    const { data, error } = await supabase
      .from('brand_regional_stores')
      .select(`
        *,
        automated_brands!inner(brand_name)
      `)
      .ilike('automated_brands.brand_name', brandName)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('region_code', { ascending: true });

    if (error) {
      console.warn(`[regionalStoreUtils] Error fetching stores for ${brandName}:`, error.message);
      return [];
    }

    const results = (data || []).map(row => 
      transformToStoreInfo(row, row.region_code as RegionCode)
    );
    
    // Cache the result
    brandStoresCache.set(cacheKey, { data: results, timestamp: Date.now() });
    
    return results;
  } catch (err) {
    console.warn(`[regionalStoreUtils] Unexpected error fetching brand stores:`, err);
    return [];
  }
}

/**
 * Find the best store for a user's region using fallback logic
 */
export async function findBestStoreForRegion(
  brandName: string | null,
  userRegion: RegionCode,
  fallbackOrder?: RegionCode[]
): Promise<BestStoreResult> {
  if (!brandName) {
    return { store: null, isFallback: false };
  }

  // 1. Try user's exact region first
  const exactStore = await getRegionalStoreInfo(brandName, userRegion);
  if (exactStore) {
    return { store: exactStore, isFallback: false };
  }

  // 2. Get all stores for the brand (cached)
  const allStores = await getBrandRegionalStores(brandName);
  if (allStores.length === 0) {
    return { store: null, isFallback: false };
  }

  // 3. Try fallback order
  const fallbacks = fallbackOrder || REGION_FALLBACK_ORDER[userRegion] || [];
  for (const fallbackRegion of fallbacks) {
    const fallbackStore = allStores.find(s => s.region_code === fallbackRegion);
    if (fallbackStore) {
      return { store: fallbackStore, isFallback: true };
    }
  }

  // 4. Ultimate fallback to US
  if (userRegion !== 'US') {
    const usStore = allStores.find(s => s.region_code === 'US');
    if (usStore) {
      return { store: usStore, isFallback: true };
    }
  }

  // 5. Return any available store (prefer primary)
  const primaryStore = allStores.find(s => s.is_primary);
  return { 
    store: primaryStore || allStores[0] || null, 
    isFallback: true 
  };
}

/**
 * Get regional store URL for a product
 */
export async function getRegionalStoreUrl(
  brandName: string | null,
  region: RegionCode,
  productSlug?: string,
  fallbackOrder?: RegionCode[]
): Promise<RegionalStoreUrlResult | null> {
  const { store, isFallback } = await findBestStoreForRegion(brandName, region, fallbackOrder);
  
  if (!store) {
    return null;
  }

  let url: string;
  
  if (productSlug && store.product_url_pattern) {
    url = interpolateProductUrl(store.product_url_pattern, productSlug);
  } else {
    url = store.base_url;
  }

  return {
    url,
    storeRegion: store.region_code,
    isFromFallback: isFallback,
  };
}

// =============================================================================
// Price Formatting
// =============================================================================

/**
 * Format a price with currency symbol
 */
function formatPriceWithSymbol(
  price: number, 
  currencyCode: CurrencyCode,
  compact?: boolean
): string {
  const currency = CURRENCIES[currencyCode];
  if (!currency) {
    return `${currencyCode} ${price.toFixed(2)}`;
  }

  let formattedValue: string;
  
  if (compact && price >= 1000) {
    formattedValue = (price / 1000).toFixed(1) + 'k';
  } else {
    formattedValue = price.toFixed(currency.decimalPlaces);
  }

  return currency.symbolPosition === 'before'
    ? `${currency.symbol}${formattedValue}`
    : `${formattedValue}${currency.symbol}`;
}

/**
 * Format regional price with conversion if needed
 */
export function formatRegionalPrice(
  price: number,
  sourceCurrency: CurrencyCode,
  targetCurrency: CurrencyCode,
  exchangeRates: Map<string, number>,
  options: PriceDisplayOptions = {}
): RegionalPriceResult {
  const { showApproximate = true, compact = false, includeTooltip = true } = options;

  // Same currency - no conversion needed
  if (sourceCurrency === targetCurrency) {
    const formattedPrice = formatPriceWithSymbol(price, targetCurrency, compact);
    
    return {
      displayPrice: price,
      displayCurrency: targetCurrency,
      formattedPrice,
      originalPrice: price,
      originalCurrency: sourceCurrency,
      isConverted: false,
      conversionRate: null,
      store: null,
      tooltipData: null,
    };
  }

  // Need to convert
  let conversionRate: number | null = null;
  let convertedPrice = price;

  // Try direct rate first
  const directKey = `${sourceCurrency}_${targetCurrency}`;
  if (exchangeRates.has(directKey)) {
    conversionRate = exchangeRates.get(directKey)!;
    convertedPrice = price * conversionRate;
  } else {
    // Convert via USD intermediate
    const sourceToUsd = exchangeRates.get(`${sourceCurrency}_USD`) || 1;
    const usdToTarget = exchangeRates.get(`USD_${targetCurrency}`) || 1;
    
    if (sourceCurrency === 'USD') {
      conversionRate = usdToTarget;
    } else if (targetCurrency === 'USD') {
      conversionRate = sourceToUsd;
    } else {
      conversionRate = sourceToUsd * usdToTarget;
    }
    
    convertedPrice = price * conversionRate;
  }

  const baseFormatted = formatPriceWithSymbol(convertedPrice, targetCurrency, compact);
  const formattedPrice = showApproximate ? `~${baseFormatted}` : baseFormatted;

  // Build tooltip data
  let tooltipData: RegionalPriceResult['tooltipData'] = null;
  if (includeTooltip && conversionRate) {
    const originalFormatted = formatPriceWithSymbol(price, sourceCurrency, false);
    const rateInfo = `1 ${sourceCurrency} = ${conversionRate.toFixed(4)} ${targetCurrency}`;
    tooltipData = { originalFormatted, rateInfo };
  }

  return {
    displayPrice: convertedPrice,
    displayCurrency: targetCurrency,
    formattedPrice,
    originalPrice: price,
    originalCurrency: sourceCurrency,
    isConverted: true,
    conversionRate,
    store: null,
    tooltipData,
  };
}

// =============================================================================
// Cache Management
// =============================================================================

/**
 * Clear all caches (useful on region change or for testing)
 */
export function clearRegionalStoreCache(): void {
  storeCache.clear();
  brandStoresCache.clear();
}

/**
 * Clear cache for a specific brand
 */
export function clearBrandCache(brandName: string): void {
  const normalizedBrand = brandName.toLowerCase().trim();
  
  // Clear from store cache
  for (const key of storeCache.keys()) {
    if (key.startsWith(normalizedBrand)) {
      storeCache.delete(key);
    }
  }
  
  // Clear from brand stores cache
  brandStoresCache.delete(normalizedBrand);
}
