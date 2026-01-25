import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRegion } from '@/contexts/RegionContext';
import { CurrencyCode } from '@/types/regional';
import { formatPrice } from '@/config/currencies';

export interface LivePriceFetchResult {
  price: number | null;
  compareAtPrice: number | null;
  currency: CurrencyCode;
  originalPrice: number | null;
  originalCurrency: CurrencyCode;
  isConverted: boolean;
  fetchedAt: string | null;
  weightGrams: number | null;
}

export interface UseLivePriceFetchReturn {
  fetchLivePrice: (productUrl: string, fallbackUrl?: string | null) => Promise<LivePriceFetchResult | null>;
  isLoading: boolean;
  lastResult: LivePriceFetchResult | null;
  error: string | null;
  reset: () => void;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

function isTransientError(error: any): boolean {
  if (!error) return false;
  const message = error.message || error.error || String(error);
  return message.includes('BOOT_ERROR') || 
         message.includes('503') || 
         message.includes('Function failed to start');
}

/**
 * Hook for on-demand live price fetching.
 * Unlike useCurrentPrice which fetches on mount, this hook provides a manual trigger function.
 */
export function useLivePriceFetch(): UseLivePriceFetchReturn {
  const { currency: userCurrency, convertPrice, getConversionRate } = useRegion();
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<LivePriceFetchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setLastResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const fetchFromUrl = useCallback(async (url: string, retryCount = 0): Promise<{ data: any; error: any }> => {
    try {
      const result = await supabase.functions.invoke('get-current-price', {
        body: { productUrl: url },
      });
      
      if (isTransientError(result.error) && retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
        return fetchFromUrl(url, retryCount + 1);
      }
      
      return result;
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
        return fetchFromUrl(url, retryCount + 1);
      }
      return { data: null, error: err };
    }
  }, []);

  const fetchLivePrice = useCallback(async (
    productUrl: string, 
    fallbackUrl?: string | null
  ): Promise<LivePriceFetchResult | null> => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      // First try the primary URL
      let { data, error: fetchError } = await fetchFromUrl(productUrl);

      // If 404 and fallback exists, try fallback
      const is404Error = data?.error?.includes('404') || data?.error?.includes('HTTP 404');
      if (is404Error && fallbackUrl && fallbackUrl !== productUrl) {
        const fallbackResult = await fetchFromUrl(fallbackUrl);
        data = fallbackResult.data;
        fetchError = fallbackResult.error;
      }

      if (fetchError) {
        if (!isTransientError(fetchError)) {
          console.warn('Live price fetch failed:', fetchError.message || fetchError);
        }
        setError('Unable to fetch live price');
        setIsLoading(false);
        return null;
      }

      if (data?.success && data.price !== null) {
        const rawPrice = data.price;
        const rawCompareAtPrice = data.compareAtPrice;
        const rawCurrency = (data.currency as CurrencyCode) || 'USD';
        
        const needsConversion = rawCurrency !== userCurrency;
        let convertedPrice = rawPrice;
        let convertedCompareAtPrice = rawCompareAtPrice;
        
        if (needsConversion && rawPrice !== null) {
          convertedPrice = convertPrice(rawPrice, rawCurrency);
          if (rawCompareAtPrice !== null) {
            convertedCompareAtPrice = convertPrice(rawCompareAtPrice, rawCurrency);
          }
        }

        const result: LivePriceFetchResult = {
          price: convertedPrice,
          compareAtPrice: convertedCompareAtPrice,
          currency: userCurrency,
          originalPrice: needsConversion ? rawPrice : null,
          originalCurrency: rawCurrency,
          isConverted: needsConversion,
          fetchedAt: data.fetchedAt || new Date().toISOString(),
          weightGrams: data.weightGrams || null,
        };

        setLastResult(result);
        setIsLoading(false);
        return result;
      } else {
        setError('Price not available');
        setIsLoading(false);
        return null;
      }
    } catch (err) {
      console.error('Live price fetch error:', err);
      setError('Failed to fetch price');
      setIsLoading(false);
      return null;
    }
  }, [userCurrency, convertPrice, fetchFromUrl]);

  return {
    fetchLivePrice,
    isLoading,
    lastResult,
    error,
    reset,
  };
}
