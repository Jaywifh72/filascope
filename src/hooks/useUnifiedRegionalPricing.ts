import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns';
import { useRegion } from '@/contexts/RegionContext';
import { supabase } from '@/integrations/supabase/client';
import { RegionCode, CurrencyCode, REGION_CONFIGS, CURRENCY_CONFIGS, formatCurrencyPrice } from '@/types/regional';
import { formatPrice } from '@/config/currencies';
import { REGION_FALLBACK_ORDER, REGIONS } from '@/config/regions';
import { fetchRegionalSlug, resolveRegionalSlug } from '@/utils/regionalSlugResolver';

// ============================================================================
// Types
// ============================================================================

export type PriceConfidence = 'high' | 'medium' | 'low' | 'stale' | 'unknown';

export interface RegionalStoreData {
  id: string;
  storeName: string;
  regionCode: RegionCode;
  baseUrl: string;
  productUrlPattern: string | null;
  currencyCode: CurrencyCode;
  shipsFrom: string | null;
  freeShippingThreshold: number | null;
  estimatedShippingDays: number | null;
  isLocal: boolean;
  flag: string;
}

export interface UnifiedRegionalPricingResult {
  // Display values
  displayPrice: number | null;
  displayCurrency: CurrencyCode;
  formattedPrice: string;
  
  // Store info
  storeUrl: string;
  storeRegion: RegionCode;
  storeName: string;
  isLocalStore: boolean;
  storeFlag: string;
  
  // Price freshness
  priceConfidence: PriceConfidence;
  lastVerifiedAt: Date | null;
  priceSource: string | null;
  timeAgo: string | null;
  
  // Conversion info
  isConverted: boolean;
  originalPrice: number | null;
  originalCurrency: CurrencyCode | null;
  conversionRate: number | null;
  conversionTooltip: string | null;
  
  // All available stores (for Pricing tab)
  allStores: RegionalStoreData[];
  
  // Slug verification
  slugVerified: boolean;
  effectiveSlug: string;
  
  // Status
  isLoading: boolean;
  error: string | null;
}

export interface UnifiedProductData {
  /** Required: Brand name for store lookup */
  brandName: string;
  
  /** Base price from database (usually USD) */
  basePrice?: number | null;
  
  /** Currency of the base price (defaults to USD) */
  baseCurrency?: CurrencyCode;
  
  /** Product slug for URL generation */
  productSlug?: string;
  
  /** Original product URL as fallback */
  originalUrl?: string | null;
  
  /** Filament ID for regional slug resolution */
  filamentId?: string | null;
  
  /** Freshness: when price was last verified (ISO string) */
  priceLastVerifiedAt?: string | null;
  
  /** Freshness: source of price data (manual, scraper, api, affiliate) */
  priceSource?: string | null;
  
  /** Freshness: pre-calculated confidence level */
  priceConfidence?: string | null;
}

