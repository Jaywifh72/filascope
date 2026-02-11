import React from 'react';
import { 
  Box, 
  Thermometer, 
  Gauge, 
  Wifi, 
  Layers,
  Scale,
  CheckCircle2,
  Package,
  AlertCircle,
  Ruler,
  Zap,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BuildVolumeCard } from '@/components/printer/BuildVolumeCard';
import { SpeedGauge } from '@/components/printer/SpeedGauge';
import { TemperatureGauge } from '@/components/printer/TemperatureGauge';

interface OverviewTabContentProps {
  printer: any;
  brand: string | null;
  accessories?: any[];
  activityStats?: {
    views_24h?: number;
    comparisons_7d?: number;
    buy_clicks_7d?: number;
  };
}

// Section header with icon and border
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="section-header">
      <div className="section-header-icon">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="section-title">{title}</h3>
    </div>
  );
}

// Stat card component for Key Specifications
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
}

function StatCard({ icon: Icon, label, value, subValue }: StatCardProps) {
  const isNA = value === 'N/A';
  return (
    <div className="stat-card">
      <div className="section-header-icon">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-400">{label}</span>
        {isNA ? (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-sm italic font-mono text-gray-500">N/A</span>
            <span title="This specification hasn't been added yet"><HelpCircle size={12} className="text-gray-600" /></span>
          </div>
        ) : (
          <div className="text-base font-medium text-white leading-tight mt-1">{value}</div>
        )}
        {subValue && (
          <span className="text-xs text-gray-500 mt-0.5 block">{subValue}</span>
        )}
      </div>
    </div>
  );
}

// Speed label helper
function getSpeedLabel(speed: number): string {
  if (speed >= 500) return 'Fast';
  if (speed >= 200) return 'Medium';
  return 'Standard';
}

// Capability item component
interface CapabilityItemProps {
  label: string;
  available: boolean;
}

function CapabilityItem({ label, available }: CapabilityItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
      available 
        ? "bg-primary/10 border border-primary/20" 
        : "bg-muted/30 border border-border/40"
    )}>
      <CheckCircle2 className={cn(
        "h-4 w-4 flex-shrink-0",
        available ? "text-primary" : "text-muted-foreground/40"
      )} />
      <span className={cn(
        "text-sm",
        available ? "text-white font-medium" : "text-gray-500"
      )}>
        {label}
      </span>
    </div>
  );
}

