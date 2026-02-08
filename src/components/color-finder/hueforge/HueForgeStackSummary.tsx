import { useMemo } from 'react';
import { Copy, Share2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { normalizeColorHex, cn } from '@/lib/utils';
import { useRegion } from '@/contexts/RegionContext';
import { resolveFilamentPrice, type FilamentForPricing, type PriceResolutionContext } from '@/lib/resolveFilamentPrice';
import { toast } from 'sonner';
import { getTdBadgeStyle } from './HueForgeFilamentMatch';
import type { ColorFinderFilament } from '@/hooks/useColorFinderFilaments';

interface LayerWithMatch {
  hex: string;
  label: string;
  bestMatch: (ColorFinderFilament & { matchPercent: number }) | null;
}

interface HueForgeStackSummaryProps {
  layers: LayerWithMatch[];
}

export function HueForgeStackSummary({ layers }: HueForgeStackSummaryProps) {
  const { currency, convertPrice, hasRates, formatPrice, currencyConfig } = useRegion();

  const priceContext: PriceResolutionContext = {
    userCurrency: currency,
    convertFromCurrency: convertPrice,
    hasRates,
  };

  // Calculate total cost from cheapest per layer
  const { totalCost, layerDetails, hasAnyConverted } = useMemo(() => {
    let total = 0;
    let anyConverted = false;
    const details = layers.map((layer, i) => {
      if (!layer.bestMatch) return { ...layer, price: null, isConverted: false };
      const resolved = resolveFilamentPrice(layer.bestMatch as FilamentForPricing, priceContext);
      if (resolved.spoolPrice !== null) {
        total += resolved.spoolPrice;
        if (resolved.isConverted) anyConverted = true;
      }
      return { ...layer, price: resolved.spoolPrice, isConverted: resolved.isConverted };
    });
    return { totalCost: total, layerDetails: details, hasAnyConverted: anyConverted };
  }, [layers, priceContext]);

  const handleExportStack = () => {
    const lines = layers.map((layer, i) => {
      if (!layer.bestMatch) {
        return `Layer ${i + 1}: ${layer.hex} — No match found`;
      }
      const resolved = resolveFilamentPrice(layer.bestMatch as FilamentForPricing, priceContext);
      const priceStr = resolved.spoolPrice !== null
        ? ` — ${resolved.isConverted ? '~' : ''}${formatPrice(resolved.spoolPrice)}`
        : '';
      const tdStr = layer.bestMatch.transmission_distance != null
        ? ` (TD ${layer.bestMatch.transmission_distance})`
        : '';
      return `Layer ${i + 1}: ${layer.hex} — ${layer.bestMatch.vendor || ''} ${layer.bestMatch.product_title}${tdStr}${priceStr}`;
    });

    const totalLine = totalCost > 0
      ? `\nEstimated total: ${hasAnyConverted ? '~' : ''}${formatPrice(totalCost)}`
      : '';

    navigator.clipboard.writeText(lines.join('\n') + totalLine + '\n\nBuilt with FilaScope HueForge Stack Builder');
    toast.success('Stack exported to clipboard');
  };

  const handleShareStack = () => {
    const params = new URLSearchParams();
    params.set('mode', 'hueforge');
    const hexes = layers.map(l => l.hex.replace('#', '')).join(',');
    params.set('stack', hexes);
    const url = `${window.location.origin}/colors?${params.toString()}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard');
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        Stack Summary
      </h3>

      {/* Visual Stack Preview — horizontal colored bars */}
      <div className="flex rounded-lg overflow-hidden h-10 border border-border/50">
        {layers.map((layer, i) => (
          <div
            key={i}
            className="flex-1 relative group"
            style={{ backgroundColor: layer.hex }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
              <span className="text-[10px] font-mono text-white font-bold drop-shadow">
                {layer.hex}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Layer breakdown */}
      <div className="space-y-2">
        {layerDetails.map((layer, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div
              className="w-5 h-5 rounded border border-border/50 shrink-0"
              style={{ backgroundColor: layer.hex }}
            />
            <span className="text-muted-foreground font-mono w-16 shrink-0">{layer.hex}</span>
            {layer.bestMatch ? (
              <>
                <span className="text-foreground truncate flex-1">
                  {layer.bestMatch.vendor} {layer.bestMatch.product_title}
                </span>
                {layer.bestMatch.transmission_distance != null && (
                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0",
                    getTdBadgeStyle(layer.bestMatch.transmission_distance)
                  )}>
                    TD {layer.bestMatch.transmission_distance}
                  </span>
                )}
                {layer.price !== null && (
                  <span className="text-muted-foreground font-mono shrink-0">
                    {layer.isConverted && '~'}{formatPrice(layer.price)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground italic">No match found</span>
            )}
          </div>
        ))}
      </div>

      {/* Total cost */}
      {totalCost > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-sm font-medium text-foreground">Estimated Total Cost</span>
          <span className="text-lg font-bold text-primary font-mono">
            {hasAnyConverted && '~'}{formatPrice(totalCost)}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportStack}
          className="flex-1 text-xs"
        >
          <Copy className="w-3.5 h-3.5 mr-1.5" />
          Export Stack
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareStack}
          className="flex-1 text-xs"
        >
          <Share2 className="w-3.5 h-3.5 mr-1.5" />
          Share Stack
        </Button>
      </div>
    </div>
  );
}
