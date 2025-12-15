import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  calculatePriceComparison,
  generateDifferentiators,
  getBestForDescription,
  calculateOverallScore,
  type PriceComparison,
  type Differentiator,
} from "@/lib/filamentDifferentiators";

export interface EnhancedSimilarFilament {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  featured_image: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  pricePerKg: number | null;
  value_score: number | null;
  ease_of_printing_score: number | null;
  strength_index: number | null;
  printability_index: number | null;
  overallScore: number | null;
  priceComparison: PriceComparison | null;
  differentiators: Differentiator[];
  bestFor: string;
  recommendationReason: 'budget_alternative' | 'premium_option' | 'same_family' | 'similar_properties';
  relevanceScore: number;
}

interface UseEnhancedSimilarFilamentsResult {
  recommendations: EnhancedSimilarFilament[];
  isLoading: boolean;
}

function calculatePricePerKg(price: number | null, weightG: number | null): number | null {
  if (!price || !weightG || weightG <= 0) return null;
  return price / (weightG / 1000);
}

export function useEnhancedSimilarFilaments(
  filamentId: string,
  material: string | null | undefined,
  vendor: string | null | undefined,
  currentPricePerKg: number | null,
  currentScores: {
    ease_of_printing_score?: number | null;
    value_score?: number | null;
    strength_index?: number | null;
    printability_index?: number | null;
  }
): UseEnhancedSimilarFilamentsResult {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!filamentId || !material) {
      setIsLoading(false);
      return;
    }

    const fetchCandidates = async () => {
      setIsLoading(true);
      try {
        const baseMaterial = material.split(/[\s-]+/)[0];

        const { data, error } = await supabase
          .from("filaments")
          .select(`
            id, product_title, vendor, material, featured_image,
            variant_price, net_weight_g, value_score, ease_of_printing_score,
            strength_index, printability_index
          `)
          .neq("id", filamentId)
          .ilike("material", `${baseMaterial}%`)
          .not("variant_price", "is", null)
          .not("net_weight_g", "is", null)
          .limit(20);

        if (error) {
          console.error("Error fetching similar filaments:", error);
          setCandidates([]);
        } else {
          setCandidates(data || []);
        }
      } catch (err) {
        console.error("Error in useEnhancedSimilarFilaments:", err);
        setCandidates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, [filamentId, material]);

  const recommendations = useMemo(() => {
    if (candidates.length === 0) return [];

    const enhanced: EnhancedSimilarFilament[] = candidates.map((filament) => {
      const pricePerKg = calculatePricePerKg(filament.variant_price, filament.net_weight_g);
      const priceComparison = calculatePriceComparison(currentPricePerKg, pricePerKg);
      const differentiators = generateDifferentiators(currentScores, {
        ease_of_printing_score: filament.ease_of_printing_score,
        value_score: filament.value_score,
        strength_index: filament.strength_index,
        printability_index: filament.printability_index,
      });
      const bestFor = getBestForDescription(filament.material, {
        ease_of_printing_score: filament.ease_of_printing_score,
        value_score: filament.value_score,
        strength_index: filament.strength_index,
      });
      const overallScore = calculateOverallScore(filament);

      // Determine recommendation reason
      let recommendationReason: EnhancedSimilarFilament['recommendationReason'] = 'same_family';
      if (priceComparison?.color === 'green' && Math.abs(priceComparison.percentDifference) > 15) {
        recommendationReason = 'budget_alternative';
      } else if (priceComparison?.color === 'red' && overallScore && overallScore > 7.5) {
        recommendationReason = 'premium_option';
      } else if (filament.vendor !== vendor) {
        recommendationReason = 'similar_properties';
      }

      // Calculate relevance score
      let relevanceScore = 0.5;
      if (filament.vendor !== vendor) relevanceScore += 0.2; // Prefer different brands
      if (priceComparison?.color === 'green') relevanceScore += 0.15;
      if (overallScore && overallScore > 7) relevanceScore += 0.1;
      if (filament.featured_image) relevanceScore += 0.05;

      return {
        id: filament.id,
        product_title: filament.product_title,
        vendor: filament.vendor,
        material: filament.material,
        featured_image: filament.featured_image,
        variant_price: filament.variant_price,
        net_weight_g: filament.net_weight_g,
        pricePerKg,
        value_score: filament.value_score,
        ease_of_printing_score: filament.ease_of_printing_score,
        strength_index: filament.strength_index,
        printability_index: filament.printability_index,
        overallScore,
        priceComparison,
        differentiators,
        bestFor,
        recommendationReason,
        relevanceScore,
      };
    });

    // Sort by relevance and return top 6
    return enhanced
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 6);
  }, [candidates, currentPricePerKg, currentScores, vendor]);

  return { recommendations, isLoading };
}
