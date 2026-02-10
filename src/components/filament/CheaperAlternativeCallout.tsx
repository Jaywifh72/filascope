import { Link } from "react-router-dom";
import { Lightbulb, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRegion } from "@/contexts/RegionContext";
import { computePricePerKg } from "@/lib/resolveFilamentPrice";
import {
  computeSimilarityScore,
  type FilamentProfile,
  getBaseMaterial,
} from "@/lib/filamentSimilarity";

interface CheaperAlternativeCalloutProps {
  filamentId: string;
  material: string | null;
  vendor: string | null;
  currentPricePerKg: number | null;
  /** Source filament profile for similarity scoring */
  sourceProfile?: FilamentProfile | null;
}

export function CheaperAlternativeCallout({
  filamentId,
  material,
  vendor,
  currentPricePerKg,
  sourceProfile,
}: CheaperAlternativeCalloutProps) {
  const { formatPrice, currency } = useRegion();

  const { data: alternative } = useQuery({
    queryKey: ["cheaper-alternative", material, filamentId, currency],
    enabled: !!material && !!currentPricePerKg && currentPricePerKg > 0,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      if (!material || !currentPricePerKg) return null;

      const baseMaterial = getBaseMaterial(material);

      const { data, error } = await supabase
        .from("filaments")
        .select(`
          id, product_title, vendor, variant_price, net_weight_g, pack_quantity,
          product_handle, featured_image, material, finish_type,
          carbon_fiber_percentage, glass_fiber_percentage, high_speed_capable,
          is_nozzle_abrasive, diameter_nominal_mm, nozzle_temp_min_c, nozzle_temp_max_c
        `)
        .ilike("material", `${baseMaterial}%`)
        .not("id", "eq", filamentId)
        .not("variant_price", "is", null)
        .eq("variant_available", true)
        .order("variant_price", { ascending: true })
        .limit(30);

      if (error || !data) return null;

      for (const f of data) {
        if (f.vendor === vendor) continue;
        const ppkg = computePricePerKg(f.variant_price!, f.net_weight_g, f.pack_quantity);
        if (!ppkg || ppkg >= currentPricePerKg || (currentPricePerKg - ppkg) <= 1) continue;

        // If we have a source profile, verify similarity score > 50
        if (sourceProfile) {
          const candidateProfile: FilamentProfile = {
            material: f.material,
            finish_type: f.finish_type ?? null,
            carbon_fiber_percentage: f.carbon_fiber_percentage ?? null,
            glass_fiber_percentage: f.glass_fiber_percentage ?? null,
            high_speed_capable: f.high_speed_capable ?? null,
            is_nozzle_abrasive: f.is_nozzle_abrasive ?? null,
            diameter_nominal_mm: f.diameter_nominal_mm ?? null,
            nozzle_temp_min_c: f.nozzle_temp_min_c ?? null,
            nozzle_temp_max_c: f.nozzle_temp_max_c ?? null,
            product_title: f.product_title ?? "",
            net_weight_g: f.net_weight_g,
            featured_image: f.featured_image,
            variant_price: f.variant_price,
          };
          const score = computeSimilarityScore(sourceProfile, candidateProfile);
          if (score.disqualified || score.total < 50) continue;
        }

        return {
          id: f.id,
          title: f.product_title,
          vendor: f.vendor,
          pricePerKg: ppkg,
          savings: currentPricePerKg - ppkg,
          handle: f.product_handle,
        };
      }

      return null;
    },
  });

  if (!alternative) return null;

  const materialBase = getBaseMaterial(material) || "filament";

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Similar {materialBase} for less
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            <Link
              to={`/filament/${alternative.id}`}
              className="text-primary hover:text-primary/80 font-medium"
            >
              {alternative.vendor} {alternative.title?.split(" ").slice(0, 4).join(" ")}
            </Link>
            {" "}at {formatPrice(alternative.pricePerKg)}/kg{" "}
            <span className="text-emerald-400 font-medium">
              ({formatPrice(alternative.savings)} cheaper)
            </span>
          </p>
          <Link
            to={`/filament/${alternative.id}`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2 font-medium"
          >
            View alternative
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
