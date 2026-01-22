import React from 'react';
import { Database } from '@/integrations/supabase/types';
import { AdvancedTdsSection } from '../sections/AdvancedTdsSection';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  ExternalLink
} from 'lucide-react';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface SpecificationsTabContentProps {
  filament: Filament;
}

interface SpecRow {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
}

function SpecTable({ title, icon, specs }: { title: string; icon: React.ReactNode; specs: SpecRow[] }) {
  const validSpecs = specs.filter(s => s.value !== null && s.value !== undefined && s.value !== '');
  if (validSpecs.length === 0) return null;

  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="space-y-2">
          {validSpecs.map((spec, idx) => (
            <div 
              key={idx}
              className={`flex justify-between py-2 px-3 rounded-lg ${idx % 2 === 0 ? 'bg-muted/20' : ''}`}
            >
              <span className="text-sm text-muted-foreground">{spec.label}</span>
              <span className="text-sm font-medium">
                {spec.value}{spec.unit ? ` ${spec.unit}` : ''}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SpecificationsTabContent({ filament }: SpecificationsTabContentProps) {
  return (
    <div className="space-y-6">
      {/* Print Settings */}
      <SpecTable
        title="Print Settings"
        icon={<ThermometerSun className="w-5 h-5" />}
        specs={[
          { label: 'Nozzle Temperature (Min)', value: filament.nozzle_temp_min_c, unit: '°C' },
          { label: 'Nozzle Temperature (Max)', value: filament.nozzle_temp_max_c, unit: '°C' },
          { label: 'Nozzle Sweet Spot', value: filament.nozzle_temp_sweetspot_c, unit: '°C' },
          { label: 'Bed Temperature (Min)', value: filament.bed_temp_min_c, unit: '°C' },
          { label: 'Bed Temperature (Max)', value: filament.bed_temp_max_c, unit: '°C' },
          { label: 'Max Print Speed', value: filament.print_speed_max_mms, unit: 'mm/s' },
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
        specs={[
          { label: 'Diameter', value: filament.diameter_nominal_mm, unit: 'mm' },
          { label: 'Net Weight', value: filament.net_weight_g, unit: 'g' },
          { label: 'Density', value: filament.density_g_cm3, unit: 'g/cm³' },
          { label: 'Spool Outer Diameter', value: filament.spool_outer_d_mm, unit: 'mm' },
          { label: 'Spool Width', value: filament.spool_width_mm, unit: 'mm' },
          { label: 'AMS Compatible', value: filament.spool_ams_fit !== null ? (filament.spool_ams_fit ? 'Yes' : 'No') : null },
          { label: 'Spool Material', value: filament.spool_material },
        ]}
      />

      {/* Mechanical Properties */}
      <SpecTable
        title="Mechanical Properties"
        icon={<Shield className="w-5 h-5" />}
        specs={[
          { label: 'Tensile Strength (XY)', value: filament.tensile_strength_xy_mpa, unit: 'MPa' },
          { label: 'Tensile Strength (Z)', value: filament.tensile_strength_z_mpa, unit: 'MPa' },
          { label: 'Tensile Modulus (XY)', value: filament.tensile_modulus_xy_mpa, unit: 'MPa' },
          { label: 'Tensile Modulus (Z)', value: filament.tensile_modulus_z_mpa, unit: 'MPa' },
          { label: 'Elongation at Break (XY)', value: filament.elongation_break_xy_percent, unit: '%' },
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

      {/* Appearance & HueForge */}
      <SpecTable
        title="Appearance & HueForge"
        icon={<Palette className="w-5 h-5" />}
        specs={[
          { label: 'Color Family', value: filament.color_family },
          { label: 'Finish Type', value: filament.finish_type },
          { label: 'Transmission Distance', value: filament.transmission_distance, unit: 'mm' },
          { label: 'Light Transmission', value: filament.light_transmission_percent, unit: '%' },
          { label: 'Haze', value: filament.haze_percent, unit: '%' },
        ]}
      />

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
