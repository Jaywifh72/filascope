import { ShoppingCart, Calculator, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/hooks/useCompare";
import { useRegion } from "@/contexts/RegionContext";
import { cn } from "@/lib/utils";

interface FilamentMobileBottomBarProps {
  filamentId: string;
  pricePerKg: number | null;
  affiliateUrl: string | null;
  storeName?: string;
  storeRegion?: string;
  isConverted?: boolean;
  onOpenCalculator?: () => void;
}

export function FilamentMobileBottomBar({
  filamentId,
  pricePerKg,
  affiliateUrl,
  storeName = 'Store',
  storeRegion,
  isConverted = false,
  onOpenCalculator,
}: FilamentMobileBottomBarProps) {
  const { formatPrice, region: userRegion } = useRegion();
  const { count: compareCount } = useCompare();

  // Don't show if compare bar is active
  if (compareCount > 0) return null;

  // Region flags for display
  const regionFlags: Record<string, string> = {
    US: '🇺🇸', CA: '🇨🇦', UK: '🇬🇧', EU: '🇪🇺', AU: '🇦🇺', JP: '🇯🇵', CN: '🇨🇳', GLOBAL: '🌐'
  };
  
  // Show flag if store region differs from user region
  const showRegionFlag = storeRegion && storeRegion !== userRegion && storeRegion !== 'GLOBAL';
  const regionFlag = storeRegion ? regionFlags[storeRegion] || '' : '';

  // Remove trailing region codes like "Amazon US" -> "Amazon"
  // (only when we're already showing the flag separately)
  const cleanStoreName = showRegionFlag
    ? storeName.replace(/\s+(US|UK|EU|CA|AU|JP|CN|DE)$/i, '')
    : storeName;

  const handleBuyClick = () => {
    if (!affiliateUrl) return;
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  // Format price with tilde for converted prices
  const formattedPrice = pricePerKg 
    ? `${isConverted ? '~' : ''}${formatPrice(pricePerKg, { showApproximate: false })}`
    : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Gradient overlay for better visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background to-transparent -top-4 pointer-events-none" />
      
      {/* Bottom bar content */}
      <div 
        className="relative bg-card border-t border-border/60 px-4 py-3 flex items-center justify-between gap-4"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        {/* Price section - Simple display */}
        <div className="flex-1 min-w-0">
          {formattedPrice ? (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-foreground">
                  {formattedPrice}
                </span>
                <span className="text-sm text-muted-foreground">/kg</span>
              </div>
              <span className="text-xs text-muted-foreground truncate">
                from {cleanStoreName} {showRegionFlag && regionFlag}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-medium text-muted-foreground">Price varies</span>
              <span className="text-xs text-muted-foreground">Check at store</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Calculator button */}
          {onOpenCalculator && (
            <Button 
              size="lg"
              variant="outline"
              onClick={onOpenCalculator}
              className="px-3 border-border/60"
              aria-label="Open print calculator"
            >
              <Calculator className="h-5 w-5" />
            </Button>
          )}
          
          {/* Buy button - always "Buy at [Store]" */}
          {affiliateUrl ? (
            <Button 
              size="lg" 
              onClick={handleBuyClick}
              variant="default"
              className={cn(
                "gap-2 px-4 min-h-11",
                "bg-gradient-to-r from-primary to-primary/80",
                "hover:from-primary/90 hover:to-primary/70",
                "shadow-[0_2px_8px_rgba(0,212,212,0.2)]"
              )}
            >
              <ShoppingCart className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Buy at {cleanStoreName}</span>
              <ExternalLink className="h-3 w-3 opacity-70 flex-shrink-0" />
            </Button>
          ) : (
            <Button size="lg" disabled className="gap-2 px-4 opacity-50">
              <ShoppingCart className="h-4 w-4" />
              <span>Unavailable</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
