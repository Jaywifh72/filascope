/**
 * resolveFilamentPrice — Single Source of Truth for Filament Pricing
 * 
 * This pure utility function consolidates ALL price resolution logic into one
 * deterministic pipeline. Every view (card, table, detail, sidebar, sticky bar)
 * MUST use this function (or the useResolvedPrice hook wrapper) to ensure
 * consistent pricing across the entire site.
 * 
 * ## Price Resolution Strategy (Best Available Price)
 * Computes prices from all available sources and returns the CHEAPEST:
 * 1. Direct regional price column (e.g., `price_cad` for CAD users)
 * 2. Nearby region conversion (e.g., `price_eur` → CHF via exchange rates)
 * 3. USD (`variant_price`) converted to user's currency
 * 4. Amazon price (`amazon_price_usd`) converted to user's currency
 * 
 * The cheapest option becomes the primary price. If a direct regional price
 * exists but isn't the cheapest, it's surfaced as `localPricePerKg` so cards
 * can show "Local: C$XX.XX/kg" as a secondary line.
 * 
 * ## Terminology
 * - **"Price" (spool price)**: What you pay for one spool = spoolPrice / pack_quantity
 * - **"True Cost" (per-kg price)**: Normalized comparison cost = spoolPrice / ((net_weight_g / 1000) * pack_quantity)
 */

import type { CurrencyCode } from '@/types/regional';

// ─── Input Types ────────────────────────────────────────────────────────────

export interface FilamentForPricing {
  variant_price?: number | null;
  amazon_price_usd?: number | null;
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

export type PriceSource = 'regional' | 'converted' | 'amazon' | 'unavailable';

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
  /** Per-kg price from a local/regional store, if different from the best price. Null if best IS local or no regional price exists. */
  localPricePerKg: number | null;
  /** Whether the best price is from a local (regional) source */
  bestIsLocal: boolean;
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

  // Collect all possible price candidates
  interface PriceOption {
    spoolPrice: number;
    isConverted: boolean;
    source: PriceSource;
    isLocal: boolean;
  }
  
  const options: PriceOption[] = [];
  let regionalOption: PriceOption | null = null;

  // ── Option 1: Direct regional column match ──
  const directColumn = CURRENCY_TO_COLUMN[userCurrency];
  if (directColumn) {
    const directPrice = filament[directColumn] as number | null | undefined;
    if (directPrice != null && directPrice > 0) {
      const opt: PriceOption = { spoolPrice: directPrice, isConverted: false, source: 'regional', isLocal: true };
      options.push(opt);
      regionalOption = opt;
    }
  }

  // ── Option 2: Nearby region conversion ──
  if (hasRates) {
    const nearbyCurrency = NEARBY_CURRENCY_FALLBACK[userCurrency];
    if (nearbyCurrency) {
      const nearbyColumn = CURRENCY_TO_COLUMN[nearbyCurrency];
      if (nearbyColumn) {
        const nearbyPrice = filament[nearbyColumn] as number | null | undefined;
        if (nearbyPrice != null && nearbyPrice > 0) {
          const converted = convertFromCurrency(nearbyPrice, nearbyCurrency);
          options.push({ spoolPrice: converted, isConverted: true, source: 'converted', isLocal: false });
        }
      }
    }
  }

  // ── Option 3: USD fallback (variant_price) ──
  if (filament.variant_price != null && filament.variant_price > 0) {
    if (userCurrency === 'USD') {
      // Already added via directColumn for USD users — don't double-add
      if (!options.some(o => o.source === 'regional' && o.spoolPrice === filament.variant_price)) {
        options.push({ spoolPrice: filament.variant_price, isConverted: false, source: 'regional', isLocal: true });
      }
    } else if (hasRates) {
      const converted = convertFromCurrency(filament.variant_price, 'USD');
      // Don't add if it's the same as the regional option (for USD column match)
      if (!options.some(o => Math.abs(o.spoolPrice - converted) < 0.01)) {
        options.push({ spoolPrice: converted, isConverted: true, source: 'converted', isLocal: false });
      }
    }
  }

  // ── Option 4: Amazon price ──
  if (filament.amazon_price_usd != null && filament.amazon_price_usd > 0) {
    if (userCurrency === 'USD') {
      options.push({ spoolPrice: filament.amazon_price_usd, isConverted: false, source: 'amazon', isLocal: true });
    } else if (hasRates) {
      const converted = convertFromCurrency(filament.amazon_price_usd, 'USD');
      options.push({ spoolPrice: converted, isConverted: true, source: 'amazon', isLocal: false });
    }
  }

  // ── Pick the cheapest option ──
  if (options.length === 0) {
    return {
      spoolPrice: null,
      pricePerSpool: null,
      pricePerKg: null,
      currency: userCurrency,
      isConverted: false,
      source: 'unavailable',
      localPricePerKg: null,
      bestIsLocal: false,
    };
  }

  // Sort by per-kg price (or spool price if no weight) to find cheapest
  const getComparablePrice = (opt: PriceOption) => {
    if (weightKg && weightKg > 0) {
      return opt.spoolPrice / (weightKg * packQty);
    }
    return opt.spoolPrice;
  };

  options.sort((a, b) => getComparablePrice(a) - getComparablePrice(b));
  const best = options[0];

  // Compute local price for secondary display if it differs from best
  let localPricePerKg: number | null = null;
  if (regionalOption && regionalOption !== best && weightKg && weightKg > 0) {
    localPricePerKg = regionalOption.spoolPrice / (weightKg * packQty);
  }

  const result = buildResult(best.spoolPrice, packQty, weightKg, userCurrency, best.isConverted, best.source);
  return {
    ...result,
    localPricePerKg,
    bestIsLocal: best.isLocal,
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
): Omit<ResolvedPrice, 'localPricePerKg' | 'bestIsLocal'> {
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
