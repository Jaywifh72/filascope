import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  calculatePriceComparison,
  generateDifferentiators,
  getBestForDescription,
  calculateOverallScore,
  calculatePricePerKg,
  type PriceComparison,
  type Differentiator,
} from "@/lib/filamentDifferentiators";
import {
  calculateRecommendationFactors,
  applyNegativeFilters,
  ensureDiversity,
  generateExplanation,
  type RecommendationFactors,
  type RecommendationExplanation,
  type UserContext,
  type ScoredCandidate,
} from "@/lib/recommendationScoring";
import type { SkillLevel } from "@/lib/skillLevels";

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
  factors: RecommendationFactors;
  explanation: RecommendationExplanation;
  isTrending: boolean;
}

interface UseEnhancedSimilarFilamentsOptions {
  favoriteFilamentIds?: string[];
  printerSpecs?: UserContext["printerSpecs"];
  skillLevel?: SkillLevel;
  priceSensitivity?: "budget" | "moderate" | "premium";
  browseHistory?: Array<{ vendor?: string | null }>;
  limit?: number;
}

interface UseEnhancedSimilarFilamentsResult {
  recommendations: EnhancedSimilarFilament[];
  isLoading: boolean;
}

interface ExtendedCandidate extends ScoredCandidate {
  featured_image: string | null;
  differentiators: Differentiator[];
  bestFor: string;
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
  },
  options: UseEnhancedSimilarFilamentsOptions = {}
): UseEnhancedSimilarFilamentsResult {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    favoriteFilamentIds = [],
    printerSpecs = null,
    skillLevel = "intermediate",
    priceSensitivity = "moderate",
    browseHistory = [],
    limit = 6,
  } = options;

  // Fetch candidates
  useEffect(() => {
    if (!filamentId || !material) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const baseMaterial = material.split(/[\s-]+/)[0];

        const { data, error } = await supabase
          .from("filaments")
          .select(`
            id, product_id, product_title, vendor, material, featured_image,
            variant_price, net_weight_g, value_score, ease_of_printing_score,
            strength_index, printability_index, use_case_tags,
            nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, is_nozzle_abrasive
          `)
          .neq("id", filamentId)
          .ilike("material", `${baseMaterial}%`)
          .not("variant_price", "is", null)
          .not("net_weight_g", "is", null)
          .limit(30);

        if (error) {
          console.error("Error fetching candidates:", error);
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

    fetchData();
  }, [filamentId, material]);

  // Build user context
  const userContext: UserContext = useMemo(
    () => ({
      favoriteFilamentIds,
      topMaterials: [],
      printerSpecs,
      skillLevel,
      priceSensitivity,
      browseHistory,
    }),
    [favoriteFilamentIds, printerSpecs, skillLevel, priceSensitivity, browseHistory]
  );

  // Current filament for comparison
  const currentFilament = useMemo(
    () => ({
      id: filamentId,
      product_title: "",
      vendor: vendor || null,
      material: material || null,
      variant_price: null,
      net_weight_g: null,
      ease_of_printing_score: currentScores.ease_of_printing_score,
      value_score: currentScores.value_score,
      strength_index: currentScores.strength_index,
      printability_index: currentScores.printability_index,
    }),
    [filamentId, vendor, material, currentScores]
  );

  // Process and score recommendations
  const recommendations = useMemo(() => {
    if (candidates.length === 0) return [];

    // Score and filter all candidates
    const scoredCandidates: ExtendedCandidate[] = [];

    for (const candidate of candidates) {
      const pricePerKg = calculatePricePerKg(candidate.variant_price, candidate.net_weight_g);
      
      // Apply negative filters first
      const filterResult = applyNegativeFilters(
        candidate,
        currentFilament,
        pricePerKg,
        currentPricePerKg,
        userContext
      );

      if (filterResult.shouldExclude) {
        continue;
      }

      // Calculate all factors
      const factors = calculateRecommendationFactors(
        currentFilament,
        candidate,
        currentPricePerKg,
        pricePerKg,
        { userContext }
      );

      const priceComparison = calculatePriceComparison(currentPricePerKg, pricePerKg);
      const differentiators = generateDifferentiators(currentScores, {
        ease_of_printing_score: candidate.ease_of_printing_score,
        value_score: candidate.value_score,
        strength_index: candidate.strength_index,
        printability_index: candidate.printability_index,
      });
      const bestFor = getBestForDescription(candidate.material, {
        ease_of_printing_score: candidate.ease_of_printing_score,
        value_score: candidate.value_score,
        strength_index: candidate.strength_index,
      });
      const overallScore = calculateOverallScore(candidate);
      const isTrending = factors.trendingScore > 0.6;

      scoredCandidates.push({
        ...candidate,
        pricePerKg,
        factors,
        priceComparison,
        overallScore,
        isTrending,
        differentiators,
        bestFor,
        featured_image: candidate.featured_image,
      });
    }

    // Apply diversity enforcement
    const diverse = ensureDiversity(scoredCandidates, vendor, limit);

    // Generate explanations and build final result
    return diverse.map((candidate) => {
      const extCandidate = candidate as ExtendedCandidate;
      const explanation = generateExplanation(
        candidate,
        candidate.factors,
        vendor,
        userContext
      );

      return {
        id: candidate.id,
        product_title: candidate.product_title,
        vendor: candidate.vendor,
        material: candidate.material,
        featured_image: extCandidate.featured_image,
        variant_price: candidate.variant_price,
        net_weight_g: candidate.net_weight_g,
        pricePerKg: candidate.pricePerKg,
        value_score: candidate.value_score,
        ease_of_printing_score: candidate.ease_of_printing_score,
        strength_index: candidate.strength_index,
        printability_index: candidate.printability_index,
        overallScore: candidate.overallScore,
        priceComparison: candidate.priceComparison,
        differentiators: extCandidate.differentiators,
        bestFor: extCandidate.bestFor,
        factors: candidate.factors,
        explanation,
        isTrending: candidate.isTrending || false,
      } as EnhancedSimilarFilament;
    });
  }, [candidates, currentPricePerKg, currentScores, vendor, currentFilament, userContext, limit]);

  return { recommendations, isLoading };
}
