import { Clock, Target, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemperaturePredictionsProps {
  currentTemp: number;
  optimalTemp: number;
  range: [number, number];
}

export function TemperaturePredictions({ currentTemp, optimalTemp, range }: TemperaturePredictionsProps) {
  const diff = currentTemp - optimalTemp;
  const rangeSize = range[1] - range[0];
  
  // Calculate predictions based on temperature difference from optimal
  // These are simplified formulas for educational/illustrative purposes
  const printTimeChange = Math.round((optimalTemp - currentTemp) * 0.4);
  const detailChange = Math.round((optimalTemp - currentTemp) * 0.3);
  const strengthChange = Math.round((currentTemp - optimalTemp) * 0.4);
  
  const formatChange = (value: number) => {
    if (value === 0) return '±0%';
    return value > 0 ? `+${value}%` : `${value}%`;
  };
  
  const getChangeColor = (value: number, inverse = false) => {
    const v = inverse ? -value : value;
    if (v > 0) return 'text-green-400';
    if (v < 0) return 'text-orange-400';
    return 'text-muted-foreground';
  };

  // Determine if we're in optimal zone
  const isOptimal = Math.abs(diff) <= rangeSize * 0.15;

  return (
    <div className={cn(
      "mt-3 p-3 rounded-lg border transition-colors duration-200",
      isOptimal 
        ? "bg-green-500/10 border-green-500/20" 
        : "bg-muted/30 border-border"
    )}>
      <div className="text-xs text-muted-foreground mb-2">
        At {currentTemp}°C:
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <div className="text-sm">
            <span className="text-muted-foreground">Time: </span>
            <span className={cn("font-medium", getChangeColor(printTimeChange, true))}>
              {formatChange(printTimeChange)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" />
          <div className="text-sm">
            <span className="text-muted-foreground">Detail: </span>
            <span className={cn("font-medium", getChangeColor(detailChange))}>
              {formatChange(detailChange)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-muted-foreground" />
          <div className="text-sm">
            <span className="text-muted-foreground">Strength: </span>
            <span className={cn("font-medium", getChangeColor(strengthChange))}>
              {formatChange(strengthChange)}
            </span>
          </div>
        </div>
      </div>
      {isOptimal && (
        <div className="mt-2 text-xs text-green-400 font-medium">
          ✓ Optimal temperature zone
        </div>
      )}
    </div>
  );
}
