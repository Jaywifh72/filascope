import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from './useCurrency';

interface CurrentPriceResult {
  currentPrice: number | null;
  compareAtPrice: number | null;
  weightGrams: number | null;
  currency: string;
  isLoading: boolean;
  isLivePrice: boolean;
  error: string | null;
  fetchedAt: string | null;
}

// Simple in-memory cache for the session
const priceCache = new Map<string, {
  price: number | null;
  compareAtPrice: number | null;
  weightGrams: number | null;
  currency: string;
  fetchedAt: string;
  expiresAt: number;
}>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

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
  fallbackUrl?: string | null // Original US URL to try if regional URL fails
): CurrentPriceResult {
  const { currency } = useCurrency();
  const [state, setState] = useState<CurrentPriceResult>({
    currentPrice: fallbackPrice,
    compareAtPrice: null,
    weightGrams: null,
    currency: currency,
    isLoading: false,
    isLivePrice: false,
    error: null,
    fetchedAt: null,
  });
  
  const fetchedUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!productUrl) {
      setState(prev => ({
        ...prev,
        currentPrice: fallbackPrice,
        weightGrams: null,
        isLoading: false,
        isLivePrice: false,
      }));
      return;
    }

    // Avoid duplicate fetches for same URL
    if (fetchedUrlRef.current === productUrl) {
      return;
    }

    const cacheKey = `${productUrl}:${currency}`;
    
    // Check cache first
    const cached = priceCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      setState({
        currentPrice: cached.price,
        compareAtPrice: cached.compareAtPrice,
        weightGrams: cached.weightGrams,
        currency: cached.currency,
        isLoading: false,
        isLivePrice: true,
        error: null,
        fetchedAt: cached.fetchedAt,
      });
      fetchedUrlRef.current = productUrl;
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const fetchPriceFromUrl = async (url: string, retryCount = 0): Promise<{ data: any; error: any }> => {
      try {
        const result = await supabase.functions.invoke('get-current-price', {
          body: { productUrl: url, currency },
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
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
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
          setState(prev => ({
            ...prev,
            currentPrice: fallbackPrice,
            isLoading: false,
            isLivePrice: false,
            error: null, // Don't expose error to UI for price fetching
          }));
          return;
        }

        if (data?.success && data.price !== null) {
          // Cache the result
          priceCache.set(cacheKey, {
            price: data.price,
            compareAtPrice: data.compareAtPrice,
            weightGrams: data.weightGrams,
            currency: data.currency,
            fetchedAt: data.fetchedAt,
            expiresAt: Date.now() + CACHE_TTL_MS,
          });

          setState({
            currentPrice: data.price,
            compareAtPrice: data.compareAtPrice,
            weightGrams: data.weightGrams,
            currency: data.currency,
            isLoading: false,
            isLivePrice: true,
            error: null,
            fetchedAt: data.fetchedAt,
          });
        } else {
          // Fall back to stored price silently
          setState(prev => ({
            ...prev,
            currentPrice: fallbackPrice,
            isLoading: false,
            isLivePrice: false,
            error: null, // Don't expose error to UI
          }));
        }
      } catch (err) {
        // Silently fall back to database price
        setState(prev => ({
          ...prev,
          currentPrice: fallbackPrice,
          isLoading: false,
          isLivePrice: false,
          error: null,
        }));
      }
      
      fetchedUrlRef.current = productUrl;
    };

    fetchCurrentPrice();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [productUrl, currency, fallbackPrice, fallbackUrl]);

  return state;
}
