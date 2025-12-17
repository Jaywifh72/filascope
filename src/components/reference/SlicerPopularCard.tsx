import { Check, ArrowRight, Plus, Star } from 'lucide-react';
import { SlicerTierInfo, PriceType } from '@/lib/slicerTierData';
import { cn } from '@/lib/utils';

interface SlicerPopularCardProps {
  slicer: SlicerTierInfo;
  logo?: string;
  onLearnMore: () => void;
  onAddToCompare: () => void;
}

const priceTypeConfig: Record<PriceType, string> = {
  free: 'text-green-500',
  freemium: 'text-orange-400',
  paid: 'text-pink-400',
};

export function SlicerPopularCard({ slicer, logo, onLearnMore, onAddToCompare }: SlicerPopularCardProps) {
  const scoreColor = slicer.overallScore >= 9.0 
    ? 'text-green-500' 
    : slicer.overallScore >= 7.0 
      ? 'text-primary' 
      : 'text-yellow-500';

  return (
    <div className="w-full h-[280px] bg-card/50 border border-border rounded-xl p-5 grid grid-cols-[80px_1fr] gap-5 transition-all duration-200 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md max-lg:h-auto max-lg:min-h-[260px] max-md:grid-cols-1 max-md:text-center">
      {/* Logo Column */}
      <div className="flex flex-col items-center max-md:items-center">
        <div className="w-[60px] h-[60px] bg-muted/30 rounded-lg p-2.5 flex items-center justify-center">
          {logo ? (
            <img src={logo} alt={`${slicer.name} logo`} className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="w-10 h-10 bg-primary/20 rounded-lg" />
          )}
        </div>
      </div>

      {/* Content Column */}
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-bold text-foreground">{slicer.name}</h3>
          <div className="text-[13px] font-medium text-muted-foreground flex items-center gap-2 flex-wrap max-md:justify-center">
            <span>{slicer.brand}</span>
            <span className="text-muted-foreground/50">•</span>
            <span className={priceTypeConfig[slicer.priceType]}>
              {slicer.priceType === 'paid' && slicer.priceValue 
                ? slicer.priceValue 
                : slicer.priceType.charAt(0).toUpperCase() + slicer.priceType.slice(1)}
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className={cn('inline-flex items-center gap-1', scoreColor)}>
              {slicer.overallScore}/10 <Star size={12} fill="currentColor" />
            </span>
          </div>
        </div>

        {/* Features (show 3) */}
        <ul className="flex flex-col gap-1.5 flex-1">
          {slicer.topFeatures.slice(0, 3).map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-[13px] font-medium text-foreground/80 max-md:justify-center">
              <Check size={14} strokeWidth={3} className="text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Buttons */}
        <div className="flex items-center gap-3 mt-auto max-md:justify-center">
          <button
            onClick={onLearnMore}
            className="h-9 px-4 bg-primary hover:bg-primary/90 rounded-lg text-sm font-semibold text-primary-foreground inline-flex items-center gap-2 transition-all"
          >
            Learn More
            <ArrowRight size={14} />
          </button>
          
          <button
            onClick={onAddToCompare}
            className="h-9 w-9 bg-transparent border border-primary/30 hover:border-primary/50 hover:bg-primary/10 rounded-lg text-primary inline-flex items-center justify-center transition-all"
            title="Add to Compare"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
