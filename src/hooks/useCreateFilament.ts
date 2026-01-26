import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FilamentInsertData {
  product_url: string;
  vendor: string;
  source_type: string;
  product_title: string;
  material?: string;
  diameter: string;
  net_weight_g: number;
  color_name?: string;
  color_hex?: string;
  msrp: number;
  variant_price?: number;
  variant_compare_at_price?: number;
  featured_image?: string;
  nozzle_temp_min_c?: number;
  nozzle_temp_max_c?: number;
  bed_temp_min_c?: number;
  bed_temp_max_c?: number;
  admin_notes?: string;
}

export function useCreateFilament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FilamentInsertData) => {
      const insertData = {
        product_title: data.product_title,
        display_name: data.product_title,
        product_url: data.product_url,
        vendor: data.vendor,
        material: data.material || null,
        diameter: data.diameter,
        weight_grams: data.net_weight_g,
        color_name: data.color_name || null,
        color_hex: data.color_hex || null,
        msrp: data.msrp,
        variant_price: data.variant_price || null,
        variant_compare_at_price: data.variant_compare_at_price || null,
        image_url: data.featured_image || null,
        nozzle_temp_min_c: data.nozzle_temp_min_c || null,
        nozzle_temp_max_c: data.nozzle_temp_max_c || null,
        bed_temp_min_c: data.bed_temp_min_c || null,
        bed_temp_max_c: data.bed_temp_max_c || null,
        admin_notes: data.admin_notes || null,
        sync_enabled: true,
      };

      const { data: result, error } = await supabase
        .from('filaments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      toast.success('Filament created successfully', {
        description: result.product_title || result.display_name,
      });
    },
    onError: (err) => {
      toast.error('Failed to create filament', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-filaments'] });
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
      queryClient.invalidateQueries({ queryKey: ['filament'] });
    },
  });
}
