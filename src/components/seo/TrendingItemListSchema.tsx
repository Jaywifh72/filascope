import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRegion } from '@/contexts/RegionContext';
import { useJsonLd } from './useJsonLd';

interface TrendingFilament {
  id: string;
  product_title: string;
  product_handle?: string | null;
  current_price: number | null;
  brand_name: string | null;
  image_url: string | null;
  currency_code: string | null;
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
          currency,
          filaments!inner (
            id, product_title, product_handle, brand_name, image_url
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
          results.push({ id: f.id, product_title: f.product_title, product_handle: f.product_handle, current_price: row.current_price, brand_name: f.brand_name, image_url: f.image_url, currency_code: row.currency ?? null });
          if (results.length >= 10) break;
        }
        if (results.length >= 4) return results;
      }

      // Fallback: global value_score
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, product_handle, brand_name, image_url, variant_price')
        .not('variant_price', 'is', null)
        .not('color_hex', 'is', null)
        .order('value_score', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        product_title: d.product_title,
        product_handle: d.product_handle,
        current_price: d.variant_price,
        brand_name: d.brand_name,
        image_url: d.image_url,
        currency_code: 'USD',
      })) as TrendingFilament[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function TrendingItemListSchema() {
  const { region, regionConfig } = useRegion();
  const { data: filaments } = useTrendingFilamentsForSchema(region);

  const items = filaments?.slice(0, 10) ?? [];

  useJsonLd(
    items.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Trending 3D Printer Filaments in ${regionConfig.name}`,
          description: `The most popular 3D printer filaments this week, ranked by maker interest and engagement on FilaScope.`,
          numberOfItems: items.length,
          itemListOrder: 'https://schema.org/ItemListOrderDescending',
          itemListElement: items.map((f, i) => {
            const productUrl = `https://filascope.com/filament/${f.product_handle || f.id}`;
            return {
              '@type': 'ListItem',
              position: i + 1,
              name: f.product_title,
              url: productUrl,
              item: {
                '@type': 'Product',
                name: f.product_title,
                url: productUrl,
                ...(f.image_url && { image: f.image_url }),
                ...(f.brand_name && {
                  brand: { '@type': 'Organization', name: f.brand_name },
                }),
                ...(f.current_price != null && {
                  offers: {
                    '@type': 'Offer',
                    price: f.current_price.toFixed(2),
                    priceCurrency: f.currency_code || 'USD',
                    availability: 'https://schema.org/InStock',
                  },
                }),
              },
            };
          }),
        }
      : null,
  );

  return null;
}
