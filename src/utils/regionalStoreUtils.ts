import { supabase } from '@/integrations/supabase/client';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { REGION_FALLBACK_ORDER, REGIONS } from '@/config/regions';
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
// Edge Case Types
// =============================================================================

export type RegionalAvailabilityStatus = 
  | 'available_local'      // Store in user's exact region
  | 'available_fallback'   // Store in fallback region
  | 'available_international' // Brand has no regional stores, use product URL
  | 'not_available';       // No stores and no product URL

export interface RegionalAvailabilityResult {
  status: RegionalAvailabilityStatus;
  store: RegionalStoreInfo | null;
  url: string | null;
  message: string;
  badge: 'local' | 'regional' | 'international' | null;
  suggestedRegion: RegionCode | null;
  suggestedStores: RegionalStoreInfo[];
}

export interface PriceFallbackResult {
  displayPrice: number;
  displayCurrency: CurrencyCode;
  formattedPrice: string;
  isConverted: boolean;
  conversionRate: number | null;
  hasValidRate: boolean;
  fallbackMessage: string | null;
  tooltipData: {
    originalFormatted: string;
    rateInfo: string;
  } | null;
}

export interface MultiRetailerResult {
  retailers: Array<{
    store: RegionalStoreInfo;
    price: number | null;
    shippingInfo: string | null;
  }>;
  lowestPriceStore: RegionalStoreInfo | null;
}

export interface ProductUrlResult {
  url: string;
  urlType: 'product' | 'store_homepage' | 'search' | 'original';
  fallbackReason: string | null;
}

// =============================================================================
// Error Logging
// =============================================================================

const LOG_PREFIX = '[RegionalStore]';

function logError(context: string, error: unknown, metadata?: Record<string, unknown>): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.warn(`${LOG_PREFIX} ${context}:`, errorMessage, metadata || '');
}

function logDebug(context: string, data?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`${LOG_PREFIX} ${context}`, data || '');
  }
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
 * Get region display name
 */
export function getRegionName(regionCode: RegionCode): string {
  return REGIONS[regionCode]?.name || regionCode;
}

/**
 * Get region flag emoji
 */
export function getRegionFlag(regionCode: RegionCode): string {
  return REGIONS[regionCode]?.flag || '🌐';
}

/**
 * Interpolates product URL pattern with product identifier
 * Supports {sku}, {slug}, {product}, {handle} placeholders
 */
