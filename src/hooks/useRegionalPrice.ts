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
}

/**
 * Hook to get the best regional price and URL for a filament
 * Prioritizes actual regional prices from database over converted USD prices
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
      };
    }

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
    if (actualRegionalPrice && actualRegionalPrice > 0) {
      // We have an actual regional price - use it directly
      return {
        regionalPrice: actualRegionalPrice,
        isActualRegionalPrice: true,
        regionalUrl: regionalUrl || '',
        priceSource: 'regional' as const,
        currency,
      };
    } else if (filament.variant_price && filament.variant_price > 0) {
      // No regional price, convert USD price
      const convertedPrice = convertPrice(filament.variant_price);
      return {
        regionalPrice: convertedPrice,
        isActualRegionalPrice: false,
        regionalUrl: regionalUrl || '',
        priceSource: 'converted' as const,
        currency,
      };
    } else {
      // No price available
      return {
        regionalPrice: null,
        isActualRegionalPrice: false,
        regionalUrl: regionalUrl || '',
        priceSource: 'unavailable' as const,
        currency,
      };
    }
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