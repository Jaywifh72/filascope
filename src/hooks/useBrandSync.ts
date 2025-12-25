import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export type SyncTask = 'products' | 'prices' | 'images' | 'tds' | 'specifications';

export interface SyncOptions {
  brandSlug: string;
  dryRun: boolean;
  materialFilter?: string;
  regions?: string[];
  tasks?: SyncTask[];
  limit?: number;
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
}

export function useBrandSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncBrand = async (options: SyncOptions): Promise<SyncResult> => {
    setIsLoading(true);
    setError(null);
    setCurrentJobId(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('sync-brand-products', {
        body: {
          brandSlug: options.brandSlug,
          dryRun: options.dryRun,
          materialFilter: options.materialFilter,
          regions: options.regions,
          tasks: options.tasks || ['products'],
          limit: options.limit,
        },
      });

      if (fnError) throw fnError;

      if (data?.jobId) {
        setCurrentJobId(data.jobId);
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['brand-data-quality', options.brandSlug] });
      queryClient.invalidateQueries({ queryKey: ['all-brands-data-quality'] });

      return {
        success: data?.success ?? true,
        jobId: data?.jobId,
        message: data?.message,
        summary: data?.summary,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sync brand';
      setError(message);
      toast({
        title: "Sync Failed",
        description: message,
        variant: "destructive",
      });
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
    setCurrentJobId(null);
  };

  return {
    syncBrand,
    isLoading,
    currentJobId,
    error,
    reset,
  };
}

export function useBrandSyncStatus(jobId: string | null) {
  // This would poll for job status if needed
  // For now, we rely on real-time updates from brand_sync_logs table
  return {
    status: null,
    progress: null,
  };
}
