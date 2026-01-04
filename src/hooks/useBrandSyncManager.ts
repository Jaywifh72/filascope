import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  BRAND_SPECIFIC_FUNCTIONS,
  SPECIAL_BRANDS,
  normalizeSlugForFunction,
  hasBrandSpecificFunction as checkHasBrandSpecificFunction,
  detectSyncType,
} from "@/lib/brand-sync-config";

export interface SyncOptions {
  brandSlug: string;
  brandName: string;
  dryRun: boolean;
  cleanSlate: boolean;
  materialFilter?: string;
  limit?: number;
  regions?: string[];
}

export interface SyncProgress {
  stage: string;
  current: number;
  total: number;
  message?: string;
  productsProcessed?: number;
  variantsFound?: number;
  created?: number;
  updated?: number;
  errors?: number;
}

export interface SyncProductResult {
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

export interface FieldCoverageResult {
  images: { count: number; percent: number };
  prices: { count: number; percent: number };
  tds: { count: number; percent: number };
  colors: { count: number; percent: number };
  mpn: { count: number; percent: number };
  specifications: { count: number; percent: number };
}

export interface SyncResult {
  success: boolean;
  jobId?: string;
  message?: string;
  timedOut?: boolean;
  summary?: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    total?: number;
    totalDiscovered?: number;
  };
  products?: SyncProductResult[];
  fieldCoverage?: FieldCoverageResult;
  duration_ms?: number;
}

