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
  // Define all feature cards with their benefits - Technical style
  const allFeatures: (FeatureCardData & { show: boolean })[] = [
    {
      key: 'enclosed',
      priority: 1,
      show: !!printer.has_enclosure,
      Icon: Shield,
      name: 'ENCLOSED',
      benefit: 'FUME_CONTAINMENT: ACTIVE // SAFETY: ENHANCED'
    },
    {
      key: 'autoLeveling',
      priority: 2,
      show: !!printer.auto_bed_leveling,
      Icon: Crosshair,
      name: 'AUTO_LEVEL',
      benefit: 'Z_OFFSET: AUTO // MESH_BED: ENABLED'
    },
    {
      key: 'multiColor',
      priority: 3,
      show: !!printer.multi_material_supported,
      Icon: Palette,
      name: 'MULTI_COLOR',
      benefit: `SPOOL_COUNT: ${printer.multi_material_max_spools || 4} // SWAP: AUTO`
    },
    {
      key: 'inputShaping',
      priority: 4,
      show: !!printer.input_shaping_supported,
      Icon: Zap,
      name: 'INPUT_SHAPING',
      benefit: 'RESONANCE_COMP: ACTIVE // GHOSTING: NULL'
    },
    {
      key: 'heatedBed',
      priority: 5,
      show: !!printer.bed_heated,
      Icon: Flame,
      name: 'HEATED_BED',
      benefit: 'MATERIALS: ABS_ASA_PA // ADHESION: OPTIMAL'
    },
    {
      key: 'wifi',
      priority: 6,
      show: !!printer.has_wifi,
      Icon: Wifi,
      name: 'WIRELESS',
      benefit: 'PROTOCOL: 802.11 // REMOTE_ACCESS: ENABLED'
    },
    {
      key: 'filamentSensor',
      priority: 7,
      show: !!printer.filament_runout_detection,
      Icon: ScanLine,
      name: 'RUNOUT_SENSOR',
      benefit: 'DETECTION: ACTIVE // AUTO_PAUSE: ENABLED'
    },
    {
      key: 'aiDetection',
      priority: 8,
      show: !!printer.ai_spaghetti_detection,
      Icon: Bot,
      name: 'AI_DETECTION',
      benefit: 'FAILURE_SCAN: ACTIVE // MODE: AUTONOMOUS'
    },
    {
      key: 'powerResume',
      priority: 9,
      show: !!printer.power_loss_recovery,
      Icon: BatteryCharging,
      name: 'POWER_RESUME',
      benefit: 'STATE_SAVE: ACTIVE // RECOVERY: AUTO'
    },
    {
      key: 'quiet',
      priority: 10,
      show: (printer.noise_level_printing_db ?? 100) <= 55,
      Icon: VolumeX,
      name: 'SILENT_MODE',
      benefit: 'NOISE_LEVEL: LOW // ENV: OFFICE_SAFE'
    },
    {
      key: 'remoteMonitoring',
      priority: 11,
      show: !!printer.remote_monitoring_supported,
      Icon: Camera,
      name: 'MONITORING',
      benefit: 'STREAM: ACTIVE // REMOTE_VIEW: ENABLED'
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
    <section 
      className="max-w-[1400px] mx-auto px-5 md:px-10 py-8 md:py-10"
      aria-label="System capabilities"
    >
      <h3 className="font-mono text-xs text-primary uppercase tracking-[0.2em] text-center mb-6">
        {">> "}SYSTEM_CAPABILITIES
      </h3>
      
      <div 
        className={`grid gap-4 ${
          cardsToDisplay.length === 4 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' 
            : cardsToDisplay.length === 3
            ? 'grid-cols-1 md:grid-cols-3'
            : cardsToDisplay.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1'
        }`}
      >
        {cardsToDisplay.map((card) => {
          const IconComponent = card.Icon;
          return (
            <div
              key={card.key}
              className="relative bg-[#0A0C10] border border-primary/10 p-4 h-[140px] md:h-[150px]
                         flex flex-col items-center justify-center text-center gap-2.5
                         transition-all duration-200 cursor-default
                         hover:border-primary/30 hover:bg-primary/[0.02]"
              aria-label={`${card.name}: ${card.benefit}`}
            >
              {/* Corner brackets - smaller for compact cards */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/30" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/30" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/30" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/30" />
              
              {/* Lucide Icon */}
              <IconComponent className="w-6 h-6 text-primary" strokeWidth={1.5} />
              
              {/* Feature Name */}
              <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-wider">
                {">> "}{card.name}
              </span>
              
              {/* Benefit Text - Technical */}
              <span className="font-mono text-[10px] text-muted-foreground leading-snug tracking-wide">
                {card.benefit}
              </span>
              
              {/* Status Indicator */}
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="font-mono text-[9px] text-green-400 uppercase tracking-wider">
                  ACTIVE
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AdvantageCardsSection;
