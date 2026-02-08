import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ColorFinderFilament {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  color_hex: string | null;
  color_family: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  featured_image: string | null;
  product_handle: string | null;
  transmission_distance: number | null;
  pack_quantity: number | null;
  price_cad: number | null;
  price_eur: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  price_jpy: number | null;
}

export function useColorFinderFilaments() {
  return useQuery({
    queryKey: ['color-finder-filaments'],
    queryFn: async (): Promise<ColorFinderFilament[]> => {
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, material, color_hex, color_family, variant_price, net_weight_g, featured_image, product_handle, transmission_distance, pack_quantity, price_cad, price_eur, price_gbp, price_aud, price_jpy')
        .not('color_hex', 'is', null);

      if (error) throw error;
      return (data || []) as ColorFinderFilament[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });
}
