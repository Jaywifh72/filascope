import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  Box, Zap, Thermometer, Layers, Shield, Battery, Info, 
  Check, X, Eye, EyeOff, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SpecificationsTabContentProps {
  printer: any;
}

interface SpecCategory {
  id: string;
  label: string;
  icon: React.ElementType;
}

const CATEGORIES: SpecCategory[] = [
  { id: 'dimensions', label: 'Dimensions', icon: Box },
  { id: 'print-performance', label: 'Print Performance', icon: Zap },
  { id: 'extruder-hotend', label: 'Extruder & Hotend', icon: Thermometer },
  { id: 'build-plate', label: 'Build Plate', icon: Layers },
  { id: 'enclosure', label: 'Enclosure', icon: Shield },
  { id: 'power-safety', label: 'Power & Safety', icon: Battery },
  { id: 'general', label: 'General', icon: Info },
];

// Helper to check if a value is empty
const isValueEmpty = (value: any): boolean => {
  return value === null || value === undefined || value === '' || value === '—';
};

// Enhanced SpecRow with improved spacing and boolean icons
const SpecRow: React.FC<{
  label: string;
  value: any;
  unit?: string;
  showEmpty?: boolean;
}> = ({ label, value, unit, showEmpty = true }) => {
  const isEmpty = isValueEmpty(value);

  if (isEmpty && !showEmpty) return null;

  const isBoolean = typeof value === 'boolean';
  const isYes = isBoolean && value === true;
  const isNo = isBoolean && value === false;

  let displayValue: React.ReactNode;
  if (isEmpty) {
    displayValue = <span className="text-muted-foreground/50 italic">—</span>;
  } else if (isYes) {
    displayValue = (
      <span className="inline-flex items-center gap-1.5 text-green-400">
        <Check className="w-4 h-4" />
        Yes
      </span>
    );
  } else if (isNo) {
    displayValue = (
      <span className="inline-flex items-center gap-1.5 text-gray-500">
        <X className="w-4 h-4" />
        No
      </span>
    );
  } else {
    displayValue = String(value) + (unit || '');
  }

  return (
    <div className={cn("spec-row", isEmpty && "opacity-60")}>
      <div className="text-sm text-gray-400">{label}</div>
      <div className={cn(
        "text-sm sm:text-base font-medium text-right",
        isEmpty ? "text-gray-500" : isBoolean && !isYes ? "text-gray-500" : "text-white"
      )}>
        {displayValue}
      </div>
    </div>
  );
};

// Section component with enhanced styling
const SpecSection: React.FC<{
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ id, title, icon: Icon, children }) => (
  <section id={`spec-${id}`} className="scroll-mt-24">
    <div className="section-header">
      <div className="section-header-icon">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h2 className="section-title">{title}</h2>
    </div>
    <div className="section-card p-5 lg:p-6">
      {children}
    </div>
  </section>
);

// Subsection divider with improved spacing
const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="subsection-divider">
    <div className="flex items-center gap-3 mb-4">
      <span className="text-lg font-medium text-foreground">{title}</span>
      <div className="flex-1 h-px bg-border/30" />
    </div>
    {children}
  </div>
);

