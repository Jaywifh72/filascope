import React from 'react';
import { Link } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';
import { AdvancedTdsSection } from '../sections/AdvancedTdsSection';
import { isValidFinishType } from '@/lib/finishTypeValidation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ThermometerSun, 
  Package, 
  Palette, 
  Barcode,
  Ruler,
  Gauge,
  Shield,
  Droplets,
  FileText,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateSpec, validateDiameter, type SpecValidationResult } from '@/lib/specValidation';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface SpecificationsTabContentProps {
  filament: Filament;
}

interface RangeData {
  min: number;
  max: number;
  materialName: string;
}

interface SpecRow {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  comparison?: ComparisonContext | null;
  validation?: SpecValidationResult;
  rangeData?: RangeData | null;
}

interface ComparisonContext {
  label: string;
  status: 'above' | 'standard' | 'below';
}

// Material averages for comparison context
const MATERIAL_AVERAGES: Record<string, Record<string, { min: number; max: number; avg: number }>> = {
  PLA: {
    nozzle_temp: { min: 190, max: 220, avg: 210 },
    bed_temp: { min: 50, max: 70, avg: 60 },
    tensile_strength: { min: 40, max: 60, avg: 50 },
    print_speed: { min: 40, max: 150, avg: 80 },
    density: { min: 1.2, max: 1.3, avg: 1.24 },
    elongation: { min: 2, max: 10, avg: 6 },
  },
  PETG: {
    nozzle_temp: { min: 220, max: 250, avg: 235 },
    bed_temp: { min: 70, max: 90, avg: 80 },
    tensile_strength: { min: 45, max: 55, avg: 50 },
    print_speed: { min: 40, max: 100, avg: 60 },
    density: { min: 1.23, max: 1.28, avg: 1.27 },
    elongation: { min: 10, max: 300, avg: 120 },
  },
  ABS: {
    nozzle_temp: { min: 220, max: 260, avg: 240 },
    bed_temp: { min: 90, max: 110, avg: 100 },
    tensile_strength: { min: 35, max: 50, avg: 42 },
    print_speed: { min: 40, max: 100, avg: 60 },
    density: { min: 1.02, max: 1.08, avg: 1.04 },
    elongation: { min: 10, max: 50, avg: 25 },
  },
  ASA: {
    nozzle_temp: { min: 230, max: 260, avg: 245 },
    bed_temp: { min: 90, max: 110, avg: 100 },
    tensile_strength: { min: 40, max: 55, avg: 47 },
    print_speed: { min: 40, max: 100, avg: 60 },
    density: { min: 1.05, max: 1.08, avg: 1.07 },
    elongation: { min: 20, max: 40, avg: 30 },
  },
  TPU: {
    nozzle_temp: { min: 210, max: 240, avg: 225 },
    bed_temp: { min: 40, max: 60, avg: 50 },
    tensile_strength: { min: 20, max: 50, avg: 35 },
    print_speed: { min: 20, max: 40, avg: 30 },
    density: { min: 1.15, max: 1.25, avg: 1.2 },
    elongation: { min: 300, max: 700, avg: 500 },
  },
  PA: {
    nozzle_temp: { min: 240, max: 280, avg: 260 },
    bed_temp: { min: 70, max: 100, avg: 85 },
    tensile_strength: { min: 60, max: 90, avg: 75 },
    print_speed: { min: 40, max: 80, avg: 50 },
    density: { min: 1.1, max: 1.15, avg: 1.13 },
    elongation: { min: 20, max: 100, avg: 50 },
  },
  PC: {
    nozzle_temp: { min: 260, max: 300, avg: 280 },
    bed_temp: { min: 100, max: 120, avg: 110 },
    tensile_strength: { min: 55, max: 75, avg: 65 },
    print_speed: { min: 30, max: 60, avg: 45 },
    density: { min: 1.18, max: 1.22, avg: 1.2 },
    elongation: { min: 80, max: 120, avg: 100 },
  },
};

