import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScoreHistoryPoint } from '@/hooks/useScoreHistory';
import { format } from 'date-fns';

interface ScoreHistoryChartProps {
  history: ScoreHistoryPoint[];
  currentScore: number | null;
  scoreLabel: string;
  color?: string;
}

export function ScoreHistoryChart({ 
  history, 
  currentScore, 
  scoreLabel,
  color = 'hsl(var(--chart-1))'
}: ScoreHistoryChartProps) {
  // Add current score as the latest data point if not in history
  const chartData = [...history];
  if (currentScore !== null && history.length > 0) {
    const lastHistoryDate = history[history.length - 1]?.recordedAt;
    const now = new Date();
    if (!lastHistoryDate || now.getTime() - lastHistoryDate.getTime() > 86400000) {
      chartData.push({
        id: 'current',
        score: currentScore,
        scoreType: history[0]?.scoreType || '',
        changeReason: 'Current',
        recordedAt: now,
      });
    }
  }

  // If no history, show placeholder
  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Score History</span>
        </div>
        <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
          No historical data available yet
        </div>
      </div>
    );
  }

  // Calculate trend
  const firstScore = chartData[0]?.score || 0;
  const lastScore = chartData[chartData.length - 1]?.score || 0;
  const trend = lastScore - firstScore;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-muted-foreground';

  // Find the most recent change with a reason
  const recentChange = [...chartData].reverse().find(p => p.changeReason && p.changeReason !== 'Current');

  // Format data for chart
  const formattedData = chartData.map(point => ({
    date: format(point.recordedAt, 'MMM yyyy'),
    score: point.score,
    reason: point.changeReason,
    fullDate: point.recordedAt,
  }));

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Score History</span>
        </div>
        {chartData.length >= 2 && (
          <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span className="font-medium">
              {trend > 0 ? '+' : ''}{trend.toFixed(1)} overall
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 10]} 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={20}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [value.toFixed(1), scoreLabel]}
              labelFormatter={(label, payload) => {
                const point = payload?.[0]?.payload;
                if (point?.reason) {
                  return `${label} - ${point.reason}`;
                }
                return label;
              }}
            />
            <ReferenceLine y={5} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.3} />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 0, r: 3 }}
              activeDot={{ fill: color, strokeWidth: 2, stroke: 'hsl(var(--background))', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent change annotation */}
      {recentChange && (
        <div className="flex items-start gap-2 mt-3 pt-3 border-t border-border/30">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="text-muted-foreground">
              {format(recentChange.recordedAt, 'MMM yyyy')}:
            </span>
            <span className="text-foreground ml-1">{recentChange.changeReason}</span>
          </div>
        </div>
      )}
    </div>
  );
}
