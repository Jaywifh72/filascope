import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ComponentData {
  name: string;
  score: number;
  weight: number;
}

interface WeightPieChartProps {
  components: ComponentData[];
  onComponentClick?: (name: string) => void;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function WeightPieChart({ components, onComponentClick }: WeightPieChartProps) {
  const data = components.map((c, i) => ({
    name: c.name,
    value: c.weight,
    score: c.score,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <span className="text-lg">📊</span>
        Weight Distribution
      </h4>
      
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              onClick={(entry) => onComponentClick?.(entry.name)}
              className="cursor-pointer"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                      <p className="font-medium text-sm">{data.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Weight: {data.value}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Score: {data.score.toFixed(1)}/10
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {data.map((item, index) => (
          <button
            key={item.name}
            onClick={() => onComponentClick?.(item.name)}
            className="flex items-center gap-2 text-xs hover:bg-muted/50 rounded px-2 py-1 transition-colors text-left"
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-muted-foreground truncate">{item.name}</span>
            <span className="text-foreground font-medium ml-auto">{item.value}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}
