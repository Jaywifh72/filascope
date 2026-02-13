import { Check, ArrowRight, Plus, Star } from 'lucide-react';
import { SlicerTierInfo, PriceType } from '@/lib/slicerTierData';
import { useSlicerComparison, slicerTierInfoToSelectedSlicer } from '@/contexts/SlicerComparisonContext';
import { cn } from '@/lib/utils';
import { SlicerLogo } from './SlicerLogoFallback';

interface SlicerPopularCardProps {
  slicer: SlicerTierInfo;
  logo?: string;
  onLearnMore: () => void;
}

const priceTypeConfig: Record<PriceType, { className: string; badge?: boolean }> = {
  free: { className: 'bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-medium', badge: true },
  freemium: { className: 'bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-xs font-medium', badge: true },
  paid: { className: 'text-gray-400', badge: false },
};

export function SlicerPopularCard({ slicer, logo, onLearnMore }: SlicerPopularCardProps) {
  const { addSlicer, removeSlicer, isInComparison } = useSlicerComparison();
  const inComparison = isInComparison(slicer.name.toLowerCase().replace(/\s+/g, '-'));

  const scoreColor = slicer.overallScore >= 9.0 
    ? 'text-green-500' 
    : slicer.overallScore >= 7.0 
      ? 'text-primary' 
      : 'text-yellow-500';

  const handleCompareClick = () => {
    const selectedSlicer = slicerTierInfoToSelectedSlicer(slicer, logo);
    if (inComparison) {
      removeSlicer(selectedSlicer.id);
    } else {
      addSlicer(selectedSlicer);
    }
  };

  return (
    <div className="group w-full h-full bg-gray-800 border border-gray-700 rounded-xl p-4 grid grid-cols-[80px_1fr] gap-4 transition-all duration-200 cursor-pointer hover:bg-slate-800/80 hover:border-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/10 max-md:grid-cols-1 max-md:text-center">
      {/* Logo Column */}
      <div className="flex flex-col items-center max-md:items-center">
        <div className="w-[60px] h-[60px] rounded-lg flex items-center justify-center">
          <SlicerLogo src={logo} name={slicer.name} className="w-[52px] h-[52px] rounded-lg" />
        </div>
      </div>

      {/* Content Column */}
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-bold text-white">{slicer.name}</h3>
          <div className="text-sm text-gray-400 flex items-center gap-2 flex-wrap max-md:justify-center">
            <span>{slicer.brand}</span>
            <span className="text-gray-600">•</span>
            <span className={priceTypeConfig[slicer.priceType].className}>
              {slicer.priceType === 'paid' && slicer.priceValue 
                ? slicer.priceValue 
                : slicer.priceType.charAt(0).toUpperCase() + slicer.priceType.slice(1)}
            </span>
            <span className="text-gray-600">•</span>
            <span className="inline-flex items-center gap-1 text-primary font-semibold">
              {slicer.overallScore}/10 <Star size={12} fill="currentColor" />
            </span>
          </div>
        </div>

        {/* Features (show 3) */}
        <ul className="flex flex-col gap-1.5 flex-1">
          {slicer.topFeatures.slice(0, 3).map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-gray-300 max-md:justify-center">
              <Check size={14} strokeWidth={3} className="text-primary flex-shrink-0" />
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
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
          </button>
          
          <button
            onClick={handleCompareClick}
            className={cn(
              "h-9 w-9 rounded-lg inline-flex items-center justify-center transition-all",
              inComparison
                ? "bg-primary/20 border border-primary text-primary"
                : "bg-transparent border border-gray-600 hover:border-primary text-gray-400 hover:text-primary"
            )}
            title={inComparison ? "Remove from Compare" : "Add to Compare"}
          >
            {inComparison ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
