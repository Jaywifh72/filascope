import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRegion } from '@/contexts/RegionContext';
import { ItemListSchema } from './ItemListSchema';

interface TrendingFilament {
  id: string;
  product_title: string;
  product_handle?: string | null;
}

function useTrendingFilamentsForSchema(regionCode: string) {
  return useQuery({
    queryKey: ['trending-filaments-schema', regionCode],
    queryFn: async (): Promise<TrendingFilament[]> => {
      // Primary: filaments with available listings in the user's region
      const { data: regional, error: regionalError } = await supabase
        .from('filament_listings')
        .select(`
          filament_id,
          current_price,
          filaments!inner (
            id, product_title, product_handle
          )
        `)
        .eq('region', regionCode)
        .eq('available', true)
        .not('current_price', 'is', null)
        .order('current_price', { ascending: true })
        .limit(12);

      if (!regionalError && regional && regional.length >= 4) {
        const seen = new Set<string>();
        const results: TrendingFilament[] = [];
        for (const row of regional) {
          const f = row.filaments as any;
          if (!f || seen.has(f.id)) continue;
          seen.add(f.id);
          results.push({ id: f.id, product_title: f.product_title, product_handle: f.product_handle });
          if (results.length >= 10) break;
        }
        if (results.length >= 4) return results;
      }

      // Fallback: global value_score
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, product_handle')
        .not('variant_price', 'is', null)
        .not('color_hex', 'is', null)
        .order('value_score', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as TrendingFilament[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function TrendingItemListSchema() {
  const { region } = useRegion();
  const { data: filaments } = useTrendingFilamentsForSchema(region);

  if (!filaments || filaments.length === 0) return null;

  const items = filaments.slice(0, 10).map((f, i) => ({
    name: f.product_title,
    url: `https://filascope.com/filament/${f.product_handle || f.id}`,
    position: i + 1,
  }));

  return (
    <ItemListSchema
      name="Trending 3D Printer Filaments"
      description="The most popular 3D printer filaments ranked by value and availability"
      itemListOrder="Descending"
      items={items}
    />
  );
}
