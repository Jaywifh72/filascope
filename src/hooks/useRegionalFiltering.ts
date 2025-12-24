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
    const isElegooVendor = vendor?.toLowerCase() === 'elegoo';
    
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
      return true;
    }
    
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
