import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================================
// Types
// ============================================================

export type Phase = 'select' | 'scanning' | 'processing' | 'delta' | 'importing' | 'complete';

export type SyncItem = {
  id: string;
  job_id: string;
  status: string;
  is_new: boolean;
  extracted_data: Record<string, unknown>;
  admin_override_data: Record<string, unknown> | null;
  display_name: string | null;
  color_name: string | null;
  color_hex: string | null;
  color_family: string | null;
  material_type: string | null;
  finish_type: string | null;
  image_url: string | null;
  variant_image_url: string | null;
  price_usd: number | null;
  price_eur: number | null;
  price_cad: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  variant_sku: string | null;
  product_handle: string | null;
  available_regions: string[] | null;
  existing_filament_id: string | null;
  inserted_filament_id: string | null;
  price_diff: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string | null;
};

export type SyncJob = {
  id: string;
  brand_id: string;
  config_id: string | null;
  status: string;
  total_store_products: number | null;
  filament_products_found: number | null;
  skipped_products: number | null;
  new_count: number | null;
  changed_count: number | null;
  matched_count: number | null;
  error_count: number | null;
  imported_count: number | null;
  post_import_results: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  warnings: string[] | null;
};

export interface DeltaStats {
  totalDiscovered: number;
  inDatabase: number;
  newCount: number;
  changedCount: number;
  matchedCount: number;
  errorCount: number;
}

export interface ImportResult {
  imported: number;
  updatedPrices: number;
  errors: number;
  priceHistoryCount: number;
  avgQualityScore: number;
  urlsBroken: string[];
}

// ============================================================
// Hook
// ============================================================

export function useCatalogSync() {
  const [phase, setPhase] = useState<Phase>('select');
  const [jobId, setJobId] = useState<string | null>(null);
  const [scanJob, setScanJob] = useState<SyncJob | null>(null);
  const [items, setItems] = useState<SyncItem[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Derived stats
  const deltaStats: DeltaStats = {
    totalDiscovered: items.length,
    inDatabase: items.filter(i => i.status === 'matched' || i.status === 'price_changed').length
      + (scanJob?.matched_count ?? 0) - items.filter(i => i.status === 'matched').length,
    newCount: items.filter(i => i.status === 'new').length,
    changedCount: items.filter(i => i.status === 'price_changed').length,
    matchedCount: items.filter(i => i.status === 'matched').length,
    errorCount: items.filter(i => i.status === 'error').length,
  };

  // Recalculate inDatabase from the job stats + matched items
  if (scanJob) {
    deltaStats.inDatabase = (scanJob.matched_count ?? 0) + (scanJob.changed_count ?? 0);
  }

  // ── Start Scan (Two-Phase: Fetch → Process) ──

  const startScan = useCallback(async (brandId: string, configId: string) => {
    setError(null);
    setItems([]);
    setScanJob(null);
    setImportResult(null);
    setPhase('scanning');
    setScanStatusMessage('Fetching products from store...');

    try {
      // ── Phase 1: Fetch products from store ──
      const { data: fetchData, error: fetchErr } = await supabase.functions.invoke('sync-brand-catalog', {
        body: { brand_id: brandId, config_id: configId },
      });

      if (fetchErr) throw new Error(fetchErr.message);

      const returnedJobId = fetchData?.job_id;
      if (!returnedJobId) throw new Error('No job ID returned from scan');

      setJobId(returnedJobId);
      const products = fetchData?.products;
      const productCount = fetchData?.product_count || products?.length || 0;

      setScanStatusMessage(`Fetched ${productCount} products. Processing and comparing...`);
      setPhase('processing');

      // ── Phase 2: Classify, extract, diff ──
      const { data: processData, error: processErr } = await supabase.functions.invoke('process-brand-sync', {
        body: {
          job_id: returnedJobId,
          products: products || [],
          brand_id: brandId,
          config_id: configId,
        },
      });

      if (processErr) throw new Error(processErr.message);

      // Build job summary from process results
      setScanJob({
        id: returnedJobId,
        brand_id: brandId,
        config_id: configId,
        status: 'completed',
        total_store_products: productCount,
        filament_products_found: processData?.filament_products_found ?? null,
        skipped_products: processData?.skipped_products ?? null,
        new_count: processData?.new_count ?? null,
        changed_count: processData?.changed_count ?? null,
        matched_count: processData?.matched_count ?? null,
        error_count: processData?.error_count ?? null,
        imported_count: null,
        post_import_results: null,
        started_at: null,
        completed_at: new Date().toISOString(),
        created_at: null,
        warnings: processData?.warnings ?? null,
      } as SyncJob);

      await loadItems(returnedJobId);
      setPhase('delta');
    } catch (err: any) {
      const msg = err.message || 'Scan failed';
      if (msg.includes('Failed to send a request') || msg.includes('FunctionsFetchError')) {
        setError(
          'Could not reach an edge function. ' +
          'Ensure sync-brand-catalog and process-brand-sync are deployed.'
        );
      } else {
        setError(msg);
      }
      setPhase('select');
    }
  }, []);

  // ── Load Items ──

  const loadItems = async (jId: string) => {
    const { data, error: loadErr } = await supabase
      .from('brand_sync_items')
      .select('*')
      .eq('job_id', jId)
      .order('status', { ascending: true })
      .order('display_name', { ascending: true });

    if (loadErr) {
      console.error('Failed to load sync items:', loadErr);
      return;
    }
    setItems((data || []) as SyncItem[]);
  };

  // ── Start Import ──

  const startImport = useCallback(async (
    itemIds: string[],
    brandId: string,
    brandName: string,
    brandSlug: string
  ) => {
    if (!jobId || itemIds.length === 0) return;
    setError(null);
    setImporting(true);
    setPhase('importing');

    try {
      const { data, error: invokeErr } = await supabase.functions.invoke('import-synced-filaments', {
        body: {
          job_id: jobId,
          item_ids: itemIds,
          brand_id: brandId,
          brand_name: brandName,
          brand_slug: brandSlug,
        },
      });

      if (invokeErr) throw new Error(invokeErr.message);

      setImportResult({
        imported: data?.imported ?? 0,
        updatedPrices: data?.updated_prices ?? 0,
        errors: data?.errors ?? 0,
        priceHistoryCount: data?.post_import?.price_history_count ?? 0,
        avgQualityScore: data?.post_import?.avg_quality_score ?? 0,
        urlsBroken: data?.post_import?.urls_broken ?? [],
      });

      setPhase('complete');
    } catch (err: any) {
      const msg = err.message || 'Import failed';
      if (msg.includes('Failed to send a request') || msg.includes('FunctionsFetchError')) {
        setError(
          'Could not reach the import-synced-filaments edge function. ' +
          'It may not be deployed yet. Run: supabase functions deploy import-synced-filaments'
        );
      } else {
        setError(msg);
      }
      // Stay on importing phase so user can retry
    } finally {
      setImporting(false);
    }
  }, [jobId]);

  // ── Reset ──

  const reset = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPhase('select');
    setJobId(null);
    setScanJob(null);
    setItems([]);
    setImportResult(null);
    setError(null);
    setImporting(false);
  }, []);

  return {
    phase,
    jobId,
    scanJob,
    items,
    deltaStats,
    importResult,
    error,
    importing,
    scanStatusMessage,
    startScan,
    startImport,
    reset,
  };
}
