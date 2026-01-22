import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SimilarFilamentData, SimilarityReason } from "@/components/filament/similar/SimilarFilamentCard";
import { MATERIAL_PRICE_TIERS } from "@/lib/materialPriceTiers";

interface UseSimilarFilamentsEnhancedResult {
  similarFilaments: SimilarFilamentData[];
  isLoading: boolean;
}

interface CurrentFilament {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  color_family: string | null;
}

export function useSimilarFilamentsEnhanced(
  currentFilament: CurrentFilament | null
): UseSimilarFilamentsEnhancedResult {
  const [candidates, setCandidates] = useState<SimilarFilamentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate current price per kg
  const currentPricePerKg = useMemo(() => {
    if (!currentFilament?.variant_price || !currentFilament?.net_weight_g) return null;
    return currentFilament.variant_price / (currentFilament.net_weight_g / 1000);
  }, [currentFilament?.variant_price, currentFilament?.net_weight_g]);

  useEffect(() => {
    if (!currentFilament?.id || !currentFilament?.material) {
      setIsLoading(false);
      return;
    }

    const fetchSimilar = async () => {
      setIsLoading(true);
      try {
        // Fetch filaments with same material, different from current
        const { data, error } = await supabase
          .from("filaments")
          .select(`
            id, 
            product_title, 
            vendor, 
            material, 
            variant_price, 
            net_weight_g, 
            color_hex, 
            color_family, 
            featured_image,
            nozzle_temp_min_c,
            nozzle_temp_max_c,
            ease_of_printing_score
          `)
          .eq("material", currentFilament.material)
          .neq("id", currentFilament.id)
          .or("net_weight_g.is.null,net_weight_g.gte.300") // Exclude samples
          .not("variant_price", "is", null)
          .limit(50);

        if (error) {
          console.error("Error fetching similar filaments:", error);
          setCandidates([]);
          return;
        }

        setCandidates(data || []);
      } catch (err) {
        console.error("Error in useSimilarFilamentsEnhanced:", err);
        setCandidates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilar();
  }, [currentFilament?.id, currentFilament?.material]);

  // Process and rank candidates
  const similarFilaments = useMemo(() => {
    if (!currentFilament || candidates.length === 0) return [];

    const baseMaterial = currentFilament.material?.split(/[\s\-+]/)[0] || "";
    const priceTier = MATERIAL_PRICE_TIERS[baseMaterial] || MATERIAL_PRICE_TIERS[currentFilament.material || ""] || { budget: 25, premium: 45 };

    const scored = candidates.map((filament) => {
      const pricePerKg = filament.variant_price && filament.net_weight_g
        ? filament.variant_price / (filament.net_weight_g / 1000)
        : null;

      let score = 0;
      let reason: SimilarityReason = "same_material";

      // Same brand bonus (high priority to show alternatives)
      const isSameBrand = filament.vendor?.toLowerCase() === currentFilament.vendor?.toLowerCase();
      if (isSameBrand) {
        score += 10;
        reason = "same_brand";
      }

      // Same color family
      const isSameColor = filament.color_family && filament.color_family === currentFilament.color_family;
      if (isSameColor) {
        score += 8;
        if (!isSameBrand) reason = "same_color";
      }

      // Price similarity (within 20%)
      if (pricePerKg && currentPricePerKg) {
        const priceDiff = Math.abs(pricePerKg - currentPricePerKg) / currentPricePerKg;
        if (priceDiff <= 0.2) {
          score += 15;
          if (!isSameBrand && !isSameColor) reason = "similar_price";
        } else if (priceDiff <= 0.35) {
          score += 8;
        }
      }

      // Budget pick (great value)
      if (pricePerKg && pricePerKg <= priceTier.budget) {
        score += 5;
        if (!isSameBrand && !isSameColor && currentPricePerKg && pricePerKg < currentPricePerKg * 0.8) {
          reason = "budget_pick";
        }
      }

      // Premium pick
      if (pricePerKg && pricePerKg >= priceTier.premium) {
        if (!isSameBrand && currentPricePerKg && pricePerKg > currentPricePerKg * 1.3) {
          reason = "premium_pick";
        }
      }

      // Prefer different vendors for variety
      if (!isSameBrand) {
        score += 3;
      }

      return {
        ...filament,
        similarityReason: reason,
        score,
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Ensure diversity: max 2 from same brand
    const result: (SimilarFilamentData & { score: number })[] = [];
    const brandCounts: Record<string, number> = {};

    for (const item of scored) {
      const vendor = item.vendor?.toLowerCase() || "unknown";
      const currentCount = brandCounts[vendor] || 0;
      
      if (currentCount < 2) {
        result.push(item);
        brandCounts[vendor] = currentCount + 1;
      }

      if (result.length >= 6) break;
    }

    return result;
  }, [candidates, currentFilament, currentPricePerKg]);

  return { similarFilaments, isLoading };
}