interface BrandRegionalStoreRow {
  id: string;
  brand_id: string;
  region_code: string;
  store_name: string;
  base_url: string;
  product_url_pattern: string | null;
  currency_code: string;
  ships_from_country: string | null;
  free_shipping_threshold: number | null;
  estimated_shipping_days: number | null;
  is_primary: boolean | null;
  is_active: boolean | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate price confidence based on age thresholds:
 * - high: < 24 hours
 * - medium: 1-7 days
 * - low: 7-30 days
 * - stale: > 30 days
 * - unknown: no timestamp
 */
function calculatePriceConfidence(lastVerified: string | null | undefined): PriceConfidence {
  if (!lastVerified) return 'unknown';
  
  const date = new Date(lastVerified);
  if (isNaN(date.getTime())) return 'unknown';
  
  const now = new Date();
  const hoursAgo = differenceInHours(now, date);
  const daysAgo = differenceInDays(now, date);
  
  if (hoursAgo < 24) return 'high';
  if (daysAgo < 7) return 'medium';
  if (daysAgo < 30) return 'low';
  return 'stale';
}

/**
 * Format time ago string for display
 */
function formatTimeAgo(lastVerified: string | null | undefined): string | null {
  if (!lastVerified) return null;
  
  const date = new Date(lastVerified);
  if (isNaN(date.getTime())) return null;
  
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Build a regional store URL from a pattern and product slug
 */
function buildRegionalUrl(
  pattern: string | null,
  baseUrl: string,
  productSlug: string
): string {
  if (!pattern || !productSlug) {
    return baseUrl;
  }
  
  // Replace placeholders: {slug}, {sku}, {product}, {handle}
  let url = pattern
    .replace(/{slug}/gi, productSlug)
    .replace(/{sku}/gi, productSlug)
    .replace(/{product}/gi, productSlug)
    .replace(/{handle}/gi, productSlug);
  
  // If pattern doesn't include protocol, prepend base URL
  if (!url.startsWith('http')) {
    url = baseUrl.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
  }
  
  return url;
}

/**
 * Find the best matching store for user's region with fallback logic
 */
function findBestStore(
  stores: BrandRegionalStoreRow[],
  userRegion: RegionCode
): { store: BrandRegionalStoreRow | null; isLocal: boolean } {
  if (!stores.length) {
    return { store: null, isLocal: false };
  }
  
  // 1. Try exact region match
  const exactMatch = stores.find(s => s.region_code === userRegion);
  if (exactMatch) {
    return { store: exactMatch, isLocal: true };
  }
  
  // 2. Try fallback regions in order
  const fallbacks = REGION_FALLBACK_ORDER[userRegion] || [];
  for (const fallbackRegion of fallbacks) {
    const fallbackStore = stores.find(s => s.region_code === fallbackRegion);
    if (fallbackStore) {
      return { store: fallbackStore, isLocal: false };
    }
  }
  
  // 3. Use primary store if marked
  const primaryStore = stores.find(s => s.is_primary);
  if (primaryStore) {
    return { store: primaryStore, isLocal: false };
  }
  
  // 4. Use first available store
  return { store: stores[0], isLocal: false };
}

/**
 * Transform raw database rows to RegionalStoreData
 */
function transformStores(
  stores: BrandRegionalStoreRow[],
  userRegion: RegionCode
): RegionalStoreData[] {
  return stores.map(store => ({
    id: store.id,
    storeName: store.store_name,
    regionCode: store.region_code as RegionCode,
    baseUrl: store.base_url,
    productUrlPattern: store.product_url_pattern,
    currencyCode: store.currency_code as CurrencyCode,
    shipsFrom: store.ships_from_country,
    freeShippingThreshold: store.free_shipping_threshold,
    estimatedShippingDays: store.estimated_shipping_days,
    isLocal: store.region_code === userRegion,
    flag: REGION_CONFIGS[store.region_code as RegionCode]?.flag || '🌐',
  }));
}

/**
 * Generate a conversion tooltip string
 */
function generateConversionTooltip(
  originalPrice: number,
  originalCurrency: CurrencyCode,
  conversionRate: number,
  targetCurrency: CurrencyCode
): string {
  const originalConfig = CURRENCY_CONFIGS[originalCurrency];
  const targetConfig = CURRENCY_CONFIGS[targetCurrency];
  
  const originalFormatted = formatCurrencyPrice(originalPrice, originalCurrency);
  
  return `Original: ${originalFormatted}\nRate: 1 ${originalCurrency} = ${conversionRate.toFixed(4)} ${targetCurrency}`;
}

// ============================================================================
// React Query Functions
// ============================================================================

async function fetchBrandByName(brandName: string): Promise<string | null> {
  if (!brandName) return null;
  
  const { data, error } = await supabase
    .from('automated_brands')
    .select('id')
    .ilike('brand_name', brandName)
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching brand:', error);
    return null;
  }
  
  return data?.id || null;
}

async function fetchRegionalStores(brandId: string): Promise<BrandRegionalStoreRow[]> {
  if (!brandId) return [];
  
  const { data, error } = await supabase
    .from('brand_regional_stores')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching regional stores:', error);
    return [];
  }
  
  return data || [];
}

// ============================================================================
// Main Hook
// ============================================================================

const DEFAULT_RESULT: UnifiedRegionalPricingResult = {
  displayPrice: null,
  displayCurrency: 'USD',
  formattedPrice: 'Price unavailable',
  storeUrl: '',
  storeRegion: 'US',
  storeName: '',
  isLocalStore: false,
  storeFlag: '🌐',
  priceConfidence: 'unknown',
  lastVerifiedAt: null,
  priceSource: null,
  timeAgo: null,
  isConverted: false,
  originalPrice: null,
  originalCurrency: null,
  conversionRate: null,
  conversionTooltip: null,
  allStores: [],
  slugVerified: false,
  effectiveSlug: '',
  isLoading: true,
  error: null,
};