export function SpecificationsTabContent({ printer }: SpecificationsTabContentProps) {
  const [activeCategory, setActiveCategory] = useState('dimensions');
  const [showAllFields, setShowAllFields] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Count hidden (empty) fields
  const hiddenFieldsCount = useMemo(() => {
    const fieldsToCheck = [
      printer.build_volume_x_mm, printer.build_volume_y_mm, printer.build_volume_z_mm,
      printer.layer_height_min_um, printer.layer_height_max_um, printer.layer_height_default_um,
      printer.xy_positioning_accuracy_um, printer.z_positioning_accuracy_um, printer.repeatability_um,
      printer.printer_dimensions_mm, printer.printer_weight_kg, printer.package_dimensions_mm, printer.package_weight_kg,
      printer.max_print_speed_mms, printer.max_travel_speed_xy_mms, printer.recommended_quality_speed_mms,
      printer.max_acceleration_xy_mmss, printer.max_acceleration_z_mmss,
      printer.input_shaping_supported, printer.linear_rails_on_axes, printer.kinematics,
      printer.extruder_count, printer.extruder_type, printer.extruder_drive_type, printer.filament_diameter_mm,
      printer.hotend_type, printer.hotend_brand_model, printer.max_nozzle_temp_c, printer.sustained_nozzle_temp_c, printer.max_flow_rate_mm3s,
      printer.stock_nozzle_diameter_mm, printer.supported_nozzle_diameters_mm, printer.nozzle_material, printer.nozzle_change_ease,
      printer.bed_size_x_mm, printer.bed_size_y_mm, printer.bed_type,
      printer.bed_heated, printer.bed_max_temp_c, printer.bed_heater_power_w,
      printer.stock_plate_types, printer.supported_plate_types,
      printer.auto_bed_leveling, printer.auto_bed_leveling_method,
      printer.has_enclosure, printer.enclosure_type, printer.enclosure_heated, printer.enclosure_max_temp_c,
      printer.internal_lighting, printer.door_sensor, printer.filter_type,
      printer.power_input_voltage, printer.rated_power_w, printer.typical_power_pla_w, printer.typical_power_abs_w, printer.power_supply_type,
      printer.thermal_runaway_protection, printer.power_loss_recovery, printer.smoke_sensor, printer.safety_certifications, printer.temperature_sensors,
      printer.frame_material, printer.assembly_required, printer.average_assembly_time_min,
      printer.printer_id, printer.sku, printer.release_date, printer.discontinued, printer.printer_technology,
      printer.firmware_family, printer.firmware_open_source, printer.target_user_segment, printer.price_tier, printer.maintenance_interval_hours
    ];
    return fieldsToCheck.filter(isValueEmpty).length;
  }, [printer]);

  const scrollToSection = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(`spec-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Find current category for mobile dropdown
  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Mobile Category Dropdown */}
      <div className="lg:hidden">
        <Select value={activeCategory} onValueChange={scrollToSection}>
          <SelectTrigger className="w-full bg-card/50 border-border/50">
            <div className="flex items-center gap-2">
              {currentCategory && <currentCategory.icon className="w-4 h-4 text-primary" />}
              <SelectValue placeholder="Select category" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Left Sidebar Navigation */}
      <nav className="hidden lg:block w-56 flex-shrink-0">
        <div className="sticky top-24 space-y-1">
          <div className="text-sm text-gray-400 mb-4 px-3">
            Categories
          </div>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => scrollToSection(cat.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all text-left",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{cat.label}</span>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 min-w-0 tab-content">
        {/* Toggle Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 border border-border/40 rounded-xl">
          <div className="flex items-center gap-2 sm:gap-3">
            {showAllFields ? (
              <Eye className="w-4 h-4 text-primary" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
            <Label htmlFor="show-all" className="text-sm text-gray-400 cursor-pointer">
              {showAllFields ? (
                <span>Showing all fields</span>
              ) : (
                <>
                  <span className="hidden sm:inline">Show all fields ({hiddenFieldsCount} hidden)</span>
                  <span className="sm:hidden">{hiddenFieldsCount} hidden</span>
                </>
              )}
            </Label>
          </div>
          <Switch
            id="show-all"
            checked={showAllFields}
            onCheckedChange={setShowAllFields}
          />
        </div>

        {/* Dimensions Section */}
        <SpecSection id="dimensions" title="Dimensions" icon={Box}>
          <SubSection title="Build Volume">
            <SpecRow label="Build Volume X" value={printer.build_volume_x_mm} unit=" mm" showEmpty={showAllFields} />
            <SpecRow label="Build Volume Y" value={printer.build_volume_y_mm} unit=" mm" showEmpty={showAllFields} />
            <SpecRow label="Build Volume Z" value={printer.build_volume_z_mm} unit=" mm" showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Layer Height">
            <SpecRow label="Layer Height Min" value={printer.layer_height_min_um} unit=" µm" showEmpty={showAllFields} />
            <SpecRow label="Layer Height Max" value={printer.layer_height_max_um} unit=" µm" showEmpty={showAllFields} />
            <SpecRow label="Default Layer Height" value={printer.layer_height_default_um} unit=" µm" showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Positioning Accuracy">
            <SpecRow label="XY Positioning Accuracy" value={printer.xy_positioning_accuracy_um} unit=" µm" showEmpty={showAllFields} />
            <SpecRow label="Z Positioning Accuracy" value={printer.z_positioning_accuracy_um} unit=" µm" showEmpty={showAllFields} />
            <SpecRow label="Repeatability" value={printer.repeatability_um} unit=" µm" showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Machine Dimensions">
            <SpecRow label="Printer Dimensions" value={printer.printer_dimensions_mm} showEmpty={showAllFields} />
            <SpecRow label="Printer Weight" value={printer.printer_weight_kg} unit=" kg" showEmpty={showAllFields} />
            <SpecRow label="Package Dimensions" value={printer.package_dimensions_mm} showEmpty={showAllFields} />
            <SpecRow label="Package Weight" value={printer.package_weight_kg} unit=" kg" showEmpty={showAllFields} />
          </SubSection>
        </SpecSection>

        {/* Print Performance Section */}
        <SpecSection id="print-performance" title="Print Performance" icon={Zap}>
          <SubSection title="Speed">
            <SpecRow label="Max Print Speed" value={printer.max_print_speed_mms} unit=" mm/s" showEmpty={showAllFields} />
            <SpecRow label="Max Travel Speed XY" value={printer.max_travel_speed_xy_mms} unit=" mm/s" showEmpty={showAllFields} />
            <SpecRow label="Recommended Quality Speed" value={printer.recommended_quality_speed_mms} unit=" mm/s" showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Acceleration">
            <SpecRow label="Max Acceleration XY" value={printer.max_acceleration_xy_mmss} unit=" mm/s²" showEmpty={showAllFields} />
            <SpecRow label="Max Acceleration Z" value={printer.max_acceleration_z_mmss} unit=" mm/s²" showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Motion System">
            <SpecRow label="Input Shaping" value={printer.input_shaping_supported} showEmpty={showAllFields} />
            <SpecRow label="Linear Rails" value={printer.linear_rails_on_axes} showEmpty={showAllFields} />
            <SpecRow label="Kinematics" value={printer.kinematics} showEmpty={showAllFields} />
          </SubSection>
        </SpecSection>

        {/* Extruder & Hotend Section */}
        <SpecSection id="extruder-hotend" title="Extruder & Hotend" icon={Thermometer}>
          <SubSection title="Extruder">
            <SpecRow label="Extruder Count" value={printer.extruder_count} showEmpty={showAllFields} />
            <SpecRow label="Extruder Type" value={printer.extruder_type} showEmpty={showAllFields} />
            <SpecRow label="Extruder Drive Type" value={printer.extruder_drive_type} showEmpty={showAllFields} />
            <SpecRow label="Filament Diameter" value={printer.filament_diameter_mm} unit=" mm" showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Hotend">
            <SpecRow label="Hotend Type" value={printer.hotend_type} showEmpty={showAllFields} />
            <SpecRow label="Hotend Brand/Model" value={printer.hotend_brand_model} showEmpty={showAllFields} />
            <SpecRow label="Max Nozzle Temp" value={printer.max_nozzle_temp_c} unit="°C" showEmpty={showAllFields} />
            <SpecRow label="Sustained Nozzle Temp" value={printer.sustained_nozzle_temp_c} unit="°C" showEmpty={showAllFields} />
            <SpecRow label="Max Flow Rate" value={printer.max_flow_rate_mm3s} unit=" mm³/s" showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Nozzle">
            <SpecRow label="Stock Nozzle Diameter" value={printer.stock_nozzle_diameter_mm} unit=" mm" showEmpty={showAllFields} />
            <SpecRow label="Supported Nozzle Diameters" value={printer.supported_nozzle_diameters_mm} showEmpty={showAllFields} />
            <SpecRow label="Nozzle Material" value={printer.nozzle_material} showEmpty={showAllFields} />
            <SpecRow label="Nozzle Change Ease" value={printer.nozzle_change_ease} showEmpty={showAllFields} />
          </SubSection>
        </SpecSection>

        {/* Build Plate Section */}
        <SpecSection id="build-plate" title="Build Plate" icon={Layers}>
          <SubSection title="Bed Specifications">
            <SpecRow label="Bed Size X" value={printer.bed_size_x_mm} unit=" mm" showEmpty={showAllFields} />
            <SpecRow label="Bed Size Y" value={printer.bed_size_y_mm} unit=" mm" showEmpty={showAllFields} />
            <SpecRow label="Bed Type" value={printer.bed_type} showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Heating">
            <SpecRow label="Heated Bed" value={printer.bed_heated} showEmpty={showAllFields} />
            <SpecRow label="Max Bed Temperature" value={printer.bed_max_temp_c} unit="°C" showEmpty={showAllFields} />
            <SpecRow label="Bed Heater Power" value={printer.bed_heater_power_w} unit=" W" showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Build Surfaces">
            <SpecRow label="Stock Plate Types" value={printer.stock_plate_types} showEmpty={showAllFields} />
            <SpecRow label="Supported Plate Types" value={printer.supported_plate_types} showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Leveling">
            <SpecRow label="Auto Bed Leveling" value={printer.auto_bed_leveling} showEmpty={showAllFields} />
            <SpecRow label="ABL Method" value={printer.auto_bed_leveling_method} showEmpty={showAllFields} />
          </SubSection>
        </SpecSection>

        {/* Enclosure Section */}
        <SpecSection id="enclosure" title="Enclosure" icon={Shield}>
          <SubSection title="Enclosure Features">
            <SpecRow label="Has Enclosure" value={printer.has_enclosure} showEmpty={showAllFields} />
            <SpecRow label="Enclosure Type" value={printer.enclosure_type} showEmpty={showAllFields} />
            <SpecRow label="Enclosure Heated" value={printer.enclosure_heated} showEmpty={showAllFields} />
            <SpecRow label="Max Enclosure Temp" value={printer.enclosure_max_temp_c} unit="°C" showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Environment">
            <SpecRow label="Internal Lighting" value={printer.internal_lighting} showEmpty={showAllFields} />
            <SpecRow label="Door Sensor" value={printer.door_sensor} showEmpty={showAllFields} />
            <SpecRow label="Filter Type" value={printer.filter_type} showEmpty={showAllFields} />
          </SubSection>
        </SpecSection>

        {/* Power & Safety Section */}
        <SpecSection id="power-safety" title="Power & Safety" icon={Battery}>
          <SubSection title="Power">
            <SpecRow label="Input Voltage" value={printer.power_input_voltage} showEmpty={showAllFields} />
            <SpecRow label="Rated Power" value={printer.rated_power_w} unit=" W" showEmpty={showAllFields} />
            <SpecRow label="Typical Power (PLA)" value={printer.typical_power_pla_w} unit=" W" showEmpty={showAllFields} />
            <SpecRow label="Typical Power (ABS)" value={printer.typical_power_abs_w} unit=" W" showEmpty={showAllFields} />
            <SpecRow label="Power Supply Type" value={printer.power_supply_type} showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Safety Features">
            <SpecRow label="Thermal Runaway Protection" value={printer.thermal_runaway_protection} showEmpty={showAllFields} />
            <SpecRow label="Power Loss Recovery" value={printer.power_loss_recovery} showEmpty={showAllFields} />
            <SpecRow label="Smoke Sensor" value={printer.smoke_sensor} showEmpty={showAllFields} />
            <SpecRow label="Safety Certifications" value={printer.safety_certifications} showEmpty={showAllFields} />
            <SpecRow label="Temperature Sensors" value={printer.temperature_sensors} showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Construction">
            <SpecRow label="Frame Material" value={printer.frame_material} showEmpty={showAllFields} />
            <SpecRow label="Assembly Required" value={printer.assembly_required} showEmpty={showAllFields} />
            <SpecRow label="Average Assembly Time" value={printer.average_assembly_time_min} unit=" min" showEmpty={showAllFields} />
          </SubSection>
        </SpecSection>

        {/* General Section */}
        <SpecSection id="general" title="General" icon={Info}>
          <SubSection title="Identification">
            <SpecRow label="Printer ID" value={printer.printer_id} showEmpty={showAllFields} />
            <SpecRow label="SKU" value={printer.sku} showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Product Info">
            <SpecRow label="Release Date" value={printer.release_date} showEmpty={showAllFields} />
            <SpecRow label="Discontinued" value={printer.discontinued} showEmpty={showAllFields} />
            <SpecRow label="Printer Technology" value={printer.printer_technology} showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Firmware">
            <SpecRow label="Firmware Family" value={printer.firmware_family} showEmpty={showAllFields} />
            <SpecRow label="Firmware Open Source" value={printer.firmware_open_source} showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Classification">
            <SpecRow label="Target User Segment" value={printer.target_user_segment} showEmpty={showAllFields} />
            <SpecRow label="Price Tier" value={printer.price_tier} showEmpty={showAllFields} />
          </SubSection>
          <SubSection title="Maintenance">
            <SpecRow label="Maintenance Interval" value={printer.maintenance_interval_hours} unit=" hrs" showEmpty={showAllFields} />
            <SpecRow label="Belt Tensioning Method" value={printer.belt_tensioning_method} showEmpty={showAllFields} />
          </SubSection>
        </SpecSection>
      </div>
    </div>
  );
}
