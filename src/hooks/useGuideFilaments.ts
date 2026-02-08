import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateUnifiedScore, type FilamentForScoring, type UnifiedScoreResult } from '@/lib/unifiedFilamentScore';

export interface GuideFilament {
  id: string;
  product_title: string;
  vendor: string;
  material: string;
  color_family: string | null;
  color_hex: string | null;
  featured_image: string | null;
  product_handle: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  pack_quantity: number | null;
  transmission_distance: number | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  diameter_nominal_mm: number | null;
  density_g_cm3: number | null;
  tds_url: string | null;
  tensile_strength_xy_mpa: number | null;
  flexural_strength_mpa: number | null;
  elongation_break_xy_percent: number | null;
  high_speed_capable: boolean | null;
  finish_type: string | null;
  product_url: string | null;
  amazon_link_us: string | null;
  product_url_ca: string | null;
  product_url_uk: string | null;
  product_url_eu: string | null;
  product_url_au: string | null;
  product_url_jp: string | null;
  price_cad: number | null;
  price_eur: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  price_jpy: number | null;
  // Computed
  score: UnifiedScoreResult;
}

export interface GuideFilamentFilters {
  material?: string;
  materials?: string[]; // for VS guides needing multiple
  requireTD?: boolean;
  sortBy?: 'score' | 'td' | 'price' | 'ease';
  limit?: number;
}

const GUIDE_SELECT = `
  id, product_title, vendor, material, color_family, color_hex,
  featured_image, product_handle, variant_price, net_weight_g, pack_quantity,
  transmission_distance, nozzle_temp_min_c, nozzle_temp_max_c,
  bed_temp_min_c, bed_temp_max_c, diameter_nominal_mm, density_g_cm3,
  tds_url, tensile_strength_xy_mpa, flexural_strength_mpa,
  elongation_break_xy_percent, high_speed_capable, finish_type,
  product_url, amazon_link_us, product_url_ca, product_url_uk,
  product_url_eu, product_url_au, product_url_jp,
  price_cad, price_eur, price_gbp, price_aud, price_jpy
`;

export function useGuideFilaments(filters: GuideFilamentFilters) {
  const { material, materials, requireTD, sortBy = 'score', limit = 10 } = filters;

  return useQuery({
    queryKey: ['guide-filaments', material, materials, requireTD, sortBy, limit],
    queryFn: async (): Promise<GuideFilament[]> => {
      let query = supabase
        .from('filaments')
        .select(GUIDE_SELECT)
        .not('variant_price', 'is', null)
        .not('featured_image', 'is', null);

      if (material) {
        query = query.ilike('material', `%${material}%`);
      }

      if (materials && materials.length > 0) {
        // OR filter for multiple materials
        const orFilter = materials.map(m => `material.ilike.%${m}%`).join(',');
        query = query.or(orFilter);
      }

      if (requireTD) {
        query = query.not('transmission_distance', 'is', null);
      }

      const { data, error } = await query.limit(200); // fetch more, score & trim client-side

      if (error) throw error;
      if (!data) return [];

      // Deduplicate by product_handle (keep highest-priced variant as representative)
      const byHandle = new Map<string, typeof data[0]>();
      for (const row of data) {
        const key = row.product_handle || row.id;
        const existing = byHandle.get(key);
        if (!existing || (row.variant_price ?? 0) > (existing.variant_price ?? 0)) {
          byHandle.set(key, row);
        }
      }

      const unique = Array.from(byHandle.values());

      // Score all filaments
      const scored: GuideFilament[] = unique.map(f => ({
        ...f,
        product_title: f.product_title || '',
        vendor: f.vendor || '',
        material: f.material || '',
        score: calculateUnifiedScore(f as FilamentForScoring),
      }));

      // Sort
      scored.sort((a, b) => {
        switch (sortBy) {
          case 'td':
            return (a.transmission_distance ?? 999) - (b.transmission_distance ?? 999);
          case 'price':
            return (a.variant_price ?? 999) - (b.variant_price ?? 999);
          case 'score':
          default:
            return (b.score.score ?? 0) - (a.score.score ?? 0);
        }
      });

      return scored.slice(0, limit);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
