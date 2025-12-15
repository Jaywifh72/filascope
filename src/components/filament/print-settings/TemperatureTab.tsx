import { Copy, ThermometerSun, Flame, Wind, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TemperatureSlider } from "./TemperatureSlider";
import { PrintSettingsData } from "@/lib/printSettingsData";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

interface TemperatureTabProps {
  settings: PrintSettingsData;
}

export function TemperatureTab({ settings }: TemperatureTabProps) {
  const { temperature, additionalSettings } = settings;

  const handleCopy = () => {
    const text = `Nozzle: ${temperature.nozzle.recommended}°C (Range: ${temperature.nozzle.range[0]}-${temperature.nozzle.range[1]}°C)
Bed: ${temperature.bed.recommended}°C (Range: ${temperature.bed.range[0]}-${temperature.bed.range[1]}°C)
Cooling: ${additionalSettings.cooling}`;
    
    navigator.clipboard.writeText(text);
    toast.success("Temperature settings copied!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ThermometerSun className="w-5 h-5 text-primary" />
          Temperature Ranges & Guidance
        </h3>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Settings
        </Button>
      </div>

      {/* Nozzle Temperature */}
      <TemperatureSlider
        label="Nozzle Temperature"
        recommended={temperature.nozzle.recommended}
        range={temperature.nozzle.range}
        guidance={temperature.nozzle.guidance}
      />

      {/* Bed Temperature */}
      <div className="p-4 bg-background/50 border border-border rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            Bed Temperature
          </span>
          <div className="text-right">
            <span className="text-2xl font-bold text-foreground">
              {temperature.bed.recommended}°C
            </span>
            <div className="text-xs text-muted-foreground">
              Range: {temperature.bed.range[0]}-{temperature.bed.range[1]}°C
            </div>
          </div>
        </div>
        
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded border border-orange-500/20">
            <span className="text-orange-500 font-medium">First Layer:</span>
            <span className="text-muted-foreground">{temperature.bed.guidance.firstLayer}</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded border border-border">
            <span className="text-foreground font-medium">Remaining:</span>
            <span className="text-muted-foreground">{temperature.bed.guidance.remaining}</span>
          </div>
        </div>
      </div>

      {/* Advanced Temperature Settings */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
          <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
          Advanced Temperature Settings
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="grid gap-3 p-4 bg-muted/30 rounded-lg border border-border">
            {/* Chamber Temperature */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Snowflake className="w-4 h-4" />
                Chamber Temperature
              </span>
              <span className="text-foreground">
                {temperature.advanced.chamber.required 
                  ? temperature.advanced.chamber.recommended 
                    ? `${temperature.advanced.chamber.recommended[0]}-${temperature.advanced.chamber.recommended[1]}°C (Recommended)`
                    : 'Required'
                  : 'Not required'}
              </span>
            </div>
            
            {/* Cooling Fan */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Wind className="w-4 h-4" />
                Cooling Fan
              </span>
              <span className="text-foreground">{temperature.advanced.cooling}</span>
            </div>
            
            {/* Bridging */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Bridging Temperature</span>
              <span className="text-foreground">{temperature.advanced.bridging}</span>
            </div>
            
            {/* Overhang */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overhang Temperature</span>
              <span className="text-foreground">{temperature.advanced.overhang}</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
