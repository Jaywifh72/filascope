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

/**
 * Check if a filament is available in a specific region
 */
export function isFilamentAvailableInRegion(
  filament: FilamentWithRegion,
  region: RegionCode
): boolean {
  const vendor = filament.vendor;
  
  // Global brands are always available
  if (!isRegionalBrand(vendor)) {
    return true;
  }
  
  // US region: check if the main product_url contains US store domain
  if (region === 'US') {
    const url = filament.product_url;
    if (!url) return false;
    
    // For Elegoo specifically, check if it's the US store
    if (vendor?.toLowerCase() === 'elegoo') {
      // US Elegoo URLs contain elegoo-us.myshopify.com or just elegoo.com (not regional subdomain)
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
    
    // For other regional brands, assume main URL is US
    return true;
  }
  
  // For non-US regions, check if the regional URL exists
  const urlField = REGION_TO_URL_FIELD[region];
  if (urlField) {
    const regionalUrl = filament[urlField as keyof FilamentWithRegion];
    if (regionalUrl && typeof regionalUrl === 'string' && regionalUrl.trim() !== '') {
      return true;
    }
  }
  
  // Special handling for EU sub-regions (DE, IT, FR, ES)
  // These might be stored in the main product_url with regional subdomain
  if (region === 'EU') {
    const url = filament.product_url;
    if (url) {
      const isEuStore = url.includes('eu.elegoo.com') ||
                        url.includes('de.elegoo.com') ||
                        url.includes('it.elegoo.com') ||
                        url.includes('fr.elegoo.com') ||
                        url.includes('es.elegoo.com');
      if (isEuStore) return true;
    }
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
    return filaments.filter(isAvailableInCurrentRegion);
  }, [isAvailableInCurrentRegion]);
  
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
