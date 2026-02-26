import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRegion } from '@/contexts/RegionContext';
import { CurrencyCode } from '@/types/regional';
import { formatPrice } from '@/config/currencies';

/** Granular stock status for display */
export type StockStatus = 'in_stock' | 'out_of_stock' | 'low_stock' | 'preorder' | 'unknown';

export interface LivePriceFetchResult {
  price: number | null;
  compareAtPrice: number | null;
  currency: CurrencyCode;
  originalPrice: number | null;
  originalCurrency: CurrencyCode;
  isConverted: boolean;
  fetchedAt: string | null;
  weightGrams: number | null;
  /** Whether the price was flagged as suspicious but still returned */
  isSuspicious?: boolean;
  /** URL status: 'ok' if successful, 'not_found' for 404, 'error' for other failures */
  urlStatus?: 'ok' | 'not_found' | 'error';
  /** Human-readable error message when URL fails */
  errorMessage?: string;
  /** The actual URL that was scraped (may differ from input after regional transformation) */
  sourceUrl?: string;
  /** True if detected currency doesn't match expected currency */
  currencyMismatch?: boolean;
  /** The currency detected from the scraped page */
  detectedCurrency?: CurrencyCode;
  /** Stock availability - false means product is sold out */
  available?: boolean;
  /** Granular stock status: in_stock, out_of_stock, low_stock, preorder, unknown */
  stockStatus?: StockStatus;
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

// Price validation: reasonable filament price range per spool
const MIN_REASONABLE_PRICE = 3; // $3 minimum
const MAX_REASONABLE_PRICE = 150; // $150 maximum (allows for multi-packs)

/**
 * Validate that a price is within reasonable range for filament products.
 * This filters out promotional banners, coupon values, and extraction errors.
 */
function isReasonableFilamentPrice(price: number): boolean {
  return price >= MIN_REASONABLE_PRICE && price <= MAX_REASONABLE_PRICE;
}

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
  const { currency: userCurrency, region, convertPrice, getConversionRate } = useRegion();
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<LivePriceFetchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setLastResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Reset cached results when region changes to prevent stale currency values
  useEffect(() => {
    reset();
  }, [region, reset]);

