/**
 * Exchange rates utility — types, constants, and formatting.
 *
 * The live exchange rate fetching is handled by RegionContext.
 * This module provides types and formatting helpers used by components
 * that can't use React hooks (e.g., PriceDisplay).
 */

export type Currency = 'USD' | 'CAD' | 'GBP' | 'EUR' | 'AUD' | 'JPY';

export const CURRENCIES: Currency[] = ['USD', 'CAD', 'GBP', 'EUR', 'AUD', 'JPY'];

export const CURRENCY_FLAGS: Record<Currency, string> = {
  USD: '🇺🇸',
  CAD: '🇨🇦',
  GBP: '🇬🇧',
  EUR: '🇪🇺',
  AUD: '🇦🇺',
  JPY: '🇯🇵',
};

export const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: 'en-US',
  CAD: 'en-CA',
  GBP: 'en-GB',
  EUR: 'de-DE',
  AUD: 'en-AU',
  JPY: 'ja-JP',
};

// Fallback rates (USD base, approximate as of 2026-03)
export const FALLBACK_RATES: Record<Currency, number> = {
  USD: 1,
  CAD: 1.39,
  GBP: 0.753,
  EUR: 0.868,
  AUD: 1.45,
  JPY: 160.02,
};

/**
 * Format an amount using the locale-appropriate currency format.
 */
export function formatPrice(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
}
