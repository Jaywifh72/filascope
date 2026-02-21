import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { normalizeColorHex } from '@/lib/utils';
import { getColorMatchPercent } from '@/lib/colorMatchUtils';
import { MaterialBadge } from '@/components/MaterialBadge';
import { Sun } from 'lucide-react';
import { useRegion } from '@/contexts/RegionContext';
import { resolveFilamentPrice, type FilamentForPricing, type PriceResolutionContext } from '@/lib/resolveFilamentPrice';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ColorResultCardProps {
  filament: {
    id: string;
    product_title: string;
    vendor: string | null;
    material: string | null;
    color_hex: string | null;
    color_family: string | null;
    variant_price: number | null;
    net_weight_g: number | null;
    featured_image: string | null;
    product_handle: string | null;
    transmission_distance: number | null;
    pack_quantity: number | null;
    price_cad?: number | null;
    price_eur?: number | null;
    price_gbp?: number | null;
    price_aud?: number | null;
    price_jpy?: number | null;
  };
  searchHex: string;
}

export function ColorResultCard({ filament, searchHex }: ColorResultCardProps) {
  const { currency, convertPrice, hasRates, formatPrice } = useRegion();
  const colorHex = filament.color_hex ? normalizeColorHex(filament.color_hex) : '#888';
  const matchPercent = filament.color_hex ? getColorMatchPercent(searchHex, normalizeColorHex(filament.color_hex)) : 0;

  // Pulse animation for near-perfect matches
  const [showPulse, setShowPulse] = useState(matchPercent >= 95);
  useEffect(() => {
    if (matchPercent >= 95) {
      const timer = setTimeout(() => setShowPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [matchPercent]);

  const priceContext: PriceResolutionContext = {
    userCurrency: currency,
    convertFromCurrency: convertPrice,
    hasRates,
  };
  const resolved = resolveFilamentPrice(filament as FilamentForPricing, priceContext);

  const matchColor = matchPercent >= 90 ? 'text-green-400 bg-green-500/15 border-green-500/30'
    : matchPercent >= 70 ? 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30'
    : matchPercent >= 50 ? 'text-orange-400 bg-orange-500/15 border-orange-500/30'
    : 'text-muted-foreground bg-muted/50 border-border';

  const hasTd = filament.transmission_distance != null;

  return (
    <Link
      to={`/filament/${filament.product_handle || filament.id}`}
      className="group flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
    >
      {/* Color Swatch */}
      <div
        className="w-12 h-12 rounded-lg border border-border/50 shrink-0 shadow-inner"
        style={{ backgroundColor: colorHex }}
      />

      {/* Product Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {filament.product_title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {filament.vendor && (
            <span className="text-xs text-muted-foreground">{filament.vendor}</span>
          )}
          {filament.material && (
            <MaterialBadge material={filament.material} size="sm" showTooltip={false} />
          )}
          {/* TD Badge */}
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <span className={cn(
                "inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full",
                hasTd
                  ? "bg-cyan-500/15 text-cyan-400"
                  : "bg-muted/30 text-muted-foreground/50"
              )}>
                <Sun className="w-3 h-3" />
                TD {hasTd ? filament.transmission_distance : '—'}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[240px]">
              Transmissivity Distance — used in HueForge for filament painting. Lower = more opaque.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Match + Price */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={cn(
          "text-xs font-mono font-semibold px-2 py-0.5 rounded-md border",
          matchColor,
          showPulse && "animate-pulse"
        )}>
          {matchPercent}%
        </span>
        {resolved.spoolPrice !== null && (
          <span className="text-xs text-muted-foreground font-mono">
            {resolved.isConverted && '~'}{formatPrice(resolved.spoolPrice)}
          </span>
        )}
      </div>
    </Link>
  );
}
