import { useState, useCallback } from 'react';

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

      // Call the edge function on our Supabase project (fytxfdvbzstnimzhjgth)
      // directly, since it's deployed there — not on the Lovable-managed project.
      const EDGE_FN_URL = 'https://fytxfdvbzstnimzhjgth.supabase.co/functions/v1/sync-amazon-prices';
      const response = await fetch(EDGE_FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Edge function error (${response.status}): ${text}`);
      }

      const data = await response.json();

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
