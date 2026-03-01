import { useMemo } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompare } from "@/hooks/useCompare";
import { RegionalPrice } from "@/components/price/RegionalPrice";
import { computePricePerKg } from "@/lib/resolveFilamentPrice";
import { cn } from "@/lib/utils";
import type { SimilarFilamentData } from "./SimilarFilamentCard";

interface InlineComparePanelProps {
  current: SimilarFilamentData;
  comparison: SimilarFilamentData;
  onClose: () => void;
}

function MetricRow({
  label,
  currentVal,
  compareVal,
  format = "number",
  lowerIsBetter = false,
}: {
  label: string;
  currentVal: number | null;
  compareVal: number | null;
  format?: "number" | "price" | "temp";
  lowerIsBetter?: boolean;
}) {
  if (currentVal == null && compareVal == null) return null;

  const better =
    currentVal != null && compareVal != null
      ? lowerIsBetter
        ? compareVal < currentVal
          ? "compare"
          : compareVal > currentVal
          ? "current"
          : "same"
        : compareVal > currentVal
        ? "compare"
        : compareVal < currentVal
        ? "current"
        : "same"
      : "same";

  const fmt = (v: number | null) => {
    if (v == null) return "—";
    if (format === "price") return `$${v.toFixed(2)}`;
    if (format === "temp") return `${v}°C`;
    return v.toFixed(1);
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/20 last:border-b-0">
      <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-6 text-sm">
        <span
          className={cn(
            "font-medium tabular-nums",
            better === "current" ? "text-emerald-500" : "text-foreground"
          )}
        >
          {fmt(currentVal)}
        </span>
        <span className="text-muted-foreground/50 text-xs">vs</span>
        <span
          className={cn(
            "font-medium tabular-nums",
            better === "compare" ? "text-emerald-500" : "text-foreground"
          )}
        >
          {fmt(compareVal)}
        </span>
      </div>
    </div>
  );
}

export function InlineComparePanel({ current, comparison, onClose }: InlineComparePanelProps) {
  const { addItem } = useCompare();

  const currentPpk = useMemo(
    () =>
      current.variant_price
        ? computePricePerKg(current.variant_price, current.net_weight_g, null)
        : null,
    [current]
  );
  const comparePpk = useMemo(
    () =>
      comparison.variant_price
        ? computePricePerKg(comparison.variant_price, comparison.net_weight_g, null)
        : null,
    [comparison]
  );

  const handleFullCompare = () => {
    addItem({
      id: current.id,
      product_title: current.product_title,
      vendor: current.vendor,
      material: current.material,
      color_hex: current.color_hex,
      variant_price: current.variant_price,
      net_weight_g: current.net_weight_g,
      featured_image: current.featured_image,
    });
    addItem({
      id: comparison.id,
      product_title: comparison.product_title,
      vendor: comparison.vendor,
      material: comparison.material,
      color_hex: comparison.color_hex,
      variant_price: comparison.variant_price,
      net_weight_g: comparison.net_weight_g,
      featured_image: comparison.featured_image,
    });
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 md:p-6 animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-foreground">Quick Compare</h4>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close comparison"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Two column headers */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground w-24 flex-shrink-0" />
        <div className="flex items-center gap-6 text-xs font-medium">
          <span className="text-primary truncate max-w-[120px]" title={current.product_title}>
            Current
          </span>
          <span className="text-muted-foreground/50 text-xs">vs</span>
          <span className="text-foreground truncate max-w-[120px]" title={comparison.product_title}>
            {comparison.vendor || "Similar"}
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-0">
        <MetricRow label="Price/kg" currentVal={currentPpk} compareVal={comparePpk} format="price" lowerIsBetter />
        <MetricRow
          label="Nozzle Temp"
          currentVal={current.nozzle_temp_min_c}
          compareVal={comparison.nozzle_temp_min_c}
          format="temp"
        />
        <MetricRow
          label="Ease of Print"
          currentVal={current.ease_of_printing_score}
          compareVal={comparison.ease_of_printing_score}
        />
        {/* Material comparison */}
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-muted-foreground w-24 flex-shrink-0">Material</span>
          <div className="flex items-center gap-6 text-xs">
            <Badge variant="outline" className="text-[10px]">{current.material || "—"}</Badge>
            <span className="text-muted-foreground/50">vs</span>
            <Badge variant="outline" className="text-[10px]">{comparison.material || "—"}</Badge>
          </div>
        </div>
      </div>

      {/* Full Compare CTA */}
      <div className="mt-4 flex justify-end">
        <Button asChild variant="outline" size="sm" onClick={handleFullCompare}>
          <Link to="/compare" className="inline-flex items-center gap-1.5">
            Full Compare <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
