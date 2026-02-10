import { useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Plus, ArrowLeftRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompare } from "@/hooks/useCompare";
import { getBrandLogo } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { cleanFilamentDisplayName } from "@/lib/productNameUtils";
import { computePricePerKg } from "@/lib/resolveFilamentPrice";
import type { EnhancedSimilarFilament } from "@/hooks/useEnhancedSimilarFilaments";

interface SideBySideComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilament: {
    id: string;
    product_title: string;
    vendor?: string | null;
    material?: string | null;
    featured_image?: string | null;
    variant_price?: number | null;
    net_weight_g?: number | null;
    pricePerKg?: number | null;
    printability_index?: number | null;
    strength_index?: number | null;
    value_score?: number | null;
    ease_of_printing_score?: number | null;
    tg_c?: number | null;
  };
  compareFilament: EnhancedSimilarFilament;
}

interface ComparisonRow {
  label: string;
  currentValue: string | number | null;
  compareValue: string | number | null;
  higherIsBetter: boolean;
  unit?: string;
  format?: "number" | "score" | "price" | "temp";
}

function formatValue(
  value: string | number | null,
  format: string = "number",
  unit: string = ""
): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "string") return value;

  switch (format) {
    case "score":
      return `${value.toFixed(1)}/10`;
    case "price":
      return `$${value.toFixed(2)}`;
    case "temp":
      return `${value}°C`;
    default:
      return `${value}${unit}`;
  }
}

function getWinner(
  current: number | null,
  compare: number | null,
  higherIsBetter: boolean
): "current" | "compare" | "tie" | null {
  if (current === null || compare === null) return null;
  if (current === compare) return "tie";
  if (higherIsBetter) {
    return current > compare ? "current" : "compare";
  }
  return current < compare ? "current" : "compare";
}

export function SideBySideComparisonDialog({
  open,
  onOpenChange,
  currentFilament,
  compareFilament,
}: SideBySideComparisonDialogProps) {
  const { addItem, isInCompare } = useCompare();
  const [addingBoth, setAddingBoth] = useState(false);

  const currentPricePerKg =
    currentFilament.pricePerKg ||
    (currentFilament.variant_price
      ? computePricePerKg(currentFilament.variant_price, currentFilament.net_weight_g, (currentFilament as any).pack_quantity)
      : null);

  const rows: ComparisonRow[] = [
    {
      label: "Price/kg",
      currentValue: currentPricePerKg,
      compareValue: compareFilament.pricePerKg,
      higherIsBetter: false,
      format: "price",
    },
    {
      label: "Printability",
      currentValue: currentFilament.printability_index,
      compareValue: compareFilament.printability_index,
      higherIsBetter: true,
      format: "score",
    },
    {
      label: "Strength",
      currentValue: currentFilament.strength_index
        ? currentFilament.strength_index * 10
        : null,
      compareValue: compareFilament.strength_index
        ? compareFilament.strength_index * 10
        : null,
      higherIsBetter: true,
      format: "score",
    },
    {
      label: "Value Score",
      currentValue: currentFilament.value_score,
      compareValue: compareFilament.value_score,
      higherIsBetter: true,
      format: "score",
    },
    {
      label: "Ease of Printing",
      currentValue: currentFilament.ease_of_printing_score,
      compareValue: compareFilament.ease_of_printing_score,
      higherIsBetter: true,
      format: "score",
    },
    {
      label: "Heat Resistance (Tg)",
      currentValue: currentFilament.tg_c,
      compareValue: compareFilament.tg_c,
      higherIsBetter: true,
      format: "temp",
    },
  ];

  const handleAddBoth = () => {
    setAddingBoth(true);
    if (!isInCompare(currentFilament.id)) {
      addItem({
        id: currentFilament.id,
        product_title: currentFilament.product_title,
        vendor: currentFilament.vendor || null,
        material: currentFilament.material || null,
        color_hex: null,
        variant_price: currentFilament.variant_price || null,
        net_weight_g: currentFilament.net_weight_g || null,
        featured_image: currentFilament.featured_image || null,
      });
    }
    if (!isInCompare(compareFilament.id)) {
      addItem({
        id: compareFilament.id,
        product_title: compareFilament.product_title,
        vendor: compareFilament.vendor,
        material: compareFilament.material,
        color_hex: null,
        variant_price: compareFilament.variant_price,
        net_weight_g: compareFilament.net_weight_g,
        featured_image: compareFilament.featured_image,
      });
    }
    setTimeout(() => setAddingBoth(false), 1000);
  };

  const currentBrandLogo = currentFilament.vendor
    ? getBrandLogo(currentFilament.vendor)
    : null;
  const compareBrandLogo = compareFilament.vendor
    ? getBrandLogo(compareFilament.vendor)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Side-by-Side Comparison
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {/* Filament Headers */}
          <div className="grid grid-cols-[1fr,1fr] gap-4 mb-4">
            {/* Current */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <BrandLogo
                  src={currentBrandLogo}
                  brandName={currentFilament.vendor || "Brand"}
                  size="sm"
                  className="h-6 w-6 rounded"
                />
                <Badge variant="outline" className="text-[10px]">
                  Current
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {currentFilament.vendor}
              </p>
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {cleanFilamentDisplayName(currentFilament.product_title)}
              </p>
            </div>

            {/* Compare */}
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center gap-2 mb-2">
                <BrandLogo
                  src={compareBrandLogo}
                  brandName={compareFilament.vendor || "Brand"}
                  size="sm"
                  className="h-6 w-6 rounded"
                />
                <Badge
                  variant="outline"
                  className="text-[10px] border-cyan-500/50 text-cyan-400"
                >
                  Alternative
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {compareFilament.vendor}
              </p>
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {cleanFilamentDisplayName(compareFilament.product_title)}
              </p>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">
                    Metric
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2">
                    Current
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2">
                    Alternative
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.map((row) => {
                  const winner = getWinner(
                    typeof row.currentValue === "number"
                      ? row.currentValue
                      : null,
                    typeof row.compareValue === "number"
                      ? row.compareValue
                      : null,
                    row.higherIsBetter
                  );

                  return (
                    <tr key={row.label} className="hover:bg-muted/20">
                      <td className="px-3 py-2.5 text-sm text-foreground/80">
                        {row.label}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`text-sm font-medium inline-flex items-center gap-1 ${
                            winner === "current"
                              ? "text-green-400"
                              : "text-foreground/70"
                          }`}
                        >
                          {winner === "current" && (
                            <Trophy className="h-3 w-3" />
                          )}
                          {formatValue(row.currentValue, row.format, row.unit)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`text-sm font-medium inline-flex items-center gap-1 ${
                            winner === "compare"
                              ? "text-green-400"
                              : "text-foreground/70"
                          }`}
                        >
                          {winner === "compare" && (
                            <Trophy className="h-3 w-3" />
                          )}
                          {formatValue(row.compareValue, row.format, row.unit)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Best For Section */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Alternative best for:
            </p>
            <p className="text-sm text-foreground/80">{compareFilament.bestFor}</p>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1 border-primary/50 text-primary hover:bg-primary/10"
              onClick={handleAddBoth}
              disabled={addingBoth}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {addingBoth ? "Added!" : "Add Both to Compare Tray"}
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              asChild
            >
              <Link
                to={`/filament/${compareFilament.id}`}
                onClick={() => onOpenChange(false)}
              >
                View Alternative →
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
