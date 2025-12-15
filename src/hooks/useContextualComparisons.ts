import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getBaseMaterial, normalizeStrengthIndex, ScoreType } from '@/lib/scoreCardService';

export interface ComparisonFilament {
  id: string;
  name: string;
  vendor: string;
  score: number;
}

export interface ContextualComparisonResult {
  betterThan: ComparisonFilament[];
  similarTo: ComparisonFilament[];
  notAsGoodAs: ComparisonFilament[];
}

export function useContextualComparisons(
  filamentId: string,
  material: string | null,
  scoreType: ScoreType,
  currentScore: number
) {
  return useQuery({
    queryKey: ['contextual-comparisons', filamentId, material, scoreType],
    queryFn: async (): Promise<ContextualComparisonResult> => {
      const baseMaterial = getBaseMaterial(material);
      
      // Query filaments with same material type - select all needed fields explicitly
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, ease_of_printing_score, strength_index, value_score')
        .ilike('material', `%${baseMaterial}%`)
        .not('id', 'eq', filamentId)
        .limit(50);
      
      if (error || !data) {
        return { betterThan: [], similarTo: [], notAsGoodAs: [] };
      }
      
      // Filter by score type and normalize scores
      const normalizedCurrent = scoreType === 'strength_index' && currentScore < 1
        ? normalizeStrengthIndex(currentScore)
        : currentScore;
      
      const processedData = data
        .map(f => {
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
          
          if (score === null) return null;
          
          return {
            id: f.id,
            name: f.product_title,
            vendor: f.vendor || 'Unknown',
            score,
          };
        })
        .filter((f): f is ComparisonFilament => f !== null);
      
      // Sort by score descending
      processedData.sort((a, b) => b.score - a.score);
      
      // Categorize based on score difference
      const SIMILAR_THRESHOLD = 0.3;
      
      const betterThan = processedData.filter(f => normalizedCurrent - f.score > SIMILAR_THRESHOLD);
      const similarTo = processedData.filter(f => Math.abs(normalizedCurrent - f.score) <= SIMILAR_THRESHOLD);
      const notAsGoodAs = processedData.filter(f => f.score - normalizedCurrent > SIMILAR_THRESHOLD);
      
      return {
        betterThan: betterThan.slice(0, 3),
        similarTo: similarTo.slice(0, 3),
        notAsGoodAs: notAsGoodAs.slice(0, 3),
      };
    },
    enabled: !!material && currentScore > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
