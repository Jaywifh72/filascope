import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  SmartComparisonSuggestion,
  getSmartComparisonContext,
  scoreComparisonRelevance,
  toComparisonSuggestion
} from "@/lib/smartComparisonService";

interface FilamentForComparison {
  id: string;
  product_title: string;
  material: string | null;
  vendor: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  strength_index: number | null;
  printability_index: number | null;
  color_hex: string | null;
}

interface UseSmartComparisonsResult {
  suggestions: SmartComparisonSuggestion[];
  primarySuggestion: SmartComparisonSuggestion | null;
  isLoading: boolean;
}

export function useSmartComparisons(
  currentFilament: FilamentForComparison | null,
  limit: number = 3
): UseSmartComparisonsResult {
  const [candidates, setCandidates] = useState<FilamentForComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get comparison context based on current filament
  const context = useMemo(() => {
    if (!currentFilament) return null;
    return getSmartComparisonContext(currentFilament);
  }, [currentFilament?.id, currentFilament?.product_title, currentFilament?.material]);

  // Fetch candidate filaments for comparison
  useEffect(() => {
    if (!currentFilament || !context) {
      setIsLoading(false);
      return;
    }

    const fetchCandidates = async () => {
      setIsLoading(true);
      
      try {
        // Build query to find relevant candidates
        const baseMaterial = currentFilament.material?.split(/[\s-]+/)[0] || "PLA";
        
        // Get materials to search for
        const materialsToSearch = [baseMaterial];
        if (context.materialAlternatives) {
          materialsToSearch.push(...context.materialAlternatives.materials.map(m => m.toUpperCase()));
        }

        // Query for candidates - same or alternative materials
        const { data, error } = await supabase
          .from("filaments")
          .select("id, product_title, material, vendor, variant_price, net_weight_g, strength_index, printability_index, color_hex")
          .neq("id", currentFilament.id)
          .not("variant_price", "is", null)
          .limit(50);

        if (error) {
          console.error("Error fetching comparison candidates:", error);
          setCandidates([]);
        } else {
          // Filter to relevant materials
          const filtered = (data || []).filter(f => {
            const fMaterial = f.material?.split(/[\s-]+/)[0]?.toUpperCase() || "";
            return materialsToSearch.some(m => fMaterial.includes(m.toUpperCase()));
          });
          setCandidates(filtered);
        }
      } catch (err) {
        console.error("Error in fetchCandidates:", err);
        setCandidates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, [currentFilament?.id, context]);

  // Score and rank candidates
  const suggestions = useMemo(() => {
    if (!currentFilament || !context || candidates.length === 0) {
      return [];
    }

    const scored = candidates.map(candidate => {
      const relevance = scoreComparisonRelevance(currentFilament, candidate, context);
      return {
        suggestion: toComparisonSuggestion(candidate, relevance),
        score: relevance.score
      };
    });

    // Sort by score descending and take top N
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.suggestion);
  }, [currentFilament, context, candidates, limit]);

  return {
    suggestions,
    primarySuggestion: suggestions[0] || null,
    isLoading
  };
}
