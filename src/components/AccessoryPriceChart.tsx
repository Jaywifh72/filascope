import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { format } from "date-fns";

interface AccessoryPriceChartProps {
  accessoryId: string;
  currentPrice: number | null;
  currency?: string;
}

export const AccessoryPriceChart = ({ accessoryId, currentPrice, currency = "USD" }: AccessoryPriceChartProps) => {
  const { data: priceHistory, isLoading } = useQuery({
    queryKey: ["accessory-price-history", accessoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accessory_price_history")
        .select("*")
        .eq("accessory_id", accessoryId)
        .order("recorded_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !priceHistory || priceHistory.length === 0) {
    return null;
  }

  // Prepare chart data
  const chartData = priceHistory.map((record) => ({
    date: new Date(record.recorded_at).getTime(),
    price: Number(record.price),
    formattedDate: format(new Date(record.recorded_at), "MMM d, yyyy"),
  }));

  // Calculate price trend
  const oldestPrice = chartData[0]?.price;
  const newestPrice = chartData[chartData.length - 1]?.price;
  const priceChange = newestPrice && oldestPrice ? newestPrice - oldestPrice : 0;
  const priceChangePercent = oldestPrice ? ((priceChange / oldestPrice) * 100).toFixed(1) : "0";

  const TrendIcon = priceChange > 0 ? TrendingUp : priceChange < 0 ? TrendingDown : Minus;
  const trendColor = priceChange > 0 ? "text-red-500" : priceChange < 0 ? "text-green-500" : "text-muted-foreground";

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Price History</CardTitle>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {priceChange > 0 ? "+" : ""}{priceChangePercent}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(timestamp) => format(new Date(timestamp), "MMM d")}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={(value) => `$${value}`}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                      <p className="text-sm font-semibold">${payload[0].value}</p>
                      <p className="text-xs text-muted-foreground">
                        {payload[0].payload.formattedDate}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {chartData.length > 1 && (
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Lowest:</span> ${Math.min(...chartData.map(d => d.price)).toFixed(2)} USD
            </div>
            <div>
              <span className="font-medium">Highest:</span> ${Math.max(...chartData.map(d => d.price)).toFixed(2)} USD
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
