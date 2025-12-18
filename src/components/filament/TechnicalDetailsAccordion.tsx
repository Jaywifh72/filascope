import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  ThermometerSun, 
  Settings, 
  Droplets, 
  Ruler, 
  Wind, 
  Flame,
  Package,
  FileText,
  ExternalLink,
  Gauge,
  Shield
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface TechnicalDetailsAccordionProps {
  filament: Filament;
  className?: string;
}

export function TechnicalDetailsAccordion({ filament, className }: TechnicalDetailsAccordionProps) {
  // Check what data is available
  const hasPrintSettings = !!(
    filament.nozzle_temp_min_c || 
    filament.nozzle_temp_max_c || 
    filament.bed_temp_min_c || 
    filament.bed_temp_max_c ||
    filament.print_speed_max_mms ||
    filament.fan_min_percent ||
    filament.fan_max_percent
  );

  const hasMechanicalProps = !!(
    filament.tensile_strength_xy_mpa ||
    filament.tensile_modulus_xy_mpa ||
    filament.elongation_break_xy_percent ||
    filament.flexural_strength_mpa ||
    filament.shore_hardness_d ||
    filament.tg_c
  );

  const hasMoistureInfo = !!(
    filament.moisture_sensitivity_level ||
    filament.drying_temp_c ||
    filament.drying_time_hours ||
    filament.moisture_care
  );

  const hasSpoolSpecs = !!(
    filament.net_weight_g ||
    filament.diameter_nominal_mm ||
    filament.spool_outer_d_mm ||
    filament.spool_width_mm ||
    filament.density_g_cm3
  );

  // Don't render if no data
  if (!hasPrintSettings && !hasMechanicalProps && !hasMoistureInfo && !hasSpoolSpecs) {
    return null;
  }

  return (
    <Card className={cn("bg-card/50 border-border overflow-hidden", className)}>
      <Accordion type="single" collapsible className="w-full">
        {/* Print Settings */}
        {hasPrintSettings && (
          <AccordionItem value="print-settings" className="border-border">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <ThermometerSun className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Print Settings</div>
                  <div className="text-xs text-muted-foreground">
                    Temperature, speed & fan settings
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(filament.nozzle_temp_min_c || filament.nozzle_temp_max_c) && (
                  <div className="p-3 bg-orange-500/5 rounded-lg border border-orange-500/10">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Flame className="w-3 h-3" />
                      Nozzle Temp
                    </div>
                    <div className="font-bold text-orange-500">
                      {filament.nozzle_temp_min_c || '?'}°C - {filament.nozzle_temp_max_c || '?'}°C
                    </div>
                    {filament.nozzle_temp_sweetspot_c && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Sweet spot: {filament.nozzle_temp_sweetspot_c}°C
                      </div>
                    )}
                  </div>
                )}

                {(filament.bed_temp_min_c || filament.bed_temp_max_c) && (
                  <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <ThermometerSun className="w-3 h-3" />
                      Bed Temp
                    </div>
                    <div className="font-bold text-blue-500">
                      {filament.bed_temp_min_c || '?'}°C - {filament.bed_temp_max_c || '?'}°C
                    </div>
                  </div>
                )}

                {filament.print_speed_max_mms && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Gauge className="w-3 h-3" />
                      Max Speed
                    </div>
                    <div className="font-bold text-primary">
                      {filament.print_speed_max_mms} mm/s
                    </div>
                  </div>
                )}

                {(filament.fan_min_percent !== null || filament.fan_max_percent !== null) && (
                  <div className="p-3 bg-sky-500/5 rounded-lg border border-sky-500/10">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Wind className="w-3 h-3" />
                      Part Cooling
                    </div>
                    <div className="font-bold text-sky-500">
                      {filament.fan_min_percent ?? 0}% - {filament.fan_max_percent ?? 100}%
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Mechanical Properties */}
        {hasMechanicalProps && (
          <AccordionItem value="mechanical" className="border-border">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Mechanical Properties</div>
                  <div className="text-xs text-muted-foreground">
                    Strength, hardness & flexibility
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filament.tensile_strength_xy_mpa && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Tensile Strength</div>
                    <div className="font-bold">{filament.tensile_strength_xy_mpa} MPa</div>
                  </div>
                )}
                {filament.tensile_modulus_xy_mpa && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Tensile Modulus</div>
                    <div className="font-bold">{filament.tensile_modulus_xy_mpa} MPa</div>
                  </div>
                )}
                {filament.elongation_break_xy_percent && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Elongation at Break</div>
                    <div className="font-bold">{filament.elongation_break_xy_percent}%</div>
                  </div>
                )}
                {filament.flexural_strength_mpa && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Flexural Strength</div>
                    <div className="font-bold">{filament.flexural_strength_mpa} MPa</div>
                  </div>
                )}
                {filament.shore_hardness_d && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Shore Hardness</div>
                    <div className="font-bold">{filament.shore_hardness_d} D</div>
                  </div>
                )}
                {filament.tg_c && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Glass Transition</div>
                    <div className="font-bold">{filament.tg_c}°C</div>
                  </div>
                )}
              </div>
              {filament.tds_url && (
                <a 
                  href={filament.tds_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  View Technical Data Sheet
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Storage & Moisture */}
        {hasMoistureInfo && (
          <AccordionItem value="storage" className="border-border">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Droplets className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Storage & Care</div>
                  <div className="text-xs text-muted-foreground">
                    Drying & moisture sensitivity
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filament.moisture_sensitivity_level && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Moisture Sensitivity</div>
                    <Badge variant={
                      filament.moisture_sensitivity_level === 'High' ? 'destructive' :
                      filament.moisture_sensitivity_level === 'Medium' ? 'secondary' : 'outline'
                    }>
                      {filament.moisture_sensitivity_level}
                    </Badge>
                  </div>
                )}
                {filament.drying_temp_c && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Drying Temp</div>
                    <div className="font-bold">{filament.drying_temp_c}°C</div>
                  </div>
                )}
                {filament.drying_time_hours && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Drying Time</div>
                    <div className="font-bold">{filament.drying_time_hours} hours</div>
                  </div>
                )}
              </div>
              {filament.moisture_care && (
                <p className="mt-4 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                  💡 {filament.moisture_care}
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Spool Specifications */}
        {hasSpoolSpecs && (
          <AccordionItem value="spool" className="border-b-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Package className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Spool Specifications</div>
                  <div className="text-xs text-muted-foreground">
                    Dimensions & physical properties
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filament.net_weight_g && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Net Weight</div>
                    <div className="font-bold">{filament.net_weight_g}g</div>
                  </div>
                )}
                {filament.diameter_nominal_mm && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Diameter</div>
                    <div className="font-bold">{filament.diameter_nominal_mm}mm</div>
                  </div>
                )}
                {filament.spool_outer_d_mm && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Spool Diameter</div>
                    <div className="font-bold">{filament.spool_outer_d_mm}mm</div>
                  </div>
                )}
                {filament.spool_width_mm && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Spool Width</div>
                    <div className="font-bold">{filament.spool_width_mm}mm</div>
                  </div>
                )}
                {filament.density_g_cm3 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Density</div>
                    <div className="font-bold">{filament.density_g_cm3} g/cm³</div>
                  </div>
                )}
                {filament.spool_ams_fit !== null && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">AMS Compatible</div>
                    <Badge variant={filament.spool_ams_fit ? 'default' : 'secondary'}>
                      {filament.spool_ams_fit ? '✓ Yes' : '✗ No'}
                    </Badge>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </Card>
  );
}