export function useUnifiedRegionalPricing(product: UnifiedProductData): UnifiedRegionalPricingResult {
  const { region, currency, convertPrice, getConversionRate } = useRegion();
  
  const {
    brandName,
    basePrice,
    baseCurrency = 'USD',
    productSlug = '',
    originalUrl,
    filamentId,
    priceLastVerifiedAt,
    priceSource,
    priceConfidence: preCalculatedConfidence,
  } = product;
  
  // Query 1: Fetch brand ID by name
  const { data: brandId, isLoading: brandLoading } = useQuery({
    queryKey: ['brand-id', brandName?.toLowerCase()],
    queryFn: () => fetchBrandByName(brandName || ''),
    enabled: !!brandName,
    staleTime: 30 * 60 * 1000, // 30 minutes - shared cache
  });
  
  // Query 2: Fetch regional stores by brand ID
  const { data: rawStores = [], isLoading: storesLoading } = useQuery({
    queryKey: ['regional-stores', brandId],
    queryFn: () => fetchRegionalStores(brandId!),
    enabled: !!brandId,
    staleTime: 10 * 60 * 1000, // 10 minutes - shared cache
  });
  
  // Query 3: Fetch regional slug mapping (if filamentId provided)
  const { data: regionalSlugData, isLoading: slugLoading } = useQuery({
    queryKey: ['regional-slug', filamentId, region],
    queryFn: () => fetchRegionalSlug(filamentId!, region),
    enabled: !!filamentId && !!region,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
  
  const isLoading = brandLoading || storesLoading || (!!filamentId && slugLoading);
  
  // Compute the unified result
  const result = useMemo((): UnifiedRegionalPricingResult => {
    // Early return while loading
    if (isLoading) {
      return {
        ...DEFAULT_RESULT,
        displayCurrency: currency,
        storeName: brandName,
        isLoading: true,
      };
    }
    
    // Calculate price freshness
    const confidence = preCalculatedConfidence as PriceConfidence 
      || calculatePriceConfidence(priceLastVerifiedAt);
    const lastVerifiedAt = priceLastVerifiedAt ? new Date(priceLastVerifiedAt) : null;
    const timeAgo = formatTimeAgo(priceLastVerifiedAt);
    
    // Resolve the effective slug for this region
    const slugResolution = resolveRegionalSlug(regionalSlugData || null, productSlug);
    const effectiveSlug = slugResolution.effectiveSlug;
    const slugIsVerified = slugResolution.isVerified;
    
    // Transform stores for external consumers
    const allStores = transformStores(rawStores, region);
    
    // Find the best store for user's region
    const { store: matchedStore, isLocal } = findBestStore(rawStores, region);
    
    // Base result with freshness data
    const baseResult: Partial<UnifiedRegionalPricingResult> = {
      priceConfidence: confidence,
      lastVerifiedAt: lastVerifiedAt && !isNaN(lastVerifiedAt.getTime()) ? lastVerifiedAt : null,
      priceSource: priceSource || null,
      timeAgo,
      allStores,
      slugVerified: slugIsVerified,
      effectiveSlug,
      isLoading: false,
      error: null,
    };
    
    // No stores found - fall back to original URL
    if (!matchedStore) {
      const needsConversion = baseCurrency !== currency;
      const displayPrice = basePrice != null 
        ? (needsConversion ? convertPrice(basePrice, baseCurrency) : basePrice)
        : null;
      const rate = needsConversion ? getConversionRate(baseCurrency, currency) : null;
      
      return {
        ...DEFAULT_RESULT,
        ...baseResult,
        displayPrice,
        displayCurrency: currency,
        formattedPrice: displayPrice != null 
          ? formatPrice(displayPrice, currency, { showApproximate: needsConversion })
          : 'Price unavailable',
        storeUrl: originalUrl || '',
        storeRegion: 'US',
        storeName: brandName || 'Store',
        isLocalStore: false,
        storeFlag: '🌐',
        isConverted: needsConversion && basePrice != null,
        originalPrice: needsConversion ? basePrice : null,
        originalCurrency: needsConversion ? baseCurrency : null,
        conversionRate: rate,
        conversionTooltip: needsConversion && basePrice != null && rate
          ? generateConversionTooltip(basePrice, baseCurrency, rate, currency)
          : null,
        allStores,
      };
    }
    
    // We have a matching store - build the URL
    const storeUrl = buildRegionalUrl(
      matchedStore.product_url_pattern,
      matchedStore.base_url,
      effectiveSlug
    );
    
    const storeRegion = matchedStore.region_code as RegionCode;
    const storeFlag = REGION_CONFIGS[storeRegion]?.flag || REGIONS[storeRegion]?.flag || '🌐';
    
    // Calculate price conversion
    const needsConversion = baseCurrency !== currency;
    const displayPrice = basePrice != null
      ? (needsConversion ? convertPrice(basePrice, baseCurrency) : basePrice)
      : null;
    const rate = needsConversion ? getConversionRate(baseCurrency, currency) : null;
    
    return {
      ...DEFAULT_RESULT,
      ...baseResult,
      displayPrice,
      displayCurrency: currency,
      formattedPrice: displayPrice != null
        ? formatPrice(displayPrice, currency, { showApproximate: needsConversion })
        : 'Price unavailable',
      storeUrl,
      storeRegion,
      storeName: matchedStore.store_name,
      isLocalStore: isLocal,
      storeFlag,
      isConverted: needsConversion && basePrice != null,
      originalPrice: needsConversion ? basePrice : null,
      originalCurrency: needsConversion ? baseCurrency : null,
      conversionRate: rate,
      conversionTooltip: needsConversion && basePrice != null && rate
        ? generateConversionTooltip(basePrice, baseCurrency, rate, currency)
        : null,
    };
  }, [
    isLoading,
    rawStores,
    region,
    currency,
    basePrice,
    baseCurrency,
    productSlug,
    originalUrl,
    brandName,
    convertPrice,
    getConversionRate,
    regionalSlugData,
    priceLastVerifiedAt,
    priceSource,
    preCalculatedConfidence,
  ]);
  
  return result;
}

// ============================================================================
// Convenience Exports
// ============================================================================

export { calculatePriceConfidence, formatTimeAgo };
export type { BrandRegionalStoreRow };
