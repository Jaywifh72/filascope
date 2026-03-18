import { useState, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────

export type PriceSyncPhase = 'select' | 'syncing' | 'results';

export interface PriceSyncRegionResult {
  oldPrice: number | null;
  newPrice: number | null;
  msrp: number | null;
  changePct: number | null;
  currency: string;
  status: string; // 'new' | 'updated' | 'unchanged' | 'error' | 'not_in_region' | 'geo_blocked' | 'anomaly_rejected' | 'anomaly_cleared'
  extractionMethod: string | null;
  confidence: string | null;
  isAnomaly: boolean;
  anomalyReason: string | null;
  error: string | null;
}

export interface PriceSyncPrinterResult {
  printerId?: string;
  modelName: string;
  brandSlug: string;
  slug: string | null;
  regions: Record<string, PriceSyncRegionResult>;
  skipped: boolean;
  skipReason: string | null;
  error: string | null;
  hasUpdates: boolean;
  hasErrors: boolean;
}

export interface PriceSyncSummary {
  printersChecked: number;
  pricesUpdated: number;
  errors: number;
  anomalies: number;
  skipped: number;
  manualOnly: number;
  discontinued: number;
  duration: number;
}

const REGION_CURRENCIES: Record<string, string> = {
  US: 'USD', CA: 'CAD', UK: 'GBP', EU: 'EUR', AU: 'AUD', JP: 'JPY',
};

function computeChangePct(oldPrice: number | null, newPrice: number | null): number | null {
  if (oldPrice == null || newPrice == null || oldPrice === 0) return null;
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

function parseRegionResult(regionCode: string, raw: any): PriceSyncRegionResult {
  const oldPrice = raw.oldPrice ?? null;
  const newPrice = raw.newPrice ?? null;
  return {
    oldPrice,
    newPrice,
    msrp: raw.msrp ?? null,
    changePct: computeChangePct(oldPrice, newPrice),
    currency: REGION_CURRENCIES[regionCode] || 'USD',
    status: raw.status || 'error',
    extractionMethod: raw.extraction_method || null,
    confidence: raw.confidence || null,
    isAnomaly: raw.isAnomaly || raw.anomaly_severity === 'warning' || false,
    anomalyReason: raw.anomaly_reason || null,
    error: raw.error || null,
  };
}

function parsePrinterResult(raw: any): PriceSyncPrinterResult {
  const regions: Record<string, PriceSyncRegionResult> = {};
  let hasUpdates = false;
  let hasErrors = false;

  if (raw.regions) {
    for (const [rc, regionData] of Object.entries(raw.regions)) {
      const parsed = parseRegionResult(rc, regionData);
      regions[rc] = parsed;
      if (parsed.status === 'updated' || parsed.status === 'new') hasUpdates = true;
      if (parsed.status === 'error' || parsed.status === 'anomaly_rejected') hasErrors = true;
    }
  }

  return {
    printerId: raw.printer_id,
    modelName: raw.printer || 'Unknown',
    brandSlug: raw.brand || '',
    slug: raw.slug || null,
    regions,
    skipped: raw.skipped || false,
    skipReason: raw.reason || null,
    error: raw.error || null,
    hasUpdates,
    hasErrors,
  };
}

// ── Hook ───────────────────────────────────────────────────

export function usePrinterPriceSync() {
  const [phase, setPhase] = useState<PriceSyncPhase>('select');
  const [results, setResults] = useState<PriceSyncPrinterResult[]>([]);
  const [summary, setSummary] = useState<PriceSyncSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncBrandName, setSyncBrandName] = useState<string>('');

  const startSync = useCallback(async (brandId: string | 'all', brandName: string) => {
    setPhase('syncing');
    setSyncing(true);
    setError(null);
    setResults([]);
    setSummary(null);
    setSyncBrandName(brandName);

    const startTime = Date.now();

    try {
      const body: Record<string, string> = {};
      if (brandId !== 'all') {
        body.brand_id = brandId;
      }

      // Call the edge function on our Supabase project (fytxfdvbzstnimzhjgth)
      // directly, since it's deployed there — not on the Lovable-managed project.
      const EDGE_FN_URL = 'https://fytxfdvbzstnimzhjgth.supabase.co/functions/v1/sync-printer-prices';
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
      if (!data?.success) throw new Error(data?.error || 'Unknown error from sync function');

      const duration = Date.now() - startTime;
      const parsed = (data.results || []).map(parsePrinterResult);

      setResults(parsed);
      setSummary({
        ...(data.summary || {}),
        duration,
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
    setResults([]);
    setSummary(null);
    setError(null);
    setSyncing(false);
    setSyncBrandName('');
  }, []);

  return {
    phase,
    results,
    summary,
    error,
    syncing,
    syncBrandName,
    startSync,
    reset,
  };
}
