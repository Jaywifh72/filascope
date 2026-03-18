import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────

export type AmazonSyncPhase = 'select' | 'syncing' | 'results';

export interface AmazonSyncSummary {
  runId: string;
  status: string; // 'completed' | 'partial' | 'failed'
  totalItems: number;
  processed: number;
  pricesUpdated: number;
  errors: number;
  skipped: number;
  apiCallsUsed: number;
  durationMs: number;
}

export interface AmazonSyncRunRecord {
  id: string;
  run_type: string;
  status: string;
  brand_slug: string | null;
  marketplace: string | null;
  total_items: number | null;
  processed: number | null;
  prices_updated: number | null;
  errors: number | null;
  skipped: number | null;
  api_calls_used: number | null;
  error_log: string[] | null;
  duration_ms: number | null;
  created_at: string;
  completed_at: string | null;
}

// ── Hook ───────────────────────────────────────────────────

export function useAmazonPriceSync() {
  const [phase, setPhase] = useState<AmazonSyncPhase>('select');
  const [summary, setSummary] = useState<AmazonSyncSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncLabel, setSyncLabel] = useState<string>('');

  const startSync = useCallback(async (
    brandSlug: string | null,
    marketplace: string | null,
    label: string,
  ) => {
    setPhase('syncing');
    setSyncing(true);
    setError(null);
    setSummary(null);
    setSyncLabel(label);

    try {
      const body: Record<string, any> = {};
      if (brandSlug) body.brand_slug = brandSlug;
      if (marketplace) body.marketplace = marketplace;
      body.stale_only = false; // sync all, not just stale
      body.batch_size = 10;

      const { data, error: fnError } = await supabase.functions.invoke('sync-amazon-prices', {
        body,
      });

      if (fnError) {
        const msg = fnError.message || String(fnError);
        if (msg.includes('Failed to send') || msg.includes('NOT_FOUND') || msg.includes('404')) {
          throw new Error(
            'The sync-amazon-prices edge function is not deployed. Deploy via: npx supabase functions deploy sync-amazon-prices --project-ref cfqfavmhdbyjzejipiwa'
          );
        }
        throw new Error(msg);
      }

      if (data?.error) throw new Error(data.error);

      setSummary({
        runId: data.runId || '',
        status: data.status || 'completed',
        totalItems: data.totalItems ?? 0,
        processed: data.processed ?? 0,
        pricesUpdated: data.pricesUpdated ?? 0,
        errors: data.errors ?? 0,
        skipped: data.skipped ?? 0,
        apiCallsUsed: data.apiCallsUsed ?? 0,
        durationMs: data.durationMs ?? 0,
      });
      setPhase('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('results');
    } finally {
      setSyncing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPhase('select');
    setSummary(null);
    setError(null);
    setSyncing(false);
    setSyncLabel('');
  }, []);

  return {
    phase,
    summary,
    error,
    syncing,
    syncLabel,
    startSync,
    reset,
  };
}
