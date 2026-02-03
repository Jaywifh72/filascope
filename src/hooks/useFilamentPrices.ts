import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  FilamentPrice, 
  FilamentPriceWithStore, 
  RegionalPriceRpcResult, 
  BestPriceRpcResult,
  Store 
} from '@/types/regional';

// =============================================
// Query Options
// =============================================

export interface UseFilamentPricesOptions {
  inStockOnly?: boolean;
  storeId?: string;
}

// =============================================
// Query Hooks
// =============================================

/**
 * Get all prices for a specific filament
 */
export function useFilamentPrices(
  filamentId: string | undefined,
  options: UseFilamentPricesOptions = {}
) {
  const { inStockOnly = false, storeId } = options;

  return useQuery({
    queryKey: ['filament-prices', filamentId, { inStockOnly, storeId }],
    queryFn: async () => {
      if (!filamentId) return [];

      let query = supabase
        .from('filament_prices')
        .select(`
          *,
          store:stores(*)
        `)
        .eq('filament_id', filamentId)
        .order('price_cents', { ascending: true });

      if (inStockOnly) {
        query = query.eq('in_stock', true);
      }
      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform to FilamentPriceWithStore format
      return (data || []).map((row): FilamentPriceWithStore => ({
        ...row,
        store: row.store as Store,
        price_display: row.price_cents / 100,
        price_local: row.price_cents / 100, // Will be converted by caller if needed
        is_local_store: false, // Will be determined by caller based on user region
        ships_to_user: true, // Default to true, caller can refine
      }));
    },
    enabled: !!filamentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get regional prices for a filament using the RPC function
 * Returns prices sorted by relevance to user's region
 */
export function useFilamentRegionalPrices(
  filamentId: string | undefined,
  userRegion: string | undefined
) {
  return useQuery({
    queryKey: ['filament-prices', 'regional', filamentId, userRegion],
    queryFn: async () => {
      if (!filamentId || !userRegion) return [];

      const { data, error } = await supabase.rpc('get_filament_regional_prices', {
        p_filament_id: filamentId,
        p_user_region: userRegion,
      });

      if (error) throw error;
      return (data || []) as RegionalPriceRpcResult[];
    },
    enabled: !!filamentId && !!userRegion,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get the best price for a filament based on user's region
 */
export function useFilamentBestPrice(
  filamentId: string | undefined,
  userRegion: string | undefined
) {
  return useQuery({
    queryKey: ['filament-prices', 'best', filamentId, userRegion],
    queryFn: async () => {
      if (!filamentId || !userRegion) return null;

      const { data, error } = await supabase.rpc('get_filament_best_price', {
        p_filament_id: filamentId,
        p_user_region: userRegion,
      });

      if (error) throw error;
      // The RPC returns is_local instead of is_local_store
      if (data?.[0]) {
        const result = data[0] as { 
          store_name: string; 
          price_display: string; 
          product_url: string | null; 
          is_local_store?: boolean;
          is_local?: boolean;
          ships_to_user: boolean; 
        };
        return {
          store_name: result.store_name,
          price_display: result.price_display,
          product_url: result.product_url,
          is_local_store: result.is_local_store ?? result.is_local ?? false,
          ships_to_user: result.ships_to_user,
        } as BestPriceRpcResult;
      }
      return null;
    },
    enabled: !!filamentId && !!userRegion,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get all prices across all filaments for a specific store
 */
export function useStorePrices(storeId: string | undefined) {
  return useQuery({
    queryKey: ['store-prices', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await supabase
        .from('filament_prices')
        .select('*')
        .eq('store_id', storeId)
        .eq('in_stock', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as FilamentPrice[];
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get price statistics for a filament
 */
export function useFilamentPriceStats(filamentId: string | undefined) {
  return useQuery({
    queryKey: ['filament-prices', 'stats', filamentId],
    queryFn: async () => {
      if (!filamentId) return null;

      const { data, error } = await supabase
        .from('filament_prices')
        .select('price_cents, currency_code, in_stock')
        .eq('filament_id', filamentId)
        .eq('in_stock', true);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const prices = data.map(p => p.price_cents);
      return {
        count: data.length,
        minCents: Math.min(...prices),
        maxCents: Math.max(...prices),
        avgCents: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      };
    },
    enabled: !!filamentId,
    staleTime: 1000 * 60 * 5,
  });
}
