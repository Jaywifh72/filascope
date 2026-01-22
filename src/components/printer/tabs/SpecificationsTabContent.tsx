import React, { useState, useRef, useCallback } from 'react';
import { 
  Box, Zap, Thermometer, Layers, Shield, Battery, Info, 
  Check, X, Eye, EyeOff, ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

// Enhanced SpecRow with Yes/No styling
const SpecRow: React.FC<{
  label: string;
  value: any;
  unit?: string;
  showEmpty?: boolean;
}> = ({ label, value, unit, showEmpty = false }) => {
  const isEmpty = value === null || value === undefined || value === '' || value === '—';
  
  if (isEmpty && !showEmpty) return null;

  const isBoolean = typeof value === 'boolean';
  const isYes = isBoolean && value === true;
  const isNo = isBoolean && value === false;

  let displayValue: React.ReactNode;
  if (isEmpty) {
    displayValue = <span className="text-muted-foreground/50">—</span>;
  } else if (isYes) {
    displayValue = (
      <span className="inline-flex items-center gap-1.5 text-primary">
        <Check className="w-4 h-4" />
        Yes
      </span>
    );
  } else if (isNo) {
    displayValue = (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground/60">
        <X className="w-4 h-4" />
        No
      </span>
    );
  } else {
    displayValue = String(value) + (unit || '');
  }

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center py-3 border-b border-border/20 last:border-b-0 gap-1 md:gap-4 hover:bg-muted/20 px-3 -mx-3 rounded-lg transition-colors">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn(
        "text-sm font-medium md:text-right",
        !isBoolean && !isEmpty && "text-foreground"
      )}>
        {displayValue}
      </div>
    </div>
  );
};

// Section component
const SpecSection: React.FC<{
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ id, title, icon: Icon, children }) => (
  <section id={`spec-${id}`} className="scroll-mt-24">
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/40">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
    </div>
    <div className="bg-card/50 border border-border/40 rounded-xl p-4">
      {children}
    </div>
  </section>
);

// Subsection divider
const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6 last:mb-0">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
      <div className="flex-1 h-px bg-border/30" />
    </div>
    {children}
  </div>
);

export function SpecificationsTabContent({ printer }: SpecificationsTabContentProps) {
  const [activeCategory, setActiveCategory] = useState('dimensions');
  const [showAllFields, setShowAllFields] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(`spec-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="flex gap-6">
      {/* Left Sidebar Navigation */}
      <nav className="hidden lg:block w-56 flex-shrink-0">
        <div className="sticky top-24 space-y-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-3">
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
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
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
      <div ref={containerRef} className="flex-1 min-w-0 space-y-8">
        {/* Toggle Header */}
        <div className="flex items-center justify-between p-4 bg-muted/30 border border-border/40 rounded-xl">
          <div className="flex items-center gap-2">
            {showAllFields ? (
              <Eye className="w-4 h-4 text-muted-foreground" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
            <Label htmlFor="show-all" className="text-sm text-muted-foreground cursor-pointer">
              Show all fields (including empty)
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
