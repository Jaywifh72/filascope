import { Link } from "react-router-dom";
import { Lightbulb, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRegion } from "@/contexts/RegionContext";
import { computePricePerKg } from "@/lib/resolveFilamentPrice";
import {
  buildSimilarityQuery,
  computeSimilarityScore,
  getBaseMaterial,
  getFinishType,
  type FilamentProfile,
} from "@/lib/filamentSimilarity";

interface CheaperAlternativeCalloutProps {
  filamentId: string;
  material: string | null;
  vendor: string | null;
  currentPricePerKg: number | null;
  finishType: string | null;
  carbonFiberPercentage: number | null;
  glassFiberPercentage: number | null;
  highSpeedCapable: boolean | null;
  isNozzleAbrasive: boolean | null;
  diameterNominalMm: number | null;
  nozzleTempMinC: number | null;
  nozzleTempMaxC: number | null;
  productTitle: string;
}

export function CheaperAlternativeCallout({
  filamentId,
  material,
  vendor,
  currentPricePerKg,
  finishType,
  carbonFiberPercentage,
  glassFiberPercentage,
  highSpeedCapable,
  isNozzleAbrasive,
  diameterNominalMm,
  nozzleTempMinC,
  nozzleTempMaxC,
  productTitle,
}: CheaperAlternativeCalloutProps) {
  const { formatPrice, currency } = useRegion();

  // Build source profile from props
  const sourceProfile: FilamentProfile = {
    material,
    finish_type: finishType,
    carbon_fiber_percentage: carbonFiberPercentage,
    glass_fiber_percentage: glassFiberPercentage,
    high_speed_capable: highSpeedCapable,
    is_nozzle_abrasive: isNozzleAbrasive,
    diameter_nominal_mm: diameterNominalMm,
    nozzle_temp_min_c: nozzleTempMinC,
    nozzle_temp_max_c: nozzleTempMaxC,
    product_title: productTitle,
  };

  const { data: alternative } = useQuery({
    queryKey: ["cheaper-alternative", material, filamentId, currency],
    enabled: !!material && !!currentPricePerKg && currentPricePerKg > 0,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      if (!material || !currentPricePerKg) return null;

      // Use buildSimilarityQuery for hard constraints (base material, reinforcement, diameter)
      const query = buildSimilarityQuery(sourceProfile, {
        excludeId: filamentId,
        excludeVendor: vendor || undefined,
        limit: 60,
      });

      const { data, error } = await query as { data: any[] | null; error: any };

      if (error || !data) return null;

      // Score each candidate and find the cheapest qualifying one
      let bestAlternative: {
        id: string;
        title: string;
        vendor: string | null;
        pricePerKg: number;
        savings: number;
        handle: string | null;
      } | null = null;

      for (const f of data) {
        const ppkg = computePricePerKg(f.variant_price!, f.net_weight_g, f.pack_quantity);
        if (!ppkg || ppkg >= currentPricePerKg || (currentPricePerKg - ppkg) <= 1) continue;

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
        // Only allow "exact_match" or "close_match" (score >= 50)
        if (score.disqualified || score.total < 50) continue;

        // This is the cheapest qualifying candidate (query is ordered by price asc)
        if (!bestAlternative || ppkg < bestAlternative.pricePerKg) {
          bestAlternative = {
            id: f.id,
            title: f.product_title,
            vendor: f.vendor,
            pricePerKg: ppkg,
            savings: currentPricePerKg - ppkg,
            handle: f.product_handle,
          };
          break; // Already sorted by price, first qualifying match is cheapest
        }
      }

      return bestAlternative;
    },
  });

  if (!alternative) return null;

  // Build descriptive label: "Similar Matte PLA for less" or "Similar PLA for less"
  const baseMaterial = getBaseMaterial(material) || "filament";
  const finish = getFinishType(sourceProfile);
  const finishLabel = finish !== "standard"
    ? `${finish.charAt(0).toUpperCase() + finish.slice(1)} ${baseMaterial}`
    : baseMaterial;

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Similar {finishLabel} for less
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
