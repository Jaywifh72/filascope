import { Award, Star, Gem, Check, ArrowRight, Plus } from 'lucide-react';
import { SlicerLogo } from './SlicerLogoFallback';
import { SlicerTierInfo, BadgeType, PriceType } from '@/lib/slicerTierData';
import { useSlicerComparison, slicerTierInfoToSelectedSlicer } from '@/contexts/SlicerComparisonContext';
import { cn } from '@/lib/utils';

interface SlicerTopPickCardProps {
  slicer: SlicerTierInfo;
  logo?: string;
  bestFor?: string;
  onLearnMore: () => void;
}

const badgeConfig: Record<NonNullable<BadgeType>, { icon: typeof Award; label: string; className: string }> = {
  'staff-pick': {
    icon: Award,
    label: '#1 STAFF PICK',
    className: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
  },
  'popular': {
    icon: Star,
    label: 'MOST POPULAR',
    className: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
  },
  'pro-choice': {
    icon: Gem,
    label: 'PRO CHOICE',
    className: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
  },
};

const priceTypeConfig: Record<PriceType, string> = {
  free: 'bg-green-500/15 border-green-500/30 text-green-500',
  freemium: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
  paid: 'bg-pink-500/15 border-pink-500/30 text-pink-400',
};

export function SlicerTopPickCard({ slicer, logo, bestFor, onLearnMore }: SlicerTopPickCardProps) {
  const { addSlicer, removeSlicer, isInComparison } = useSlicerComparison();
  const slicerId = slicer.name.toLowerCase().replace(/\s+/g, '-');
  const inComparison = isInComparison(slicerId);

  const handleCompareToggle = () => {
    const selected = slicerTierInfoToSelectedSlicer(slicer, logo);
    if (inComparison) {
      removeSlicer(selected.id);
    } else {
      addSlicer(selected);
    }
  };
  const isStaffPick = slicer.badge === 'staff-pick';
  const BadgeIcon = slicer.badge ? badgeConfig[slicer.badge].icon : null;

  const scoreStroke = slicer.overallScore >= 8.5 
    ? 'stroke-emerald-400' 
    : slicer.overallScore >= 7.0 
      ? 'stroke-cyan-400' 
      : 'stroke-amber-400';
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (slicer.overallScore / 10) * circumference;

  return (
    <div
      className={cn(
        'group w-[320px] min-h-[480px] flex-shrink-0 rounded-xl p-6',
        'flex flex-col items-center text-center gap-3',
        'transition-all duration-200 cursor-pointer',
        'hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-500/30',
        'hover:shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-500/30',
        isStaffPick
          ? 'bg-gray-800 border-2 border-primary'
          : 'bg-gray-800 border border-gray-700',
        'max-lg:w-full max-lg:min-h-[440px]'
      )}
    >
      {/* Badge */}
      {slicer.badge && BadgeIcon && (
        <div className={cn(
          'inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-[11px] font-bold uppercase tracking-wide mb-3',
          badgeConfig[slicer.badge].className
        )}>
          <BadgeIcon size={12} />
          <span>{badgeConfig[slicer.badge].label}</span>
        </div>
      )}

      {/* Logo */}
      <div className="w-20 h-20 rounded-lg p-3 flex items-center justify-center mb-3">
        <SlicerLogo src={logo} name={slicer.name} className="w-14 h-14 rounded-lg" />
      </div>

      {/* Brand Name */}
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        {slicer.brand}
      </div>

      {/* Slicer Name */}
      <h3 className="text-lg font-bold text-foreground mb-3">{slicer.name}</h3>

      {/* Price Badge */}
      <div className={cn(
        'inline-flex px-3 py-1.5 rounded-md border text-xs font-semibold mb-2',
        priceTypeConfig[slicer.priceType]
      )}>
        {slicer.priceType === 'paid' && slicer.priceValue 
          ? slicer.priceValue 
          : slicer.priceType.charAt(0).toUpperCase() + slicer.priceType.slice(1)}
      </div>

      {/* Overall Score Ring */}
      <div className="flex flex-col items-center">
        <svg width="48" height="48" className="-rotate-90">
          <circle cx="24" cy="24" r={radius} strokeWidth="4" fill="none" className="stroke-slate-700" />
          <circle cx="24" cy="24" r={radius} strokeWidth="4" fill="none" className={scoreStroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={scoreOffset} />
        </svg>
        <span className="text-lg font-bold text-white -mt-[34px] mb-[14px]">{slicer.overallScore}</span>
        <span className="text-xs text-slate-500">/10</span>
      </div>

      {/* Best For pill */}
      {bestFor && (
        <div className="text-xs bg-slate-800/80 rounded-full px-3 py-1 inline-block mt-2 mb-3">
          <span className="text-cyan-400 font-medium">Best For: </span>
          <span className="text-slate-300">{bestFor}</span>
        </div>
      )}

      {/* Top Features */}
      <ul className="flex flex-col gap-2 flex-1 w-full mb-4">
        {slicer.topFeatures.slice(0, 4).map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-[13px] font-medium text-foreground/80">
            <Check size={16} strokeWidth={3} className="text-green-500 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Editorial Quote */}
      <blockquote className="text-[13px] font-medium text-muted-foreground italic line-clamp-2 mb-4">
        <span className="text-primary mr-0.5">"</span>
        {slicer.editorialQuote}
      </blockquote>

      {/* CTA Buttons */}
      <div className="flex flex-col gap-2.5 w-full mt-auto">
        <button
          onClick={onLearnMore}
          className="w-full h-11 bg-primary hover:bg-primary/90 rounded-lg text-sm font-semibold text-primary-foreground inline-flex items-center justify-center gap-2 transition-all"
        >
          <span>Learn More</span>
          <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
        </button>
        
        <button
          onClick={handleCompareToggle}
          className={cn(
            "w-full h-11 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all border-[1.5px]",
            inComparison
              ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50"
              : "bg-transparent border-primary/30 hover:border-primary/50 hover:bg-primary/10 text-primary hover:text-primary/80"
          )}
        >
          {inComparison ? <Check size={16} /> : <Plus size={16} />}
          <span>{inComparison ? '✓ Added' : 'Add to Compare'}</span>
        </button>
      </div>
    </div>
  );
}
