// Lightweight currency conversion with Supabase fallback

export const SUPPORTED_CURRENCIES = [
  { code: "USD", label: "US Dollar",          flag: "🇺🇸" },
  { code: "CAD", label: "Canadian Dollar",    flag: "🇨🇦" },
  { code: "GBP", label: "British Pound",      flag: "🇬🇧" },
  { code: "EUR", label: "Euro",               flag: "🇪🇺" },
  { code: "AUD", label: "Australian Dollar",  flag: "🇦🇺" },
  { code: "JPY", label: "Japanese Yen",       flag: "🇯🇵" },
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export const DEFAULT_RATES: Record<SupportedCurrency, number> = {
  USD: 1,
  CAD: 1.39,
  GBP: 0.753,
  EUR: 0.868,
  AUD: 1.45,
  JPY: 160.02,
};

const CACHE_KEY = "filascope_fx_rates_v2";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

interface CachedRates {
  rates: Record<string, number>;
  timestamp: number;
}

export async function fetchRates(): Promise<Record<SupportedCurrency, number>> {
  // Check localStorage cache first
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: CachedRates = JSON.parse(raw);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.rates as Record<SupportedCurrency, number>;
      }
    }
  } catch {
    // ignore parse errors
  }

  // Try Supabase exchange_rates table
  try {
    const SUPABASE_URL = "https://fytxfdvbzstnimzhjgth.supabase.co";
    const SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHhmZHZienN0bmltemhqZ3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDg2NjAsImV4cCI6MjA3OTkyNDY2MH0.placeholder";

    const res = await fetch(`${SUPABASE_URL}/rest/v1/exchange_rates?select=currency_code,rate_to_usd`, {
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    });

    if (res.ok) {
      const rows: Array<{ currency_code: string; rate_to_usd: number }> = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const rates: Record<string, number> = { USD: 1 };
        for (const row of rows) {
          if (row.currency_code && row.rate_to_usd) {
            // rate_to_usd means 1 USD = rate_to_usd units of that currency
            rates[row.currency_code] = row.rate_to_usd;
          }
        }

        try {
          const toCache: CachedRates = { rates, timestamp: Date.now() };
          localStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
        } catch {
          // ignore storage errors
        }

        return rates as Record<SupportedCurrency, number>;
      }
    }
  } catch {
    // fall through to defaults
  }

  // Fallback to hardcoded rates
  const fallback = { ...DEFAULT_RATES };
  try {
    const toCache: CachedRates = { rates: fallback, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
  } catch {
    // ignore
  }
  return fallback;
}

/** Convert a USD price to another currency. */
export function convertPrice(
  usdPrice: number,
  targetCurrency: SupportedCurrency,
  rates: Record<string, number> = DEFAULT_RATES
): number {
  const rate = rates[targetCurrency] ?? DEFAULT_RATES[targetCurrency] ?? 1;
  return usdPrice * rate;
}

/** Format an amount using Intl.NumberFormat, e.g. "CA$29.99" */
export function formatPrice(amount: number, currency: SupportedCurrency): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "JPY" ? 0 : 2,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount);
}

/**
 * Detect the user's preferred currency from:
 * 1. localStorage "filascope_currency"
 * 2. navigator.language locale
 * 3. Default: USD
 */
export function detectUserCurrency(): SupportedCurrency {
  try {
    const stored = localStorage.getItem("filascope_currency") as SupportedCurrency | null;
    if (stored && DEFAULT_RATES[stored] !== undefined) return stored;
  } catch {
    // ignore
  }

  try {
    const lang = navigator.language ?? "";
    if (/^en-CA/i.test(lang)) return "CAD";
    if (/^en-GB/i.test(lang)) return "GBP";
    if (/^en-AU/i.test(lang)) return "AUD";
    if (/^ja/i.test(lang))    return "JPY";
    if (/^(de|fr|it|es|nl)/i.test(lang)) return "EUR";
  } catch {
    // ignore
  }

  return "USD";
}
