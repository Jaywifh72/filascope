/**
 * useResolvedPrice — React hook wrapper around resolveFilamentPrice
 * 
 * Provides a consistent, formatted price result for any filament.
 * Use this hook in components (cards, detail pages, etc.) instead of
 * inline price calculations.
 * 
 * For non-hook contexts (e.g., inside .map() loops), use the pure
 * resolveFilamentPrice() utility directly with context values from useRegion().
 */

import { useMemo } from 'react';
import { useRegion } from '@/contexts/RegionContext';
import { resolveFilamentPrice, type FilamentForPricing, type ResolvedPrice } from '@/lib/resolveFilamentPrice';

export interface FormattedResolvedPrice extends ResolvedPrice {
  /** Formatted spool price string (e.g., "~C$54.99") */
  formattedSpoolPrice: string | null;
  /** Formatted per-spool price string */
  formattedPricePerSpool: string | null;
  /** Formatted per-kg price string (e.g., "~C$54.99/kg") */
  formattedPricePerKg: string | null;
  /** Formatted local per-kg price string (e.g., "C$75.94/kg") */
  formattedLocalPricePerKg: string | null;
  /** Whether exchange rates are still loading */
  isLoading: boolean;
}

export function useResolvedPrice(filament: FilamentForPricing | null | undefined): FormattedResolvedPrice {
  const { currency, convertPrice, hasRates, formatPrice, isLoading } = useRegion();

  return useMemo(() => {
    if (!filament) {
      return {
        spoolPrice: null,
        pricePerSpool: null,
        pricePerKg: null,
        currency,
        isConverted: false,
        source: 'unavailable' as const,
        localPricePerKg: null,
        bestIsLocal: false,
        formattedSpoolPrice: null,
        formattedPricePerSpool: null,
        formattedPricePerKg: null,
        formattedLocalPricePerKg: null,
        isLoading,
      };
    }

    const resolved = resolveFilamentPrice(filament, {
      userCurrency: currency,
      convertFromCurrency: convertPrice,
      hasRates,
    });

    return {
      ...resolved,
      formattedSpoolPrice: resolved.spoolPrice != null
        ? formatPrice(resolved.spoolPrice, { showApproximate: resolved.isConverted })
        : null,
      formattedPricePerSpool: resolved.pricePerSpool != null
        ? formatPrice(resolved.pricePerSpool, { showApproximate: resolved.isConverted })
        : null,
      formattedPricePerKg: resolved.pricePerKg != null
        ? formatPrice(resolved.pricePerKg, { showApproximate: resolved.isConverted })
        : null,
      formattedLocalPricePerKg: resolved.localPricePerKg != null
        ? formatPrice(resolved.localPricePerKg)
        : null,
      isLoading,
    };
  }, [filament, currency, convertPrice, hasRates, formatPrice, isLoading]);
}
