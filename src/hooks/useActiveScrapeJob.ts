import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EnhancedProgress {
  currentMaterial?: string;
  currentProduct?: string;
  currentRegion?: string;
  currentStage?: 'fetching_colors' | 'scraping_prices' | 'saving_db';
  productsProcessed?: number;
  totalProducts?: number;
  colorsDiscovered?: number;
  filamentsCreated?: number;
  filamentsUpdated?: number;
  regionsCompleted?: string[];
  regionsTotal?: number;
  elapsedMs?: number;
  estimatedRemainingMs?: number;
  recentActivity?: Array<{ time: string; message: string; type?: 'success' | 'info' | 'error' }>;
  errors?: string[];
}

export interface ActiveScrapeJob {
  id: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  materials: string[];
  products: string[];
  request_id: string | null;
  dry_run: boolean;
  progress: EnhancedProgress;
  results: any;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to auto-detect any running scrape jobs from the database.
 * This ensures progress is shown even after page refresh or navigation.
 * Uses faster polling (1.5s) for running jobs.
 */
export function useActiveScrapeJob() {
  const [activeJob, setActiveJob] = useState<ActiveScrapeJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const fetchActiveJob = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('scrape_jobs')
        .select('*')
        .in('status', ['running', 'pending'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[useActiveScrapeJob] Fetch error:', error);
        return;
      }

      setActiveJob(data as unknown as ActiveScrapeJob | null);
    } catch (err) {
      console.error('[useActiveScrapeJob] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchActiveJob();

    // Subscribe to realtime updates on scrape_jobs table
    const channel = supabase
      .channel('active_scrape_job')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scrape_jobs',
        },
        (payload) => {
          console.log('[useActiveScrapeJob] Realtime update:', payload.eventType);
          setIsConnected(true);
          
          // Handle updates
          if (payload.eventType === 'UPDATE') {
            const updatedJob = payload.new as unknown as ActiveScrapeJob;
            
            // If this is the active job, update it
            if (activeJob?.id === updatedJob.id) {
              setActiveJob(updatedJob);
              
              // If job completed or failed, clear it after a delay
              if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
                setTimeout(() => {
                  fetchActiveJob(); // Refresh to check for other running jobs
                }, 3000);
              }
            }
          }
          
          // Handle new jobs
          if (payload.eventType === 'INSERT') {
            const newJob = payload.new as unknown as ActiveScrapeJob;
            if (newJob.status === 'running' || newJob.status === 'pending') {
              setActiveJob(newJob);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[useActiveScrapeJob] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Faster polling interval (1.5s) as fallback
    const pollingInterval = setInterval(() => {
      fetchActiveJob();
    }, 1500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
    };
  }, [fetchActiveJob, activeJob?.id]);

  // Calculate derived values
  const isRunning = activeJob?.status === 'running';
  const isPending = activeJob?.status === 'pending';
  const hasActiveJob = isRunning || isPending;

  const progressPercent = activeJob?.progress?.totalProducts && activeJob?.progress?.productsProcessed
    ? Math.round((activeJob.progress.productsProcessed / activeJob.progress.totalProducts) * 100)
    : 0;

  // Calculate elapsed time
  const elapsedMs = activeJob?.started_at 
    ? Date.now() - new Date(activeJob.started_at).getTime()
    : 0;

  // Estimate remaining time based on progress
  const estimatedRemainingMs = progressPercent > 0 && elapsedMs > 0
    ? Math.round((elapsedMs / progressPercent) * (100 - progressPercent))
    : undefined;

  return {
    activeJob,
    isLoading,
    isConnected,
    isRunning,
    isPending,
    hasActiveJob,
    progressPercent,
    elapsedMs,
    estimatedRemainingMs,
    refetch: fetchActiveJob,
  };
}
