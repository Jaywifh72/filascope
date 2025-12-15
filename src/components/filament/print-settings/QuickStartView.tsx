import { Printer, Download, ChevronDown, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { PrintSettingsData } from "@/lib/printSettingsData";
import { SlicerActions } from "@/components/filament/SlicerActions";
import { cn } from "@/lib/utils";
import { GlossaryTerm } from "@/components/filament/education/GlossaryTerm";

interface QuickStartViewProps {
  settings: PrintSettingsData;
  filament: {
    id: string;
    product_title: string;
    vendor?: string | null;
    material?: string | null;
    nozzle_temp_min_c?: number | null;
    nozzle_temp_max_c?: number | null;
    nozzle_temp_sweetspot_c?: number | null;
    bed_temp_min_c?: number | null;
    bed_temp_max_c?: number | null;
    fan_min_percent?: number | null;
    fan_max_percent?: number | null;
    diameter_nominal_mm?: number | null;
    density_g_cm3?: number | null;
    print_speed_max_mms?: number | null;
  };
  onChangePrinter: () => void;
  onShowAdvanced: () => void;
}

export function QuickStartView({ settings, filament, onChangePrinter, onShowAdvanced }: QuickStartViewProps) {
  const { compatibility, quickStart, printerModel, printerBrand } = settings;
  
  const compatibilityIcon = {
    fully_compatible: <CheckCircle className="w-5 h-5 text-green-500" />,
    requires_upgrade: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    not_recommended: <XCircle className="w-5 h-5 text-red-500" />,
  };
  
  const compatibilityColor = {
    fully_compatible: 'text-green-500',
    requires_upgrade: 'text-amber-500',
    not_recommended: 'text-red-500',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Printer className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Print Settings for{" "}
              <span className="text-primary">{printerModel}</span>
            </h3>
            {printerBrand && (
              <p className="text-sm text-muted-foreground">{printerBrand}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onChangePrinter}
          className="shrink-0"
        >
          Change
        </Button>
      </div>

      {/* Quick Start Settings Box */}
      <div className="bg-primary/5 border border-primary/10 rounded-lg p-5 space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Quick Start Settings
        </h4>
        
        <TooltipProvider delayDuration={200}>
          <div className="grid gap-3">
            {/* Nozzle Temperature */}
            <div className="flex items-center justify-between">
              <GlossaryTerm termId="nozzle_temperature" className="text-sm text-muted-foreground" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-base font-semibold text-foreground cursor-help flex items-center gap-1.5">
                    {quickStart.nozzleTemp}°C
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    Recommended starting point.<br />
                    Range: {quickStart.nozzleTempRange[0]}-{quickStart.nozzleTempRange[1]}°C
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Bed Temperature */}
            <div className="flex items-center justify-between">
              <GlossaryTerm termId="bed_temperature" className="text-sm text-muted-foreground" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-base font-semibold text-foreground cursor-help flex items-center gap-1.5">
                    {quickStart.bedTemp}°C
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    Range: {quickStart.bedTempRange[0]}-{quickStart.bedTempRange[1]}°C<br />
                    Higher for better adhesion
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Print Speed */}
            <div className="flex items-center justify-between">
              <GlossaryTerm termId="print_speed" className="text-sm text-muted-foreground" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-base font-semibold text-foreground cursor-help flex items-center gap-1.5">
                    {quickStart.printSpeed}
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    Lower end for quality<br />
                    Higher end for speed
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Build Surface */}
            <div className="flex items-center justify-between">
              <GlossaryTerm termId="build_surface" className="text-sm text-muted-foreground" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-base font-semibold text-foreground cursor-help flex items-center gap-1.5">
                    {quickStart.buildSurface.recommended}
                    <Badge variant="secondary" className="text-xs ml-1">Recommended</Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    Also works with:<br />
                    {quickStart.buildSurface.alternatives.join(', ')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* Compatibility Status */}
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg",
        compatibility.status === 'fully_compatible' && "bg-green-500/10 border border-green-500/20",
        compatibility.status === 'requires_upgrade' && "bg-amber-500/10 border border-amber-500/20",
        compatibility.status === 'not_recommended' && "bg-red-500/10 border border-red-500/20",
      )}>
        {compatibilityIcon[compatibility.status]}
        <span className={cn("text-sm font-medium", compatibilityColor[compatibility.status])}>
          {compatibility.message}
        </span>
      </div>

      {/* Download Profile CTA */}
      <div className="pt-2">
        <SlicerActions
          filament={filament}
          printerBrand={printerBrand}
          printerName={printerModel}
        />
      </div>

      {/* Show Advanced Settings Toggle */}
      <button
        onClick={onShowAdvanced}
        className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors py-2"
      >
        <span>Show advanced settings</span>
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}
