import { Link } from 'react-router-dom';
import { CheckCircle2, Equal, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

export interface ComparisonItem {
  id: string;
  name: string;
  vendor: string;
  score: number;
}

interface ContextualComparisonsProps {
  betterThan: ComparisonItem[];
  similarTo: ComparisonItem[];
  notAsGoodAs: ComparisonItem[];
  currentScore: number;
}

function ComparisonLink({ item, type }: { item: ComparisonItem; type: 'better' | 'similar' | 'worse' }) {
  const colorClass = type === 'better' ? 'text-green-400' : type === 'similar' ? 'text-primary' : 'text-amber-400';
  
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Link
          to={`/filament/${item.id}`}
          className={cn(
            "inline-flex items-center gap-1 text-xs hover:underline transition-colors",
            colorClass
          )}
        >
          <span className="truncate max-w-[120px]">{item.vendor} {item.name.split(' ').slice(0, 2).join(' ')}</span>
          <span className="text-muted-foreground">({item.score.toFixed(1)})</span>
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-56 p-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.vendor}</p>
          <p className={cn("text-sm font-semibold", colorClass)}>
            Score: {item.score.toFixed(1)}/10
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function ContextualComparisons({
  betterThan,
  similarTo,
  notAsGoodAs,
  currentScore,
}: ContextualComparisonsProps) {
  const hasAny = betterThan.length > 0 || similarTo.length > 0 || notAsGoodAs.length > 0;
  
  if (!hasAny) return null;
  
  return (
    <div className="space-y-2 pt-2 border-t border-border/50">
      {/* Better than */}
      {betterThan.length > 0 && (
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <span className="text-[10px] text-muted-foreground">Better than:</span>
            {betterThan.slice(0, 2).map((item, i) => (
              <span key={item.id}>
                <ComparisonLink item={item} type="better" />
                {i < Math.min(betterThan.length, 2) - 1 && <span className="text-muted-foreground">, </span>}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Similar to */}
      {similarTo.length > 0 && (
        <div className="flex items-start gap-2">
          <Equal className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <span className="text-[10px] text-muted-foreground">Similar to:</span>
            {similarTo.slice(0, 2).map((item, i) => (
              <span key={item.id}>
                <ComparisonLink item={item} type="similar" />
                {i < Math.min(similarTo.length, 2) - 1 && <span className="text-muted-foreground">, </span>}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Not as good as */}
      {notAsGoodAs.length > 0 && (
        <div className="flex items-start gap-2">
          <XCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <span className="text-[10px] text-muted-foreground">Not as good as:</span>
            {notAsGoodAs.slice(0, 2).map((item, i) => (
              <span key={item.id}>
                <ComparisonLink item={item} type="worse" />
                {i < Math.min(notAsGoodAs.length, 2) - 1 && <span className="text-muted-foreground">, </span>}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty states */}
      {betterThan.length === 0 && similarTo.length === 0 && notAsGoodAs.length > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          <span>Better than all others in this category!</span>
        </div>
      )}
    </div>
  );
}
