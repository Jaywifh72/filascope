import { useState, useCallback } from 'react';
import { useBrandSync, SyncOptions, SyncResult } from './useBrandSync';
import { useStartBambuScrapeJob, useBambuScrapeJob } from './useBambuScrapeJob';
import { useElegooSync } from './useElegooSync';
import { useActiveElegooSyncJob, ElegooSyncJob } from './useActiveElegooSyncJob';

export type BrandType = 'bambu-lab' | 'elegoo' | 'generic';

export interface UnifiedSyncOptions {
  brandSlug: string;
  dryRun: boolean;
  materialFilter?: string;
  regions?: string[];
  materials?: string[]; // For Bambu Lab material selection
}

export interface UnifiedSyncProgress {
  stage: string;
  currentProduct?: string;
  currentRegion?: string;
  productsProcessed: number;
  totalProducts: number;
  regionsProcessed?: number;
  totalRegions?: number;
}

export interface UnifiedSyncResult {
  success: boolean;
  jobId: string | null;
  brandType: BrandType;
  summary?: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    total: number;
  };
  message?: string;
}

// Brands that use specialized sync backends
const SPECIALIZED_BRANDS: Record<string, BrandType> = {
  'bambu-lab': 'bambu-lab',
  'elegoo': 'elegoo',
};

export function useBrandSyncRouter(brandSlug: string) {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [brandType, setBrandType] = useState<BrandType>(() => 
    SPECIALIZED_BRANDS[brandSlug] || 'generic'
  );
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generic brand sync
  const genericSync = useBrandSync();

  // Bambu Lab sync
  const bambuSync = useStartBambuScrapeJob();
  const bambuJob = useBambuScrapeJob(brandType === 'bambu-lab' ? currentJobId : null);

  // Elegoo sync
  const elegooSync = useElegooSync();
  const { activeJob: elegooJob } = useActiveElegooSyncJob();

  // Unified sync function
  const sync = useCallback(async (options: UnifiedSyncOptions): Promise<UnifiedSyncResult> => {
    const type = SPECIALIZED_BRANDS[options.brandSlug] || 'generic';
    setBrandType(type);
    setError(null);
    setIsStarting(true);

    try {
      switch (type) {
        case 'bambu-lab': {
          // Bambu Lab uses materials array
          const materials = options.materials || ['PLA'];
          const jobId = await bambuSync.startJob(materials, options.dryRun);
          setCurrentJobId(jobId);
          return {
            success: !!jobId,
            jobId,
            brandType: 'bambu-lab',
            message: jobId ? `Started Bambu Lab sync for ${materials.join(', ')}` : 'Failed to start sync',
          };
        }

        case 'elegoo': {
          const result = await elegooSync.syncProducts(
            options.dryRun,
            options.materialFilter,
            options.regions
          );
          setCurrentJobId(result.jobId);
          return {
            success: result.success,
            jobId: result.jobId,
            brandType: 'elegoo',
            summary: result.summary,
          };
        }

        default: {
          // Generic brand sync
          const syncOptions: SyncOptions = {
            brandSlug: options.brandSlug,
            dryRun: options.dryRun,
            materialFilter: options.materialFilter,
            regions: options.regions,
            tasks: ['products'],
          };
          const result = await genericSync.syncBrand(syncOptions);
          setCurrentJobId(result.jobId || null);
          return {
            success: result.success,
            jobId: result.jobId || null,
            brandType: 'generic',
            summary: result.summary,
            message: result.message,
          };
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
      return {
        success: false,
        jobId: null,
        brandType: type,
        message,
      };
    } finally {
      setIsStarting(false);
    }
  }, [bambuSync, elegooSync, genericSync]);

  // Derive loading/progress state based on brand type
  const getLoadingState = useCallback(() => {
    if (isStarting) return true;
    
    switch (brandType) {
      case 'bambu-lab':
        return bambuJob.isRunning || bambuJob.isPending;
      case 'elegoo':
        return elegooSync.isLoading || (elegooJob?.status === 'running');
      default:
        return genericSync.isLoading;
    }
  }, [brandType, isStarting, bambuJob, elegooJob, elegooSync.isLoading, genericSync.isLoading]);

  // Get progress info
  const getProgress = useCallback((): UnifiedSyncProgress | null => {
    switch (brandType) {
      case 'bambu-lab':
        if (!bambuJob.job?.progress) return null;
        return {
          stage: bambuJob.job.progress.currentMaterial || 'processing',
          currentProduct: bambuJob.job.progress.currentProduct,
          productsProcessed: bambuJob.job.progress.productsProcessed || 0,
          totalProducts: bambuJob.job.progress.totalProducts || 0,
        };

      case 'elegoo':
        if (!elegooJob?.progress) return null;
        return {
          stage: elegooJob.progress.currentRegion ? `Processing ${elegooJob.progress.currentRegion}` : 'processing',
          currentRegion: elegooJob.progress.currentRegion || undefined,
          productsProcessed: elegooJob.progress.total || 0,
          totalProducts: elegooJob.progress.total || 0,
          regionsProcessed: elegooJob.progress.regionsProcessed || 0,
          totalRegions: elegooJob.progress.totalRegions || 0,
        };

      default:
        return null; // Generic sync doesn't have detailed progress
    }
  }, [brandType, bambuJob.job, elegooJob]);

  // Get progress percentage
  const getProgressPercent = useCallback(() => {
    switch (brandType) {
      case 'bambu-lab':
        return bambuJob.progressPercent;
      case 'elegoo':
        if (!elegooJob?.progress) return 0;
        const totalRegions = elegooJob.progress.totalRegions || 1;
        const processed = elegooJob.progress.regionsProcessed || 0;
        return Math.round((processed / totalRegions) * 100);
      default:
        return 0;
    }
  }, [brandType, bambuJob.progressPercent, elegooJob]);

  const reset = useCallback(() => {
    setCurrentJobId(null);
    setError(null);
    setIsStarting(false);
    genericSync.reset();
    elegooSync.reset();
  }, [genericSync, elegooSync]);

  return {
    sync,
    isLoading: getLoadingState(),
    isStarting,
    currentJobId,
    brandType,
    error: error || bambuSync.error || elegooSync.error || genericSync.error,
    progress: getProgress(),
    progressPercent: getProgressPercent(),
    reset,
    // Expose individual job states for advanced UI
    bambuJob: brandType === 'bambu-lab' ? bambuJob : null,
    elegooJob: brandType === 'elegoo' ? elegooJob : null,
  };
}
