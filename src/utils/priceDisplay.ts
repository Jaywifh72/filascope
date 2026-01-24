import { RegionalPriceResult } from '@/types/regional';
import { REGIONS } from '@/config/regions';
import { formatPrice } from '@/config/currencies';
import type { CurrencyCode } from '@/types/regional';

/**
 * Get formatted price text from a RegionalPriceResult
 */
export function getPriceDisplayText(priceResult: RegionalPriceResult | null): string {
  if (!priceResult) return 'Price unavailable';
  return priceResult.formattedPrice;
}

/**
 * Get store attribution text with regional flag
 */
export function getStoreAttributionText(priceResult: RegionalPriceResult | null): string {
  if (!priceResult || !priceResult.store.name) return '';
  
  const regionConfig = REGIONS[priceResult.store.regionCode];
  const flag = regionConfig?.flag || '';
  
  if (priceResult.isConverted) {
    return `${flag} at ${priceResult.store.name}`;
  }
  return `at ${priceResult.store.name}`;
}

/**
 * Check if conversion badge should be shown
 */
export function shouldShowConversionBadge(priceResult: RegionalPriceResult | null): boolean {
  return priceResult?.isConverted ?? false;
}

/**
 * Calculate price per kg from total price and weight
 */
export function formatPricePerKg(
  price: number | null | undefined, 
  weightG: number | null | undefined, 
  packQty: number = 1
): number | null {
  if (!price || !weightG || weightG <= 0) return null;
  const weightKg = weightG / 1000;
  return price / (weightKg * packQty);
}

/**
 * Get regional flag for a region code
 */
export function getRegionalFlag(regionCode: string): string {
  const config = REGIONS[regionCode as keyof typeof REGIONS];
  return config?.flag || '';
}

/**
 * Format a price with currency symbol for display
 */
export function formatDisplayPrice(
  price: number | null | undefined,
  currency: CurrencyCode,
  options?: { showApproximate?: boolean; compact?: boolean }
): string {
  if (price === null || price === undefined) return '—';
  return formatPrice(price, currency, options);
}

/**
 * Get conversion tooltip info
 */
export function getConversionInfo(priceResult: RegionalPriceResult | null): {
  originalPrice: string;
  rate: string;
  sourceRegion: string;
} | null {
  if (!priceResult || !priceResult.isConverted) return null;
  
  const regionConfig = REGIONS[priceResult.store.regionCode];
  
  return {
    originalPrice: formatPrice(priceResult.originalPrice, priceResult.originalCurrency),
    rate: priceResult.conversionRate 
      ? `1 ${priceResult.originalCurrency} = ${priceResult.conversionRate.toFixed(4)} ${priceResult.displayCurrency}`
      : '',
    sourceRegion: regionConfig?.name || priceResult.store.regionCode,
  };
}
