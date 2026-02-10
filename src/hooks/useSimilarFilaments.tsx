import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getBaseMaterial,
  computeSimilarityScore,
  type FilamentProfile,
} from "@/lib/filamentSimilarity";

export interface SimilarFilament {
  id: string;
  product_title: string;
  vendor: string | null;
  variant_price: number | null;
  color_hex: string | null;
  material: string | null;
  net_weight_g: number | null;
}

interface UseSimilarFilamentsResult {
  similars: SimilarFilament[];
  count: number;
  isLoading: boolean;
}

export function useSimilarFilaments(
  filamentId: string,
  material: string | null | undefined,
  colorFamily: string | null | undefined,
  vendor: string | null | undefined,
  price: number | null | undefined
): UseSimilarFilamentsResult {
  const [data, setData] = useState<UseSimilarFilamentsResult>({
    similars: [],
    count: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (!filamentId || !material) {
      setData({ similars: [], count: 0, isLoading: false });
      return;
    }

    const fetchSimilar = async () => {
      try {
        const baseMaterial = getBaseMaterial(material);

        let query = supabase
          .from("filaments")
          .select(`
            id, product_title, vendor, variant_price, color_hex, material, net_weight_g,
            finish_type, carbon_fiber_percentage, glass_fiber_percentage,
            high_speed_capable, is_nozzle_abrasive, diameter_nominal_mm,
            nozzle_temp_min_c, nozzle_temp_max_c, featured_image
          `)
          .ilike("material", `${baseMaterial}%`)
          .neq("id", filamentId)
          .not("vendor", "eq", vendor || "")
          .or("net_weight_g.is.null,net_weight_g.gte.300")
          .limit(30);

        if (colorFamily) {
          query = query.eq("color_family", colorFamily);
        }

        if (price && price > 0) {
          query = query
            .gte("variant_price", price * 0.7)
            .lte("variant_price", price * 1.3);
        }

        const { data: filaments, error } = await query;

        if (error) {
          console.error("Error fetching similar filaments:", error);
          setData({ similars: [], count: 0, isLoading: false });
          return;
        }

        // Build source profile for scoring
        const sourceProfile: FilamentProfile = {
          material,
          finish_type: null,
          carbon_fiber_percentage: null,
          glass_fiber_percentage: null,
          high_speed_capable: null,
          is_nozzle_abrasive: null,
          diameter_nominal_mm: null,
          nozzle_temp_min_c: null,
          nozzle_temp_max_c: null,
          product_title: "",
        };

        // Score and filter
        const scored = (filaments || [])
          .map((f) => {
            const candidateProfile: FilamentProfile = {
              material: f.material,
              finish_type: (f as any).finish_type ?? null,
              carbon_fiber_percentage: (f as any).carbon_fiber_percentage ?? null,
              glass_fiber_percentage: (f as any).glass_fiber_percentage ?? null,
              high_speed_capable: (f as any).high_speed_capable ?? null,
              is_nozzle_abrasive: (f as any).is_nozzle_abrasive ?? null,
              diameter_nominal_mm: (f as any).diameter_nominal_mm ?? null,
              nozzle_temp_min_c: (f as any).nozzle_temp_min_c ?? null,
              nozzle_temp_max_c: (f as any).nozzle_temp_max_c ?? null,
              product_title: f.product_title ?? "",
              featured_image: (f as any).featured_image ?? null,
            };
            const score = computeSimilarityScore(sourceProfile, candidateProfile);
            return { filament: f, score };
          })
          .filter((s) => !s.score.disqualified)
          .sort((a, b) => b.score.total - a.score.total)
          .slice(0, 5)
          .map((s) => s.filament);

        setData({
          similars: scored,
          count: scored.length,
          isLoading: false,
        });
      } catch (err) {
        console.error("Error in useSimilarFilaments:", err);
        setData({ similars: [], count: 0, isLoading: false });
      }
    };

    fetchSimilar();
  }, [filamentId, material, colorFamily, vendor, price]);

  return data;
}

