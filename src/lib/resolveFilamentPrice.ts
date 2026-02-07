/**
 * resolveFilamentPrice — Single Source of Truth for Filament Pricing
 * 
 * This pure utility function consolidates ALL price resolution logic into one
 * deterministic pipeline. Every view (card, table, detail, sidebar, sticky bar)
 * MUST use this function (or the useResolvedPrice hook wrapper) to ensure
 * consistent pricing across the entire site.
 * 
 * ## Price Resolution Priority
 * 1. Direct regional price column (e.g., `price_cad` for CAD users) — native, no conversion
 * 2. Nearby region conversion (e.g., `price_eur` → CHF via exchange rates)
 * 3. USD (`variant_price`) converted to user's currency
 * 4. null (no price available)
 * 
 * ## Terminology
 * - **"Price" (spool price)**: What you pay for one spool = spoolPrice / pack_quantity
 * - **"True Cost" (per-kg price)**: Normalized comparison cost = spoolPrice / ((net_weight_g / 1000) * pack_quantity)
 */

import type { CurrencyCode } from '@/types/regional';

// ─── Input Types ────────────────────────────────────────────────────────────

export interface FilamentForPricing {
  variant_price?: number | null;
  price_cad?: number | null;
  price_eur?: number | null;
  price_gbp?: number | null;
  price_aud?: number | null;
  price_jpy?: number | null;
  net_weight_g?: number | null;
  pack_quantity?: number | null;
}

export interface PriceResolutionContext {
  /** The user's active currency from useRegion() */
  userCurrency: CurrencyCode;
  /** Convert an amount from `fromCurrency` to the user's currency. Should come from useRegion().convertPrice */
  convertFromCurrency: (amount: number, fromCurrency: CurrencyCode) => number;
  /** Whether exchange rates have loaded. If false, conversions return null to prevent 1:1 display bug */
  hasRates: boolean;
}

// ─── Output Types ───────────────────────────────────────────────────────────

export type PriceSource = 'regional' | 'converted' | 'unavailable';

export interface ResolvedPrice {
  /** Total price for the package (all spools in the pack) in user's currency */
  spoolPrice: number | null;
  /** Price per individual spool = spoolPrice / packQty */
  pricePerSpool: number | null;
  /** Normalized per-kg cost for comparison = spoolPrice / ((net_weight_g / 1000) * packQty) */
  pricePerKg: number | null;
  /** The currency the price is displayed in (always the user's currency) */
  currency: CurrencyCode;
  /** True if the price was converted from another currency (show ~ prefix) */
  isConverted: boolean;
  /** How the price was resolved */
  source: PriceSource;
}

// ─── Column Mapping ─────────────────────────────────────────────────────────

/**
 * Maps a CurrencyCode to the filament table column that stores native prices in that currency.
 * Only currencies with dedicated DB columns are listed here.
 */
const CURRENCY_TO_COLUMN: Partial<Record<CurrencyCode, keyof FilamentForPricing>> = {
  USD: 'variant_price',
  CAD: 'price_cad',
  EUR: 'price_eur',
  GBP: 'price_gbp',
  AUD: 'price_aud',
  JPY: 'price_jpy',
};

/**
 * For currencies without a dedicated DB column, try converting from a "nearby" currency
 * before falling back to USD. This gives more accurate results for e.g. CHF (from EUR)
 * or NZD (from AUD).
 */
const NEARBY_CURRENCY_FALLBACK: Partial<Record<CurrencyCode, CurrencyCode>> = {
  CHF: 'EUR',
  SEK: 'EUR',
  PLN: 'EUR',
  CZK: 'EUR',
  NZD: 'AUD',
};

// ─── Core Resolution Function ───────────────────────────────────────────────

export function resolveFilamentPrice(
  filament: FilamentForPricing,
  context: PriceResolutionContext
): ResolvedPrice {
  const { userCurrency, convertFromCurrency, hasRates } = context;
  const packQty = filament.pack_quantity || 1;
  const weightKg = filament.net_weight_g ? filament.net_weight_g / 1000 : null;

  // ── Priority 1: Direct regional column match ──
  const directColumn = CURRENCY_TO_COLUMN[userCurrency];
  if (directColumn) {
    const directPrice = filament[directColumn] as number | null | undefined;
    if (directPrice != null && directPrice > 0) {
      return buildResult(directPrice, packQty, weightKg, userCurrency, false, 'regional');
    }
  }

  // ── Priority 2: Nearby region conversion ──
  if (hasRates) {
    const nearbyCurrency = NEARBY_CURRENCY_FALLBACK[userCurrency];
    if (nearbyCurrency) {
      const nearbyColumn = CURRENCY_TO_COLUMN[nearbyCurrency];
      if (nearbyColumn) {
        const nearbyPrice = filament[nearbyColumn] as number | null | undefined;
        if (nearbyPrice != null && nearbyPrice > 0) {
          const converted = convertFromCurrency(nearbyPrice, nearbyCurrency);
          return buildResult(converted, packQty, weightKg, userCurrency, true, 'converted');
        }
      }
    }
  }

  // ── Priority 3: USD fallback ──
  if (filament.variant_price != null && filament.variant_price > 0) {
    if (userCurrency === 'USD') {
      return buildResult(filament.variant_price, packQty, weightKg, 'USD', false, 'regional');
    }
    if (hasRates) {
      const converted = convertFromCurrency(filament.variant_price, 'USD');
      return buildResult(converted, packQty, weightKg, userCurrency, true, 'converted');
    }
  }

  // ── Priority 4: No price available ──
  return {
    spoolPrice: null,
    pricePerSpool: null,
    pricePerKg: null,
    currency: userCurrency,
    isConverted: false,
    source: 'unavailable',
  };
}

// ─── Canonical Per-Kg Utility ───────────────────────────────────────────────

/**
 * Canonical per-kg price calculation.
 * DO NOT compute price-per-kg inline anywhere else in the codebase.
 * Always use this function or the useResolvedPrice hook.
 *
 * Formula: totalSpoolPrice / ((netWeightG / 1000) * packQuantity)
 *
 * @param totalSpoolPrice - The total price for the package (all spools)
 * @param netWeightG      - Net weight of a single spool in grams
 * @param packQuantity    - Number of spools in the pack (defaults to 1)
 * @returns Price per kilogram, or null if inputs are invalid
 */
export function computePricePerKg(
  totalSpoolPrice: number,
  netWeightG: number | null | undefined,
  packQuantity: number | null | undefined = 1
): number | null {
  const pq = packQuantity || 1;
  if (!netWeightG || netWeightG <= 0) return null;
  const weightKg = netWeightG / 1000;
  if (weightKg <= 0) return null;
  return totalSpoolPrice / (weightKg * pq);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildResult(
  spoolPrice: number,
  packQty: number,
  weightKg: number | null,
  currency: CurrencyCode,
  isConverted: boolean,
  source: PriceSource
): ResolvedPrice {
  const pricePerSpool = spoolPrice / packQty;
  const pricePerKg = weightKg && weightKg > 0
    ? spoolPrice / (weightKg * packQty)
    : null;

  return {
    spoolPrice,
    pricePerSpool,
    pricePerKg,
    currency,
    isConverted,
    source,
  };
}
