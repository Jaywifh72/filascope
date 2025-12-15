import { Plus, Check, ArrowRight, Star } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompare } from "@/hooks/useCompare";
import { MetricComparisonBar } from "./MetricComparisonBar";
import { StandoutBadges } from "./StandoutBadges";
import type { EnhancedSimilarFilament } from "@/hooks/useEnhancedSimilarFilaments";

interface QuickComparisonPreviewProps {
  filament: EnhancedSimilarFilament;
  currentScores?: {
    printability_index?: number | null;
    strength_index?: number | null;
    value_score?: number | null;
    ease_of_printing_score?: number | null;
    tg_c?: number | null;
  };
  children: React.ReactNode;
}

export function QuickComparisonPreview({
  filament,
  currentScores,
  children,
}: QuickComparisonPreviewProps) {
  const { addItem, isInCompare } = useCompare();
  const isAdded = isInCompare(filament.id);

  const handleAddToCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdded) {
      addItem({
        id: filament.id,
        product_title: filament.product_title,
        vendor: filament.vendor,
        material: filament.material,
        color_hex: null,
        variant_price: filament.variant_price,
        net_weight_g: filament.net_weight_g,
        featured_image: filament.featured_image,
      });
    }
  };

  // Get all differentiators for expanded view (up to 6)
  const allDifferentiators = filament.differentiators.slice(0, 6);

  return (
    <HoverCard openDelay={800} closeDelay={200}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        className="w-[360px] p-0 bg-card border-border/50"
        side="right"
        align="start"
        sideOffset={8}
      >
        <div
          className="divide-y divide-border/50"
          onClick={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="p-4 bg-primary/5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  {filament.vendor}
                </p>
                <h4 className="font-semibold text-sm text-foreground truncate">
                  {filament.product_title}
                </h4>
              </div>
              {filament.overallScore && (
                <Badge
                  variant="outline"
                  className="flex-shrink-0 border-primary/50 bg-primary/10"
                >
                  <Star className="h-3 w-3 mr-1 fill-primary text-primary" />
                  {filament.overallScore.toFixed(1)}
                </Badge>
              )}
            </div>

            {/* Standout badges */}
            {filament.standoutBadges && filament.standoutBadges.length > 0 && (
              <div className="mt-2">
                <StandoutBadges badges={filament.standoutBadges} maxBadges={3} />
              </div>
            )}
          </div>

          {/* Score Comparison */}
          {currentScores && (
            <div className="p-4 space-y-2.5">
              <p className="text-xs font-medium text-muted-foreground mb-3">
                Performance Comparison
              </p>
              {currentScores.printability_index != null &&
                filament.printability_index != null && (
                  <MetricComparisonBar
                    label="Printability"
                    currentValue={currentScores.printability_index}
                    compareValue={filament.printability_index}
                    maxValue={10}
                  />
                )}
              {currentScores.strength_index != null &&
                filament.strength_index != null && (
                  <MetricComparisonBar
                    label="Strength"
                    currentValue={currentScores.strength_index * 10}
                    compareValue={filament.strength_index * 10}
                    maxValue={10}
                  />
                )}
              {currentScores.value_score != null &&
                filament.value_score != null && (
                  <MetricComparisonBar
                    label="Value"
                    currentValue={currentScores.value_score}
                    compareValue={filament.value_score}
                    maxValue={10}
                  />
                )}
              {currentScores.ease_of_printing_score != null &&
                filament.ease_of_printing_score != null && (
                  <MetricComparisonBar
                    label="Ease"
                    currentValue={currentScores.ease_of_printing_score}
                    compareValue={filament.ease_of_printing_score}
                    maxValue={10}
                  />
                )}
              {currentScores.tg_c != null && filament.tg_c != null && (
                <MetricComparisonBar
                  label="Heat (Tg)"
                  currentValue={currentScores.tg_c}
                  compareValue={filament.tg_c}
                  maxValue={150}
                  unit="°C"
                />
              )}
            </div>
          )}

          {/* Extended Differentiators */}
          {allDifferentiators.length > 0 && (
            <div className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Key Differences
              </p>
              <div className="space-y-1.5">
                {allDifferentiators.map((diff, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span
                      className={`text-sm ${
                        diff.type === "positive" || diff.type === "standout"
                          ? "text-green-400"
                          : diff.type === "warning"
                          ? "text-amber-400"
                          : diff.type === "negative"
                          ? "text-red-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {diff.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/90">{diff.text}</p>
                      {"realWorldImpact" in diff && diff.realWorldImpact && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          → {diff.realWorldImpact}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price & Best For */}
          <div className="p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Price</span>
              <span className="text-sm font-bold text-primary">
                ${filament.pricePerKg?.toFixed(2)}/kg
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Best for:</span>{" "}
              {filament.bestFor}
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 flex items-center gap-2 bg-card">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddToCompare}
              disabled={isAdded}
              className={`flex-1 ${
                isAdded
                  ? "border-green-500/50 text-green-400"
                  : "border-primary/50 text-primary hover:bg-primary/10"
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add to Compare
                </>
              )}
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              View Details
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
