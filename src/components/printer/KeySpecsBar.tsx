import { Box, Zap, Thermometer, Flame, Palette, Wifi, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KeySpec {
  icon: LucideIcon;
  label?: string;
  value: string;
}

interface KeySpecsBarProps {
  specs: KeySpec[];
}

export function KeySpecsBar({ specs }: KeySpecsBarProps) {
  if (!specs || specs.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-start items-center gap-4 md:gap-6">
        {specs.map((spec, index) => (
          <div key={index} className="flex items-center gap-2 min-w-0 bg-muted/30 px-3 py-2 rounded-lg border border-border/50">
            <spec.icon className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-xs text-foreground">
              {spec.label && (
                <span className="text-muted-foreground mr-1">{spec.label}:</span>
              )}
              <span className="font-semibold">{spec.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to generate key specs from printer data
export function generateKeySpecs(printer: {
  build_volume_x_mm?: number | null;
  build_volume_y_mm?: number | null;
  build_volume_z_mm?: number | null;
  max_print_speed_mms?: number | null;
  max_nozzle_temp_c?: number | null;
  bed_max_temp_c?: number | null;
  max_colors?: number | null;
  multi_material_supported?: boolean | null;
  has_wifi?: boolean | null;
  has_enclosure?: boolean | null;
}): KeySpec[] {
  const specs: KeySpec[] = [];

  // Build volume
  if (printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm) {
    specs.push({
      icon: Box,
      label: "Build",
      value: `${printer.build_volume_x_mm}×${printer.build_volume_y_mm}×${printer.build_volume_z_mm}mm`,
    });
  }

  // Speed
  if (printer.max_print_speed_mms) {
    specs.push({
      icon: Zap,
      label: "Speed",
      value: `${printer.max_print_speed_mms}mm/s`,
    });
  }

  // Nozzle temp
  if (printer.max_nozzle_temp_c) {
    specs.push({
      icon: Thermometer,
      label: "Nozzle",
      value: `${printer.max_nozzle_temp_c}°C`,
    });
  }

  // Bed temp
  if (printer.bed_max_temp_c) {
    specs.push({
      icon: Flame,
      label: "Bed",
      value: `${printer.bed_max_temp_c}°C`,
    });
  }

  // Multi-color
  if (printer.multi_material_supported || (printer.max_colors && printer.max_colors > 1)) {
    specs.push({
      icon: Palette,
      value: printer.max_colors ? `${printer.max_colors}-Color` : "Multi-Color",
    });
  }

  // Enclosure
  if (printer.has_enclosure) {
    specs.push({
      icon: Package,
      value: "Enclosed",
    });
  }

  // WiFi
  if (printer.has_wifi) {
    specs.push({
      icon: Wifi,
      value: "Wi-Fi",
    });
  }

  // Return max 6 specs
  return specs.slice(0, 6);
}
