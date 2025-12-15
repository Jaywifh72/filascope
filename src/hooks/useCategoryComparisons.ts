import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getBaseMaterial, normalizeStrengthIndex, ScoreType } from '@/lib/scoreCardService';

export interface CategoryStats {
  label: string;
  avg: number;
  percentile: number;
  count: number;
}

export interface CategoryComparisonResult {
  budget: CategoryStats | null;
  midRange: CategoryStats | null;
  premium: CategoryStats | null;
}

// Price tiers in $/kg
const PRICE_TIERS = {
  budget: { max: 18 },
  midRange: { min: 18, max: 25 },
  premium: { min: 25 },
};

export function useCategoryComparisons(
  filamentId: string,
  material: string | null,
  scoreType: ScoreType,
  currentScore: number
) {
  return useQuery({
    queryKey: ['category-comparisons', filamentId, material, scoreType],
    queryFn: async (): Promise<CategoryComparisonResult> => {
      const baseMaterial = getBaseMaterial(material);
      
      // Query all filaments with same material type including price - select explicit columns
      const { data, error } = await supabase
        .from('filaments')
        .select('id, ease_of_printing_score, strength_index, value_score, variant_price, net_weight_g')
        .ilike('material', `%${baseMaterial}%`)
        .not('variant_price', 'is', null)
        .not('net_weight_g', 'is', null);
      
      if (error || !data) {
        return { budget: null, midRange: null, premium: null };
      }
      
      // Calculate price per kg and categorize
      const categorized = {
        budget: [] as number[],
        midRange: [] as number[],
        premium: [] as number[],
      };
      
      // Normalize current score
      const normalizedCurrent = scoreType === 'strength_index' && currentScore < 1
        ? normalizeStrengthIndex(currentScore)
        : currentScore;
      
      data.forEach(f => {
        if (!f.variant_price || !f.net_weight_g) return;
        
        const pricePerKg = f.variant_price / (f.net_weight_g / 1000);
        
        // Get score based on type
        let score: number | null = null;
        switch (scoreType) {
          case 'ease_of_printing':
            score = f.ease_of_printing_score;
            break;
          case 'strength_index':
            score = f.strength_index;
            if (score !== null && score < 1) {
              score = normalizeStrengthIndex(score);
            }
            break;
          case 'value_score':
            score = f.value_score;
            break;
        }
        
        if (score === null) return;
        
        if (pricePerKg < PRICE_TIERS.budget.max) {
          categorized.budget.push(score);
        } else if (pricePerKg >= PRICE_TIERS.midRange.min && pricePerKg < PRICE_TIERS.midRange.max) {
          categorized.midRange.push(score);
        } else if (pricePerKg >= PRICE_TIERS.premium.min) {
          categorized.premium.push(score);
        }
      });
      
      // Calculate stats for each category
      const calculateStats = (scores: number[], label: string): CategoryStats | null => {
        if (scores.length < 3) return null;
        
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const sorted = [...scores].sort((a, b) => a - b);
        const rank = sorted.filter(s => s < normalizedCurrent).length;
        const percentile = Math.round((rank / sorted.length) * 100);
        
        return {
          label,
          avg: Math.round(avg * 10) / 10,
          percentile,
          count: scores.length,
        };
      };
      
      return {
        budget: calculateStats(categorized.budget, 'Budget'),
        midRange: calculateStats(categorized.midRange, 'Mid-Range'),
        premium: calculateStats(categorized.premium, 'Premium'),
      };
    },
    enabled: !!material && currentScore > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
