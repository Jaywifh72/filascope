import { Star, Award, Lightbulb } from 'lucide-react';
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

// Visual rating component with emojis
const VisualRating = ({ rating, emoji }: { rating: number; emoji: string }) => {
  return (
    <div 
      className="flex justify-center items-center gap-1 text-[28px] leading-none"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <span 
          key={index} 
          className={index < rating ? 'opacity-100' : 'opacity-20'}
          aria-hidden="true"
        >
          {emoji}
        </span>
      ))}
    </div>
  );
};

// Comparison badge component
const ComparisonBadge = ({ 
  text, 
  variant 
}: { 
  text: string; 
  variant: 'green' | 'gold' | 'blue' 
}) => {
  const variantStyles = {
    green: 'bg-green-500/15 border-green-500/30 text-green-500',
    gold: 'bg-amber-500/15 border-amber-500/30 text-amber-500',
    blue: 'bg-blue-500/15 border-blue-500/30 text-blue-500'
  };

  const icons = {
    green: <Star className="w-4 h-4" />,
    gold: <Award className="w-4 h-4" />,
    blue: <Lightbulb className="w-4 h-4" />
  };

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border text-[13px] font-semibold mt-auto ${variantStyles[variant]}`}
      role="status"
    >
      {icons[variant]}
      <span>{text}</span>
    </div>
  );
};

// Individual feature card
const FeatureCard = ({ data }: { data: FeatureCardData }) => {
  return (
    <div 
      className="bg-primary/[0.08] border-2 border-primary/30 rounded-2xl p-7 min-h-[280px] flex flex-col items-center text-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,217,217,0.2)] hover:border-primary/50 hover:bg-primary/[0.12] md:min-h-[280px] min-h-[260px] md:p-7 p-6"
      role="article"
      aria-label={`${data.category} feature: ${data.primaryValue}`}
    >
      {/* Category Header */}
      <div className="text-xs font-bold text-primary uppercase tracking-[0.08em] leading-none self-stretch">
        {data.category}
      </div>
      
      {/* Visual Rating */}
      <VisualRating rating={data.rating} emoji={data.emoji} />
      
      {/* Primary Value */}
      <div className="text-[32px] md:text-[32px] text-[28px] font-bold text-white leading-tight">
        {data.primaryValue}
      </div>
      
      {/* Context Text */}
      <p className="text-[15px] font-medium text-slate-300 leading-relaxed text-center max-w-[90%] m-0">
        {data.contextText}
      </p>
      
      {/* Comparison Badge */}
      <ComparisonBadge text={data.badgeText} variant={data.badgeVariant} />
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
    <section className="max-w-[1400px] mx-auto px-10 py-16 md:px-10 md:py-16 px-5 py-10">
      {/* Section Header */}
      <h2 className="text-base font-bold text-primary uppercase tracking-[0.08em] text-center mb-10">
        Standout Features
      </h2>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-6 gap-5">
        {cards.map((card, index) => (
          <FeatureCard key={index} data={card} />
        ))}
      </div>
    </section>
  );
}
