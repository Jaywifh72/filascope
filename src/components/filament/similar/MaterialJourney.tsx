import { useMemo } from "react";
import { DollarSign, Star, Crown, Gem } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EnhancedSimilarFilament } from "@/hooks/useEnhancedSimilarFilaments";

interface MaterialJourneyProps {
  currentPricePerKg: number | null;
  recommendations: EnhancedSimilarFilament[];
  onTierClick: (tier: string) => void;
  activeTier: string | null;
}

interface TierInfo {
  id: string;
  label: string;
  icon: React.ElementType;
  minPrice: number;
  maxPrice: number;
  color: string;
}

const TIERS: TierInfo[] = [
  { id: "budget", label: "Budget", icon: DollarSign, minPrice: 0, maxPrice: 15, color: "text-green-400" },
  { id: "standard", label: "Standard", icon: Star, minPrice: 15, maxPrice: 25, color: "text-blue-400" },
  { id: "premium", label: "Premium", icon: Crown, minPrice: 25, maxPrice: 40, color: "text-amber-400" },
  { id: "professional", label: "Pro", icon: Gem, minPrice: 40, maxPrice: Infinity, color: "text-purple-400" },
];

function getTierForPrice(pricePerKg: number | null): string {
  if (pricePerKg === null) return "standard";
  for (const tier of TIERS) {
    if (pricePerKg >= tier.minPrice && pricePerKg < tier.maxPrice) {
      return tier.id;
    }
  }
  return "professional";
}

export function MaterialJourney({
  currentPricePerKg,
  recommendations,
  onTierClick,
  activeTier,
}: MaterialJourneyProps) {
  const currentTier = getTierForPrice(currentPricePerKg);

  // Count recommendations per tier
  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TIERS.forEach((t) => (counts[t.id] = 0));
    recommendations.forEach((rec) => {
      const tier = getTierForPrice(rec.pricePerKg);
      counts[tier] = (counts[tier] || 0) + 1;
    });
    return counts;
  }, [recommendations]);

  return (
    <div className="mb-4 rounded-lg border border-border/50 bg-muted/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">
          Material Tier Journey
        </p>
        {activeTier && (
          <button
            onClick={() => onTierClick("")}
            className="text-xs text-primary hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="relative">
        {/* Connection line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border/50 -translate-y-1/2" />

        {/* Tier nodes */}
        <div className="relative flex items-center justify-between">
          {TIERS.map((tier, idx) => {
            const Icon = tier.icon;
            const isCurrentTier = tier.id === currentTier;
            const isActive = tier.id === activeTier;
            const count = tierCounts[tier.id];

            return (
              <TooltipProvider key={tier.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onTierClick(isActive ? "" : tier.id)}
                      className={`relative flex flex-col items-center gap-1 transition-all ${
                        count > 0 ? "cursor-pointer" : "cursor-default opacity-50"
                      }`}
                    >
                      {/* Node */}
                      <div
                        className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                          isCurrentTier
                            ? "border-primary bg-primary/20 ring-2 ring-primary/30"
                            : isActive
                            ? "border-primary bg-primary/10"
                            : count > 0
                            ? "border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5"
                            : "border-border/30 bg-muted/50"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            isCurrentTier || isActive ? "text-primary" : tier.color
                          }`}
                        />
                        {/* Current indicator */}
                        {isCurrentTier && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          </div>
                        )}
                      </div>

                      {/* Label */}
                      <span
                        className={`text-[10px] font-medium ${
                          isCurrentTier
                            ? "text-primary"
                            : isActive
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {tier.label}
                      </span>

                      {/* Count badge */}
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary/80 text-[10px] font-medium text-primary-foreground">
                          {count}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p className="font-medium">{tier.label}</p>
                    <p className="text-muted-foreground">
                      {tier.maxPrice === Infinity
                        ? `$${tier.minPrice}+/kg`
                        : `$${tier.minPrice}-${tier.maxPrice}/kg`}
                    </p>
                    {count > 0 && (
                      <p className="text-primary mt-1">
                        {count} option{count !== 1 ? "s" : ""} available
                      </p>
                    )}
                    {isCurrentTier && (
                      <p className="text-amber-400 mt-1">Current material</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Export helper for filtering
export function filterByTier(
  recommendations: EnhancedSimilarFilament[],
  tier: string
): EnhancedSimilarFilament[] {
  if (!tier) return recommendations;
  const tierInfo = TIERS.find((t) => t.id === tier);
  if (!tierInfo) return recommendations;

  return recommendations.filter((rec) => {
    if (rec.pricePerKg === null) return false;
    return rec.pricePerKg >= tierInfo.minPrice && rec.pricePerKg < tierInfo.maxPrice;
  });
}
