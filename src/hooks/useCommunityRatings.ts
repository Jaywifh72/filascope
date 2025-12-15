import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CommunityRatingStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    rating: number;
    count: number;
  }[];
  positiveCount: number;
  mixedCount: number;
  negativeCount: number;
}

export interface CommunityRatingsData {
  easeOfPrinting: CommunityRatingStats | null;
  strengthIndex: CommunityRatingStats | null;
  valueScore: CommunityRatingStats | null;
  overallStats: {
    totalReviews: number;
    averageRating: number;
  };
  isLoading: boolean;
  error: string | null;
}

function calculateStats(ratings: { rating: number }[]): CommunityRatingStats | null {
  if (ratings.length === 0) return null;

  const distribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: ratings.filter(r => r.rating === rating).length,
  }));

  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  const average = sum / ratings.length;

  return {
    averageRating: Math.round(average * 10) / 10,
    totalReviews: ratings.length,
    distribution,
    positiveCount: ratings.filter(r => r.rating >= 4).length,
    mixedCount: ratings.filter(r => r.rating === 3).length,
    negativeCount: ratings.filter(r => r.rating <= 2).length,
  };
}

export function useCommunityRatings(filamentId: string | undefined): CommunityRatingsData {
  const [data, setData] = useState<CommunityRatingsData>({
    easeOfPrinting: null,
    strengthIndex: null,
    valueScore: null,
    overallStats: { totalReviews: 0, averageRating: 0 },
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!filamentId) {
      setData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchRatings = async () => {
      try {
        const { data: ratings, error } = await supabase
          .from('filament_user_ratings')
          .select('score_type, rating')
          .eq('filament_id', filamentId);

        if (error) throw error;

        const easeRatings = (ratings || []).filter(r => r.score_type === 'ease_of_printing');
        const strengthRatings = (ratings || []).filter(r => r.score_type === 'strength_index');
        const valueRatings = (ratings || []).filter(r => r.score_type === 'value_score');

        const allRatings = ratings || [];
        const totalReviews = new Set(allRatings.map(r => r.rating)).size > 0 ? allRatings.length : 0;
        const averageRating = allRatings.length > 0
          ? Math.round((allRatings.reduce((acc, r) => acc + r.rating, 0) / allRatings.length) * 10) / 10
          : 0;

        setData({
          easeOfPrinting: calculateStats(easeRatings),
          strengthIndex: calculateStats(strengthRatings),
          valueScore: calculateStats(valueRatings),
          overallStats: { totalReviews, averageRating },
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load ratings',
        }));
      }
    };

    fetchRatings();
  }, [filamentId]);

  return data;
}
