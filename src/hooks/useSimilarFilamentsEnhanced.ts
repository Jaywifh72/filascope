import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SimilarFilamentData, SimilarityReason } from "@/components/filament/similar/SimilarFilamentCard";
import { MATERIAL_PRICE_TIERS } from "@/lib/materialPriceTiers";

export type SimilarityGroup = "other_brands_same_material" | "same_brand_other_material";

export interface GroupedSimilarFilament extends SimilarFilamentData {
  group: SimilarityGroup;
  score: number;
}

interface UseSimilarFilamentsEnhancedResult {
  similarFilaments: SimilarFilamentData[];
  groupedFilaments: {
    otherBrandsSameMaterial: GroupedSimilarFilament[];
    sameBrandOtherMaterial: GroupedSimilarFilament[];
  };
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

/**
 * Extract a normalized "product line" key from a product title + vendor.
 * This groups color variants of the same product together.
 * e.g., "Bambu Lab PLA Basic Red" and "Bambu Lab PLA Basic Blue" → same key
 */
function getProductLineKey(title: string, vendor: string | null): string {
  const normalized = title.toLowerCase().trim();
  const v = (vendor || "").toLowerCase().trim();

  // Remove common color suffixes and variant descriptors
  const cleaned = normalized
    // Remove hex color codes
    .replace(/#[0-9a-f]{3,8}/gi, "")
    // Remove common color names at the end
    .replace(
      /\s+(red|blue|green|black|white|yellow|orange|purple|pink|grey|gray|silver|gold|brown|beige|teal|cyan|magenta|olive|navy|cream|ivory|coral|salmon|lime|aqua|maroon|tan|champagne|charcoal|midnight|forest|sky|cobalt|emerald|ruby|jade|pearl|matte|glossy|translucent|transparent|clear|natural|rainbow|multicolor|gradient|marble|wood|silk|galaxy|glow|neon|pastel|metallic|sparkle|satin|platinum|bronze|copper)\b/gi,
      ""
    )
    // Remove trailing weight/size descriptors that don't define the product line
    .replace(/\s*\d+\s*g\s*$/i, "")
    .replace(/\s*[\-–]\s*$/, "")
    .trim();

  return `${v}::${cleaned}`;
}

export function useSimilarFilamentsEnhanced(
  currentFilament: CurrentFilament | null
): UseSimilarFilamentsEnhancedResult {
  const [sameMaterialCandidates, setSameMaterialCandidates] = useState<any[]>([]);
  const [sameBrandCandidates, setSameBrandCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentPricePerKg = useMemo(() => {
    if (!currentFilament?.variant_price || !currentFilament?.net_weight_g) return null;
    return currentFilament.variant_price / (currentFilament.net_weight_g / 1000);
  }, [currentFilament?.variant_price, currentFilament?.net_weight_g]);

  const currentProductLineKey = useMemo(() => {
    if (!currentFilament) return "";
    return getProductLineKey(currentFilament.product_title, currentFilament.vendor);
  }, [currentFilament?.product_title, currentFilament?.vendor]);

  useEffect(() => {
    if (!currentFilament?.id || !currentFilament?.material) {
      setIsLoading(false);
      return;
    }

    const fetchAll = async () => {
      setIsLoading(true);
      try {
        // Query 1: Same material, different brands
        const sameMaterialPromise = supabase
          .from("filaments")
          .select(`
            id, product_title, vendor, material, variant_price, 
            net_weight_g, color_hex, color_family, featured_image,
            nozzle_temp_min_c, nozzle_temp_max_c, ease_of_printing_score
          `)
          .eq("material", currentFilament.material)
          .neq("vendor", currentFilament.vendor || "")
          .or("net_weight_g.is.null,net_weight_g.gte.300")
          .not("variant_price", "is", null)
          .limit(80);

        // Query 2: Same brand, different material
        const sameBrandPromise = currentFilament.vendor
          ? supabase
              .from("filaments")
              .select(`
                id, product_title, vendor, material, variant_price, 
                net_weight_g, color_hex, color_family, featured_image,
                nozzle_temp_min_c, nozzle_temp_max_c, ease_of_printing_score
              `)
              .eq("vendor", currentFilament.vendor)
              .neq("material", currentFilament.material || "")
              .or("net_weight_g.is.null,net_weight_g.gte.300")
              .not("variant_price", "is", null)
              .limit(40)
          : Promise.resolve({ data: [], error: null });

        const [sameMaterialResult, sameBrandResult] = await Promise.all([
          sameMaterialPromise,
          sameBrandPromise,
        ]);

        if (sameMaterialResult.error) {
          console.error("Error fetching same-material filaments:", sameMaterialResult.error);
        }
        if (sameBrandResult.error) {
          console.error("Error fetching same-brand filaments:", sameBrandResult.error);
        }

        setSameMaterialCandidates(sameMaterialResult.data || []);
        setSameBrandCandidates(sameBrandResult.data || []);
      } catch (err) {
        console.error("Error in useSimilarFilamentsEnhanced:", err);
        setSameMaterialCandidates([]);
        setSameBrandCandidates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [currentFilament?.id, currentFilament?.material, currentFilament?.vendor]);

  const { groupedFilaments, similarFilaments } = useMemo(() => {
    if (!currentFilament) {
      return {
        groupedFilaments: { otherBrandsSameMaterial: [], sameBrandOtherMaterial: [] },
        similarFilaments: [],
      };
    }

    const baseMaterial = currentFilament.material?.split(/[\s\-+]/)[0] || "";
    const priceTier =
      MATERIAL_PRICE_TIERS[baseMaterial] ||
      MATERIAL_PRICE_TIERS[currentFilament.material || ""] ||
      { budget: 25, premium: 45 };

    // --- Deduplicate: keep one per product line ---
    function deduplicateByProductLine(items: any[]): any[] {
      const seen = new Map<string, any>();
      for (const item of items) {
        const key = getProductLineKey(item.product_title, item.vendor);
        // Skip if it's the same product line as the current filament
        if (key === currentProductLineKey) continue;

        if (!seen.has(key)) {
          seen.set(key, item);
        } else {
          // Prefer the one with a featured image
          const existing = seen.get(key);
          if (!existing.featured_image && item.featured_image) {
            seen.set(key, item);
          }
        }
      }
      return Array.from(seen.values());
    }

    // --- Score other-brand same-material candidates ---
    const dedupedSameMaterial = deduplicateByProductLine(sameMaterialCandidates);
    const scoredSameMaterial: GroupedSimilarFilament[] = dedupedSameMaterial.map((filament) => {
      const pricePerKg =
        filament.variant_price && filament.net_weight_g
          ? filament.variant_price / (filament.net_weight_g / 1000)
          : null;

      let score = 0;
      let reason: SimilarityReason = "same_material";

      // Price similarity (within 30%) — highest priority
      if (pricePerKg && currentPricePerKg) {
        const priceDiff = Math.abs(pricePerKg - currentPricePerKg) / currentPricePerKg;
        if (priceDiff <= 0.15) {
          score += 20;
          reason = "similar_price";
        } else if (priceDiff <= 0.30) {
          score += 12;
          reason = "similar_price";
        } else if (priceDiff <= 0.50) {
          score += 5;
        }
      }

      // Similar spool size
      if (
        filament.net_weight_g &&
        currentFilament.net_weight_g &&
        Math.abs(filament.net_weight_g - currentFilament.net_weight_g) <= 100
      ) {
        score += 6;
      }

      // Budget pick
      if (
        pricePerKg &&
        pricePerKg <= priceTier.budget &&
        currentPricePerKg &&
        pricePerKg < currentPricePerKg * 0.7
      ) {
        reason = "budget_pick";
        score += 4;
      }

      // Premium pick
      if (
        pricePerKg &&
        pricePerKg >= priceTier.premium &&
        currentPricePerKg &&
        pricePerKg > currentPricePerKg * 1.3
      ) {
        reason = "premium_pick";
      }

      // Same color family bonus
      if (filament.color_family && filament.color_family === currentFilament.color_family) {
        score += 3;
      }

      // Prefer items with images
      if (filament.featured_image) score += 2;

      return {
        ...filament,
        similarityReason: reason,
        group: "other_brands_same_material" as SimilarityGroup,
        score,
      };
    });

    // --- Score same-brand other-material candidates ---
    const dedupedSameBrand = deduplicateByProductLine(sameBrandCandidates);
    const scoredSameBrand: GroupedSimilarFilament[] = dedupedSameBrand.map((filament) => {
      let score = 0;

      // Prefer items with images
      if (filament.featured_image) score += 5;

      // Price similarity
      const pricePerKg =
        filament.variant_price && filament.net_weight_g
          ? filament.variant_price / (filament.net_weight_g / 1000)
          : null;
      if (pricePerKg && currentPricePerKg) {
        const priceDiff = Math.abs(pricePerKg - currentPricePerKg) / currentPricePerKg;
        if (priceDiff <= 0.30) score += 8;
        else if (priceDiff <= 0.50) score += 4;
      }

      // Similar spool size
      if (
        filament.net_weight_g &&
        currentFilament.net_weight_g &&
        Math.abs(filament.net_weight_g - currentFilament.net_weight_g) <= 100
      ) {
        score += 3;
      }

      return {
        ...filament,
        similarityReason: "same_brand" as SimilarityReason,
        group: "same_brand_other_material" as SimilarityGroup,
        score,
      };
    });

    // Sort both groups
    scoredSameMaterial.sort((a, b) => b.score - a.score);
    scoredSameBrand.sort((a, b) => b.score - a.score);

    // Ensure brand diversity in same-material group: max 2 per brand
    const diverseSameMaterial: GroupedSimilarFilament[] = [];
    const brandCounts: Record<string, number> = {};
    for (const item of scoredSameMaterial) {
      const vendor = item.vendor?.toLowerCase() || "unknown";
      const count = brandCounts[vendor] || 0;
      if (count < 2) {
        diverseSameMaterial.push(item);
        brandCounts[vendor] = count + 1;
      }
      if (diverseSameMaterial.length >= 4) break;
    }

    // Take top 2 same-brand other-material
    const topSameBrand = scoredSameBrand.slice(0, 2);

    // Combined flat list for backward compatibility
    const combined: SimilarFilamentData[] = [
      ...diverseSameMaterial,
      ...topSameBrand,
    ];

    return {
      groupedFilaments: {
        otherBrandsSameMaterial: diverseSameMaterial,
        sameBrandOtherMaterial: topSameBrand,
      },
      similarFilaments: combined,
    };
  }, [
    sameMaterialCandidates,
    sameBrandCandidates,
    currentFilament,
    currentPricePerKg,
    currentProductLineKey,
  ]);

  return { similarFilaments, groupedFilaments, isLoading };
}
