/**
 * REGIONAL DATA EXTRACTOR v2
 * 
 * Extracts multi-region prices and URLs for filaments.
 * Handles currency conversion and regional store mapping.
 */

// ============================================================================
// REGIONAL INTERFACES
// ============================================================================

export interface RegionalPrice {
  region: string;
  currency: string;
  price: number;
  url?: string;
  source: string;
  confidence: number;
}

export interface ExtractionResult {
  field: string;
  value: any;
  source: string;
  confidence: number;
  raw_value?: any;
}

// ============================================================================
// REGIONAL CONFIGURATION
// ============================================================================

/**
 * Supported regions and their configurations
 */
export const REGIONS: Record<string, {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  exchangeRate: number; // USD to local currency
}> = {
  US: {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    symbol: '$',
    exchangeRate: 1.0
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    symbol: 'CA$',
    exchangeRate: 1.37
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    exchangeRate: 0.79
  },
  EU: {
    code: 'EU',
    name: 'European Union',
    currency: 'EUR',
    symbol: '€',
    exchangeRate: 0.92
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    symbol: 'A$',
    exchangeRate: 1.53
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    currency: 'JPY',
    symbol: '¥',
    exchangeRate: 150.0
  },
  CN: {
    code: 'CN',
    name: 'China',
    currency: 'CNY',
    symbol: '¥',
    exchangeRate: 7.25
  }
};

/**
 * Brands with native EUR pricing (don't convert from USD)
 */
export const NATIVE_EUR_BRANDS = new Set([
  'AzureFilm',
  'Sovol',
  'Spectrum Filaments',
  'FormFutura',
  'Fillamentum',
  'ColorFabb',
  'Extrudr',
  'Fiberlogy'
]);

// ============================================================================
// REGIONAL EXTRACTOR
// ============================================================================

/**
 * Extract regional prices from filament data
 */
export function extractRegionalPrices(filament: any): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Check for existing regional prices
  const regionalFields = [
    { field: 'price_eur', region: 'EU', currency: 'EUR' },
    { field: 'price_gbp', region: 'UK', currency: 'GBP' },
    { field: 'price_cad', region: 'CA', currency: 'CAD' },
    { field: 'price_aud', region: 'AU', currency: 'AUD' },
    { field: 'price_jpy', region: 'JP', currency: 'JPY' },
    { field: 'price_cny', region: 'CN', currency: 'CNY' }
  ];
  
  for (const { field, region, currency } of regionalFields) {
    const value = filament[field];
    if (value !== null && value !== undefined && value > 0) {
      results.push({
        field,
        value,
        source: 'database',
        confidence: 1.0,
        raw_value: { region, currency, price: value }
      });
    }
  }
  
  return results;
}

/**
 * Calculate regional price from base USD price
 */
export function calculateRegionalPrice(
  basePriceUsd: number,
  region: string,
  brand?: string
): RegionalPrice | null {
  if (!basePriceUsd || basePriceUsd <= 0) return null;
  
  const regionConfig = REGIONS[region];
  if (!regionConfig) return null;
  
  // Check if brand has native pricing for this region
  if (region === 'EU' && brand && NATIVE_EUR_BRANDS.has(brand)) {
    // Don't convert - brand has native EUR pricing
    return null;
  }
  
  // Calculate converted price
  const convertedPrice = Math.round(basePriceUsd * regionConfig.exchangeRate * 100) / 100;
  
  return {
    region: regionConfig.code,
    currency: regionConfig.currency,
    price: convertedPrice,
    source: 'calculated',
    confidence: 0.8
  };
}

/**
 * Calculate all regional prices from base USD price
 */
export function calculateAllRegionalPrices(
  basePriceUsd: number,
  brand?: string
): RegionalPrice[] {
  const prices: RegionalPrice[] = [];
  
  for (const region of Object.keys(REGIONS)) {
    const price = calculateRegionalPrice(basePriceUsd, region, brand);
    if (price) {
      prices.push(price);
    }
  }
  
  return prices;
}

/**
 * Extract regional URLs from filament data
 */
export function extractRegionalUrls(filament: any): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Check for existing regional URLs
  const urlFields = [
    { field: 'product_url_ca', region: 'CA' },
    { field: 'product_url_eu', region: 'EU' },
    { field: 'product_url_uk', region: 'UK' },
    { field: 'product_url_au', region: 'AU' },
    { field: 'product_url_jp', region: 'JP' },
    { field: 'product_url_cn', region: 'CN' }
  ];
  
  for (const { field, region } of urlFields) {
    const value = filament[field];
    if (value) {
      results.push({
        field,
        value,
        source: 'database',
        confidence: 1.0,
        raw_value: { region, url: value }
      });
    }
  }
  
  return results;
}

/**
 * Generate regional URL from base URL
 */
