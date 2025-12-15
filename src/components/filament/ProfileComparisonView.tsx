import { ProfileData, getDefaultProfileForMaterial } from "@/lib/slicerMapping";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus, Lightbulb, AlertTriangle } from "lucide-react";

interface ProfileComparisonViewProps {
  profile: ProfileData;
  defaultProfile: Partial<ProfileData>;
}

interface ComparisonRow {
  label: string;
  key: keyof ProfileData;
  unit: string;
  format?: (value: number) => string;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { label: 'Nozzle Temperature', key: 'nozzle_temp', unit: '°C' },
  { label: 'First Layer Nozzle', key: 'nozzle_temp_first_layer', unit: '°C' },
  { label: 'Bed Temperature', key: 'bed_temp', unit: '°C' },
  { label: 'First Layer Bed', key: 'bed_temp_first_layer', unit: '°C' },
  { label: 'Max Fan Speed', key: 'fan_max_speed', unit: '%' },
  { label: 'Min Fan Speed', key: 'fan_min_speed', unit: '%' },
  { label: 'Retraction Length', key: 'retraction_length', unit: 'mm' },
  { label: 'Retraction Speed', key: 'retraction_speed', unit: 'mm/s' },
  { label: 'Z-Hop', key: 'z_hop', unit: 'mm' },
  { label: 'Print Speed', key: 'print_speed', unit: 'mm/s' },
  { label: 'First Layer Speed', key: 'first_layer_speed', unit: 'mm/s' },
  { label: 'Flow Ratio', key: 'flow_ratio', unit: '', format: (v) => v.toFixed(2) },
];

const CHANGE_EXPLANATIONS: Record<string, (diff: number) => string | null> = {
  nozzle_temp: (diff) => {
    if (diff > 10) return 'Higher temp for better flow characteristics';
    if (diff < -10) return 'Lower temp to prevent stringing';
    return null;
  },
  bed_temp: (diff) => {
    if (diff > 10) return 'Higher bed temp for better adhesion';
    if (diff < -10) return 'Lower bed temp to prevent warping';
    return null;
  },
  fan_max_speed: (diff) => {
    if (diff < -20) return 'Reduced cooling for better layer adhesion';
    if (diff > 20) return 'Increased cooling for bridging and overhangs';
    return null;
  },
  retraction_length: (diff) => {
    if (diff > 0.5) return 'Increased retraction to prevent stringing';
    if (diff < -0.3) return 'Reduced retraction for direct drive or flexible materials';
    return null;
  },
  print_speed: (diff) => {
    if (diff > 20) return 'Increased speed for high-flow materials';
    if (diff < -20) return 'Reduced speed for better quality or challenging materials';
    return null;
  },
};

export function ProfileComparisonView({ profile, defaultProfile }: ProfileComparisonViewProps) {
  const getDiff = (key: keyof ProfileData) => {
    const current = profile[key] as number;
    const def = defaultProfile[key] as number | undefined;
    if (def === undefined) return null;
    return current - def;
  };

  const formatValue = (value: number, row: ComparisonRow) => {
    if (row.format) return row.format(value);
    return value;
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b border-border">
        <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted-foreground">
          <span>Setting</span>
          <span className="text-center">Default</span>
          <span className="text-center">This Profile</span>
          <span className="text-center">Difference</span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {COMPARISON_ROWS.map((row) => {
          const currentValue = profile[row.key] as number;
          const defaultValue = defaultProfile[row.key] as number | undefined;
          const diff = getDiff(row.key);
          const explanation = diff !== null && row.key in CHANGE_EXPLANATIONS
            ? CHANGE_EXPLANATIONS[row.key]?.(diff)
            : null;

          const hasChange = diff !== null && Math.abs(diff) > 0.01;
          const isSignificant = diff !== null && (
            (row.key === 'nozzle_temp' && Math.abs(diff) >= 10) ||
            (row.key === 'fan_max_speed' && Math.abs(diff) >= 20) ||
            (row.key !== 'nozzle_temp' && row.key !== 'fan_max_speed' && Math.abs(diff) >= 5)
          );

          return (
            <div key={row.key} className={cn(
              "px-4 py-2.5",
              hasChange && "bg-muted/20"
            )}>
              <div className="grid grid-cols-4 gap-4 items-center">
                <span className="text-sm">{row.label}</span>
                
                <span className="text-sm text-center text-muted-foreground">
                  {defaultValue !== undefined ? `${formatValue(defaultValue, row)}${row.unit}` : '—'}
                </span>
                
                <span className={cn(
                  "text-sm text-center font-medium",
                  hasChange ? "text-primary" : "text-foreground"
                )}>
                  {formatValue(currentValue, row)}{row.unit}
                </span>
                
                <div className="flex items-center justify-center gap-1">
                  {diff === null || Math.abs(diff) < 0.01 ? (
                    <span className="text-muted-foreground">
                      <Minus className="w-4 h-4" />
                    </span>
                  ) : diff > 0 ? (
                    <span className={cn(
                      "flex items-center gap-0.5 text-sm",
                      isSignificant ? "text-amber-500" : "text-muted-foreground"
                    )}>
                      <ArrowUp className="w-3 h-3" />
                      +{formatValue(Math.abs(diff), row)}{row.unit}
                    </span>
                  ) : (
                    <span className={cn(
                      "flex items-center gap-0.5 text-sm",
                      isSignificant ? "text-cyan-500" : "text-muted-foreground"
                    )}>
                      <ArrowDown className="w-3 h-3" />
                      -{formatValue(Math.abs(diff), row)}{row.unit}
                    </span>
                  )}
                </div>
              </div>

              {explanation && (
                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                  {isSignificant ? (
                    <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Lightbulb className="w-3 h-3 text-cyan-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{explanation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
