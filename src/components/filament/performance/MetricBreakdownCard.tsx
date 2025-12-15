import { cn } from '@/lib/utils';
import type { PerformanceMetric } from '@/lib/performanceProfileService';

interface MetricBreakdownCardProps {
  metric: PerformanceMetric;
}

export function MetricBreakdownCard({ metric }: MetricBreakdownCardProps) {
  const colorClasses = {
    green: {
      border: 'border-l-green-500',
      bg: 'bg-green-500/5',
      text: 'text-green-500',
      badge: 'bg-green-500/10 text-green-400 border-green-500/20'
    },
    cyan: {
      border: 'border-l-primary',
      bg: 'bg-primary/5',
      text: 'text-primary',
      badge: 'bg-primary/10 text-primary border-primary/20'
    },
    amber: {
      border: 'border-l-amber-500',
      bg: 'bg-amber-500/5',
      text: 'text-amber-500',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    red: {
      border: 'border-l-red-500',
      bg: 'bg-red-500/5',
      text: 'text-red-500',
      badge: 'bg-red-500/10 text-red-400 border-red-500/20'
    }
  };

  const colors = colorClasses[metric.color];

  return (
    <div 
      className={cn(
        "rounded-lg border-l-[3px] p-3 transition-all hover:bg-muted/30",
        colors.border,
        colors.bg
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-foreground">{metric.name}</span>
            <span className={cn("font-bold tabular-nums", colors.text)}>
              {metric.normalizedScore.toFixed(1)}/10
            </span>
          </div>
          
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn("text-xs px-2 py-0.5 rounded-full border", colors.badge)}>
              {metric.icon} {metric.ratingLabel}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground leading-snug">
            {metric.explanation}
          </p>
        </div>
      </div>
      
      {/* Comparison to average */}
      <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          vs {metric.name} Avg: {metric.categoryAverage.toFixed(1)}
        </span>
        <span className={cn(
          "font-medium",
          metric.percentile >= 50 ? "text-green-500" : "text-amber-500"
        )}>
          {metric.percentile >= 50 ? '↑' : '↓'} {metric.percentile >= 50 ? `Top ${100 - metric.percentile}%` : `Bottom ${metric.percentile}%`}
        </span>
      </div>
    </div>
  );
}
