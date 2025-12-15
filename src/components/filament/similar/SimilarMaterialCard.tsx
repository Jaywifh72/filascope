import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Plus, Check, TrendingUp, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCompare } from "@/hooks/useCompare";
import { getBrandLogo } from "@/lib/brandLogos";
import { MetricComparisonBar } from "./MetricComparisonBar";
import { StandoutBadges } from "./StandoutBadges";
import { CostBenefitSection } from "./CostBenefitSection";
import { PropertyInspector } from "./PropertyInspector";
import { QuickComparisonPreview } from "./QuickComparisonPreview";
import { SideBySideComparisonDialog } from "./SideBySideComparisonDialog";
import type { EnhancedSimilarFilament } from "@/hooks/useEnhancedSimilarFilaments";

interface SimilarMaterialCardProps {
  filament: EnhancedSimilarFilament;
  currentFilament?: {
    id: string;
    product_title: string;
    vendor?: string | null;
    material?: string | null;
    featured_image?: string | null;
    variant_price?: number | null;
    net_weight_g?: number | null;
  };
  currentScores?: {
    printability_index?: number | null;
    strength_index?: number | null;
    value_score?: number | null;
    ease_of_printing_score?: number | null;
    tg_c?: number | null;
  };
}

const MATERIAL_COLORS: Record<string, string> = {
  PLA: "bg-green-500/20 text-green-400 border-green-500/30",
  PETG: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ABS: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  ASA: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  TPU: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  NYLON: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  PC: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

function getMaterialColor(material: string | null): string {
  if (!material) return "bg-muted text-muted-foreground border-border";
  const base = material.split(/[\s-]/)[0].toUpperCase();
  return MATERIAL_COLORS[base] || "bg-muted text-muted-foreground border-border";
}

function getScoreColor(score: number | null): string {
  if (!score) return "text-muted-foreground";
  if (score >= 8) return "text-green-400";
  if (score >= 6) return "text-primary";
  return "text-amber-400";
}

export function SimilarMaterialCard({ 
  filament, 
  currentFilament,
  currentScores 
}: SimilarMaterialCardProps) {
  const { addItem, isInCompare } = useCompare();
  const isAdded = isInCompare(filament.id);
  const brandLogo = filament.vendor ? getBrandLogo(filament.vendor) : null;
  const materialBase = filament.material?.split(/[\s-]/)[0] || "Unknown";
  const [showCompareDialog, setShowCompareDialog] = useState(false);

  const handleCompare = (e: React.MouseEvent) => {
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

  const handleSideBySide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCompareDialog(true);
  };

  // Extract enhanced differentiators with real-world impact
  const enhancedDiffs = filament.differentiators.filter(
    d => 'realWorldImpact' in d && d.realWorldImpact
  );

  // Calculate current price per kg for dialog
  const currentPricePerKg = currentFilament?.variant_price && currentFilament?.net_weight_g
    ? (currentFilament.variant_price / currentFilament.net_weight_g) * 1000
    : null;

  const cardContent = (
    <div className="group relative min-w-[280px] max-w-[320px] flex-shrink-0 rounded-xl border border-primary/20 bg-card/80 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
      {/* Explanation Badge */}
      <div className="absolute -top-2.5 -right-2 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                className="cursor-help bg-primary/90 text-primary-foreground text-xs font-medium shadow-md"
              >
                {filament.explanation.icon} {filament.explanation.headline}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <p className="text-sm">{filament.explanation.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Trending Indicator */}
      {filament.isTrending && (
        <div className="absolute top-3 left-3">
          <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-400 text-xs">
            <TrendingUp className="mr-1 h-3 w-3" />
            Trending
          </Badge>
        </div>
      )}

      {/* Header: Brand + Material Badge */}
      <div className="mb-3 mt-4 flex items-center justify-between">
        {brandLogo ? (
          <img
            src={brandLogo}
            alt={filament.vendor || "Brand"}
            className="h-8 w-8 rounded object-contain"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
            {filament.vendor?.charAt(0) || "?"}
          </div>
        )}
        <Badge variant="outline" className={`text-xs ${getMaterialColor(filament.material)}`}>
          {materialBase}
        </Badge>
      </div>

      {/* Product Title */}
      <h4 className="mb-2 line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary">
        {filament.product_title}
      </h4>

      {/* Standout Badges */}
      {filament.standoutBadges && filament.standoutBadges.length > 0 && (
        <div className="mb-2">
          <StandoutBadges badges={filament.standoutBadges} />
        </div>
      )}

      {/* Overall Score */}
      {filament.overallScore && (
        <div className={`mb-3 flex items-center gap-1.5 text-sm ${getScoreColor(filament.overallScore)}`}>
          <Star className="h-4 w-4 fill-current" />
          <span className="font-medium">{filament.overallScore.toFixed(1)}/10</span>
          {filament.factors.relevanceScore > 0.7 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({Math.round(filament.factors.relevanceScore * 100)}% match)
            </span>
          )}
        </div>
      )}

      {/* Price Comparison */}
      <div className="mb-3">
        {filament.pricePerKg && (
          <p className="text-lg font-bold text-primary">
            ${filament.pricePerKg.toFixed(2)}/kg
          </p>
        )}
        {filament.priceComparison && filament.priceComparison.arrow !== '=' && (
          <div className="mt-1 space-y-0.5">
            <p className={`text-sm font-medium ${
              filament.priceComparison.color === 'green' ? 'text-green-400' : 'text-red-400'
            }`}>
              {filament.priceComparison.arrow} {filament.priceComparison.label}
            </p>
          </div>
        )}
      </div>

      {/* Visual Metric Comparison Bars */}
      {currentScores && (
        <div className="mb-3 space-y-2 border-t border-border/50 pt-3">
          {currentScores.printability_index != null && filament.printability_index != null && (
            <MetricComparisonBar
              label="Printability"
              currentValue={currentScores.printability_index}
              compareValue={filament.printability_index}
              maxValue={10}
            />
          )}
          {currentScores.strength_index != null && filament.strength_index != null && (
            <MetricComparisonBar
              label="Strength"
              currentValue={currentScores.strength_index * 10}
              compareValue={filament.strength_index * 10}
              maxValue={10}
            />
          )}
          {currentScores.value_score != null && filament.value_score != null && (
            <MetricComparisonBar
              label="Value"
              currentValue={currentScores.value_score}
              compareValue={filament.value_score}
              maxValue={10}
            />
          )}
        </div>
      )}

      {/* Cost-Benefit Analysis */}
      {filament.costBenefitAnalysis && (
        <div className="mb-3">
          <CostBenefitSection analysis={filament.costBenefitAnalysis} />
        </div>
      )}

      {/* Enhanced Differentiators with Real-World Impact - Now with Property Inspector */}
      {enhancedDiffs.length > 0 && (
        <div className="mb-3 space-y-1.5 border-t border-border/50 pt-3">
          {enhancedDiffs.slice(0, 2).map((diff, idx) => (
            <PropertyInspector key={idx} differentiator={diff}>
              <div className="space-y-0.5">
                <p
                  className={`text-sm font-medium ${
                    diff.type === 'positive' || diff.type === 'standout'
                      ? 'text-green-400'
                      : diff.type === 'warning'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {diff.icon} {diff.text}
                </p>
                {'realWorldImpact' in diff && diff.realWorldImpact && (
                  <p className="text-xs text-muted-foreground pl-5">
                    → {diff.realWorldImpact}
                  </p>
                )}
              </div>
            </PropertyInspector>
          ))}
        </div>
      )}

      {/* Best For */}
      <div className="mb-4 border-t border-border/50 pt-3">
        <p className="text-xs font-medium text-muted-foreground">Best for:</p>
        <p className="text-sm text-foreground/80">{filament.bestFor}</p>
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
        {currentFilament ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSideBySide}
            className="flex-1 border-primary/50 text-primary hover:bg-primary/10"
          >
            <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" />
            Compare
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCompare}
            disabled={isAdded}
            className={`flex-1 ${isAdded ? 'border-green-500/50 text-green-400' : 'border-primary/50 text-primary hover:bg-primary/10'}`}
          >
            {isAdded ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Added
              </>
            ) : (
              <>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Compare
              </>
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary/80"
          asChild
        >
          <span>View →</span>
        </Button>
      </div>

      {/* Side-by-Side Comparison Dialog */}
      {currentFilament && (
        <SideBySideComparisonDialog
          open={showCompareDialog}
          onOpenChange={setShowCompareDialog}
          currentFilament={{
            ...currentFilament,
            pricePerKg: currentPricePerKg,
            printability_index: currentScores?.printability_index,
            strength_index: currentScores?.strength_index,
            value_score: currentScores?.value_score,
            ease_of_printing_score: currentScores?.ease_of_printing_score,
            tg_c: currentScores?.tg_c,
          }}
          compareFilament={filament}
        />
      )}
    </div>
  );

  // Wrap with QuickComparisonPreview hover card
  return (
    <QuickComparisonPreview filament={filament} currentScores={currentScores}>
      <Link to={`/filament/${filament.id}`}>
        {cardContent}
      </Link>
    </QuickComparisonPreview>
  );
}
