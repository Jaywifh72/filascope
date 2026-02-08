import { Link } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import { normalizeColorHex, cn } from '@/lib/utils';
import { useRegion } from '@/contexts/RegionContext';
import { resolveFilamentPrice, type FilamentForPricing, type PriceResolutionContext } from '@/lib/resolveFilamentPrice';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ColorFinderFilament } from '@/hooks/useColorFinderFilaments';

interface HueForgeFilamentMatchProps {
  filament: ColorFinderFilament & { matchPercent: number };
}

function getTdBadgeStyle(td: number): string {
  if (td >= 6) return 'text-blue-400 bg-blue-500/15 border-blue-500/30';
  if (td >= 3) return 'text-green-400 bg-green-500/15 border-green-500/30';
  return 'text-orange-400 bg-orange-500/15 border-orange-500/30';
}

function getMatchBadgeStyle(matchPercent: number): string {
  if (matchPercent >= 90) return 'text-green-400 bg-green-500/15 border-green-500/30';
  if (matchPercent >= 70) return 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30';
  if (matchPercent >= 50) return 'text-orange-400 bg-orange-500/15 border-orange-500/30';
  return 'text-muted-foreground bg-muted/50 border-border';
}

export function HueForgeFilamentMatch({ filament }: HueForgeFilamentMatchProps) {
  const { currency, convertPrice, hasRates, formatPrice } = useRegion();
  const colorHex = filament.color_hex ? normalizeColorHex(filament.color_hex) : '#888';

  const priceContext: PriceResolutionContext = {
    userCurrency: currency,
    convertFromCurrency: convertPrice,
    hasRates,
  };
  const resolved = resolveFilamentPrice(filament as FilamentForPricing, priceContext);

  return (
    <Link
      to={`/filament/${filament.product_handle || filament.id}`}
      className="group flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-primary/5 transition-colors"
    >
      {/* Color swatch */}
      <div
        className="w-6 h-6 rounded-md border border-border/50 shrink-0"
        style={{ backgroundColor: colorHex }}
      />

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {filament.product_title}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {filament.vendor}
        </p>
      </div>

      {/* TD Badge */}
      {filament.transmission_distance != null && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn(
                "flex items-center gap-0.5 text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded border shrink-0",
                getTdBadgeStyle(filament.transmission_distance)
              )}>
                <Lightbulb className="w-3 h-3" />
                TD {filament.transmission_distance}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs">
              <p className="font-semibold mb-1">TD (Transmissivity Data)</p>
              <p>Measures how much light passes through the filament. Lower values = more opaque, higher = more translucent. Essential for HueForge prints.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Match % */}
      <span className={cn(
        "text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded border shrink-0",
        getMatchBadgeStyle(filament.matchPercent)
      )}>
        {filament.matchPercent}%
      </span>

      {/* Price */}
      {resolved.spoolPrice !== null && (
        <span className="text-[11px] text-muted-foreground font-mono shrink-0">
          {resolved.isConverted && '~'}{formatPrice(resolved.spoolPrice)}
        </span>
      )}
    </Link>
  );
}

// Re-export the TD badge style helper for use in stack summary
export { getTdBadgeStyle };
