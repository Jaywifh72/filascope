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

export function useCurrentPrice(
  productUrl: string | null | undefined,
  fallbackPrice: number | null
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

    const fetchCurrentPrice = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const { data, error } = await supabase.functions.invoke('get-current-price', {
          body: { productUrl, currency },
        });

        if (error) {
          console.error('Error fetching current price:', error);
          setState(prev => ({
            ...prev,
            currentPrice: fallbackPrice,
            isLoading: false,
            isLivePrice: false,
            error: error.message,
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
          // Fall back to stored price
          setState(prev => ({
            ...prev,
            currentPrice: fallbackPrice,
            isLoading: false,
            isLivePrice: false,
            error: data?.error || 'No price available',
          }));
        }
      } catch (err) {
        console.error('Error in useCurrentPrice:', err);
        setState(prev => ({
          ...prev,
          currentPrice: fallbackPrice,
          isLoading: false,
          isLivePrice: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }));
      }
      
      fetchedUrlRef.current = productUrl;
    };

    fetchCurrentPrice();
  }, [productUrl, currency, fallbackPrice]);

  return state;
}
