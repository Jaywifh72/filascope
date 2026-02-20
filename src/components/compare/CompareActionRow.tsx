import { ShoppingCart, ExternalLink, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ResolvedComparePrice } from "@/hooks/useCompareRegionalPrices";
import type { Tables } from "@/integrations/supabase/types";

type Filament = Tables<"filaments">;

interface CompareActionRowProps {
  filaments: Filament[];
  bestPriceIndices: number[];
  overallWinnerIndices: number[];
  /** Resolved regional prices from useCompareRegionalPrices */
  resolvedPrices: Map<string, ResolvedComparePrice>;
}

export function CompareActionRow({ 
  filaments, 
  bestPriceIndices, 
  overallWinnerIndices,
  resolvedPrices,
}: CompareActionRowProps) {
  return (
    <div 
      className="grid gap-4 py-4 border-t border-border/50 mt-4" 
      style={{ gridTemplateColumns: `200px repeat(${filaments.length}, 1fr)` }}
    >
      <div className="flex items-center">
        <span className="text-sm font-semibold text-foreground">Quick Buy</span>
      </div>
      {filaments.map((filament, idx) => {
        const resolved = resolvedPrices.get(filament.id);
        const isWinner = overallWinnerIndices.includes(idx);
        const isBestPrice = bestPriceIndices.includes(idx);
        const inStock = resolved?.inStock ?? filament.variant_available !== false;
        
        return (
          <div key={filament.id} className="flex flex-col items-center gap-2">
            {/* Badges */}
            <div className="flex gap-1.5 flex-wrap justify-center min-h-[24px]">
              {isWinner && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                  Winner
                </Badge>
              )}
              {isBestPrice && !isWinner && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                  Best Value
                </Badge>
              )}
              {!inStock && (
                <Badge variant="outline" className="text-muted-foreground text-[10px]">
                  Out of Stock
                </Badge>
              )}
              {resolved?.isConverted && (
                <Badge variant="outline" className="text-muted-foreground text-[10px]">
                  converted
                </Badge>
              )}
            </div>

            {/* Price */}
            {resolved?.formattedPricePerKg && (
              <div className="text-center">
                <span className={cn(
                  "font-mono font-bold text-lg",
                  isBestPrice ? "text-amber-400" : "text-primary"
                )}>
                  {resolved.formattedPricePerKg}/kg
                </span>
                {resolved.formattedSpoolPrice && (
                  <p className="text-xs text-muted-foreground">
                    {resolved.formattedSpoolPrice} per spool
                  </p>
                )}
              </div>
            )}

            {/* Buy Button */}
            {resolved?.affiliateUrl ? (
              <Button
                asChild
                size="lg"
                disabled={!inStock}
                className={cn(
                  "w-full max-w-[180px] gap-2 font-semibold transition-all",
                  isWinner && "bg-amber-500 hover:bg-amber-400 text-amber-950",
                  !inStock && "opacity-50 cursor-not-allowed"
                )}
              >
                <a 
                  href={resolved.affiliateUrl} 
                  target="_blank" 
                  rel="nofollow sponsored noopener noreferrer"
                  onClick={(e) => {
                    if (!inStock) {
                      e.preventDefault();
                    }
                  }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {inStock ? "Buy Now" : "Out of Stock"}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </Button>
            ) : (
              <Button variant="outline" size="lg" disabled className="w-full max-w-[180px]">
                No Link Available
              </Button>
            )}

            {/* Store name */}
            {resolved?.storeName && (
              <span className="text-xs text-muted-foreground">
                from {resolved.storeName}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// TD Value Badge Component
interface TDValueBadgeProps {
  transmissionDistance: number | null;
  showLabel?: boolean;
}

export function TDValueBadge({ transmissionDistance, showLabel = true }: TDValueBadgeProps) {
  if (!transmissionDistance) {
    return (
      <span className="text-sm text-muted-foreground">—</span>
    );
  }

  const isHueForgeReady = transmissionDistance >= 2;
  const isExcellent = transmissionDistance >= 3;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 justify-center">
            <span className={cn(
              "font-mono font-semibold",
              isExcellent ? "text-emerald-400" : isHueForgeReady ? "text-amber-400" : "text-muted-foreground"
            )}>
              {transmissionDistance.toFixed(1)} mm
            </span>
            {isHueForgeReady && showLabel && (
              <Badge className={cn(
                "text-[10px] gap-1",
                isExcellent 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              )}>
                <Lightbulb className="w-3 h-3" />
                HueForge
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px]">
          <p className="text-sm">
            <strong>Transmission Distance:</strong> How far light travels through the filament.
            {isExcellent && " Excellent for HueForge lithophanes!"}
            {isHueForgeReady && !isExcellent && " Good for HueForge projects."}
            {!isHueForgeReady && " May be too opaque for light-based art."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
