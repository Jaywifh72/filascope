import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getPriceEndpoint } from '@/utils/priceEndpointRouter';
import { useRegion } from '@/contexts/RegionContext';
import { CurrencyCode } from '@/types/regional';

interface CurrentPriceResult {
  /** Price in the user's selected currency (converted if necessary) */
  currentPrice: number | null;
  /** Compare-at price in the user's selected currency */
  compareAtPrice: number | null;
  /** Weight in grams from live data */
  weightGrams: number | null;
  /** User's selected currency (the currency of currentPrice) */
  currency: CurrencyCode;
  /** Original currency from the store (before conversion) */
  originalCurrency: CurrencyCode;
  /** Original price before conversion (null if no conversion needed) */
  originalPrice: number | null;
  /** Conversion rate used (null if no conversion) */
  conversionRate: number | null;
  /** Whether price was converted from a different currency */
  isConverted: boolean;
  isLoading: boolean;
  isLivePrice: boolean;
  error: string | null;
  fetchedAt: string | null;
  /** Whether the fetched price was flagged as suspicious */
  isSuspicious: boolean;
}

// Simple in-memory cache for the session
// CACHE VERSION: Increment this when price extraction logic changes to invalidate old cached values
const CACHE_VERSION = 2; // v2: Fixed "Save $X.XX" extraction bug

const priceCache = new Map<string, {
  price: number | null;
  compareAtPrice: number | null;
  weightGrams: number | null;
  currency: string;
  fetchedAt: string;
  expiresAt: number;
  cacheVersion: number;
}>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

/**
 * Invalidate the price cache for a specific product URL.
 * Call this after manually refreshing a price to ensure
 * the next useCurrentPrice call fetches fresh data.
 */
export function invalidatePriceCache(productUrl: string): boolean {
  return priceCache.delete(productUrl);
}

/**
 * Clear the entire price cache.
 * Useful for admin operations that affect multiple products.
 */
export function clearAllPriceCache(): void {
  priceCache.clear();
}

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

// Check if error is a transient boot error that can be retried
function isTransientError(error: any): boolean {
  if (!error) return false;
  const message = error.message || error.error || String(error);
  return message.includes('BOOT_ERROR') || 
         message.includes('503') || 
         message.includes('Function failed to start');
}

