import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ColorFinderFilament } from '@/hooks/useColorFinderFilaments';
import { useCurrency } from '@/hooks/useCurrency';

interface Props {
  filament: ColorFinderFilament;
  targetHex: string;
  matchPercent: number;
  td: number;
}

function tdBadge(td: number) {
  if (td < 1) return { label: 'Opaque', className: 'bg-red-500/20 text-red-400 border-red-500/30' };
  if (td <= 3) return { label: 'Mid-tone', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  if (td <= 5) return { label: 'Translucent', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
  return { label: 'Very Translucent', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
}

function matchColor(pct: number) {
  if (pct >= 90) return 'text-green-400';
  if (pct >= 70) return 'text-amber-400';
  return 'text-red-400';
}

export function ColorMatchResultCard({ filament, targetHex, matchPercent, td }: Props) {
  const { formatPrice } = useCurrency();
  const badge = tdBadge(td);
  const price = filament.variant_price;

  return (
    <div className="flex items-stretch gap-0 rounded-lg border border-border/50 bg-muted/10 overflow-hidden hover:border-primary/30 transition-colors">
      {/* Color comparison swatches */}
      <div className="flex shrink-0 w-16 sm:w-20">
        <div className="w-1/2 min-h-[80px]" style={{ backgroundColor: targetHex }} title="Target" />
        <div
          className="w-1/2 min-h-[80px]"
          style={{ backgroundColor: filament.color_hex || '#333' }}
          title="Filament"
        />
      </div>

      {/* Info */}
      <div className="flex-1 p-3 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-bold ${matchColor(matchPercent)}`}>
            {matchPercent}% match
          </span>
          <Badge variant="outline" className={`text-[10px] ${badge.className}`}>
            {badge.label}
          </Badge>
          {filament.material && (
            <Badge variant="secondary" className="text-[10px]">{filament.material}</Badge>
          )}
        </div>
        <p className="text-sm font-medium truncate">
          {filament.vendor} {filament.product_title}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">TD {td.toFixed(2)}</span>
          {price != null && (
            <span>{formatPrice(price)}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
          {filament.product_handle && (
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" asChild>
              <Link to={`/filament/${filament.product_handle}`}>
                <Eye className="w-3 h-3 mr-1" /> Details
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
