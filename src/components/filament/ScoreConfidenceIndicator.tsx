import { CheckCircle2, AlertCircle, AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfidenceData, getConfidenceColor, getConfidenceBgColor } from '@/lib/scoreConfidence';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface ScoreConfidenceIndicatorProps {
  confidence: ConfidenceData;
  compact?: boolean;
}

export function ScoreConfidenceIndicator({ confidence, compact = false }: ScoreConfidenceIndicatorProps) {
  const { level, percentage, label, description, factors, dataPoints, communityReviews, lastUpdated } = confidence;

  const LevelIcon = level === 'high' 
    ? CheckCircle2 
    : level === 'medium' 
      ? AlertCircle 
      : level === 'low'
        ? AlertTriangle
        : Clock;

  const colorClass = getConfidenceColor(level);
  const bgColorClass = getConfidenceBgColor(level);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-help",
              bgColorClass, colorClass
            )}>
              <LevelIcon className="w-3 h-3" />
              <span className="font-medium">{percentage}%</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              <div className="font-medium">{label}</div>
              <p className="text-xs text-muted-foreground">{description}</p>
              <div className="text-xs space-y-1">
                {factors.map((factor, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {factor.status === 'good' && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                    {factor.status === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                    {factor.status === 'missing' && <HelpCircle className="w-3 h-3 text-muted-foreground" />}
                    <span>{factor.name}: {factor.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn("rounded-lg p-4 border", bgColorClass, "border-border/50")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LevelIcon className={cn("w-5 h-5", colorClass)} />
          <span className={cn("font-semibold", colorClass)}>{label}</span>
        </div>
        <span className={cn("text-lg font-bold", colorClass)}>{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <Progress 
          value={percentage} 
          className="h-2 bg-muted/50"
        />
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3">{description}</p>

      {/* Factors */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-foreground">Based on:</div>
        {factors.map((factor, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            {factor.status === 'good' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
            {factor.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
            {factor.status === 'missing' && <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />}
            <span className="text-muted-foreground">
              {factor.name}
              <span className="ml-1 opacity-75">({factor.detail})</span>
            </span>
          </div>
        ))}
      </div>

      {/* Stats footer */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
        <span>• {dataPoints} data points</span>
        <span>• {communityReviews} reviews</span>
        {lastUpdated && (
          <span>• Updated {new Date(lastUpdated).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}
