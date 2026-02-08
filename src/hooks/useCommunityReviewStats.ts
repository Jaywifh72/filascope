import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CommunityReviewStats {
  avgRating: number;
  reviewCount: number;
  avgQuality: number | null;
  avgEase: number | null;
  avgValue: number | null;
}

/**
 * Fetch community review stats for a single product.
 * Queries product_reviews directly with aggregation.
 */
export function useCommunityReviewStats(productId: string | undefined) {
  return useQuery({
    queryKey: ['community-review-stats', productId],
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CommunityReviewStats | null> => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('overall_rating, quality_rating, ease_rating, value_rating')
        .eq('product_id', productId!)
        .eq('is_public', true)
        .eq('status', 'published')
        .is('deleted_at', null);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const count = data.length;
      const avgRating = Math.round((data.reduce((s, r) => s + r.overall_rating, 0) / count) * 10) / 10;
      
      const qualityRatings = data.filter(r => r.quality_rating != null);
      const easeRatings = data.filter(r => r.ease_rating != null);
      const valueRatings = data.filter(r => r.value_rating != null);

      return {
        avgRating,
        reviewCount: count,
        avgQuality: qualityRatings.length > 0
          ? Math.round((qualityRatings.reduce((s, r) => s + r.quality_rating!, 0) / qualityRatings.length) * 10) / 10
          : null,
        avgEase: easeRatings.length > 0
          ? Math.round((easeRatings.reduce((s, r) => s + r.ease_rating!, 0) / easeRatings.length) * 10) / 10
          : null,
        avgValue: valueRatings.length > 0
          ? Math.round((valueRatings.reduce((s, r) => s + r.value_rating!, 0) / valueRatings.length) * 10) / 10
          : null,
      };
    },
  });
}

/**
 * Fetch community review stats for ALL filament products at once.
 * Returns a Map<productId, CommunityReviewStats>.
 * Used by listing pages for efficient bulk display.
 */
export function useBulkCommunityRatings() {
  return useQuery({
    queryKey: ['community-review-stats-bulk'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Map<string, CommunityReviewStats>> => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('product_id, overall_rating, quality_rating, ease_rating, value_rating')
        .eq('product_type', 'filament')
        .eq('is_public', true)
        .eq('status', 'published')
        .is('deleted_at', null);

      if (error) throw error;

      const map = new Map<string, CommunityReviewStats>();
      if (!data || data.length === 0) return map;

      // Group by product_id
      const grouped = new Map<string, typeof data>();
      for (const row of data) {
        const existing = grouped.get(row.product_id) || [];
        existing.push(row);
        grouped.set(row.product_id, existing);
      }

      for (const [productId, reviews] of grouped) {
        const count = reviews.length;
        const avgRating = Math.round((reviews.reduce((s, r) => s + r.overall_rating, 0) / count) * 10) / 10;
        
        const qualityRatings = reviews.filter(r => r.quality_rating != null);
        const easeRatings = reviews.filter(r => r.ease_rating != null);
        const valueRatings = reviews.filter(r => r.value_rating != null);

        map.set(productId, {
          avgRating,
          reviewCount: count,
          avgQuality: qualityRatings.length > 0
            ? Math.round((qualityRatings.reduce((s, r) => s + r.quality_rating!, 0) / qualityRatings.length) * 10) / 10
            : null,
          avgEase: easeRatings.length > 0
            ? Math.round((easeRatings.reduce((s, r) => s + r.ease_rating!, 0) / easeRatings.length) * 10) / 10
            : null,
          avgValue: valueRatings.length > 0
            ? Math.round((valueRatings.reduce((s, r) => s + r.value_rating!, 0) / valueRatings.length) * 10) / 10
            : null,
        });
      }

      return map;
    },
  });
}
