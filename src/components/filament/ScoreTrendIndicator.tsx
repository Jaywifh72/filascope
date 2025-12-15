import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export interface TrendData {
  previousScore: number;
  currentScore: number;
  change: number;
  direction: 'up' | 'down' | 'stable';
  periodLabel: string;
  dataPoints: Array<{ date: string; score: number }>;
}

interface ScoreTrendIndicatorProps {
  trend: TrendData;
}

export function ScoreTrendIndicator({ trend }: ScoreTrendIndicatorProps) {
  const TrendIcon = trend.direction === 'up' 
    ? TrendingUp 
    : trend.direction === 'down' 
      ? TrendingDown 
      : Minus;
  
  const colorClass = trend.direction === 'up'
    ? 'text-green-400'
    : trend.direction === 'down'
      ? 'text-red-400'
      : 'text-muted-foreground';
  
  const bgClass = trend.direction === 'up'
    ? 'bg-green-500/10'
    : trend.direction === 'down'
      ? 'bg-red-500/10'
      : 'bg-muted/30';
  
  const strokeColor = trend.direction === 'up'
    ? 'hsl(var(--chart-2))'
    : trend.direction === 'down'
      ? 'hsl(var(--destructive))'
      : 'hsl(var(--muted-foreground))';

  return (
    <div className={cn("flex items-center gap-3 p-2 rounded-lg", bgClass)}>
      {/* Trend Icon */}
      <div className={cn("shrink-0", colorClass)}>
        <TrendIcon className="w-4 h-4" />
      </div>
      
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-foreground">
            {trend.direction === 'stable' ? 'Stable at' : trend.direction === 'up' ? 'Improved from' : 'Dropped from'}
          </span>
          {trend.direction !== 'stable' && (
            <>
              <span className="text-xs text-muted-foreground">{trend.previousScore.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">→</span>
            </>
          )}
          <span className={cn("text-xs font-semibold", colorClass)}>
            {trend.currentScore.toFixed(1)}
          </span>
          {trend.direction !== 'stable' && (
            <span className={cn("text-[10px] font-medium", colorClass)}>
              ({trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)})
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {trend.periodLabel}
        </p>
      </div>
      
      {/* Mini Sparkline */}
      {trend.dataPoints.length >= 2 && (
        <div className="w-16 h-8 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend.dataPoints}>
              <Line
                type="monotone"
                dataKey="score"
                stroke={strokeColor}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={true}
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
