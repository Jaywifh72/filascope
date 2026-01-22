import React from 'react';
import { 
  Shield, 
  Crosshair, 
  Palette, 
  Zap, 
  Flame, 
  Wifi, 
  ScanLine, 
  Bot, 
  BatteryCharging, 
  VolumeX, 
  Camera,
  type LucideIcon
} from 'lucide-react';

interface AdvantageCardsSectionProps {
  printer: {
    has_enclosure?: boolean | null;
    auto_bed_leveling?: boolean | null;
    input_shaping_supported?: boolean | null;
    multi_material_supported?: boolean | null;
    multi_material_max_spools?: number | null;
    bed_heated?: boolean | null;
    has_wifi?: boolean | null;
    filament_runout_detection?: boolean | null;
    ai_spaghetti_detection?: boolean | null;
    noise_level_printing_db?: number | null;
    power_loss_recovery?: boolean | null;
    remote_monitoring_supported?: boolean | null;
  };
}

interface FeatureCardData {
  key: string;
  Icon: LucideIcon;
  name: string;
  benefit: string;
  priority: number;
}

const AdvantageCardsSection: React.FC<AdvantageCardsSectionProps> = ({ printer }) => {
  // Define all feature cards with their benefits - Clean style
  const allFeatures: (FeatureCardData & { show: boolean })[] = [
    {
      key: 'enclosed',
      priority: 1,
      show: !!printer.has_enclosure,
      Icon: Shield,
      name: 'Enclosed Chamber',
      benefit: 'Temperature control for engineering materials'
    },
    {
      key: 'autoLeveling',
      priority: 2,
      show: !!printer.auto_bed_leveling,
      Icon: Crosshair,
      name: 'Auto Bed Leveling',
      benefit: 'Automatic first layer calibration'
    },
    {
      key: 'multiColor',
      priority: 3,
      show: !!printer.multi_material_supported,
      Icon: Palette,
      name: 'Multi-Color',
      benefit: `Up to ${printer.multi_material_max_spools || 4} colors in one print`
    },
    {
      key: 'inputShaping',
      priority: 4,
      show: !!printer.input_shaping_supported,
      Icon: Zap,
      name: 'Input Shaping',
      benefit: 'Reduces ghosting at high speeds'
    },
    {
      key: 'heatedBed',
      priority: 5,
      show: !!printer.bed_heated,
      Icon: Flame,
      name: 'Heated Bed',
      benefit: 'Print ABS, ASA, and nylon materials'
    },
    {
      key: 'wifi',
      priority: 6,
      show: !!printer.has_wifi,
      Icon: Wifi,
      name: 'Wi-Fi Connected',
      benefit: 'Remote print management'
    },
    {
      key: 'filamentSensor',
      priority: 7,
      show: !!printer.filament_runout_detection,
      Icon: ScanLine,
      name: 'Runout Detection',
      benefit: 'Auto-pause when filament runs out'
    },
    {
      key: 'aiDetection',
      priority: 8,
      show: !!printer.ai_spaghetti_detection,
      Icon: Bot,
      name: 'AI Monitoring',
      benefit: 'Detects and stops failed prints'
    },
    {
      key: 'powerResume',
      priority: 9,
      show: !!printer.power_loss_recovery,
      Icon: BatteryCharging,
      name: 'Power Resume',
      benefit: 'Continues after power outage'
    },
    {
      key: 'quiet',
      priority: 10,
      show: (printer.noise_level_printing_db ?? 100) <= 55,
      Icon: VolumeX,
      name: 'Silent Operation',
      benefit: 'Office and home friendly'
    },
    {
      key: 'remoteMonitoring',
      priority: 11,
      show: !!printer.remote_monitoring_supported,
      Icon: Camera,
      name: 'Remote Monitoring',
      benefit: 'Watch prints from anywhere'
    }
  ];

  // Get top 4 features that are available, sorted by priority
  const cardsToDisplay = allFeatures
    .filter(f => f.show)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4);

  // Don't render if no features available
  if (cardsToDisplay.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {cardsToDisplay.map((card) => {
        const IconComponent = card.Icon;
        return (
          <div
            key={card.key}
            className="bg-muted/40 border border-border/60 rounded-lg px-4 py-2.5 flex items-center gap-3 transition-all duration-200 hover:border-primary/30 hover:bg-muted/50"
            aria-label={`${card.name}: ${card.benefit}`}
          >
            <IconComponent className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={1.5} />
            <span className="text-sm text-foreground">
              <span className="font-medium">{card.name}</span>
              <span className="text-muted-foreground ml-1.5">— {card.benefit}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default AdvantageCardsSection;
