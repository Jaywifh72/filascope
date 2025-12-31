import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Brands with dedicated high-fidelity sync functions
const BRAND_SPECIFIC_FUNCTIONS = [
  '3dhojor', '3dxtech', 'anycubic', 'atomic', 'azurefilm', 'cc3d',
  'colorfabb', 'creality', 'duramic', 'eryone', 'esun', 'extrudr',
  'fiberlogy', 'fillamentum', 'flashforge', 'formfutura', 'fusion-filaments',
  'geeetech', 'gizmodorks', 'hatchbox', 'ic3d', 'kingroon', 'matter3d',
  'ninjatek', 'numakers', 'overture', 'paramount', 'polymaker',
  'protopasta', 'prusament', 'pushplastic', 'recreus', 'sirayatech',
  'sovol', 'spectrum', 'sunlu', 'treed', 'ultimaker', 'voxelpla',
  'yousu', 'ziro'
];

// Special brands with unique sync mechanisms
const SPECIAL_BRANDS = ['bambu-lab', 'elegoo'];

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

export interface SyncResult {
  success: boolean;
  jobId?: string;
  message?: string;
  summary?: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    total: number;
  };
  fieldCoverage?: Record<string, number | { count: number; percent: number }>;
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

  const detectSyncFunction = useCallback((brandSlug: string): 'specific' | 'special' | 'generic' => {
    if (SPECIAL_BRANDS.includes(brandSlug)) return 'special';
    if (BRAND_SPECIFIC_FUNCTIONS.includes(brandSlug)) return 'specific';
    return 'generic';
  }, []);

  const hasBrandSpecificFunction = useCallback((brandSlug: string): boolean => {
    return BRAND_SPECIFIC_FUNCTIONS.includes(brandSlug);
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

      const syncType = detectSyncFunction(options.brandSlug);
      let data: any;
      let fnError: any;

      if (syncType === 'special') {
        // Special handling for Bambu Lab and Elegoo - they have their own UI
        throw new Error(`${options.brandSlug} has a dedicated sync tab. Please use the ${options.brandSlug === 'bambu-lab' ? 'Bambu Lab' : 'Elegoo'} tab instead.`);
      }

      if (syncType === 'specific') {
        // Brand-specific high-fidelity sync function
        const functionName = `sync-${options.brandSlug}-products`;
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
        summary: data?.summary,
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
      setError(message);
      setProgress(null);
      
      toast({
        title: "Sync Failed",
        description: message,
        variant: "destructive",
      });

      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  }, [detectSyncFunction, deleteAllProducts, queryClient, toast]);

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
    detectSyncFunction,
    hasBrandSpecificFunction,
    isLoading,
    isDeleting,
    progress,
    result,
    error,
    reset,
  };
}
