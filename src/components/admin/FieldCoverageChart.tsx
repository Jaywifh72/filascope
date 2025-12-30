import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import type { FieldFillRate } from "@/hooks/useFieldFillRates";

interface FieldCoverageChartProps {
  fields: FieldFillRate[];
  title?: string;
}

function getBarColor(percentage: number): string {
  if (percentage >= 70) return 'hsl(142, 76%, 36%)'; // green
  if (percentage >= 30) return 'hsl(45, 93%, 47%)';  // yellow
  return 'hsl(0, 84%, 60%)'; // red
}

export function FieldCoverageChart({ fields, title = "Field Coverage Overview" }: FieldCoverageChartProps) {
  const chartData = fields.map(f => ({
    name: f.label.length > 12 ? f.label.substring(0, 10) + '...' : f.label,
    fullName: f.label,
    percentage: f.percentage,
    filled: f.filled,
    total: f.total,
    category: f.category,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <YAxis 
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                className="fill-muted-foreground"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg shadow-lg p-3">
                      <p className="font-medium">{data.fullName}</p>
                      <p className="text-sm text-muted-foreground capitalize">{data.category.replace('_', ' ')}</p>
                      <p className="text-lg font-bold mt-1">{data.percentage}%</p>
                      <p className="text-xs text-muted-foreground">
                        {data.filled.toLocaleString()} / {data.total.toLocaleString()} filled
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span className="text-muted-foreground">≥70% (Good)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-yellow-500" />
            <span className="text-muted-foreground">30-70% (Fair)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500" />
            <span className="text-muted-foreground">&lt;30% (Poor)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
