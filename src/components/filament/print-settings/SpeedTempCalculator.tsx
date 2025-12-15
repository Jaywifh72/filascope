import { useState } from "react";
import { Zap, ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getSpeedTempRecommendation, SPEED_TEMP_BRACKETS } from "@/lib/printSettingsData";
import { cn } from "@/lib/utils";

interface SpeedTempCalculatorProps {
  baseNozzleTemp: number;
}

export function SpeedTempCalculator({ baseNozzleTemp }: SpeedTempCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [speed, setSpeed] = useState(60);
  
  const recommendation = getSpeedTempRecommendation(baseNozzleTemp, speed);
  
  const getSpeedZone = (s: number) => {
    if (s <= 40) return 'detail';
    if (s <= 80) return 'balanced';
    if (s <= 150) return 'fast';
    return 'extreme';
  };
  
  const zone = getSpeedZone(speed);
  
  const zoneColors = {
    detail: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    balanced: 'text-green-400 bg-green-500/10 border-green-500/20',
    fast: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    extreme: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-medium text-foreground">Speed ↔ Temperature Calculator</span>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      
      <CollapsibleContent className="pt-4">
        <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border">
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">
              What speed are you printing at?
            </label>
            
            <div className="space-y-2">
              <Slider
                value={[speed]}
                min={20}
                max={200}
                step={5}
                onValueChange={(v) => setSpeed(v[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>20mm/s</span>
                <span className="text-foreground font-medium text-base">{speed} mm/s</span>
                <span>200mm/s</span>
              </div>
            </div>
          </div>
          
          <div className={cn(
            "p-4 rounded-lg border transition-colors",
            zoneColors[zone]
          )}>
            <div className="font-medium mb-1">
              Recommended Temperature: {recommendation.min}-{recommendation.max}°C
            </div>
            <div className="text-sm opacity-80">
              {recommendation.note}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Speed Reference
            </div>
            <div className="grid gap-2">
              {SPEED_TEMP_BRACKETS.map((bracket, i) => {
                const isActive = speed >= bracket.minSpeed && speed < bracket.maxSpeed;
                const adjustedMin = baseNozzleTemp + bracket.tempAdjustment;
                const adjustedMax = adjustedMin + 5;
                
                return (
                  <div 
                    key={i}
                    className={cn(
                      "flex items-center justify-between p-2 rounded text-sm transition-colors",
                      isActive ? "bg-primary/10 text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <span>
                      {bracket.minSpeed}-{bracket.maxSpeed === 999 ? '200+' : bracket.maxSpeed} mm/s
                    </span>
                    <span className={cn(isActive && "font-medium text-primary")}>
                      {adjustedMin}-{adjustedMax}°C
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
