import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SimilarFilamentData, SimilarityReason } from "@/components/filament/similar/SimilarFilamentCard";
import { MATERIAL_PRICE_TIERS } from "@/lib/materialPriceTiers";
import {
  buildSimilarityQuery,
  computeSimilarityScore,
  type FilamentProfile,
} from "@/lib/filamentSimilarity";

export type SimilarityGroup = "other_brands_same_material" | "same_brand_other_material";

export type SimilarSortOption = "lowest_price" | "highest_rated" | "most_popular";

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
  sortOption: SimilarSortOption;
  setSortOption: (opt: SimilarSortOption) => void;
}

interface CurrentFilament {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  color_family: string | null;
  finish_type?: string | null;
  carbon_fiber_percentage?: number | null;
  glass_fiber_percentage?: number | null;
  high_speed_capable?: boolean | null;
  is_nozzle_abrasive?: boolean | null;
  diameter_nominal_mm?: number | null;
  nozzle_temp_min_c?: number | null;
  nozzle_temp_max_c?: number | null;
  featured_image?: string | null;
}

/**
 * Extract a normalized "product line" key from a product title + vendor.
 * This groups color variants of the same product together.
 */
function getProductLineKey(title: string, vendor: string | null): string {
  const normalized = title.toLowerCase().trim();
  const v = (vendor || "").toLowerCase().trim();

  const cleaned = normalized
    .replace(/#[0-9a-f]{3,8}/gi, "")
    .replace(
      /\s+(red|blue|green|black|white|yellow|orange|purple|pink|grey|gray|silver|gold|brown|beige|teal|cyan|magenta|olive|navy|cream|ivory|coral|salmon|lime|aqua|maroon|tan|champagne|charcoal|midnight|forest|sky|cobalt|emerald|ruby|jade|pearl|matte|glossy|translucent|transparent|clear|natural|rainbow|multicolor|gradient|marble|wood|silk|galaxy|glow|neon|pastel|metallic|sparkle|satin|platinum|bronze|copper)\b/gi,
      ""
    )
    .replace(/\s*\d+\s*g\s*$/i, "")
    .replace(/\s*[\-–]\s*$/, "")
    .trim();

  return `${v}::${cleaned}`;
}

function applySorting(items: GroupedSimilarFilament[], sortOption: SimilarSortOption): GroupedSimilarFilament[] {
  const sorted = [...items];
  switch (sortOption) {
    case "lowest_price":
      sorted.sort((a, b) => {
        const priceA = a.variant_price ?? Infinity;
        const priceB = b.variant_price ?? Infinity;
        return priceA - priceB;
      });
      break;
    case "highest_rated":
      sorted.sort((a, b) => {
        const scoreA = a.ease_of_printing_score ?? 0;
        const scoreB = b.ease_of_printing_score ?? 0;
        return scoreB - scoreA;
      });
      break;
    case "most_popular":
      // Use score as proxy for popularity (includes multiple weighted signals)
      sorted.sort((a, b) => b.score - a.score);
      break;
  }
  return sorted;
}

export function useSimilarFilamentsEnhanced(
  currentFilament: CurrentFilament | null
): UseSimilarFilamentsEnhancedResult {
  const [sameMaterialCandidates, setSameMaterialCandidates] = useState<any[]>([]);
  const [sameBrandCandidates, setSameBrandCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SimilarSortOption>("lowest_price");

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
        // Query 1: Same base material, different brands — uses similarity engine filters
        const sourceProfile: FilamentProfile = {
          material: currentFilament.material,
          finish_type: currentFilament.finish_type ?? null,
          carbon_fiber_percentage: currentFilament.carbon_fiber_percentage ?? null,
          glass_fiber_percentage: currentFilament.glass_fiber_percentage ?? null,
          high_speed_capable: currentFilament.high_speed_capable ?? null,
          is_nozzle_abrasive: currentFilament.is_nozzle_abrasive ?? null,
          diameter_nominal_mm: currentFilament.diameter_nominal_mm ?? null,
          nozzle_temp_min_c: currentFilament.nozzle_temp_min_c ?? null,
          nozzle_temp_max_c: currentFilament.nozzle_temp_max_c ?? null,
          product_title: currentFilament.product_title,
          net_weight_g: currentFilament.net_weight_g,
          featured_image: currentFilament.featured_image ?? null,
          variant_price: currentFilament.variant_price,
        };

        const sameMaterialPromise = buildSimilarityQuery(sourceProfile, {
          excludeId: currentFilament.id,
          excludeVendor: currentFilament.vendor || undefined,
          limit: 120,
        });

        // Query 2: Same brand, different material (unchanged — cross-material by design)
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
              .limit(60)
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
        if (key === currentProductLineKey) continue;

        if (!seen.has(key)) {
          seen.set(key, item);
        } else {
          const existing = seen.get(key);
          if (!existing.featured_image && item.featured_image) {
            seen.set(key, item);
          }
        }
      }
      return Array.from(seen.values());
    }

    // --- Build source profile for similarity scoring ---
    const sourceProfile: FilamentProfile = {
      material: currentFilament.material,
      finish_type: (currentFilament as any).finish_type ?? null,
      carbon_fiber_percentage: (currentFilament as any).carbon_fiber_percentage ?? null,
      glass_fiber_percentage: (currentFilament as any).glass_fiber_percentage ?? null,
      high_speed_capable: (currentFilament as any).high_speed_capable ?? null,
      is_nozzle_abrasive: (currentFilament as any).is_nozzle_abrasive ?? null,
      diameter_nominal_mm: (currentFilament as any).diameter_nominal_mm ?? null,
      nozzle_temp_min_c: currentFilament.nozzle_temp_min_c ?? null,
      nozzle_temp_max_c: currentFilament.nozzle_temp_max_c ?? null,
      product_title: currentFilament.product_title,
      net_weight_g: currentFilament.net_weight_g,
      featured_image: (currentFilament as any).featured_image ?? null,
      variant_price: currentFilament.variant_price,
    };

    // --- Score other-brand same-material candidates using similarity engine ---
    const dedupedSameMaterial = deduplicateByProductLine(sameMaterialCandidates);
    const scoredSameMaterial: GroupedSimilarFilament[] = dedupedSameMaterial
      .map((filament) => {
        const candidateProfile: FilamentProfile = {
          material: filament.material,
          finish_type: filament.finish_type ?? null,
          carbon_fiber_percentage: filament.carbon_fiber_percentage ?? null,
          glass_fiber_percentage: filament.glass_fiber_percentage ?? null,
          high_speed_capable: filament.high_speed_capable ?? null,
          is_nozzle_abrasive: filament.is_nozzle_abrasive ?? null,
          diameter_nominal_mm: filament.diameter_nominal_mm ?? null,
          nozzle_temp_min_c: filament.nozzle_temp_min_c ?? null,
          nozzle_temp_max_c: filament.nozzle_temp_max_c ?? null,
          product_title: filament.product_title ?? "",
          net_weight_g: filament.net_weight_g,
          featured_image: filament.featured_image,
          variant_price: filament.variant_price,
        };

        const similarity = computeSimilarityScore(sourceProfile, candidateProfile);
        if (similarity.disqualified) return null;

        let reason: SimilarityReason = "same_material";
        const pricePerKg =
          filament.variant_price && filament.net_weight_g
            ? filament.variant_price / (filament.net_weight_g / 1000)
            : null;

        if (pricePerKg && currentPricePerKg) {
          const priceDiff = Math.abs(pricePerKg - currentPricePerKg) / currentPricePerKg;
          if (priceDiff <= 0.30) reason = "similar_price";
          if (pricePerKg <= priceTier.budget && pricePerKg < currentPricePerKg * 0.7) reason = "budget_pick";
          if (pricePerKg >= priceTier.premium && pricePerKg > currentPricePerKg * 1.3) reason = "premium_pick";
        }

        return {
          ...filament,
          similarityReason: reason,
          group: "other_brands_same_material" as SimilarityGroup,
          score: similarity.total,
        };
      })
      .filter((item): item is GroupedSimilarFilament => item !== null);

    // --- Score same-brand other-material candidates ---
    const dedupedSameBrand = deduplicateByProductLine(sameBrandCandidates);
    const scoredSameBrand: GroupedSimilarFilament[] = dedupedSameBrand.map((filament) => {
      let score = 0;

      if (filament.featured_image) score += 5;

      const pricePerKg =
        filament.variant_price && filament.net_weight_g
          ? filament.variant_price / (filament.net_weight_g / 1000)
          : null;
      if (pricePerKg && currentPricePerKg) {
        const priceDiff = Math.abs(pricePerKg - currentPricePerKg) / currentPricePerKg;
        if (priceDiff <= 0.30) score += 8;
        else if (priceDiff <= 0.50) score += 4;
      }

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

    // Sort both groups by score first, then apply user sort
    scoredSameMaterial.sort((a, b) => b.score - a.score);
    scoredSameBrand.sort((a, b) => b.score - a.score);

    // Ensure brand diversity in same-material group: max 2 per brand, limit 6
    const diverseSameMaterial: GroupedSimilarFilament[] = [];
    const brandCounts: Record<string, number> = {};
    for (const item of scoredSameMaterial) {
      const vendor = item.vendor?.toLowerCase() || "unknown";
      const count = brandCounts[vendor] || 0;
      if (count < 2) {
        diverseSameMaterial.push(item);
        brandCounts[vendor] = count + 1;
      }
      if (diverseSameMaterial.length >= 6) break;
    }

    // Take top 6 same-brand other-material
    const topSameBrand = scoredSameBrand.slice(0, 6);

    // Apply user-selected sorting
    const sortedSameMaterial = applySorting(diverseSameMaterial, sortOption);
    const sortedSameBrand = applySorting(topSameBrand, sortOption);

    // Combined flat list for backward compatibility
    const combined: SimilarFilamentData[] = [
      ...sortedSameMaterial,
      ...sortedSameBrand,
    ];

    return {
      groupedFilaments: {
        otherBrandsSameMaterial: sortedSameMaterial,
        sameBrandOtherMaterial: sortedSameBrand,
      },
      similarFilaments: combined,
    };
  }, [
    sameMaterialCandidates,
    sameBrandCandidates,
    currentFilament,
    currentPricePerKg,
    currentProductLineKey,
    sortOption,
  ]);

  return { similarFilaments, groupedFilaments, isLoading, sortOption, setSortOption };
}
