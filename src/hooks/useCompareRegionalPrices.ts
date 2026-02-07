/**
 * useCompareRegionalPrices — Batch regional price resolution for comparison views
 * 
 * Resolves prices for multiple filaments using the canonical resolveFilamentPrice()
 * pipeline, then provides formatted display values, regional URLs, and store names.
 * 
 * Used by: Compare.tsx, CompareActionRow, MobileCompareView, MobileStickyBuyBar
 */

import { useMemo } from 'react';
import { useRegion } from '@/contexts/RegionContext';
import { useAffiliateLinks } from '@/hooks/useAffiliateLinks';
import { resolveFilamentPrice, computePricePerKg, type FilamentForPricing } from '@/lib/resolveFilamentPrice';
import { getRegionalUrlForCurrency } from '@/hooks/useRegionalPrice';
import type { CurrencyCode } from '@/types/regional';

export interface CompareFilament extends FilamentForPricing {
  id: string;
  product_title?: string | null;
  vendor?: string | null;
  product_url?: string | null;
  product_url_ca?: string | null;
  product_url_uk?: string | null;
  product_url_eu?: string | null;
  product_url_au?: string | null;
  product_url_jp?: string | null;
  variant_available?: boolean | null;
  [key: string]: any;
}

export interface ResolvedComparePrice {
  /** Regional spool price (in user's currency) */
  spoolPrice: number | null;
  /** Regional price per kg (in user's currency) */
  pricePerKg: number | null;
  /** Formatted spool price string */
  formattedSpoolPrice: string | null;
  /** Formatted per-kg price string (e.g., "C$28.99") */
  formattedPricePerKg: string | null;
  /** Whether this is a converted price (show ~ prefix) */
  isConverted: boolean;
  /** The display currency code */
  currency: CurrencyCode;
  /** Best regional URL for purchase */
  regionalUrl: string | null;
  /** Affiliate-tagged purchase URL */
  affiliateUrl: string | null;
  /** Store display name (e.g., "Amazon" or "Polymaker Store") */
  storeName: string | null;
  /** Whether the product is in stock */
  inStock: boolean;
}

export interface CompareRegionalPricesResult {
  /** Map of filament ID to resolved price data */
  prices: Map<string, ResolvedComparePrice>;
  /** Indices of filaments with the best (lowest) regional price per kg */
  bestPriceIndices: number[];
  /** Whether prices are still loading (exchange rates not ready) */
  isLoading: boolean;
  /** Get resolved price for a filament by ID */
  getPrice: (id: string) => ResolvedComparePrice | undefined;
}

/**
 * Determines the store display name from a URL and vendor
 */
function getStoreName(url: string | null, vendor: string | null): string | null {
  if (!url) return null;
  const urlLower = url.toLowerCase();
  if (urlLower.includes('amazon.')) return 'Amazon';
  if (vendor) return `${vendor} Store`;
  return null;
}

export function useCompareRegionalPrices(filaments: CompareFilament[]): CompareRegionalPricesResult {
  const { currency, convertPrice, hasRates, formatPrice, isLoading: regionLoading } = useRegion();
  const { getAffiliateUrl } = useAffiliateLinks();

  const isLoading = !hasRates && currency !== 'USD';

  const result = useMemo(() => {
    const prices = new Map<string, ResolvedComparePrice>();

    filaments.forEach((filament) => {
      // Resolve price using canonical pipeline
      const resolved = resolveFilamentPrice(filament, {
        userCurrency: currency,
        convertFromCurrency: convertPrice,
        hasRates,
      });

      // Resolve regional URL
      const regionalUrl = getRegionalUrlForCurrency(filament, currency);

      // Build affiliate URL
      const affiliateUrl = regionalUrl
        ? getAffiliateUrl(regionalUrl, filament.vendor)
        : null;

      // Determine store name
      const storeName = getStoreName(regionalUrl, filament.vendor ?? null);

      prices.set(filament.id, {
        spoolPrice: resolved.spoolPrice,
        pricePerKg: resolved.pricePerKg,
        formattedSpoolPrice: resolved.spoolPrice != null
          ? formatPrice(resolved.spoolPrice, { showApproximate: resolved.isConverted })
          : null,
        formattedPricePerKg: resolved.pricePerKg != null
          ? formatPrice(resolved.pricePerKg, { showApproximate: resolved.isConverted })
          : null,
        isConverted: resolved.isConverted,
        currency: resolved.currency,
        regionalUrl,
        affiliateUrl,
        storeName,
        inStock: filament.variant_available !== false,
      });
    });

    // Compute best price indices based on regional per-kg prices
    const perKgPrices = filaments.map(f => prices.get(f.id)?.pricePerKg ?? null);
    const validPrices = perKgPrices.filter((p): p is number => p !== null && p > 0);
    const bestPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
    const bestPriceIndices = bestPrice !== null
      ? perKgPrices
          .map((p, idx) => (p !== null && p === bestPrice ? idx : -1))
          .filter(idx => idx !== -1)
      : [];

    return { prices, bestPriceIndices };
  }, [filaments, currency, convertPrice, hasRates, formatPrice, getAffiliateUrl]);

  const getPrice = (id: string) => result.prices.get(id);

  return {
    prices: result.prices,
    bestPriceIndices: result.bestPriceIndices,
    isLoading,
    getPrice,
  };
}
