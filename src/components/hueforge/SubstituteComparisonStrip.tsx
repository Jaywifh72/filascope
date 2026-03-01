import { getSwatchColor } from '@/lib/swatchColor';
import type { TDFilament } from './SubstituteFilamentPicker';

interface Props {
  source: TDFilament;
  substitutes: TDFilament[];
}

export function SubstituteComparisonStrip({ source, substitutes }: Props) {
  const top3 = substitutes.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
      <span className="text-xs text-muted-foreground shrink-0">Color Compare:</span>
      <div className="flex items-center gap-2">
        <div className="text-center">
          <div
            className="w-8 h-8 rounded-full border-2 border-primary"
            style={{ backgroundColor: getSwatchColor(source.color_hex, source.color_family) }}
          />
          <span className="text-[10px] text-muted-foreground">Source</span>
        </div>
        <span className="text-muted-foreground text-xs">→</span>
        {top3.map((f, i) => (
          <div key={f.id} className="text-center">
            <div
              className="w-8 h-8 rounded-full border border-border"
              style={{ backgroundColor: getSwatchColor(f.color_hex, f.color_family) }}
            />
            <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
