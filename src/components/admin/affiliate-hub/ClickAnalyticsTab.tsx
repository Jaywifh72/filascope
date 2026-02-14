import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, subDays, formatDistanceToNow } from "date-fns";
import {
  CalendarIcon, Download, MousePointerClick, Users, Trophy,
  FileText, Zap, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  LazyChartWrapper, LazyResponsiveContainer, LazyLineChart, LazyBarChart, LazyPieChart,
} from "@/components/LazyChart";
import { lazy, Suspense } from "react";
import {
  useClickSummary, useClicksByDay, useClicksToday, useRecentClicks,
  useDistinctBrandNames,
  type ClickFilters,
} from "@/hooks/useAffiliateClickAnalytics";

// Lazy load recharts primitives we need
const Line = lazy(() => import("recharts").then((m) => ({ default: m.Line })));
const Bar = lazy(() => import("recharts").then((m) => ({ default: m.Bar })));
const Pie = lazy(() => import("recharts").then((m) => ({ default: m.Pie })));
const Cell = lazy(() => import("recharts").then((m) => ({ default: m.Cell })));
const XAxis = lazy(() => import("recharts").then((m) => ({ default: m.XAxis })));
const YAxis = lazy(() => import("recharts").then((m) => ({ default: m.YAxis })));
const CartesianGrid = lazy(() => import("recharts").then((m) => ({ default: m.CartesianGrid })));
const Tooltip = lazy(() => import("recharts").then((m) => ({ default: m.Tooltip })));
const Legend = lazy(() => import("recharts").then((m) => ({ default: m.Legend })));

const CHART_COLORS = [
  "hsl(187, 100%, 46%)", // primary cyan
  "hsl(142, 71%, 45%)", // green
  "hsl(38, 92%, 50%)",  // orange/amber
  "hsl(262, 83%, 58%)", // purple
  "hsl(345, 82%, 53%)", // red/pink
  "hsl(199, 89%, 48%)", // blue
  "hsl(47, 96%, 53%)",  // yellow
];

const REGION_OPTIONS = ["US", "CA", "EU", "UK", "AU"];

const PRESETS = [
  { label: "Today", days: 0 },
  { label: "7 Days", days: 7 },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
  { label: "All Time", days: 365 * 5 },
] as const;

