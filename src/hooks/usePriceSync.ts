import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RegionCode } from '@/types/regional';

interface SyncRequest {
  syncType: 'all' | 'brand' | 'single';
  productType: 'filament' | 'printer';
  targetId?: string;
  brandSlug?: string;
  triggeredBy?: 'admin' | 'scheduled' | 'api';
  dryRun?: boolean;
  limit?: number;
  // Regional sync options
  regionCodes?: string[];
  skipRegions?: string[];
  useRegionalUrls?: boolean;
}

interface RegionSyncStats {
  attempted: number;
  successful: number;
  failed: number;
  priceChanges: number;
}

interface SyncResponse {
  success: boolean;
  syncRunId: string;
  syncType: string;
  productType: string;
  dryRun: boolean;
  total: number;
  totalProducts?: number;
  totalRegionalUrls?: number;
  successful: number;
  failed: number;
  skipped: number;
  priceChanges: number;
  duration_ms: number;
  regionStats?: Record<string, RegionSyncStats>;
  errors?: Array<{ productId: string; regionCode?: string; error: string }>;
}

export interface SyncStatus {
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  productType: 'filament' | 'printer';
  syncType: 'all' | 'brand' | 'single';
  brandSlug?: string;
  regionCodes?: RegionCode[];
  result?: SyncResponse;
  error?: string;
}

export interface SyncOptions {
  regions?: RegionCode[] | null;  // null = all regions
  limit?: number;
  dryRun?: boolean;
}

// Generate a unique key for tracking syncs
function getSyncKey(
  productType: string,
  syncType: string,
  targetId?: string,
  brandSlug?: string,
  regionCodes?: string[]
): string {
  const regionSuffix = regionCodes?.length ? `-${regionCodes.join(',')}` : '';
  if (syncType === 'single' && targetId) {
    return `${productType}-single-${targetId}${regionSuffix}`;
  }
  if (syncType === 'brand' && brandSlug) {
    return `${productType}-brand-${brandSlug}${regionSuffix}`;
  }
  return `${productType}-${syncType}${regionSuffix}`;
}

