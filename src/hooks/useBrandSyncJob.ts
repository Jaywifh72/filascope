import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandSyncJob, BrandSyncProgress, SyncProductResult } from "@/types/brand-sync";

export function useBrandSyncJob(jobId: string | null) {
  const [job, setJob] = useState<BrandSyncJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) {
      setJob(null);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('brand_sync_logs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setJob({
          id: data.id,
          brand_slug: data.brand_slug,
          status: data.status as BrandSyncJob['status'],
          sync_type: data.sync_type,
          started_at: data.started_at,
          completed_at: data.completed_at,
          duration_seconds: data.duration_seconds,
          products_discovered: data.products_discovered,
          products_created: data.products_created,
          products_updated: data.products_updated,
          products_failed: data.products_failed,
          progress: (data.products_processed as any)?.progress as BrandSyncProgress | null,
          products_processed: (data.products_processed as any)?.products as SyncProductResult[] | null,
          error_details: data.error_details as { error: string } | null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();

    if (!jobId) return;

    // Set up real-time subscription
    const channel = supabase
      .channel(`brand-sync-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brand_sync_logs',
          filter: `id=eq.${jobId}`,
        },
        () => {
          fetchJob();
        }
      )
      .subscribe();

    // Poll every 3 seconds as backup
    const interval = setInterval(fetchJob, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [jobId, fetchJob]);

  const isComplete = job?.status === 'completed' || job?.status === 'failed';
  const isRunning = job?.status === 'running' || job?.status === 'pending';
  const progressPercent = job?.progress 
    ? Math.round((job.progress.productsProcessed / Math.max(job.progress.totalProducts, 1)) * 100)
    : 0;

  return {
    job,
    isLoading,
    error,
    isComplete,
    isRunning,
    progressPercent,
    refetch: fetchJob,
  };
}

export function useRecentBrandSyncJobs(brandSlug: string, limit = 5) {
  const [jobs, setJobs] = useState<BrandSyncJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('brand_sync_logs')
        .select('*')
        .eq('brand_slug', brandSlug)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setJobs((data || []).map(d => ({
        id: d.id,
        brand_slug: d.brand_slug,
        status: d.status as BrandSyncJob['status'],
        sync_type: d.sync_type,
        started_at: d.started_at,
        completed_at: d.completed_at,
        duration_seconds: d.duration_seconds,
        products_discovered: d.products_discovered,
        products_created: d.products_created,
        products_updated: d.products_updated,
        products_failed: d.products_failed,
        progress: (d.products_processed as any)?.progress as BrandSyncProgress | null,
        products_processed: (d.products_processed as any)?.products as SyncProductResult[] | null,
        error_details: d.error_details as { error: string } | null,
      })));
    } catch (err) {
      console.error('Failed to fetch sync jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [brandSlug, limit]);

  useEffect(() => {
    fetchJobs();

    // Subscribe to changes
    const channel = supabase
      .channel(`brand-sync-jobs-${brandSlug}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brand_sync_logs',
          filter: `brand_slug=eq.${brandSlug}`,
        },
        () => {
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [brandSlug, fetchJobs]);

  return { jobs, isLoading, refetch: fetchJobs };
}
