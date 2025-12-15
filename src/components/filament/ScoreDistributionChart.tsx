import { useMemo } from 'react';
import { AreaChart, Area, ReferenceLine, XAxis, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface ScoreDistributionChartProps {
  min: number;
  max: number;
  mean: number;
  currentScore: number;
  percentile: number;
  colorClass: string;
}

// Generate bell curve data points
function generateBellCurve(min: number, max: number, mean: number, points: number = 50): Array<{ x: number; y: number }> {
  const stdDev = (max - min) / 6; // Approximate standard deviation
  const data: Array<{ x: number; y: number }> = [];
  
  for (let i = 0; i <= points; i++) {
    const x = min + (i / points) * (max - min);
    // Normal distribution formula
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
    const y = Math.exp(exponent);
    data.push({ x: Math.round(x * 10) / 10, y });
  }
  
  return data;
}

export function ScoreDistributionChart({
  min,
  max,
  mean,
  currentScore,
  percentile,
  colorClass,
}: ScoreDistributionChartProps) {
  const data = useMemo(() => generateBellCurve(min, max, mean), [min, max, mean]);
  
  // Calculate the fill areas - everything to the right of current score is "top percentile"
  const splitData = useMemo(() => {
    return data.map(point => ({
      ...point,
      belowScore: point.x <= currentScore ? point.y : 0,
      aboveScore: point.x >= currentScore ? point.y : 0,
    }));
  }, [data, currentScore]);

  // Determine gradient color based on rating
  const gradientId = `scoreGradient-${Math.random().toString(36).substr(2, 9)}`;
  const isGoodScore = percentile >= 50;

  return (
    <div className="relative">
      {/* Chart */}
      <div className="h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={splitData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
            <defs>
              <linearGradient id={`${gradientId}-below`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity={0.6} />
                <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id={`${gradientId}-above`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isGoodScore ? "hsl(var(--chart-2))" : "hsl(var(--chart-4))"} stopOpacity={0.8} />
                <stop offset="100%" stopColor={isGoodScore ? "hsl(var(--chart-2))" : "hsl(var(--chart-4))"} stopOpacity={0.2} />
              </linearGradient>
            </defs>
            
            {/* Below score area (gray) */}
            <Area
              type="monotone"
              dataKey="belowScore"
              stroke="none"
              fill={`url(#${gradientId}-below)`}
              isAnimationActive={true}
              animationDuration={800}
            />
            
            {/* Above score area (colored - represents percentile) */}
            <Area
              type="monotone"
              dataKey="aboveScore"
              stroke="none"
              fill={`url(#${gradientId}-above)`}
              isAnimationActive={true}
              animationDuration={800}
              animationBegin={200}
            />
            
            {/* Current position line */}
            <ReferenceLine
              x={currentScore}
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              strokeDasharray="none"
            />
            
            <XAxis 
              dataKey="x" 
              hide 
              domain={[min, max]}
              type="number"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Score marker */}
      <div 
        className="absolute top-0 flex flex-col items-center pointer-events-none"
        style={{ 
          left: `${((currentScore - min) / (max - min)) * 100}%`,
          transform: 'translateX(-50%)',
        }}
      >
        <div className={cn(
          "w-3 h-3 rounded-full border-2 border-background shadow-md",
          isGoodScore ? "bg-green-500" : "bg-amber-500"
        )} />
      </div>
      
      {/* Labels */}
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>Weakest</span>
        <span>Average</span>
        <span>Strongest</span>
      </div>
      
      {/* Percentile indicator */}
      <div className={cn(
        "absolute -top-1 right-0 text-[10px] font-medium px-1.5 py-0.5 rounded",
        isGoodScore ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
      )}>
        Top {100 - percentile}%
      </div>
    </div>
  );
}
