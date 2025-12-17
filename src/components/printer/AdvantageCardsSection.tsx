import React from 'react';

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
  emoji: string;
  name: string;
  benefit: string;
  priority: number;
}

const AdvantageCardsSection: React.FC<AdvantageCardsSectionProps> = ({ printer }) => {
  // Define all feature cards with their benefits
  const allFeatures: (FeatureCardData & { show: boolean })[] = [
    {
      key: 'enclosed',
      priority: 1,
      show: !!printer.has_enclosure,
      emoji: '🏠',
      name: 'ENCLOSED',
      benefit: 'Safer for home use & smells contained'
    },
    {
      key: 'autoLeveling',
      priority: 2,
      show: !!printer.auto_bed_leveling,
      emoji: '🎯',
      name: 'AUTO-LEVEL',
      benefit: 'Perfect first layer every time'
    },
    {
      key: 'multiColor',
      priority: 3,
      show: !!printer.multi_material_supported,
      emoji: '🎨',
      name: 'MULTI-COLOR',
      benefit: `${printer.multi_material_max_spools || 4} colors • no manual swaps`
    },
    {
      key: 'inputShaping',
      priority: 4,
      show: !!printer.input_shaping_supported,
      emoji: '⚡',
      name: 'INPUT SHAPING',
      benefit: 'Eliminates ghosting at high speeds'
    },
    {
      key: 'heatedBed',
      priority: 5,
      show: !!printer.bed_heated,
      emoji: '🔥',
      name: 'HEATED BED',
      benefit: 'Print ABS & engineering materials'
    },
    {
      key: 'wifi',
      priority: 6,
      show: !!printer.has_wifi,
      emoji: '📱',
      name: 'WI-FI',
      benefit: 'Print from anywhere in your home'
    },
    {
      key: 'filamentSensor',
      priority: 7,
      show: !!printer.filament_runout_detection,
      emoji: '🔍',
      name: 'FILAMENT SENSOR',
      benefit: 'Never ruin a print again'
    },
    {
      key: 'aiDetection',
      priority: 8,
      show: !!printer.ai_spaghetti_detection,
      emoji: '🤖',
      name: 'AI DETECTION',
      benefit: 'Automatic failure detection'
    },
    {
      key: 'powerResume',
      priority: 9,
      show: !!printer.power_loss_recovery,
      emoji: '🔋',
      name: 'POWER RESUME',
      benefit: 'Continues after power outage'
    },
    {
      key: 'quiet',
      priority: 10,
      show: (printer.noise_level_printing_db ?? 100) <= 55,
      emoji: '🔇',
      name: 'QUIET',
      benefit: 'Office-friendly noise levels'
    },
    {
      key: 'remoteMonitoring',
      priority: 11,
      show: !!printer.remote_monitoring_supported,
      emoji: '📷',
      name: 'CAMERA',
      benefit: 'Monitor prints remotely'
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
      className="max-w-[1400px] mx-auto px-10 py-10 md:px-10 md:py-10"
      aria-label="Key printer features"
    >
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider text-center mb-6">
        Key Features
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
        {cardsToDisplay.map((card) => (
          <div
            key={card.key}
            className="bg-white/5 border border-white/10 rounded-[10px] p-4 h-[140px] md:h-[140px] min-h-[120px]
                       flex flex-col items-center justify-center text-center gap-2.5
                       transition-all duration-200 cursor-default
                       hover:bg-white/[0.08] hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-lg"
            aria-label={`${card.name}: ${card.benefit}`}
          >
            {/* Emoji Icon */}
            <span className="text-[32px] leading-none" aria-hidden="true">
              {card.emoji}
            </span>
            
            {/* Feature Name */}
            <span className="text-xs font-bold text-primary uppercase tracking-wide">
              {card.name}
            </span>
            
            {/* Benefit Text */}
            <span className="text-[13px] font-medium text-muted-foreground leading-snug line-clamp-2">
              {card.benefit}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdvantageCardsSection;
