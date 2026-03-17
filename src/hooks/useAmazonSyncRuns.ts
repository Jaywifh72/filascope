import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AmazonSyncRun {
  id: string;
  run_type: string;
  status: string;
  brand_slug: string | null;
  marketplace: string | null;
  total_items: number;
  processed: number;
  prices_updated: number;
  new_mappings: number;
  errors: number;
  skipped: number;
  api_calls_used: number;
  error_log: any[];
  summary: Record<string, any>;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  triggered_by: string | null;
}

export interface SyncRunFilters {
  runType?: string;
  status?: string;
  limit?: number;
}

export function useAmazonSyncRuns(filters: SyncRunFilters = {}) {
  return useQuery({
    queryKey: ['amazon-sync-runs', filters],
    queryFn: async () => {
      let query = supabase
        .from('amazon_sync_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(filters.limit || 50);

      if (filters.runType) {
        query = query.eq('run_type', filters.runType);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AmazonSyncRun[];
    },
    staleTime: 15_000,
    refetchInterval: (query) => {
      // Auto-refresh while any run is still running
      const runs = query.state.data;
      const hasRunning = runs?.some((r: AmazonSyncRun) => r.status === 'running');
      return hasRunning ? 3000 : false;
    },
  });
}

export function useAmazonSyncRunDetail(runId: string | null) {
  return useQuery({
    queryKey: ['amazon-sync-run', runId],
    queryFn: async () => {
      if (!runId) return null;
      const { data, error } = await supabase
        .from('amazon_sync_runs')
        .select('*')
        .eq('id', runId)
        .single();

      if (error) throw error;
      return data as AmazonSyncRun;
    },
    enabled: !!runId,
    staleTime: 5_000,
  });
}
