import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseRelatedFilamentsOptions {
  material?: string;
  limit?: number;
}

interface RelatedFilament {
  id: string;
  product_title: string;
  product_handle: string | null;
  vendor: string;
  variant_price: number | null;
  color_hex: string | null;
  transmission_distance: number | null;
}

export function useRelatedFilaments({ material, limit = 6 }: UseRelatedFilamentsOptions) {
  return useQuery<RelatedFilament[]>({
    queryKey: ['relatedFilaments', material, limit],
    queryFn: async () => {
      if (!material) return [];
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, product_handle, vendor, variant_price, color_hex, transmission_distance')
        .eq('material', material)
        .not('variant_price', 'is', null)
        .order('filascope_score', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!material,
    staleTime: 5 * 60 * 1000,
  });
}
