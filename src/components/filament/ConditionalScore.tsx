import { TrendingUp, TrendingDown, Minus, Printer, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConditionalScoreResult } from '@/lib/conditionalScoring';

interface ConditionalScoreProps {
  result: ConditionalScoreResult;
  printerName?: string;
  scoreLabel: string;
}

export function ConditionalScore({ result, printerName, scoreLabel }: ConditionalScoreProps) {
  const { originalScore, adjustedScore, adjustments, label, isExcellentMatch } = result;
  const scoreDiff = adjustedScore - originalScore;

  if (adjustments.length === 0 && !printerName) {
    return null;
  }

  const TrendIcon = scoreDiff > 0 ? TrendingUp : scoreDiff < 0 ? TrendingDown : Minus;
  const trendColor = scoreDiff > 0 
    ? 'text-green-400' 
    : scoreDiff < 0 
      ? 'text-amber-400' 
      : 'text-muted-foreground';

  return (
    <div className={cn(
      "rounded-lg p-3 border",
      isExcellentMatch 
        ? "bg-green-500/10 border-green-500/20" 
        : scoreDiff < 0 
          ? "bg-amber-500/10 border-amber-500/20"
          : "bg-muted/30 border-border/50"
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Printer className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-medium text-foreground">
          With {printerName || 'Selected Printer'}
        </span>
      </div>

      {/* Score comparison */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-muted-foreground">{originalScore.toFixed(1)}</span>
        <span className="text-muted-foreground">→</span>
        <span className={cn("text-lg font-bold", trendColor)}>
          {adjustedScore.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground">/10</span>
        
        {scoreDiff !== 0 && (
          <div className={cn("flex items-center gap-1 ml-2", trendColor)}>
            <TrendIcon className="w-3 h-3" />
            <span className="text-xs font-medium">
              {scoreDiff > 0 ? '+' : ''}{scoreDiff.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Label */}
      <div className={cn(
        "text-xs font-medium mb-2",
        isExcellentMatch ? "text-green-400" : scoreDiff < 0 ? "text-amber-400" : "text-cyan-400"
      )}>
        {label}
      </div>

      {/* Adjustments list */}
      {adjustments.length > 0 && (
        <div className="space-y-1">
          {adjustments.map((adj, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-2 text-xs"
            >
              {adj.type === 'bonus' ? (
                <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              )}
              <span className="text-muted-foreground">
                {adj.reason}
                <span className={cn(
                  "ml-1 font-medium",
                  adj.type === 'bonus' ? "text-green-400" : "text-amber-400"
                )}>
                  ({adj.impact > 0 ? '+' : ''}{adj.impact.toFixed(1)})
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