function getComparisonContext(
  material: string | null,
  field: string,
  value: number | null | undefined
): { comparison: ComparisonContext; rangeData: RangeData } | null {
  if (!material || value === null || value === undefined) return null;
  
  // Normalize material name
  const normalizedMaterial = material.toUpperCase().replace(/[^A-Z]/g, '');
  const avgData = MATERIAL_AVERAGES[normalizedMaterial]?.[field];
  
  if (!avgData) return null;
  
  const { min, max } = avgData;
  
  let comparison: ComparisonContext;
  if (value >= max) {
    comparison = { label: 'Above average', status: 'above' };
  } else if (value <= min) {
    comparison = { label: 'Below average', status: 'below' };
  } else {
    comparison = { label: 'Standard', status: 'standard' };
  }
  
  return {
    comparison,
    rangeData: { min, max, materialName: normalizedMaterial },
  };
}

function ComparisonBadge({ comparison }: { comparison: ComparisonContext }) {
  const statusConfig = {
    above: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    standard: 'bg-primary/10 text-primary border-primary/20',
    below: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn("text-[10px] px-1.5 py-0 h-5 font-normal", statusConfig[comparison.status])}
    >
      {comparison.label}
    </Badge>
  );
}

/** Helper to spread getComparisonContext result into SpecRow fields */
function withComparison(
  material: string | null,
  field: string,
  value: number | null | undefined
): { comparison?: ComparisonContext | null; rangeData?: RangeData | null } {
  const result = getComparisonContext(material, field, value);
  if (!result) return {};
  return { comparison: result.comparison, rangeData: result.rangeData };
}


function SpecRangeBar({ 
  value, 
  rangeData, 
  comparison, 
  label, 
  unit 
}: { 
  value: number;
  rangeData: RangeData | null | undefined;
  comparison: ComparisonContext | null | undefined;
  label: string;
  unit?: string;
}) {
  // Data source: min/max from MATERIAL_AVERAGES lookup keyed by normalized material name and spec field
  const hasRange = rangeData && rangeData.min !== rangeData.max;
  
  // Calculate marker position (0-100%)
  let position: number;
  let rangeMin: number;
  let rangeMax: number;

  if (hasRange) {
    rangeMin = rangeData.min;
    rangeMax = rangeData.max;
    // Add 10% padding on each side for values outside range
    const padding = (rangeMax - rangeMin) * 0.1;
    const displayMin = rangeMin - padding;
    const displayMax = rangeMax + padding;
    position = ((value - displayMin) / (displayMax - displayMin)) * 100;
    position = Math.max(0, Math.min(100, position));
  } else {
    // No comparison baseline — show neutral centered marker
    position = 50;
    rangeMin = 0;
    rangeMax = 0;
  }

  // Color based on comparison status
  const colorConfig = comparison ? {
    below: { fill: 'bg-amber-500/60', marker: 'bg-amber-400' },
    standard: { fill: 'bg-gray-400/60', marker: 'bg-gray-300' },
    above: { fill: 'bg-teal-500/60', marker: 'bg-teal-400' },
  }[comparison.status] : { fill: 'bg-gray-600/30', marker: 'bg-gray-500' };

  // Build accessible description
  const ariaLabel = hasRange && comparison
    ? `${label} is ${value}${unit ? ' ' + unit : ''}, ${comparison.status === 'below' ? 'below' : comparison.status === 'above' ? 'above' : 'within'} the typical ${rangeData.materialName} range of ${rangeMin}–${rangeMax}${unit ? ' ' + unit : ''}`
    : `${label} is ${value}${unit ? ' ' + unit : ''}`;

  return (
    <div className="group relative px-3 pb-1" role="img" aria-label={ariaLabel}>
      <div className="w-full h-1.5 bg-gray-800 rounded-full mt-1 mb-1 relative">
        {/* Filled portion from left to marker */}
        <div 
          className={cn("absolute left-0 top-0 h-full rounded-full", colorConfig.fill)}
          style={{ width: `${position}%` }}
        />
        {/* Marker dot */}
        <div 
          className={cn("absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow-sm", colorConfig.marker)}
          style={{ left: `${position}%`, transform: `translate(-50%, -50%)` }}
        />
      </div>
      {/* Range labels — visible on hover only */}
      {hasRange && (
        <div className="flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-[10px] text-gray-600">{rangeMin}{unit ? `${unit}` : ''}</span>
          <span className="text-[10px] text-gray-600">{rangeMax}{unit ? `${unit}` : ''}</span>
        </div>
      )}
    </div>
  );
}

