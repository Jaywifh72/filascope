import { useMemo, useCallback } from 'react';
import { useCurrency, CurrencyCode } from '@/hooks/useCurrency';
import { getBrandConfig, RegionCode, BRAND_REGIONAL_STORES } from '@/lib/brandRegionalStores';

/**
 * Maps currency codes to region codes for filtering
 */
const CURRENCY_TO_REGION: Record<CurrencyCode, RegionCode> = {
  USD: 'US',
  CAD: 'CA',
  GBP: 'UK',
  EUR: 'EU',
  AUD: 'AU',
  JPY: 'JP',
  CHF: 'EU',
  SEK: 'EU',
  CNY: 'CN',
  KRW: 'KR',
  INR: 'IN',
  MXN: 'MX',
  BRL: 'BR',
  NZD: 'NZ',
  PLN: 'EU',
  CZK: 'EU',
};

/**
 * Maps region codes to the corresponding product_url field in the database
 */
const REGION_TO_URL_FIELD: Partial<Record<RegionCode, string>> = {
  CA: 'product_url_ca',
  UK: 'product_url_uk',
  EU: 'product_url_eu',
  AU: 'product_url_au',
  JP: 'product_url_jp',
};

/**
 * Maps region codes to the corresponding price field in the database
 */
const REGION_TO_PRICE_FIELD: Partial<Record<RegionCode, string>> = {
  CA: 'price_cad',
  UK: 'price_gbp',
  EU: 'price_eur',
  AU: 'price_aud',
  JP: 'price_jpy',
};

/**
 * Get set of brands with regional stores (not global)
 */
function getBrandsWithRegionalStores(): Set<string> {
  const brands = new Set<string>();
  for (const [brand, config] of Object.entries(BRAND_REGIONAL_STORES)) {
    if (config.pattern !== 'global') {
      brands.add(brand.toLowerCase());
    }
  }
  return brands;
}

// Cache the set of regional brands
const REGIONAL_BRANDS = getBrandsWithRegionalStores();

export interface FilamentWithRegion {
  id: string;
  vendor?: string | null;
  product_url?: string | null;
  product_url_ca?: string | null;
  product_url_uk?: string | null;
  product_url_eu?: string | null;
  product_url_au?: string | null;
  product_url_jp?: string | null;
  price_cad?: number | null;
  price_gbp?: number | null;
  price_eur?: number | null;
  price_aud?: number | null;
  price_jpy?: number | null;
  variant_price?: number | null;
  [key: string]: unknown;
}

/**
 * Check if a vendor is a brand with regional stores
 */
export function isRegionalBrand(vendor: string | null | undefined): boolean {
  if (!vendor) return false;
  const normalizedVendor = vendor.toLowerCase().trim();
  
  // Check direct match
  if (REGIONAL_BRANDS.has(normalizedVendor)) {
    return true;
  }
  
  // Check brand config
  const config = getBrandConfig(vendor);
  return config !== null && config.pattern !== 'global';
}

// Version marker for debugging cache issues
const CODE_VERSION = '2024-12-30-fallback-v2';

/**
 * Check if a filament is available in a specific region
 * 
 * For regional brands (like Elegoo, Bambu Lab), products are considered available if:
 * 1. The brand has the region configured in BRAND_REGIONAL_STORES, OR
 * 2. There's a stored regional URL (product_url_ca, product_url_uk, etc.), OR
 * 3. The main product_url already points to that region's store
 * 
 * This ensures we don't incorrectly mark products as unavailable just because
 * the specific regional URL hasn't been synced yet.
 */
