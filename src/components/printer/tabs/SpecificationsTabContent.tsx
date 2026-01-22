import React, { useState } from 'react';
import { Box, Zap, Battery, Wrench, Info, Ruler, Shield, Thermometer, Settings } from 'lucide-react';
import SpecsDrawer, { SpecTable, SpecRow, ContentSection } from '../SpecsDrawer';
import BuildVolumeVisualization from '../BuildVolumeVisualization';
import {
  generateBuildVolumePreview,
  generatePrintCapabilitiesPreview,
  generatePowerConstructionPreview,
} from '@/lib/specsPreviewGenerator';

interface SpecificationsTabContentProps {
  printer: any;
}

export function SpecificationsTabContent({ printer }: SpecificationsTabContentProps) {
  const [expandedDrawers, setExpandedDrawers] = useState<Set<string>>(new Set(['build-volume']));

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

  return (
    <div className="space-y-3">
      {/* Build Volume & Dimensions */}
      <SpecsDrawer
        id="build-volume"
        icon={<Box className="w-5 h-5" />}
        title="Build Volume & Dimensions"
        preview={generateBuildVolumePreview(printer)}
        isExpanded={expandedDrawers.has('build-volume')}
        onToggle={() => toggleDrawer('build-volume')}
      >
        <BuildVolumeVisualization printer={printer} />
        
        <ContentSection title="Dimensions">
          <SpecTable>
            <SpecRow label="Build Volume X" value={printer.build_volume_x_mm} unit=" mm" />
            <SpecRow label="Build Volume Y" value={printer.build_volume_y_mm} unit=" mm" />
            <SpecRow label="Build Volume Z" value={printer.build_volume_z_mm} unit=" mm" />
            <SpecRow label="Layer Height Min" value={printer.layer_height_min_um} unit=" µm" />
            <SpecRow label="Layer Height Max" value={printer.layer_height_max_um} unit=" µm" />
            <SpecRow label="Position Accuracy XY" value={printer.position_accuracy_xy_um} unit=" µm" />
            <SpecRow label="Position Accuracy Z" value={printer.position_accuracy_z_um} unit=" µm" />
          </SpecTable>
        </ContentSection>

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

      {/* Print Capabilities */}
      <SpecsDrawer
        id="print-capabilities"
        icon={<Zap className="w-5 h-5" />}
        title="Print Capabilities"
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

      {/* Power & Construction */}
      <SpecsDrawer
        id="power-construction"
        icon={<Battery className="w-5 h-5" />}
        title="Power & Construction"
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

        <ContentSection title="Construction">
          <SpecTable>
            <SpecRow label="Frame Material" value={printer.frame_material} />
            <SpecRow label="Printer Weight" value={printer.printer_weight_kg} unit=" kg" />
            <SpecRow label="Package Weight" value={printer.package_weight_kg} unit=" kg" />
            <SpecRow label="Printer Dimensions" value={printer.printer_dimensions_mm} />
            <SpecRow label="Package Dimensions" value={printer.package_dimensions_mm} />
          </SpecTable>
        </ContentSection>
      </SpecsDrawer>

      {/* Assembly & Maintenance */}
      <SpecsDrawer
        id="assembly-maintenance"
        icon={<Wrench className="w-5 h-5" />}
        title="Assembly & Maintenance"
        preview={printer.assembly_required ? "Assembly required" : "Pre-assembled"}
        isExpanded={expandedDrawers.has('assembly-maintenance')}
        onToggle={() => toggleDrawer('assembly-maintenance')}
      >
        <ContentSection title="Assembly">
          <SpecTable>
            <SpecRow label="Assembly Required" value={printer.assembly_required} />
            <SpecRow label="Average Assembly Time" value={printer.average_assembly_time_min} unit=" min" />
          </SpecTable>
        </ContentSection>

        <ContentSection title="Maintenance">
          <SpecTable>
            <SpecRow label="Maintenance Interval" value={printer.maintenance_interval_hours} unit=" hrs" />
            <SpecRow label="Nozzle Change Ease" value={printer.nozzle_change_ease} />
            <SpecRow label="Belt Tensioning Method" value={printer.belt_tensioning_method} />
          </SpecTable>
        </ContentSection>
      </SpecsDrawer>

      {/* General Info */}
      <SpecsDrawer
        id="general-info"
        icon={<Info className="w-5 h-5" />}
        title="General Info"
        preview={printer.printer_technology || "FDM/FFF"}
        isExpanded={expandedDrawers.has('general-info')}
        onToggle={() => toggleDrawer('general-info')}
      >
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
      </SpecsDrawer>
    </div>
  );
}
