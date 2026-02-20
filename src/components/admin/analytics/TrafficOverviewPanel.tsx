import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Eye, Users, Calendar, BarChart2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
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

const COLORS = [
  "hsl(var(--primary))",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#f59e0b",
];

const REGION_LABELS: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  UK: "United Kingdom",
  EU: "Europe",
  AU: "Australia",
  JP: "Japan",
};

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 6,
  },
  labelStyle: { color: "hsl(var(--foreground))" },
  itemStyle: { color: "hsl(var(--muted-foreground))" },
};

function KpiCard({
  label,
  value,
  icon: Icon,
  loading,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  sub?: string;
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
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TrafficOverviewPanel() {
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date();
  monthStart.setDate(monthStart.getDate() - 30);

  // KPI counts
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["traffic-kpis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_browse_history")
        .select("viewed_at, session_id");
      if (error) throw error;
      const rows = data || [];
      const todayStart = new Date(today).getTime();
      const weekStartTs = weekStart.getTime();
      const monthStartTs = monthStart.getTime();
      return {
        today: rows.filter((r) => new Date(r.viewed_at).getTime() >= todayStart).length,
        week: rows.filter((r) => new Date(r.viewed_at).getTime() >= weekStartTs).length,
        month: rows.filter((r) => new Date(r.viewed_at).getTime() >= monthStartTs).length,
        uniqueSessions: new Set(rows.map((r) => r.session_id).filter(Boolean)).size,
      };
    },
  });

  // Daily views chart (last 30 days)
  const { data: dailyViews, isLoading: dailyLoading } = useQuery({
    queryKey: ["traffic-daily-views"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_browse_history")
        .select("viewed_at")
        .gte("viewed_at", monthStart.toISOString());
      if (error) throw error;

      const map: Record<string, number> = {};
      // Pre-fill all 30 days with 0
      for (let i = 30; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        map[d.toISOString().slice(0, 10)] = 0;
      }
      for (const row of data || []) {
        const day = row.viewed_at.slice(0, 10);
        if (day in map) map[day] = (map[day] || 0) + 1;
      }
      return Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, views]) => ({
          date: date.slice(5), // MM-DD for display
          views,
        }));
    },
  });

  // Top 10 most viewed products
  const { data: topPages, isLoading: topPagesLoading } = useQuery({
    queryKey: ["traffic-top-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_browse_history")
        .select("filament_id, printer_id, product_type")
        .gte("viewed_at", monthStart.toISOString())
        .limit(1000);
      if (error) throw error;

      // Aggregate by filament_id
      const filamentMap: Record<string, number> = {};
      const printerMap: Record<string, number> = {};
      for (const row of data || []) {
        if (row.filament_id) filamentMap[row.filament_id] = (filamentMap[row.filament_id] || 0) + 1;
        if (row.printer_id) printerMap[row.printer_id] = (printerMap[row.printer_id] || 0) + 1;
      }

      // Fetch filament details
      const filamentIds = Object.keys(filamentMap).slice(0, 20);
      const results: { id: string; title: string; vendor: string; handle: string | null; views: number; type: string }[] = [];

      if (filamentIds.length > 0) {
        const { data: filaments } = await supabase
          .from("filaments")
          .select("id, product_title, vendor, product_handle")
          .in("id", filamentIds);
        for (const f of filaments || []) {
          results.push({
            id: f.id,
            title: f.product_title || "Untitled",
            vendor: f.vendor || "",
            handle: f.product_handle,
            views: filamentMap[f.id] || 0,
            type: "filament",
          });
        }
      }

      return results.sort((a, b) => b.views - a.views).slice(0, 10);
    },
  });

  // Region breakdown from affiliate_clicks (as proxy)
  const { data: regionData, isLoading: regionLoading } = useQuery({
    queryKey: ["traffic-region-breakdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_clicks")
        .select("region_code")
        .gte("clicked_at", monthStart.toISOString());
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data || []) {
        const r = row.region_code || "Unknown";
        map[r] = (map[r] || 0) + 1;
      }
      return Object.entries(map)
        .map(([name, value]) => ({ name, value, label: REGION_LABELS[name] || name }))
        .sort((a, b) => b.value - a.value);
    },
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Product Views Today" value={kpis?.today ?? 0} icon={Eye} loading={kpisLoading} />
        <KpiCard label="Views This Week" value={kpis?.week ?? 0} icon={Calendar} loading={kpisLoading} />
        <KpiCard label="Views This Month" value={kpis?.month ?? 0} icon={BarChart2} loading={kpisLoading} />
        <KpiCard label="Unique Sessions" value={kpis?.uniqueSessions ?? 0} icon={Users} loading={kpisLoading} sub="30-day window" />
      </div>

      {/* Daily Views Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Product Page Views (Last 30 Days)</CardTitle>
          <CardDescription>Internal tracking from product page visits logged to Lovable Cloud</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !dailyViews || dailyViews.every((d) => d.views === 0) ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Eye className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No product views recorded yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyViews} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#viewsGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 Viewed Products (30 Days)</CardTitle>
            <CardDescription>Products visited most in your catalog</CardDescription>
          </CardHeader>
          <CardContent>
            {topPagesLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : !topPages || topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No page view data yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-2 text-muted-foreground font-medium w-6">#</th>
                      <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Product</th>
                      <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Brand</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((row, i) => (
                      <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-2 text-muted-foreground text-xs">{i + 1}</td>
                        <td className="py-2 pr-4">
                          {row.handle ? (
                            <Link
                              to={`/filament/${row.handle}`}
                              className="text-primary hover:underline text-xs truncate max-w-[160px] block"
                            >
                              {row.title}
                            </Link>
                          ) : (
                            <span className="text-xs truncate max-w-[160px] block">{row.title}</span>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant="secondary" className="text-xs">{row.vendor}</Badge>
                        </td>
                        <td className="py-2 text-right font-medium">{row.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Region Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Affiliate Click Regions (30 Days)</CardTitle>
            <CardDescription>Regional distribution of affiliate clicks (proxy for visitor geography)</CardDescription>
          </CardHeader>
          <CardContent>
            {regionLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : !regionData || regionData.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <BarChart2 className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No regional data yet</p>
              </div>
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
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                    }}
                    formatter={(value, name) => [value, REGION_LABELS[name as string] || name]}
                  />
                  <Legend formatter={(name) => REGION_LABELS[name] || name} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* External GA4 Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">External Analytics Tools</CardTitle>
          <CardDescription>
            For full visitor-level data (sessions, bounce rate, acquisition channels), use Google Analytics 4.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                label: "GA4 Overview Dashboard",
                desc: "Real-time + 30-day summary",
                href: "https://analytics.google.com/analytics/web/",
              },
              {
                label: "GA4 Audience Reports",
                desc: "Users, sessions, demographics",
                href: "https://analytics.google.com/analytics/web/#/pG-Q96R53VCKM/reports/explorer",
              },
              {
                label: "Google Search Console",
                desc: "Crawl status, queries, Core Web Vitals",
                href: "https://search.google.com/search-console",
              },
              {
                label: "Looker Studio",
                desc: "Custom cross-platform dashboards",
                href: "https://lookerstudio.google.com/",
              },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors group"
              >
                <div className="p-1.5 rounded bg-primary/10 shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
