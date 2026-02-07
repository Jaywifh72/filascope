import { useState, useEffect } from "react";
import { ShoppingCart, Trophy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import type { ResolvedComparePrice } from "@/hooks/useCompareRegionalPrices";

type Filament = Tables<"filaments">;

interface MobileStickyBuyBarProps {
  filaments: Filament[];
  overallWinnerIndices: number[];
  bestPriceIndices: number[];
  /** Resolved regional prices from useCompareRegionalPrices */
  resolvedPrices: Map<string, ResolvedComparePrice>;
}

export function MobileStickyBuyBar({ 
  filaments, 
  overallWinnerIndices,
  bestPriceIndices,
  resolvedPrices,
}: MobileStickyBuyBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Get the winner or best price filament
  const featuredIndex = overallWinnerIndices[0] ?? bestPriceIndices[0] ?? 0;
  const featuredFilament = filaments[featuredIndex];

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!featuredFilament || !isVisible) return null;

  const resolved = resolvedPrices.get(featuredFilament.id);
  const isWinner = overallWinnerIndices.includes(featuredIndex);
  const inStock = resolved?.inStock ?? featuredFilament.variant_available !== false;

  if (!resolved?.affiliateUrl) return null;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 md:hidden",
      "bg-card/95 backdrop-blur-lg border-t border-border",
      "p-3 transform transition-transform duration-300",
      isVisible ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="flex items-center gap-3">
        {/* Filament info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isWinner && <Trophy className="w-4 h-4 text-amber-500 shrink-0" />}
            <span className="text-xs text-muted-foreground">
              {isWinner ? "Winner" : "Best Value"}
            </span>
          </div>
          <p className="text-sm font-medium truncate">{featuredFilament.product_title}</p>
          {resolved.formattedPricePerKg && (
            <p className={cn(
              "font-mono font-bold",
              isWinner ? "text-amber-400" : "text-primary"
            )}>
              {resolved.formattedPricePerKg}/kg
            </p>
          )}
        </div>

        {/* Buy button */}
        <Button
          asChild
          size="lg"
          disabled={!inStock}
          className={cn(
            "gap-2 font-semibold shrink-0",
            isWinner && "bg-amber-500 hover:bg-amber-400 text-amber-950"
          )}
        >
          <a 
            href={resolved.affiliateUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!inStock) e.preventDefault();
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            Buy Now
            <ExternalLink className="w-3 h-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}
