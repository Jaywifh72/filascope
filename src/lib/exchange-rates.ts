/**
 * Standalone exchange rates utility
 * - Fetches from Supabase exchange_rates table if populated, or uses hardcoded fallback
 * - Caches in localStorage for 6 hours
 * - Exports: getExchangeRates(), convertPrice(), formatPrice()
 *
 * Note: The canonical in-app currency state lives in RegionContext.
 * This module is a standalone fetch path for components that can't use hooks,
 * or for use outside the React tree (e.g. SSR, scripts).
 */

const CACHE_KEY = 'filascope_exchange_rates';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const SUPABASE_URL = 'https://fytxfdvbzstnimzhjgth.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHhmZHZienN0bmltemhqZ3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDg2NjAsImV4cCI6MjA3OTkyNDY2MH0._jr0WrBFjn8nPRcj5jMLT_g6fKUl3drNIxIoytqqk0g';

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

export async function getExchangeRates(): Promise<Record<Currency, number>> {
  // Check localStorage cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rates, timestamp } = JSON.parse(cached) as {
        rates: Record<Currency, number>;
        timestamp: number;
      };
      if (Date.now() - timestamp < CACHE_TTL) {
        return rates;
      }
    }
  } catch {
    // Ignore parse errors
  }

  // Try Supabase
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/exchange_rates?select=currency_code,rate_to_usd&order=currency_code`,
      { headers: { apikey: SUPABASE_ANON_KEY } }
    );
    if (res.ok) {
      const data = (await res.json()) as Array<{ currency_code: string; rate_to_usd: number }>;
      if (Array.isArray(data) && data.length > 0) {
        // Convert rate_to_usd (1 unit = X USD) to rate-from-USD (1 USD = X units)
        const rates = { ...FALLBACK_RATES };
        for (const row of data) {
          const code = row.currency_code as Currency;
          if (code in rates && row.rate_to_usd > 0) {
            rates[code] = 1 / row.rate_to_usd;
          }
        }
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
        } catch {
          // localStorage may be full
        }
        return rates;
      }
    }
  } catch {
    // Network error — fall through to hardcoded rates
  }

  return FALLBACK_RATES;
}

/**
 * Convert a USD price to the target currency.
 * @param usdPrice - Price in USD
 * @param currency - Target currency code
 * @param rates    - Rate map from getExchangeRates() (1 USD = X units)
 */
export function convertPrice(
  usdPrice: number,
  currency: Currency,
  rates: Record<Currency, number>
): number {
  return usdPrice * (rates[currency] ?? 1);
}

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
