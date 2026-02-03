import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ImportHistoryEntry } from '@/types/priceImport';

/**
 * Hook to fetch price import history from brand_sync_logs
 */
export function usePriceImportHistory(limit = 20) {
  return useQuery({
    queryKey: ['price-import-history', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_sync_logs')
        .select('*')
        .eq('sync_type', 'price_import')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []) as ImportHistoryEntry[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
