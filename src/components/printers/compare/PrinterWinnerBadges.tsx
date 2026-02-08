import { useMemo } from "react";
import { Trophy, DollarSign, Box, Gauge, Thermometer, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

interface WinnerBadge {
  category: string;
  icon: React.ReactNode;
  winnerId: string;
  winnerName: string;
  value: string;
}

interface PrinterWinnerBadgesProps {
  printers: Printer[];
}

export function PrinterWinnerBadges({ printers }: PrinterWinnerBadgesProps) {
  const winners = useMemo((): WinnerBadge[] => {
    if (printers.length < 2) return [];

    const badges: WinnerBadge[] = [];
    const getName = (p: Printer) => `${p.brand?.brand || ""} ${p.model_name}`.trim();
    const getPrice = (p: Printer) => p.current_price_usd_store || p.current_price_usd_amazon || p.msrp_usd;
    const getVolume = (p: Printer) => {
      const x = p.build_volume_x_mm || 0;
      const y = p.build_volume_y_mm || 0;
      const z = p.build_volume_z_mm || 0;
      return x * y * z;
    };

    // Cheapest
    const withPrice = printers.filter(p => getPrice(p) !== null && getPrice(p)! > 0);
    if (withPrice.length >= 2) {
      const cheapest = withPrice.reduce((a, b) => (getPrice(a)! < getPrice(b)! ? a : b));
      badges.push({
        category: "Cheapest",
        icon: <DollarSign className="w-4 h-4" />,
        winnerId: cheapest.id,
        winnerName: getName(cheapest),
        value: `$${getPrice(cheapest)?.toFixed(0)}`,
      });
    }

    // Largest Build Volume
    const withVolume = printers.filter(p => getVolume(p) > 0);
    if (withVolume.length >= 2) {
      const largest = withVolume.reduce((a, b) => (getVolume(a) > getVolume(b) ? a : b));
      const volumeL = (getVolume(largest) / 1000000).toFixed(1);
      badges.push({
        category: "Largest Volume",
        icon: <Box className="w-4 h-4" />,
        winnerId: largest.id,
        winnerName: getName(largest),
        value: `${volumeL}L`,
      });
    }

    // Fastest
    const withSpeed = printers.filter(p => (p.max_print_speed_mms || 0) > 0);
    if (withSpeed.length >= 2) {
      const fastest = withSpeed.reduce((a, b) =>
        (a.max_print_speed_mms || 0) > (b.max_print_speed_mms || 0) ? a : b
      );
      badges.push({
        category: "Fastest",
        icon: <Gauge className="w-4 h-4" />,
        winnerId: fastest.id,
        winnerName: getName(fastest),
        value: `${fastest.max_print_speed_mms}mm/s`,
      });
    }

    // Highest Temp
    const withTemp = printers.filter(p => (p.max_nozzle_temp_c || 0) > 0);
    if (withTemp.length >= 2) {
      const hottest = withTemp.reduce((a, b) =>
        (a.max_nozzle_temp_c || 0) > (b.max_nozzle_temp_c || 0) ? a : b
      );
      badges.push({
        category: "Hottest Nozzle",
        icon: <Thermometer className="w-4 h-4" />,
        winnerId: hottest.id,
        winnerName: getName(hottest),
        value: `${hottest.max_nozzle_temp_c}°C`,
      });
    }

    // Most Features
    const featureCount = (p: Printer) => {
      let c = 0;
      if (p.has_enclosure) c++;
      if (p.multi_material_supported) c++;
      if (p.auto_bed_leveling) c++;
      if (p.has_wifi) c++;
      if (p.remote_monitoring_supported) c++;
      if (p.power_loss_recovery) c++;
      if (p.filament_runout_detection) c++;
      return c;
    };
    const withFeatures = printers.filter(p => featureCount(p) > 0);
    if (withFeatures.length >= 2) {
      const mostFeatures = withFeatures.reduce((a, b) => featureCount(a) > featureCount(b) ? a : b);
      badges.push({
        category: "Most Features",
        icon: <Layers className="w-4 h-4" />,
        winnerId: mostFeatures.id,
        winnerName: getName(mostFeatures),
        value: `${featureCount(mostFeatures)} features`,
      });
    }

    return badges;
  }, [printers]);

  if (winners.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {winners.map((badge) => (
        <div
          key={badge.category}
          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-primary">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">{badge.category}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {badge.icon}
            <span className="text-sm font-bold text-foreground">{badge.value}</span>
          </div>
          <span className="text-xs text-muted-foreground text-center line-clamp-1">{badge.winnerName}</span>
        </div>
      ))}
    </div>
  );
}
