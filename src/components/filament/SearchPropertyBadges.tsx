import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface SearchPropertyIntent {
  column: string;
  label: string;
  unit: string;
}

interface PropertyData {
  hardness_shore_a?: number | null;
  shore_hardness_d?: number | null;
  elongation_break_xy_percent?: number | null;
  tensile_strength_xy_mpa?: number | null;
  hdt_18_mpa_c?: number | null;
  print_speed_max_mms?: number | null;
  density_g_cm3?: number | null;
}

interface SearchPropertyBadgesProps {
  intent: SearchPropertyIntent;
  data: PropertyData;
}

function getFlexInterpretation(v: number | null | undefined): string | null {
  if (v == null) return null;
  if (v <= 80) return "Very Soft / Extra Flexible";
  if (v <= 90) return "Standard Flexible";
  if (v <= 95) return "Semi-Flexible";
  return "Semi-Rigid";
}

function getStrengthInterpretation(v: number | null | undefined): string | null {
  if (v == null) return null;
  if (v >= 80) return "High Strength";
  if (v >= 50) return "Standard Strength";
  return "Low Strength";
}

function getHeatInterpretation(v: number | null | undefined): string | null {
  if (v == null) return null;
  if (v >= 120) return "High Temp";
  if (v >= 80) return "Moderate Heat Resistance";
  return "Standard";
}

function getSpeedInterpretation(v: number | null | undefined): string | null {
  if (v == null) return null;
  if (v >= 300) return "High Speed";
  if (v >= 150) return "Fast";
  return "Standard";
}

function getDensityInterpretation(v: number | null | undefined): string | null {
  if (v == null) return null;
  if (v <= 1.0) return "Ultra-Light";
  if (v <= 1.2) return "Lightweight";
  return "Standard Density";
}

const BADGE_CONFIGS: Record<string, {
  getValue: (d: PropertyData) => string;
  getSecondary?: (d: PropertyData) => string | null;
  tooltip: string;
  getInterpretation: (d: PropertyData) => string | null;
  primaryStyle: string;
  secondaryStyle?: string;
}> = {
  hardness_shore_a: {
    getValue: (d) => d.hardness_shore_a != null ? `Shore ${d.hardness_shore_a}A` : "Shore —",
    getSecondary: (d) => d.elongation_break_xy_percent != null ? `Stretch ${d.elongation_break_xy_percent}%` : null,
    tooltip: "Shore A hardness — lower = more flexible. Under 85A = very soft, 85–95A = standard TPU flex, above 95A = semi-rigid",
    getInterpretation: (d) => getFlexInterpretation(d.hardness_shore_a),
    primaryStyle: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
    secondaryStyle: "bg-teal-500/15 text-teal-300 border border-teal-500/30",
  },
  tensile_strength_xy_mpa: {
    getValue: (d) => d.tensile_strength_xy_mpa != null ? `${d.tensile_strength_xy_mpa} MPa` : "— MPa",
    getSecondary: (d) => d.elongation_break_xy_percent != null ? `${d.elongation_break_xy_percent}% elongation` : null,
    tooltip: "Tensile strength in megapascals. PLA: ~50MPa, PETG: ~50MPa, PC: ~60MPa, Nylon: ~70MPa",
    getInterpretation: (d) => getStrengthInterpretation(d.tensile_strength_xy_mpa),
    primaryStyle: "bg-red-500/15 text-red-300 border border-red-500/30",
    secondaryStyle: "bg-orange-500/15 text-orange-300 border border-orange-500/30",
  },
  hdt_18_mpa_c: {
    getValue: (d) => d.hdt_18_mpa_c != null ? `HDT ${d.hdt_18_mpa_c}°C` : "HDT —°C",
    tooltip: "Heat Deflection Temperature at 1.8MPa. PLA fails ~55°C, PETG ~75°C, ABS ~90°C, PC ~130°C",
    getInterpretation: (d) => getHeatInterpretation(d.hdt_18_mpa_c),
    primaryStyle: "bg-orange-500/15 text-orange-300 border border-orange-500/30",
  },
  print_speed_max_mms: {
    getValue: (d) => d.print_speed_max_mms != null ? `Max ${d.print_speed_max_mms}mm/s` : "Speed —",
    tooltip: "Maximum recommended print speed. High-speed filaments support 300+ mm/s with proper hardware.",
    getInterpretation: (d) => getSpeedInterpretation(d.print_speed_max_mms),
    primaryStyle: "bg-green-500/15 text-green-300 border border-green-500/30",
  },
  density_g_cm3: {
    getValue: (d) => d.density_g_cm3 != null ? `${d.density_g_cm3} g/cm³` : "Density —",
    tooltip: "Material density. Lower values produce lighter parts. PLA: ~1.24, PETG: ~1.27, Nylon: ~1.14 g/cm³",
    getInterpretation: (d) => getDensityInterpretation(d.density_g_cm3),
    primaryStyle: "bg-purple-500/15 text-purple-300 border border-purple-500/30",
  },
};

export function SearchPropertyBadges({ intent, data }: SearchPropertyBadgesProps) {
  const config = BADGE_CONFIGS[intent.column];
  if (!config) return null;

  const primaryValue = config.getValue(data);
  const secondaryValue = config.getSecondary?.(data);
  const interpretation = config.getInterpretation(data);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full cursor-help font-medium ${config.primaryStyle}`}>
              {primaryValue}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[260px]">
            {config.tooltip}
          </TooltipContent>
        </Tooltip>

        {secondaryValue && config.secondaryStyle && (
          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${config.secondaryStyle}`}>
            {secondaryValue}
          </span>
        )}
      </div>

      {interpretation && (
        <span className="text-xs text-muted-foreground pl-0.5">{interpretation}</span>
      )}
    </div>
  );
}
