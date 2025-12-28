import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EnrichmentHistoryEntry {
  id: string;
  brandSlug: string;
  brandName: string;
  syncType: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  productsCreated: number | null;
  productsUpdated: number | null;
  productsFailed: number | null;
  priceChanges: number | null;
  errorDetails: Record<string, any> | null;
  successDetails: Record<string, any> | null;
  triggeredBy: string | null;
}

export interface EnrichmentHistorySummary {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  successRate: number;
  operationsToday: number;
  productsEnrichedToday: number;
  lastColorRun: string | null;
  lastTdsRun: string | null;
  lastRegionalRun: string | null;
}

const ENRICHMENT_SYNC_TYPES = [
  'color_extraction',
  'tds_discovery',
  'regional_prices',
  'full_sync',
  'products_sync'
];

async function fetchEnrichmentHistory(limit: number = 50): Promise<{
  entries: EnrichmentHistoryEntry[];
  summary: EnrichmentHistorySummary;
}> {
  // Fetch recent history entries
  const { data: entries, error } = await supabase
    .from('brand_sync_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Fetch summary stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const { data: todayStats, error: todayError } = await supabase
    .from('brand_sync_logs')
    .select('id, status, products_updated, products_created')
    .gte('started_at', todayIso);

  if (todayError) throw todayError;

  // Get last run times for each type
  const { data: lastColorRun } = await supabase
    .from('brand_sync_logs')
    .select('completed_at')
    .eq('sync_type', 'color_extraction')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  const { data: lastTdsRun } = await supabase
    .from('brand_sync_logs')
    .select('completed_at')
    .eq('sync_type', 'tds_discovery')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  const { data: lastRegionalRun } = await supabase
    .from('brand_sync_logs')
    .select('completed_at')
    .eq('sync_type', 'regional_prices')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  // Calculate summary
  const allEntries = entries || [];
  const successfulOps = allEntries.filter(e => e.status === 'completed').length;
  const failedOps = allEntries.filter(e => e.status === 'failed').length;
  const todayOps = todayStats || [];
  const productsEnrichedToday = todayOps.reduce(
    (sum, op) => sum + (op.products_updated || 0) + (op.products_created || 0),
    0
  );

  const mappedEntries: EnrichmentHistoryEntry[] = allEntries.map(entry => ({
    id: entry.id,
    brandSlug: entry.brand_slug,
    brandName: entry.brand_slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    syncType: entry.sync_type,
    status: entry.status,
    startedAt: entry.started_at,
    completedAt: entry.completed_at,
    durationSeconds: entry.duration_seconds,
    productsCreated: entry.products_created,
    productsUpdated: entry.products_updated,
    productsFailed: entry.products_failed,
    priceChanges: entry.price_changes,
    errorDetails: entry.error_details as Record<string, any> | null,
    successDetails: entry.success_details as Record<string, any> | null,
    triggeredBy: entry.triggered_by,
  }));

  return {
    entries: mappedEntries,
    summary: {
      totalOperations: allEntries.length,
      successfulOperations: successfulOps,
      failedOperations: failedOps,
      successRate: allEntries.length > 0 ? (successfulOps / allEntries.length) * 100 : 0,
      operationsToday: todayOps.length,
      productsEnrichedToday,
      lastColorRun: lastColorRun?.completed_at || null,
      lastTdsRun: lastTdsRun?.completed_at || null,
      lastRegionalRun: lastRegionalRun?.completed_at || null,
    },
  };
}

export function useEnrichmentHistory(limit: number = 50) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['enrichment-history', limit],
    queryFn: () => fetchEnrichmentHistory(limit),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['enrichment-history'] });
  };

  return {
    entries: query.data?.entries || [],
    summary: query.data?.summary || {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      successRate: 0,
      operationsToday: 0,
      productsEnrichedToday: 0,
      lastColorRun: null,
      lastTdsRun: null,
      lastRegionalRun: null,
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refresh,
  };
}
