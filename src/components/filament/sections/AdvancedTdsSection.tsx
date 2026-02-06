import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from '@/integrations/supabase/types';
import { FileText, Thermometer, Ruler, Gauge, FlaskConical, Wrench, Droplets, ExternalLink, Info, Layers, Settings, Palette, Archive, Tag, Zap, Cpu, Eye, Activity, Hammer, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { validateSpec, validateDiameter, type SpecValidationResult } from '@/lib/specValidation';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface AdvancedTdsSectionProps {
  filament: Filament;
  className?: string;
}

interface SpecItem {
  label: string;
  value: string | null;
  validation?: SpecValidationResult;
}

interface SpecGroup {
  title: string;
  icon: React.ReactNode;
  specs: SpecItem[];
}

// Key details section (simplified view) - Print Settings, Physical, Appearance, Product Identifiers
export function DetailsSectionSimple({ filament, className }: AdvancedTdsSectionProps) {
  const keySpecs: SpecGroup[] = [
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
      title: 'Physical Dimensions',
      icon: <Ruler className="w-4 h-4" />,
      specs: [
        { label: 'Diameter', value: filament.diameter_nominal_mm ? `${filament.diameter_nominal_mm}mm` : null, validation: validateDiameter(filament.diameter_nominal_mm) },
        { label: 'Net Weight', value: filament.net_weight_g ? `${filament.net_weight_g}g` : null, validation: validateSpec('net_weight', filament.net_weight_g) },
        { label: 'Pack Quantity', value: filament.pack_quantity && filament.pack_quantity > 1 ? `${filament.pack_quantity} spools` : null },
        { label: 'Spool Material', value: filament.spool_material },
        { label: 'Spool Outer Diameter', value: filament.spool_outer_d_mm ? `${filament.spool_outer_d_mm}mm` : null, validation: validateSpec('spool_outer_diameter', filament.spool_outer_d_mm) },
        { label: 'Spool Width', value: filament.spool_width_mm ? `${filament.spool_width_mm}mm` : null, validation: validateSpec('spool_width', filament.spool_width_mm) },
        { label: 'AMS Compatible', value: filament.spool_ams_fit !== null ? (filament.spool_ams_fit ? '✓ Yes' : '✗ No') : null },
      ],
    },
    {
      title: 'Appearance & HueForge',
      icon: <Palette className="w-4 h-4" />,
      specs: [
        { label: 'Transmission Distance', value: filament.transmission_distance ? `${filament.transmission_distance}` : null },
        { label: 'Color Family', value: filament.color_family },
        { label: 'Color Hex', value: filament.color_hex ? `#${filament.color_hex}` : null },
        { label: 'Finish Type', value: filament.finish_type },
        { label: 'Food Contact Rating', value: filament.food_contact_rating },
      ],
    },
    {
      title: 'Product Identifiers',
      icon: <Tag className="w-4 h-4" />,
      specs: [
        { label: 'Material', value: filament.material },
        { label: 'Vendor', value: filament.vendor },
        { label: 'Product Handle', value: filament.product_handle },
        { label: 'Product ID', value: filament.product_id },
        { label: 'Variant SKU', value: filament.variant_sku },
        { label: 'MPN', value: filament.mpn },
        { label: 'EAN', value: filament.ean },
        { label: 'UPC', value: filament.upc },
        { label: 'GTIN', value: filament.gtin },
      ],
    },
  ];

  const groupsWithData = keySpecs.map(group => ({
    ...group,
    specs: group.specs.filter(spec => spec.value !== null && spec.value !== undefined),
  })).filter(group => group.specs.length > 0);

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
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Details</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Key specifications at a glance
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    className="flex justify-between items-start text-sm py-1 hover:bg-muted/30 px-1 rounded transition-colors"
                  >
                    <span className="text-muted-foreground">{spec.label}</span>
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
                      <span className="font-medium text-foreground text-right">{spec.value}</span>
                    </div>
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

// Exhaustive advanced details section
export function AdvancedDetailsSection({ filament, className }: AdvancedTdsSectionProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Advanced Details: All granular TDS specifications from manufacturer data sheets
  const allSpecGroups: SpecGroup[] = [
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
      title: 'Thermal Properties',
      icon: <Activity className="w-4 h-4" />,
      specs: [
        { label: 'Melt Index', value: (filament as any).melt_index_g_10min ? `${(filament as any).melt_index_g_10min} g/10min` : null },
        { label: 'Vicat Softening Temp', value: (filament as any).vicat_softening_temp_c ? `${(filament as any).vicat_softening_temp_c}°C` : null },
        { label: 'HDT @ 0.45 MPa', value: (filament as any).hdt_045_mpa_c ? `${(filament as any).hdt_045_mpa_c}°C` : null },
        { label: 'HDT @ 1.8 MPa', value: (filament as any).hdt_18_mpa_c ? `${(filament as any).hdt_18_mpa_c}°C` : null },
      ],
    },
    {
      title: 'Mechanical - XY Plane',
      icon: <FlaskConical className="w-4 h-4" />,
      specs: [
        { label: 'Tensile Strength', value: filament.tensile_strength_xy_mpa ? `${filament.tensile_strength_xy_mpa} MPa` : null },
        { label: 'Tensile Modulus', value: filament.tensile_modulus_xy_mpa ? `${filament.tensile_modulus_xy_mpa} MPa` : null },
        { label: 'Elongation at Break', value: filament.elongation_break_xy_percent ? `${filament.elongation_break_xy_percent}%` : null },
        { label: "Young's Modulus", value: (filament as any).youngs_modulus_mpa ? `${(filament as any).youngs_modulus_mpa} MPa` : null },
        { label: "Poisson's Ratio", value: (filament as any).poissons_ratio ? `${(filament as any).poissons_ratio}` : null },
      ],
    },
    {
      title: 'Mechanical - Z Direction',
      icon: <Layers className="w-4 h-4" />,
      specs: [
        { label: 'Tensile Strength (Z)', value: (filament as any).tensile_strength_z_mpa ? `${(filament as any).tensile_strength_z_mpa} MPa` : null },
        { label: 'Tensile Modulus (Z)', value: (filament as any).tensile_modulus_z_mpa ? `${(filament as any).tensile_modulus_z_mpa} MPa` : null },
        { label: 'Elongation at Break (Z)', value: (filament as any).elongation_break_z_percent ? `${(filament as any).elongation_break_z_percent}%` : null },
      ],
    },
    {
      title: 'Flexural Properties',
      icon: <Hammer className="w-4 h-4" />,
      specs: [
        { label: 'Flexural Strength', value: filament.flexural_strength_mpa ? `${filament.flexural_strength_mpa} MPa` : null },
        { label: 'Bending Modulus', value: (filament as any).bending_modulus_mpa ? `${(filament as any).bending_modulus_mpa} MPa` : null },
        { label: 'Bending Strength', value: (filament as any).bending_strength_mpa ? `${(filament as any).bending_strength_mpa} MPa` : null },
      ],
    },
    {
      title: 'Impact & Hardness',
      icon: <Zap className="w-4 h-4" />,
      specs: [
        { label: 'Charpy Impact Strength', value: (filament as any).impact_strength_kj_m2 ? `${(filament as any).impact_strength_kj_m2} kJ/m²` : null },
        { label: 'Notched Izod', value: (filament as any).notched_izod_j_m ? `${(filament as any).notched_izod_j_m} J/m` : null },
        { label: 'Shore Hardness D', value: filament.shore_hardness_d ? `${filament.shore_hardness_d}` : null },
        { label: 'Shore Hardness A', value: (filament as any).hardness_shore_a ? `${(filament as any).hardness_shore_a}` : null },
      ],
    },
    {
      title: 'Physical Properties',
      icon: <Ruler className="w-4 h-4" />,
      specs: [
        { label: 'Density', value: filament.density_g_cm3 ? `${filament.density_g_cm3} g/cm³` : null },
        { label: 'Water Absorption', value: (filament as any).water_absorption_percent ? `${(filament as any).water_absorption_percent}%` : null },
      ],
    },
    {
      title: 'Print Quality Parameters',
      icon: <Gauge className="w-4 h-4" />,
      specs: [
        { label: 'Max Overhang Angle', value: (filament as any).max_overhang_angle_deg ? `${(filament as any).max_overhang_angle_deg}°` : null },
        { label: 'Max Bridging Length', value: (filament as any).max_bridging_length_mm ? `${(filament as any).max_bridging_length_mm} mm` : null },
        { label: 'Retraction Length', value: (filament as any).retraction_length_mm ? `${(filament as any).retraction_length_mm} mm` : null },
        { label: 'Retraction Speed', value: (filament as any).retraction_speed_mms ? `${(filament as any).retraction_speed_mms} mm/s` : null },
      ],
    },
    {
      title: 'Moisture & Drying',
      icon: <Droplets className="w-4 h-4" />,
      specs: [
        { label: 'Moisture Sensitivity', value: filament.moisture_sensitivity_level },
        { label: 'Moisture Care', value: filament.moisture_care },
        { label: 'Nozzle Care', value: filament.nozzle_care },
        { label: 'Drying Temp', value: filament.drying_temp_c ? `${filament.drying_temp_c}°C` : null },
        { label: 'Drying Time', value: filament.drying_time_hours ? `${filament.drying_time_hours} hours` : null },
      ],
    },
    {
      title: 'Annealing / Post-Processing',
      icon: <Settings className="w-4 h-4" />,
      specs: [
        { label: 'Annealing Temp', value: (filament as any).annealing_temp_c ? `${(filament as any).annealing_temp_c}°C` : null },
        { label: 'Annealing Time', value: (filament as any).annealing_time_hours ? `${(filament as any).annealing_time_hours} hours` : null },
        { label: 'Shrinkage After Annealing', value: (filament as any).shrinkage_annealed_percent ? `${(filament as any).shrinkage_annealed_percent}%` : null },
      ],
    },
    {
      title: 'Electrical Properties',
      icon: <Cpu className="w-4 h-4" />,
      specs: [
        { label: 'Surface Resistivity', value: (filament as any).surface_resistivity_ohm ? `${(filament as any).surface_resistivity_ohm} Ω` : null },
        { label: 'Volume Resistivity', value: (filament as any).volume_resistivity_ohm_cm ? `${(filament as any).volume_resistivity_ohm_cm} Ω·cm` : null },
      ],
    },
    {
      title: 'Optical Properties',
      icon: <Eye className="w-4 h-4" />,
      specs: [
        { label: 'Light Transmission', value: (filament as any).light_transmission_percent ? `${(filament as any).light_transmission_percent}%` : null },
        { label: 'Haze', value: (filament as any).haze_percent ? `${(filament as any).haze_percent}%` : null },
      ],
    },
    {
      title: 'Composite Additives',
      icon: <Layers className="w-4 h-4" />,
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
      title: 'Performance Scores',
      icon: <Zap className="w-4 h-4" />,
      specs: [
        { label: 'Ease of Printing', value: filament.ease_of_printing_score ? `${filament.ease_of_printing_score}/100` : null },
        { label: 'Dimensional Accuracy', value: filament.dimensional_accuracy_score ? `${filament.dimensional_accuracy_score}/100` : null },
        { label: 'Strength Index', value: filament.strength_index ? `${filament.strength_index}/100` : null },
        { label: 'Printability Index', value: filament.printability_index ? `${filament.printability_index}/100` : null },
        { label: 'Value Score', value: filament.value_score ? `${filament.value_score}/100` : null },
      ],
    },
  ];

  const groupsWithData = allSpecGroups.map(group => ({
    ...group,
    specs: group.specs.filter(spec => spec.value !== null && spec.value !== undefined),
  })).filter(group => group.specs.length > 0);

  const totalSpecs = groupsWithData.reduce((acc, group) => acc + group.specs.length, 0);

  if (totalSpecs === 0) {
    return null;
  }

  return (
    <Card className={`bg-card border-border ${className}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Advanced Details</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {totalSpecs} specifications from technical data sheet
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
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
                        className="flex justify-between items-start text-sm py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Wrapper component that shows both sections
export function AdvancedTdsSection({ filament, className }: AdvancedTdsSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <DetailsSectionSimple filament={filament} />
      <AdvancedDetailsSection filament={filament} />
    </div>
  );
}
