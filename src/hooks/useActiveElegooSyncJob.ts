import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ElegooSyncProgress {
  currentRegion: string | null;
  completedRegions: string[];
  totalRegions: number;
  regionsProcessed: number;
  created: number;
  updated: number;
  skipped: number;
  filtered: number;
  errors: number;
  total: number;
  regionResults?: Record<string, { created: number; updated: number; errors: number }>;
}

export interface ElegooSyncResults {
  created: number;
  updated: number;
  skipped: number;
  filtered: number;
  errors: number;
  total: number;
  regions: string[];
  regionResults: Record<string, { created: number; updated: number; errors: number }>;
  dryRun: boolean;
}

export interface ElegooSyncJob {
  id: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  materials: string[]; // regions in this case
  dry_run: boolean;
  progress: ElegooSyncProgress;
  results: ElegooSyncResults | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useActiveElegooSyncJob() {
  const [activeJob, setActiveJob] = useState<ElegooSyncJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const fetchActiveJob = useCallback(async () => {
    try {
      // Look for running or recently completed Elegoo sync jobs
      const { data, error } = await supabase
        .from('scrape_jobs')
        .select('*')
        .eq('job_type', 'elegoo_sync')
        .in('status', ['running', 'pending'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[useActiveElegooSyncJob] Error fetching active job:', error);
        return null;
      }

      if (data) {
        setActiveJob(data as unknown as ElegooSyncJob);
      } else {
        setActiveJob(null);
      }

      return data;
    } catch (err) {
      console.error('[useActiveElegooSyncJob] Error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchActiveJob();

    let pollingInterval: NodeJS.Timeout | null = null;
    let realtimeWorking = false;

    // Subscribe to realtime updates for elegoo_sync jobs
    const channel = supabase
      .channel('elegoo_sync_jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scrape_jobs',
          filter: 'job_type=eq.elegoo_sync',
        },
        (payload) => {
          console.log('[useActiveElegooSyncJob] Realtime update:', payload.eventType);
          realtimeWorking = true;
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const job = payload.new as unknown as ElegooSyncJob;
            
            // Only track running jobs or recently completed jobs
            if (job.status === 'running' || job.status === 'pending') {
              setActiveJob(job);
            } else if (job.status === 'completed' || job.status === 'failed') {
              // Keep the completed job for a moment so UI can show final state
              setActiveJob(job);
            }
          }

          // Clear polling if realtime is working
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
        }
      )
      .subscribe((status) => {
        console.log('[useActiveElegooSyncJob] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Fallback polling if realtime doesn't work
    pollingInterval = setInterval(() => {
      if (!realtimeWorking) {
        fetchActiveJob();
      }
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [fetchActiveJob]);

  const isComplete = activeJob?.status === 'completed' || activeJob?.status === 'failed';
  const isRunning = activeJob?.status === 'running';
  const isPending = activeJob?.status === 'pending';
  const hasActiveJob = activeJob !== null && (isRunning || isPending);

  const progressPercent = activeJob?.progress?.totalRegions && activeJob?.progress?.regionsProcessed !== undefined
    ? Math.round((activeJob.progress.regionsProcessed / activeJob.progress.totalRegions) * 100)
    : 0;

  // Clear active job (for when user wants to dismiss completed job)
  const clearActiveJob = useCallback(() => {
    setActiveJob(null);
  }, []);

  return {
    activeJob,
    isLoading,
    isConnected,
    isComplete,
    isRunning,
    isPending,
    hasActiveJob,
    progressPercent,
    refetch: fetchActiveJob,
    clearActiveJob,
  };
}

// Hook to fetch a specific Elegoo sync job by ID
export function useElegooSyncJob(jobId: string | null) {
  const [job, setJob] = useState<ElegooSyncJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;

    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('scrape_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setJob(data as unknown as ElegooSyncJob);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    fetchJob();

    let pollingInterval: NodeJS.Timeout | null = null;
    let realtimeWorking = false;

    const channel = supabase
      .channel(`elegoo_sync_job_${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scrape_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          realtimeWorking = true;
          setJob(payload.new as unknown as ElegooSyncJob);
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
        }
      )
      .subscribe();

    pollingInterval = setInterval(() => {
      if (!realtimeWorking) {
        fetchJob();
      }
    }, 1500);

    return () => {
      supabase.removeChannel(channel);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [jobId, fetchJob]);

  const isComplete = job?.status === 'completed' || job?.status === 'failed';
  const isRunning = job?.status === 'running';

  return {
    job,
    isLoading,
    error,
    isComplete,
    isRunning,
    refetch: fetchJob,
  };
}
