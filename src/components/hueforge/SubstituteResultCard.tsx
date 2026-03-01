import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye } from 'lucide-react';
import type { TDFilament } from './SubstituteFilamentPicker';

type MatchBadge = 'perfect' | 'close' | 'td_only' | 'budget' | null;

interface Props {
  filament: TDFilament;
  sourceTd: number;
  badge: MatchBadge;
  formatPrice?: (price: number) => string;
}

const badgeConfig: Record<NonNullable<MatchBadge>, { label: string; className: string }> = {
  perfect: { label: 'Perfect Match', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  close: { label: 'Close Match', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  td_only: { label: 'TD Match Only', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  budget: { label: 'Budget Alternative', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

function getDeltaColor(delta: number): string {
  const abs = Math.abs(delta);
  if (abs <= 0.05) return 'text-green-400';
  if (abs <= 0.2) return 'text-amber-400';
  return 'text-muted-foreground';
}

export function SubstituteResultCard({ filament, sourceTd, badge, formatPrice }: Props) {
  const td = filament.transmission_distance ?? 0;
  const delta = td - sourceTd;
  const deltaStr = delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card hover:border-primary/30 transition-colors">
      {/* Color swatch */}
      <div
        className="w-8 h-8 rounded-full border shrink-0 mt-0.5"
        style={{ backgroundColor: filament.color_hex || '#666' }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{filament.vendor}</p>
            <p className="text-xs text-muted-foreground truncate">{filament.product_title}</p>
          </div>
          {badge && (
            <Badge variant="outline" className={`shrink-0 text-[10px] ${badgeConfig[badge].className}`}>
              {badgeConfig[badge].label}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-sm font-semibold">
            TD {td.toFixed(2)}{' '}
            <span className={`text-xs ${getDeltaColor(delta)}`}>(Δ {deltaStr})</span>
          </span>
          {filament.color_family && (
            <Badge variant="outline" className="text-[10px]">{filament.color_family}</Badge>
          )}
          {filament.material && (
            <Badge variant="outline" className="text-[10px]">{filament.material}</Badge>
          )}
          {filament.variant_price != null && formatPrice && (
            <span className="text-xs text-muted-foreground">{formatPrice(filament.variant_price)}</span>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2" asChild>
            <Link to={`/filament/${filament.product_handle || filament.id}`}>
              <Eye className="w-3 h-3 mr-1" /> View Details
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function getMatchBadge(
  filament: TDFilament,
  sourceTd: number,
  sourceColorFamily: string | null,
  sourcePrice: number | null
): MatchBadge {
  const td = filament.transmission_distance ?? 0;
  const absDiff = Math.abs(td - sourceTd);
  const sameColor = filament.color_family === sourceColorFamily && !!sourceColorFamily;

  // Budget Alternative: 20%+ cheaper, within ±0.3 TD, same color
  if (
    sameColor &&
    absDiff <= 0.3 &&
    sourcePrice != null &&
    filament.variant_price != null &&
    filament.variant_price < sourcePrice * 0.8
  ) {
    return 'budget';
  }

  if (sameColor && absDiff <= 0.05) return 'perfect';
  if (sameColor && absDiff <= 0.2) return 'close';
  if (!sameColor && absDiff <= 0.1) return 'td_only';

  return null;
}
