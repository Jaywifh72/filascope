import { useState, useCallback } from "react";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    setProgress({ stage: 'Starting', current: 0, total: 100 });

    try {
      // Clean slate: delete existing products first
      if (options.cleanSlate) {
        setProgress({ stage: 'Deleting existing products', current: 5, total: 100 });
        const deleteResult = await deleteAllProducts(options.brandName);
        if (!deleteResult.success) {
          throw new Error('Failed to delete existing products');
        }
      }

      setProgress({ stage: 'Invoking sync function', current: 10, total: 100 });

      const syncType = localDetectSyncFunction(options.brandSlug);
      let data: any;
      let fnError: any;

      if (syncType === 'special') {
        // Special handling for Bambu Lab and Elegoo - they have their own UI
        throw new Error(`${options.brandSlug} has a dedicated sync tab. Please use the ${options.brandSlug === 'bambu-lab' ? 'Bambu Lab' : 'Elegoo'} tab instead.`);
      }

      if (syncType === 'specific') {
        // Brand-specific high-fidelity sync function
        const functionSlug = normalizeSlugForFunction(options.brandSlug);
        const functionName = `sync-${functionSlug}-products`;
        setProgress({ stage: `Calling ${functionName}`, current: 15, total: 100 });
        
        const response = await supabase.functions.invoke(functionName, {
          body: {
            dryRun: options.dryRun,
            materialFilter: options.materialFilter,
            limit: options.limit,
            regions: options.regions,
          },
        });
        data = response.data;
        fnError = response.error;
      } else {
        // Generic fallback
        setProgress({ stage: 'Calling sync-brand-products', current: 15, total: 100 });
        
        const response = await supabase.functions.invoke('sync-brand-products', {
          body: {
            brandSlug: options.brandSlug,
            dryRun: options.dryRun,
            materialFilter: options.materialFilter,
            regions: options.regions,
            limit: options.limit,
          },
        });
        data = response.data;
        fnError = response.error;
      }

      if (fnError) throw fnError;

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
    } finally {
      setIsLoading(false);
    }
  }, [localDetectSyncFunction, deleteAllProducts, queryClient, toast]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsDeleting(false);
    setProgress(null);
    setResult(null);
    setError(null);
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
  };
}
