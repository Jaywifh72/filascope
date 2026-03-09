import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Thermometer, 
  ArrowRight,
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
function SectionHeader({ icon: Icon, title, as: Tag = 'h2' }: { icon: React.ElementType; title: string; as?: 'h2' | 'h3' }) {
  return (
    <div className="section-header mb-4 sm:mb-6">
      <div className="section-header-icon">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <Tag className="section-title">{title}</Tag>
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
            <span className="text-sm italic font-mono text-gray-600">N/A</span>
            <span title="This specification hasn't been added yet"><HelpCircle size={10} className="text-gray-700" /></span>
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
  if (speed >= 800) return 'Very Fast';
  if (speed >= 500) return 'Fast';
  if (speed >= 200) return 'Medium';
  return 'Standard';
}

// Size category helper
function getSizeCategory(volumeLiters: number | null): string | null {
  if (!volumeLiters) return null;
  if (volumeLiters >= 20) return 'large-format';
  if (volumeLiters >= 8) return 'medium-format';
  return 'compact';
}

// Target user helper
function getTargetUser(printer: any): string | null {
  if (printer.target_user) return printer.target_user;
  const price = printer.current_price_usd || printer.msrp_usd;
  if (!price) return null;
  if (price < 300) return 'beginner-friendly';
  if (price <= 800) return 'hobbyist';
  return 'prosumer/professional';
}

// Generate quick verdict summary
function generateVerdictSummary(printer: any, volumeLiters: number | null, maxSpeed: number | null): string {
  const parts: string[] = [];
  
  const size = getSizeCategory(volumeLiters);
  if (size) parts.push(size);
  if (printer.has_enclosure) parts.push('enclosed');
  if (printer.multi_material_supported) {
    const spools = printer.multi_material_max_spools;
    parts.push(spools ? `${spools}-color multi-material` : 'multi-material');
  }

  const descriptor = parts.length > 0 ? `A ${parts.join(', ')} printer` : 'A 3D printer';

  const features: string[] = [];
  if (maxSpeed && maxSpeed >= 500) features.push('high-speed capabilities');
  if (printer.has_wifi) features.push('Wi-Fi connectivity');
  if (printer.has_enclosure && printer.active_chamber_heating) features.push('active chamber heating');

  const featureStr = features.length > 0 ? ` with ${features.join(' and ')}` : '';

  const target = getTargetUser(printer);
  const targetStr = target ? ` Best for ${target} users seeking versatility.` : '';

  return `${descriptor}${featureStr}.${targetStr}`;
}

// Generate verdict pills
function generateVerdictPills(printer: any, volumeLiters: number | null, maxSpeed: number | null): { emoji: string; label: string }[] {
  const pills: { emoji: string; label: string }[] = [];

  if (maxSpeed) {
    const label = maxSpeed >= 800 ? 'Very Fast' : maxSpeed >= 500 ? 'Fast' : maxSpeed >= 200 ? 'Medium' : 'Standard';
    if (maxSpeed >= 200) pills.push({ emoji: '⚡', label: `${label} (${maxSpeed}mm/s)` });
  }

  if (volumeLiters) {
    const size = parseFloat(String(volumeLiters)) >= 20 ? 'Large' : parseFloat(String(volumeLiters)) >= 8 ? 'Medium' : 'Compact';
    pills.push({ emoji: '📦', label: `${size} Build (${volumeLiters}L)` });
  }

  if (printer.multi_material_supported) {
    const spools = printer.multi_material_max_spools;
    pills.push({ emoji: '🎨', label: spools ? `${spools}-Color Multi-Material` : 'Multi-Material' });
  }

  if (printer.has_enclosure) {
    const heated = printer.active_chamber_heating;
    pills.push({ emoji: '🏠', label: heated ? 'Enclosed & Heated' : 'Enclosed Chamber' });
  }

  if (printer.auto_bed_leveling) {
    pills.push({ emoji: '📐', label: 'Auto Bed Leveling' });
  }

  return pills.slice(0, 4);
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
        : "bg-muted/30 border border-border/40 opacity-40"
    )}>
      <CheckCircle2 className={cn(
        "flex-shrink-0",
        available ? "h-4 w-4 text-primary" : "h-3.5 w-3.5 text-muted-foreground/40"
      )} />
      <span className={cn(
        "text-sm",
        available ? "text-white font-medium" : "text-gray-600 line-through"
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

  // Quick verdict data
  const verdictSummary = generateVerdictSummary(printer, volumeLiters ? parseFloat(volumeLiters) : null, maxSpeed);
  const verdictPills = generateVerdictPills(printer, volumeLiters ? parseFloat(volumeLiters) : null, maxSpeed);

  return (
    <div className="tab-content">
      {/* Quick Verdict */}
      <section className="mb-8 sm:mb-10">
        <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-5 border border-border/30">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-teal-400" />
            <h2 className="text-base font-semibold text-foreground">Quick Verdict</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            {verdictSummary}
          </p>
          {verdictPills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {verdictPills.map((pill) => (
                <span
                  key={pill.label}
                  className="inline-flex items-center gap-1 bg-muted/80 text-xs text-muted-foreground px-2.5 py-1 rounded-full border border-border/50"
                >
                  <span>{pill.emoji}</span>
                  <span>{pill.label}</span>
                </span>
              ))}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground/50 mt-2">Based on manufacturer specifications</p>
        </div>
      </section>

      {/* Build Volume Visualization */}
      <section className="mb-8 sm:mb-10">
        <SectionHeader icon={Ruler} title="Build Volume & Dimensions" as="h3" />
        <BuildVolumeCard
          width={printer.build_volume_x_mm}
          depth={printer.build_volume_y_mm}
          height={printer.build_volume_z_mm}
        />
      </section>

      {/* Speed and Temperature side by side on larger screens */}
      <section className="mb-8 sm:mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Print Speed Visualization */}
          <div>
            <SectionHeader icon={Zap} title="Print Speed" as="h3" />
            <SpeedGauge speed={maxSpeed} />
          </div>
          
          {/* Temperature Visualization */}
          <div>
            <SectionHeader icon={Thermometer} title="Temperature Range" as="h3" />
            <TemperatureGauge 
              maxNozzleTemp={nozzleMax} 
              maxBedTemp={bedMax} 
            />
          </div>
        </div>

        {/* Cross-link to filament catalog */}
        <div className="mt-4 flex justify-end">
          <Link
            to={`/filaments?printer=${encodeURIComponent(printer.model_name)}`}
            className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium"
          >
            View all compatible filaments
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* Key Specifications - Responsive grid: 1 col mobile, 2 col sm, 3 col lg */}
      <section className="mb-8 sm:mb-10">
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
      <section className="mb-8 sm:mb-10">
        <SectionHeader icon={CheckCircle2} title="System Capabilities" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {sortedCapabilities.map((cap) => (
            <CapabilityItem key={cap.label} label={cap.label} available={cap.available} />
          ))}
        </div>
      </section>

      {/* What's in the Box / Accessories - Only show when data exists */}
      {includedAccessories.length > 0 && (
        <section className="mb-8 sm:mb-10">
          <SectionHeader icon={Package} title="What's in the Box" />
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
        </section>
      )}
    </div>
  );
}
