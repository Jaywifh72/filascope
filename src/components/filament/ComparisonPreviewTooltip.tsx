import { Trophy, DollarSign, Dumbbell, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonPreviewTooltipProps {
  current: {
    name: string;
    pricePerKg: number | null;
    strength: number | null;
    ease: number | null;
  };
  comparison: {
    name: string;
    pricePerKg: number | null;
    strength: number | null;
    ease: number | null;
  };
  diffs: {
    price: { value: number; formatted: string; better: "current" | "comparison" | "same" } | null;
    strength: { value: number; formatted: string; better: "current" | "comparison" | "same" } | null;
    ease: { value: number; formatted: string; better: "current" | "comparison" | "same" } | null;
  };
}

function ComparisonRow({
  label,
  icon: Icon,
  currentValue,
  comparisonValue,
  diff,
  formatValue,
  lowerIsBetter = false
}: {
  label: string;
  icon: React.ElementType;
  currentValue: number | null;
  comparisonValue: number | null;
  diff: { value: number; formatted: string; better: "current" | "comparison" | "same" } | null;
  formatValue: (val: number | null) => string;
  lowerIsBetter?: boolean;
}) {
  if (currentValue === null && comparisonValue === null) return null;

  return (
    <div className="grid grid-cols-[80px_1fr_1fr] gap-2 items-center text-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </div>
      <div className={cn(
        "text-center font-medium",
        diff?.better === "current" && "text-green-400"
      )}>
        {formatValue(currentValue)}
        {diff?.better === "current" && <Trophy className="w-3 h-3 inline ml-1 text-amber-400" />}
      </div>
      <div className={cn(
        "text-center font-medium",
        diff?.better === "comparison" && "text-green-400"
      )}>
        {formatValue(comparisonValue)}
        {diff && diff.better !== "same" && (
          <span className={cn(
            "ml-1 text-xs",
            diff.better === "comparison" ? "text-green-400" : "text-muted-foreground"
          )}>
            ({diff.formatted})
          </span>
        )}
        {diff?.better === "comparison" && <Trophy className="w-3 h-3 inline ml-1 text-amber-400" />}
      </div>
    </div>
  );
}

export function ComparisonPreviewTooltip({
  current,
  comparison,
  diffs
}: ComparisonPreviewTooltipProps) {
  const formatPrice = (val: number | null) => val !== null ? `$${val.toFixed(2)}/kg` : "—";
  const formatScore = (val: number | null) => val !== null ? val.toFixed(1) : "—";

  return (
    <div className="w-72 p-3 space-y-3">
      {/* Header */}
      <div className="grid grid-cols-[80px_1fr_1fr] gap-2 text-xs font-medium text-muted-foreground border-b border-border/50 pb-2">
        <div></div>
        <div className="text-center truncate" title={current.name}>Current</div>
        <div className="text-center truncate text-primary" title={comparison.name}>Alternative</div>
      </div>

      {/* Comparison rows */}
      <div className="space-y-2">
        <ComparisonRow
          label="Price"
          icon={DollarSign}
          currentValue={current.pricePerKg}
          comparisonValue={comparison.pricePerKg}
          diff={diffs.price}
          formatValue={formatPrice}
          lowerIsBetter
        />
        <ComparisonRow
          label="Strength"
          icon={Dumbbell}
          currentValue={current.strength}
          comparisonValue={comparison.strength}
          diff={diffs.strength}
          formatValue={formatScore}
        />
        <ComparisonRow
          label="Ease"
          icon={Sparkles}
          currentValue={current.ease}
          comparisonValue={comparison.ease}
          diff={diffs.ease}
          formatValue={formatScore}
        />
      </div>

      {/* Footer hint */}
      <div className="text-xs text-center text-muted-foreground pt-2 border-t border-border/50">
        Click for full comparison →
      </div>
    </div>
  );
}
