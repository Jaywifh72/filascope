import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBrandSync, SyncOptions, SyncResult } from './useBrandSync';
import { useStartBambuScrapeJob, useBambuScrapeJob } from './useBambuScrapeJob';
import { useElegooSync } from './useElegooSync';
import { useActiveElegooSyncJob, ElegooSyncJob } from './useActiveElegooSyncJob';
import {
  SPECIAL_BRANDS,
  hasBrandSpecificFunction,
  getEdgeFunctionName,
} from '@/lib/brand-sync-config';

export type BrandType = 'bambu-lab' | 'elegoo' | 'generic';

export interface UnifiedSyncOptions {
  brandSlug: string;
  dryRun: boolean;
  materialFilter?: string;
  regions?: string[];
  materials?: string[]; // For Bambu Lab material selection
  limit?: number;
}

export interface UnifiedSyncProgress {
  stage: string;
  currentProduct?: string;
  currentRegion?: string;
  productsProcessed: number;
  totalProducts: number;
  regionsProcessed?: number;
  totalRegions?: number;
  created?: number;
  updated?: number;
  errors?: number;
  isRealProgress?: boolean;
}

export interface SyncProductResultData {
  productId: string;
  title: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  reason?: string;
  fields: {
    image: boolean;
    price: boolean;
    tds: boolean;
    colorHex: boolean;
    mpn: boolean;
    specifications: boolean;
  };
  price?: number;
  compareAtPrice?: number;
}

export interface FieldCoverageData {
  images: { count: number; percent: number };
  prices: { count: number; percent: number };
  tds: { count: number; percent: number };
  colors: { count: number; percent: number };
  mpn: { count: number; percent: number };
  specifications: { count: number; percent: number };
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
    totalDiscovered?: number;
  };
  products?: SyncProductResultData[];
  fieldCoverage?: FieldCoverageData;
  duration_ms?: number;
  message?: string;
}

// Determine brand type for specialized UI handling
function getBrandType(brandSlug: string): BrandType {
  if (SPECIAL_BRANDS.includes(brandSlug as any)) {
    return brandSlug as BrandType;
  }
  return 'generic';
}

