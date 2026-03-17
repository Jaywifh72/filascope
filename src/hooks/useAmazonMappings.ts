import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AmazonMapping {
  id: string;
  filament_id: string;
  asin: string;
  marketplace: string;
  amazon_title: string | null;
  brand_name: string | null;
  product_group: string | null;
  parent_asin: string | null;
  spool_count: number;
  weight_kg: number | null;
  match_confidence: string;
  match_source: string | null;
  matched_at: string;
  verified_at: string | null;
  listing_id: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  filament_name?: string;
  filament_brand?: string;
  filament_material?: string;
  filament_color?: string;
  current_price?: number | null;
  currency?: string | null;
  last_scraped_at?: string | null;
  rating?: number | null;
  review_count?: number | null;
  stock_status?: string | null;
}

export interface AmazonMappingFilters {
  brandSlug?: string;
  marketplace?: string;
  confidence?: string;
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export function useAmazonMappings(filters: AmazonMappingFilters = {}) {
  return useQuery({
    queryKey: ['amazon-mappings', filters],
    queryFn: async () => {
      // We query the mapping table and join with filaments for display
      let query = supabase
        .from('amazon_product_mappings')
        .select(`
          *,
          filaments!inner (
            id,
            product_title,
            vendor,
            material,
            color_family
          )
        `)
        .order('updated_at', { ascending: false });

      if (filters.marketplace) {
        query = query.eq('marketplace', filters.marketplace);
      }
      if (filters.confidence) {
        query = query.eq('match_confidence', filters.confidence);
      }
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Flatten joined data
      return (data || []).map((row: any) => ({
        ...row,
        filament_name: row.filaments?.product_title,
        filament_brand: row.filaments?.vendor,
        filament_material: row.filaments?.material,
        filament_color: row.filaments?.color_family,
        filaments: undefined,
      })) as AmazonMapping[];
    },
    staleTime: 30_000,
  });
}

export function useAmazonMappingStats() {
  return useQuery({
    queryKey: ['amazon-mapping-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('amazon_product_mappings')
        .select('marketplace, match_confidence, is_active')
        .eq('is_active', true);

      if (error) throw error;

      const total = data?.length || 0;
      const byMarketplace: Record<string, number> = {};
      const byConfidence: Record<string, number> = {};

      data?.forEach((row: any) => {
        byMarketplace[row.marketplace] = (byMarketplace[row.marketplace] || 0) + 1;
        byConfidence[row.match_confidence] = (byConfidence[row.match_confidence] || 0) + 1;
      });

      return { total, byMarketplace, byConfidence };
    },
    staleTime: 60_000,
  });
}

export function useAmazonBrandCoverage() {
  return useQuery({
    queryKey: ['amazon-brand-coverage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_amazon_brand_coverage' as any)
        .select('*')
        .gt('total_filaments', 0)
        .order('total_filaments', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });
}

export function useCreateAmazonMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mapping: {
      filament_id: string;
      asin: string;
      marketplace: string;
      amazon_title?: string;
      match_confidence?: string;
      match_source?: string;
      spool_count?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('amazon_product_mappings')
        .insert({
          ...mapping,
          match_confidence: mapping.match_confidence || 'manual',
          match_source: mapping.match_source || 'manual_entry',
          spool_count: mapping.spool_count || 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amazon-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['amazon-mapping-stats'] });
      queryClient.invalidateQueries({ queryKey: ['amazon-brand-coverage'] });
    },
  });
}

export function useUpdateAmazonMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<AmazonMapping>) => {
      const { data, error } = await supabase
        .from('amazon_product_mappings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amazon-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['amazon-mapping-stats'] });
    },
  });
}

export function useDeleteAmazonMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('amazon_product_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amazon-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['amazon-mapping-stats'] });
      queryClient.invalidateQueries({ queryKey: ['amazon-brand-coverage'] });
    },
  });
}

export function useBulkVerifyMappings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('amazon_product_mappings')
        .update({
          match_confidence: 'verified',
          verified_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amazon-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['amazon-mapping-stats'] });
    },
  });
}
