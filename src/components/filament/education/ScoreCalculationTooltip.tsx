import { HelpCircle, TrendingUp, TrendingDown, Minus, Calculator, Beaker } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { 
  SCORE_METHODOLOGY, 
  calculateEaseBreakdown, 
  calculateStrengthBreakdown,
  type FilamentDataForScoring,
  type ScoreBreakdown 
} from '@/lib/scoreCalculation';

type ScoreType = 'ease_of_printing' | 'strength_index' | 'printability_index';

interface ScoreCalculationTooltipProps {
  scoreType: ScoreType;
  filament?: FilamentDataForScoring;
  className?: string;
  showBreakdown?: boolean;
}

export function ScoreCalculationTooltip({ 
  scoreType, 
  filament, 
  className,
  showBreakdown = false 
}: ScoreCalculationTooltipProps) {
  const methodology = SCORE_METHODOLOGY[scoreType];
  
  if (!methodology) return null;

  // Calculate live breakdown if filament data provided
  let breakdown: ScoreBreakdown | null = null;
  if (filament && showBreakdown) {
    if (scoreType === 'ease_of_printing') {
      breakdown = calculateEaseBreakdown(filament);
    } else if (scoreType === 'strength_index') {
      breakdown = calculateStrengthBreakdown(filament);
    }
  }

  const content = (
    <div className="space-y-3">
      <div>
        <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5 text-primary" />
          {methodology.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{methodology.description}</p>
      </div>

      {breakdown && breakdown.factors.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1">
            <Beaker className="w-3 h-3" />
            This Filament's Breakdown
          </p>
          <div className="space-y-1">
            {breakdown.factors.map((factor, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {factor.impact === 'positive' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                {factor.impact === 'negative' && <TrendingDown className="w-3 h-3 text-red-400" />}
                {factor.impact === 'neutral' && <Minus className="w-3 h-3 text-muted-foreground" />}
                <span className="text-muted-foreground">{factor.name}:</span>
                <span className={cn(
                  factor.impact === 'positive' && 'text-emerald-400',
                  factor.impact === 'negative' && 'text-red-400',
                  factor.impact === 'neutral' && 'text-foreground'
                )}>
                  {factor.contribution}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Confidence:</span>
            <span className={cn(
              breakdown.confidence >= 70 && 'text-emerald-400',
              breakdown.confidence >= 40 && breakdown.confidence < 70 && 'text-amber-400',
              breakdown.confidence < 40 && 'text-red-400'
            )}>
              {breakdown.confidence}%
            </span>
          </div>
        </div>
      )}

      <div className="border-t border-border pt-2">
        <p className="text-xs font-medium text-foreground mb-1.5">Score Factors</p>
        <div className="space-y-1">
          {methodology.factors.slice(0, 4).map((factor, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-primary font-medium shrink-0">{factor.weight}</span>
              <span className="text-muted-foreground">{factor.name}</span>
            </div>
          ))}
          {methodology.factors.length > 4 && (
            <p className="text-xs text-muted-foreground/60 italic">
              +{methodology.factors.length - 4} more factors
            </p>
          )}
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground/60 pt-1 border-t border-border/50">
        {methodology.formula}
      </div>
    </div>
  );

  // Use HoverCard for detailed breakdown, Tooltip for simple
  if (showBreakdown && breakdown) {
    return (
      <HoverCard openDelay={300}>
        <HoverCardTrigger asChild>
          <button 
            className={cn(
              "inline-flex items-center justify-center p-0.5 rounded-full",
              "hover:bg-muted/50 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50",
              className
            )}
            aria-label={`Learn how ${methodology.title} is calculated`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground" />
          </button>
        </HoverCardTrigger>
        <HoverCardContent 
          side="top" 
          className="w-80 p-3 bg-popover border-border"
        >
          {content}
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            className={cn(
              "inline-flex items-center justify-center p-0.5 rounded-full",
              "hover:bg-muted/50 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50",
              className
            )}
            aria-label={`Learn how ${methodology.title} is calculated`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-[300px] p-3 bg-popover border-border"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Inline badge version showing confidence
export function ScoreConfidenceBadge({ 
  breakdown,
  compact = true 
}: { 
  breakdown: ScoreBreakdown;
  compact?: boolean;
}) {
  const level = breakdown.confidence >= 70 ? 'high' : breakdown.confidence >= 40 ? 'medium' : 'low';
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-1.5 py-0.5 cursor-help",
            level === 'high' && 'bg-emerald-500/15 text-emerald-400',
            level === 'medium' && 'bg-amber-500/15 text-amber-400',
            level === 'low' && 'bg-red-500/15 text-red-400'
          )}>
            {!compact && <Beaker className="w-2.5 h-2.5" />}
            {breakdown.confidence}%
          </span>
        </TooltipTrigger>
        <TooltipContent className="text-xs max-w-[200px]">
          <p className="font-medium">Score Confidence: {breakdown.confidence}%</p>
          <p className="text-muted-foreground mt-0.5">
            Based on {breakdown.dataPoints} data point{breakdown.dataPoints !== 1 ? 's' : ''} from specifications
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
