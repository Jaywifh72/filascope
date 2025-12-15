import { useState } from "react";
import { Slider } from "@/components/ui/slider";
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
}

export function TemperatureSlider({ 
  label, 
  recommended, 
  range, 
  guidance,
  unit = "°C" 
}: TemperatureSliderProps) {
  const [value, setValue] = useState(recommended);
  
  const min = range[0];
  const max = range[1];
  const rangeSize = max - min;
  const lowThreshold = min + rangeSize * 0.33;
  const highThreshold = min + rangeSize * 0.66;
  
  const getZone = (temp: number): 'low' | 'middle' | 'high' => {
    if (temp < lowThreshold) return 'low';
    if (temp > highThreshold) return 'high';
    return 'middle';
  };
  
  const zone = getZone(value);
  
  const zoneColors = {
    low: 'text-cyan-400',
    middle: 'text-green-400',
    high: 'text-orange-400',
  };
  
  const zoneBgColors = {
    low: 'bg-cyan-500/20',
    middle: 'bg-green-500/20',
    high: 'bg-orange-500/20',
  };

  return (
    <div className="space-y-4 p-4 bg-background/50 border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="text-right">
          <span className={cn("text-2xl font-bold", zoneColors[zone])}>
            {value}{unit}
          </span>
          <div className="text-xs text-muted-foreground">
            Range: {min}-{max}{unit}
          </div>
        </div>
      </div>
      
      {/* Slider */}
      <div className="relative pt-2">
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
          <span>{min}{unit}</span>
          <span className="text-primary font-medium">{recommended}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
      
      {/* Zone indicator */}
      <div className={cn("p-3 rounded-lg text-sm", zoneBgColors[zone])}>
        <div className={cn("font-medium mb-1 capitalize", zoneColors[zone])}>
          {zone === 'middle' ? '✓ Optimal Range' : zone === 'low' ? '↓ Lower Range' : '↑ Higher Range'}
        </div>
        <p className="text-muted-foreground text-xs">
          {guidance[zone]}
        </p>
      </div>
    </div>
  );
}
