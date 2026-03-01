import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// ── Stats ──

export function useTdStats() {
  return useQuery({
    queryKey: ['td-stats'],
    queryFn: async () => {
      const [totalRes, withTdRes, materialRes, brandRes] = await Promise.all([
        supabase.from('filaments').select('id', { count: 'exact', head: true }),
        supabase.from('filaments').select('id', { count: 'exact', head: true }).not('transmission_distance', 'is', null),
        supabase.from('filaments').select('material, transmission_distance'),
        supabase.from('filaments').select('vendor, transmission_distance'),
      ]);

      const total = totalRes.count ?? 0;
      const withTd = withTdRes.count ?? 0;

      // Material breakdown
      const matMap = new Map<string, { total: number; withTd: number }>();
      (materialRes.data ?? []).forEach((f: any) => {
        const m = f.material || 'Unknown';
        const entry = matMap.get(m) || { total: 0, withTd: 0 };
        entry.total++;
        if (f.transmission_distance != null) entry.withTd++;
        matMap.set(m, entry);
      });
      const byMaterial = Array.from(matMap.entries())
        .map(([material, { total: t, withTd: w }]) => ({ material, total: t, withTd: w, pct: t > 0 ? Math.round((w / t) * 100) : 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // Brand breakdown
      const brandMap = new Map<string, { total: number; withTd: number }>();
      (brandRes.data ?? []).forEach((f: any) => {
        const v = f.vendor || 'Unknown';
        const entry = brandMap.get(v) || { total: 0, withTd: 0 };
        entry.total++;
        if (f.transmission_distance != null) entry.withTd++;
        brandMap.set(v, entry);
      });
      const byBrand = Array.from(brandMap.entries())
        .map(([brand, { total: t, withTd: w }]) => ({ brand, total: t, withTd: w, pct: t > 0 ? Math.round((w / t) * 100) : 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      return { total, withTd, withoutTd: total - withTd, coverage: total > 0 ? Math.round((withTd / total) * 100) : 0, byMaterial, byBrand };
    },
  });
}

// ── Filaments Table ──

export interface TdFilamentFilters {
  search: string;
  material: string;
  brand: string;
  tdStatus: 'all' | 'has-td' | 'missing-td';
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

const PAGE_SIZE = 50;

export function useTdFilaments(filters: TdFilamentFilters, page: number) {
  return useQuery({
    queryKey: ['td-filaments', filters, page],
    queryFn: async () => {
      let q = supabase
        .from('filaments')
        .select('id, vendor, product_title, display_name, material, color_family, color_hex, transmission_distance, updated_at', { count: 'exact' });

      if (filters.search) {
        q = q.or(`vendor.ilike.%${filters.search}%,product_title.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
      }
      if (filters.material && filters.material !== 'all') q = q.eq('material', filters.material);
      if (filters.brand && filters.brand !== 'all') q = q.eq('vendor', filters.brand);
      if (filters.tdStatus === 'has-td') q = q.not('transmission_distance', 'is', null);
      if (filters.tdStatus === 'missing-td') q = q.is('transmission_distance', null);

      const col = filters.sortBy || 'vendor';
      q = q.order(col, { ascending: filters.sortDir === 'asc', nullsFirst: false });
      q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const { data, count, error } = await q;
      if (error) throw error;
      return { data: data ?? [], total: count ?? 0, pageSize: PAGE_SIZE };
    },
  });
}

// ── Update TD value ──

export function useUpdateTdValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value, previousValue }: { id: string; value: number | null; previousValue: number | null }) => {
      const { error } = await supabase.from('filaments').update({ transmission_distance: value } as any).eq('id', id);
      if (error) throw error;

      // Log to td_population_log
      if (value != null) {
        await supabase.from('td_population_log' as any).insert({
          filament_id: id,
          td_value: value,
          previous_value: previousValue,
          source: 'manual',
          confidence: 'high',
          status: 'applied',
          notes: 'Manual admin edit',
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

export function useAddReferenceValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { brand_name: string; color_name: string; material_type: string; td_value: number; source: string; confidence: string; notes?: string }) => {
      const { error } = await supabase.from('td_reference_values').insert(row);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['td-reference-values'] }); toast({ title: 'Reference value added' }); },
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['td-reference-values'] }); toast({ title: 'Reference value deleted' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// ── Population Log ──

export interface TdLogFilters {
  status: string;
  source: string;
}

export function useTdPopulationLog(filters: TdLogFilters) {
  return useQuery({
    queryKey: ['td-population-log', filters],
    queryFn: async () => {
      let q = (supabase.from('td_population_log' as any) as any).select('*').order('created_at', { ascending: false }).limit(200);
      if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
      if (filters.source && filters.source !== 'all') q = q.eq('source', filters.source);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
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
