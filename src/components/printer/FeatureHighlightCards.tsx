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

// Modern progress bar visualizer
const ProgressBarRating = ({ rating }: { rating: number }) => {
  const filledBlocks = rating;
  const emptyBlocks = 5 - rating;
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5">
        {/* Filled blocks */}
        {Array.from({ length: filledBlocks }).map((_, i) => (
          <div 
            key={`filled-${i}`}
            className="w-5 h-2.5 bg-primary rounded-sm"
          />
        ))}
        {/* Empty blocks */}
        {Array.from({ length: emptyBlocks }).map((_, i) => (
          <div 
            key={`empty-${i}`}
            className="w-5 h-2.5 bg-muted rounded-sm"
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {rating}/5
      </span>
    </div>
  );
};

// Status badge component
const StatusBadge = ({ 
  text, 
  variant 
}: { 
  text: string; 
  variant: 'green' | 'gold' | 'blue' 
}) => {
  const variantStyles = {
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    gold: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    blue: 'bg-primary/10 text-primary border-primary/20'
  };

  return (
    <div 
      className={`text-[11px] font-medium uppercase tracking-wide px-3 py-1.5 rounded-full border mt-auto ${variantStyles[variant]}`}
    >
      {text}
    </div>
  );
};

// Individual feature card with clean modern styling
const FeatureCard = ({ data }: { data: FeatureCardData }) => {
  return (
    <div 
      className="relative bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 min-h-[240px] flex flex-col items-center text-center gap-3 transition-all duration-300 hover:border-primary/30 hover:bg-card/80 group"
      role="article"
      aria-label={`${data.category} analysis: ${data.primaryValue}`}
    >
      {/* Category Header */}
      <div className="text-xs font-medium text-primary uppercase tracking-wide">
        {data.category}
      </div>
      
      {/* Progress Bar Rating */}
      <ProgressBarRating rating={data.rating} />
      
      {/* Primary Value */}
      <div className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
        {data.primaryValue}
      </div>
      
      {/* Context Text */}
      <p className="text-xs text-muted-foreground leading-relaxed text-center">
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <FeatureCard key={index} data={card} />
      ))}
    </div>
  );
}