export function generateRegionalUrl(
  baseUrl: string,
  region: string,
  brandSlug: string
): string | null {
  if (!baseUrl) return null;
  
  // Parse base URL
  try {
    const url = new URL(baseUrl);
    const hostname = url.hostname;
    const pathname = url.pathname;
    
    // Brand-specific URL patterns
    const brandPatterns: Record<string, Record<string, string>> = {
      'bambu-lab': {
        'US': 'us.store.bambulab.com',
        'CA': 'ca.store.bambulab.com',
        'EU': 'eu.store.bambulab.com',
        'UK': 'uk.store.bambulab.com'
      },
      'polymaker': {
        'US': 'us.polymaker.com',
        'CA': 'ca.polymaker.com',
        'EU': 'eu.polymaker.com'
      },
      'anycubic': {
        'US': 'store.anycubic.com',
        'CA': 'ca.anycubic.com',
        'EU': 'eu.anycubic.com'
      },
      'creality': {
        'US': 'store.creality.com/en-us',
        'CA': 'store.creality.com/en-ca',
        'EU': 'store.creality.com/en-eu'
      }
    };
  
    // Check if brand has specific pattern
    if (brandPatterns[brandSlug] && brandPatterns[brandSlug][region]) {
      const regionalHostname = brandPatterns[brandSlug][region];
      return `https://${regionalHostname}${pathname}`;
    }
    
    // Generic pattern: add region subdomain
    const regionSubdomains: Record<string, string> = {
      'US': 'us',
      'CA': 'ca',
      'EU': 'eu',
      'UK': 'uk',
      'AU': 'au',
      'JP': 'jp'
    };
    
    if (regionSubdomains[region]) {
      const subdomain = regionSubdomains[region];
      return `https://${subdomain}.${hostname}${pathname}`;
    }
    
    return null;
  } catch (error) {
    console.error(`[REGIONAL] Error generating regional URL: ${error}`);
    return null;
  }
}

/**
 * Generate all regional URLs from base URL
 */
export function generateAllRegionalUrls(
  baseUrl: string,
  brandSlug: string
): Record<string, string> {
  const urls: Record<string, string> = {};
  
  const regions = ['US', 'CA', 'EU', 'UK', 'AU', 'JP'];
  
  for (const region of regions) {
    const url = generateRegionalUrl(baseUrl, region, brandSlug);
    if (url) {
      urls[`product_url_${region.toLowerCase()}`] = url;
    }
  }
  
  return urls;
}

/**
 * Extract regional data from filament
 */
export function extractRegionalData(filament: any): {
  prices: ExtractionResult[];
  urls: ExtractionResult[];
  calculatedPrices: RegionalPrice[];
} {
  const prices = extractRegionalPrices(filament);
  const urls = extractRegionalUrls(filament);
  const calculatedPrices = calculateAllRegionalPrices(
    filament.variant_price || 0,
    filament.vendor
  );
  
  return { prices, urls, calculatedPrices };
}

/**
 * Generate regional data report
 */
export function generateRegionalReport(
  filaments: any[],
  regionalData: Map<string, { prices: ExtractionResult[]; urls: ExtractionResult[] }>
): {
  total_filaments: number;
  filaments_with_regional_prices: number;
  filaments_with_regional_urls: number;
  coverage_by_region: Record<string, { prices: number; urls: number }>;
  top_brands_with_regional: Array<{ brand: string; count: number }>;
} {
  const filamentsWithRegionalPrices = filaments.filter(f => 
    f.price_eur || f.price_gbp || f.price_cad || f.price_aud || f.price_jpy || f.price_cny
  );
  
  const filamentsWithRegionalUrls = filaments.filter(f => 
    f.product_url_ca || f.product_url_eu || f.product_url_uk || f.product_url_au || f.product_url_jp || f.product_url_cn
  );
  
  // Count by region
  const coverageByRegion: Record<string, { prices: number; urls: number }> = {};
  
  for (const region of Object.keys(REGIONS)) {
    const priceField = `price_${region.toLowerCase()}`;
    const urlField = `product_url_${region.toLowerCase()}`;
    
    const pricesCount = filaments.filter(f => f[priceField]).length;
    const urlsCount = filaments.filter(f => f[urlField]).length;
    
    coverageByRegion[region] = { prices: pricesCount, urls: urlsCount };
  }
  
  // Count by brand
  const brandWithRegional: Record<string, number> = {};
  for (const f of filamentsWithRegionalPrices) {
    const brand = f.vendor || 'Unknown';
    brandWithRegional[brand] = (brandWithRegional[brand] || 0) + 1;
  }
  
  const topBrandsWithRegional = Object.entries(brandWithRegional)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    total_filaments: filaments.length,
    filaments_with_regional_prices: filamentsWithRegionalPrices.length,
    filaments_with_regional_urls: filamentsWithRegionalUrls.length,
    coverage_by_region: coverageByRegion,
    top_brands_with_regional: topBrandsWithRegional
  };
}

console.log(`✅ Regional Data Extractor loaded`);
console.log(`   Supports 7 regions: US, CA, UK, EU, AU, JP, CN`);
console.log(`   Currency conversion with exchange rates`);
console.log(`   Regional URL generation for multi-region brands`);
console.log(`   Native EUR brands: ${Array.from(NATIVE_EUR_BRANDS).join(', ')}`);
