import { Lightbulb, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/hooks/useCompare";
import { toast } from "sonner";
import { useState } from "react";
import type { EnhancedSimilarFilament } from "@/hooks/useEnhancedSimilarFilaments";

interface ComparisonSuggestionTipProps {
  currentFilament?: {
    id: string;
    product_title: string;
    vendor?: string | null;
    material?: string | null;
    featured_image?: string | null;
    variant_price?: number | null;
    net_weight_g?: number | null;
  };
  currentPricePerKg: number | null;
  recommendations: EnhancedSimilarFilament[];
}

interface Suggestion {
  tip: string;
  filament: EnhancedSimilarFilament;
  reason: string;
}

function getSuggestion(
  currentPricePerKg: number | null,
  currentMaterial: string | null | undefined,
  recommendations: EnhancedSimilarFilament[]
): Suggestion | null {
  if (recommendations.length === 0) return null;

  // If current is expensive, suggest budget option
  if (currentPricePerKg && currentPricePerKg > 25) {
    const budget = recommendations.find(
      (r) => r.pricePerKg && r.pricePerKg < 15
    );
    if (budget) {
      const savings = currentPricePerKg - (budget.pricePerKg || 0);
      return {
        tip: `Compare with ${budget.vendor} (${budget.pricePerKg?.toFixed(0)}/kg) to see if premium is worth the extra $${savings.toFixed(0)}/kg`,
        filament: budget,
        reason: "budget-alternative",
      };
    }
  }

  // If current is specialty material (CF), suggest base variant
  if (currentMaterial?.includes("CF") || currentMaterial?.includes("Carbon")) {
    const base = recommendations.find(
      (r) =>
        !r.material?.includes("CF") && !r.material?.includes("Carbon")
    );
    if (base) {
      return {
        tip: `Compare with non-CF ${base.material} to see strength vs. printability trade-off`,
        filament: base,
        reason: "base-variant",
      };
    }
  }

  // If current is budget, suggest premium
  if (currentPricePerKg && currentPricePerKg < 15) {
    const premium = recommendations.find(
      (r) => r.pricePerKg && r.pricePerKg > 25
    );
    if (premium) {
      return {
        tip: `Compare with premium ${premium.vendor} to see quality difference for critical prints`,
        filament: premium,
        reason: "premium-upgrade",
      };
    }
  }

  // Default: suggest highest rated alternative
  const bestRated = recommendations.reduce(
    (best, curr) =>
      (curr.overallScore || 0) > (best.overallScore || 0) ? curr : best,
    recommendations[0]
  );

  if (bestRated.overallScore && bestRated.overallScore > 8) {
    return {
      tip: `Compare with top-rated ${bestRated.vendor} (${bestRated.overallScore.toFixed(1)}/10) for best-in-class option`,
      filament: bestRated,
      reason: "top-rated",
    };
  }

  return null;
}

export function ComparisonSuggestionTip({
  currentFilament,
  currentPricePerKg,
  recommendations,
}: ComparisonSuggestionTipProps) {
  const { addItem, isInCompare, triggerGlow } = useCompare();
  const [isDismissed, setIsDismissed] = useState(false);

  const suggestion = getSuggestion(
    currentPricePerKg,
    currentFilament?.material,
    recommendations
  );

  if (!suggestion || isDismissed) return null;

  const isAlreadyAdded = isInCompare(suggestion.filament.id);
  const isCurrentAdded = currentFilament
    ? isInCompare(currentFilament.id)
    : false;

  const handleAddBoth = () => {
    let added = 0;

    // Add current filament if not already added
    if (currentFilament && !isCurrentAdded) {
      addItem({
        id: currentFilament.id,
        product_title: currentFilament.product_title,
        vendor: currentFilament.vendor,
        material: currentFilament.material,
        color_hex: null,
        variant_price: currentFilament.variant_price,
        net_weight_g: currentFilament.net_weight_g,
        featured_image: currentFilament.featured_image,
      });
      added++;
    }

    // Add suggested filament if not already added
    if (!isAlreadyAdded) {
      setTimeout(() => {
        addItem({
          id: suggestion.filament.id,
          product_title: suggestion.filament.product_title,
          vendor: suggestion.filament.vendor,
          material: suggestion.filament.material,
          color_hex: null,
          variant_price: suggestion.filament.variant_price,
          net_weight_g: suggestion.filament.net_weight_g,
          featured_image: suggestion.filament.featured_image,
        });
        triggerGlow();
      }, 100);
      added++;
    }

    if (added > 0) {
      toast.success(`Added ${added === 2 ? "both materials" : "1 material"} to compare`);
    } else {
      toast.info("Both materials already in comparison tray");
    }
  };

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
      <Lightbulb className="h-5 w-5 text-amber-400 flex-shrink-0" />
      <p className="flex-1 text-sm text-amber-200/90">{suggestion.tip}</p>
      <Button
        size="sm"
        onClick={handleAddBoth}
        className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 flex-shrink-0"
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add Both
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsDismissed(true)}
        className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
