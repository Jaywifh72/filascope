import { useState, useEffect } from "react";
import { Thermometer, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ENVIRONMENT_ADJUSTMENTS, EnvironmentAdjustment } from "@/lib/printSettingsData";
import { cn } from "@/lib/utils";

interface SeasonalAdjustmentsProps {
  baseNozzleTemp: number;
  baseBedTemp: number;
}

export function SeasonalAdjustments({ baseNozzleTemp, baseBedTemp }: SeasonalAdjustmentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<'cold' | 'normal' | 'hot'>('normal');
  
  // Load preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('filascope_room_temp_pref');
    if (stored && ['cold', 'normal', 'hot'].includes(stored)) {
      setSelectedEnv(stored as 'cold' | 'normal' | 'hot');
    }
  }, []);
  
  const handleEnvChange = (env: 'cold' | 'normal' | 'hot') => {
    setSelectedEnv(env);
    localStorage.setItem('filascope_room_temp_pref', env);
  };
  
  const currentEnv = ENVIRONMENT_ADJUSTMENTS.find(e => e.id === selectedEnv)!;
  
  const adjustedNozzle = baseNozzleTemp + currentEnv.nozzleAdjust;
  const adjustedBed = baseBedTemp + currentEnv.bedAdjust;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-blue-400" />
          <span className="font-medium text-foreground">Environment Adjustments</span>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      
      <CollapsibleContent className="pt-4">
        <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Room Temperature:
            </label>
            
            <div className="flex gap-2">
              {ENVIRONMENT_ADJUSTMENTS.map((env) => (
                <button
                  key={env.id}
                  onClick={() => handleEnvChange(env.id)}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                    selectedEnv === env.id
                      ? env.id === 'cold' 
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                        : env.id === 'hot'
                        ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                        : "bg-green-500/20 border-green-500/40 text-green-400"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {env.label}
                  <span className="block text-xs opacity-70">{env.tempRange}</span>
                </button>
              ))}
            </div>
          </div>
          
          {selectedEnv !== 'normal' && (
            <div className={cn(
              "p-4 rounded-lg border",
              selectedEnv === 'cold' 
                ? "bg-blue-500/10 border-blue-500/20"
                : "bg-orange-500/10 border-orange-500/20"
            )}>
              <div className="font-medium mb-2">
                Adjusted Temperatures:
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nozzle: </span>
                  <span className="text-foreground">{baseNozzleTemp}°C → </span>
                  <span className={cn(
                    "font-medium",
                    selectedEnv === 'cold' ? "text-orange-400" : "text-cyan-400"
                  )}>
                    {adjustedNozzle}°C
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Bed: </span>
                  <span className="text-foreground">{baseBedTemp}°C → </span>
                  <span className={cn(
                    "font-medium",
                    selectedEnv === 'cold' ? "text-orange-400" : "text-cyan-400"
                  )}>
                    {adjustedBed}°C
                  </span>
                </div>
              </div>
              {currentEnv.fanAdjust !== 0 && (
                <div className="mt-2 text-sm">
                  <span className="text-muted-foreground">Fan: </span>
                  <span className="text-foreground">
                    {currentEnv.fanAdjust > 0 ? '+' : ''}{currentEnv.fanAdjust}%
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Tips for {currentEnv.label.toLowerCase()} conditions
            </div>
            <ul className="space-y-1">
              {currentEnv.tips.map((tip, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
