import React, { useState } from 'react';
import { Box, Zap, Palette, Wifi, Battery, Package, Cpu, Layers, Blend, ExternalLink, TrendingUp, TrendingDown, CheckCircle2, XCircle } from 'lucide-react';
import SpecsDrawer, { SpecTable, SpecRow, FeatureList, FeatureItem, ContentSection } from './SpecsDrawer';
import {
  generateBuildVolumePreview,
  generatePrintCapabilitiesPreview,
  generateMaterialsFeaturesPreview,
  generateConnectivityPreview,
  generatePowerConstructionPreview,
  generateAccessoriesPreview,
} from '@/lib/specsPreviewGenerator';
import BuildVolumeVisualization from './BuildVolumeVisualization';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AccessoryCompatibilityBadge } from '@/components/AccessoryCompatibilityBadge';
import { AccessoryPriceChart } from '@/components/AccessoryPriceChart';
import {
  checkHotendPrinterCompatibility,
  checkBuildPlatePrinterCompatibility,
  checkAmsPrinterCompatibility,
} from '@/lib/accessoryCompatibility';

interface Printer {
  id: string;
  build_volume_x_mm?: number | null;
  build_volume_y_mm?: number | null;
  build_volume_z_mm?: number | null;
  has_enclosure?: boolean | null;
  enclosure_type?: string | null;
  enclosure_heated?: boolean | null;
  enclosure_max_temp_c?: number | null;
  internal_lighting?: boolean | null;
  door_sensor?: boolean | null;
  max_travel_speed_xy_mms?: number | null;
  max_print_speed_mms?: number | null;
  recommended_quality_speed_mms?: number | null;
  max_acceleration_xy_mmss?: number | null;
  max_acceleration_z_mmss?: number | null;
  input_shaping_supported?: boolean | null;
  linear_rails_on_axes?: string | null;
  extruder_count?: number | null;
  extruder_type?: string | null;
  extruder_drive_type?: string | null;
  filament_diameter_mm?: number | null;
  max_nozzle_temp_c?: number | null;
  sustained_nozzle_temp_c?: number | null;
  hotend_type?: string | null;
  hotend_brand_model?: string | null;
  stock_nozzle_diameter_mm?: number | null;
  supported_nozzle_diameters_mm?: string | null;
  nozzle_material?: string | null;
  max_flow_rate_mm3s?: number | null;
  bed_size_x_mm?: number | null;
  bed_size_y_mm?: number | null;
  bed_type?: string | null;
  bed_heated?: boolean | null;
  bed_max_temp_c?: number | null;
  bed_heater_power_w?: number | null;
  stock_plate_types?: string | null;
  supported_plate_types?: string | null;
  auto_bed_leveling?: boolean | null;
  auto_bed_leveling_method?: string | null;
  official_supported_materials?: string | null;
  recommended_materials?: string | null;
  abrasive_materials_supported?: boolean | null;
  max_recommended_material_temp_c?: number | null;
  multi_material_supported?: boolean | null;
  native_multi_material_system?: boolean | null;
  multi_material_max_spools?: number | null;
  multi_material_spool_chamber_max_temp_c?: number | null;
  multi_material_drying_capability?: boolean | null;
  compatible_multi_material_systems?: string | null;
  has_wifi?: boolean | null;
  has_ethernet?: boolean | null;
  has_bluetooth?: boolean | null;
  has_usb_a_port?: boolean | null;
  has_usb_c_port?: boolean | null;
  has_sd_card?: boolean | null;
  has_micro_sd_card?: boolean | null;
  onboard_storage_gb?: number | null;
  cloud_platforms?: string | null;
  remote_monitoring_supported?: boolean | null;
  remote_control_supported?: boolean | null;
  screen_type?: string | null;
  screen_size_inch?: number | null;
  screen_resolution?: string | null;
  control_knob?: boolean | null;
  ui_language_options?: string | null;
  power_input_voltage?: string | null;
  rated_power_w?: number | null;
  typical_power_pla_w?: number | null;
  typical_power_abs_w?: number | null;
  power_supply_type?: string | null;
  thermal_runaway_protection?: boolean | null;
  power_loss_recovery?: boolean | null;
  safety_certifications?: string | null;
  smoke_sensor?: boolean | null;
  filter_type?: string | null;
  temperature_sensors?: string | null;
  printer_id?: string | null;
  sku?: string | null;
  release_date?: string | null;
  discontinued?: boolean | null;
  printer_technology?: string | null;
  firmware_family?: string | null;
  firmware_open_source?: boolean | null;
  target_user_segment?: string | null;
  price_tier?: string | null;
  assembly_required?: boolean | null;
  average_assembly_time_min?: number | null;
  maintenance_interval_hours?: number | null;
  nozzle_change_ease?: string | null;
  belt_tensioning_method?: string | null;
  msrp_usd?: number | null;
  msrp_cad?: number | null;
  msrp_eur?: number | null;
  current_price_usd_store?: number | null;
  current_price_usd_amazon?: number | null;
  frame_material?: string | null;
  [key: string]: any;
}

