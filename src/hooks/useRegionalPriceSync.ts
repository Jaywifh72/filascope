import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RegionCode } from '@/types/regional';

interface RegionalSyncRequest {
  productId: string;
  productType: 'filament' | 'printer';
  regionCode: RegionCode;
  storeUrl?: string;
}

interface RegionalSyncResponse {
  success: boolean;
  syncRunId: string;
  regionStats: Record<string, {
    attempted: number;
    successful: number;
    failed: number;
    priceChanges: number;
  }>;
  errors?: Array<{
    productId: string;
    regionCode?: string;
    error: string;
  }>;
}

export function useRegionalPriceSync() {
  const queryClient = useQueryClient();
  const [syncingRegions, setSyncingRegions] = useState<Set<string>>(new Set());
  
  const syncRegionMutation = useMutation({
    mutationFn: async (request: RegionalSyncRequest): Promise<RegionalSyncResponse> => {
      const { data, error } = await supabase.functions.invoke('sync-prices', {
        body: {
          syncType: 'single',
          productType: request.productType,
          targetId: request.productId,
          regionCodes: [request.regionCode],
          useRegionalUrls: true,
          triggeredBy: 'admin',
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Sync failed');
      }
      
      return data;
    },
    onMutate: (variables) => {
      const key = `${variables.productId}-${variables.regionCode}`;
      setSyncingRegions(prev => new Set(prev).add(key));
      
      toast.info(`Syncing ${variables.regionCode} price...`);
    },
    onSuccess: (data, variables) => {
      const regionStat = data.regionStats?.[variables.regionCode];
      
      if (regionStat?.successful > 0) {
        toast.success(`${variables.regionCode} price synced`, {
          description: regionStat.priceChanges > 0 
            ? 'Price updated' 
            : 'Price unchanged',
        });
      } else if (regionStat?.failed > 0) {
        toast.warning(`${variables.regionCode} sync completed with issues`, {
          description: data.errors?.[0]?.error || 'Check extraction logs',
        });
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['product-regional-prices', variables.productId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['admin-filaments'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['admin-printers'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['filaments'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['printers'] 
      });
    },
    onError: (error: Error, variables) => {
      toast.error(`Failed to sync ${variables.regionCode}`, {
        description: error.message,
      });
    },
    onSettled: (_data, _error, variables) => {
      const key = `${variables.productId}-${variables.regionCode}`;
      setSyncingRegions(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    },
  });
  
  const syncRegion = useCallback((request: RegionalSyncRequest) => {
    syncRegionMutation.mutate(request);
  }, [syncRegionMutation]);
  
  const isSyncing = useCallback((productId: string, regionCode: string): boolean => {
    return syncingRegions.has(`${productId}-${regionCode}`);
  }, [syncingRegions]);
  
  const isAnySyncing = useCallback((): boolean => {
    return syncingRegions.size > 0;
  }, [syncingRegions]);
  
  return { 
    syncRegion, 
    isSyncing, 
    isAnySyncing,
    isPending: syncRegionMutation.isPending,
  };
}
