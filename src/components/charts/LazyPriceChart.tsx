import { lazy, Suspense, memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the heavy Recharts components
const LineChart = lazy(() =>
  import("recharts").then((mod) => ({ default: mod.LineChart }))
);
const Line = lazy(() =>
  import("recharts").then((mod) => ({ default: mod.Line }))
);
const XAxis = lazy(() =>
  import("recharts").then((mod) => ({ default: mod.XAxis }))
);
const YAxis = lazy(() =>
  import("recharts").then((mod) => ({ default: mod.YAxis }))
);
const Tooltip = lazy(() =>
  import("recharts").then((mod) => ({ default: mod.Tooltip }))
);
const ResponsiveContainer = lazy(() =>
  import("recharts").then((mod) => ({ default: mod.ResponsiveContainer }))
);
const CartesianGrid = lazy(() =>
  import("recharts").then((mod) => ({ default: mod.CartesianGrid }))
);

interface PriceDataPoint {
  date: string;
  price: number;
  formattedDate?: string;
}

interface LazyPriceChartProps {
  data: PriceDataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  className?: string;
}

/**
 * Chart loading skeleton
 */
function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="w-full" style={{ height }}>
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  );
}

/**
 * Lazy-loaded price chart component
 * Reduces initial bundle size by deferring Recharts loading
 */
export const LazyPriceChart = memo(function LazyPriceChart({
  data,
  height = 200,
  color = "hsl(var(--primary))",
  showGrid = true,
  className,
}: LazyPriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        No price history available
      </div>
    );
  }

  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      <div className={className}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            )}
            <XAxis
              dataKey="formattedDate"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              itemStyle={{ color }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Suspense>
  );
});

/**
 * Preload Recharts for when you know a chart will be needed soon
 */
export function preloadPriceChart() {
  import("recharts");
}
