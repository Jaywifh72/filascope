import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReviewForSchema {
  authorName: string;
  datePublished: string;
  ratingValue: number;
  reviewBody: string | null;
  headline: string | null;
}

/**
 * Fetches up to 5 published, public reviews for a filament product,
 * joining with profiles to get the reviewer's display name.
 * Used exclusively for Product JSON-LD schema injection.
 */
export function useFilamentReviewsForSchema(productId: string | undefined) {
  return useQuery({
    queryKey: ['filament-reviews-schema', productId],
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 min — schema data doesn't need to be fresh
    queryFn: async (): Promise<ReviewForSchema[]> => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          overall_rating,
          headline,
          body,
          created_at,
          user_id,
          profiles!product_reviews_user_id_fkey(display_name)
        `)
        .eq('product_id', productId!)
        .eq('is_public', true)
        .eq('status', 'published')
        .is('deleted_at', null)
        .not('body', 'is', null) // Only include reviews with text
        .order('helpful_count', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data.map((r) => ({
        authorName: (r.profiles as any)?.display_name || 'FilaScope User',
        datePublished: r.created_at.split('T')[0], // YYYY-MM-DD
        ratingValue: r.overall_rating,
        reviewBody: r.body,
        headline: r.headline,
      }));
    },
  });
}
