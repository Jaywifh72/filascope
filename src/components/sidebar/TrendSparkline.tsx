import { ResponsiveContainer, LineChart, Line } from "recharts";
import { cn } from "@/lib/utils";

interface SparklineDataPoint {
  day: number;
  value: number;
}

interface TrendSparklineProps {
  data: SparklineDataPoint[];
  velocity: string;
  className?: string;
}

const velocityColors: Record<string, string> = {
  rising_fast: "hsl(142, 76%, 36%)", // green
  rising: "hsl(142, 60%, 45%)", // lighter green
  steady: "hsl(186, 95%, 42%)", // cyan
  plateauing: "hsl(48, 96%, 53%)", // yellow
  cooling: "hsl(0, 72%, 51%)", // red
};

export function TrendSparkline({ data, velocity, className }: TrendSparklineProps) {
  const strokeColor = velocityColors[velocity] || velocityColors.steady;
  
  // Ensure we have valid data
  const chartData = data && data.length > 0 ? data : [
    { day: 1, value: 20 },
    { day: 2, value: 35 },
    { day: 3, value: 45 },
    { day: 4, value: 60 },
    { day: 5, value: 75 },
    { day: 6, value: 85 },
    { day: 7, value: 100 },
  ];

  return (
    <div className={cn("w-16 h-6", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
