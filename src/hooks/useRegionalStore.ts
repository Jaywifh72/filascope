import { useMemo, useCallback } from 'react';
import { useCurrency, CurrencyCode } from '@/hooks/useCurrency';
import { getBrandConfig, RegionCode, BrandStoreConfig, RegionConfig } from '@/lib/brandRegionalStores';

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
/**
 * Transforms a product URL to the regional variant based on brand config.
 * Handles both direct URLs and affiliate-wrapped URLs (e.g., elegoo.sjv.io)
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
    
    // Check if this is an affiliate-wrapped URL (e.g., elegoo.sjv.io, shareasale, etc.)
    // These URLs contain the real store URL in a parameter like 'u=' or 'url='
    const isAffiliateUrl = url.hostname.includes('.sjv.io') || 
                           url.hostname.includes('shareasale.com') ||
                           url.hostname.includes('avantlink.com') ||
                           url.hostname.includes('pjtra.com') ||
                           url.hostname.includes('pntra.com');
    
    if (isAffiliateUrl) {
      // Extract the real URL from the 'u' parameter
      const encodedRealUrl = url.searchParams.get('u');
      if (encodedRealUrl) {
        const realUrl = decodeURIComponent(encodedRealUrl);
        const transformedRealUrl = transformDirectUrl(realUrl, config, targetRegion, regionConfig);
        
        if (transformedRealUrl !== realUrl) {
          // Re-encode the transformed URL back into the affiliate wrapper
          url.searchParams.set('u', encodeURIComponent(transformedRealUrl));
          return url.toString();
        }
      }
      return originalUrl;
    }
    
    // Direct URL transformation
    return transformDirectUrl(originalUrl, config, targetRegion, regionConfig);
  } catch (e) {
    console.warn('Failed to transform URL:', originalUrl, e);
    return originalUrl;
  }
}

/**
 * Transforms a direct (non-affiliate) URL to the regional variant
 */
function transformDirectUrl(
  originalUrl: string,
  config: BrandStoreConfig,
  targetRegion: RegionCode,
  regionConfig: RegionConfig
): string {
  try {
    const url = new URL(originalUrl);
    const hostParts = url.hostname.split('.');
    
    if (config.pattern === 'subdomain') {
      const newSubdomain = regionConfig.subdomain || 'www';
      
      // Check if URL matches the brand's base domain
      if (url.hostname.includes(config.baseDomain)) {
        const baseDomainParts = config.baseDomain.split('.');
        
        // If current hostname has more parts than base domain, it has a subdomain
        if (hostParts.length > baseDomainParts.length) {
          hostParts[0] = newSubdomain;
        } else {
          hostParts.unshift(newSubdomain);
        }
        
        url.hostname = hostParts.join('.');
        return url.toString();
      }
    } else if (config.pattern === 'path' && regionConfig.pathPrefix !== undefined) {
      // Path-based regional URLs (e.g., store.creality.com/eu/products/slug)
      const pathParts = url.pathname.split('/').filter(Boolean); // Remove empty strings
      
      // Check if current URL already has a regional path prefix (e.g., /eu/, /uk/, /au/)
      // Common patterns: /eu, /uk, /au, /us, 2-letter codes
      const hasRegionalPrefix = pathParts.length > 0 && /^[a-z]{2}$/i.test(pathParts[0]);
      
      if (hasRegionalPrefix) {
        // Replace existing regional prefix with target region
        if (regionConfig.pathPrefix) {
          // Strip leading slash from pathPrefix if present
          const cleanPrefix = regionConfig.pathPrefix.replace(/^\//, '');
          pathParts[0] = cleanPrefix;
        } else {
          // Target region has no prefix (e.g., US), remove the regional segment
          pathParts.shift();
        }
      } else if (regionConfig.pathPrefix) {
        // No regional prefix exists, but target needs one - insert it
        const cleanPrefix = regionConfig.pathPrefix.replace(/^\//, '');
        pathParts.unshift(cleanPrefix);
      }
      // If no regional prefix exists and target doesn't need one, leave unchanged
      
      url.pathname = '/' + pathParts.join('/');
      return url.toString();
    }
  } catch (e) {
    console.warn('Failed to transform direct URL:', originalUrl, e);
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
    DE: 'Germany',
    FR: 'France',
    ES: 'Spain',
    IT: 'Italy',
    PL: 'Poland',
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
