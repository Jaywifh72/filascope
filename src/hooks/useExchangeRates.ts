import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ExchangeRate } from '@/types/regional';

// =============================================
// Types
// =============================================

export interface ExchangeRateStatus extends ExchangeRate {
  status: 'fresh' | 'stale' | 'outdated';
  hours_since_update: number;
}

export interface ExchangeRateMap {
  [currencyCode: string]: number; // rate_to_usd
}

// =============================================
// Query Hooks
// =============================================

/**
 * Get all exchange rates from the exchange_rates table
 */
export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('currency_code');

      if (error) throw error;
      return data as ExchangeRate[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Get exchange rates as a lookup map { USD: 1.0, CAD: 0.74, ... }
 */
export function useExchangeRateMap() {
  const { data: rates, ...rest } = useExchangeRates();

  const rateMap: ExchangeRateMap = {};
  if (rates) {
    for (const rate of rates) {
      rateMap[rate.currency_code] = rate.rate_to_usd;
    }
  }

  return { data: rateMap, ...rest };
}

/**
 * Get exchange rate status from the view (includes freshness info)
 */
export function useExchangeRateStatus() {
  return useQuery({
    queryKey: ['exchange-rate-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_rate_status')
        .select('*')
        .order('currency_code');

      if (error) throw error;
      return data as ExchangeRateStatus[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Check if exchange rates need to be refreshed
 */
export function useShouldRefreshRates() {
  return useQuery({
    queryKey: ['exchange-rates', 'should-refresh'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('should_refresh_exchange_rates');
      if (error) throw error;
      return data as boolean;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// =============================================
// Utility Functions
// =============================================

/**
 * Convert an amount from one currency to another using rate map
 * 
 * @param amount - The amount to convert
 * @param fromCurrency - Source currency code (e.g., 'EUR')
 * @param toCurrency - Target currency code (e.g., 'USD')
 * @param rateMap - Map of currency codes to rate_to_usd values
 * @returns Converted amount or null if rates unavailable
 */
export function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rateMap: ExchangeRateMap
): number | null {
  const fromRate = rateMap[fromCurrency];
  const toRate = rateMap[toCurrency];

  if (fromRate === undefined || toRate === undefined) {
    return null;
  }

  // Convert to USD first, then to target currency
  // rate_to_usd means: 1 unit of currency = X USD
  const amountInUsd = amount * fromRate;
  const amountInTarget = amountInUsd / toRate;

  return amountInTarget;
}

/**
 * Convert cents from one currency to another
 */
export function convertCents(
  cents: number,
  fromCurrency: string,
  toCurrency: string,
  rateMap: ExchangeRateMap
): number | null {
  const converted = convertPrice(cents / 100, fromCurrency, toCurrency, rateMap);
  return converted !== null ? Math.round(converted * 100) : null;
}

/**
 * Hook that provides a conversion function with rates baked in
 */
export function useConvertPrice() {
  const { data: rateMap, isLoading } = useExchangeRateMap();

  const convert = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number | null => {
    if (!rateMap) return null;
    return convertPrice(amount, fromCurrency, toCurrency, rateMap);
  };

  return { convert, isLoading };
}
