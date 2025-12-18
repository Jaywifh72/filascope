import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeightOption {
  weight: number;
  pricePerKg: number | null;
  count: number;
}

interface SpoolSizeSelectorProps {
  weights: WeightOption[];
  selectedWeight: number | null;
  onSelectWeight: (weight: number | null) => void;
  className?: string;
}

const formatWeight = (weightG: number): string => {
  if (weightG >= 1000) {
    return `${(weightG / 1000).toFixed(weightG % 1000 === 0 ? 0 : 1)}kg`;
  }
  return `${weightG}g`;
};

export function SpoolSizeSelector({
  weights,
  selectedWeight,
  onSelectWeight,
  className,
}: SpoolSizeSelectorProps) {
  if (weights.length <= 1) return null;

  // Find best value (lowest price per kg)
  const bestValueWeight = weights.reduce((best, curr) => {
    if (!curr.pricePerKg) return best;
    if (!best || !best.pricePerKg) return curr;
    return curr.pricePerKg < best.pricePerKg ? curr : best;
  }, null as WeightOption | null);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Spool Size
        </h3>
        {selectedWeight && (
          <button
            onClick={() => onSelectWeight(null)}
            className="text-xs text-primary hover:underline ml-auto"
          >
            Show all sizes
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {weights.map((option) => {
          const isSelected = selectedWeight === option.weight;
          const isBestValue = bestValueWeight?.weight === option.weight && weights.length > 1;
          
          return (
            <button
              key={option.weight}
              onClick={() => onSelectWeight(isSelected ? null : option.weight)}
              className={cn(
                "relative flex flex-col items-center px-4 py-2.5 rounded-lg border-2 transition-all min-w-[80px]",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              {isBestValue && (
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded-full">
                  Best
                </span>
              )}
              <span className="text-sm font-bold">{formatWeight(option.weight)}</span>
              {option.pricePerKg && (
                <span className="text-xs text-muted-foreground font-mono">
                  ${option.pricePerKg.toFixed(2)}/kg
                </span>
              )}
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {option.count} color{option.count !== 1 ? 's' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
