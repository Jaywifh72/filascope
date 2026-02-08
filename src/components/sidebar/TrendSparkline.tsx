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

const defaultData: SparklineDataPoint[] = [
  { day: 1, value: 20 },
  { day: 2, value: 35 },
  { day: 3, value: 45 },
  { day: 4, value: 60 },
  { day: 5, value: 75 },
  { day: 6, value: 85 },
  { day: 7, value: 100 },
];

/**
 * Lightweight SVG sparkline — no Recharts dependency.
 * Renders a simple polyline from data points.
 */
export function TrendSparkline({ data, velocity, className }: TrendSparklineProps) {
  const strokeColor = velocityColors[velocity] || velocityColors.steady;
  const chartData = data && data.length > 0 ? data : defaultData;

  // SVG viewBox dimensions
  const width = 64;
  const height = 24;
  const padding = 2;

  const values = chartData.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = chartData
    .map((d, i) => {
      const x = padding + (i / (chartData.length - 1)) * (width - padding * 2);
      const y = height - padding - ((d.value - minVal) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={cn("w-16 h-6", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
