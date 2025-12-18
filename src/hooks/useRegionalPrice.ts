import { useMemo } from 'react';
import { useCurrency, CurrencyCode } from '@/hooks/useCurrency';
import { useRegionalStore } from '@/hooks/useRegionalStore';

/**
 * Maps currency codes to regional price columns
 */
const CURRENCY_TO_PRICE_COLUMN: Record<CurrencyCode, string> = {
  USD: 'variant_price',
  CAD: 'price_cad',
  GBP: 'price_gbp',
  EUR: 'price_eur',
  AUD: 'price_aud',
  JPY: 'price_jpy',
  CHF: 'price_eur', // Switzerland falls back to EUR
  SEK: 'price_eur', // Sweden falls back to EUR
  CNY: 'variant_price', // Fallback to USD
  KRW: 'variant_price', // Fallback to USD
  INR: 'variant_price', // Fallback to USD
  MXN: 'variant_price', // Fallback to USD
  BRL: 'variant_price', // Fallback to USD
  NZD: 'price_aud', // NZ falls back to AUD
};

/**
 * Maps currency codes to regional URL columns
 */
const CURRENCY_TO_URL_COLUMN: Record<CurrencyCode, string> = {
  USD: 'product_url',
  CAD: 'product_url_ca',
  GBP: 'product_url_uk',
  EUR: 'product_url_eu',
  AUD: 'product_url_au',
  JPY: 'product_url_jp',
  CHF: 'product_url_eu',
  SEK: 'product_url_eu',
  CNY: 'product_url',
  KRW: 'product_url',
  INR: 'product_url',
  MXN: 'product_url',
  BRL: 'product_url',
  NZD: 'product_url_au',
};

/**
 * Known vendors and their native currencies
 * These vendors price in their local currency, NOT USD
 */
const VENDOR_NATIVE_CURRENCY: Record<string, CurrencyCode> = {
  // Canadian vendors
  'filaments.ca': 'CAD',
  'filaments ca': 'CAD',
  '3dprintingcanada': 'CAD',
  '3d printing canada': 'CAD',
  'spool3d': 'CAD',
  'canadamakes': 'CAD',
  // UK vendors
  '3djake uk': 'GBP',
  'technology outlet': 'GBP',
  'rigid.ink': 'GBP',
  // EU vendors
  '3djake': 'EUR',
  'dasfilament': 'EUR',
  'extrudr': 'EUR',
  // Australian vendors
  '3dfillies': 'AUD',
  'aurarum': 'AUD',
  // Japanese vendors
  '3dfs': 'JPY',
};

/**
 * Detect a vendor's native currency based on name or URL patterns
 */
function detectVendorCurrency(vendor: string | null | undefined, productUrl: string | null | undefined): CurrencyCode | null {
  if (!vendor && !productUrl) return null;
  
  const vendorLower = vendor?.toLowerCase() || '';
  const urlLower = productUrl?.toLowerCase() || '';
  
  // Check known vendors first
  for (const [key, currency] of Object.entries(VENDOR_NATIVE_CURRENCY)) {
    if (vendorLower.includes(key) || urlLower.includes(key.replace(/\s+/g, ''))) {
      return currency;
    }
  }
  
  // Check URL domain patterns
  try {
    if (productUrl) {
      const url = new URL(productUrl);
      const hostname = url.hostname.toLowerCase();
      
      // Canadian domains
      if (hostname.endsWith('.ca') || hostname.includes('.ca/')) {
        return 'CAD';
      }
      // UK domains
      if (hostname.endsWith('.co.uk') || hostname.endsWith('.uk')) {
        return 'GBP';
      }
      // Australian domains
      if (hostname.endsWith('.com.au') || hostname.endsWith('.au')) {
        return 'AUD';
      }
      // Japanese domains
      if (hostname.endsWith('.jp') || hostname.endsWith('.co.jp')) {
        return 'JPY';
      }
      // European domains (common ones)
      if (hostname.endsWith('.de') || hostname.endsWith('.fr') || 
          hostname.endsWith('.it') || hostname.endsWith('.es') ||
          hostname.endsWith('.nl') || hostname.endsWith('.eu')) {
        return 'EUR';
      }
    }
  } catch {
    // Invalid URL, ignore
  }
  
  // Default: assume USD
  return null;
}

export interface FilamentWithRegionalPrices {
  id: string;
  product_url?: string | null;
  product_url_ca?: string | null;
  product_url_uk?: string | null;
  product_url_eu?: string | null;
  product_url_au?: string | null;
  product_url_jp?: string | null;
  variant_price?: number | null;
  price_cad?: number | null;
  price_gbp?: number | null;
  price_eur?: number | null;
  price_aud?: number | null;
  price_jpy?: number | null;
  vendor?: string | null;
  [key: string]: any;
}

