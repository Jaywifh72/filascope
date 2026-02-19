import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  useClickSummary,
  useClicksToday,
  type ClickFilters,
} from "@/hooks/useAffiliateClickAnalytics";
import { MousePointerClick, Users, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";

type DateRange = "today" | "7d" | "30d";

const COLORS = ["hsl(var(--primary))", "#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ef4444"];

function getDateRange(range: DateRange): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  let start: Date;
  if (range === "today") {
    start = now;
  } else if (range === "7d") {
    start = new Date(now);
    start.setDate(start.getDate() - 7);
  } else {
    start = new Date(now);
    start.setDate(start.getDate() - 30);
  }
  return { startDate: start.toISOString().slice(0, 10), endDate: end };
}

function KpiCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AffiliatePanel() {
  const [range, setRange] = useState<DateRange>("30d");
  const { startDate, endDate } = getDateRange(range);

  const filters: ClickFilters = {
    startDate,
    endDate,
    brandNames: null,
    regionCodes: null,
  };

  const { data: summary, isLoading: summaryLoading } = useClickSummary(filters);
  const { data: clicksToday } = useClicksToday();

  // Brand aggregation from affiliate_clicks_daily
  const { data: brandData } = useQuery({
    queryKey: ["analytics-brand-clicks", range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_clicks_daily")
        .select("brand, clicks")
        .gte("date", startDate);
      if (error) throw error;
      // Aggregate by brand
      const map: Record<string, number> = {};
      for (const row of data || []) {
        const b = row.brand || "Unknown";
        map[b] = (map[b] || 0) + (row.clicks || 0);
      }
      return Object.entries(map)
        .map(([brand, clicks]) => ({ brand, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);
    },
  });

  // Region breakdown
  const { data: regionData } = useQuery({
    queryKey: ["analytics-region-clicks", range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_clicks")
        .select("region_code")
        .gte("clicked_at", startDate);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data || []) {
        const r = row.region_code || "Unknown";
        map[r] = (map[r] || 0) + 1;
      }
      return Object.entries(map)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },
  });

  // Top products
  const { data: productData } = useQuery({
    queryKey: ["analytics-product-clicks", range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_clicks")
        .select("product_name, brand_name, product_slug, session_id")
        .gte("clicked_at", startDate)
        .not("product_name", "is", null)
        .limit(500);
      if (error) throw error;
      const map: Record<
        string,
        { brand_name: string; product_slug: string | null; clicks: number; sessions: Set<string> }
      > = {};
      for (const row of data || []) {
        const key = row.product_name!;
        if (!map[key]) {
          map[key] = {
            brand_name: row.brand_name || "",
            product_slug: row.product_slug,
            clicks: 0,
            sessions: new Set(),
          };
        }
        map[key].clicks++;
        if (row.session_id) map[key].sessions.add(row.session_id);
      }
      return Object.entries(map)
        .map(([product_name, d]) => ({
          product_name,
          brand_name: d.brand_name,
          product_slug: d.product_slug,
          clicks: d.clicks,
          unique_sessions: d.sessions.size,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);
    },
  });

  // Weekly clicks (7-day window)
  const weekFilters: ClickFilters = { ...getDateRange("7d"), brandNames: null, regionCodes: null };
  const { data: weekSummary } = useClickSummary(weekFilters);
  const monthFilters: ClickFilters = { ...getDateRange("30d"), brandNames: null, regionCodes: null };
  const { data: monthSummary } = useClickSummary(monthFilters);

  return (
    <div className="space-y-6">
      {/* Date range selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Date range:</span>
        {(["today", "7d", "30d"] as DateRange[]).map((r) => (
          <Button
            key={r}
            variant={range === r ? "default" : "outline"}
            size="sm"
            onClick={() => setRange(r)}
          >
            {r === "today" ? "Today" : r === "7d" ? "7 Days" : "30 Days"}
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Clicks Today" value={clicksToday ?? 0} icon={Zap} />
        <KpiCard label="Clicks This Week" value={weekSummary?.total_clicks ?? 0} icon={MousePointerClick} loading={summaryLoading} />
        <KpiCard label="Clicks This Month" value={monthSummary?.total_clicks ?? 0} icon={TrendingUp} loading={summaryLoading} />
        <KpiCard label="Unique Sessions" value={summary?.unique_sessions ?? 0} icon={Users} loading={summaryLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks by Brand */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clicks by Brand</CardTitle>
          </CardHeader>
          <CardContent>
            {!brandData || brandData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={brandData} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis
                    type="category"
                    dataKey="brand"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Clicks by Region */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clicks by Region</CardTitle>
          </CardHeader>
          <CardContent>
            {!regionData || regionData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={regionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {regionData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clicked Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Clicked Products</CardTitle>
        </CardHeader>
        <CardContent>
          {!productData || productData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No product click data for this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Brand</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Clicks</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {productData.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-4">
                        {row.product_slug ? (
                          <Link to={`/filament/${row.product_slug}`} className="text-primary hover:underline truncate max-w-[200px] block">
                            {row.product_name}
                          </Link>
                        ) : (
                          <span className="truncate max-w-[200px] block">{row.product_name}</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="secondary" className="text-xs">{row.brand_name}</Badge>
                      </td>
                      <td className="py-2 pr-4 text-right font-medium">{row.clicks}</td>
                      <td className="py-2 text-right text-muted-foreground">{row.unique_sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
