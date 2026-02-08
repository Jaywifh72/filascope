import { COLOR_FAMILIES } from '@/lib/colorMatchUtils';
import { cn } from '@/lib/utils';

interface PopularColorsProps {
  selectedHex: string;
  onSelectColor: (hex: string) => void;
}

export function PopularColors({ selectedHex, onSelectColor }: PopularColorsProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Popular Colors</h3>
      <div className="flex flex-wrap gap-2">
        {COLOR_FAMILIES.filter(f => !f.hex.includes('gradient')).map((family) => {
          const isSelected = selectedHex.toUpperCase() === family.hex.toUpperCase();
          return (
            <button
              key={family.name}
              onClick={() => onSelectColor(family.hex)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all duration-150",
                isSelected
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/50"
                  : "border-border/50 bg-card/50 text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
              )}
              title={family.name}
            >
              <span
                className="w-4 h-4 rounded-full border border-border/50 shrink-0"
                style={{ backgroundColor: family.hex }}
              />
              <span>{family.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
