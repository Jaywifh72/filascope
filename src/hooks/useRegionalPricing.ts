import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRegion } from '@/contexts/RegionContext';
import { supabase } from '@/integrations/supabase/client';
import { RegionCode, CurrencyCode, RegionalPriceResult } from '@/types/regional';
import { formatPrice } from '@/config/currencies';
import { REGION_FALLBACK_ORDER, REGIONS } from '@/config/regions';

// ============================================================================
// Types
// ============================================================================

interface UseRegionalPricingOptions {
  /** Brand name to look up regional stores for */
  brandName: string | null;
  /** Product slug extracted from original URL (e.g., "hyper-pla-cf") */
  productSlug: string;
  /** Base price from database (usually USD) */
  basePrice: number | null;
  /** Currency of the base price */
  baseCurrency?: CurrencyCode;
  /** Original product URL for fallback */
  originalUrl: string | null;
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

interface RegionalPricingResult {
  priceResult: RegionalPriceResult | null;
  isLoading: boolean;
  error: string | null;
  allStores: BrandRegionalStoreRow[];
  hasLocalStore: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract product slug from a URL
 * e.g., "https://store.creality.com/products/hyper-pla-cf" → "hyper-pla-cf"
 */
export function extractProductSlug(url: string | null | undefined): string {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Common patterns:
    // /products/slug
    // /product/slug
    // /p/slug
    // /filament/slug
    const patterns = [
      /\/products?\/([^\/\?#]+)/i,
      /\/p\/([^\/\?#]+)/i,
      /\/filament\/([^\/\?#]+)/i,
      /\/item\/([^\/\?#]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = pathname.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }
    
    // Fallback: last segment of path
    const segments = pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || '';
  } catch {
    return '';
  }
}

/**
 * Build a regional store URL from a pattern and product slug
 */
function buildRegionalUrl(
  pattern: string | null,
  baseUrl: string,
  productSlug: string
): string {
  if (!pattern) {
    // No pattern, return base URL
    return baseUrl;
  }
  
  // Replace placeholders: {slug}, {sku}, {product}
  let url = pattern
    .replace(/{slug}/gi, productSlug)
    .replace(/{sku}/gi, productSlug)
    .replace(/{product}/gi, productSlug);
  
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

// ============================================================================
// React Query: Brand Lookup
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

export function useRegionalPricing({
  brandName,
  productSlug,
  basePrice,
  baseCurrency = 'USD',
  originalUrl,
}: UseRegionalPricingOptions): RegionalPricingResult {
  const { region, currency, convertPrice, getConversionRate } = useRegion();
  
  // Query 1: Fetch brand ID by name
  const { data: brandId, isLoading: brandLoading } = useQuery({
    queryKey: ['brand-id', brandName],
    queryFn: () => fetchBrandByName(brandName || ''),
    enabled: !!brandName,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Query 2: Fetch regional stores by brand ID
  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ['regional-stores', brandId],
    queryFn: () => fetchRegionalStores(brandId!),
    enabled: !!brandId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  const isLoading = brandLoading || storesLoading;
  
  // Compute the result
  const result = useMemo((): RegionalPricingResult => {
    // Still loading
    if (isLoading) {
      return {
        priceResult: null,
        isLoading: true,
        error: null,
        allStores: [],
        hasLocalStore: false,
      };
    }
    
    // Find the best store for user's region
    const { store: matchedStore, isLocal } = findBestStore(stores, region);
    
    // No stores found - fall back to original URL and base price
    if (!matchedStore) {
      if (basePrice === null || basePrice === undefined) {
        return {
          priceResult: null,
          isLoading: false,
          error: null,
          allStores: stores,
          hasLocalStore: false,
        };
      }
      
      // Convert base price to user's currency
      const converted = convertPrice(basePrice, baseCurrency);
      const rate = baseCurrency !== currency ? getConversionRate(baseCurrency, currency) : null;
      
      return {
        priceResult: {
          displayPrice: converted,
          displayCurrency: currency,
          formattedPrice: formatPrice(converted, currency, { 
            showApproximate: baseCurrency !== currency 
          }),
          originalPrice: basePrice,
          originalCurrency: baseCurrency,
          isConverted: baseCurrency !== currency,
          conversionRate: rate,
          store: {
            id: '',
            name: brandName || 'Store',
            url: originalUrl || '',
            regionCode: 'US' as RegionCode,
            shipsFrom: null,
            freeShippingThreshold: null,
          },
        },
        isLoading: false,
        error: null,
        allStores: stores,
        hasLocalStore: false,
      };
    }
    
    // We have a matching store - build the URL
    const storeUrl = buildRegionalUrl(
      matchedStore.product_url_pattern,
      matchedStore.base_url,
      productSlug
    );
    
    const storeCurrency = matchedStore.currency_code as CurrencyCode;
    const regionConfig = REGIONS[matchedStore.region_code as RegionCode];
    
    // Calculate price
    // We use basePrice and convert to user's currency
    // The store's currency helps determine if conversion is needed
    if (basePrice === null || basePrice === undefined) {
      return {
        priceResult: {
          displayPrice: 0,
          displayCurrency: currency,
          formattedPrice: 'Price unavailable',
          originalPrice: 0,
          originalCurrency: baseCurrency,
          isConverted: false,
          conversionRate: null,
          store: {
            id: matchedStore.id,
            name: matchedStore.store_name,
            url: storeUrl,
            regionCode: matchedStore.region_code as RegionCode,
            shipsFrom: matchedStore.ships_from_country,
            freeShippingThreshold: matchedStore.free_shipping_threshold,
          },
        },
        isLoading: false,
        error: null,
        allStores: stores,
        hasLocalStore: isLocal,
      };
    }
    
    // Convert price
    const needsConversion = baseCurrency !== currency;
    const displayPrice = needsConversion 
      ? convertPrice(basePrice, baseCurrency)
      : basePrice;
    const conversionRate = needsConversion 
      ? getConversionRate(baseCurrency, currency)
      : null;
    
    const priceResult: RegionalPriceResult = {
      displayPrice,
      displayCurrency: currency,
      formattedPrice: formatPrice(displayPrice, currency, { 
        showApproximate: needsConversion 
      }),
      originalPrice: basePrice,
      originalCurrency: baseCurrency,
      isConverted: needsConversion,
      conversionRate,
      store: {
        id: matchedStore.id,
        name: matchedStore.store_name,
        url: storeUrl,
        regionCode: matchedStore.region_code as RegionCode,
        shipsFrom: matchedStore.ships_from_country,
        freeShippingThreshold: matchedStore.free_shipping_threshold,
      },
    };
    
    return {
      priceResult,
      isLoading: false,
      error: null,
      allStores: stores,
      hasLocalStore: isLocal,
    };
  }, [
    isLoading,
    stores,
    region,
    currency,
    basePrice,
    baseCurrency,
    productSlug,
    originalUrl,
    brandName,
    convertPrice,
    getConversionRate,
  ]);
  
  return result;
}

// ============================================================================
// Convenience Export
// ============================================================================

export type { UseRegionalPricingOptions, RegionalPricingResult, BrandRegionalStoreRow };