export function isFilamentAvailableInRegion(
  filament: FilamentWithRegion,
  region: RegionCode
): boolean {
  const vendor = filament.vendor;
  const url = filament.product_url;
  
  // Global brands are always available everywhere
  if (!isRegionalBrand(vendor)) {
    return true;
  }
  
  // Get brand config for fallback region support
  const brandConfig = getBrandConfig(vendor);
  
  // For regional brands, we must check if THIS SPECIFIC PRODUCT is available in this region
  // Brand having a regional store does NOT mean all products are available there
  // Each regional store has its own product catalog
  
  // Check 1: Do we have a stored regional URL for this specific product?
  const urlField = REGION_TO_URL_FIELD[region];
  if (urlField) {
    const regionalUrl = filament[urlField as keyof FilamentWithRegion];
    if (regionalUrl && typeof regionalUrl === 'string' && regionalUrl.trim() !== '') {
      return true;
    }
  }
  
  // Check if main URL already points to this region's store
  if (url) {
    const normalizedVendor = vendor?.toLowerCase();
    const isElegooVendor = normalizedVendor === 'elegoo';
    const isAnycubicVendor = normalizedVendor === 'anycubic';
    
    if (region === 'US') {
      if (isElegooVendor) {
        // US Elegoo URLs: elegoo-us.myshopify.com, us.elegoo.com, or elegoo.com without regional subdomain
        const isUsStore = url.includes('elegoo-us.myshopify.com') || 
                          url.includes('us.elegoo.com') ||
                          (url.includes('elegoo.com') && 
                           !url.includes('ca.elegoo.com') && 
                           !url.includes('au.elegoo.com') && 
                           !url.includes('eu.elegoo.com') && 
                           !url.includes('uk.elegoo.com') &&
                           !url.includes('de.elegoo.com') &&
                           !url.includes('it.elegoo.com') &&
                           !url.includes('fr.elegoo.com') &&
                           !url.includes('es.elegoo.com'));
        return isUsStore;
      }
      if (isAnycubicVendor) {
        // US Anycubic URLs: store.anycubic.com without regional patterns
        const hasRegionalPattern = url.includes('ca.store.anycubic.com') || 
                                   url.includes('uk.store.anycubic.com') ||
                                   url.includes('eu.store.anycubic.com') ||
                                   url.includes('au.store.anycubic.com') ||
                                   url.includes('de.store.anycubic.com') ||
                                   url.includes('fr.store.anycubic.com') ||
                                   url.includes('//ca.anycubic.com') ||
                                   url.includes('//uk.anycubic.com') ||
                                   url.includes('//eu.anycubic.com') ||
                                   url.includes('//au.anycubic.com') ||
                                   url.includes('//de.anycubic.com') ||
                                   url.includes('//fr.anycubic.com') ||
                                   url.includes('anycubic.es') ||
                                   url.includes('anycubic.it') ||
                                   url.includes('anycubic.au') ||
                                   url.includes('anycubicofficial.pl');
        // US store is store.anycubic.com without regional patterns
        const isUsStore = url.includes('store.anycubic.com') && !hasRegionalPattern;
        return isUsStore;
      }
      return true;
    }
    
    // Elegoo regional checks
    if (region === 'CA' && isElegooVendor && url.includes('ca.elegoo.com')) {
      return true;
    }
    if (region === 'UK' && isElegooVendor && url.includes('uk.elegoo.com')) {
      return true;
    }
    if (region === 'AU' && isElegooVendor && url.includes('au.elegoo.com')) {
      return true;
    }
    if (region === 'JP' && isElegooVendor && url.includes('jp.elegoo.com')) {
      return true;
    }
    if (region === 'EU' && isElegooVendor) {
      const isEuStore = url.includes('eu.elegoo.com') ||
                        url.includes('de.elegoo.com') ||
                        url.includes('it.elegoo.com') ||
                        url.includes('fr.elegoo.com') ||
                        url.includes('es.elegoo.com');
      if (isEuStore) return true;
    }
    
    // Anycubic regional checks - check for regional store URLs
    if (isAnycubicVendor) {
      if (region === 'CA' && (url.includes('ca.store.anycubic.com') || url.includes('//ca.anycubic.com'))) {
        return true;
      }
      if (region === 'UK' && (url.includes('uk.store.anycubic.com') || url.includes('//uk.anycubic.com'))) {
        return true;
      }
      if (region === 'AU' && (url.includes('anycubic.au') || url.includes('au.store.anycubic.com'))) {
        return true;
      }
      if (region === 'DE' && (url.includes('de.store.anycubic.com') || url.includes('//de.anycubic.com'))) {
        return true;
      }
      if (region === 'FR' && (url.includes('fr.store.anycubic.com') || url.includes('//fr.anycubic.com'))) {
        return true;
      }
      if (region === 'ES' && url.includes('anycubic.es')) {
        return true;
      }
      if (region === 'IT' && url.includes('anycubic.it')) {
        return true;
      }
      if (region === 'PL' && url.includes('anycubicofficial.pl')) {
        return true;
      }
      if (region === 'EU' && (url.includes('eu.store.anycubic.com') || url.includes('//eu.anycubic.com'))) {
        return true;
      }
    }
  }
  
  // FALLBACK: If the user's region is not supported by this regional brand,
  // check if the product is available in the brand's fallback region (usually US)
  // This prevents hiding products when user is in an unsupported region
  if (brandConfig?.fallbackRegion && brandConfig.fallbackRegion !== region) {
    console.log(`[RegionalFilter:${CODE_VERSION}] Checking fallback for ${vendor}`, {
      region,
      fallbackRegion: brandConfig.fallbackRegion,
      url: filament.product_url?.substring(0, 60)
    });
    // Check if product exists in fallback region
    const fallbackAvailable = isFilamentAvailableInFallbackRegion(filament, brandConfig.fallbackRegion, vendor);
    console.log(`[RegionalFilter:${CODE_VERSION}] Fallback result:`, fallbackAvailable);
    if (fallbackAvailable) {
      return true;
    }
  }
  
  console.log(`[RegionalFilter:${CODE_VERSION}] REJECTED ${vendor}`, { region, url: filament.product_url?.substring(0, 60) });
  return false;
}

