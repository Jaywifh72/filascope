import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp, Minus, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface PrinterPriceChartProps {
  printerId: string;
  currentStorePrice: number | null;
  currentAmazonPrice: number | null;
  msrp: number | null;
}

export const PrinterPriceChart = ({ 
  printerId, 
  currentStorePrice, 
  currentAmazonPrice,
  msrp 
}: PrinterPriceChartProps) => {
  const { data: priceHistory, isLoading } = useQuery({
    queryKey: ["printer-price-history", printerId],
    queryFn: async () => {
      // Use type assertion since table may not be in generated types yet
      const { data, error } = await (supabase as any)
        .from("printer_price_history")
        .select("*")
        .eq("printer_id", printerId)
        .order("recorded_at", { ascending: true });

      if (error) {
        console.error("Price history fetch error:", error);
        return [];
      }
      return data || [];
    },
  });

  // Prepare chart data from history
  const chartData = priceHistory?.map((record) => ({
    date: new Date(record.recorded_at!).getTime(),
    price: Number(record.price),
    priceType: record.price_type,
    formattedDate: format(new Date(record.recorded_at!), "MMM d, yyyy"),
  })) || [];

  // Calculate price trend if we have history
  const hasHistory = chartData.length > 1;
  const oldestPrice = chartData[0]?.price;
  const newestPrice = chartData[chartData.length - 1]?.price;
  const priceChange = hasHistory && newestPrice && oldestPrice ? newestPrice - oldestPrice : 0;
  const priceChangePercent = oldestPrice ? ((priceChange / oldestPrice) * 100).toFixed(1) : "0";

  const TrendIcon = priceChange > 0 ? TrendingUp : priceChange < 0 ? TrendingDown : Minus;
  const trendColor = priceChange > 0 ? "text-red-500" : priceChange < 0 ? "text-green-500" : "text-muted-foreground";

  // Current prices display
  const displayPrice = currentStorePrice || currentAmazonPrice || msrp;

  return (
    <Card className="bg-background/80 backdrop-blur-sm border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Price Tracker
          </CardTitle>
          {hasHistory && (
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {priceChange > 0 ? "+" : ""}{priceChangePercent}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Prices */}
        <div className="space-y-2">
          {currentStorePrice && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Store Price</span>
              <span className="font-bold text-primary">${currentStorePrice.toLocaleString()} USD</span>
            </div>
          )}
          {currentAmazonPrice && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amazon</span>
              <span className="font-semibold">${currentAmazonPrice.toLocaleString()} USD</span>
            </div>
          )}
          {msrp && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">MSRP</span>
              <span className="text-muted-foreground">${msrp.toLocaleString()} USD</span>
            </div>
          )}
          {!displayPrice && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No pricing data available
            </p>
          )}
        </div>

        {/* Price Chart */}
        {hasHistory && (
          <>
            <div className="h-px bg-border" />
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(timestamp) => format(new Date(timestamp), "MMM d")}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => `$${value}`}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  width={50}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                          <p className="text-sm font-semibold">${Number(payload[0].value).toLocaleString()}</p>
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
                  dot={{ fill: "hsl(var(--primary))", r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Low:</span> ${Math.min(...chartData.map(d => d.price)).toLocaleString()} USD
              </div>
              <div>
                <span className="font-medium">High:</span> ${Math.max(...chartData.map(d => d.price)).toLocaleString()} USD
              </div>
            </div>
          </>
        )}

        {!hasHistory && displayPrice && (
          <p className="text-xs text-muted-foreground text-center">
            Price history tracking started
          </p>
        )}
      </CardContent>
    </Card>
  );
};
