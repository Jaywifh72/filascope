import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StarRating } from './StarRating';
import { 
  SlicerSubscores, 
  SUBSCORE_LABELS, 
  SUBSCORE_WEIGHTS,
  getScoreColor 
} from '@/lib/slicerScoreUtils';

interface ScoreBreakdownRowProps {
  slicerName: string;
  overallScore: number;
  subscores: SlicerSubscores;
  isExpanded: boolean;
  onCollapse: () => void;
  columnCount: number;
}

export function ScoreBreakdownRow({
  slicerName,
  overallScore,
  subscores,
  isExpanded,
  onCollapse,
  columnCount,
}: ScoreBreakdownRowProps) {
  const scoreColor = getScoreColor(overallScore);
  const subscoreKeys = Object.keys(SUBSCORE_LABELS) as Array<keyof SlicerSubscores>;

  return (
    <tr
      id={`score-detail-${slicerName.replace(/\s+/g, '-')}`}
      role="region"
      aria-label={`Score breakdown for ${slicerName}`}
      aria-hidden={!isExpanded}
      className={cn(
        'transition-all duration-300',
        !isExpanded && 'hidden'
      )}
    >
      <td colSpan={columnCount} className="p-0 border-b border-border/50">
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-out',
            isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="p-4 md:p-5 bg-primary/5 border-l-[3px] border-primary/30">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                Score Breakdown
              </h4>
              <button
                onClick={onCollapse}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-md hover:bg-primary/10 hover:border-primary/50 transition-all"
              >
                <ChevronUp size={14} />
                Collapse
              </button>
            </div>

            {/* Subscores Grid */}
            <div className="space-y-3 mb-4">
              {subscoreKeys.map((key) => (
                <div 
                  key={key}
                  className="grid grid-cols-1 md:grid-cols-[140px_1fr_70px_90px] items-center gap-2 md:gap-4"
                >
                  <div className="text-sm font-semibold text-foreground">
                    {SUBSCORE_LABELS[key]}
                  </div>
                  <div className="flex items-center">
                    <StarRating rating={subscores[key]} size="md" />
                  </div>
                  <div className="text-sm font-bold text-foreground tabular-nums md:text-right">
                    {subscores[key].toFixed(1)}/5
                  </div>
                  <div className="text-xs font-medium text-muted-foreground md:text-right">
                    (Weight: {Math.round(SUBSCORE_WEIGHTS[key] * 100)}%)
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-border/50">
              <p className="text-sm text-muted-foreground italic">
                Overall: <span className={cn('font-bold not-italic', scoreColor)}>{overallScore.toFixed(1)}/10</span>
                {' '}(Weighted average of above factors)
              </p>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
