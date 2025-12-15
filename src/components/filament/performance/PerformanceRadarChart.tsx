import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { PerformanceMetric } from '@/lib/performanceProfileService';

interface PerformanceRadarChartProps {
  metrics: PerformanceMetric[];
  categoryName: string;
}

interface ChartDataPoint {
  metric: string;
  current: number;
  average: number;
  fullMark: number;
}

export function PerformanceRadarChart({ metrics, categoryName }: PerformanceRadarChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return metrics.map(m => ({
      metric: m.name,
      current: m.normalizedScore,
      average: m.categoryAverage,
      fullMark: 10
    }));
  }, [metrics]);

  if (metrics.length < 2) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full h-[280px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid 
              stroke="hsl(var(--muted-foreground))" 
              strokeOpacity={0.15}
              strokeDasharray="3 3"
            />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ 
                fill: 'hsl(var(--foreground))', 
                fontSize: 13,
                fontWeight: 500
              }}
              tickLine={false}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 10]} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickCount={6}
              axisLine={false}
            />
            {/* Category average - dashed outline */}
            <Radar
              name={`${categoryName} Average`}
              dataKey="average"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="transparent"
              dot={{ fill: 'hsl(var(--muted-foreground))', r: 3 }}
            />
            {/* Current material - solid filled */}
            <Radar
              name="This Material"
              dataKey="current"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill="hsl(var(--primary))"
              fillOpacity={0.25}
              dot={{ fill: 'hsl(var(--primary))', r: 4, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload as ChartDataPoint;
                const metric = metrics.find(m => m.name === data.metric);
                
                return (
                  <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
                    <p className="font-semibold text-foreground mb-1">{data.metric}</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-primary">
                        This: <span className="font-bold">{data.current.toFixed(1)}/10</span>
                      </p>
                      <p className="text-muted-foreground">
                        {categoryName} Avg: <span className="font-medium">{data.average.toFixed(1)}/10</span>
                      </p>
                      {metric && (
                        <p className="text-xs text-muted-foreground mt-1 pt-1 border-t border-border">
                          {metric.ratingLabel} • Top {100 - metric.percentile}%
                        </p>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-6 mt-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-primary rounded" />
          <span className="text-muted-foreground">This Material</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-muted-foreground" />
          <span className="text-muted-foreground">{categoryName} Average</span>
        </div>
      </div>
    </div>
  );
}