export interface RegionalPriceResult {
  /** The actual regional price if available, or null */
  regionalPrice: number | null;
  /** Whether this is an actual regional price (true) or a converted USD price (false) */
  isActualRegionalPrice: boolean;
  /** The best URL to use for this region */
  regionalUrl: string;
  /** Price source indicator for display */
  priceSource: 'regional' | 'converted' | 'unavailable';
  /** Currency code for the regional price */
  currency: CurrencyCode;
  /** The vendor's native currency if detected */
  vendorCurrency: CurrencyCode | null;
}

/**
 * Hook to get the best regional price and URL for a filament
 * Prioritizes actual regional prices from database over converted USD prices
 * Also detects vendor native currency to avoid incorrect conversions
 */
export function useRegionalPrice(filament: FilamentWithRegionalPrices | null): RegionalPriceResult {
  const { currency, convertPrice } = useCurrency();
  const { getRegionalUrl, currentRegion } = useRegionalStore();

  return useMemo(() => {
    if (!filament) {
      return {
        regionalPrice: null,
        isActualRegionalPrice: false,
        regionalUrl: '',
        priceSource: 'unavailable' as const,
        currency,
        vendorCurrency: null,
      };
    }

    // Detect vendor's native currency
    const vendorCurrency = detectVendorCurrency(filament.vendor, filament.product_url);

    // Get the column names for current currency
    const priceColumn = CURRENCY_TO_PRICE_COLUMN[currency];
    const urlColumn = CURRENCY_TO_URL_COLUMN[currency];

    // Try to get actual regional price from database
    const actualRegionalPrice = filament[priceColumn] as number | null | undefined;
    
    // Try to get regional URL from database
    let regionalUrl = filament[urlColumn] as string | null | undefined;
    
    // If no regional URL in database, transform the base URL
    if (!regionalUrl && filament.product_url) {
      regionalUrl = getRegionalUrl(filament.product_url, filament.vendor);
    }
    
    // Fallback to base URL if nothing else works
    if (!regionalUrl) {
      regionalUrl = filament.product_url || '';
    }

    // Determine the best price to use
    // Priority 1: Actual scraped regional price from database
    if (actualRegionalPrice && actualRegionalPrice > 0) {
      return {
        regionalPrice: actualRegionalPrice,
        isActualRegionalPrice: true,
        regionalUrl: regionalUrl || '',
        priceSource: 'regional' as const,
        currency,
        vendorCurrency,
      };
    }
    
    // Priority 2: If vendor's native currency matches user's selected currency,
    // use variant_price directly (it's already in the right currency)
    if (vendorCurrency && vendorCurrency === currency && filament.variant_price && filament.variant_price > 0) {
      return {
        regionalPrice: filament.variant_price,
        isActualRegionalPrice: true, // It's a native price, not converted
        regionalUrl: regionalUrl || '',
        priceSource: 'regional' as const,
        currency,
        vendorCurrency,
      };
    }
    
    // Priority 3: Convert from vendor currency or USD
    if (filament.variant_price && filament.variant_price > 0) {
      // If vendor prices in a non-USD currency and user wants a different currency,
      // we can't accurately convert (we don't have cross-currency rates)
      // In this case, we still convert from variant_price as if it were USD
      // This may not be accurate, but it's the best we can do without more data
      const convertedPrice = convertPrice(filament.variant_price);
      return {
        regionalPrice: convertedPrice,
        isActualRegionalPrice: false,
        regionalUrl: regionalUrl || '',
        priceSource: 'converted' as const,
        currency,
        vendorCurrency,
      };
    }
    
    // No price available
    return {
      regionalPrice: null,
      isActualRegionalPrice: false,
      regionalUrl: regionalUrl || '',
      priceSource: 'unavailable' as const,
      currency,
      vendorCurrency,
    };
  }, [filament, currency, convertPrice, getRegionalUrl, currentRegion]);
}

/**
 * Get the best regional price for a filament without the hook
 * Useful for list views where you need to process multiple filaments
 */
export function getRegionalPrice(
  filament: FilamentWithRegionalPrices,
  currency: CurrencyCode
): { price: number | null; isRegional: boolean } {
  const priceColumn = CURRENCY_TO_PRICE_COLUMN[currency];
  const actualRegionalPrice = filament[priceColumn] as number | null | undefined;

  if (actualRegionalPrice && actualRegionalPrice > 0) {
    return { price: actualRegionalPrice, isRegional: true };
  }

  // Check if vendor's native currency matches
  const vendorCurrency = detectVendorCurrency(filament.vendor, filament.product_url);
  if (vendorCurrency === currency && filament.variant_price) {
    return { price: filament.variant_price, isRegional: true };
  }

  return { price: filament.variant_price ?? null, isRegional: false };
}

/**
 * Get the regional URL for a filament
 */
export function getRegionalUrlForCurrency(
  filament: FilamentWithRegionalPrices,
  currency: CurrencyCode
): string | null {
  const urlColumn = CURRENCY_TO_URL_COLUMN[currency];
  const regionalUrl = filament[urlColumn] as string | null | undefined;
  return regionalUrl || filament.product_url || null;
}

/**
 * Export the vendor currency detection for use elsewhere
 */
export { detectVendorCurrency };