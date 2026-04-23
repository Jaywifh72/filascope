import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { TrendingDown, TrendingUp, Minus, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceHistoryChartProps {
  filamentId: string | undefined;
  /** Compact mode for inline display on cards (sparkline) */
  compact?: boolean;
  /** Show full chart with axes and labels */
  full?: boolean;
  className?: string;
}

export function PriceHistoryChart({
  filamentId,
  compact = false,
  full = false,
  className,
}: PriceHistoryChartProps) {
  const { data: history = [], isLoading } = usePriceHistory(filamentId);

  const stats = useMemo(() => {
    if (history.length < 2) return null;
    const prices = history.map((h) => h.price);
    const current = prices[prices.length - 1];
    const first = prices[0];
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const trend = current < first ? "down" : current > first ? "up" : "flat";

    return { current, first, lowest, highest, avg, trend, days: history.length };
  }, [history]);

  if (isLoading && compact) {
    return (
      <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}>
        <Activity className="h-3 w-3 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  if (history.length < 2) {
    if (compact) return null;
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Price History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Price history data is being collected. Check back in a few days for trend data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon =
    stats?.trend === "down"
      ? TrendingDown
      : stats?.trend === "up"
        ? TrendingUp
        : Minus;
  const trendColor =
    stats?.trend === "down"
      ? "text-green-400"
      : stats?.trend === "up"
        ? "text-red-400"
        : "text-muted-foreground";

  // Sparkline mode (for filament cards)
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-16 h-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id={`sparkGrad-${filamentId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={stats?.trend === "down" ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={stats?.trend === "down" ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="price"
                stroke={stats?.trend === "down" ? "#22c55e" : "#ef4444"}
                strokeWidth={1.5}
                fill={`url(#sparkGrad-${filamentId})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <TrendIcon className={cn("h-3 w-3", trendColor)} />
      </div>
    );
  }

  // Full chart mode (for filament detail pages)
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Price History
          </span>
          <span className="flex items-center gap-1 text-xs font-normal">
            <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
            <span className={trendColor}>
              {stats?.trend === "down"
                ? `↓ $${(stats.first - stats.current).toFixed(2)} from start`
                : stats?.trend === "up"
                  ? `↑ $${(stats.current - stats.first).toFixed(2)} from start`
                  : "No change"}
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id={`areaGrad-${filamentId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v: number) => `$${v}`}
                domain={["auto", "auto"]}
                width={45}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                labelFormatter={(label: string) => {
                  const d = new Date(label);
                  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                fill={`url(#areaGrad-${filamentId})`}
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-border">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Current</div>
              <div className="text-sm font-semibold">${stats.current.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Lowest</div>
              <div className="text-sm font-semibold text-green-400">${stats.lowest.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Average</div>
              <div className="text-sm font-semibold">${stats.avg.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Days Tracked</div>
              <div className="text-sm font-semibold">{stats.days}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
