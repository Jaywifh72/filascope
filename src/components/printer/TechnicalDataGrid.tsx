import { Box, Zap, Thermometer, Flame, Activity, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SpecVisualizerProps {
  label: string;
  value: number;
  maxValue: number;
  unit: string;
  icon: LucideIcon;
}

function SpecVisualizer({ label, value, maxValue, unit, icon: Icon }: SpecVisualizerProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  return (
    <div className="space-y-2 p-4 bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/5 rounded-sm overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-sm transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="font-mono text-sm font-bold text-foreground min-w-[80px] text-right">
          {value.toLocaleString()}{unit}
        </span>
      </div>
    </div>
  );
}

interface DataRowProps {
  label: string;
  value: string | number | boolean | null | undefined;
  unit?: string;
}

function DataRow({ label, value, unit = '' }: DataRowProps) {
  if (value === null || value === undefined) return null;
  
  const displayValue = typeof value === 'boolean' 
    ? (value ? 'ENABLED' : 'DISABLED')
    : `${value}${unit}`;
    
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-sm font-medium text-foreground">
        {displayValue}
      </span>
    </div>
  );
}

interface TechnicalDataGridProps {
  printer: {
    build_volume_x_mm?: number | null;
    build_volume_y_mm?: number | null;
    build_volume_z_mm?: number | null;
    max_print_speed_mms?: number | null;
    max_acceleration_xy_mmss?: number | null;
    max_flow_rate_mm3s?: number | null;
    max_nozzle_temp_c?: number | null;
    bed_max_temp_c?: number | null;
    max_colors?: number | null;
    has_enclosure?: boolean | null;
    has_wifi?: boolean | null;
    extruder_type?: string | null;
    hotend_type?: string | null;
    kinematics?: string | null;
  };
}

export function TechnicalDataGrid({ printer }: TechnicalDataGridProps) {
  const hasVisualizerData = 
    printer.max_print_speed_mms || 
    printer.max_acceleration_xy_mmss || 
    printer.max_flow_rate_mm3s;

  // Calculate build volume in liters for visualization
  const buildVolumeLiters = printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm
    ? (printer.build_volume_x_mm * printer.build_volume_y_mm * printer.build_volume_z_mm) / 1000000
    : null;

  return (
    <div className="space-y-6">
      {/* Performance Visualizers */}
      {hasVisualizerData && (
        <div className="space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-4">
            &gt;&gt; PERFORMANCE_METRICS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {printer.max_print_speed_mms && (
              <SpecVisualizer
                label="MAX_PRINT_SPEED"
                value={printer.max_print_speed_mms}
                maxValue={1000}
                unit=" mm/s"
                icon={Zap}
              />
            )}
            {printer.max_acceleration_xy_mmss && (
              <SpecVisualizer
                label="MAX_ACCELERATION"
                value={printer.max_acceleration_xy_mmss}
                maxValue={30000}
                unit=" mm/s²"
                icon={Activity}
              />
            )}
            {printer.max_flow_rate_mm3s && (
              <SpecVisualizer
                label="MAX_FLOW_RATE"
                value={printer.max_flow_rate_mm3s}
                maxValue={50}
                unit=" mm³/s"
                icon={Layers}
              />
            )}
            {buildVolumeLiters && (
              <SpecVisualizer
                label="BUILD_VOLUME"
                value={Math.round(buildVolumeLiters * 10) / 10}
                maxValue={50}
                unit=" L"
                icon={Box}
              />
            )}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="space-y-3">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          &gt;&gt; SYSTEM_SPECIFICATIONS
        </h3>
        <div className="bg-white/[0.02] border border-white/5 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              {printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm && (
                <DataRow 
                  label="BUILD_ENVELOPE" 
                  value={`${printer.build_volume_x_mm}×${printer.build_volume_y_mm}×${printer.build_volume_z_mm}`}
                  unit="mm"
                />
              )}
              <DataRow label="MAX_NOZZLE_TEMP" value={printer.max_nozzle_temp_c} unit="°C" />
              <DataRow label="MAX_BED_TEMP" value={printer.bed_max_temp_c} unit="°C" />
              <DataRow label="KINEMATICS" value={printer.kinematics} />
            </div>
            <div>
              <DataRow label="EXTRUDER_TYPE" value={printer.extruder_type} />
              <DataRow label="HOTEND_TYPE" value={printer.hotend_type} />
              <DataRow label="ENCLOSURE" value={printer.has_enclosure} />
              <DataRow label="NETWORK" value={printer.has_wifi} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