export function useBrandSyncRouter(brandSlug: string) {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [brandType, setBrandType] = useState<BrandType>(() => getBrandType(brandSlug));
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generic brand progress state (from polling brand_sync_logs)
  const [genericProgress, setGenericProgress] = useState<UnifiedSyncProgress | null>(null);
  const [genericIsLoading, setGenericIsLoading] = useState(false);
  const [genericSyncCompleted, setGenericSyncCompleted] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Generic brand sync
  const genericSync = useBrandSync();

  // Bambu Lab sync
  const bambuSync = useStartBambuScrapeJob();
  const bambuJob = useBambuScrapeJob(brandType === 'bambu-lab' ? currentJobId : null);

  // Elegoo sync
  const elegooSync = useElegooSync();
  const { activeJob: elegooJob } = useActiveElegooSyncJob();

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // Poll for generic brand sync progress from brand_sync_logs
  const startPolling = useCallback((syncLogId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    setGenericIsLoading(true);
    setGenericSyncCompleted(false);

    const pollProgress = async () => {
      try {
        const { data, error: pollError } = await supabase
          .from('brand_sync_logs')
          .select('*')
          .eq('id', syncLogId)
          .single();

        if (pollError) {
          console.error('[useBrandSyncRouter] Poll error:', pollError);
          return;
        }

        if (!data) return;

        // Parse progress from products_processed JSON field
        const progressData = data.products_processed as unknown as {
          stage?: string;
          current?: number;
          total?: number;
          message?: string;
          productsProcessed?: number;
          variantsFound?: number;
          created?: number;
          updated?: number;
          errors?: number;
        } | null;
        
        if (progressData && typeof progressData === 'object') {
          // Only mark as real progress if we have actual product counts
          const hasRealData = progressData.productsProcessed !== undefined || 
                              progressData.created !== undefined ||
                              progressData.updated !== undefined ||
                              (progressData.current !== undefined && progressData.current > 0);
          
          setGenericProgress({
            stage: progressData.stage || 'Processing',
            productsProcessed: progressData.productsProcessed ?? progressData.current ?? 0,
            totalProducts: progressData.variantsFound ?? progressData.total ?? 0,
            created: progressData.created,
            updated: progressData.updated,
            errors: progressData.errors,
            isRealProgress: hasRealData,
          });
        }

        // Check if sync completed
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'partial') {
          // Stop polling
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          
          setGenericIsLoading(false);
          setGenericSyncCompleted(true);
          
          // Set final progress
          setGenericProgress({
            stage: data.status === 'completed' ? 'Complete' : 'Failed',
            productsProcessed: data.products_created + data.products_updated || 0,
            totalProducts: data.products_discovered || 0,
            created: data.products_created || 0,
            updated: data.products_updated || 0,
            errors: data.products_failed || 0,
            isRealProgress: true,
          });
        }
      } catch (err) {
        console.error('[useBrandSyncRouter] Poll error:', err);
      }
    };

    // Poll every 1.5 seconds
    pollingRef.current = setInterval(pollProgress, 1500);
    
    // Also poll immediately
    pollProgress();
  }, []);

  // Unified sync function
  const sync = useCallback(async (options: UnifiedSyncOptions): Promise<UnifiedSyncResult> => {
    const type = getBrandType(options.brandSlug);
    setBrandType(type);
    setError(null);
    setIsStarting(true);
    setGenericProgress(null);
    setGenericSyncCompleted(false);

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
          // Check if brand has a dedicated sync function
          if (hasBrandSpecificFunction(options.brandSlug)) {
            const functionName = getEdgeFunctionName(options.brandSlug);
            
            const { data, error: fnError } = await supabase.functions.invoke(functionName, {
              body: {
                dryRun: options.dryRun,
                materialFilter: options.materialFilter,
                limit: options.limit,
                regions: options.regions,
              },
            });
            
            if (fnError) throw fnError;
            
            // If this is a background sync, start polling
            if (data?.syncLogId) {
              setCurrentJobId(data.syncLogId);
              startPolling(data.syncLogId);
              return {
                success: true,
                jobId: data.syncLogId,
                brandType: 'generic',
                message: 'Sync started in background',
              };
            }
            
            const total = data?.summary?.total ?? data?.summary?.totalDiscovered ?? 0;
            
            // Set final progress for synchronous syncs
            if (data?.summary) {
              setGenericProgress({
                stage: 'Complete',
                productsProcessed: (data.summary.created ?? 0) + (data.summary.updated ?? 0),
                totalProducts: total,
                created: data.summary.created ?? 0,
                updated: data.summary.updated ?? 0,
                errors: data.summary.errors ?? 0,
                isRealProgress: true,
              });
            }
            
            return {
              success: data?.success ?? true,
              jobId: data?.jobId || null,
              brandType: 'generic',
              summary: data?.summary ? {
                created: data.summary.created ?? 0,
                updated: data.summary.updated ?? 0,
                skipped: data.summary.skipped ?? 0,
                errors: data.summary.errors ?? 0,
                total: total,
                totalDiscovered: data.summary.totalDiscovered ?? total,
              } : undefined,
              products: data?.products,
              fieldCoverage: data?.fieldCoverage,
              duration_ms: data?.duration_ms,
              message: data?.message,
            };
          }

          // Generic fallback for brands without dedicated functions
          const syncOptions: SyncOptions = {
            brandSlug: options.brandSlug,
            dryRun: options.dryRun,
            materialFilter: options.materialFilter,
            regions: options.regions,
            tasks: ['products'],
          };
          const result = await genericSync.syncBrand(syncOptions);
          setCurrentJobId(result.jobId || null);
          const total = result.summary?.total ?? result.summary?.totalDiscovered ?? 0;
          return {
            success: result.success,
            jobId: result.jobId || null,
            brandType: 'generic',
            summary: result.summary ? {
              created: result.summary.created,
              updated: result.summary.updated,
              skipped: result.summary.skipped,
              errors: result.summary.errors,
              total: total,
              totalDiscovered: result.summary.totalDiscovered ?? total,
            } : undefined,
            products: result.products,
            fieldCoverage: result.fieldCoverage,
            duration_ms: result.duration_ms,
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
  }, [bambuSync, elegooSync, genericSync, startPolling]);

  // Derive loading/progress state based on brand type
  const getLoadingState = useCallback(() => {
    if (isStarting) return true;
    
    switch (brandType) {
      case 'bambu-lab':
        return bambuJob.isRunning || bambuJob.isPending;
      case 'elegoo':
        return elegooSync.isLoading || (elegooJob?.status === 'running');
      default:
        return genericIsLoading || genericSync.isLoading;
    }
  }, [brandType, isStarting, bambuJob, elegooJob, elegooSync.isLoading, genericSync.isLoading, genericIsLoading]);

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
          isRealProgress: true,
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
          isRealProgress: true,
        };

      default:
        // Return generic progress from polling
        return genericProgress;
    }
  }, [brandType, bambuJob.job, elegooJob, genericProgress]);

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
        // Calculate from generic progress
        if (!genericProgress || !genericProgress.totalProducts) return 0;
        return Math.round((genericProgress.productsProcessed / genericProgress.totalProducts) * 100);
    }
  }, [brandType, bambuJob.progressPercent, elegooJob, genericProgress]);

  const reset = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setCurrentJobId(null);
    setError(null);
    setIsStarting(false);
    setGenericProgress(null);
    setGenericIsLoading(false);
    setGenericSyncCompleted(false);
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
