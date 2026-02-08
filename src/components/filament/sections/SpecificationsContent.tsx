import React from 'react';
import { Database } from '@/integrations/supabase/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Info } from 'lucide-react';
import { validateSpec, validateDiameter, type SpecValidationResult } from '@/lib/specValidation';
import { resolveNozzleTemp, resolveBedTemp } from '@/lib/materialDefaults';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface SpecificationsContentProps {
  filament: Filament;
}

interface SpecItem {
  label: string;
  value: string | null | undefined;
  validation?: SpecValidationResult;
  isDefault?: boolean;
  defaultTooltip?: string;
}

export function SpecificationsContent({ filament }: SpecificationsContentProps) {
  // Resolve temps with material defaults
  const nozzle = resolveNozzleTemp(filament.nozzle_temp_min_c, filament.nozzle_temp_max_c, filament.material);
  const bed = resolveBedTemp(filament.bed_temp_min_c, filament.bed_temp_max_c, filament.material);

  const specifications: SpecItem[] = [
    { label: 'Material Type', value: filament.material },
    { label: 'Transmission Distance (TD)', value: filament.transmission_distance ? `${filament.transmission_distance} mm${filament.transmission_distance >= 2.0 ? ' — HueForge ready' : ''}` : null },
    { 
      label: 'Nozzle Temperature', 
      value: nozzle?.value ?? null,
      isDefault: nozzle?.isDefault,
      defaultTooltip: nozzle?.isDefault ? `Typical for ${nozzle.materialLabel}` : undefined,
    },
    { 
      label: 'Bed Temperature', 
      value: bed?.value ?? null,
      isDefault: bed?.isDefault,
      defaultTooltip: bed?.isDefault ? `Typical for ${bed.materialLabel}` : undefined,
    },
    { label: 'Diameter', value: filament.diameter_nominal_mm ? `${filament.diameter_nominal_mm}mm` : null, validation: validateDiameter(filament.diameter_nominal_mm) },
    { label: 'Net Weight', value: filament.net_weight_g ? `${filament.net_weight_g}g` : null, validation: validateSpec('net_weight', filament.net_weight_g) },
    { label: 'Density', value: filament.density_g_cm3 ? `${filament.density_g_cm3} g/cm³` : null },
    { label: 'Color Family', value: filament.color_family },
    { label: 'Finish Type', value: filament.finish_type },
    { label: 'Spool Material', value: filament.spool_material },
    { label: 'Spool Outer Diameter', value: filament.spool_outer_d_mm ? `${filament.spool_outer_d_mm}mm` : null, validation: validateSpec('spool_outer_diameter', filament.spool_outer_d_mm) },
    { label: 'Spool Width', value: filament.spool_width_mm ? `${filament.spool_width_mm}mm` : null, validation: validateSpec('spool_width', filament.spool_width_mm) },
    { label: 'AMS Compatible', value: filament.spool_ams_fit !== null ? (filament.spool_ams_fit ? '✓ Yes' : '✗ No') : null },
    { label: 'Abrasive Material', value: filament.is_nozzle_abrasive !== null ? (filament.is_nozzle_abrasive ? '⚠️ Yes - Hardened nozzle required' : '✓ No') : null },
    { label: 'High-Speed Capable', value: filament.high_speed_capable !== null ? (filament.high_speed_capable ? '✓ Yes' : '✗ No') : null },
    { label: 'Food Safe', value: filament.food_contact_rating },
    { label: 'SKU', value: filament.variant_sku },
    { label: 'MPN', value: filament.mpn },
    { label: 'EAN', value: filament.ean },
    { label: 'UPC', value: filament.upc },
  ].filter(spec => spec.value);

  return (
    <div className="flex flex-col">
      {specifications.map((spec, idx) => (
        <div 
          key={idx}
          className={`flex justify-between items-center py-3 px-4 rounded-lg ${
            idx % 2 === 0 ? 'bg-white/[0.02]' : ''
          } max-[500px]:flex-col max-[500px]:items-start max-[500px]:gap-1`}
        >
          <span className="text-sm font-medium text-muted-foreground">
            {spec.label}
          </span>
          <div className="flex items-center gap-1.5">
            {spec.validation?.isSuspect && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-xs">⚠ {spec.validation.warningMessage}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {spec.isDefault && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-xs">{spec.defaultTooltip} — verify with manufacturer TDS</p>
                </TooltipContent>
              </Tooltip>
            )}
            <span className={`text-sm font-semibold max-[500px]:text-left ${spec.isDefault ? 'text-muted-foreground' : 'text-foreground'}`}>
              {spec.value}
            </span>
          </div>
        </div>
      ))}
      
      {specifications.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">
          No detailed specifications available for this filament.
        </p>
      )}
    </div>
  );
}