export function interpolateProductUrl(pattern: string, productSlug: string): string {
  return pattern
    .replace(/{sku}/gi, productSlug)
    .replace(/{slug}/gi, productSlug)
    .replace(/{product}/gi, productSlug)
    .replace(/{handle}/gi, productSlug);
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
      logError('Error fetching store', error, { brandName, region });
      return null;
    }

    const result = data ? transformToStoreInfo(data, region) : null;
    storeCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (err) {
    logError('Unexpected error fetching store', err, { brandName, region });
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
      logError('Error fetching stores', error, { brandName });
      return [];
    }

    const results = (data || []).map(row => 
      transformToStoreInfo(row, row.region_code as RegionCode)
    );
    
    brandStoresCache.set(cacheKey, { data: results, timestamp: Date.now() });
    
    return results;
  } catch (err) {
    logError('Unexpected error fetching brand stores', err, { brandName });
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

// =============================================================================
// EDGE CASE #1: Brand with No Regional Stores
// =============================================================================

/**
 * Determine availability and get appropriate store/URL for a product
 * Handles brands with no regional stores by falling back to product URL
 */
export async function getRegionalAvailability(
  brandName: string | null,
  userRegion: RegionCode,
  productUrl?: string | null
): Promise<RegionalAvailabilityResult> {
  // No brand info
  if (!brandName) {
    return {
      status: productUrl ? 'available_international' : 'not_available',
      store: null,
      url: productUrl || null,
      message: productUrl ? 'Available from manufacturer' : 'Product information unavailable',
      badge: productUrl ? 'international' : null,
      suggestedRegion: null,
      suggestedStores: [],
    };
  }

  const allStores = await getBrandRegionalStores(brandName);

  // EDGE CASE: Brand has no regional stores
  if (allStores.length === 0) {
    logDebug('No regional stores for brand', { brandName, productUrl });
    return {
      status: productUrl ? 'available_international' : 'not_available',
      store: null,
      url: productUrl || null,
      message: productUrl 
        ? 'Available from manufacturer website' 
        : `No stores available for ${brandName}`,
      badge: productUrl ? 'international' : null,
      suggestedRegion: null,
      suggestedStores: [],
    };
  }

  // Check for exact region match
  const localStore = allStores.find(s => s.region_code === userRegion);
  if (localStore) {
    return {
      status: 'available_local',
      store: localStore,
      url: localStore.base_url,
      message: `Available from ${localStore.store_name}`,
      badge: 'local',
      suggestedRegion: null,
      suggestedStores: allStores.filter(s => s.region_code !== userRegion),
    };
  }

  // Find fallback store
  const { store: fallbackStore } = await findBestStoreForRegion(brandName, userRegion);
  
  if (fallbackStore) {
    const suggestedRegions = allStores.map(s => s.region_code);
    return {
      status: 'available_fallback',
      store: fallbackStore,
      url: fallbackStore.base_url,
      message: `View from ${fallbackStore.store_name} (${getRegionFlag(fallbackStore.region_code)} ${fallbackStore.region_code})`,
      badge: 'regional',
      suggestedRegion: fallbackStore.region_code,
      suggestedStores: allStores,
    };
  }

  // Fallback to product URL
  return {
    status: productUrl ? 'available_international' : 'not_available',
    store: null,
    url: productUrl || null,
    message: productUrl ? 'Available internationally' : 'Currently unavailable',
    badge: productUrl ? 'international' : null,
    suggestedRegion: allStores[0]?.region_code || null,
    suggestedStores: allStores,
  };
}

// =============================================================================
// EDGE CASE #2: Product Not Available in User's Region
// =============================================================================

/**
 * Get region availability message with suggested alternatives
 */
export function getRegionUnavailableMessage(
  userRegion: RegionCode,
  availableStores: RegionalStoreInfo[]
): {
  message: string;
  suggestion: string | null;
  fallbackStore: RegionalStoreInfo | null;
} {
  if (availableStores.length === 0) {
    return {
      message: `Not available in ${getRegionName(userRegion)}`,
      suggestion: null,
      fallbackStore: null,
    };
  }

  // Find nearest available region
  const fallbacks = REGION_FALLBACK_ORDER[userRegion] || [];
  let fallbackStore: RegionalStoreInfo | null = null;

  for (const fallbackRegion of fallbacks) {
    const store = availableStores.find(s => s.region_code === fallbackRegion);
    if (store) {
      fallbackStore = store;
      break;
    }
  }

  // Default to first available store
  if (!fallbackStore) {
    fallbackStore = availableStores[0];
  }

  return {
    message: `Not available in ${getRegionName(userRegion)}`,
    suggestion: `Available from ${fallbackStore.store_name} (${getRegionFlag(fallbackStore.region_code)})`,
    fallbackStore,
  };
}

// =============================================================================
// EDGE CASE #3: Exchange Rate Not Available
// =============================================================================

/**
 * Format price with fallback handling for missing exchange rates
 */
export function formatPriceWithFallback(
  price: number,
  sourceCurrency: CurrencyCode,
  targetCurrency: CurrencyCode,
  exchangeRates: Map<string, number>,
  options: PriceDisplayOptions = {}
): PriceFallbackResult {
  const { showApproximate = true, compact = false, includeTooltip = true } = options;

  // Same currency - no conversion needed
  if (sourceCurrency === targetCurrency) {
    const formattedPrice = formatPriceWithSymbol(price, targetCurrency, compact);
    return {
      displayPrice: price,
      displayCurrency: targetCurrency,
      formattedPrice,
      isConverted: false,
      conversionRate: null,
      hasValidRate: true,
      fallbackMessage: null,
      tooltipData: null,
    };
  }

  // Try to get conversion rate
  const conversionRate = getConversionRate(sourceCurrency, targetCurrency, exchangeRates);

  // EDGE CASE: No exchange rate available
  if (conversionRate === null) {
    logDebug('Exchange rate unavailable', { sourceCurrency, targetCurrency });
    const formattedPrice = formatPriceWithSymbol(price, sourceCurrency, compact);
    return {
      displayPrice: price,
      displayCurrency: sourceCurrency,
      formattedPrice,
      isConverted: false,
      conversionRate: null,
      hasValidRate: false,
      fallbackMessage: `Price shown in ${sourceCurrency}`,
      tooltipData: null,
    };
  }

  // Convert price
  const convertedPrice = price * conversionRate;
  const baseFormatted = formatPriceWithSymbol(convertedPrice, targetCurrency, compact);
  const formattedPrice = showApproximate ? `~${baseFormatted}` : baseFormatted;

  // Build tooltip data
  let tooltipData: PriceFallbackResult['tooltipData'] = null;
  if (includeTooltip) {
    const originalFormatted = formatPriceWithSymbol(price, sourceCurrency, false);
    const rateInfo = `1 ${sourceCurrency} = ${conversionRate.toFixed(4)} ${targetCurrency}`;
    tooltipData = { originalFormatted, rateInfo };
  }

  return {
    displayPrice: convertedPrice,
    displayCurrency: targetCurrency,
    formattedPrice,
    isConverted: true,
    conversionRate,
    hasValidRate: true,
    fallbackMessage: null,
    tooltipData,
  };
}

/**
 * Get conversion rate with fallback through USD
 */
function getConversionRate(
  sourceCurrency: CurrencyCode,
  targetCurrency: CurrencyCode,
  exchangeRates: Map<string, number>
): number | null {
  if (sourceCurrency === targetCurrency) return 1;

  // Try direct rate first
  const directKey = `${sourceCurrency}_${targetCurrency}`;
  if (exchangeRates.has(directKey)) {
    return exchangeRates.get(directKey)!;
  }

  // Try inverse rate
  const inverseKey = `${targetCurrency}_${sourceCurrency}`;
  if (exchangeRates.has(inverseKey)) {
    const inverseRate = exchangeRates.get(inverseKey)!;
    return inverseRate > 0 ? 1 / inverseRate : null;
  }

  // Convert via USD intermediate
  const sourceToUsd = sourceCurrency === 'USD' ? 1 : exchangeRates.get(`${sourceCurrency}_USD`);
  const usdToTarget = targetCurrency === 'USD' ? 1 : exchangeRates.get(`USD_${targetCurrency}`);

  if (sourceToUsd != null && usdToTarget != null) {
    return sourceToUsd * usdToTarget;
  }

  // Rate not available
  return null;
}

// =============================================================================
// EDGE CASE #4: Multiple Retailers in Same Region
// =============================================================================

/**
 * Get all retailers for a region, sorted by price
 */
export function getRetailersInRegion(
  stores: RegionalStoreInfo[],
  region: RegionCode,
  prices?: Map<string, number>
): MultiRetailerResult {
  const regionStores = stores.filter(s => s.region_code === region);

  if (regionStores.length === 0) {
    return {
      retailers: [],
      lowestPriceStore: null,
    };
  }

  // Build retailer info with prices and shipping
  const retailers = regionStores.map(store => {
    const price = prices?.get(store.id) || null;
    const shippingInfo = buildShippingInfo(store);
    return { store, price, shippingInfo };
  });

  // Sort by price (lowest first), null prices at end
  retailers.sort((a, b) => {
    if (a.price === null && b.price === null) return 0;
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  });

  const lowestPriceStore = retailers[0]?.price != null ? retailers[0].store : null;

  return {
    retailers,
    lowestPriceStore,
  };
}

/**
 * Build shipping info string for a store
 */
function buildShippingInfo(store: RegionalStoreInfo): string | null {
  const parts: string[] = [];

  if (store.ships_from_country) {
    parts.push(`Ships from ${store.ships_from_country}`);
  }

  if (store.estimated_shipping_days != null) {
    parts.push(`${store.estimated_shipping_days}d delivery`);
  }

  if (store.free_shipping_threshold != null) {
    const currency = CURRENCIES[store.currency_code];
    const threshold = store.free_shipping_threshold;
    const formatted = currency 
      ? (currency.symbolPosition === 'before' 
          ? `${currency.symbol}${threshold}` 
          : `${threshold}${currency.symbol}`)
      : `${threshold} ${store.currency_code}`;
    parts.push(`Free shipping over ${formatted}`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

// =============================================================================
// EDGE CASE #5: Store URL Template Missing Product Slug
// =============================================================================

/**
 * Get product URL with comprehensive fallback handling
 */
export function getProductUrlWithFallback(
  store: RegionalStoreInfo | null,
  productSlug?: string | null,
  originalProductUrl?: string | null,
  brandSearchPattern?: string | null
): ProductUrlResult {
  // No store - use original product URL
  if (!store) {
    if (originalProductUrl) {
      return {
        url: originalProductUrl,
        urlType: 'original',
        fallbackReason: null,
      };
    }
    return {
      url: '#',
      urlType: 'original',
      fallbackReason: 'No store or product URL available',
    };
  }

  // Has product slug and URL pattern - build full URL
  if (productSlug && store.product_url_pattern) {
    try {
      const url = interpolateProductUrl(store.product_url_pattern, productSlug);
      return {
        url,
        urlType: 'product',
        fallbackReason: null,
      };
    } catch (err) {
      logError('Error interpolating product URL', err, { 
        pattern: store.product_url_pattern, 
        slug: productSlug 
      });
    }
  }

  // EDGE CASE: No product slug - try search URL
  if (brandSearchPattern && productSlug) {
    const searchUrl = brandSearchPattern.replace('{query}', encodeURIComponent(productSlug));
    return {
      url: searchUrl,
      urlType: 'search',
      fallbackReason: 'Using search URL - direct product link unavailable',
    };
  }

  // Fallback to store homepage
  return {
    url: store.base_url,
    urlType: 'store_homepage',
    fallbackReason: productSlug 
      ? 'Product URL pattern missing - linking to store homepage'
      : 'No product identifier - linking to store homepage',
  };
}

// =============================================================================
// Price Formatting Helpers
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
 * Format regional price with conversion if needed (legacy support)
 */
export function formatRegionalPrice(
  price: number,
  sourceCurrency: CurrencyCode,
  targetCurrency: CurrencyCode,
  exchangeRates: Map<string, number>,
  options: PriceDisplayOptions = {}
): RegionalPriceResult {
  const fallbackResult = formatPriceWithFallback(
    price, 
    sourceCurrency, 
    targetCurrency, 
    exchangeRates, 
    options
  );

  return {
    displayPrice: fallbackResult.displayPrice,
    displayCurrency: fallbackResult.displayCurrency,
    formattedPrice: fallbackResult.formattedPrice,
    originalPrice: price,
    originalCurrency: sourceCurrency,
    isConverted: fallbackResult.isConverted,
    conversionRate: fallbackResult.conversionRate,
    store: null,
    tooltipData: fallbackResult.tooltipData,
  };
}

/**
 * Get regional store URL for a product (legacy support)
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

  const { url } = getProductUrlWithFallback(store, productSlug);

  return {
    url,
    storeRegion: store.region_code,
    isFromFallback: isFallback,
  };
}

// =============================================================================
// Error States & Retry
// =============================================================================

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

/**
 * Execute an async function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<{ data: T | null; error: Error | null; attempts: number }> {
  const { maxAttempts, delayMs, backoffMultiplier } = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  let lastError: Error | null = null;
  let delay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await fn();
      return { data, error: null, attempts: attempt };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logError(`Attempt ${attempt}/${maxAttempts} failed`, lastError);

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffMultiplier;
      }
    }
  }

  return { data: null, error: lastError, attempts: maxAttempts };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: Error | null): string {
  if (!error) return 'An unknown error occurred';

  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return 'Unable to connect. Please check your internet connection.';
  }

  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  if (message.includes('not found') || message.includes('404')) {
    return 'Store information not found.';
  }

  return 'Something went wrong. Please try again later.';
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
  logDebug('Cache cleared');
}

/**
 * Clear cache for a specific brand
 */
export function clearBrandCache(brandName: string): void {
  const normalizedBrand = brandName.toLowerCase().trim();
  
  for (const key of storeCache.keys()) {
    if (key.startsWith(normalizedBrand)) {
      storeCache.delete(key);
    }
  }
  
  brandStoresCache.delete(normalizedBrand);
  logDebug('Brand cache cleared', { brandName });
}