export function OverviewTabContent({ printer, brand, accessories = [], activityStats }: OverviewTabContentProps) {
  // Calculate build volume
  const hasVolume = printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm;
  const volumeLiters = hasVolume 
    ? ((printer.build_volume_x_mm * printer.build_volume_y_mm * printer.build_volume_z_mm) / 1000000).toFixed(1)
    : null;
  const volumeDimensions = hasVolume
    ? `${printer.build_volume_x_mm} × ${printer.build_volume_y_mm} × ${printer.build_volume_z_mm} mm`
    : 'N/A';

  // Machine size
  const hasMachineSize = printer.machine_footprint_x_mm && printer.machine_footprint_y_mm && printer.machine_footprint_z_mm;
  const machineFootprint = hasMachineSize
    ? `${printer.machine_footprint_x_mm} × ${printer.machine_footprint_y_mm} × ${printer.machine_footprint_z_mm} mm`
    : 'N/A';
  const machineWeight = printer.machine_weight_kg ? `${printer.machine_weight_kg} kg` : null;

  // Temperature range
  const nozzleMax = printer.max_nozzle_temp_c;
  const bedMax = printer.bed_max_temp_c;
  const tempRange = nozzleMax && bedMax 
    ? `${nozzleMax}°C / ${bedMax}°C`
    : nozzleMax 
      ? `${nozzleMax}°C nozzle`
      : 'N/A';

  // Connectivity features
  const hasWifi = printer.has_wifi;
  const hasUsb = printer.has_usb;
  const hasSdCard = printer.has_sd_card;
  const hasEthernet = printer.has_ethernet;
  
  const connectivityItems: string[] = [];
  if (hasWifi) connectivityItems.push('Wi-Fi');
  if (hasEthernet) connectivityItems.push('Ethernet');
  if (hasUsb) connectivityItems.push('USB');
  if (hasSdCard) connectivityItems.push('SD Card');
  const connectivityLabel = connectivityItems.length > 0 ? connectivityItems.join(', ') : 'N/A';

  // Multi-material
  const hasMultiMaterial = printer.multi_material_supported;
  const multiMaterialValue = hasMultiMaterial 
    ? `Yes (${printer.multi_material_max_spools || '?'} colors)`
    : 'No';

  // Speed
  const maxSpeed = printer.max_print_speed_mms;
  const speedValue = maxSpeed ? `${maxSpeed} mm/s` : 'N/A';
  const speedLabel = maxSpeed ? getSpeedLabel(maxSpeed) : undefined;

  // System capabilities list
  const capabilities = [
    { label: 'Auto Bed Leveling', available: !!printer.auto_bed_leveling },
    { label: 'Multi-Color Printing', available: !!printer.multi_material_supported },
    { label: 'Heated Bed', available: !!printer.bed_heated },
    { label: 'Wi-Fi Connected', available: !!printer.has_wifi },
    { label: 'Enclosed Chamber', available: !!printer.has_enclosure },
    { label: 'Input Shaping', available: !!printer.input_shaping_supported },
    { label: 'Filament Runout Detection', available: !!printer.filament_runout_detection },
    { label: 'Power Loss Recovery', available: !!printer.power_loss_recovery },
    { label: 'AI Monitoring', available: !!printer.ai_spaghetti_detection },
    { label: 'Remote Monitoring', available: !!printer.remote_monitoring_supported },
  ];

  // Filter to show only available capabilities first, then unavailable
  const sortedCapabilities = [...capabilities].sort((a, b) => {
    if (a.available === b.available) return 0;
    return a.available ? -1 : 1;
  });

  // Accessories - filter to key included items
  const includedAccessories = accessories?.filter(acc => 
    acc.included_with_printer || acc.category === 'included'
  ).slice(0, 4) || [];

  return (
    <div className="tab-content">
      {/* Build Volume Visualization - Featured at top */}
      <section>
        <SectionHeader icon={Ruler} title="Build Volume & Dimensions" />
        <BuildVolumeCard
          width={printer.build_volume_x_mm}
          depth={printer.build_volume_y_mm}
          height={printer.build_volume_z_mm}
        />
      </section>

      {/* Speed and Temperature side by side on larger screens */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Print Speed Visualization */}
          <div>
            <SectionHeader icon={Zap} title="Print Speed" />
            <SpeedGauge speed={maxSpeed} />
          </div>
          
          {/* Temperature Visualization */}
          <div>
            <SectionHeader icon={Thermometer} title="Temperature Range" />
            <TemperatureGauge 
              maxNozzleTemp={nozzleMax} 
              maxBedTemp={bedMax} 
            />
          </div>
        </div>
      </section>

      {/* Key Specifications - Responsive grid: 1 col mobile, 2 col sm, 3 col lg */}
      <section>
        <SectionHeader icon={Box} title="Key Specifications" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            icon={Scale}
            label="Machine Size"
            value={hasMachineSize ? machineFootprint : 'N/A'}
            subValue={machineWeight || undefined}
          />
          <StatCard
            icon={Wifi}
            label="Connectivity"
            value={connectivityLabel}
          />
          <StatCard
            icon={Layers}
            label="Multi-Material"
            value={multiMaterialValue}
          />
        </div>
      </section>

      {/* System Capabilities - Responsive grid */}
      <section>
        <SectionHeader icon={CheckCircle2} title="System Capabilities" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {sortedCapabilities.map((cap) => (
            <CapabilityItem key={cap.label} label={cap.label} available={cap.available} />
          ))}
        </div>
      </section>

      {/* What's in the Box / Accessories - Responsive grid */}
      <section>
        <SectionHeader icon={Package} title="What's in the Box" />
        {includedAccessories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {includedAccessories.map((acc, idx) => (
              <div 
                key={acc.id || idx}
                className="flex items-center gap-3 p-6 bg-muted/30 border border-border/50 rounded-lg"
              >
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-base font-medium text-white">{acc.name || acc.accessory_name}</span>
                  {acc.quantity && acc.quantity > 1 && (
                    <Badge variant="secondary" className="ml-2 text-xs">×{acc.quantity}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 px-4 text-center border border-dashed border-gray-800 rounded-lg">
            <Package className="mx-auto mb-2 text-gray-600" size={32} />
            <p className="text-sm text-gray-500 font-mono">Accessory data coming soon</p>
            <p className="text-xs text-gray-600 mt-1 inline-flex items-center gap-1">
              Check the manufacturer's website for what's included
              <ExternalLink size={10} className="text-gray-600" />
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
