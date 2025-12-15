import { useState } from "react";
import { ChevronDown, HelpCircle, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TROUBLESHOOTING_GUIDE, TroubleshootingItem } from "@/lib/printSettingsData";
import { cn } from "@/lib/utils";

interface TroubleshootingGuideProps {
  currentNozzleTemp: number;
  currentBedTemp: number;
  nozzleRange: [number, number];
  bedRange: [number, number];
}

export function TroubleshootingGuide({ 
  currentNozzleTemp, 
  currentBedTemp,
  nozzleRange,
  bedRange
}: TroubleshootingGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getSuggestedTemp = (item: TroubleshootingItem) => {
    const currentTemp = item.tempType === 'nozzle' ? currentNozzleTemp : currentBedTemp;
    const range = item.tempType === 'nozzle' ? nozzleRange : bedRange;
    const suggested = currentTemp + item.adjustment;
    
    // Clamp to valid range
    const clampedMin = Math.max(range[0], Math.min(suggested - 5, suggested));
    const clampedMax = Math.min(range[1], Math.max(suggested + 5, suggested));
    
    return { 
      current: currentTemp, 
      suggested: `${clampedMin}-${clampedMax}`,
      isIncrease: item.adjustment > 0 
    };
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <span className="font-medium text-foreground">Having printing issues?</span>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      
      <CollapsibleContent className="pt-3">
        <div className="space-y-3">
          {TROUBLESHOOTING_GUIDE.map((item) => {
            const temps = getSuggestedTemp(item);
            const isNoTempFix = item.adjustment === 0;
            
            return (
              <div 
                key={item.id}
                className="p-4 bg-background/50 rounded-lg border border-border"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-foreground mb-1">
                      {item.issue}
                    </div>
                    
                    {!isNoTempFix ? (
                      <div className="text-sm mb-2">
                        <span className="text-muted-foreground">→ </span>
                        <span className={cn(
                          "font-medium",
                          temps.isIncrease ? "text-orange-400" : "text-cyan-400"
                        )}>
                          {temps.isIncrease ? 'Increase' : 'Lower'} {item.tempType} temp by {Math.abs(item.adjustment)}°C
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-amber-400 mb-2">
                        → Not a temperature issue
                      </div>
                    )}
                    
                    {!isNoTempFix && (
                      <div className="text-sm text-muted-foreground mb-2">
                        Current: {temps.current}°C → Try: <span className="text-foreground">{temps.suggested}°C</span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {item.additionalTips.map((tip, i) => (
                        <span 
                          key={i}
                          className="text-xs px-2 py-1 bg-muted/50 rounded text-muted-foreground"
                        >
                          {tip}
                        </span>
                      ))}
                    </div>
                    
                    {item.learnMoreUrl && (
                      <a 
                        href={item.learnMoreUrl}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Learn more <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
