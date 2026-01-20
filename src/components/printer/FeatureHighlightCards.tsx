import { generateFeatureCards, FeatureCardData } from '@/lib/printerRatingGenerator';

interface FeatureHighlightCardsProps {
  printer: {
    max_print_speed_mms?: number | null;
    build_volume_x_mm?: number | null;
    build_volume_y_mm?: number | null;
    build_volume_z_mm?: number | null;
    multi_material_supported?: boolean | null;
    multi_material_max_spools?: number | null;
    native_multi_material_system?: boolean | null;
    max_nozzle_temp_c?: number | null;
    has_enclosure?: boolean | null;
    enclosure_heated?: boolean | null;
  };
}

// Terminal-style progress bar visualizer
const ProgressBarRating = ({ rating }: { rating: number }) => {
  const filledBlocks = rating;
  const emptyBlocks = 5 - rating;
  
  return (
    <div className="flex items-center gap-3 font-mono">
      <div className="flex items-center gap-0.5">
        {/* Filled blocks */}
        {Array.from({ length: filledBlocks }).map((_, i) => (
          <div 
            key={`filled-${i}`}
            className="w-5 h-3 bg-primary"
          />
        ))}
        {/* Empty blocks */}
        {Array.from({ length: emptyBlocks }).map((_, i) => (
          <div 
            key={`empty-${i}`}
            className="w-5 h-3 bg-white/10"
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        LEVEL: {rating}/5
      </span>
    </div>
  );
};

// Terminal status badge component
const StatusBadge = ({ 
  text, 
  variant 
}: { 
  text: string; 
  variant: 'green' | 'gold' | 'blue' 
}) => {
  const variantStyles = {
    green: 'border-green-500/40 text-green-400',
    gold: 'border-amber-500/40 text-amber-400',
    blue: 'border-primary/40 text-primary'
  };

  return (
    <div 
      className={`font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 border bg-[#0A0C10] mt-auto ${variantStyles[variant]}`}
    >
      [{text}]
    </div>
  );
};

// Individual feature card with terminal styling
const FeatureCard = ({ data }: { data: FeatureCardData }) => {
  return (
    <div 
      className="relative bg-[#0A0C10] border border-primary/20 p-6 min-h-[280px] flex flex-col items-center text-center gap-4 transition-all duration-300 hover:border-primary/40 hover:bg-primary/[0.02] group"
      role="article"
      aria-label={`${data.category} analysis: ${data.primaryValue}`}
    >
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary/50" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/50" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary/50" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary/50" />
      
      {/* Category Header */}
      <div className="font-mono text-[11px] text-primary uppercase tracking-[0.15em] self-stretch">
        {">> "}{data.categoryKey}
      </div>
      
      {/* Progress Bar Rating */}
      <ProgressBarRating rating={data.rating} />
      
      {/* Primary Value */}
      <div className="font-mono text-2xl md:text-3xl font-bold text-white leading-tight">
        {data.primaryValue}
      </div>
      
      {/* Context Text - Technical style */}
      <p className="font-mono text-[11px] text-muted-foreground leading-relaxed text-center tracking-wide">
        {data.contextText}
      </p>
      
      {/* Status Badge */}
      <StatusBadge text={data.badgeText} variant={data.badgeVariant} />
    </div>
  );
};

export function FeatureHighlightCards({ printer }: FeatureHighlightCardsProps) {
  // Map printer data to rating generator format
  const ratingData = {
    maxSpeed: printer.max_print_speed_mms,
    buildVolume: {
      x: printer.build_volume_x_mm,
      y: printer.build_volume_y_mm,
      z: printer.build_volume_z_mm
    },
    multiMaterialSupported: printer.multi_material_supported,
    multiMaterialMaxSpools: printer.multi_material_max_spools,
    hasAMS: printer.native_multi_material_system,
    maxNozzleTemp: printer.max_nozzle_temp_c,
    hasEnclosure: printer.has_enclosure,
    enclosureHeated: printer.enclosure_heated
  };

  const cards = generateFeatureCards(ratingData);

  return (
    <section className="max-w-[1400px] mx-auto px-5 md:px-10 py-10 md:py-16">
      {/* Section Header */}
      <h2 className="font-mono text-xs text-primary uppercase tracking-[0.2em] text-center mb-8">
        {">> "}PERFORMANCE_ANALYSIS
      </h2>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {cards.map((card, index) => (
          <FeatureCard key={index} data={card} />
        ))}
      </div>
    </section>
  );
}
