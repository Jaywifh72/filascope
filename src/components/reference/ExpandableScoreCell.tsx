import { useState } from 'react';
import { ChevronDown, Info, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StarRating } from './StarRating';
import { 
  SlicerSubscores, 
  SUBSCORE_LABELS, 
  SUBSCORE_WEIGHTS,
  getScoreColor,
  getScoreBgColor
} from '@/lib/slicerScoreUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ExpandableScoreCellProps {
  slicerName: string;
  overallScore: number;
  subscores: SlicerSubscores;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ExpandableScoreCell({
  slicerName,
  overallScore,
  subscores,
  isExpanded,
  onToggle,
}: ExpandableScoreCellProps) {
  const scoreColor = getScoreColor(overallScore);
  const scoreBgColor = getScoreBgColor(overallScore);

  return (
    <div className="relative">
      {/* Collapsed/Main Score Display */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded-md transition-all',
          'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          isExpanded && 'bg-muted/30'
        )}
        role="button"
        aria-expanded={isExpanded}
        aria-controls={`score-detail-${slicerName.replace(/\s+/g, '-')}`}
        aria-label={`Overall score ${overallScore} out of 10. Click to ${isExpanded ? 'collapse' : 'expand'} score breakdown.`}
      >
        <span className={cn('text-sm font-semibold tabular-nums', scoreColor)}>
          {overallScore}/10
        </span>
        <Star size={12} className={cn('fill-current', scoreColor)} />
        <ChevronDown 
          size={14} 
          className={cn(
            'text-muted-foreground transition-transform duration-200',
            isExpanded && 'rotate-180'
          )} 
        />
      </button>

      {/* Expanded Detail Section */}
      <div
        id={`score-detail-${slicerName.replace(/\s+/g, '-')}`}
        role="region"
        aria-label={`Score breakdown for ${slicerName}`}
        aria-hidden={!isExpanded}
        className={cn(
          'absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-64 rounded-lg border border-border bg-card shadow-xl',
          'transition-all duration-300 origin-top',
          isExpanded 
            ? 'opacity-100 scale-100 pointer-events-auto' 
            : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className={cn('px-3 py-2 rounded-t-lg border-b border-border', scoreBgColor)}>
          <div className="flex items-center justify-between">
            <span className={cn('text-lg font-bold tabular-nums', scoreColor)}>
              {overallScore}/10
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Overall Score
            </span>
          </div>
        </div>

        {/* Subscores */}
        <div className="p-3 space-y-2.5">
          {(Object.keys(SUBSCORE_LABELS) as Array<keyof SlicerSubscores>).map((key) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground truncate">
                  {SUBSCORE_LABELS[key]}
                </span>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                  ({Math.round(SUBSCORE_WEIGHTS[key] * 100)}%)
                </span>
              </div>
              <StarRating rating={subscores[key]} size="sm" />
            </div>
          ))}
        </div>

        {/* Footer with methodology info */}
        <div className="px-3 py-2 border-t border-border bg-muted/30 rounded-b-lg">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-help">
                  <Info size={10} />
                  <span>Weighted methodology</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">
                  Score calculated using weighted average: Ease (30%), Control (25%), 
                  Support (20%), Speed (15%), UI (10%). Based on hands-on testing 
                  and community feedback.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Close hint */}
        <button
          onClick={onToggle}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-muted-foreground/20 transition-colors"
          aria-label="Close score breakdown"
        >
          <ChevronDown size={12} className="rotate-180" />
        </button>
      </div>
    </div>
  );
}
