/**
 * useUserRegion — thin wrapper around RegionContext's useRegion()
 *
 * Exposes only the currency + setCurrency interface used by PriceDisplay and
 * CurrencySelector, keeping those components decoupled from the full RegionContext API.
 */
import { useRegion } from '@/contexts/RegionContext';
import type { Currency } from '@/lib/exchange-rates';
import type { CurrencyCode } from '@/types/regional';

export function useUserRegion() {
  const { currency, setCurrency } = useRegion();

  return {
    currency: currency as Currency,
    setCurrency: (c: Currency) => setCurrency(c as CurrencyCode),
  };
}
