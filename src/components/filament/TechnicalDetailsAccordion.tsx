import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ThermometerSun, 
  Droplets, 
  Wind, 
  Flame,
  Package,
  FileText,
  ExternalLink,
  Gauge,
  Shield,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { Database as SupabaseDB } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { validateSpec, validateDiameter } from '@/lib/specValidation';

type Filament = SupabaseDB["public"]["Tables"]["filaments"]["Row"];

interface TechnicalDetailsAccordionProps {
  filament: Filament;
  className?: string;
}

// Polished Accordion Item Component
interface PolishedAccordionItemProps {
  value: string;
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  isLast?: boolean;
}

function PolishedAccordionItem({
  value,
  icon,
  iconColor,
  title,
  subtitle,
  children,
  isLast = false,
}: PolishedAccordionItemProps) {
  return (
    <AccordionItem 
      value={value} 
      className={cn("border-0", !isLast && "mb-3")}
    >
      <AccordionTrigger 
        className={cn(
          "group p-4 rounded-lg border border-gray-700 bg-gray-800/30",
          "hover:bg-gray-800/50 hover:border-gray-600",
          "transition-all duration-200 cursor-pointer hover:no-underline",
          "data-[state=open]:rounded-b-none data-[state=open]:border-b-0",
          "data-[state=open]:border-primary/30",
          "[&>svg]:hidden" // Hide default chevron
        )}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors duration-200",
              iconColor,
              "group-hover:bg-primary/20"
            )}>
              <div className="transition-colors duration-200 group-hover:text-primary">
                {icon}
              </div>
            </div>
            <div className="text-left">
              <h3 className="text-base font-semibold text-foreground leading-tight">{title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            </div>
          </div>
          <ChevronDown className={cn(
            "w-5 h-5 text-gray-400 transition-all duration-200",
            "group-hover:text-gray-300",
            "group-data-[state=open]:rotate-180 group-data-[state=open]:text-primary"
          )} />
        </div>
      </AccordionTrigger>
      <AccordionContent 
        className={cn(
          "p-4 bg-gray-900/30 border-x border-b border-gray-700 rounded-b-lg",
          "data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up",
          "data-[state=open]:border-primary/30"
        )}
      >
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

// Spec Card Component
interface SpecCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  colorClass?: string;
  warningMessage?: string | null;
}