function toDateStr(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function ClickAnalyticsTab() {
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(subDays(today, 30));
  const [endDate, setEndDate] = useState<Date>(today);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  const filters: ClickFilters = useMemo(() => ({
    startDate: toDateStr(startDate),
    endDate: toDateStr(endDate),
    brandNames: selectedBrands.length ? selectedBrands : null,
    regionCodes: selectedRegions.length ? selectedRegions : null,
  }), [startDate, endDate, selectedBrands, selectedRegions]);

  const { data: summary, isLoading: summaryLoading } = useClickSummary(filters);
  const { data: dailyData = [], isLoading: dailyLoading } = useClicksByDay(filters);
  const { data: clicksToday = 0 } = useClicksToday();
  const { data: recentData, isLoading: recentLoading } = useRecentClicks(filters, page);
  const { data: allBrands = [] } = useDistinctBrandNames();

  // Aggregate daily data for chart (pivot brands into columns)
  const lineChartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();
    for (const row of dailyData) {
      if (!dateMap.has(row.click_date)) dateMap.set(row.click_date, {});
      const entry = dateMap.get(row.click_date)!;
      entry[row.brand_name] = (entry[row.brand_name] || 0) + Number(row.click_count);
      entry._total = (entry._total || 0) + Number(row.click_count);
    }
    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date: format(new Date(date + "T00:00:00"), "MMM d"), ...vals }));
  }, [dailyData]);

  const brandNames = useMemo(() => {
    const set = new Set(dailyData.map((d) => d.brand_name));
    return Array.from(set).sort();
  }, [dailyData]);

  // Aggregate by brand for bar chart
  const brandBarData = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of dailyData) {
      map.set(row.brand_name, (map.get(row.brand_name) || 0) + Number(row.click_count));
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [dailyData]);

  // Aggregate by source_component for pie chart
  const componentPieData = useMemo(() => {
    if (!recentData?.clicks.length) return [];
    const map = new Map<string, number>();
    for (const c of recentData.clicks) {
      const comp = c.source_component || "other";
      map.set(comp, (map.get(comp) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [recentData]);

  // Aggregate by region
  const regionData = useMemo(() => {
    if (!recentData?.clicks.length) return [];
    const map = new Map<string, number>();
    for (const c of recentData.clicks) {
      map.set(c.region_code, (map.get(c.region_code) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  }, [recentData]);

  const setPreset = useCallback((days: number) => {
    setEndDate(new Date());
    setStartDate(days === 0 ? new Date() : subDays(new Date(), days));
    setPage(0);
  }, []);

  const toggleBrand = useCallback((brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
    setPage(0);
  }, []);

  const toggleRegion = useCallback((region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
    setPage(0);
  }, []);

  const exportCsv = useCallback(() => {
    if (!recentData?.clicks.length) return;
    const headers = ["Time", "Brand", "Region", "Product", "Source Page", "Component", "URL"];
    const rows = recentData.clicks.map((c) => [
      c.clicked_at || "", c.brand_name, c.region_code, c.product_name || "",
      c.source_page, c.source_component || "", c.destination_url,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `affiliate-clicks-${filters.startDate}-to-${filters.endDate}.csv`;
    a.click();
  }, [recentData, filters]);

  const totalPages = Math.ceil((recentData?.totalCount || 0) / 100);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <CardContent className="py-4 flex flex-wrap items-center gap-3">
          {/* Presets */}
          <div className="flex gap-1.5">
            {PRESETS.map((p) => (
              <Button key={p.label} variant="outline" size="sm" onClick={() => setPreset(p.days)}
                className="text-xs">
                {p.label}
              </Button>
            ))}
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Date pickers */}
          <DatePick label="From" date={startDate} onSelect={(d) => { setStartDate(d); setPage(0); }} />
          <DatePick label="To" date={endDate} onSelect={(d) => { setEndDate(d); setPage(0); }} />

          <div className="h-6 w-px bg-border" />

          {/* Brand filter */}
          <div className="flex flex-wrap gap-1.5">
            {allBrands.slice(0, 8).map((b) => (
              <Badge key={b} variant={selectedBrands.includes(b) ? "default" : "outline"}
                className="cursor-pointer text-xs" onClick={() => toggleBrand(b)}>
                {b}
              </Badge>
            ))}
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Region filter */}
          <div className="flex gap-1.5">
            {REGION_OPTIONS.map((r) => (
              <Badge key={r} variant={selectedRegions.includes(r) ? "default" : "outline"}
                className="cursor-pointer text-xs" onClick={() => toggleRegion(r)}>
                {r}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard icon={MousePointerClick} label="Total Clicks" value={summary?.total_clicks} loading={summaryLoading} />
        <MetricCard icon={Users} label="Unique Sessions" value={summary?.unique_sessions} loading={summaryLoading} />
        <MetricCard icon={Trophy} label="Top Brand" value={summary?.top_brand || "—"} loading={summaryLoading} isText />
        <MetricCard icon={FileText} label="Top Source" value={summary?.top_source_page || "—"} loading={summaryLoading} isText />
        <MetricCard icon={Zap} label="Clicks Today" value={clicksToday} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks Over Time */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Clicks Over Time</CardTitle></CardHeader>
          <CardContent>
            {dailyLoading ? <Skeleton className="h-64 w-full" /> : lineChartData.length === 0 ? (
              <p className="text-muted-foreground text-center py-16 text-sm">No click data for this period</p>
            ) : (
              <LazyChartWrapper height={260}>
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <LazyResponsiveContainer width="100%" height={260}>
                    <LazyLineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      {brandNames.length <= 1 ? (
                        <Line type="monotone" dataKey="_total" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
                      ) : (
                        brandNames.map((b, i) => (
                          <Line key={b} type="monotone" dataKey={b} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} />
                        ))
                      )}
                      {brandNames.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
                    </LazyLineChart>
                  </LazyResponsiveContainer>
                </Suspense>
              </LazyChartWrapper>
            )}
          </CardContent>
        </Card>

        {/* Clicks by Brand */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Clicks by Brand</CardTitle></CardHeader>
          <CardContent>
            {dailyLoading ? <Skeleton className="h-64 w-full" /> : brandBarData.length === 0 ? (
              <p className="text-muted-foreground text-center py-16 text-sm">No data</p>
            ) : (
              <LazyChartWrapper height={260}>
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <LazyResponsiveContainer width="100%" height={260}>
                    <LazyBarChart data={brandBarData} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={75} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {brandBarData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </LazyBarChart>
                  </LazyResponsiveContainer>
                </Suspense>
              </LazyChartWrapper>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Component Donut */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Clicks by Source Component</CardTitle></CardHeader>
          <CardContent>
            {recentLoading ? <Skeleton className="h-48 w-full" /> : componentPieData.length === 0 ? (
              <p className="text-muted-foreground text-center py-12 text-sm">No data</p>
            ) : (
              <LazyChartWrapper height={220}>
                <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                  <LazyResponsiveContainer width="100%" height={220}>
                    <LazyPieChart>
                      <Pie data={componentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80} paddingAngle={3}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        style={{ fontSize: 10 }}>
                        {componentPieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    </LazyPieChart>
                  </LazyResponsiveContainer>
                </Suspense>
              </LazyChartWrapper>
            )}
          </CardContent>
        </Card>

        {/* Region Distribution */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Clicks by Region</CardTitle></CardHeader>
          <CardContent>
            {recentLoading ? <Skeleton className="h-48 w-full" /> : regionData.length === 0 ? (
              <p className="text-muted-foreground text-center py-12 text-sm">No data</p>
            ) : (
              <div className="flex flex-wrap gap-3 py-4">
                {regionData.map((r, i) => (
                  <div key={r.region}
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 min-w-[100px]">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <div>
                      <div className="text-xs text-muted-foreground">{r.region}</div>
                      <div className="text-lg font-bold">{r.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Clicks Table */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Recent Clicks</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!recentData?.clicks.length}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !recentData?.clicks.length ? (
            <p className="text-muted-foreground text-center py-8 text-sm">No clicks found for the selected filters</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Time</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Destination</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentData.clicks.map((click) => (
                    <TableRow key={click.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {click.clicked_at ? formatDistanceToNow(new Date(click.clicked_at), { addSuffix: true }) : "—"}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{click.brand_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{click.region_code}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{click.product_name || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{click.source_page}</TableCell>
                      <TableCell className="text-xs">{click.source_component || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <a href={click.destination_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline">
                          {click.destination_url.replace(/^https?:\/\//, "").slice(0, 40)}…
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs text-muted-foreground">
                    Page {page + 1} of {totalPages} ({recentData.totalCount} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Helper Components ─── */

function MetricCard({ icon: Icon, label, value, loading, isText }: {
  icon: React.ElementType; label: string; value?: string | number | null; loading?: boolean; isText?: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="h-5 w-16 mt-1" /> : (
            <p className={cn("font-bold truncate", isText ? "text-sm" : "text-lg")}>
              {typeof value === "number" ? value.toLocaleString() : value || "—"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DatePick({ label, date, onSelect }: { label: string; date: Date; onSelect: (d: Date) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5" />
          {label}: {format(date, "MMM d, yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date}
          onSelect={(d) => d && onSelect(d)}
          className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  );
}
