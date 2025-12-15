import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

interface ComponentData {
  name: string;
  score: number;
  weight: number;
}

interface ComponentBarChartProps {
  components: ComponentData[];
  onComponentClick?: (name: string) => void;
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'hsl(var(--primary))';
  if (score >= 6) return 'hsl(142, 76%, 36%)'; // green
  if (score >= 4) return 'hsl(38, 92%, 50%)'; // amber
  return 'hsl(0, 84%, 60%)'; // red
}

export function ComponentBarChart({ components, onComponentClick }: ComponentBarChartProps) {
  const data = components.map(c => ({
    name: c.name,
    shortName: c.name.split(' ')[0], // First word only for chart
    score: c.score,
    weight: c.weight,
    fill: getScoreColor(c.score),
  }));

  const maxScore = Math.max(...data.map(d => d.score));
  const minScore = Math.min(...data.map(d => d.score));
  const hasVariation = maxScore - minScore > 0.5;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <span className="text-lg">📈</span>
        Component Scores
      </h4>
      
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
          >
            <XAxis 
              type="number" 
              domain={[0, 10]} 
              hide 
            />
            <YAxis 
              type="category" 
              dataKey="shortName" 
              width={80}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                      <p className="font-medium text-sm">{data.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Score: {data.score.toFixed(1)}/10
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Weight: {data.weight}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="score" 
              radius={[0, 4, 4, 0]}
              onClick={(entry) => onComponentClick?.(entry.name)}
              className="cursor-pointer"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Score Labels */}
      <div className="space-y-1">
        {data.map((item) => {
          const isPerfect = item.score >= 9.9;
          const isBelowPerfect = item.score < maxScore && hasVariation;
          
          return (
            <button
              key={item.name}
              onClick={() => onComponentClick?.(item.name)}
              className="flex items-center justify-between w-full text-xs hover:bg-muted/50 rounded px-2 py-1 transition-colors"
            >
              <span className="text-muted-foreground">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium tabular-nums",
                  isPerfect && "text-primary",
                  isBelowPerfect && "text-amber-500"
                )}>
                  {item.score.toFixed(1)}
                </span>
                {isBelowPerfect && (
                  <span className="text-[10px] text-amber-500/70">← below avg</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
