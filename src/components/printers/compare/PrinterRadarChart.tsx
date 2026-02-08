import { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";
import type { Database } from "@/integrations/supabase/types";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

interface PrinterRadarChartProps {
  printers: Printer[];
}

// Normalize a value to 0-100 scale
function normalize(value: number | null, min: number, max: number): number {
  if (value === null || value === undefined) return 0;
  if (max === min) return 50;
  return Math.round(((value - min) / (max - min)) * 100);
}

const RADAR_COLORS = [
  "hsl(var(--primary))",
  "#f59e0b",
  "#10b981",
  "#ef4444",
];

export function PrinterRadarChart({ printers }: PrinterRadarChartProps) {
  const data = useMemo(() => {
    if (printers.length === 0) return [];

    // Calculate ranges for normalization
    const volumes = printers.map(p => {
      const x = p.build_volume_x_mm || 0;
      const y = p.build_volume_y_mm || 0;
      const z = p.build_volume_z_mm || 0;
      return x * y * z;
    });
    const speeds = printers.map(p => p.max_print_speed_mms || 0);
    const prices = printers.map(p => p.current_price_usd_store || p.current_price_usd_amazon || p.msrp_usd || 0);
    const temps = printers.map(p => p.max_nozzle_temp_c || 0);

    // Feature count
    const featureCounts = printers.map(p => {
      let count = 0;
      if (p.has_enclosure) count++;
      if (p.multi_material_supported) count++;
      if (p.auto_bed_leveling) count++;
      if (p.has_wifi) count++;
      if (p.remote_monitoring_supported) count++;
      if (p.power_loss_recovery) count++;
      if (p.filament_runout_detection) count++;
      if (p.ai_spaghetti_detection) count++;
      return count;
    });

    // Quality approximation from ratings
    const qualities = printers.map(p => p.rating_print_quality || p.rating_community_overall || 0);

    const axes = [
      {
        axis: "Build Volume",
        ...Object.fromEntries(printers.map((p, i) => [
          `printer_${i}`,
          normalize(volumes[i], Math.min(...volumes), Math.max(...volumes))
        ])),
      },
      {
        axis: "Speed",
        ...Object.fromEntries(printers.map((p, i) => [
          `printer_${i}`,
          normalize(speeds[i], 0, Math.max(...speeds))
        ])),
      },
      {
        axis: "Feature Set",
        ...Object.fromEntries(printers.map((p, i) => [
          `printer_${i}`,
          normalize(featureCounts[i], 0, Math.max(...featureCounts))
        ])),
      },
      {
        axis: "Value",
        ...Object.fromEntries(printers.map((p, i) => {
          // Value = inverse of price (cheaper = higher value), combined with features
          const maxPrice = Math.max(...prices.filter(p => p > 0));
          const valueScore = prices[i] > 0 ? normalize(maxPrice - prices[i], 0, maxPrice) : 0;
          return [`printer_${i}`, valueScore];
        })),
      },
      {
        axis: "Print Quality",
        ...Object.fromEntries(printers.map((p, i) => {
          // Use temp range as proxy if no rating
          const score = qualities[i] > 0
            ? qualities[i] * 20  // Rating is 1-5, scale to 0-100
            : normalize(temps[i], 180, 500);
          return [`printer_${i}`, Math.min(score, 100)];
        })),
      },
    ];

    return axes;
  }, [printers]);

  if (printers.length === 0) return null;

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          {printers.map((printer, i) => (
            <Radar
              key={printer.id}
              name={`${printer.brand?.brand || ""} ${printer.model_name}`.trim()}
              dataKey={`printer_${i}`}
              stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
              fill={RADAR_COLORS[i % RADAR_COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: 12, color: "hsl(var(--foreground))" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
