import { Link } from "react-router-dom";
import { Lightbulb, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRegion } from "@/contexts/RegionContext";
import { computePricePerKg } from "@/lib/resolveFilamentPrice";

interface CheaperAlternativeCalloutProps {
  filamentId: string;
  material: string | null;
  vendor: string | null;
  currentPricePerKg: number | null;
}

export function CheaperAlternativeCallout({
  filamentId,
  material,
  vendor,
  currentPricePerKg,
}: CheaperAlternativeCalloutProps) {
  const { formatPrice, currency } = useRegion();

  // Only look for alternatives if we have a valid price and material
  const { data: alternative } = useQuery({
    queryKey: ["cheaper-alternative", material, filamentId, currency],
    enabled: !!material && !!currentPricePerKg && currentPricePerKg > 0,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      if (!material || !currentPricePerKg) return null;

      const baseMaterial = material.split(/[\s\-+]/)[0];

      // Find cheaper filaments of the same base material from different vendors
      const { data, error } = await supabase
        .from("filaments")
        .select("id, product_title, vendor, variant_price, net_weight_g, pack_quantity, product_handle, featured_image")
        .ilike("material", `${baseMaterial}%`)
        .not("id", "eq", filamentId)
        .not("variant_price", "is", null)
        .eq("variant_available", true)
        .order("variant_price", { ascending: true })
        .limit(20);

      if (error || !data) return null;

      // Find the cheapest per-kg from a different vendor
      for (const f of data) {
        if (f.vendor === vendor) continue; // Skip same brand
        const ppkg = computePricePerKg(f.variant_price!, f.net_weight_g, f.pack_quantity);
        if (ppkg && ppkg < currentPricePerKg && (currentPricePerKg - ppkg) > 1) {
          return {
            id: f.id,
            title: f.product_title,
            vendor: f.vendor,
            pricePerKg: ppkg,
            savings: currentPricePerKg - ppkg,
            handle: f.product_handle,
          };
        }
      }

      return null;
    },
  });

  if (!alternative) return null;

  const materialBase = material?.split(/[\s\-+]/)[0] || "filament";

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
