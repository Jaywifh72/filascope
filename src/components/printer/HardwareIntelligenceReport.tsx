import { Cpu, Gauge, Thermometer, Zap, Wind, Activity, Settings, Layers, Radio, Box } from "lucide-react";

interface PrinterData {
  // Core Hardware
  hotend_type?: string | null;
  hotend_brand_model?: string | null;
  nozzle_material?: string | null;
  stock_nozzle_diameter_mm?: number | null;
  max_nozzle_temp_c?: number | null;
  sustained_nozzle_temp_c?: number | null;
  extruder_type?: string | null;
  extruder_drive_type?: string | null;
  filament_diameter_mm?: number | null;
  quick_release_hotend?: boolean | null;
  
  // Motion System
  frame_material?: string | null;
  linear_rails_on_axes?: string | null;
  belt_tensioning_method?: string | null;
  max_print_speed_mms?: number | null;
  max_travel_speed_xy_mms?: number | null;
  max_acceleration_xy_mmss?: number | null;
  max_acceleration_z_mmss?: number | null;
  input_shaping_supported?: boolean | null;
  pressure_advance_supported?: boolean | null;
  
  // Extrusion
  max_flow_rate_mm3s?: number | null;
  bed_max_temp_c?: number | null;
  bed_heater_power_w?: number | null;
  bed_type?: string | null;
  enclosure_type?: string | null;
  enclosure_max_temp_c?: number | null;
  
  // Control
  firmware_family?: string | null;
  screen_type?: string | null;
  screen_size_inch?: number | null;
  has_wifi?: boolean | null;
  has_ethernet?: boolean | null;
  cloud_platforms?: string | null;
  onboard_storage_gb?: number | null;
  
  // Sensors
  auto_bed_leveling?: boolean | null;
  abl_technique?: string | null;
  filament_runout_detection?: boolean | null;
  ai_spaghetti_detection?: boolean | null;
  door_sensor?: boolean | null;
  smoke_sensor?: boolean | null;
  thermal_runaway_protection?: boolean | null;
  
  // Recommended materials
  recommended_materials?: string | null;
  official_supported_materials?: string | null;
}

interface HardwareIntelligenceReportProps {
  printer: PrinterData;
  brand?: string | null;
}

// Wireframe Hotend SVG Component
const HotendSchematic = () => (
  <svg
    viewBox="0 0 200 320"
    className="w-full h-full"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Heatsink fins */}
    <g stroke="#00CFE8" strokeWidth="1" opacity="0.8">
      <rect x="50" y="20" width="100" height="8" rx="1" />
      <rect x="45" y="32" width="110" height="8" rx="1" />
      <rect x="50" y="44" width="100" height="8" rx="1" />
      <rect x="45" y="56" width="110" height="8" rx="1" />
      <rect x="50" y="68" width="100" height="8" rx="1" />
      <rect x="45" y="80" width="110" height="8" rx="1" />
    </g>
    
    {/* Heat break zone */}
    <rect x="75" y="92" width="50" height="30" stroke="#FF0055" strokeWidth="1.5" rx="2" opacity="0.6" />
    <text x="100" y="110" textAnchor="middle" fill="#FF0055" fontSize="8" fontFamily="JetBrains Mono" opacity="0.8">BREAK</text>
    
    {/* Heater block */}
    <rect x="55" y="126" width="90" height="50" stroke="#00CFE8" strokeWidth="2" rx="4" />
    <text x="100" y="148" textAnchor="middle" fill="#00CFE8" fontSize="9" fontFamily="JetBrains Mono" letterSpacing="0.1em">HEATER</text>
    <text x="100" y="162" textAnchor="middle" fill="#00CFE8" fontSize="9" fontFamily="JetBrains Mono" letterSpacing="0.1em">BLOCK</text>
    
    {/* Heater cartridge */}
    <rect x="148" y="140" width="30" height="12" stroke="#FF0055" strokeWidth="1" rx="2" />
    <line x1="178" y1="146" x2="195" y2="146" stroke="#FF0055" strokeWidth="1" />
    
    {/* Thermistor */}
    <circle cx="60" cy="151" r="6" stroke="#00CFE8" strokeWidth="1" />
    <line x1="54" y1="151" x2="35" y2="151" stroke="#00CFE8" strokeWidth="1" />
    <text x="25" y="154" textAnchor="end" fill="#00CFE8" fontSize="6" fontFamily="JetBrains Mono">T°</text>
    
    {/* Nozzle */}
    <path 
      d="M75 180 L75 200 L85 230 L100 250 L115 230 L125 200 L125 180" 
      stroke="#FFFFFF" 
      strokeWidth="2" 
      fill="none"
    />
    
    {/* Nozzle tip */}
    <path 
      d="M92 250 L92 280 L100 295 L108 280 L108 250" 
      stroke="#00CFE8" 
      strokeWidth="2" 
      fill="none"
    />
    
    {/* Filament path */}
    <line x1="100" y1="0" x2="100" y2="295" stroke="#FF0055" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
    
    {/* Dimension annotations */}
    <g fill="#666" fontSize="7" fontFamily="JetBrains Mono">
      <text x="170" y="55">← COOLING</text>
      <text x="170" y="115">← TRANSITION</text>
      <text x="170" y="155">← MELT ZONE</text>
      <text x="120" y="270">← EXTRUSION</text>
    </g>
    
    {/* Flow direction arrows */}
    <path d="M100 305 L95 315 L100 310 L105 315 Z" fill="#00CFE8" opacity="0.8" />
  </svg>
);

