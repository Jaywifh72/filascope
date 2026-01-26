import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncRequest {
  syncType: 'all' | 'brand' | 'single';
  productType: 'filament' | 'printer';
  targetId?: string;
  brandSlug?: string;
  triggeredBy?: 'admin' | 'scheduled' | 'api';
  dryRun?: boolean;
  limit?: number;
}

interface SyncResponse {
  success: boolean;
  syncRunId: string;
  syncType: string;
  productType: string;
  dryRun: boolean;
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  priceChanges: number;
  duration_ms: number;
  errors?: Array<{ productId: string; error: string }>;
}

export function usePriceSync() {
  const queryClient = useQueryClient();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncMutation = useMutation({
    mutationFn: async (request: SyncRequest): Promise<SyncResponse> => {
      const { data, error } = await supabase.functions.invoke('sync-prices', {
        body: request,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Sync failed');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      setLastSyncTime(new Date());
      
      // Invalidate relevant queries
      if (variables.productType === 'filament') {
        queryClient.invalidateQueries({ queryKey: ['admin-filaments'] });
        queryClient.invalidateQueries({ queryKey: ['filaments'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['admin-printers'] });
        queryClient.invalidateQueries({ queryKey: ['printers'] });
      }
      
      // Invalidate sync logs
      queryClient.invalidateQueries({ queryKey: ['brand-sync-logs'] });

      const duration = (data.duration_ms / 1000).toFixed(1);
      toast.success(`Sync completed in ${duration}s`, {
        description: `${data.successful} updated, ${data.failed} failed, ${data.priceChanges} price changes`,
      });
    },
    onError: (error: Error) => {
      toast.error('Sync failed', {
        description: error.message,
      });
    },
  });

  const syncAllFilaments = (limit?: number) => {
    syncMutation.mutate({
      syncType: 'all',
      productType: 'filament',
      triggeredBy: 'admin',
      limit: limit || 50,
    });
  };

  const syncAllPrinters = (limit?: number) => {
    syncMutation.mutate({
      syncType: 'all',
      productType: 'printer',
      triggeredBy: 'admin',
      limit: limit || 50,
    });
  };

  const syncBrand = (brandSlug: string, productType: 'filament' | 'printer', limit?: number) => {
    syncMutation.mutate({
      syncType: 'brand',
      productType,
      brandSlug,
      triggeredBy: 'admin',
      limit: limit || 100,
    });
  };

  const syncSingleProduct = (productId: string, productType: 'filament' | 'printer') => {
    syncMutation.mutate({
      syncType: 'single',
      productType,
      targetId: productId,
      triggeredBy: 'admin',
    });
  };

  return {
    syncAllFilaments,
    syncAllPrinters,
    syncBrand,
    syncSingleProduct,
    isSyncing: syncMutation.isPending,
    lastSyncTime,
  };
}