export function useBrandSyncManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSyncLogId, setActiveSyncLogId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // Poll for sync progress from brand_sync_logs
  const startPolling = useCallback((syncLogId: string, brandSlug: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    const pollProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('brand_sync_logs')
          .select('*')
          .eq('id', syncLogId)
          .single();

        if (error) {
          console.error('[useBrandSyncManager] Poll error:', error);
          return;
        }

        if (!data) return;

        // Parse progress from products_processed JSON field
        const progressData = data.products_processed as unknown as SyncProgress | null;
        
        if (progressData && typeof progressData === 'object') {
          setProgress({
            stage: progressData.stage || 'Processing',
            current: progressData.current || 0,
            total: progressData.total || 100,
            message: progressData.message,
            productsProcessed: progressData.productsProcessed,
            variantsFound: progressData.variantsFound,
            created: progressData.created,
            updated: progressData.updated,
            errors: progressData.errors,
          });
        }

        // Check if sync completed
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'partial') {
          // Stop polling
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          
          setIsLoading(false);
          setActiveSyncLogId(null);
          
          const syncResult: SyncResult = {
            success: data.status === 'completed',
            jobId: data.id,
            message: data.status === 'completed' ? 'Sync completed successfully' : 'Sync failed',
            summary: {
              created: data.products_created || 0,
              updated: data.products_updated || 0,
              skipped: 0,
              errors: data.products_failed || 0,
              total: data.products_discovered || 0,
              totalDiscovered: data.products_discovered || 0,
            },
            duration_ms: (data.duration_seconds || 0) * 1000,
          };

          setResult(syncResult);
          setProgress({ stage: 'Complete', current: 100, total: 100 });

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['brand-data-quality', brandSlug] });
          queryClient.invalidateQueries({ queryKey: ['all-brands-data-quality'] });
          queryClient.invalidateQueries({ queryKey: ['automated-brands'] });

          toast({
            title: data.status === 'completed' ? "Sync Complete" : "Sync Failed",
            description: `Created: ${data.products_created || 0}, Updated: ${data.products_updated || 0}, Errors: ${data.products_failed || 0}`,
            variant: data.status === 'completed' ? 'default' : 'destructive',
          });
        }
      } catch (err) {
        console.error('[useBrandSyncManager] Poll error:', err);
      }
    };

    // Poll every 1.5 seconds
    pollingRef.current = setInterval(pollProgress, 1500);
    
    // Also poll immediately
    pollProgress();
  }, [queryClient, toast]);

  const localDetectSyncFunction = useCallback((brandSlug: string): 'specific' | 'special' | 'generic' => {
    return detectSyncType(brandSlug);
  }, []);

  const localHasBrandSpecificFunction = useCallback((brandSlug: string): boolean => {
    return checkHasBrandSpecificFunction(brandSlug);
  }, []);

  const deleteAllProducts = useCallback(async (brandName: string): Promise<{ success: boolean; deleted: number }> => {
    setIsDeleting(true);
    setError(null);
    
    try {
      // Count products first
      const { count: beforeCount } = await supabase
        .from('filaments')
        .select('*', { count: 'exact', head: true })
        .ilike('vendor', brandName);

      // Delete all products for this brand
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', brandName);

      if (deleteError) throw deleteError;

      toast({
        title: "Products Deleted",
        description: `Deleted ${beforeCount || 0} products for ${brandName}`,
      });

      return { success: true, deleted: beforeCount || 0 };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete products';
      setError(message);
      toast({
        title: "Delete Failed",
        description: message,
        variant: "destructive",
      });
      return { success: false, deleted: 0 };
    } finally {
      setIsDeleting(false);
    }
  }, [toast]);

  const executeSync = useCallback(async (options: SyncOptions): Promise<SyncResult> => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress({ stage: 'Starting sync...', current: 0, total: 100 });

    try {
      // Clean slate is handled by the edge function now, don't delete here
      // This prevents the double-delete race condition
      
      setProgress({ stage: 'Invoking sync function', current: 5, total: 100 });

      const syncType = localDetectSyncFunction(options.brandSlug);
      let data: any;
      let fnError: any;

      if (syncType === 'special') {
        // Special handling for Elegoo - they have their own UI
        throw new Error(`${options.brandSlug} has a dedicated sync tab. Please use the Elegoo tab instead.`);
      }

      if (syncType === 'specific') {
        // Brand-specific high-fidelity sync function
        const functionSlug = normalizeSlugForFunction(options.brandSlug);
        const functionName = `sync-${functionSlug}-products`;
        setProgress({ stage: `Calling ${functionName}`, current: 10, total: 100 });
        
        const response = await supabase.functions.invoke(functionName, {
          body: {
            dryRun: options.dryRun,
            cleanSlate: options.cleanSlate,
            materialFilter: options.materialFilter,
            limit: options.limit,
            regions: options.regions,
          },
        });
        data = response.data;
        fnError = response.error;
      } else {
        // Generic fallback
        setProgress({ stage: 'Calling sync-brand-products', current: 10, total: 100 });
        
        const response = await supabase.functions.invoke('sync-brand-products', {
          body: {
            brandSlug: options.brandSlug,
            dryRun: options.dryRun,
            cleanSlate: options.cleanSlate,
            materialFilter: options.materialFilter,
            regions: options.regions,
            limit: options.limit,
          },
        });
        data = response.data;
        fnError = response.error;
      }

      if (fnError) throw fnError;

      // For background sync functions, start polling for progress
      if (data?.syncLogId) {
        setActiveSyncLogId(data.syncLogId);
        setProgress({ stage: 'Sync started - monitoring progress...', current: 15, total: 100 });
        startPolling(data.syncLogId, options.brandSlug);
        
        // Return immediately - the polling will update state
        return {
          success: true,
          jobId: data.syncLogId,
          message: 'Sync started in background',
        };
      }

      // For synchronous syncs (like dry run or generic), handle normally
      setProgress({ stage: 'Complete', current: 100, total: 100 });

      const syncResult: SyncResult = {
        success: data?.success ?? true,
        jobId: data?.jobId,
        message: data?.message,
        summary: data?.summary ? {
          created: data.summary.created ?? 0,
          updated: data.summary.updated ?? 0,
          skipped: data.summary.skipped ?? 0,
          errors: data.summary.errors ?? 0,
          total: data.summary.total ?? data.summary.totalDiscovered,
          totalDiscovered: data.summary.totalDiscovered ?? data.summary.total,
        } : undefined,
        products: data?.products,
        fieldCoverage: data?.fieldCoverage,
        duration_ms: data?.duration_ms,
      };

      setResult(syncResult);
      setIsLoading(false);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['brand-data-quality', options.brandSlug] });
      queryClient.invalidateQueries({ queryKey: ['all-brands-data-quality'] });
      queryClient.invalidateQueries({ queryKey: ['automated-brands'] });

      toast({
        title: options.dryRun ? "Dry Run Complete" : "Sync Complete",
        description: syncResult.summary 
          ? `Created: ${syncResult.summary.created}, Updated: ${syncResult.summary.updated}, Errors: ${syncResult.summary.errors}`
          : syncResult.message || 'Sync completed successfully',
      });

      return syncResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      const isTimeout = message.toLowerCase().includes('timeout') || 
                        message.includes('Failed to send a request');
      
      setError(message);
      setProgress(null);
      setIsLoading(false);
      
      if (isTimeout) {
        const timedOutResult: SyncResult = {
          success: false,
          timedOut: true,
          message: 'The sync request timed out on the client side, but may have completed in the background. Run Post Sync Check to verify.',
        };
        setResult(timedOutResult);
        
        toast({
          title: "Request Timed Out",
          description: "The sync may have completed in the background. Run Post Sync Check to verify.",
        });
        
        return timedOutResult;
      }
      
      toast({
        title: "Sync Failed",
        description: message,
        variant: "destructive",
      });

      return { success: false, message };
    }
  }, [localDetectSyncFunction, startPolling, queryClient, toast]);

  const reset = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsLoading(false);
    setIsDeleting(false);
    setProgress(null);
    setResult(null);
    setError(null);
    setActiveSyncLogId(null);
  }, []);

  return {
    executeSync,
    deleteAllProducts,
    detectSyncFunction: localDetectSyncFunction,
    hasBrandSpecificFunction: localHasBrandSpecificFunction,
    isLoading,
    isDeleting,
    progress,
    result,
    error,
    reset,
    activeSyncLogId,
  };
}
