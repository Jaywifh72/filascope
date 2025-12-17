import React from 'react';
import { 
  Zap, 
  MousePointerClick, 
  Settings2, 
  Archive, 
  Percent, 
  BadgeCheck, 
  Shapes, 
  Smartphone, 
  Cog
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StandoutFeature } from '@/lib/standoutFeatures';

interface StandoutBadgeProps {
  standout: StandoutFeature;
  variant: 'compact' | 'standard' | 'expanded';
  showTooltip?: boolean;
  className?: string;
}

const getIcon = (iconName: string, size: number = 14, className: string = '') => {
  switch (iconName) {
    case 'MousePointerClick': return <MousePointerClick size={size} className={className} />;
    case 'Settings2': return <Settings2 size={size} className={className} />;
    case 'Archive': return <Archive size={size} className={className} />;
    case 'Percent': return <Percent size={size} className={className} />;
    case 'BadgeCheck': return <BadgeCheck size={size} className={className} />;
    case 'Shapes': return <Shapes size={size} className={className} />;
    case 'Smartphone': return <Smartphone size={size} className={className} />;
    case 'Cog': return <Cog size={size} className={className} />;
    default: return <Zap size={size} className={className} />;
  }
};

const StandoutBadge: React.FC<StandoutBadgeProps> = ({
  standout,
  variant,
  showTooltip = true,
  className = ''
}) => {
  if (variant === 'compact') {
    const badge = (
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 transition-all hover:bg-amber-500/15 hover:border-amber-500/40 ${className}`}
        role="region"
        aria-label={`Standout feature: ${standout.title}`}
      >
        <Zap size={12} className="text-amber-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-amber-400 whitespace-nowrap">
          {standout.title}
        </span>
      </div>
    );

    if (!showTooltip) return badge;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-[280px] bg-background/98 border-border p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              {getIcon(standout.icon, 14, 'text-amber-400')}
              <span className="text-sm font-bold text-amber-400">{standout.title}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {standout.shortDescription}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'standard') {
    return (
      <div 
        className={`flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/25 ${className}`}
        role="region"
        aria-label={`Standout feature: ${standout.title}`}
      >
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500/15">
            <Zap size={16} className="text-amber-400" />
          </div>
          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wide">
            Standout
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-foreground mb-1">
            {standout.title}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {standout.shortDescription}
          </p>
        </div>
      </div>
    );
  }

  // Expanded variant
  return (
    <div 
      className={`relative p-6 rounded-xl bg-gradient-to-br from-amber-500/8 to-amber-500/3 border border-amber-500/20 ${className}`}
      role="region"
      aria-labelledby="standout-title"
    >
      {/* Decorative top accent */}
      <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500/15">
          <Zap size={20} className="text-amber-400" />
        </div>
        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
          What Makes It Unique
        </span>
      </div>
      
      <h3 
        id="standout-title"
        className="text-xl md:text-2xl font-bold text-foreground mb-3"
      >
        {standout.title}
      </h3>
      
      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
        {standout.fullDescription}
      </p>
    </div>
  );
};

export default StandoutBadge;
