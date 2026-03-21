import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, BarChart2, Users, Eye, Clock, RefreshCw, Monitor, Smartphone, Tablet, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useGa4Kpis,
  useGa4DailyTrend,
  useGa4TopPages,
  useGa4TrafficSources,
  useGa4Devices,
  useSyncGa4,
  useGa4HasData,
  type DateRange,
} from "@/hooks/useGa4Analytics";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const GA4_MEASUREMENT_ID = "G-Q96R53VCKM";
const GA4_BASE = "https://analytics.google.com";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
const DEVICE_ICONS: Record<string, any> = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({ title, value, icon: Icon, subtitle }: {
  title: string; value: string; icon: any; subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Setup State ────────────────────────────────────────────────────────────

function SetupCard({ onSync, syncing }: { onSync: () => void; syncing: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="p-4 rounded-full bg-primary/10">
          <BarChart2 className="w-8 h-8 text-primary" />
        </div>
        <div>
          <p className="font-medium text-lg">GA4 Analytics Dashboard</p>
          <p className="text-sm text-muted-foreground max-w-md mt-2">
            Fetch real traffic data from Google Analytics 4. Make sure the service account
            email has been added as a Viewer in your GA4 property, and the GA4_PROPERTY_ID
            secret is set in Supabase.
          </p>
        </div>
        <Button onClick={onSync} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Run First Sync"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function TrafficPanel() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const { toast } = useToast();

  const { data: hasData, isLoading: checkingData } = useGa4HasData();
  const { data: kpis } = useGa4Kpis(dateRange);
  const { data: trend } = useGa4DailyTrend(dateRange);
  const { data: topPages } = useGa4TopPages(dateRange);
  const { data: sources } = useGa4TrafficSources(dateRange);
  const { data: devices } = useGa4Devices(dateRange);
  const syncMutation = useSyncGa4();

  function handleSync() {
    syncMutation.mutate(dateRange, {
      onSuccess: (data) => {
        toast({ title: "GA4 Sync Complete", description: `Synced ${data.synced ?? 0} data points (${dateRange})` });
      },
      onError: (err) => {
        toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
      },
    });
  }

  if (checkingData) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;
  }

  if (!hasData) {
    return <SetupCard onSync={handleSync} syncing={syncMutation.isPending} />;
  }

  return (
    <div className="space-y-6">
      {/* Header: Date range + Sync */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          {(["7d", "30d", "90d"] as DateRange[]).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={dateRange === r ? "default" : "ghost"}
              className="text-xs h-7 px-3"
              onClick={() => setDateRange(r)}
            >
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncMutation.isPending}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          Sync
        </Button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Sessions" value={formatNumber(kpis.totalSessions)} icon={TrendingUp} subtitle={`Last ${dateRange}`} />
          <KpiCard title="Users" value={formatNumber(kpis.totalUsers)} icon={Users} subtitle={`Last ${dateRange}`} />
          <KpiCard title="Pageviews" value={formatNumber(kpis.totalPageviews)} icon={Eye} subtitle={`Last ${dateRange}`} />
          <KpiCard title="Bounce Rate" value={`${(kpis.avgBounceRate * 100).toFixed(1)}%`} icon={Clock} subtitle={`Avg. ${formatDuration(kpis.avgSessionDuration)} session`} />
        </div>
      )}

      {/* Sessions Trend Chart */}
      {trend && trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessions Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: "#888", fontSize: 11 }} />
                <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 6 }}
                  labelFormatter={formatDate}
                />
                <Area type="monotone" dataKey="sessions" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="totalUsers" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Pages + Traffic Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages Table */}
        {topPages && topPages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr_80px_60px] text-xs text-muted-foreground font-medium pb-2 border-b border-border">
                  <span>Page</span>
                  <span className="text-right">Views</span>
                  <span className="text-right">Users</span>
                </div>
                {topPages.slice(0, 10).map((page, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_60px] text-sm py-1.5 border-b border-border/50 last:border-0">
                    <span className="truncate font-mono text-xs text-foreground/80">{page.path}</span>
                    <span className="text-right tabular-nums">{formatNumber(page.pageviews)}</span>
                    <span className="text-right tabular-nums text-muted-foreground">{formatNumber(page.users)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Traffic Sources */}
        {sources && sources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sources} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }} />
                  <YAxis dataKey="channel" type="category" tick={{ fill: "#888", fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 6 }} />
                  <Bar dataKey="sessions" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Device Breakdown */}
      {devices && devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={devices}
                      dataKey="sessions"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      strokeWidth={2}
                      stroke="#1a1a2e"
                    >
                      {devices.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 6 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {devices.map((dev, i) => {
                  const DevIcon = DEVICE_ICONS[dev.category.toLowerCase()] ?? Monitor;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <DevIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm capitalize flex-1">{dev.category}</span>
                      <span className="text-sm font-medium tabular-nums">{formatNumber(dev.sessions)}</span>
                      <span className="text-xs text-muted-foreground w-12 text-right">{dev.percentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* External Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">External Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "GA4 Dashboard", href: `${GA4_BASE}/analytics/web/` },
              { label: "Looker Studio", href: "https://lookerstudio.google.com/" },
              { label: "Search Console", href: "https://search.google.com/search-console" },
              { label: "Bing Webmaster", href: "https://www.bing.com/webmasters" },
            ].map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors p-2 rounded border border-border/50 hover:border-border">
                <ExternalLink className="w-3 h-3 shrink-0" />
                {link.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
