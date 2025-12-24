import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductFields {
  tds: boolean;
  image: boolean;
  price: boolean;
  salePrice: boolean;
  url: boolean;
  msrp: boolean;
}

type ProductType = '3D Printer' | 'Filament' | 'Accessory' | 'Unknown';

interface ElegooSyncResult {
  success: boolean;
  dryRun: boolean;
  jobId: string | null;
  summary: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    total: number;
    filtered?: number;
  };
  products: {
    title: string;
    action: 'created' | 'updated' | 'skipped' | 'error' | 'filtered';
    reason?: string;
    productType?: ProductType;
    fields: ProductFields;
    currentPrice?: number;
    msrp?: number;
  }[];
  regionsSynced?: string[];
}

export type { ProductType };

interface SyncProgress {
  currentRegion: string;
  completedRegions: string[];
  totalRegions: number;
}

export type { ElegooSyncResult, ProductFields, SyncProgress };

export function useElegooSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ElegooSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Start sync using orchestrator (persists to DB for live tracking)
  const syncProducts = useCallback(async (dryRun: boolean, materialFilter?: string, regions?: string[], excludedCatalogIds?: string[]) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);
    setCurrentJobId(null);

    // Default to ALL regions for comprehensive sync
    const regionsToSync = regions || ['US', 'CA', 'EU', 'UK', 'AU', 'JP'];

    try {
      // Use the orchestrator which tracks progress in the database
      const { data, error: fnError } = await supabase.functions.invoke('sync-elegoo-orchestrator', {
        body: {
          mode: 'start',
          regions: regionsToSync,
          dryRun,
          materialFilter,
          excludedCatalogIds,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to start sync');
      }

      // Store the job ID for tracking
      setCurrentJobId(data.jobId);
      
      console.log(`[useElegooSync] Started orchestrated sync, jobId: ${data.jobId}`);

      // The orchestrator runs in the background - the UI will track via useActiveElegooSyncJob
      // Return immediately with partial info
      return {
        success: true,
        dryRun,
        jobId: data.jobId,
        summary: { created: 0, updated: 0, skipped: 0, errors: 0, total: 0 },
        products: [],
        regionsSynced: regionsToSync,
      } as ElegooSyncResult;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      // Don't set isLoading to false here - the job continues in background
      // The UI should track via useActiveElegooSyncJob
    }
  }, []);

  // Legacy single-region sync (direct call, no tracking)
  const syncSingleRegionDirect = useCallback(async (dryRun: boolean, materialFilter?: string, region?: string, excludedCatalogIds?: string[]) => {
    const { data, error: fnError } = await supabase.functions.invoke('sync-elegoo-products', {
      body: { dryRun, materialFilter, regions: region ? [region] : ['US'], excludedCatalogIds },
    });

    if (fnError) {
      throw new Error(fnError.message);
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data as ElegooSyncResult;
  }, []);

  const fetchCatalog = async (materialFilter?: string, page = 1, catalogId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-elegoo-catalog', {
        body: { materialFilter, page, pageSize: 50, catalogId },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const discoverCatalogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('list-impact-catalogs', {
        body: {},
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setProgress(null);
    setCurrentJobId(null);
    setIsLoading(false);
  };

  return {
    syncProducts,
    syncSingleRegionDirect,
    fetchCatalog,
    discoverCatalogs,
    isLoading,
    result,
    error,
    reset,
    progress,
    currentJobId,
  };
}
