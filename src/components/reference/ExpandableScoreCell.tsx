import { ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getScoreColor } from '@/lib/slicerScoreUtils';

interface ExpandableScoreCellProps {
  overallScore: number;
  isExpanded: boolean;
  onToggle: () => void;
  slicerName: string;
}

export function ExpandableScoreCell({
  overallScore,
  isExpanded,
  onToggle,
  slicerName,
}: ExpandableScoreCellProps) {
  const scoreColor = getScoreColor(overallScore);

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-md transition-all',
        'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
      role="button"
      aria-expanded={isExpanded}
      aria-controls={`score-detail-${slicerName.replace(/\s+/g, '-')}`}
      aria-label={`Overall score ${overallScore} out of 10. Click to ${isExpanded ? 'collapse' : 'expand'} score breakdown.`}
    >
      <span className={cn('text-base font-bold tabular-nums', scoreColor)}>
        {overallScore.toFixed(1)}/10
      </span>
      <Star size={14} className={cn('fill-current', scoreColor)} />
      <ChevronRight 
        size={16} 
        className={cn(
          'text-muted-foreground transition-transform duration-200 ml-auto',
          isExpanded && 'rotate-90'
        )} 
      />
    </button>
  );
}
