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

  // Sync a single region
  const syncSingleRegion = useCallback(async (dryRun: boolean, materialFilter?: string, region?: string) => {
    const { data, error: fnError } = await supabase.functions.invoke('sync-elegoo-products', {
      body: { dryRun, materialFilter, regions: region ? [region] : ['US'] },
    });

    if (fnError) {
      throw new Error(fnError.message);
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data as ElegooSyncResult;
  }, []);

  // Sync multiple regions sequentially to avoid timeout
  const syncProducts = useCallback(async (dryRun: boolean, materialFilter?: string, regions?: string[]) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);

    const regionsToSync = regions || ['US'];
    
    // If only one region, just call directly
    if (regionsToSync.length === 1) {
      try {
        const data = await syncSingleRegion(dryRun, materialFilter, regionsToSync[0]);
        setResult(data);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
        setProgress(null);
      }
    }

    // Multiple regions: sync sequentially and aggregate results
    const aggregatedResult: ElegooSyncResult = {
      success: true,
      dryRun,
      jobId: null,
      summary: {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        total: 0,
        filtered: 0,
      },
      products: [],
      regionsSynced: [],
    };

    const completedRegions: string[] = [];

    try {
      for (const region of regionsToSync) {
        console.log(`[useElegooSync] Syncing region: ${region}`);
        setProgress({
          currentRegion: region,
          completedRegions: [...completedRegions],
          totalRegions: regionsToSync.length,
        });

        try {
          const regionResult = await syncSingleRegion(dryRun, materialFilter, region);
          
          // Aggregate results
          aggregatedResult.summary.created += regionResult.summary.created;
          aggregatedResult.summary.updated += regionResult.summary.updated;
          aggregatedResult.summary.skipped += regionResult.summary.skipped;
          aggregatedResult.summary.errors += regionResult.summary.errors;
          aggregatedResult.summary.total += regionResult.summary.total;
          aggregatedResult.summary.filtered = (aggregatedResult.summary.filtered || 0) + (regionResult.summary.filtered || 0);
          
          // Add products with region prefix to avoid duplicates in display
          aggregatedResult.products.push(...regionResult.products);
          aggregatedResult.regionsSynced?.push(region);
          
          completedRegions.push(region);
          console.log(`[useElegooSync] Completed ${region}: created=${regionResult.summary.created}, updated=${regionResult.summary.updated}`);
        } catch (regionErr) {
          console.error(`[useElegooSync] Failed to sync region ${region}:`, regionErr);
          aggregatedResult.summary.errors++;
          // Continue with other regions
        }
      }

      aggregatedResult.success = aggregatedResult.summary.errors === 0;
      setResult(aggregatedResult);
      return aggregatedResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [syncSingleRegion]);

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
  };

  return {
    syncProducts,
    fetchCatalog,
    discoverCatalogs,
    isLoading,
    result,
    error,
    reset,
    progress,
  };
}
