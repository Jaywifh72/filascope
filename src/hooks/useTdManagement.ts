import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// ── Stats (server-side RPC) ──

export interface TdCoverageStats {
  total_filaments: number;
  with_td: number;
  missing_td: number;
  coverage_pct: number;
  reference_count: number;
  by_material: { material: string; total: number; with_td: number; pct: number }[];
  by_brand: { brand: string; total: number; with_td: number; pct: number }[];
  top_gaps_brand: { brand: string; total: number; missing: number }[];
  top_gaps_material: { material: string; total: number; missing: number; pct: number }[];
  recent_logs: { created_at: string; source: string; confidence: string; status: string; td_value: number; notes: string }[];
}

export function useTdStats() {
  return useQuery({
    queryKey: ['td-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_td_coverage_stats' as any);
      if (error) throw error;
      return data as unknown as TdCoverageStats;
    },
  });
}

// ── Filaments Table ──

export interface TdFilamentFilters {
  search: string;
  material: string;
  brand: string;
  tdStatus: 'all' | 'has-td' | 'missing-td' | 'high-conf' | 'medium-conf' | 'low-conf' | 'recent-24h';
  sortBy: string;
  sortDir: 'asc' | 'desc';
  pageSize: number;
}

export function useTdFilaments(filters: TdFilamentFilters, page: number) {
  return useQuery({
    queryKey: ['td-filaments', filters, page],
    queryFn: async () => {
      const ps = filters.pageSize || 50;
      let q: any = supabase
        .from('filaments')
        .select('id, vendor, product_title, display_name, material, color_family, color_hex, transmission_distance, td_confidence, td_source, td_matched_at, updated_at', { count: 'exact' });

      if (filters.search) {
        q = q.or(`vendor.ilike.%${filters.search}%,product_title.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
      }
      if (filters.material && filters.material !== 'all') q = q.eq('material', filters.material);
      if (filters.brand && filters.brand !== 'all') q = q.eq('vendor', filters.brand);

      if (filters.tdStatus === 'has-td') q = q.not('transmission_distance', 'is', null);
      if (filters.tdStatus === 'missing-td') q = q.is('transmission_distance', null);
      if (filters.tdStatus === 'high-conf') { q = q.not('transmission_distance', 'is', null); q = q.eq('td_confidence', 'high'); }
      if (filters.tdStatus === 'medium-conf') { q = q.not('transmission_distance', 'is', null); q = q.eq('td_confidence', 'medium'); }
      if (filters.tdStatus === 'low-conf') { q = q.not('transmission_distance', 'is', null); q = q.eq('td_confidence', 'low'); }
      if (filters.tdStatus === 'recent-24h') {
        const since = new Date(Date.now() - 24 * 3600000).toISOString();
        q = q.not('transmission_distance', 'is', null).gte('td_matched_at', since);
      }

      const col = filters.sortBy || 'vendor';
      q = q.order(col, { ascending: filters.sortDir === 'asc', nullsFirst: false });
      if (col !== 'material') q = q.order('material', { ascending: true, nullsFirst: false });
      if (col !== 'color_family') q = q.order('color_family', { ascending: true, nullsFirst: false });
      q = q.range(page * ps, (page + 1) * ps - 1);

      const { data, count, error } = await q;
      if (error) throw error;
      return { data: data ?? [], total: count ?? 0, pageSize: ps };
    },
  });
}

// ── Update TD value ──

export function useUpdateTdValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value, previousValue, source, confidence }: { id: string; value: number | null; previousValue: number | null; source?: string; confidence?: string }) => {
      const src = source || 'manual';
      const conf = confidence || 'high';
      const updates: any = {
        transmission_distance: value,
        td_confidence: value != null ? conf : null,
        td_source: value != null ? src : null,
        td_matched_at: value != null ? new Date().toISOString() : null,
      };
      const { error } = await supabase.from('filaments').update(updates).eq('id', id);
      if (error) throw error;

      if (value != null) {
        await supabase.from('td_population_log' as any).insert({
          filament_id: id,
          td_value: value,
          previous_value: previousValue,
          source: src,
          confidence: conf,
          status: 'applied',
          notes: `Manual admin edit (source: ${src})`,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['td-filaments'] });
      qc.invalidateQueries({ queryKey: ['td-stats'] });
      toast({ title: 'TD value updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// ── Bulk TD operations ──

export function useBulkUpdateTd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, value, source, confidence }: { ids: string[]; value: number; source: string; confidence: string }) => {
      const { error } = await supabase.from('filaments').update({
        transmission_distance: value,
        td_confidence: confidence,
        td_source: source,
        td_matched_at: new Date().toISOString(),
      } as any).in('id', ids);
      if (error) throw error;

      const logs = ids.map(id => ({
        filament_id: id,
        td_value: value,
        source,
        confidence,
        status: 'applied',
        notes: 'Bulk admin assignment',
      }));
      await supabase.from('td_population_log' as any).insert(logs);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['td-filaments'] });
      qc.invalidateQueries({ queryKey: ['td-stats'] });
      toast({ title: 'Bulk TD update complete' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useBulkClearTd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('filaments').update({
        transmission_distance: null,
        td_confidence: null,
        td_source: null,
        td_matched_at: null,
      } as any).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['td-filaments'] });
      qc.invalidateQueries({ queryKey: ['td-stats'] });
      toast({ title: 'TD values cleared' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// ── TD Suggestions (reference values for brand+material) ──

export function useTdSuggestions(vendors: string[]) {
  return useQuery({
    queryKey: ['td-suggestions', vendors],
    enabled: vendors.length > 0,
    queryFn: async () => {
      if (!vendors.length) return [];
      const { data, error } = await supabase
        .from('td_reference_values')
        .select('brand_name, color_name, material_type, td_value')
        .in('brand_name', vendors);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

// ── Reference Values ──

export function useTdReferenceValues() {
  return useQuery({
    queryKey: ['td-reference-values'],
    queryFn: async () => {
      const { data, error } = await supabase.from('td_reference_values').select('*').order('brand_name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface ReferenceMatchStat {
  ref_id: string;
  matched_count: number;
  brand_total: number;
  brand_with_td: number;
}

export function useReferenceMatchStats() {
  return useQuery({
    queryKey: ['td-reference-match-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_td_reference_match_stats' as any);
      if (error) throw error;
      const arr = (data as unknown as ReferenceMatchStat[]) ?? [];
      const map = new Map<string, ReferenceMatchStat>();
      arr.forEach(s => map.set(s.ref_id, s));
      return map;
    },
    staleTime: 60_000,
  });
}

export function useAddReferenceValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { brand_name: string; color_name: string; material_type: string; td_value: number; source: string; confidence: string; notes?: string; hex_code?: string }) => {
      const { error } = await supabase.from('td_reference_values').insert(row);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['td-reference-values'] }); qc.invalidateQueries({ queryKey: ['td-reference-match-stats'] }); toast({ title: 'Reference value added' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteReferenceValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('td_reference_values').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['td-reference-values'] }); qc.invalidateQueries({ queryKey: ['td-reference-match-stats'] }); toast({ title: 'Reference value deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateReferenceValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('td_reference_values').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['td-reference-values'] });
      qc.invalidateQueries({ queryKey: ['td-reference-match-stats'] });
      toast({ title: 'Reference updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useBulkDeleteReferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('td_reference_values').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['td-reference-values'] });
      qc.invalidateQueries({ queryKey: ['td-reference-match-stats'] });
      toast({ title: 'References deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useBulkUpdateConfidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, confidence }: { ids: string[]; confidence: string }) => {
      const { error } = await supabase.from('td_reference_values').update({ confidence }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['td-reference-values'] });
      qc.invalidateQueries({ queryKey: ['td-reference-match-stats'] });
      toast({ title: 'Confidence updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// ── Population Log (Batched) ──

export interface TdLogFilters {
  status: string;
  source: string;
  confidence: string;
  dateRange: string;
}

export interface LogEntry {
  id: string;
  created_at: string;
  filament_id: string | null;
  td_value: number;
  previous_value: number | null;
  source: string;
  confidence: string | null;
  status: string | null;
  notes: string | null;
  filament?: {
    product_title: string | null;
    vendor: string | null;
    material: string | null;
    color_family: string | null;
  } | null;
}

export interface LogBatch {
  id: string;
  timestamp: string;
  source: string;
  entries: LogEntry[];
  summary: {
    applied: number;
    skipped: number;
    errors: number;
    dryRun: number;
    highConf: number;
    medConf: number;
    lowConf: number;
    brands: string[];
  };
}

function groupIntoBatches(entries: LogEntry[]): LogBatch[] {
  if (!entries.length) return [];
  const batches: LogBatch[] = [];
  let current: LogEntry[] = [entries[0]];

  for (let i = 1; i < entries.length; i++) {
    const prev = new Date(entries[i - 1].created_at).getTime();
    const curr = new Date(entries[i].created_at).getTime();
    if (Math.abs(prev - curr) <= 10000 && entries[i].source === entries[i - 1].source) {
      current.push(entries[i]);
    } else {
      batches.push(buildBatch(current));
      current = [entries[i]];
    }
  }
  batches.push(buildBatch(current));
  return batches;
}

function buildBatch(entries: LogEntry[]): LogBatch {
  const brands = [...new Set(entries.map(e => e.filament?.vendor).filter(Boolean) as string[])];
  return {
    id: entries[0].id,
    timestamp: entries[entries.length - 1].created_at,
    source: entries[0].source,
    entries,
    summary: {
      applied: entries.filter(e => e.status === 'applied').length,
      skipped: entries.filter(e => e.status === 'skipped').length,
      errors: entries.filter(e => e.status === 'error').length,
      dryRun: entries.filter(e => e.status === 'dry-run').length,
      highConf: entries.filter(e => e.confidence === 'high').length,
      medConf: entries.filter(e => e.confidence === 'medium').length,
      lowConf: entries.filter(e => e.confidence === 'low').length,
      brands,
    },
  };
}

export function useTdPopulationLogBatched(filters: TdLogFilters) {
  return useQuery({
    queryKey: ['td-population-log', filters],
    queryFn: async () => {
      let q = (supabase.from('td_population_log') as any)
        .select('*, filaments!td_population_log_filament_id_fkey(product_title, vendor, material, color_family)')
        .order('created_at', { ascending: false })
        .limit(2000);

      if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
      if (filters.source && filters.source !== 'all') q = q.eq('source', filters.source);
      if (filters.confidence && filters.confidence !== 'all') q = q.eq('confidence', filters.confidence);

      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        const hours = filters.dateRange === '24h' ? 24 : filters.dateRange === '7d' ? 168 : 720;
        const since = new Date(now.getTime() - hours * 3600000).toISOString();
        q = q.gte('created_at', since);
      }

      const { data, error } = await q;
      if (error) throw error;

      const entries: LogEntry[] = (data ?? []).map((d: any) => ({
        ...d,
        filament: d.filaments ?? null,
      }));

      const batches = groupIntoBatches(entries);

      const allApplied = entries.filter(e => e.status === 'applied');
      const brandCounts: Record<string, number> = {};
      allApplied.forEach(e => {
        const b = e.filament?.vendor;
        if (b) brandCounts[b] = (brandCounts[b] || 0) + 1;
      });
      const topBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0];

      return {
        batches,
        stats: {
          totalRuns: batches.length,
          totalApplied: allApplied.length,
          lastRun: batches[0]?.timestamp ?? null,
          topBrand: topBrand ? { name: topBrand[0], count: topBrand[1] } : null,
        },
      };
    },
  });
}

// Keep old export name for backward compatibility
export function useTdPopulationLog(filters: { status: string; source: string }) {
  return useTdPopulationLogBatched({ ...filters, confidence: 'all', dateRange: 'all' });
}

// ── Run Discovery ──

export function useRunTdDiscovery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { mode: string; brand_slug?: string; limit?: number }) => {
      const { data, error } = await supabase.functions.invoke('populate-td-values', { body: params });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['td-filaments'] });
      qc.invalidateQueries({ queryKey: ['td-stats'] });
      qc.invalidateQueries({ queryKey: ['td-population-log'] });
      toast({ title: 'TD Discovery Complete', description: `Updated: ${data?.summary?.updated ?? 0}, Matched: ${data?.summary?.matched ?? 0}` });
    },
    onError: (e: any) => toast({ title: 'Discovery Error', description: e.message, variant: 'destructive' }),
  });
}

// ── Distinct filter options ──

export function useTdFilterOptions() {
  return useQuery({
    queryKey: ['td-filter-options'],
    queryFn: async () => {
      const [matRes, brandRes] = await Promise.all([
        supabase.from('filaments').select('material').not('material', 'is', null),
        supabase.from('filaments').select('vendor').not('vendor', 'is', null),
      ]);
      const materials = [...new Set((matRes.data ?? []).map((r: any) => r.material as string))].sort();
      const brands = [...new Set((brandRes.data ?? []).map((r: any) => r.vendor as string))].sort();
      return { materials, brands };
    },
    staleTime: 5 * 60 * 1000,
  });
}
