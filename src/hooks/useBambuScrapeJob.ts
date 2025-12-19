import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ScrapeJobProgress {
  currentMaterial?: string;
  currentProduct?: string;
  currentRegion?: string;
  productsProcessed?: number;
  totalProducts?: number;
  colorsDiscovered?: number;
  filamentsCreated?: number;
  filamentsUpdated?: number;
  errors?: string[];
}

export interface ScrapeJob {
  id: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  materials: string[];
  products: string[];
  request_id: string | null;
  dry_run: boolean;
  progress: ScrapeJobProgress;
  results: any;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useBambuScrapeJob(jobId: string | null) {
  const [job, setJob] = useState<ScrapeJob | null>(null);
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

      setJob(data as unknown as ScrapeJob);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  // Set up realtime subscription for job updates
  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    // Initial fetch
    fetchJob();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`scrape_job_${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scrape_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          setJob(payload.new as unknown as ScrapeJob);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, fetchJob]);

  const isComplete = job?.status === 'completed' || job?.status === 'failed';
  const isRunning = job?.status === 'running';
  const isPending = job?.status === 'pending';

  const progressPercent = job?.progress?.totalProducts && job?.progress?.productsProcessed
    ? Math.round((job.progress.productsProcessed / job.progress.totalProducts) * 100)
    : 0;

  return {
    job,
    isLoading,
    error,
    isComplete,
    isRunning,
    isPending,
    progressPercent,
    refetch: fetchJob,
  };
}

// Hook to start a new scrape job
export function useStartBambuScrapeJob() {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startJob = async (materials: string[], dryRun: boolean): Promise<string | null> => {
    setIsStarting(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('scrape-bambu-pla', {
        body: {
          materials,
          dryRun,
          background: true, // New flag to trigger background mode
        },
      });

      if (invokeError) {
        setError(invokeError.message);
        return null;
      }

      if (!data?.jobId) {
        setError('No job ID returned from server');
        return null;
      }

      return data.jobId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start job';
      setError(message);
      return null;
    } finally {
      setIsStarting(false);
    }
  };

  return { startJob, isStarting, error };
}

// Hook to fetch recent scrape jobs
export function useRecentScrapeJobs(limit: number = 10) {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('scrape_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        setJobs(data as unknown as ScrapeJob[]);
      }
      setIsLoading(false);
    };

    fetchJobs();

    // Subscribe to new jobs
    const channel = supabase
      .channel('scrape_jobs_list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scrape_jobs',
        },
        () => {
          fetchJobs(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { jobs, isLoading };
}
