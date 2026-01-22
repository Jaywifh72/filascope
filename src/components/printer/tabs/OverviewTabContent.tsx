import React from 'react';
import { Star, Zap, Box, Thermometer, Layers, Shield, Gauge, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BuildVolumeVisualization from '../BuildVolumeVisualization';
import { FeatureHighlightCards } from '../FeatureHighlightCards';
import AdvantageCardsSection from '../AdvantageCardsSection';

interface OverviewTabContentProps {
  printer: any;
  brand: string | null;
  activityStats?: {
    views_24h?: number;
    comparisons_7d?: number;
    buy_clicks_7d?: number;
  };
}

export function OverviewTabContent({ printer, brand, activityStats }: OverviewTabContentProps) {
  // Generate key highlights based on printer capabilities
  const highlights: { icon: React.ElementType; label: string; value: string; highlight?: boolean }[] = [];

  if (printer.max_print_speed_mms) {
    highlights.push({
      icon: Gauge,
      label: "Max Speed",
      value: `${printer.max_print_speed_mms} mm/s`,
      highlight: printer.max_print_speed_mms >= 500
    });
  }

  if (printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm) {
    const volumeLiters = (printer.build_volume_x_mm * printer.build_volume_y_mm * printer.build_volume_z_mm) / 1000000;
    highlights.push({
      icon: Box,
      label: "Build Volume",
      value: `${volumeLiters.toFixed(1)}L`,
      highlight: volumeLiters > 20
    });
  }

  if (printer.max_nozzle_temp_c) {
    highlights.push({
      icon: Thermometer,
      label: "Max Nozzle Temp",
      value: `${printer.max_nozzle_temp_c}°C`,
      highlight: printer.max_nozzle_temp_c >= 300
    });
  }

  if (printer.multi_material_max_spools) {
    highlights.push({
      icon: Layers,
      label: "Multi-Material",
      value: `${printer.multi_material_max_spools} colors`,
      highlight: true
    });
  }

  if (printer.has_enclosure) {
    highlights.push({
      icon: Shield,
      label: "Enclosure",
      value: printer.enclosure_heated ? "Heated" : "Standard",
      highlight: printer.enclosure_heated
    });
  }

  if (printer.input_shaping_supported) {
    highlights.push({
      icon: Zap,
      label: "Input Shaping",
      value: "Supported",
      highlight: true
    });
  }

  return (
    <div className="space-y-8">
      {/* Key Highlights Grid */}
      {highlights.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className={`
                p-4 rounded-xl border transition-all
                ${item.highlight 
                  ? 'bg-primary/5 border-primary/30 shadow-sm' 
                  : 'bg-muted/30 border-border/50'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <item.icon className={`h-4 w-4 ${item.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <div className={`text-lg font-bold ${item.highlight ? 'text-primary' : 'text-foreground'}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Build Volume Visualization */}
      {printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" />
              Build Volume Visualization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BuildVolumeVisualization printer={printer} />
          </CardContent>
        </Card>
      )}

      {/* Feature Highlights */}
      <FeatureHighlightCards printer={printer} />

      {/* Advantage Cards */}
      <AdvantageCardsSection printer={printer} />

      {/* Quick Facts */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Quick Facts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {printer.printer_technology && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Technology</span>
                <Badge variant="secondary">{printer.printer_technology}</Badge>
              </div>
            )}
            {printer.target_user_segment && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Target User</span>
                <Badge variant="secondary">{printer.target_user_segment}</Badge>
              </div>
            )}
            {printer.price_tier && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Price Tier</span>
                <Badge variant="secondary" className="capitalize">{printer.price_tier}</Badge>
              </div>
            )}
            {printer.assembly_required !== null && printer.assembly_required !== undefined && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Assembly</span>
                <div className="flex items-center gap-2">
                  {printer.assembly_required ? (
                    <>
                      <span className="text-sm font-medium">Required</span>
                      {printer.average_assembly_time_min && (
                        <Badge variant="outline">{printer.average_assembly_time_min} min</Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Pre-assembled
                    </span>
                  )}
                </div>
              </div>
            )}
            {printer.release_date && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Release Date</span>
                <span className="text-sm font-medium">{printer.release_date}</span>
              </div>
            )}
            {printer.firmware_family && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Firmware</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{printer.firmware_family}</span>
                  {printer.firmware_open_source && (
                    <Badge variant="outline" className="text-xs">Open Source</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