function SpecTable({ 
  title, 
  icon, 
  specs,
  materialContext,
  showRangeBars = false,
}: { 
  title: string; 
  icon: React.ReactNode; 
  specs: SpecRow[];
  materialContext?: string | null;
  showRangeBars?: boolean;
}) {
  const validSpecs = specs.filter(s => s.value !== null && s.value !== undefined && s.value !== '');
  if (validSpecs.length === 0) return null;

  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {materialContext && (
              <p className="text-xs text-muted-foreground">
                Compared to typical {materialContext} values
              </p>
            )}
          </div>
        </div>
        <div className="space-y-0">
          {validSpecs.map((spec, idx) => {
            const numericValue = typeof spec.value === 'number' ? spec.value : null;
            const showBar = showRangeBars && numericValue !== null;
            
            return (
              <div key={idx}>
                <div 
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${idx % 2 === 0 ? 'bg-muted/20' : ''}`}
                >
                  <span className="text-sm text-muted-foreground">{spec.label}</span>
                  <div className="flex items-center gap-2">
                    {spec.validation?.isSuspect && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="text-xs">⚠ {spec.validation.warningMessage}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {spec.comparison && <ComparisonBadge comparison={spec.comparison} />}
                    <span className="text-sm font-medium">
                      {spec.value}{spec.unit ? ` ${spec.unit}` : ''}
                    </span>
                  </div>
                </div>
                {showBar && (
                  <SpecRangeBar
                    value={numericValue}
                    rangeData={spec.rangeData}
                    comparison={spec.comparison}
                    label={spec.label}
                    unit={spec.unit}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function SpecificationsTabContent({ filament }: SpecificationsTabContentProps) {
  const material = filament.material;
  
  return (
    <div className="space-y-6">
      {/* Print Settings */}
      <SpecTable
        title="Print Settings"
        icon={<ThermometerSun className="w-5 h-5" />}
        materialContext={material}
        showRangeBars
        specs={[
          { 
            label: 'Nozzle Temperature (Min)', 
            value: filament.nozzle_temp_min_c, 
            unit: '°C',
            ...withComparison(material, 'nozzle_temp', filament.nozzle_temp_min_c)
          },
          { 
            label: 'Nozzle Temperature (Max)', 
            value: filament.nozzle_temp_max_c, 
            unit: '°C',
            ...withComparison(material, 'nozzle_temp', filament.nozzle_temp_max_c)
          },
          { label: 'Nozzle Sweet Spot', value: filament.nozzle_temp_sweetspot_c, unit: '°C' },
          { 
            label: 'Bed Temperature (Min)', 
            value: filament.bed_temp_min_c, 
            unit: '°C',
            ...withComparison(material, 'bed_temp', filament.bed_temp_min_c)
          },
          { 
            label: 'Bed Temperature (Max)', 
            value: filament.bed_temp_max_c, 
            unit: '°C',
            ...withComparison(material, 'bed_temp', filament.bed_temp_max_c)
          },
          { 
            label: 'Max Print Speed', 
            value: filament.print_speed_max_mms, 
            unit: 'mm/s',
            ...withComparison(material, 'print_speed', filament.print_speed_max_mms)
          },
          { label: 'Fan Speed (Min)', value: filament.fan_min_percent, unit: '%' },
          { label: 'Fan Speed (Max)', value: filament.fan_max_percent, unit: '%' },
          { label: 'Retraction Length', value: filament.retraction_length_mm, unit: 'mm' },
          { label: 'Retraction Speed', value: filament.retraction_speed_mms, unit: 'mm/s' },
        ]}
      />

      {/* Physical Properties */}
      <SpecTable
        title="Physical Properties"
        icon={<Ruler className="w-5 h-5" />}
        materialContext={material}
        specs={[
          { label: 'Diameter', value: filament.diameter_nominal_mm, unit: 'mm', validation: validateDiameter(filament.diameter_nominal_mm) },
          { label: 'Net Weight', value: filament.net_weight_g, unit: 'g', validation: validateSpec('net_weight', filament.net_weight_g) },
          { 
            label: 'Density', 
            value: filament.density_g_cm3, 
            unit: 'g/cm³',
            ...withComparison(material, 'density', filament.density_g_cm3)
          },
          { label: 'Spool Outer Diameter', value: filament.spool_outer_d_mm, unit: 'mm', validation: validateSpec('spool_outer_diameter', filament.spool_outer_d_mm) },
          { label: 'Spool Width', value: filament.spool_width_mm, unit: 'mm', validation: validateSpec('spool_width', filament.spool_width_mm) },
          { label: 'AMS Compatible', value: filament.spool_ams_fit !== null ? (filament.spool_ams_fit ? 'Yes' : 'No') : null },
          { label: 'Spool Material', value: filament.spool_material },
        ]}
      />

      {/* Mechanical Properties */}
      <SpecTable
        title="Mechanical Properties"
        icon={<Shield className="w-5 h-5" />}
        materialContext={material}
        specs={[
          { 
            label: 'Tensile Strength (XY)', 
            value: filament.tensile_strength_xy_mpa, 
            unit: 'MPa',
            ...withComparison(material, 'tensile_strength', filament.tensile_strength_xy_mpa)
          },
          { label: 'Tensile Strength (Z)', value: filament.tensile_strength_z_mpa, unit: 'MPa' },
          { label: 'Tensile Modulus (XY)', value: filament.tensile_modulus_xy_mpa, unit: 'MPa' },
          { label: 'Tensile Modulus (Z)', value: filament.tensile_modulus_z_mpa, unit: 'MPa' },
          { 
            label: 'Elongation at Break (XY)', 
            value: filament.elongation_break_xy_percent, 
            unit: '%',
            ...withComparison(material, 'elongation', filament.elongation_break_xy_percent)
          },
          { label: 'Elongation at Break (Z)', value: filament.elongation_break_z_percent, unit: '%' },
          { label: 'Flexural Strength', value: filament.flexural_strength_mpa, unit: 'MPa' },
          { label: 'Bending Strength', value: filament.bending_strength_mpa, unit: 'MPa' },
          { label: 'Impact Strength', value: filament.impact_strength_kj_m2, unit: 'kJ/m²' },
          { label: 'Shore Hardness D', value: filament.shore_hardness_d },
          { label: 'Shore Hardness A', value: filament.hardness_shore_a },
        ]}
      />

      {/* Thermal Properties */}
      <SpecTable
        title="Thermal Properties"
        icon={<Gauge className="w-5 h-5" />}
        specs={[
          { label: 'Glass Transition (Tg)', value: filament.tg_c, unit: '°C' },
          { label: 'Melt Temperature', value: filament.melt_temp_c, unit: '°C' },
          { label: 'HDT @ 0.45 MPa', value: filament.hdt_045_mpa_c, unit: '°C' },
          { label: 'HDT @ 1.8 MPa', value: filament.hdt_18_mpa_c, unit: '°C' },
          { label: 'Vicat Softening Temp', value: filament.vicat_softening_temp_c, unit: '°C' },
          { label: 'Annealing Temp', value: filament.annealing_temp_c, unit: '°C' },
          { label: 'Annealing Time', value: filament.annealing_time_hours, unit: 'hours' },
        ]}
      />

      {/* Storage & Moisture */}
      <SpecTable
        title="Storage & Moisture"
        icon={<Droplets className="w-5 h-5" />}
        specs={[
          { label: 'Moisture Sensitivity', value: filament.moisture_sensitivity_level },
          { label: 'Drying Temperature', value: filament.drying_temp_c, unit: '°C' },
          { label: 'Drying Time', value: filament.drying_time_hours, unit: 'hours' },
          { label: 'Water Absorption', value: filament.water_absorption_percent, unit: '%' },
        ]}
      />

      {/* Appearance & HueForge — Custom Section */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold">Appearance & HueForge</h3>
          </div>
          <div className="space-y-2">
            {/* Color Family */}
            {filament.color_family && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20">
                <span className="text-sm text-muted-foreground">Color Family</span>
                <span className="text-sm font-medium">{filament.color_family}</span>
              </div>
            )}

            {/* Finish Type */}
            {filament.finish_type && isValidFinishType(filament.finish_type) && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg">
                <span className="text-sm text-muted-foreground">Finish Type</span>
                <span className="text-sm font-medium">{filament.finish_type}</span>
              </div>
            )}

            {/* Color Hex Code */}
            {filament.color_hex && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20">
                <span className="text-sm text-muted-foreground">Color Hex Code</span>
                <div className="flex items-center gap-2">
                  <span
                    className="h-5 w-5 rounded-full inline-block border border-border/50"
                    style={{ backgroundColor: filament.color_hex.startsWith('#') ? filament.color_hex : `#${filament.color_hex}` }}
                  />
                  <span className="font-mono text-sm">
                    {filament.color_hex.startsWith('#') ? filament.color_hex.toUpperCase() : `#${filament.color_hex.toUpperCase()}`}
                  </span>
                </div>
              </div>
            )}

            {/* Opacity */}
            {filament.light_transmission_percent != null && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg">
                <span className="text-sm text-muted-foreground">Opacity</span>
                <span className="text-sm font-medium">
                  {filament.light_transmission_percent <= 5 ? 'Opaque' : filament.light_transmission_percent <= 50 ? 'Translucent' : 'Transparent'}
                </span>
              </div>
            )}

            {/* Transmission Distance (TD) — Prominent */}
            {filament.transmission_distance != null ? (
              <div className="flex items-center justify-between py-3 px-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <span className="text-sm text-muted-foreground">Transmission Distance (TD)</span>
                <div className="text-right">
                  <span className="text-purple-400 font-bold text-lg">{filament.transmission_distance} mm</span>
                  <p className="text-xs text-muted-foreground">Used in HueForge for filament painting</p>
                  {(() => {
                    const td = filament.transmission_distance!;
                    let label: string, cls: string;
                    if (td <= 1.0) { label = 'Very Opaque — ideal for dark/anchor layers'; cls = 'bg-amber-500/15 text-amber-400 border-amber-500/25'; }
                    else if (td <= 2.5) { label = 'Opaque — good for mid-tone layers'; cls = 'bg-amber-500/10 text-amber-300 border-amber-500/20'; }
                    else if (td <= 4.0) { label = 'Semi-Translucent — standard range for most HueForge work'; cls = 'bg-purple-500/15 text-purple-400 border-purple-500/25'; }
                    else if (td <= 6.0) { label = 'Translucent — great for highlight/bright layers'; cls = 'bg-blue-500/15 text-blue-400 border-blue-500/25'; }
                    else { label = 'Very Translucent — excellent for light/white layers'; cls = 'bg-blue-500/10 text-blue-300 border-blue-500/20'; }
                    return <span className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
                  })()}
                </div>
              </div>
            ) : (
              <div className="py-2 px-3 rounded-lg">
                <p className="text-xs text-muted-foreground italic">TD value not yet measured for this filament</p>
              </div>
            )}

            {/* Light Transmission */}
            {filament.light_transmission_percent != null && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20">
                <span className="text-sm text-muted-foreground">Light Transmission</span>
                <span className="text-sm font-medium">{filament.light_transmission_percent} %</span>
              </div>
            )}

            {/* Haze */}
            {filament.haze_percent != null && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg">
                <span className="text-sm text-muted-foreground">Haze</span>
                <span className="text-sm font-medium">{filament.haze_percent} %</span>
              </div>
            )}
          </div>

          {/* HueForge callout */}
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 mt-3">
            <p className="text-xs text-muted-foreground">
              This data is essential for HueForge filament painting.{' '}
              <Link to="/reference/materials" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                Learn more about TD values →
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Product Identifiers */}
      <SpecTable
        title="Product Identifiers"
        icon={<Barcode className="w-5 h-5" />}
        specs={[
          { label: 'SKU', value: filament.variant_sku },
          { label: 'MPN', value: filament.mpn },
          { label: 'UPC', value: filament.upc },
          { label: 'EAN', value: filament.ean },
          { label: 'GTIN', value: filament.gtin },
        ]}
      />

      {/* TDS Link */}
      {filament.tds_url && (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Technical Data Sheet</h3>
            </div>
            <a 
              href={filament.tds_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              View Official TDS
              <ExternalLink className="w-4 h-4" />
            </a>
          </CardContent>
        </Card>
      )}

      {/* Advanced TDS Section */}
      <AdvancedTdsSection filament={filament} />
    </div>
  );
}
