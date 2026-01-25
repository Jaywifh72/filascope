import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { invalidatePriceCache } from './useCurrentPrice';

export interface AdminPriceRefreshResult {
  success: boolean;
  newPrice?: number;
  compareAtPrice?: number;
  currency?: string;
  error?: string;
}

export interface UseAdminPriceRefreshReturn {
  refreshPrice: () => Promise<AdminPriceRefreshResult>;
  isRefreshing: boolean;
  lastRefreshError: string | null;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

/**
 * Check if an error is a transient boot error that can be retried
 */
function isTransientError(error: any): boolean {
  if (!error) return false;
  const message = error.message || error.error || String(error);
  return message.includes('BOOT_ERROR') || 
         message.includes('503') || 
         message.includes('Function failed to start');
}

/**
 * Check if the error indicates a 404 page not found
 */
function is404Error(data: any): boolean {
  if (!data) return false;
  const errorMsg = data.error || '';
  return errorMsg.includes('404') || errorMsg.includes('HTTP 404') || errorMsg.includes('not found');
}

/**
 * Map currency code to region code for price history
 */
function currencyToRegion(currency: string): string {
  const map: Record<string, string> = {
    'USD': 'US',
    'CAD': 'CA',
    'EUR': 'EU',
    'GBP': 'UK',
    'AUD': 'AU',
    'JPY': 'JP',
  };
  return map[currency] || 'US';
}

/**
 * Hook for admin functionality to manually refresh filament prices.
 * Calls the get-current-price Edge Function with forceRefresh and
 * persists results to the database.
 */
export function useAdminPriceRefresh(
  productUrl: string,
  filamentId: string
): UseAdminPriceRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshError, setLastRefreshError] = useState<string | null>(null);

  const refreshPrice = useCallback(async (): Promise<AdminPriceRefreshResult> => {
    if (!productUrl || !filamentId) {
      return { success: false, error: 'Missing product URL or filament ID' };
    }

    setIsRefreshing(true);
    setLastRefreshError(null);

    try {
      // Call edge function with retry logic
      let data: any = null;
      let error: any = null;
      let retryCount = 0;

      while (retryCount <= MAX_RETRIES) {
        const result = await supabase.functions.invoke('get-current-price', {
          body: { productUrl, forceRefresh: true },
        });

        data = result.data;
        error = result.error;

        // Check for transient errors and retry
        if (isTransientError(error) && retryCount < MAX_RETRIES) {
          retryCount++;
          await new Promise(resolve => 
            setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, retryCount - 1))
          );
          continue;
        }

        break;
      }

      // Handle edge function errors (including 429 rate limit)
      if (error) {
        // For HTTP errors like 429, the message may be in the data object
        const errorMsg = data?.error || error.message || 'Failed to fetch price';
        setLastRefreshError(errorMsg);
        setIsRefreshing(false);
        return { success: false, error: errorMsg };
      }

      // Handle 404 errors gracefully
      if (is404Error(data)) {
        const errorMsg = 'Product page not found (404)';
        setLastRefreshError(errorMsg);
        setIsRefreshing(false);
        return { success: false, error: errorMsg };
      }

      // Check for valid price data
      if (!data?.success || data.price === null || data.price === undefined) {
        const errorMsg = data?.error || 'Invalid price data received';
        setLastRefreshError(errorMsg);
        setIsRefreshing(false);
        return { success: false, error: errorMsg };
      }

      const { price, compareAtPrice, currency = 'USD' } = data;

      // Use RPC function for atomic update with admin check
      const { error: rpcError } = await supabase
        .rpc('update_filament_price_after_refresh', {
          p_filament_id: filamentId,
          p_new_price: price,
          p_compare_at_price: compareAtPrice || null,
          p_currency: currency,
          p_source: 'manual'
        });

      if (rpcError) {
        const errorMsg = rpcError.message?.includes('Unauthorized') 
          ? 'Admin access required' 
          : 'Failed to save price to database';
        console.error('RPC error:', rpcError);
        setLastRefreshError(errorMsg);
        setIsRefreshing(false);
        return { success: false, error: errorMsg };
      }

      // Invalidate the useCurrentPrice cache for this URL
      invalidatePriceCache(productUrl);

      setIsRefreshing(false);
      return {
        success: true,
        newPrice: price,
        compareAtPrice: compareAtPrice || undefined,
        currency,
      };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unexpected error occurred';
      console.error('Admin price refresh error:', err);
      setLastRefreshError(errorMsg);
      setIsRefreshing(false);
      return { success: false, error: errorMsg };
    }
  }, [productUrl, filamentId]);

  return { refreshPrice, isRefreshing, lastRefreshError };
}
