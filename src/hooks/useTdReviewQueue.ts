import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ReviewReason = 'td_missing' | 'low_confidence' | 'parse_failed' | 'manual_flag';
export type ReviewStatus = 'pending' | 'resolved' | 'ignored';

export interface TdReviewItem {
  id: string;
  filament_id: string;
  tds_url: string | null;
  reason: ReviewReason;
  extraction_attempt: Record<string, any> | null;
  notes: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  filament?: {
    id: string;
    product_title: string;
    vendor: string;
    material: string | null;
    transmission_distance: number | null;
  };
}

export function useTdReviewQueue(filters?: { status?: ReviewStatus; reason?: ReviewReason }) {
  return useQuery({
    queryKey: ['td-review-queue', filters],
    queryFn: async () => {
      let query = supabase
        .from('tds_review_queue')
        .select(`
          *,
          filament:filaments(id, product_title, vendor, material, transmission_distance)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.reason) {
        query = query.eq('reason', filters.reason);
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      return (data || []) as TdReviewItem[];
    },
    staleTime: 30000,
  });
}

export function useTdReviewStats() {
  return useQuery({
    queryKey: ['td-review-stats'],
    queryFn: async () => {
      const { data: pending } = await supabase
        .from('tds_review_queue')
        .select('reason', { count: 'exact', head: false })
        .eq('status', 'pending');

      const counts = {
        total: pending?.length || 0,
        td_missing: 0,
        low_confidence: 0,
        parse_failed: 0,
        manual_flag: 0,
      };

      pending?.forEach((item: any) => {
        if (item.reason in counts) {
          counts[item.reason as ReviewReason]++;
        }
      });

      return counts;
    },
    staleTime: 30000,
  });
}

export function useResolveReviewItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: 'resolved' | 'ignored'; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('tds_review_queue')
        .update({
          status,
          notes: notes || null,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['td-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['td-review-stats'] });
    },
  });
}

export function useAddToReviewQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      filament_id, 
      tds_url, 
      reason, 
      extraction_attempt,
      notes 
    }: { 
      filament_id: string; 
      tds_url?: string;
      reason: ReviewReason; 
      extraction_attempt?: Record<string, any>;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('tds_review_queue')
        .upsert({
          filament_id,
          tds_url: tds_url || null,
          reason,
          extraction_attempt: extraction_attempt || null,
          notes: notes || null,
          status: 'pending',
        }, {
          onConflict: 'filament_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['td-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['td-review-stats'] });
    },
  });
}