export function useCurrentPrice(
  productUrl: string | null | undefined,
  fallbackPrice: number | null,
  fallbackUrl?: string | null, // Original US URL to try if regional URL fails
  targetWeightGrams?: number | null,
): CurrentPriceResult {
  const { currency: userCurrency, convertPrice, getConversionRate } = useRegion();
  
  const [rawState, setRawState] = useState<{
    rawPrice: number | null;
    rawCompareAtPrice: number | null;
    weightGrams: number | null;
    rawCurrency: CurrencyCode;
    isLoading: boolean;
    isLivePrice: boolean;
    error: string | null;
    fetchedAt: string | null;
    isSuspicious: boolean;
  }>({
    rawPrice: fallbackPrice,
    rawCompareAtPrice: null,
    weightGrams: null,
    rawCurrency: 'USD',
    isLoading: false,
    isLivePrice: false,
    error: null,
    fetchedAt: null,
    isSuspicious: false,
  });
  
  const fetchedUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!productUrl) {
      setRawState(prev => ({
        ...prev,
        rawPrice: fallbackPrice,
        weightGrams: null,
        isLoading: false,
        isLivePrice: false,
        isSuspicious: false,
      }));
      return;
    }

    const requestKey = `${productUrl}::${targetWeightGrams ?? 'none'}`;

    // Avoid duplicate fetches for same URL + target weight
    if (fetchedUrlRef.current === requestKey) {
      return;
    }

    // Include target weight in cache key to avoid cross-variant contamination
    const cacheKey = requestKey;
    
    // Check cache first - also verify cache version matches to invalidate stale extraction logic
    const cached = priceCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() && cached.cacheVersion === CACHE_VERSION) {
      setRawState({
        rawPrice: cached.price,
        rawCompareAtPrice: cached.compareAtPrice,
        weightGrams: cached.weightGrams,
        rawCurrency: (cached.currency as CurrencyCode) || 'USD',
        isLoading: false,
        isLivePrice: true,
        error: null,
        fetchedAt: cached.fetchedAt,
        isSuspicious: false,
      });
      fetchedUrlRef.current = requestKey;
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const fetchPriceFromUrl = async (url: string, retryCount = 0): Promise<{ data: any; error: any }> => {
      try {
        // Don't pass currency preference - let the edge function return the store's native currency
        const fnName = getPriceEndpoint(url);
        const result = await supabase.functions.invoke(fnName, {
          body: {
            productUrl: url,
            targetWeightGrams: targetWeightGrams ?? null,
          },
        });
        
        // Retry on transient boot errors
        if (isTransientError(result.error) && retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
          return fetchPriceFromUrl(url, retryCount + 1);
        }
        
        return result;
      } catch (err) {
        // Retry on network errors
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
          return fetchPriceFromUrl(url, retryCount + 1);
        }
        return { data: null, error: err };
      }
    };

    const fetchCurrentPrice = async () => {
      setRawState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // First try the regional URL
        let { data, error } = await fetchPriceFromUrl(productUrl);

        // If we got a 404 error and have a fallback URL, try the fallback
        const is404Error = data?.error?.includes('404') || data?.error?.includes('HTTP 404');
        if (is404Error && fallbackUrl && fallbackUrl !== productUrl) {
          const fallbackResult = await fetchPriceFromUrl(fallbackUrl);
          data = fallbackResult.data;
          error = fallbackResult.error;
        }

        if (error) {
          // Silently log transient errors, don't spam console
          if (!isTransientError(error)) {
            console.warn('Price fetch failed:', error.message || error);
          }
          setRawState(prev => ({
            ...prev,
            rawPrice: fallbackPrice,
            isLoading: false,
            isLivePrice: false,
            error: null, // Don't expose error to UI for price fetching
          }));
          return;
        }

        if (data?.success && data.price !== null) {
          // SANITY CHECK: Validate price is within reasonable range
          if (!isReasonableFilamentPrice(data.price)) {
            console.warn(`Suspicious price detected: $${data.price} - likely extraction error, falling back to stored price`);
            setRawState(prev => ({
              ...prev,
              rawPrice: fallbackPrice,
              isLoading: false,
              isLivePrice: false,
              isSuspicious: true,
              error: 'Price extraction returned suspicious value',
            }));
            fetchedUrlRef.current = requestKey;
            return;
          }
          
          // Cache the result with the store's native currency and current cache version
          priceCache.set(cacheKey, {
            price: data.price,
            compareAtPrice: data.compareAtPrice,
            weightGrams: data.weightGrams,
            currency: data.currency || 'USD',
            fetchedAt: data.fetchedAt,
            expiresAt: Date.now() + CACHE_TTL_MS,
            cacheVersion: CACHE_VERSION,
          });

          setRawState({
            rawPrice: data.price,
            rawCompareAtPrice: data.compareAtPrice,
            weightGrams: data.weightGrams,
            rawCurrency: (data.currency as CurrencyCode) || 'USD',
            isLoading: false,
            isLivePrice: true,
            error: null,
            fetchedAt: data.fetchedAt,
            isSuspicious: false,
          });
        } else {
          // Fall back to stored price silently
          setRawState(prev => ({
            ...prev,
            rawPrice: fallbackPrice,
            isLoading: false,
            isLivePrice: false,
            error: null, // Don't expose error to UI
            isSuspicious: false,
          }));
        }
      } catch (err) {
        // Silently fall back to database price
        setRawState(prev => ({
          ...prev,
          rawPrice: fallbackPrice,
          isLoading: false,
          isLivePrice: false,
          error: null,
          isSuspicious: false,
        }));
      }
      
      fetchedUrlRef.current = requestKey;
    };

    fetchCurrentPrice();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [productUrl, fallbackPrice, fallbackUrl, targetWeightGrams]);

  // Convert prices to user's currency
  const convertedState = useMemo((): CurrentPriceResult => {
    const { rawPrice, rawCompareAtPrice, rawCurrency, weightGrams, isLoading, isLivePrice, error, fetchedAt, isSuspicious } = rawState;
    
    const needsConversion = rawCurrency !== userCurrency && rawPrice !== null;
    
    let convertedPrice: number | null = rawPrice;
    let convertedCompareAtPrice: number | null = rawCompareAtPrice;
    let conversionRate: number | null = null;
    
    if (needsConversion && rawPrice !== null) {
      conversionRate = getConversionRate(rawCurrency, userCurrency);
      convertedPrice = convertPrice(rawPrice, rawCurrency);
      
      if (rawCompareAtPrice !== null) {
        convertedCompareAtPrice = convertPrice(rawCompareAtPrice, rawCurrency);
      }
    }
    
    return {
      currentPrice: convertedPrice,
      compareAtPrice: convertedCompareAtPrice,
      weightGrams,
      currency: userCurrency,
      originalCurrency: rawCurrency,
      originalPrice: needsConversion ? rawPrice : null,
      conversionRate,
      isConverted: needsConversion,
      isLoading,
      isLivePrice,
      error,
      fetchedAt,
      isSuspicious,
    };
  }, [rawState, userCurrency, convertPrice, getConversionRate]);

  return convertedState;
}
