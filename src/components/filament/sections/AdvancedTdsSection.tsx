import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from '@/integrations/supabase/types';
import { FileText, Thermometer, Ruler, Gauge, FlaskConical, Wrench, Droplets, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface AdvancedTdsSectionProps {
  filament: Filament;
  className?: string;
}

interface SpecGroup {
  title: string;
  icon: React.ReactNode;
  specs: { label: string; value: string | null }[];
}

export function AdvancedTdsSection({ filament, className }: AdvancedTdsSectionProps) {
  const specGroups: SpecGroup[] = [
    {
      title: 'Temperature Settings',
      icon: <Thermometer className="w-4 h-4" />,
      specs: [
        { label: 'Nozzle Temp (Min)', value: filament.nozzle_temp_min_c ? `${filament.nozzle_temp_min_c}°C` : null },
        { label: 'Nozzle Temp (Max)', value: filament.nozzle_temp_max_c ? `${filament.nozzle_temp_max_c}°C` : null },
        { label: 'Nozzle Sweetspot', value: filament.nozzle_temp_sweetspot_c ? `${filament.nozzle_temp_sweetspot_c}°C` : null },
        { label: 'Bed Temp (Min)', value: filament.bed_temp_min_c ? `${filament.bed_temp_min_c}°C` : null },
        { label: 'Bed Temp (Max)', value: filament.bed_temp_max_c ? `${filament.bed_temp_max_c}°C` : null },
        { label: 'Melt Temperature', value: filament.melt_temp_c ? `${filament.melt_temp_c}°C` : null },
        { label: 'Glass Transition (Tg)', value: filament.tg_c ? `${filament.tg_c}°C` : null },
      ],
    },
    {
      title: 'Print Settings',
      icon: <Gauge className="w-4 h-4" />,
      specs: [
        { label: 'Max Print Speed', value: filament.print_speed_max_mms ? `${filament.print_speed_max_mms} mm/s` : null },
        { label: 'Fan Min %', value: filament.fan_min_percent !== null ? `${filament.fan_min_percent}%` : null },
        { label: 'Fan Max %', value: filament.fan_max_percent !== null ? `${filament.fan_max_percent}%` : null },
        { label: 'High-Speed Capable', value: filament.high_speed_capable !== null ? (filament.high_speed_capable ? '✓ Yes' : '✗ No') : null },
        { label: 'Recommended Nozzle', value: filament.recommended_nozzle_type },
        { label: 'Abrasive', value: filament.is_nozzle_abrasive !== null ? (filament.is_nozzle_abrasive ? '⚠️ Yes' : '✓ No') : null },
      ],
    },
    {
      title: 'Mechanical Properties',
      icon: <FlaskConical className="w-4 h-4" />,
      specs: [
        { label: 'Tensile Strength', value: filament.tensile_strength_xy_mpa ? `${filament.tensile_strength_xy_mpa} MPa` : null },
        { label: 'Tensile Modulus', value: filament.tensile_modulus_xy_mpa ? `${filament.tensile_modulus_xy_mpa} MPa` : null },
        { label: 'Flexural Strength', value: filament.flexural_strength_mpa ? `${filament.flexural_strength_mpa} MPa` : null },
        { label: 'Elongation at Break', value: filament.elongation_break_xy_percent ? `${filament.elongation_break_xy_percent}%` : null },
        { label: 'Shore Hardness D', value: filament.shore_hardness_d ? `${filament.shore_hardness_d}` : null },
        { label: 'Density', value: filament.density_g_cm3 ? `${filament.density_g_cm3} g/cm³` : null },
      ],
    },
    {
      title: 'Physical Dimensions',
      icon: <Ruler className="w-4 h-4" />,
      specs: [
        { label: 'Diameter', value: filament.diameter_nominal_mm ? `${filament.diameter_nominal_mm}mm` : null },
        { label: 'Net Weight', value: filament.net_weight_g ? `${filament.net_weight_g}g` : null },
        { label: 'Pack Quantity', value: filament.pack_quantity && filament.pack_quantity > 1 ? `${filament.pack_quantity} spools` : null },
        { label: 'Spool Material', value: filament.spool_material },
        { label: 'Spool Outer Diameter', value: filament.spool_outer_d_mm ? `${filament.spool_outer_d_mm}mm` : null },
        { label: 'Spool Width', value: filament.spool_width_mm ? `${filament.spool_width_mm}mm` : null },
        { label: 'AMS Compatible', value: filament.spool_ams_fit !== null ? (filament.spool_ams_fit ? '✓ Yes' : '✗ No') : null },
      ],
    },
    {
      title: 'Moisture & Drying',
      icon: <Droplets className="w-4 h-4" />,
      specs: [
        { label: 'Moisture Sensitivity', value: filament.moisture_sensitivity_level },
        { label: 'Moisture Care', value: filament.moisture_care },
        { label: 'Drying Temp', value: filament.drying_temp_c ? `${filament.drying_temp_c}°C` : null },
        { label: 'Drying Time', value: filament.drying_time_hours ? `${filament.drying_time_hours} hours` : null },
      ],
    },
    {
      title: 'HueForge & Appearance',
      icon: <Wrench className="w-4 h-4" />,
      specs: [
        { label: 'Transmission Distance', value: filament.transmission_distance ? `${filament.transmission_distance}` : null },
        { label: 'Color Family', value: filament.color_family },
        { label: 'Color Hex', value: filament.color_hex ? `#${filament.color_hex}` : null },
        { label: 'Finish Type', value: filament.finish_type },
        { label: 'Food Contact Rating', value: filament.food_contact_rating },
      ],
    },
    {
      title: 'Composite Additives',
      icon: <FlaskConical className="w-4 h-4" />,
      specs: [
        { label: 'Carbon Fiber %', value: filament.carbon_fiber_percentage ? `${filament.carbon_fiber_percentage}%` : null },
        { label: 'Glass Fiber %', value: filament.glass_fiber_percentage ? `${filament.glass_fiber_percentage}%` : null },
        { label: 'Wood Powder %', value: filament.wood_powder_percentage ? `${filament.wood_powder_percentage}%` : null },
        { label: 'Wood Type', value: filament.wood_type },
        { label: 'Wood Particle Size', value: filament.wood_particle_size_microns ? `${filament.wood_particle_size_microns}µm` : null },
        { label: 'Wood Fiber Length', value: filament.wood_fiber_length_mm ? `${filament.wood_fiber_length_mm}mm` : null },
        { label: 'Wood Scent Level', value: filament.wood_scent_level },
      ],
    },
    {
      title: 'Product Identifiers',
      icon: <FileText className="w-4 h-4" />,
      specs: [
        { label: 'Material', value: filament.material },
        { label: 'SKU', value: filament.variant_sku },
        { label: 'MPN', value: filament.mpn },
        { label: 'EAN', value: filament.ean },
        { label: 'UPC', value: filament.upc },
        { label: 'GTIN', value: filament.gtin },
      ],
    },
  ];

  // Filter out groups with no data
  const groupsWithData = specGroups.map(group => ({
    ...group,
    specs: group.specs.filter(spec => spec.value !== null && spec.value !== undefined),
  })).filter(group => group.specs.length > 0);

  // Count total specs available
  const totalSpecs = groupsWithData.reduce((acc, group) => acc + group.specs.length, 0);

  if (totalSpecs === 0) {
    return null;
  }

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Advanced Details (TDS)</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalSpecs} specifications from technical data sheet
              </p>
            </div>
          </div>
          {filament.tds_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={filament.tds_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                View TDS
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groupsWithData.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground pb-2 border-b border-border">
                <span className="text-primary">{group.icon}</span>
                {group.title}
              </div>
              <div className="space-y-2">
                {group.specs.map((spec, specIdx) => (
                  <div 
                    key={specIdx} 
                    className="flex justify-between items-center text-sm py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-muted-foreground">{spec.label}</span>
                    <span className="font-medium text-foreground text-right max-w-[50%] break-words">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
