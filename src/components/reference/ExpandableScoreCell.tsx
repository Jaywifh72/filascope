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

  const barColor = overallScore >= 8.0 ? 'bg-emerald-500' : overallScore >= 6.0 ? 'bg-cyan-500' : 'bg-amber-500';

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex flex-col items-center px-2 py-1.5 rounded-md transition-all',
        'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
      role="button"
      aria-expanded={isExpanded}
      aria-controls={`score-detail-${slicerName.replace(/\s+/g, '-')}`}
      aria-label={`Overall score ${overallScore} out of 10. Click to ${isExpanded ? 'collapse' : 'expand'} score breakdown.`}
    >
      <div className="flex items-center gap-2 w-full justify-center">
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
      </div>
      <div className="w-[60px] h-1 rounded-full bg-slate-700/50 mt-1">
        <div
          className={cn('h-full rounded-full', barColor)}
          style={{ width: `${(overallScore / 10) * 100}%` }}
        />
      </div>
    </button>
  );
}
