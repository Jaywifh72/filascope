import { useMemo, useCallback } from 'react';
import { useCurrency, CurrencyCode } from '@/hooks/useCurrency';
import { getBrandConfig, RegionCode, BrandStoreConfig } from '@/lib/brandRegionalStores';

/**
 * Maps currency codes to region codes
 */
const CURRENCY_TO_REGION: Record<CurrencyCode, RegionCode> = {
  USD: 'US',
  CAD: 'CA',
  GBP: 'UK',
  EUR: 'EU',
  AUD: 'AU',
  JPY: 'JP',
  CHF: 'EU', // Switzerland uses EU store typically
  SEK: 'EU', // Sweden uses EU store
  CNY: 'CN',
  KRW: 'KR',
  INR: 'IN',
  MXN: 'MX',
  BRL: 'BR',
  NZD: 'NZ',
};

/**
 * Transforms a product URL to the regional variant based on brand config
 */
function transformUrl(
  originalUrl: string,
  config: BrandStoreConfig,
  targetRegion: RegionCode
): string {
  if (!originalUrl) return originalUrl;
  
  // Global stores don't need transformation
  if (config.pattern === 'global') {
    return originalUrl;
  }
  
  // Get regional config, fall back to fallback region if not available
  const regionConfig = config.regions?.[targetRegion] || 
    (config.fallbackRegion ? config.regions?.[config.fallbackRegion] : null);
  
  if (!regionConfig) {
    return originalUrl;
  }
  
  try {
    const url = new URL(originalUrl);
    const hostParts = url.hostname.split('.');
    
    if (config.pattern === 'subdomain') {
      // Handle subdomain pattern: us.store.bambulab.com -> ca.store.bambulab.com
      const newSubdomain = regionConfig.subdomain || 'www';
      
      // Check if URL matches the brand's base domain
      if (url.hostname.includes(config.baseDomain)) {
        // Replace or add subdomain
        const baseDomainParts = config.baseDomain.split('.');
        
        // If current hostname has more parts than base domain, it has a subdomain
        if (hostParts.length > baseDomainParts.length) {
          // Replace first part (subdomain)
          hostParts[0] = newSubdomain;
        } else {
          // Add subdomain
          hostParts.unshift(newSubdomain);
        }
        
        url.hostname = hostParts.join('.');
        return url.toString();
      }
    } else if (config.pattern === 'path' && regionConfig.pathPrefix) {
      // Handle path pattern: /en-us/product -> /en-ca/product
      // This is less common but some stores use it
      const pathParts = url.pathname.split('/');
      if (pathParts.length > 1) {
        // Check if first path segment looks like a locale
        if (/^[a-z]{2}(-[a-z]{2})?$/i.test(pathParts[1])) {
          pathParts[1] = regionConfig.pathPrefix;
          url.pathname = pathParts.join('/');
          return url.toString();
        }
      }
    }
  } catch (e) {
    // Invalid URL, return original
    console.warn('Failed to transform URL:', originalUrl, e);
  }
  
  return originalUrl;
}

/**
 * Gets the region name for display
 */
export function getRegionDisplayName(region: RegionCode): string {
  const names: Record<RegionCode, string> = {
    US: 'United States',
    CA: 'Canada',
    UK: 'United Kingdom',
    EU: 'Europe',
    AU: 'Australia',
    JP: 'Japan',
    CN: 'China',
    KR: 'South Korea',
    IN: 'India',
    MX: 'Mexico',
    BR: 'Brazil',
    NZ: 'New Zealand',
  };
  return names[region] || region;
}

/**
 * Gets the short region code for display (e.g., "CA" for Canada)
 */
export function getRegionShortName(region: RegionCode): string {
  return region;
}

/**
 * Maps region codes to their corresponding filament URL fields
 */
const REGION_URL_FIELDS: Partial<Record<RegionCode, string>> = {
  CA: 'product_url_ca',
  UK: 'product_url_uk',
  EU: 'product_url_eu',
  AU: 'product_url_au',
  JP: 'product_url_jp',
};

/**
 * Hook to transform product URLs to regional variants based on user's currency setting
 * 
 * @returns Object with getRegionalUrl function and current region info
 */
export function useRegionalStore() {
  const { currency } = useCurrency();
  
  // Get current region from currency
  const currentRegion = useMemo((): RegionCode => {
    return CURRENCY_TO_REGION[currency] || 'US';
  }, [currency]);
  
  // Transform a product URL to the regional variant, with optional pre-stored regional URLs
  const getRegionalUrl = useCallback((
    productUrl: string | null | undefined,
    vendor: string | null | undefined,
    storedRegionalUrls?: Partial<Record<string, string | null>> // e.g., { product_url_ca: "...", product_url_uk: "..." }
  ): string => {
    if (!productUrl) return '';
    
    // If we're looking for US, just return the original URL
    if (currentRegion === 'US') {
      return productUrl;
    }
    
    // Check if there's a pre-stored regional URL for this region
    const regionalUrlField = REGION_URL_FIELDS[currentRegion];
    if (regionalUrlField && storedRegionalUrls) {
      const storedUrl = storedRegionalUrls[regionalUrlField];
      if (storedUrl) {
        return storedUrl;
      }
    }
    
    // Fall back to URL transformation
    const config = getBrandConfig(vendor);
    if (!config) {
      // No config for this brand, return original URL
      return productUrl;
    }
    
    return transformUrl(productUrl, config, currentRegion);
  }, [currentRegion]);
  
  // Check if a brand has a regional store for the current region
  const hasRegionalStore = useCallback((vendor: string | null | undefined): boolean => {
    const config = getBrandConfig(vendor);
    if (!config) return false;
    if (config.pattern === 'global') return true;
    return !!config.regions?.[currentRegion];
  }, [currentRegion]);
  
  // Get list of available regions for a brand
  const getAvailableRegions = useCallback((vendor: string | null | undefined): RegionCode[] => {
    const config = getBrandConfig(vendor);
    if (!config) return ['US'];
    if (config.pattern === 'global') {
      return ['US', 'CA', 'UK', 'EU', 'AU', 'JP']; // Global stores ship everywhere
    }
    return Object.keys(config.regions || {}) as RegionCode[];
  }, []);
  
  return {
    currentRegion,
    regionDisplayName: getRegionDisplayName(currentRegion),
    regionShortName: getRegionShortName(currentRegion),
    getRegionalUrl,
    hasRegionalStore,
    getAvailableRegions,
  };
}