interface Accessory {
  id: string;
  name: string;
  accessory_type: string;
  brand?: string | null;
  price?: number | null;
  currency?: string | null;
  product_url?: string | null;
  image_url?: string | null;
  specs?: any;
  price_change_percent?: number | null;
}

interface SpecsDrawerSectionProps {
  printer: Printer;
  accessories: Accessory[];
  brand: string;
}

const SpecsDrawerSection: React.FC<SpecsDrawerSectionProps> = ({
  printer,
  accessories,
  brand,
}) => {
  const [expandedDrawers, setExpandedDrawers] = useState<Set<string>>(new Set());

  const toggleDrawer = (id: string) => {
    setExpandedDrawers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Multi-material systems for compatibility check
  const allSystems = [
    { name: 'Bambu Lab AMS', key: 'ams' },
    { name: 'Bambu Lab AMS Lite', key: 'ams lite' },
    { name: 'Prusa MMU2S', key: 'mmu2s' },
    { name: 'Prusa MMU3', key: 'mmu3' },
    { name: 'E3D ToolChanger', key: 'toolchanger' },
    { name: 'Mosaic Palette', key: 'palette' },
    { name: 'ERCF (Enraged Rabbit)', key: 'ercf' },
    { name: '3DChameleon', key: '3dchameleon' },
  ];

  const compatibleSystems = printer.compatible_multi_material_systems
    ? printer.compatible_multi_material_systems.toLowerCase().split(/[,;|]/).map((s) => s.trim())
    : [];

  const isSystemCompatible = (key: string) => {
    return compatibleSystems.some(
      (cs) => cs.includes(key.toLowerCase()) || key.toLowerCase().includes(cs)
    );
  };

  // Filter accessories by type
  const hotends = accessories.filter((a) => a.accessory_type === 'nozzle');
  const buildPlates = accessories.filter((a) => a.accessory_type === 'build_plate');
  const amsMmu = accessories.filter((a) => a.accessory_type === 'ams_mmu');

  return (
    <section className="max-w-[1400px] mx-auto px-10 py-[60px] md:px-10 px-5 md:py-[60px] py-10">
      <h2 className="text-xl font-bold text-white text-left mb-8 md:text-xl text-lg">
        DETAILED SPECIFICATIONS
      </h2>

      <div className="flex flex-col gap-3">
        {/* Drawer 1: Build Volume & Dimensions */}
        <SpecsDrawer
          id="build-volume"
          icon={<Box className="w-5 h-5" />}
          title="BUILD VOLUME & DIMENSIONS"
          preview={generateBuildVolumePreview(printer)}
          isExpanded={expandedDrawers.has('build-volume')}
          onToggle={() => toggleDrawer('build-volume')}
        >
          <BuildVolumeVisualization printer={printer} />
          
          <ContentSection title="Enclosure">
            <SpecTable>
              <SpecRow label="Has Enclosure" value={printer.has_enclosure} />
              <SpecRow label="Enclosure Type" value={printer.enclosure_type} />
              <SpecRow label="Enclosure Heated" value={printer.enclosure_heated} />
              <SpecRow label="Max Enclosure Temp" value={printer.enclosure_max_temp_c} unit="°C" />
              <SpecRow label="Internal Lighting" value={printer.internal_lighting} />
              <SpecRow label="Door Sensor" value={printer.door_sensor} />
            </SpecTable>
          </ContentSection>
        </SpecsDrawer>

        {/* Drawer 2: Print Capabilities */}
        <SpecsDrawer
          id="print-capabilities"
          icon={<Zap className="w-5 h-5" />}
          title="PRINT CAPABILITIES"
          preview={generatePrintCapabilitiesPreview(printer)}
          isExpanded={expandedDrawers.has('print-capabilities')}
          onToggle={() => toggleDrawer('print-capabilities')}
        >
          <ContentSection title="Print Speeds">
            <SpecTable>
              <SpecRow label="Max Travel Speed XY" value={printer.max_travel_speed_xy_mms} unit=" mm/s" />
              <SpecRow label="Max Print Speed" value={printer.max_print_speed_mms} unit=" mm/s" />
              <SpecRow label="Recommended Quality Speed" value={printer.recommended_quality_speed_mms} unit=" mm/s" />
              <SpecRow label="Max Acceleration XY" value={printer.max_acceleration_xy_mmss} unit=" mm/s²" />
              <SpecRow label="Max Acceleration Z" value={printer.max_acceleration_z_mmss} unit=" mm/s²" />
              <SpecRow label="Input Shaping" value={printer.input_shaping_supported} />
              <SpecRow label="Linear Rails" value={printer.linear_rails_on_axes} />
            </SpecTable>
          </ContentSection>

          <ContentSection title="Extruder & Hotend">
            <SpecTable>
              <SpecRow label="Extruder Count" value={printer.extruder_count} />
              <SpecRow label="Extruder Type" value={printer.extruder_type} />
              <SpecRow label="Extruder Drive Type" value={printer.extruder_drive_type} />
              <SpecRow label="Filament Diameter" value={printer.filament_diameter_mm} unit=" mm" />
              <SpecRow label="Max Nozzle Temp" value={printer.max_nozzle_temp_c} unit="°C" />
              <SpecRow label="Sustained Nozzle Temp" value={printer.sustained_nozzle_temp_c} unit="°C" />
              <SpecRow label="Hotend Type" value={printer.hotend_type} />
              <SpecRow label="Hotend Brand/Model" value={printer.hotend_brand_model} />
              <SpecRow label="Stock Nozzle Diameter" value={printer.stock_nozzle_diameter_mm} unit=" mm" />
              <SpecRow label="Supported Nozzle Diameters" value={printer.supported_nozzle_diameters_mm} />
              <SpecRow label="Nozzle Material" value={printer.nozzle_material} />
              <SpecRow label="Max Flow Rate" value={printer.max_flow_rate_mm3s} unit=" mm³/s" />
            </SpecTable>
          </ContentSection>

          <ContentSection title="Bed">
            <SpecTable>
              <SpecRow label="Bed Size X" value={printer.bed_size_x_mm} unit=" mm" />
              <SpecRow label="Bed Size Y" value={printer.bed_size_y_mm} unit=" mm" />
              <SpecRow label="Bed Type" value={printer.bed_type} />
              <SpecRow label="Heated Bed" value={printer.bed_heated} />
              <SpecRow label="Max Bed Temp" value={printer.bed_max_temp_c} unit="°C" />
              <SpecRow label="Bed Heater Power" value={printer.bed_heater_power_w} unit=" W" />
              <SpecRow label="Stock Plate Types" value={printer.stock_plate_types} />
              <SpecRow label="Supported Plate Types" value={printer.supported_plate_types} />
              <SpecRow label="Auto Bed Leveling" value={printer.auto_bed_leveling} />
              <SpecRow label="ABL Method" value={printer.auto_bed_leveling_method} />
            </SpecTable>
          </ContentSection>
        </SpecsDrawer>

        {/* Drawer 3: Materials & Features */}
        <SpecsDrawer
          id="materials-features"
          icon={<Palette className="w-5 h-5" />}
          title="MATERIALS & FEATURES"
          preview={generateMaterialsFeaturesPreview(printer)}
          isExpanded={expandedDrawers.has('materials-features')}
          onToggle={() => toggleDrawer('materials-features')}
        >
          <ContentSection title="Material Support">
            <SpecTable>
              <SpecRow label="Official Supported Materials" value={printer.official_supported_materials} />
              <SpecRow label="Recommended Materials" value={printer.recommended_materials} />
              <SpecRow label="Abrasive Materials Supported" value={printer.abrasive_materials_supported} />
              <SpecRow label="Max Material Temp" value={printer.max_recommended_material_temp_c} unit="°C" />
            </SpecTable>
          </ContentSection>

          <ContentSection title="Multi-Material System Compatibility">
            <div className="space-y-3 mb-4">
              {allSystems.map((system) => {
                const isCompatible = isSystemCompatible(system.key);
                return (
                  <div key={system.key} className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-muted-foreground text-sm">{system.name}</span>
                    <div className="flex items-center gap-2">
                      {isCompatible ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-600 text-sm">Compatible</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-destructive" />
                          <span className="font-medium text-muted-foreground text-sm">Not Compatible</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <SpecTable>
              <SpecRow label="Multi-Material Supported" value={printer.multi_material_supported} />
              <SpecRow label="Native Multi-Material System" value={printer.native_multi_material_system} />
              <SpecRow label="Max Spools" value={printer.multi_material_max_spools} />
              <SpecRow label="Spool Chamber Max Temp" value={printer.multi_material_spool_chamber_max_temp_c} unit="°C" />
              <SpecRow label="Drying Capability" value={printer.multi_material_drying_capability} />
            </SpecTable>
          </ContentSection>
        </SpecsDrawer>

        {/* Drawer 4: Connectivity & Control */}
        <SpecsDrawer
          id="connectivity"
          icon={<Wifi className="w-5 h-5" />}
          title="CONNECTIVITY & CONTROL"
          preview={generateConnectivityPreview(printer)}
          isExpanded={expandedDrawers.has('connectivity')}
          onToggle={() => toggleDrawer('connectivity')}
        >
          <ContentSection title="Connectivity">
            <SpecTable>
              <SpecRow label="WiFi" value={printer.has_wifi} />
              <SpecRow label="Ethernet" value={printer.has_ethernet} />
              <SpecRow label="Bluetooth" value={printer.has_bluetooth} />
              <SpecRow label="USB-A Port" value={printer.has_usb_a_port} />
              <SpecRow label="USB-C Port" value={printer.has_usb_c_port} />
              <SpecRow label="SD Card" value={printer.has_sd_card} />
              <SpecRow label="Micro SD Card" value={printer.has_micro_sd_card} />
              <SpecRow label="Onboard Storage" value={printer.onboard_storage_gb} unit=" GB" />
              <SpecRow label="Cloud Platforms" value={printer.cloud_platforms} />
              <SpecRow label="Remote Monitoring" value={printer.remote_monitoring_supported} />
              <SpecRow label="Remote Control" value={printer.remote_control_supported} />
            </SpecTable>
          </ContentSection>

          <ContentSection title="Display & UI">
            <SpecTable>
              <SpecRow label="Screen Type" value={printer.screen_type} />
              <SpecRow label="Screen Size" value={printer.screen_size_inch} unit='"' />
              <SpecRow label="Screen Resolution" value={printer.screen_resolution} />
              <SpecRow label="Control Knob" value={printer.control_knob} />
              <SpecRow label="UI Languages" value={printer.ui_language_options} />
            </SpecTable>
          </ContentSection>
        </SpecsDrawer>

        {/* Drawer 5: Power & Construction */}
        <SpecsDrawer
          id="power-construction"
          icon={<Battery className="w-5 h-5" />}
          title="POWER & CONSTRUCTION"
          preview={generatePowerConstructionPreview(printer)}
          isExpanded={expandedDrawers.has('power-construction')}
          onToggle={() => toggleDrawer('power-construction')}
        >
          <ContentSection title="Power">
            <SpecTable>
              <SpecRow label="Input Voltage" value={printer.power_input_voltage} />
              <SpecRow label="Rated Power" value={printer.rated_power_w} unit=" W" />
              <SpecRow label="Typical Power (PLA)" value={printer.typical_power_pla_w} unit=" W" />
              <SpecRow label="Typical Power (ABS)" value={printer.typical_power_abs_w} unit=" W" />
              <SpecRow label="Power Supply Type" value={printer.power_supply_type} />
              <SpecRow label="Thermal Runaway Protection" value={printer.thermal_runaway_protection} />
              <SpecRow label="Power Loss Recovery" value={printer.power_loss_recovery} />
            </SpecTable>
          </ContentSection>

          <ContentSection title="Safety">
            <SpecTable>
              <SpecRow label="Safety Certifications" value={printer.safety_certifications} />
              <SpecRow label="Smoke Sensor" value={printer.smoke_sensor} />
              <SpecRow label="Filter Type" value={printer.filter_type} />
              <SpecRow label="Temperature Sensors" value={printer.temperature_sensors} />
            </SpecTable>
          </ContentSection>

          <ContentSection title="General Info">
            <SpecTable>
              <SpecRow label="Printer ID" value={printer.printer_id} />
              <SpecRow label="SKU" value={printer.sku} />
              <SpecRow label="Release Date" value={printer.release_date} />
              <SpecRow label="Discontinued" value={printer.discontinued} />
              <SpecRow label="Printer Technology" value={printer.printer_technology} />
              <SpecRow label="Firmware Family" value={printer.firmware_family} />
              <SpecRow label="Firmware Open Source" value={printer.firmware_open_source} />
              <SpecRow label="Target User Segment" value={printer.target_user_segment} />
              <SpecRow label="Price Tier" value={printer.price_tier} />
            </SpecTable>
          </ContentSection>

          <ContentSection title="Assembly & Maintenance">
            <SpecTable>
              <SpecRow label="Assembly Required" value={printer.assembly_required} />
              <SpecRow label="Average Assembly Time" value={printer.average_assembly_time_min} unit=" min" />
              <SpecRow label="Maintenance Interval" value={printer.maintenance_interval_hours} unit=" hrs" />
              <SpecRow label="Nozzle Change Ease" value={printer.nozzle_change_ease} />
              <SpecRow label="Belt Tensioning Method" value={printer.belt_tensioning_method} />
            </SpecTable>
          </ContentSection>

          <ContentSection title="Pricing">
            <SpecTable>
              <SpecRow label="MSRP (USD)" value={printer.msrp_usd} unit=" USD" />
              <SpecRow label="MSRP (CAD)" value={printer.msrp_cad} unit=" CAD" />
              <SpecRow label="MSRP (EUR)" value={printer.msrp_eur} unit=" EUR" />
              <SpecRow label="Current Price (Store)" value={printer.current_price_usd_store} unit=" USD" />
              <SpecRow label="Current Price (Amazon)" value={printer.current_price_usd_amazon} unit=" USD" />
            </SpecTable>
          </ContentSection>
        </SpecsDrawer>

        {/* Drawer 6: Accessories */}
        <SpecsDrawer
          id="accessories"
          icon={<Package className="w-5 h-5" />}
          title="ACCESSORIES"
          preview={generateAccessoriesPreview(accessories)}
          isExpanded={expandedDrawers.has('accessories')}
          onToggle={() => toggleDrawer('accessories')}
        >
          {!accessories || accessories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No accessories found. Accessories are automatically discovered when the printer is scraped.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Hotends Section */}
              {hotends.length > 0 && (
                <ContentSection title={`Hotends (${hotends.length})`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hotends.map((acc) => {
                      const specs = acc.specs as any;
                      const compatibility = checkHotendPrinterCompatibility(acc as any, printer as any);
                      return (
                        <Card key={acc.id} className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-[360px]">
                          <CardContent className="p-0 flex flex-col h-full">
                            <div className="relative h-28 flex-shrink-0">
                              {acc.image_url ? (
                                <div className="h-full bg-muted/30 flex items-center justify-center p-3">
                                  <img
                                    src={acc.image_url}
                                    alt={acc.name}
                                    className="max-h-full max-w-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="h-full bg-muted/30 flex items-center justify-center">
                                  <Cpu className="h-12 w-12 text-muted-foreground/30" />
                                </div>
                              )}
                              {acc.brand && (
                                <Badge className="absolute top-2 right-2 text-xs" variant="secondary">
                                  {acc.brand}
                                </Badge>
                              )}
                            </div>
                            <div className="p-3 flex flex-col flex-1">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h5 className="font-semibold text-sm line-clamp-2">{acc.name}</h5>
                                <AccessoryCompatibilityBadge compatibility={compatibility} compact />
                              </div>
                              <div className="space-y-1 text-xs flex-1">
                                {specs?.diameter_mm && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Diameter:</span>
                                    <span className="font-medium">{specs.diameter_mm}mm</span>
                                  </div>
                                )}
                                {specs?.material && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Material:</span>
                                    <span className="font-medium capitalize">{specs.material}</span>
                                  </div>
                                )}
                                {specs?.max_temp_c && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Max Temp:</span>
                                    <span className="font-medium">{specs.max_temp_c}°C</span>
                                  </div>
                                )}
                                {acc.price && (
                                  <div className="flex justify-between pt-1 border-t mt-1">
                                    <span className="text-muted-foreground">Price:</span>
                                    <span className="font-bold text-primary">
                                      ${acc.price} {acc.currency || 'USD'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {acc.product_url && (
                                <a href={acc.product_url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-2">
                                  <Button size="sm" variant="outline" className="w-full gap-2">
                                    <ExternalLink className="h-3 w-3" />
                                    View Product
                                  </Button>
                                </a>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ContentSection>
              )}

              {/* Build Plates Section */}
              {buildPlates.length > 0 && (
                <ContentSection title={`Build Plates (${buildPlates.length})`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {buildPlates.map((acc) => {
                      const specs = acc.specs as any;
                      const compatibility = checkBuildPlatePrinterCompatibility(acc as any, printer as any);
                      return (
                        <Card key={acc.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-semibold text-sm capitalize">{acc.name}</h5>
                              <AccessoryCompatibilityBadge compatibility={compatibility} compact />
                            </div>
                            <div className="space-y-1 text-xs">
                              {specs?.surface && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Surface:</span>
                                  <span className="font-medium">{specs.surface}</span>
                                </div>
                              )}
                              {specs?.magnetic !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Magnetic:</span>
                                  <span className="font-medium">{specs.magnetic ? 'Yes' : 'No'}</span>
                                </div>
                              )}
                              {acc.price && (
                                <div className="flex justify-between pt-2 border-t">
                                  <span className="text-muted-foreground">Price:</span>
                                  <span className="font-bold text-primary">
                                    ${acc.price} {acc.currency || 'USD'}
                                  </span>
                                </div>
                              )}
                              {acc.price_change_percent !== null && acc.price_change_percent !== undefined && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Change:</span>
                                  <span
                                    className={`flex items-center gap-1 font-semibold ${
                                      acc.price_change_percent > 0
                                        ? 'text-red-500'
                                        : acc.price_change_percent < 0
                                        ? 'text-green-500'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    {acc.price_change_percent > 0 ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : acc.price_change_percent < 0 ? (
                                      <TrendingDown className="h-3 w-3" />
                                    ) : null}
                                    {acc.price_change_percent > 0 ? '+' : ''}
                                    {acc.price_change_percent.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <AccessoryPriceChart accessoryId={acc.id} currentPrice={acc.price} currency={acc.currency || 'USD'} />
                            {acc.product_url && (
                              <a href={acc.product_url} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" className="w-full mt-2 gap-2">
                                  <ExternalLink className="h-3 w-3" />
                                  View Product
                                </Button>
                              </a>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ContentSection>
              )}

              {/* AMS/MMU Section */}
              {amsMmu.length > 0 && (
                <ContentSection title={`Multi-Material Systems (${amsMmu.length})`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {amsMmu.map((acc) => {
                      const specs = (acc.specs || {}) as any;
                      const compatibility = checkAmsPrinterCompatibility(acc as any, printer as any);
                      return (
                        <Card key={acc.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-semibold capitalize">{acc.name || 'Unknown'}</h5>
                              <AccessoryCompatibilityBadge compatibility={compatibility} compact />
                            </div>
                            <div className="space-y-2 text-sm">
                              {specs.spool_capacity != null && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Spool Capacity:</span>
                                  <span className="font-medium">{specs.spool_capacity} spools</span>
                                </div>
                              )}
                              {specs.heated !== undefined && specs.heated !== null && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Heated:</span>
                                  <span className="font-medium">{specs.heated ? 'Yes' : 'No'}</span>
                                </div>
                              )}
                              {specs.max_temp_c != null && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Max Temperature:</span>
                                  <span className="font-medium">{specs.max_temp_c}°C</span>
                                </div>
                              )}
                              {specs.power_requirements && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-muted-foreground">Power:</span>
                                  <span className="font-medium text-xs bg-muted/50 p-2 rounded">{specs.power_requirements}</span>
                                </div>
                              )}
                              {specs.filament_drying !== undefined && specs.filament_drying !== null && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Filament Drying:</span>
                                  <span className="font-medium">{specs.filament_drying ? 'Yes' : 'No'}</span>
                                </div>
                              )}
                              {acc.price && (
                                <div className="flex justify-between pt-2 border-t">
                                  <span className="text-muted-foreground">Price:</span>
                                  <span className="font-bold text-primary">
                                    ${acc.price} {acc.currency || 'USD'}
                                  </span>
                                </div>
                              )}
                              {acc.price_change_percent !== null && acc.price_change_percent !== undefined && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Change:</span>
                                  <span
                                    className={`flex items-center gap-1 font-semibold ${
                                      acc.price_change_percent > 0
                                        ? 'text-red-500'
                                        : acc.price_change_percent < 0
                                        ? 'text-green-500'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    {acc.price_change_percent > 0 ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : acc.price_change_percent < 0 ? (
                                      <TrendingDown className="h-3 w-3" />
                                    ) : null}
                                    {acc.price_change_percent > 0 ? '+' : ''}
                                    {acc.price_change_percent.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <AccessoryPriceChart accessoryId={acc.id} currentPrice={acc.price} currency={acc.currency || 'USD'} />
                            {acc.product_url && (
                              <a href={acc.product_url} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" className="w-full mt-2 gap-2">
                                  <ExternalLink className="h-3 w-3" />
                                  View Product
                                </Button>
                              </a>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ContentSection>
              )}
            </div>
          )}
        </SpecsDrawer>
      </div>
    </section>
  );
};

export default SpecsDrawerSection;
