// Lightweight currency conversion — static rates with fallback

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