// Performance bar component
const PerformanceBar = ({ 
  label, 
  value, 
  maxValue, 
  unit,
  accentColor = "#00CFE8"
}: { 
  label: string; 
  value: number | null | undefined; 
  maxValue: number; 
  unit: string;
  accentColor?: string;
}) => {
  const percentage = value ? Math.min((value / maxValue) * 100, 100) : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-medium">
          {label}
        </span>
        <span className="font-mono text-xs text-white">
          {value ? `${value.toLocaleString()} ${unit}` : "—"}
        </span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${accentColor}40, ${accentColor})`
          }}
        />
      </div>
    </div>
  );
};

// Diagnostic module component
const DiagnosticModule = ({ 
  title, 
  icon: Icon, 
  specs 
}: { 
  title: string; 
  icon: React.ElementType; 
  specs: { label: string; value: string | number | boolean | null | undefined }[];
}) => (
  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 backdrop-blur-sm">
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
      <Icon className="h-4 w-4 text-[#00CFE8]" />
      <h4 className="text-[11px] uppercase tracking-[0.2em] font-bold text-white">
        {title}
      </h4>
    </div>
    <div className="space-y-2">
      {specs.map((spec, idx) => (
        <div key={idx} className="flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-[0.1em] text-gray-500">
            {spec.label}
          </span>
          <span className="font-mono text-[11px] text-gray-300">
            {typeof spec.value === 'boolean' 
              ? (spec.value ? '✓' : '—') 
              : (spec.value ?? '—')}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Material profile chip
const MaterialChip = ({ material, optimized }: { material: string; optimized?: boolean }) => (
  <div className={`
    px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider
    ${optimized 
      ? 'bg-[#00CFE8]/10 border border-[#00CFE8]/30 text-[#00CFE8]' 
      : 'bg-white/5 border border-white/10 text-gray-400'}
  `}>
    {material}
  </div>
);

export const HardwareIntelligenceReport = ({ printer, brand }: HardwareIntelligenceReportProps) => {
  // Parse materials
  const supportedMaterials = printer.official_supported_materials?.split(',').map(m => m.trim()) || [];
  const recommendedMaterials = printer.recommended_materials?.split(',').map(m => m.trim()) || [];
  
  // Common optimized materials based on printer specs
  const getOptimizedMaterials = () => {
    const optimized: string[] = [];
    if (printer.max_nozzle_temp_c && printer.max_nozzle_temp_c >= 300) {
      optimized.push('ABS', 'ASA', 'PC', 'NYLON');
    }
    if (printer.max_nozzle_temp_c && printer.max_nozzle_temp_c >= 260) {
      optimized.push('PETG', 'TPU');
    }
    optimized.push('PLA', 'PLA+');
    return [...new Set(optimized)];
  };
  
  const optimizedMaterials = getOptimizedMaterials();

  return (
    <section className="py-12 bg-[#0A0A0A]">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        {/* Section Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-[#00CFE8]/50 to-transparent" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#00CFE8] font-bold px-4 py-1 bg-[#00CFE8]/10 rounded-full border border-[#00CFE8]/20">
              System Analysis
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-[#FF0055]/50 to-transparent" />
          </div>
          <h2 className="text-3xl md:text-4xl font-light text-white text-center tracking-tight mt-4">
            HARDWARE <span className="italic text-[#00CFE8]">Intelligence</span> REPORT
          </h2>
        </div>

        {/* Main Grid - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Hotend Schematic */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[280px] aspect-[2/3] bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00CFE8]/50 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00CFE8]/50 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#FF0055]/50 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#FF0055]/50 rounded-br-2xl" />
              
              <HotendSchematic />
              
              {/* Hotend info overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500 mb-1">HOTEND SYSTEM</div>
                <div className="font-mono text-sm text-white">
                  {printer.hotend_brand_model || printer.hotend_type || 'Standard'}
                </div>
              </div>
            </div>
            
            {/* Performance Bars Below Schematic */}
            <div className="w-full max-w-[280px] mt-6 space-y-3">
              <PerformanceBar 
                label="Max Nozzle Temp" 
                value={printer.max_nozzle_temp_c} 
                maxValue={500} 
                unit="°C"
                accentColor="#FF0055"
              />
              <PerformanceBar 
                label="Print Speed" 
                value={printer.max_print_speed_mms} 
                maxValue={600} 
                unit="mm/s"
                accentColor="#00CFE8"
              />
              <PerformanceBar 
                label="Acceleration" 
                value={printer.max_acceleration_xy_mmss} 
                maxValue={30000} 
                unit="mm/s²"
                accentColor="#00CFE8"
              />
              <PerformanceBar 
                label="Flow Rate" 
                value={printer.max_flow_rate_mm3s} 
                maxValue={50} 
                unit="mm³/s"
                accentColor="#FF0055"
              />
            </div>
          </div>

          {/* Right Column - Diagnostic Modules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Core Hardware */}
            <DiagnosticModule
              title="Core Hardware"
              icon={Cpu}
              specs={[
                { label: "Hotend Type", value: printer.hotend_type },
                { label: "Nozzle Material", value: printer.nozzle_material },
                { label: "Stock Nozzle", value: printer.stock_nozzle_diameter_mm ? `${printer.stock_nozzle_diameter_mm}mm` : null },
                { label: "Max Temp", value: printer.max_nozzle_temp_c ? `${printer.max_nozzle_temp_c}°C` : null },
                { label: "Quick Release", value: printer.quick_release_hotend },
              ]}
            />
            
            {/* Motion System */}
            <DiagnosticModule
              title="Motion System"
              icon={Activity}
              specs={[
                { label: "Frame", value: printer.frame_material },
                { label: "Linear Rails", value: printer.linear_rails_on_axes },
                { label: "Belt Tensioning", value: printer.belt_tensioning_method },
                { label: "Input Shaping", value: printer.input_shaping_supported },
                { label: "Pressure Adv.", value: printer.pressure_advance_supported },
              ]}
            />
            
            {/* Extrusion System */}
            <DiagnosticModule
              title="Extrusion"
              icon={Zap}
              specs={[
                { label: "Extruder Type", value: printer.extruder_type },
                { label: "Drive Type", value: printer.extruder_drive_type },
                { label: "Filament Dia.", value: printer.filament_diameter_mm ? `${printer.filament_diameter_mm}mm` : null },
                { label: "Max Flow", value: printer.max_flow_rate_mm3s ? `${printer.max_flow_rate_mm3s} mm³/s` : null },
                { label: "Bed Temp", value: printer.bed_max_temp_c ? `${printer.bed_max_temp_c}°C` : null },
              ]}
            />
            
            {/* Control System */}
            <DiagnosticModule
              title="Control"
              icon={Settings}
              specs={[
                { label: "Firmware", value: printer.firmware_family },
                { label: "Display", value: printer.screen_type },
                { label: "Screen Size", value: printer.screen_size_inch ? `${printer.screen_size_inch}"` : null },
                { label: "WiFi", value: printer.has_wifi },
                { label: "Ethernet", value: printer.has_ethernet },
              ]}
            />
            
            {/* Sensors */}
            <DiagnosticModule
              title="Sensors"
              icon={Radio}
              specs={[
                { label: "Auto Leveling", value: printer.auto_bed_leveling },
                { label: "ABL Method", value: printer.abl_technique },
                { label: "Runout Detect", value: printer.filament_runout_detection },
                { label: "AI Detection", value: printer.ai_spaghetti_detection },
                { label: "Thermal Protect", value: printer.thermal_runaway_protection },
              ]}
            />
          </div>
        </div>

        {/* Material Profiles Grid */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="h-4 w-4 text-[#00CFE8]" />
            <h4 className="text-[11px] uppercase tracking-[0.2em] font-bold text-white">
              Optimized Material Profiles
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {optimizedMaterials.map((material, idx) => (
              <MaterialChip 
                key={idx} 
                material={material} 
                optimized={recommendedMaterials.some(m => 
                  m.toLowerCase().includes(material.toLowerCase())
                )}
              />
            ))}
            {supportedMaterials.filter(m => 
              !optimizedMaterials.some(o => m.toLowerCase().includes(o.toLowerCase()))
            ).slice(0, 8).map((material, idx) => (
              <MaterialChip key={`extra-${idx}`} material={material} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
