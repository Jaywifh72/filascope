import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { TemperaturePredictions } from "./TemperaturePredictions";
import { cn } from "@/lib/utils";

interface TemperatureSliderProps {
  label: string;
  recommended: number;
  range: [number, number];
  guidance: {
    low: string;
    middle: string;
    high: string;
  };
  unit?: string;
  showPredictions?: boolean;
}

export function TemperatureSlider({ 
  label, 
  recommended, 
  range, 
  guidance,
  unit = "°C",
  showPredictions = false
}: TemperatureSliderProps) {
  const [value, setValue] = useState(recommended);
  
  const min = range[0];
  const max = range[1];
  const rangeSize = max - min;
  
  // Calculate zone thresholds - optimal zone is ±10% around recommended
  const optimalMargin = rangeSize * 0.15;
  const lowThreshold = recommended - optimalMargin;
  const highThreshold = recommended + optimalMargin;
  
  const getZone = (temp: number): 'low' | 'optimal' | 'high' | 'extreme-low' | 'extreme-high' => {
    if (temp < min + rangeSize * 0.1) return 'extreme-low';
    if (temp > max - rangeSize * 0.1) return 'extreme-high';
    if (temp < lowThreshold) return 'low';
    if (temp > highThreshold) return 'high';
    return 'optimal';
  };
  
  const zone = getZone(value);
  
  const zoneColors = {
    'extreme-low': 'text-red-400',
    'low': 'text-cyan-400',
    'optimal': 'text-green-400',
    'high': 'text-orange-400',
    'extreme-high': 'text-red-400',
  };
  
  const zoneBgColors = {
    'extreme-low': 'bg-red-500/20 border-red-500/30',
    'low': 'bg-cyan-500/20 border-cyan-500/30',
    'optimal': 'bg-green-500/20 border-green-500/30',
    'high': 'bg-orange-500/20 border-orange-500/30',
    'extreme-high': 'bg-red-500/20 border-red-500/30',
  };
  
  const zoneLabels = {
    'extreme-low': '⚠️ Below Recommended',
    'low': '↓ Lower Range',
    'optimal': '✓ Optimal Range',
    'high': '↑ Higher Range',
    'extreme-high': '⚠️ Above Recommended',
  };
  
  // Map zone to guidance key
  const getGuidanceKey = (z: typeof zone): 'low' | 'middle' | 'high' => {
    if (z === 'extreme-low' || z === 'low') return 'low';
    if (z === 'extreme-high' || z === 'high') return 'high';
    return 'middle';
  };
  
  // Calculate gradient position percentages for zone markers
  const lowZoneEnd = ((lowThreshold - min) / rangeSize) * 100;
  const highZoneStart = ((highThreshold - min) / rangeSize) * 100;

  return (
    <div className="space-y-4 p-4 bg-background/50 border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="text-right">
          <span className={cn("text-2xl font-bold tabular-nums transition-colors", zoneColors[zone])}>
            {value}{unit}
          </span>
          <div className="text-xs text-muted-foreground">
            Range: {min}-{max}{unit}
          </div>
        </div>
      </div>
      
      {/* Color gradient track indicator */}
      <div className="relative h-2 rounded-full overflow-hidden bg-muted/30">
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, 
              hsl(var(--destructive)) 0%, 
              hsl(188 100% 50%) ${lowZoneEnd * 0.5}%, 
              hsl(142 76% 36%) ${lowZoneEnd}%, 
              hsl(142 76% 36%) ${highZoneStart}%, 
              hsl(24 95% 53%) ${highZoneStart + (100 - highZoneStart) * 0.5}%, 
              hsl(var(--destructive)) 100%
            )`
          }}
        />
        {/* Current position indicator */}
        <div 
          className="absolute top-0 w-1 h-full bg-foreground rounded-full shadow-lg transition-all duration-150"
          style={{ left: `calc(${((value - min) / rangeSize) * 100}% - 2px)` }}
        />
      </div>
      
      {/* Slider */}
      <div className="relative">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={1}
          onValueChange={(v) => setValue(v[0])}
          className="w-full"
        />
        
        {/* Range labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span className="text-red-400">{min}{unit}</span>
          <span className="text-green-400 font-medium">{recommended}{unit} (optimal)</span>
          <span className="text-red-400">{max}{unit}</span>
        </div>
      </div>
      
      {/* Zone indicator */}
      <div className={cn("p-3 rounded-lg text-sm border transition-colors", zoneBgColors[zone])}>
        <div className={cn("font-medium mb-1", zoneColors[zone])}>
          {zoneLabels[zone]}
        </div>
        <p className="text-muted-foreground text-xs">
          {guidance[getGuidanceKey(zone)]}
        </p>
      </div>
      
      {/* Predictions panel */}
      {showPredictions && (
        <TemperaturePredictions 
          currentTemp={value}
          optimalTemp={recommended}
          range={range}
        />
      )}
    </div>
  );
}
