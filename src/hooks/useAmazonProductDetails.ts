import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AmazonProductDetail {
  id: string;
  mapping_id: string;
  asin: string;
  marketplace: string;
  rating: number | null;
  review_count: number | null;
  buy_box_seller: string | null;
  is_sold_by_brand: boolean | null;
  is_prime_eligible: boolean | null;
  is_addon_item: boolean;
  coupon_text: string | null;
  coupon_percent: number | null;
  coupon_amount_cents: number | null;
  deal_type: string | null;
  deal_end_at: string | null;
  subscribe_save_percent: number | null;
  main_image_url: string | null;
  stock_status: string;
  price_vs_msrp_ratio: number | null;
  is_price_anomaly: boolean;
  anomaly_reason: string | null;
  last_fetched_at: string;
}

/**
 * Fetch Amazon-specific product details for a filament.
 * Returns details for all marketplaces where this filament has an Amazon mapping.
 */
export function useAmazonProductDetails(filamentId: string | undefined) {
  return useQuery({
    queryKey: ['amazon-product-details', filamentId],
    queryFn: async () => {
      if (!filamentId) return [];

      const { data, error } = await supabase
        .from('amazon_product_mappings')
        .select(`
          id,
          asin,
          marketplace,
          amazon_title,
          spool_count,
          match_confidence,
          amazon_product_details (
            rating,
            review_count,
            buy_box_seller,
            is_sold_by_brand,
            is_prime_eligible,
            is_addon_item,
            coupon_text,
            coupon_percent,
            coupon_amount_cents,
            deal_type,
            deal_end_at,
            subscribe_save_percent,
            main_image_url,
            stock_status,
            is_price_anomaly,
            anomaly_reason,
            last_fetched_at
          )
        `)
        .eq('filament_id', filamentId)
        .eq('is_active', true);

      if (error) throw error;

      return (data || []).map((mapping: any) => {
        const details = mapping.amazon_product_details?.[0] || null;
        return {
          mappingId: mapping.id,
          asin: mapping.asin,
          marketplace: mapping.marketplace,
          amazonTitle: mapping.amazon_title,
          spoolCount: mapping.spool_count,
          matchConfidence: mapping.match_confidence,
          ...(details || {}),
        };
      }) as Array<AmazonProductDetail & {
        mappingId: string;
        asin: string;
        marketplace: string;
        amazonTitle: string | null;
        spoolCount: number;
        matchConfidence: string;
      }>;
    },
    enabled: !!filamentId,
    staleTime: 60_000,
  });
}

/**
 * Get the best Amazon details for a filament in the user's region.
 * Returns null if no Amazon mapping exists.
 */
export function useAmazonBestDetails(filamentId: string | undefined, userRegion: string = 'US') {
  const { data: allDetails, ...rest } = useAmazonProductDetails(filamentId);

  // Map regions to marketplaces
  const regionToMarketplace: Record<string, string> = {
    US: 'US',
    CA: 'CA',
    UK: 'UK',
    EU: 'DE', // Default EU marketplace
    AU: 'AU',
    JP: 'JP',
  };

  const targetMarketplace = regionToMarketplace[userRegion] || 'US';

  // Prefer user's region, fallback to US
  const bestDetail = allDetails?.find(d => d.marketplace === targetMarketplace)
    || allDetails?.find(d => d.marketplace === 'US')
    || allDetails?.[0]
    || null;

  return {
    data: bestDetail,
    allMarketplaces: allDetails || [],
    ...rest,
  };
}
