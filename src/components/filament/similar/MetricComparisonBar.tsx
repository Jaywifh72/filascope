import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricComparisonBarProps {
  label: string;
  currentValue: number;
  compareValue: number;
  maxValue?: number;
  unit?: string;
  lowerIsBetter?: boolean;
  showLabels?: boolean;
}

export function MetricComparisonBar({
  label,
  currentValue,
  compareValue,
  maxValue = 10,
  unit = "",
  lowerIsBetter = false,
  showLabels = true,
}: MetricComparisonBarProps) {
  const currentPercent = Math.min((currentValue / maxValue) * 100, 100);
  const comparePercent = Math.min((compareValue / maxValue) * 100, 100);

  const isBetter = lowerIsBetter
    ? compareValue < currentValue
    : compareValue > currentValue;
  const isWorse = lowerIsBetter
    ? compareValue > currentValue
    : compareValue < currentValue;

  const barColor = isBetter
    ? "bg-green-500"
    : isWorse
    ? "bg-red-400"
    : "bg-muted-foreground";

  const currentBarColor = "bg-primary/40";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group cursor-help space-y-1">
            {showLabels && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-medium ${isBetter ? "text-green-400" : isWorse ? "text-red-400" : "text-muted-foreground"}`}>
                  {compareValue.toFixed(1)}{unit}
                </span>
              </div>
            )}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
              {/* Current value (reference bar) */}
              <div
                className={`absolute left-0 top-0 h-full rounded-full ${currentBarColor} transition-all`}
                style={{ width: `${currentPercent}%` }}
              />
              {/* Compare value (overlay bar) */}
              <div
                className={`absolute left-0 top-0 h-full rounded-full ${barColor} transition-all`}
                style={{ width: `${comparePercent}%` }}
              />
              {/* Reference line at current value */}
              <div
                className="absolute top-0 h-full w-0.5 bg-foreground/60"
                style={{ left: `${currentPercent}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="space-y-1">
            <p className="font-medium">{label}</p>
            <p>
              <span className="text-muted-foreground">Current: </span>
              <span className="text-primary">{currentValue.toFixed(1)}{unit}</span>
            </p>
            <p>
              <span className="text-muted-foreground">This: </span>
              <span className={isBetter ? "text-green-400" : isWorse ? "text-red-400" : ""}>
                {compareValue.toFixed(1)}{unit}
              </span>
            </p>
            {isBetter && (
              <p className="text-green-400 text-[10px]">
                ↑ {lowerIsBetter ? "Lower" : "Higher"} is better
              </p>
            )}
            {isWorse && (
              <p className="text-red-400 text-[10px]">
                ↓ {lowerIsBetter ? "Higher" : "Lower"} than current
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
