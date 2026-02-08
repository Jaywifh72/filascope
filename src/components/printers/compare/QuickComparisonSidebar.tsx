import { useMemo } from "react";
import { ArrowUp, ArrowDown, Minus, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

interface QuickComparisonSidebarProps {
  printers: Printer[];
}

interface DiffItem {
  label: string;
  values: { printerId: string; name: string; value: number | null; formatted: string }[];
  lowerIsBetter?: boolean;
}

export function QuickComparisonSidebar({ printers }: QuickComparisonSidebarProps) {
  const diffs = useMemo((): DiffItem[] => {
    if (printers.length < 2) return [];

    const getName = (p: Printer) => `${p.brand?.brand || ""} ${p.model_name}`.trim();
    const getPrice = (p: Printer) => p.current_price_usd_store || p.current_price_usd_amazon || p.msrp_usd || null;
    const getVolume = (p: Printer) => {
      const x = p.build_volume_x_mm || 0;
      const y = p.build_volume_y_mm || 0;
      const z = p.build_volume_z_mm || 0;
      return x * y * z > 0 ? Math.round((x * y * z) / 1000) : null; // cm³
    };

    return [
      {
        label: "Price",
        lowerIsBetter: true,
        values: printers.map(p => ({
          printerId: p.id,
          name: getName(p),
          value: getPrice(p),
          formatted: getPrice(p) ? `$${getPrice(p)!.toFixed(0)}` : "N/A",
        })),
      },
      {
        label: "Build Volume",
        values: printers.map(p => ({
          printerId: p.id,
          name: getName(p),
          value: getVolume(p),
          formatted: getVolume(p) ? `${getVolume(p)!.toLocaleString()} cm³` : "N/A",
        })),
      },
      {
        label: "Max Speed",
        values: printers.map(p => ({
          printerId: p.id,
          name: getName(p),
          value: p.max_print_speed_mms,
          formatted: p.max_print_speed_mms ? `${p.max_print_speed_mms} mm/s` : "N/A",
        })),
      },
      {
        label: "Nozzle Temp",
        values: printers.map(p => ({
          printerId: p.id,
          name: getName(p),
          value: p.max_nozzle_temp_c,
          formatted: p.max_nozzle_temp_c ? `${p.max_nozzle_temp_c}°C` : "N/A",
        })),
      },
      {
        label: "Features",
        values: printers.map(p => {
          let c = 0;
          if (p.has_enclosure) c++;
          if (p.multi_material_supported) c++;
          if (p.auto_bed_leveling) c++;
          if (p.has_wifi) c++;
          if (p.remote_monitoring_supported) c++;
          if (p.power_loss_recovery) c++;
          if (p.filament_runout_detection) c++;
          return {
            printerId: p.id,
            name: getName(p),
            value: c,
            formatted: `${c} features`,
          };
        }),
      },
    ];
  }, [printers]);

  if (diffs.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
        <Trophy className="w-4 h-4" />
        Quick Comparison
      </h3>

      <div className="space-y-3">
        {diffs.map((diff) => {
          const validValues = diff.values.filter(v => v.value !== null).map(v => v.value!);
          const bestValue = diff.lowerIsBetter
            ? Math.min(...validValues)
            : Math.max(...validValues);

          return (
            <div key={diff.label} className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">{diff.label}</span>
              <div className="space-y-1">
                {diff.values.map((v) => {
                  const isBest = v.value !== null && v.value === bestValue && validValues.length > 1;
                  const isWorst = v.value !== null && v.value !== bestValue && validValues.length > 1;

                  return (
                    <div
                      key={v.printerId}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs",
                        isBest && "bg-emerald-500/10 border border-emerald-500/30",
                        isWorst && "bg-destructive/5 border border-destructive/20",
                        !isBest && !isWorst && "bg-muted/20 border border-border/30"
                      )}
                    >
                      <span className="truncate flex-1 font-medium">{v.name}</span>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <span className={cn(
                          "font-bold",
                          isBest && "text-emerald-500",
                          isWorst && "text-destructive/70"
                        )}>
                          {v.formatted}
                        </span>
                        {isBest && <ArrowUp className="w-3 h-3 text-emerald-500" />}
                        {isWorst && <ArrowDown className="w-3 h-3 text-destructive/70" />}
                        {!isBest && !isWorst && v.value !== null && <Minus className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