function SpecCard({ label, value, icon, colorClass = "text-foreground", warningMessage }: SpecCardProps) {
  return (
    <div className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
        {icon}
        {label}
        {warningMessage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">⚠ {warningMessage}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className={cn("font-bold", colorClass)}>{value}</div>
    </div>
  );
}

export function TechnicalDetailsAccordion({ filament, className }: TechnicalDetailsAccordionProps) {
  // Check what data is available
  const hasPrintSettings = !!(
    filament.nozzle_temp_min_c || 
    filament.nozzle_temp_max_c || 
    filament.bed_temp_min_c || 
    filament.bed_temp_max_c ||
    filament.print_speed_max_mms ||
    filament.fan_min_percent !== null ||
    filament.fan_max_percent !== null ||
    filament.retraction_length_mm ||
    filament.retraction_speed_mms
  );

  const hasMechanicalProps = !!(
    filament.tensile_strength_xy_mpa ||
    filament.tensile_modulus_xy_mpa ||
    filament.elongation_break_xy_percent ||
    filament.flexural_strength_mpa ||
    filament.shore_hardness_d ||
    filament.tg_c ||
    filament.impact_strength_kj_m2 ||
    filament.bending_strength_mpa
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
    filament.density_g_cm3 ||
    filament.spool_ams_fit !== null
  );

  // Don't render if no data
  if (!hasPrintSettings && !hasMechanicalProps && !hasMoistureInfo && !hasSpoolSpecs) {
    return null;
  }

  // Determine last item for styling
  const sections = [hasPrintSettings, hasMechanicalProps, hasMoistureInfo, hasSpoolSpecs];
  const lastIndex = sections.lastIndexOf(true);
  
  let currentIndex = -1;
  const isLast = (hasSection: boolean) => {
    if (hasSection) currentIndex++;
    return hasSection && currentIndex === lastIndex;
  };

  return (
    <div className={cn("space-y-0", className)}>
      <Accordion type="multiple" defaultValue={["print-settings", "spool"]} className="w-full">
        {/* Print Settings */}
        {hasPrintSettings && (
          <PolishedAccordionItem
            value="print-settings"
            icon={<ThermometerSun className="w-5 h-5 text-primary" />}
            iconColor="bg-primary/10"
            title="Print Settings"
            subtitle="Temperature, speed & fan settings"
            isLast={isLast(hasPrintSettings)}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(filament.nozzle_temp_min_c || filament.nozzle_temp_max_c) && (
                <SpecCard
                  label="Nozzle Temp"
                  icon={<Flame className="w-3 h-3" />}
                  value={
                    <div>
                      <span className="text-orange-400">
                        {filament.nozzle_temp_min_c || '?'}°C - {filament.nozzle_temp_max_c || '?'}°C
                      </span>
                      {filament.nozzle_temp_sweetspot_c && (
                        <div className="text-xs text-gray-400 font-normal mt-0.5">
                          Sweet spot: {filament.nozzle_temp_sweetspot_c}°C
                        </div>
                      )}
                    </div>
                  }
                />
              )}

              {(filament.bed_temp_min_c || filament.bed_temp_max_c) && (
                <SpecCard
                  label="Bed Temp"
                  icon={<ThermometerSun className="w-3 h-3" />}
                  value={`${filament.bed_temp_min_c || '?'}°C - ${filament.bed_temp_max_c || '?'}°C`}
                  colorClass="text-blue-400"
                />
              )}

              {filament.print_speed_max_mms && (
                <SpecCard
                  label="Max Speed"
                  icon={<Gauge className="w-3 h-3" />}
                  value={`${filament.print_speed_max_mms} mm/s`}
                  colorClass="text-primary"
                />
              )}

              {(filament.fan_min_percent !== null || filament.fan_max_percent !== null) && (
                <SpecCard
                  label="Part Cooling"
                  icon={<Wind className="w-3 h-3" />}
                  value={`${filament.fan_min_percent ?? 0}% - ${filament.fan_max_percent ?? 100}%`}
                  colorClass="text-sky-400"
                />
              )}

              {filament.retraction_length_mm && (
                <SpecCard
                  label="Retraction Length"
                  value={`${filament.retraction_length_mm} mm`}
                />
              )}

              {filament.retraction_speed_mms && (
                <SpecCard
                  label="Retraction Speed"
                  value={`${filament.retraction_speed_mms} mm/s`}
                />
              )}
            </div>
          </PolishedAccordionItem>
        )}

        {/* Mechanical Properties */}
        {hasMechanicalProps && (
          <PolishedAccordionItem
            value="mechanical"
            icon={<Shield className="w-5 h-5 text-primary" />}
            iconColor="bg-emerald-500/10"
            title="Mechanical Properties"
            subtitle="Strength, hardness & flexibility"
            isLast={isLast(hasMechanicalProps)}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filament.tensile_strength_xy_mpa && (
                <SpecCard
                  label="Tensile Strength"
                  value={`${filament.tensile_strength_xy_mpa} MPa`}
                />
              )}
              {filament.tensile_modulus_xy_mpa && (
                <SpecCard
                  label="Tensile Modulus"
                  value={`${filament.tensile_modulus_xy_mpa} MPa`}
                />
              )}
              {filament.elongation_break_xy_percent && (
                <SpecCard
                  label="Elongation at Break"
                  value={`${filament.elongation_break_xy_percent}%`}
                />
              )}
              {filament.flexural_strength_mpa && (
                <SpecCard
                  label="Flexural Strength"
                  value={`${filament.flexural_strength_mpa} MPa`}
                />
              )}
              {filament.bending_strength_mpa && (
                <SpecCard
                  label="Bending Strength"
                  value={`${filament.bending_strength_mpa} MPa`}
                />
              )}
              {filament.impact_strength_kj_m2 && (
                <SpecCard
                  label="Impact Strength"
                  value={`${filament.impact_strength_kj_m2} kJ/m²`}
                />
              )}
              {filament.shore_hardness_d && (
                <SpecCard
                  label="Shore Hardness"
                  value={`${filament.shore_hardness_d} D`}
                />
              )}
              {filament.tg_c && (
                <SpecCard
                  label="Glass Transition"
                  value={`${filament.tg_c}°C`}
                  colorClass="text-amber-400"
                />
              )}
            </div>
            {filament.tds_url && (
              <a 
                href={filament.tds_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Technical Data Sheet
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </PolishedAccordionItem>
        )}

        {/* Storage & Moisture */}
        {hasMoistureInfo && (
          <PolishedAccordionItem
            value="storage"
            icon={<Droplets className="w-5 h-5 text-primary" />}
            iconColor="bg-blue-500/10"
            title="Storage & Care"
            subtitle="Drying & moisture sensitivity"
            isLast={isLast(hasMoistureInfo)}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filament.moisture_sensitivity_level && (
                <div className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
                  <div className="text-xs text-gray-400 mb-1.5">Moisture Sensitivity</div>
                  <Badge variant={
                    filament.moisture_sensitivity_level === 'High' ? 'destructive' :
                    filament.moisture_sensitivity_level === 'Medium' ? 'secondary' : 'outline'
                  }>
                    {filament.moisture_sensitivity_level}
                  </Badge>
                </div>
              )}
              {filament.drying_temp_c && (
                <SpecCard
                  label="Drying Temp"
                  value={`${filament.drying_temp_c}°C`}
                />
              )}
              {filament.drying_time_hours && (
                <SpecCard
                  label="Drying Time"
                  value={`${filament.drying_time_hours} hours`}
                />
              )}
            </div>
            {filament.moisture_care && (
              <p className="mt-4 text-sm text-gray-300 bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                💡 {filament.moisture_care}
              </p>
            )}
          </PolishedAccordionItem>
        )}

        {/* Spool Specifications */}
        {hasSpoolSpecs && (
          <PolishedAccordionItem
            value="spool"
            icon={<Package className="w-5 h-5 text-primary" />}
            iconColor="bg-purple-500/10"
            title="Spool Specifications"
            subtitle="Dimensions & physical properties"
            isLast={isLast(hasSpoolSpecs)}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filament.net_weight_g && (
                <SpecCard
                  label="Net Weight"
                  value={`${filament.net_weight_g}g`}
                  warningMessage={validateSpec('net_weight', filament.net_weight_g).warningMessage}
                />
              )}
              {filament.diameter_nominal_mm && (
                <SpecCard
                  label="Diameter"
                  value={`${filament.diameter_nominal_mm}mm`}
                  warningMessage={validateDiameter(filament.diameter_nominal_mm).warningMessage}
                />
              )}
              {filament.spool_outer_d_mm && (
                <SpecCard
                  label="Spool Diameter"
                  value={`${filament.spool_outer_d_mm}mm`}
                  warningMessage={validateSpec('spool_outer_diameter', filament.spool_outer_d_mm).warningMessage}
                />
              )}
              {filament.spool_width_mm && (
                <SpecCard
                  label="Spool Width"
                  value={`${filament.spool_width_mm}mm`}
                  warningMessage={validateSpec('spool_width', filament.spool_width_mm).warningMessage}
                />
              )}
              {filament.density_g_cm3 && (
                <SpecCard
                  label="Density"
                  value={`${filament.density_g_cm3} g/cm³`}
                />
              )}
              {filament.spool_ams_fit !== null && (
                <div className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
                  <div className="text-xs text-gray-400 mb-1.5">AMS Compatible</div>
                  <Badge 
                    variant={filament.spool_ams_fit ? 'default' : 'secondary'}
                    className={filament.spool_ams_fit ? 'bg-primary' : ''}
                  >
                    {filament.spool_ams_fit ? '✓ Yes' : '✗ No'}
                  </Badge>
                </div>
              )}
            </div>
          </PolishedAccordionItem>
        )}
      </Accordion>
    </div>
  );
}
