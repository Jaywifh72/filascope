/**
 * Price Formatting Utilities
 * 
 * Provides consistent currency formatting across the application.
 */

// =============================================
// Types
// =============================================

export interface CurrencyFormatConfig {
  symbol: string;
  locale: string;
  decimals: number;
  symbolPosition: 'before' | 'after';
}

// =============================================
// Currency Configuration
// =============================================

export const CURRENCY_FORMAT_CONFIG: Record<string, CurrencyFormatConfig> = {
  USD: { symbol: '$', locale: 'en-US', decimals: 2, symbolPosition: 'before' },
  CAD: { symbol: 'C$', locale: 'en-CA', decimals: 2, symbolPosition: 'before' },
  EUR: { symbol: '€', locale: 'de-DE', decimals: 2, symbolPosition: 'before' },
  GBP: { symbol: '£', locale: 'en-GB', decimals: 2, symbolPosition: 'before' },
  AUD: { symbol: 'A$', locale: 'en-AU', decimals: 2, symbolPosition: 'before' },
  JPY: { symbol: '¥', locale: 'ja-JP', decimals: 0, symbolPosition: 'before' },
  CNY: { symbol: '¥', locale: 'zh-CN', decimals: 2, symbolPosition: 'before' },
  KRW: { symbol: '₩', locale: 'ko-KR', decimals: 0, symbolPosition: 'before' },
  INR: { symbol: '₹', locale: 'en-IN', decimals: 2, symbolPosition: 'before' },
  CHF: { symbol: 'CHF', locale: 'de-CH', decimals: 2, symbolPosition: 'before' },
  SEK: { symbol: 'kr', locale: 'sv-SE', decimals: 2, symbolPosition: 'after' },
  PLN: { symbol: 'zł', locale: 'pl-PL', decimals: 2, symbolPosition: 'after' },
  MXN: { symbol: 'MX$', locale: 'es-MX', decimals: 2, symbolPosition: 'before' },
  CZK: { symbol: 'Kč', locale: 'cs-CZ', decimals: 2, symbolPosition: 'after' },
};

// =============================================
// Formatting Functions
// =============================================

/**
 * Format a price amount with currency symbol
 * 
 * @param amount - The price amount (e.g., 24.99)
 * @param currency - Currency code (e.g., 'USD')
 * @param options - Formatting options
 * @returns Formatted price string (e.g., "$24.99")
 */
export function formatPrice(
  amount: number,
  currency: string,
  options: { showApproximate?: boolean; compact?: boolean } = {}
): string {
  const config = CURRENCY_FORMAT_CONFIG[currency];
  
  if (!config) {
    // Fallback for unknown currencies
    return `${amount.toFixed(2)} ${currency}`;
  }

  const { showApproximate = false, compact = false } = options;
  const rounded = Number(amount.toFixed(config.decimals));

  let formatted: string;
  if (compact && rounded >= 1000) {
    formatted = (rounded / 1000).toFixed(1) + 'k';
  } else {
    formatted = rounded.toLocaleString(config.locale, {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    });
  }

  const prefix = showApproximate ? '~' : '';

  if (config.symbolPosition === 'before') {
    return `${prefix}${config.symbol}${formatted}`;
  } else {
    return `${prefix}${formatted} ${config.symbol}`;
  }
}

/**
 * Format a price from cents to display string
 * 
 * @param cents - Price in cents (e.g., 2499)
 * @param currency - Currency code (e.g., 'USD')
 * @param options - Formatting options
 * @returns Formatted price string (e.g., "$24.99")
 */
export function formatCents(
  cents: number,
  currency: string,
  options: { showApproximate?: boolean; compact?: boolean } = {}
): string {
  const config = CURRENCY_FORMAT_CONFIG[currency];
  const divisor = config?.decimals === 0 ? 1 : 100;
  return formatPrice(cents / divisor, currency, options);
}

/**
 * Convert a price from one currency to another
 * 
 * @param amount - Amount in source currency
 * @param fromRateToUsd - Source currency's rate_to_usd
 * @param toRateToUsd - Target currency's rate_to_usd
 * @returns Converted amount in target currency
 */
export function convertPrice(
  amount: number,
  fromRateToUsd: number,
  toRateToUsd: number
): number {
  // rate_to_usd means: 1 unit of currency = X USD
  const amountInUsd = amount * fromRateToUsd;
  return amountInUsd / toRateToUsd;
}

/**
 * Convert cents from one currency to another
 */
export function convertCents(
  cents: number,
  fromRateToUsd: number,
  toRateToUsd: number
): number {
  const amount = cents / 100;
  const converted = convertPrice(amount, fromRateToUsd, toRateToUsd);
  return Math.round(converted * 100);
}

/**
 * Get the currency symbol for a currency code
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_FORMAT_CONFIG[currency]?.symbol || currency;
}

/**
 * Check if a currency uses 0 decimal places (like JPY, KRW)
 */
export function isZeroDecimalCurrency(currency: string): boolean {
  return CURRENCY_FORMAT_CONFIG[currency]?.decimals === 0;
}

/**
 * Parse a formatted price string back to a number
 * Note: This is a best-effort function and may not work for all formats
 */
export function parsePrice(formattedPrice: string): number | null {
  // Remove currency symbols, spaces, and thousands separators
  const cleaned = formattedPrice
    .replace(/[^\d.,\-]/g, '')
    .replace(/,/g, '.');
  
  // Handle European format where comma is decimal separator
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    // Multiple dots - assume last is decimal
    const decimal = parts.pop();
    const whole = parts.join('');
    return parseFloat(`${whole}.${decimal}`);
  }
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}