export function usePriceSync() {
  const queryClient = useQueryClient();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [activeSyncs, setActiveSyncs] = useState<Map<string, SyncStatus>>(new Map());

  // Subscribe to realtime updates for filaments, printers, and regional prices
  useEffect(() => {
    const filamentsChannel = supabase
      .channel('filaments-sync-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'filaments',
        },
        () => {
          // Invalidate queries when filaments are updated
          queryClient.invalidateQueries({ queryKey: ['admin-filaments'] });
          queryClient.invalidateQueries({ queryKey: ['filaments'] });
        }
      )
      .subscribe();

    const printersChannel = supabase
      .channel('printers-sync-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'printers',
        },
        () => {
          // Invalidate queries when printers are updated
          queryClient.invalidateQueries({ queryKey: ['admin-printers'] });
          queryClient.invalidateQueries({ queryKey: ['printers'] });
        }
      )
      .subscribe();

    // Subscribe to regional price updates
    const regionalPricesChannel = supabase
      .channel('regional-price-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_regional_prices',
        },
        () => {
          // Invalidate regional price queries
          queryClient.invalidateQueries({ queryKey: ['product-regional-prices'] });
          queryClient.invalidateQueries({ queryKey: ['admin-filaments'] });
          queryClient.invalidateQueries({ queryKey: ['admin-printers'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(filamentsChannel);
      supabase.removeChannel(printersChannel);
      supabase.removeChannel(regionalPricesChannel);
    };
  }, [queryClient]);

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
    onMutate: (variables) => {
      const syncKey = getSyncKey(
        variables.productType,
        variables.syncType,
        variables.targetId,
        variables.brandSlug,
        variables.regionCodes
      );
      
      setActiveSyncs((prev) => {
        const next = new Map(prev);
        next.set(syncKey, {
          status: 'running',
          startedAt: new Date(),
          productType: variables.productType,
          syncType: variables.syncType,
          brandSlug: variables.brandSlug,
          regionCodes: variables.regionCodes as RegionCode[],
        });
        return next;
      });

      // Show starting toast
      const itemCount = variables.syncType === 'single' ? '1 item' : 
                       variables.syncType === 'brand' ? `${variables.brandSlug} products` :
                       `all ${variables.productType}s`;
      toast.info(`Starting sync for ${itemCount}...`);
    },
    onSuccess: (data, variables) => {
      setLastSyncTime(new Date());
      
      const syncKey = getSyncKey(
        variables.productType,
        variables.syncType,
        variables.targetId,
        variables.brandSlug,
        variables.regionCodes
      );
      
      setActiveSyncs((prev) => {
        const next = new Map(prev);
        next.set(syncKey, {
          status: 'completed',
          startedAt: prev.get(syncKey)?.startedAt || new Date(),
          completedAt: new Date(),
          productType: variables.productType,
          syncType: variables.syncType,
          brandSlug: variables.brandSlug,
          regionCodes: variables.regionCodes as RegionCode[],
          result: data,
        });
        // Remove from active syncs after a short delay
        setTimeout(() => {
          setActiveSyncs((current) => {
            const updated = new Map(current);
            updated.delete(syncKey);
            return updated;
          });
        }, 2000);
        return next;
      });
      
      // Invalidate relevant queries
      if (variables.productType === 'filament') {
        queryClient.invalidateQueries({ queryKey: ['admin-filaments'] });
        queryClient.invalidateQueries({ queryKey: ['filaments'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['admin-printers'] });
        queryClient.invalidateQueries({ queryKey: ['printers'] });
      }
      
      // Invalidate sync logs and regional prices
      queryClient.invalidateQueries({ queryKey: ['brand-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['product-regional-prices'] });
      queryClient.invalidateQueries({ queryKey: ['running-syncs'] });

      const duration = (data.duration_ms / 1000).toFixed(1);
      toast.success(`Sync completed in ${duration}s`, {
        description: `${data.successful} updated, ${data.failed} failed, ${data.priceChanges} price changes`,
        action: {
          label: 'View Details',
          onClick: () => {
            // Navigate to sync status tab
            window.history.pushState({}, '', '/admin/inventory?tab=sync');
            window.dispatchEvent(new PopStateEvent('popstate'));
          },
        },
      });
    },
    onError: (error: Error, variables) => {
      const syncKey = getSyncKey(
        variables.productType,
        variables.syncType,
        variables.targetId,
        variables.brandSlug,
        variables.regionCodes
      );
      
      setActiveSyncs((prev) => {
        const next = new Map(prev);
        next.set(syncKey, {
          status: 'failed',
          startedAt: prev.get(syncKey)?.startedAt || new Date(),
          completedAt: new Date(),
          productType: variables.productType,
          syncType: variables.syncType,
          brandSlug: variables.brandSlug,
          regionCodes: variables.regionCodes as RegionCode[],
          error: error.message,
        });
        // Remove from active syncs after a delay
        setTimeout(() => {
          setActiveSyncs((current) => {
            const updated = new Map(current);
            updated.delete(syncKey);
            return updated;
          });
        }, 3000);
        return next;
      });
      
      toast.error('Sync failed', {
        description: error.message,
      });
    },
  });

  // Main sync methods with regional options
  const syncAll = useCallback((productType: 'filament' | 'printer', options?: SyncOptions) => {
    syncMutation.mutate({
      syncType: 'all',
      productType,
      triggeredBy: 'admin',
      limit: options?.limit || 50,
      regionCodes: options?.regions || undefined,
      useRegionalUrls: options?.regions ? true : undefined,
      dryRun: options?.dryRun,
    });
  }, [syncMutation]);

  const syncAllFilaments = useCallback((options?: SyncOptions) => {
    syncAll('filament', options);
  }, [syncAll]);

  const syncAllPrinters = useCallback((options?: SyncOptions) => {
    syncAll('printer', options);
  }, [syncAll]);

  const syncBrand = useCallback((
    brandSlug: string,
    productType: 'filament' | 'printer',
    options?: SyncOptions
  ) => {
    syncMutation.mutate({
      syncType: 'brand',
      productType,
      brandSlug,
      triggeredBy: 'admin',
      limit: options?.limit || 100,
      regionCodes: options?.regions || undefined,
      useRegionalUrls: options?.regions ? true : undefined,
      dryRun: options?.dryRun,
    });
  }, [syncMutation]);

  const syncSingle = useCallback((productId: string, productType: 'filament' | 'printer', regionCodes?: string[]) => {
    syncMutation.mutate({
      syncType: 'single',
      productType,
      targetId: productId,
      triggeredBy: 'admin',
      regionCodes,
      useRegionalUrls: regionCodes ? true : undefined,
    });
  }, [syncMutation]);

  // Helper for syncing a single region
  const syncRegion = useCallback((productId: string, productType: 'filament' | 'printer', regionCode: string) => {
    syncMutation.mutate({
      syncType: 'single',
      productType,
      targetId: productId,
      triggeredBy: 'admin',
      regionCodes: [regionCode],
      useRegionalUrls: true,
    });
  }, [syncMutation]);

  // Helper to check if a specific item is syncing
  const isItemSyncing = useCallback((productId: string): boolean => {
    const singleKey = `filament-single-${productId}`;
    const singleKeyPrinter = `printer-single-${productId}`;
    return activeSyncs.has(singleKey) || activeSyncs.has(singleKeyPrinter);
  }, [activeSyncs]);

  // Helper to check if a brand is syncing
  const isBrandSyncing = useCallback((brandSlug: string, productType: 'filament' | 'printer'): boolean => {
    const brandKey = `${productType}-brand-${brandSlug}`;
    return activeSyncs.has(brandKey);
  }, [activeSyncs]);

  // Helper to get all syncing product IDs
  const getSyncingIds = useCallback((): string[] => {
    const ids: string[] = [];
    activeSyncs.forEach((status, key) => {
      if (key.includes('-single-') && status.status === 'running') {
        const productId = key.split('-single-')[1];
        if (productId) ids.push(productId);
      }
    });
    return ids;
  }, [activeSyncs]);

  // Helper to check if a specific region is syncing
  const isRegionSyncing = useCallback((productId: string, regionCode: string): boolean => {
    const regionKey = `${productId}-region-${regionCode}`;
    return activeSyncs.has(regionKey);
  }, [activeSyncs]);

  return {
    syncAll,
    syncAllFilaments,
    syncAllPrinters,
    syncBrand,
    syncSingle,
    syncRegion,
    activeSyncs,
    isSyncing: syncMutation.isPending || activeSyncs.size > 0,
    isItemSyncing,
    isBrandSyncing,
    isRegionSyncing,
    getSyncingIds,
    lastSyncTime,
  };
}
