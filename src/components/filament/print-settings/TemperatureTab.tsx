import { ThermometerSun, Flame, Wind, Snowflake, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TemperatureSlider } from "./TemperatureSlider";
import { TroubleshootingGuide } from "./TroubleshootingGuide";
import { SpeedTempCalculator } from "./SpeedTempCalculator";
import { SeasonalAdjustments } from "./SeasonalAdjustments";
import { MaterialTemperatureNotes } from "./MaterialTemperatureNotes";
import { CopyFormatSelector } from "@/components/filament/export/CopyFormatSelector";
import { PrintSettingsData } from "@/lib/printSettingsData";
import type { PrintSettings } from "@/lib/settingsFormatters";
import { GlossaryTerm } from "@/components/filament/education/GlossaryTerm";

interface TemperatureTabProps {
  settings: PrintSettingsData;
  material?: string;
  productTitle?: string;
  vendor?: string;
}

export function TemperatureTab({ settings, material, productTitle, vendor }: TemperatureTabProps) {
  const { temperature, additionalSettings } = settings;

  const copySettings: PrintSettings = {
    filamentName: productTitle || 'Filament',
    material: material || 'Unknown',
    vendor: vendor || 'Unknown',
    nozzleTemp: temperature.nozzle.recommended,
    nozzleTempMin: temperature.nozzle.range[0],
    nozzleTempMax: temperature.nozzle.range[1],
    bedTemp: temperature.bed.recommended,
    bedTempMin: temperature.bed.range[0],
    bedTempMax: temperature.bed.range[1],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ThermometerSun className="w-5 h-5 text-primary" />
          Temperature Ranges & Guidance
        </h3>
        <CopyFormatSelector settings={copySettings} />
      </div>

      {/* Nozzle Temperature with predictions */}
      <TemperatureSlider
        label="Nozzle Temperature"
        recommended={temperature.nozzle.recommended}
        range={temperature.nozzle.range}
        guidance={temperature.nozzle.guidance}
        showPredictions={true}
      />

      {/* Bed Temperature */}
      <div className="p-4 bg-background/50 border border-border rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <GlossaryTerm termId="bed_temperature" />
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

      {/* Material-specific notes */}
      {material && (
        <MaterialTemperatureNotes 
          material={material}
          productTitle={productTitle || ''}
          baseNozzleTemp={temperature.nozzle.recommended}
        />
      )}

      {/* Speed-Temperature Calculator */}
      <SpeedTempCalculator baseNozzleTemp={temperature.nozzle.recommended} />

      {/* Troubleshooting Guide */}
      <TroubleshootingGuide 
        currentNozzleTemp={temperature.nozzle.recommended}
        currentBedTemp={temperature.bed.recommended}
        nozzleRange={temperature.nozzle.range}
        bedRange={temperature.bed.range}
      />

      {/* Seasonal/Environment Adjustments */}
      <SeasonalAdjustments 
        baseNozzleTemp={temperature.nozzle.recommended}
        baseBedTemp={temperature.bed.recommended}
      />

      {/* Advanced Temperature Settings */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
          <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
          <span className="text-sm font-medium">Advanced Temperature Settings</span>
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