  const fetchFromUrl = useCallback(async (url: string, currency: string, retryCount = 0): Promise<{ data: any; error: any }> => {
    try {
      const fnName = url.includes('azurefilm.com') ? 'get-current-price-wc' : 'get-current-price';
      const result = await supabase.functions.invoke(fnName, {
        body: { productUrl: url, currency },
      });
      
      if (isTransientError(result.error) && retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
        return fetchFromUrl(url, currency, retryCount + 1);
      }
      
      return result;
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
        return fetchFromUrl(url, currency, retryCount + 1);
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
      // Check if there's a known redirect URL in cache before trying primary URL
      let urlToTry = productUrl;
      let cachedRedirectUrl: string | null = null;
      
      try {
        const { data: cachedValidation } = await supabase
          .from('url_validation_cache')
          .select('redirect_url, status')
          .eq('url', productUrl)
          .maybeSingle();
        
        // If we have a cached redirect to a valid product page, use it first
        if (cachedValidation?.status === 'redirect' && cachedValidation?.redirect_url) {
          cachedRedirectUrl = cachedValidation.redirect_url;
          urlToTry = cachedRedirectUrl;
          console.log('Using cached redirect URL:', urlToTry);
        }
      } catch (cacheErr) {
        // Cache check failed, continue with original URL
        console.log('Cache check failed, using original URL');
      }

      // First try the primary URL (or cached redirect)
      let { data, error: fetchError } = await fetchFromUrl(urlToTry, userCurrency);

      // Detect 404 errors
      const is404Error = data?.error?.includes('404') || 
                         data?.error?.includes('HTTP 404') ||
                         data?.error?.toLowerCase().includes('not found');
      
      // If 404 and we used a cached redirect, try original URL
      if (is404Error && cachedRedirectUrl && urlToTry === cachedRedirectUrl) {
        console.log('Cached redirect failed, trying original URL');
        const originalResult = await fetchFromUrl(productUrl, userCurrency);
        if (originalResult.data?.success) {
          data = originalResult.data;
          fetchError = originalResult.error;
        }
      }
      
      // If 404 and fallback exists, try fallback
      if (is404Error && fallbackUrl && fallbackUrl !== productUrl && fallbackUrl !== urlToTry) {
        const fallbackResult = await fetchFromUrl(fallbackUrl, userCurrency);
        // Only use fallback if it succeeds
        const fallbackIs404 = fallbackResult.data?.error?.includes('404') ||
                              fallbackResult.data?.error?.includes('HTTP 404');
        if (!fallbackIs404 && fallbackResult.data?.success) {
          data = fallbackResult.data;
          fetchError = fallbackResult.error;
        }
      }

      // Return 404-specific result to allow UI to show broken URL report
      if (is404Error && (!data?.success)) {
        console.warn('Product URL returned 404:', productUrl);
        setError('Product page not found');
        setIsLoading(false);
        return {
          price: null,
          compareAtPrice: null,
          currency: userCurrency,
          originalPrice: null,
          originalCurrency: 'USD',
          isConverted: false,
          fetchedAt: null,
          weightGrams: null,
          isSuspicious: false,
          urlStatus: 'not_found',
          errorMessage: 'Product page not found - URL may have changed',
        };
      }

      if (fetchError) {
        if (!isTransientError(fetchError)) {
          console.warn('Live price fetch failed:', fetchError.message || fetchError);
        }
        setError('Unable to fetch live price');
        setIsLoading(false);
        return {
          price: null,
          compareAtPrice: null,
          currency: userCurrency,
          originalPrice: null,
          originalCurrency: 'USD',
          isConverted: false,
          fetchedAt: null,
          weightGrams: null,
          isSuspicious: false,
          urlStatus: 'error',
          errorMessage: 'Unable to fetch live price',
        };
      }

      if (data?.success && data.price !== null) {
        const rawPrice = data.price;
        const rawCompareAtPrice = data.compareAtPrice;
        const rawCurrency = (data.currency as CurrencyCode) || 'USD';
        const detectedCurrency = (data.detectedCurrency as CurrencyCode) || rawCurrency;
        const currencyMismatch = data.currencyMismatch || false;
        const sourceUrl = data.sourceUrl || productUrl;
        
        // SANITY CHECK: Validate price is within reasonable range
        const priceIsSuspicious = !isReasonableFilamentPrice(rawPrice);
        if (priceIsSuspicious) {
          console.warn(`Suspicious live price detected: $${rawPrice} - likely extraction error`);
          setError('Price may be inaccurate');
          setIsLoading(false);
          return null;
        }
        
        // Check for currency mismatch - if we requested EUR but got USD, show warning
        if (currencyMismatch) {
          console.warn(`Currency mismatch: requested ${userCurrency} but got ${rawCurrency} from ${sourceUrl}`);
        }
        
        const needsConversion = rawCurrency !== userCurrency;
        let convertedPrice = rawPrice;
        let convertedCompareAtPrice = rawCompareAtPrice;
        
        if (needsConversion && rawPrice !== null) {
          convertedPrice = convertPrice(rawPrice, rawCurrency);
          if (rawCompareAtPrice !== null) {
            convertedCompareAtPrice = convertPrice(rawCompareAtPrice, rawCurrency);
          }
        }

        // Determine stock status from response
        const rawStockStatus = data.stockStatus as StockStatus | undefined;
        const isAvailable = data.available !== false;
        const stockStatus: StockStatus = rawStockStatus || (isAvailable ? 'in_stock' : 'out_of_stock');

        const result: LivePriceFetchResult = {
          price: convertedPrice,
          compareAtPrice: convertedCompareAtPrice,
          currency: userCurrency,
          originalPrice: needsConversion ? rawPrice : null,
          originalCurrency: rawCurrency,
          isConverted: needsConversion,
          fetchedAt: data.fetchedAt || new Date().toISOString(),
          weightGrams: data.weightGrams || null,
          isSuspicious: false,
          urlStatus: 'ok',
          errorMessage: currencyMismatch 
            ? `Price in ${rawCurrency} - ${userCurrency} price unavailable` 
            : undefined,
          sourceUrl,
          currencyMismatch,
          detectedCurrency,
          // Stock availability - defaults to true if not explicitly returned
          available: isAvailable,
          // Granular stock status for UI display
          stockStatus,
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