/**
 * Helper to check if filament is available in a fallback region
 * Prevents infinite recursion by not using the main function
 */
function isFilamentAvailableInFallbackRegion(
  filament: FilamentWithRegion,
  fallbackRegion: RegionCode,
  vendor: string | null | undefined
): boolean {
  const url = filament.product_url;
  if (!url) return false;
  
  const normalizedVendor = vendor?.toLowerCase();
  
  if (fallbackRegion === 'US') {
    // Check if this is a US store URL
    if (normalizedVendor === 'anycubic') {
      // Exclude all regional stores (subdomains and different domains)
      const hasRegionalPattern = url.includes('ca.store.anycubic.com') || 
                                 url.includes('uk.store.anycubic.com') ||
                                 url.includes('eu.store.anycubic.com') ||
                                 url.includes('au.store.anycubic.com') ||
                                 url.includes('de.store.anycubic.com') ||
                                 url.includes('fr.store.anycubic.com') ||
                                 url.includes('//ca.anycubic.com') ||
                                 url.includes('//uk.anycubic.com') ||
                                 url.includes('//eu.anycubic.com') ||
                                 url.includes('//au.anycubic.com') ||
                                 url.includes('//de.anycubic.com') ||
                                 url.includes('//fr.anycubic.com') ||
                                 url.includes('anycubic.es') ||
                                 url.includes('anycubic.it') ||
                                 url.includes('anycubic.au') ||
                                 url.includes('anycubicofficial.pl');
      // US store is store.anycubic.com without regional patterns
      return url.includes('store.anycubic.com') && !hasRegionalPattern;
    }
    if (normalizedVendor === 'elegoo') {
      return url.includes('elegoo-us.myshopify.com') || 
             url.includes('us.elegoo.com') ||
             (url.includes('elegoo.com') && 
              !url.includes('ca.elegoo.com') && 
              !url.includes('au.elegoo.com') && 
              !url.includes('eu.elegoo.com') && 
              !url.includes('uk.elegoo.com'));
    }
    // For other regional brands, assume US store is available if URL exists
    return true;
  }
  
  return false;
}

/**
 * Hook to filter filaments based on user's region
 */
export function useRegionalFiltering() {
  const { currency } = useCurrency();
  
  const currentRegion = useMemo((): RegionCode => {
    return CURRENCY_TO_REGION[currency] || 'US';
  }, [currency]);
  
  /**
   * Filter function to check if a filament should be shown in current region
   */
  const isAvailableInCurrentRegion = useCallback((filament: FilamentWithRegion): boolean => {
    return isFilamentAvailableInRegion(filament, currentRegion);
  }, [currentRegion]);
  
  /**
   * Filter an array of filaments to only those available in current region
   */
  const filterByRegion = useCallback(<T extends FilamentWithRegion>(filaments: T[]): T[] => {
    console.log('[RegionalFilter] Input count:', filaments.length, 'Region:', currentRegion);
    
    // Log Anycubic products specifically
    const anycubicProducts = filaments.filter(f => f.vendor?.toLowerCase() === 'anycubic');
    console.log('[RegionalFilter] Anycubic products in input:', anycubicProducts.length);
    if (anycubicProducts.length > 0) {
      console.log('[RegionalFilter] Sample Anycubic URLs:', anycubicProducts.slice(0, 3).map(f => ({
        id: f.id,
        vendor: f.vendor,
        url: f.product_url
      })));
    }
    
    const result = filaments.filter(isAvailableInCurrentRegion);
    
    console.log('[RegionalFilter] Output count:', result.length);
    
    // Log excluded items
    const excluded = filaments.filter(f => !isAvailableInCurrentRegion(f));
    if (excluded.length > 0) {
      const excludedAnycubic = excluded.filter(f => f.vendor?.toLowerCase() === 'anycubic');
      console.log('[RegionalFilter] Total excluded:', excluded.length, 'Anycubic excluded:', excludedAnycubic.length);
      if (excludedAnycubic.length > 0) {
        console.log('[RegionalFilter] Excluded Anycubic samples:', excludedAnycubic.slice(0, 3).map(f => ({
          id: f.id,
          vendor: f.vendor,
          url: f.product_url,
          isRegionalBrand: isRegionalBrand(f.vendor)
        })));
      }
    }
    
    return result;
  }, [isAvailableInCurrentRegion, currentRegion]);
  
  /**
   * Get the regional URL field name for current region
   */
  const regionalUrlField = useMemo(() => {
    return REGION_TO_URL_FIELD[currentRegion] || null;
  }, [currentRegion]);
  
  /**
   * Get the regional price field name for current region
   */
  const regionalPriceField = useMemo(() => {
    return REGION_TO_PRICE_FIELD[currentRegion] || null;
  }, [currentRegion]);
  
  return {
    currentRegion,
    isAvailableInCurrentRegion,
    filterByRegion,
    regionalUrlField,
    regionalPriceField,
    isRegionalBrand,
  };
}
