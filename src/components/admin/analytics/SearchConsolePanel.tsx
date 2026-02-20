import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  Search,
  TrendingUp,
  MousePointerClick,
  Eye,
  Target,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  AlertCircle,
  Lightbulb,
  RefreshCw,
  BookOpen,
  Star,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────

interface GscRow {
  id: string;
  date: string;
  query: string | null;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
  country: string | null;
  device: string | null;
}

type SortKey = "impressions" | "clicks" | "ctr" | "position";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCtr(v: number | null) {
  if (v == null) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function fmtPos(v: number | null) {
  if (v == null) return "—";
  return v.toFixed(1);
}

function positionColor(pos: number | null): string {
  if (pos == null) return "text-muted-foreground";
  if (pos <= 3) return "text-green-500";
  if (pos <= 10) return "text-yellow-500";
  if (pos <= 20) return "text-orange-500";
  return "text-destructive";
}

function truncatePage(page: string | null, maxLen = 60): string {
  if (!page) return "—";
  try {
    const u = new URL(page);
    const path = u.pathname + u.search;
    return path.length > maxLen ? path.slice(0, maxLen) + "…" : path;
  } catch {
    return page.length > maxLen ? page.slice(0, maxLen) + "…" : page;
  }
}

// ─── Setup Card ───────────────────────────────────────────────────────────────

function SetupCard({ onSync, syncing }: { onSync: () => void; syncing: boolean }) {
  // The service account email that must be added to Search Console.
  // Extracted from the GSC_SERVICE_ACCOUNT_JSON secret at runtime by the edge function,
  // but we surface the critical action here so the user knows exactly what to do.
  const serviceAccountNote =
    "Find the service account email in your GSC_SERVICE_ACCOUNT_JSON (the 'client_email' field) and add it as a Restricted user in Search Console.";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-primary" />
          <CardTitle>Connect Google Search Console</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground">
          Connect your Google Search Console service account to see search performance data,
          top queries, CTR trends, and content opportunities directly in this dashboard.
        </p>

        {/* Action required banner */}
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-sm text-destructive">
              Action Required — Grant Search Console Access
            </p>
            <p className="text-sm text-muted-foreground">
              Your service account JSON is saved. The only remaining step is to{" "}
              <strong>add the service account email as a user in Google Search Console</strong>.
              Once granted, click <em>Run Sync</em> below to pull data.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">{serviceAccountNote}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <p className="font-medium text-sm">Setup Checklist</p>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li className="line-through opacity-60">
              Go to Google Cloud → Service Accounts and create a service account
            </li>
            <li className="line-through opacity-60">
              Enable the <strong>Google Search Console API</strong> in your Cloud project
            </li>
            <li className="line-through opacity-60">
              Create a JSON key and save it as the <code className="bg-muted px-1 rounded text-xs">GSC_SERVICE_ACCOUNT_JSON</code> secret ✅
            </li>
            <li className="font-medium text-foreground">
              Go to{" "}
              <a
                href="https://search.google.com/search-console/users"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline inline-flex items-center gap-1"
              >
                Search Console → Settings → Users &amp; Permissions <ExternalLink className="w-3 h-3" />
              </a>{" "}
              and add the service account <code className="bg-muted px-1 rounded text-xs">client_email</code> as a{" "}
              <strong>Restricted user</strong> for <code className="bg-muted px-1 rounded text-xs">https://filascope.com</code>
            </li>
            <li>Come back here and click <strong>Run Sync</strong> below</li>
          </ol>
        </div>

        <Button onClick={onSync} disabled={syncing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Run Sync"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── KPI card ────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className="w-5 h-5 text-muted-foreground/60" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function SearchConsolePanel() {
  const [syncing, setSyncing] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("impressions");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  // Track whether a sync has succeeded in this session (covers the case where
  // the service account is now authorised but GSC hasn't returned data yet for
  // the requested date range — we still want to hide the "Action Required" banner)
  const [syncedSuccessfully, setSyncedSuccessfully] = useState(false);

  // Check if we have any data
  const { data: hasData, isLoading: checkingData } = useQuery({
    queryKey: ["gsc-has-data"],
    queryFn: async () => {
      const { count } = await supabase
        .from("search_console_data")
        .select("*", { count: "exact", head: true });
      return (count ?? 0) > 0;
    },
    staleTime: 1000 * 60 * 5,
  });

  // 28-day window
  const since = new Date();
  since.setDate(since.getDate() - 28);
  const sinceStr = since.toISOString().slice(0, 10);

  // KPIs — aggregate totals for 28 days
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["gsc-kpis", sinceStr],
    enabled: !!hasData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_console_data")
        .select("clicks, impressions, ctr, position")
        .gte("date", sinceStr);
      if (error) throw error;
      const rows = data ?? [];
      const totalClicks = rows.reduce((s, r) => s + (r.clicks ?? 0), 0);
      const totalImpressions = rows.reduce((s, r) => s + (r.impressions ?? 0), 0);
      const avgCtr = rows.length ? rows.reduce((s, r) => s + (r.ctr ?? 0), 0) / rows.length : 0;
      const avgPos = rows.length ? rows.reduce((s, r) => s + (r.position ?? 0), 0) / rows.length : 0;
      return { totalClicks, totalImpressions, avgCtr, avgPos };
    },
    staleTime: 1000 * 60 * 5,
  });

  // Top queries by impressions
  const { data: topQueries, isLoading: queriesLoading } = useQuery({
    queryKey: ["gsc-top-queries", sinceStr, sortKey, sortDir],
    enabled: !!hasData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_console_data")
        .select("query, clicks, impressions, ctr, position")
        .gte("date", sinceStr)
        .not("query", "is", null);
      if (error) throw error;

      // Aggregate by query
      const map: Record<string, { clicks: number; impressions: number; ctrSum: number; posSum: number; count: number }> = {};
      for (const r of data ?? []) {
        const q = r.query!;
        if (!map[q]) map[q] = { clicks: 0, impressions: 0, ctrSum: 0, posSum: 0, count: 0 };
        map[q].clicks += r.clicks ?? 0;
        map[q].impressions += r.impressions ?? 0;
        map[q].ctrSum += r.ctr ?? 0;
        map[q].posSum += r.position ?? 0;
        map[q].count++;
      }

      const rows = Object.entries(map).map(([query, d]) => ({
        query,
        clicks: d.clicks,
        impressions: d.impressions,
        ctr: d.count ? d.ctrSum / d.count : 0,
        position: d.count ? d.posSum / d.count : 0,
      }));

      rows.sort((a, b) => {
        const mul = sortDir === "desc" ? -1 : 1;
        return mul * (a[sortKey] - b[sortKey]);
      });

      return rows.slice(0, 25);
    },
    staleTime: 1000 * 60 * 5,
  });

  // Top pages by clicks
  const { data: topPages, isLoading: pagesLoading } = useQuery({
    queryKey: ["gsc-top-pages", sinceStr],
    enabled: !!hasData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_console_data")
        .select("page, clicks, impressions, ctr")
        .gte("date", sinceStr)
        .not("page", "is", null);
      if (error) throw error;

      const map: Record<string, { clicks: number; impressions: number; ctrSum: number; count: number }> = {};
      for (const r of data ?? []) {
        const p = r.page!;
        if (!map[p]) map[p] = { clicks: 0, impressions: 0, ctrSum: 0, count: 0 };
        map[p].clicks += r.clicks ?? 0;
        map[p].impressions += r.impressions ?? 0;
        map[p].ctrSum += r.ctr ?? 0;
        map[p].count++;
      }

      return Object.entries(map)
        .map(([page, d]) => ({
          page,
          clicks: d.clicks,
          impressions: d.impressions,
          ctr: d.count ? d.ctrSum / d.count : 0,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 15);
    },
    staleTime: 1000 * 60 * 5,
  });

  // CTR trend (daily average)
  const { data: ctrTrend, isLoading: trendLoading } = useQuery({
    queryKey: ["gsc-ctr-trend", sinceStr],
    enabled: !!hasData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_console_data")
        .select("date, ctr, clicks, impressions")
        .gte("date", sinceStr)
        .order("date", { ascending: true });
      if (error) throw error;

      const map: Record<string, { ctrSum: number; clicks: number; impressions: number; count: number }> = {};
      for (const r of data ?? []) {
        const d = r.date;
        if (!map[d]) map[d] = { ctrSum: 0, clicks: 0, impressions: 0, count: 0 };
        map[d].ctrSum += r.ctr ?? 0;
        map[d].clicks += r.clicks ?? 0;
        map[d].impressions += r.impressions ?? 0;
        map[d].count++;
      }

      return Object.entries(map).map(([date, d]) => ({
        date,
        ctr: d.count ? parseFloat(((d.ctrSum / d.count) * 100).toFixed(2)) : 0,
        clicks: d.clicks,
        impressions: d.impressions,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  // Position distribution
  const { data: posDistribution } = useQuery({
    queryKey: ["gsc-pos-dist", sinceStr],
    enabled: !!hasData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_console_data")
        .select("query, position")
        .gte("date", sinceStr)
        .not("position", "is", null)
        .not("query", "is", null);
      if (error) throw error;

      // Aggregate by query to get avg position per query
      const queryPos: Record<string, { sum: number; count: number }> = {};
      for (const r of data ?? []) {
        const q = r.query!;
        if (!queryPos[q]) queryPos[q] = { sum: 0, count: 0 };
        queryPos[q].sum += r.position ?? 0;
        queryPos[q].count++;
      }

      let top3 = 0, top10 = 0, top20 = 0, beyond = 0;
      for (const [, v] of Object.entries(queryPos)) {
        const avg = v.sum / v.count;
        if (avg <= 3) top3++;
        else if (avg <= 10) top10++;
        else if (avg <= 20) top20++;
        else beyond++;
      }

      return [
        { label: "Top 3", count: top3, color: "hsl(var(--chart-1, 142 71% 45%))" },
        { label: "4–10", count: top10, color: "hsl(var(--chart-2, 47 96% 53%))" },
        { label: "11–20", count: top20, color: "hsl(var(--chart-3, 21 90% 48%))" },
        { label: "20+", count: beyond, color: "hsl(var(--destructive))" },
      ];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Content opportunities
  const { data: opportunities } = useQuery({
    queryKey: ["gsc-opportunities", sinceStr],
    enabled: !!hasData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_console_data")
        .select("query, page, clicks, impressions, ctr, position")
        .gte("date", sinceStr)
        .not("query", "is", null);
      if (error) throw error;

      // Aggregate per query
      const map: Record<string, { clicks: number; impressions: number; ctrSum: number; posSum: number; count: number }> = {};
      for (const r of data ?? []) {
        const q = r.query!;
        if (!map[q]) map[q] = { clicks: 0, impressions: 0, ctrSum: 0, posSum: 0, count: 0 };
        map[q].clicks += r.clicks ?? 0;
        map[q].impressions += r.impressions ?? 0;
        map[q].ctrSum += r.ctr ?? 0;
        map[q].posSum += r.position ?? 0;
        map[q].count++;
      }

      const rows = Object.entries(map).map(([query, d]) => ({
        query,
        clicks: d.clicks,
        impressions: d.impressions,
        ctr: d.count ? d.ctrSum / d.count : 0,
        position: d.count ? d.posSum / d.count : 0,
      }));

      return {
        quickWins: rows
          .filter((r) => r.position >= 4 && r.position <= 20 && r.impressions >= 50)
          .sort((a, b) => b.impressions - a.impressions)
          .slice(0, 8),
        ctrUnderperformers: rows
          .filter((r) => r.position < 10 && r.ctr < 0.02 && r.impressions >= 30)
          .sort((a, b) => b.impressions - a.impressions)
          .slice(0, 8),
        highImpressionsLowClicks: rows
          .filter((r) => r.impressions >= 100 && r.clicks < 5)
          .sort((a, b) => b.impressions - a.impressions)
          .slice(0, 8),
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  // ─── Sync handler ──────────────────────────────────────────────────────────

  async function handleSync() {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-console-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ site_url: "https://filascope.com" }),
        }
      );
      const json = await resp.json();
      if (!resp.ok) {
        if (json.code === "NO_CREDENTIALS") {
          toast.error("GSC_SERVICE_ACCOUNT_JSON secret not configured. Follow the setup instructions above.");
        } else {
          toast.error(`Sync failed: ${json.error}`);
        }
      } else {
        // Mark as successfully connected — even if 0 rows returned (GSC may not
        // have data for very recent date ranges; the service account IS authorised)
        setSyncedSuccessfully(true);
        if (json.synced > 0) {
          toast.success(`Synced ${json.synced} rows from ${json.date_range}`);
        } else {
          toast.info(`Connected! No data yet for ${json.date_range} — GSC data typically has a 2–3 day delay. Try syncing again tomorrow.`);
        }
      }
    } catch (e) {
      toast.error(`Sync error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSyncing(false);
    }
  }

  // ─── Sort toggle ──────────────────────────────────────────────────────────

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortDir === "desc" ? (
      <ChevronDown className="w-3 h-3 inline ml-0.5" />
    ) : (
      <ChevronUp className="w-3 h-3 inline ml-0.5" />
    );
  }

  // ─── Loading skeleton ──────────────────────────────────────────────────────

  if (checkingData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  // ─── Not connected state ───────────────────────────────────────────────────

  if (!hasData && !syncedSuccessfully) {
    return (
      <div className="space-y-6">
        <SetupCard onSync={handleSync} syncing={syncing} />
      </div>
    );
  }

  // Synced successfully but no data yet (GSC data lag)
  if (!hasData && syncedSuccessfully) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Search className="w-6 h-6 text-primary" />
              <CardTitle>Google Search Console — Connected</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 flex gap-3">
              <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-sm text-primary">
                  Service account authorised successfully!
                </p>
                <p className="text-sm text-muted-foreground">
                  Google Search Console data typically has a <strong>2–3 day processing delay</strong>.
                  No rows were returned for the most recent date range — this is normal for a new connection.
                  Try syncing again tomorrow.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSync} disabled={syncing} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Try Sync Again"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Connected: full dashboard ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Last 28 days · Google Search Console</p>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync Now"}
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpisLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
          </>
        ) : (
          <>
            <KpiCard
              label="Total Clicks"
              value={(kpis?.totalClicks ?? 0).toLocaleString()}
              icon={MousePointerClick}
            />
            <KpiCard
              label="Total Impressions"
              value={(kpis?.totalImpressions ?? 0).toLocaleString()}
              icon={Eye}
            />
            <KpiCard
              label="Avg CTR"
              value={fmtCtr(kpis?.avgCtr ?? null)}
              icon={TrendingUp}
            />
            <KpiCard
              label="Avg Position"
              value={fmtPos(kpis?.avgPos ?? null)}
              icon={Target}
            />
          </>
        )}
      </div>

      {/* CTR Trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CTR Trend (28 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {trendLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !ctrTrend?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No trend data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ctrTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                  }}
                  formatter={(v: number) => [`${v}%`, "CTR"]}
                />
                <Line
                  type="monotone"
                  dataKey="ctr"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Position distribution */}
      {posDistribution && posDistribution.some((d) => d.count > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Position Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {posDistribution.map((d) => (
                <div key={d.label} className="rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-bold" style={{ color: d.color }}>
                    {d.count}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{d.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queries + Pages tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Queries by Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            {queriesLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-2 font-medium text-muted-foreground">Query</th>
                      {(["impressions", "clicks", "ctr", "position"] as SortKey[]).map((k) => (
                        <th
                          key={k}
                          className="text-right py-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap px-1"
                          onClick={() => toggleSort(k)}
                        >
                          {k === "ctr" ? "CTR" : k === "position" ? "Pos" : k.charAt(0).toUpperCase() + k.slice(1)}
                          <SortIcon k={k} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(topQueries ?? []).map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-2 max-w-[160px] truncate font-medium" title={row.query}>
                          {row.query}
                        </td>
                        <td className="py-2 text-right px-1">{row.impressions.toLocaleString()}</td>
                        <td className="py-2 text-right px-1">{row.clicks.toLocaleString()}</td>
                        <td className="py-2 text-right px-1">{fmtCtr(row.ctr)}</td>
                        <td className={`py-2 text-right px-1 font-medium ${positionColor(row.position)}`}>
                          {fmtPos(row.position)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Pages by Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            {pagesLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-2 font-medium text-muted-foreground">Page</th>
                      <th className="text-right py-2 px-1 font-medium text-muted-foreground">Clicks</th>
                      <th className="text-right py-2 px-1 font-medium text-muted-foreground">Impr</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(topPages ?? []).map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-2 max-w-[180px] truncate" title={row.page}>
                          <a
                            href={row.page}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {truncatePage(row.page)}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </td>
                        <td className="py-2 text-right px-1 font-medium">{row.clicks.toLocaleString()}</td>
                        <td className="py-2 text-right px-1">{row.impressions.toLocaleString()}</td>
                        <td className="py-2 text-right">{fmtCtr(row.ctr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Opportunities */}
      {opportunities && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-base">Content Opportunities</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Quick Wins */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm">Quick Wins (Pos 4–20)</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                  Queries almost on page 1 — optimize existing pages to capture more clicks
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {opportunities.quickWins.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">None found</p>
                ) : (
                  <ul className="space-y-2">
                    {opportunities.quickWins.map((r, i) => (
                      <li key={i} className="flex items-start justify-between gap-2 text-xs">
                        <span className="truncate text-foreground" title={r.query}>
                          {r.query}
                        </span>
                        <span className={`shrink-0 font-medium ${positionColor(r.position)}`}>
                          #{fmtPos(r.position)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* CTR underperformers */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <CardTitle className="text-sm">CTR &lt;2% (Top 10)</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ranking well but not getting clicks — improve title &amp; meta description
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {opportunities.ctrUnderperformers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">None found</p>
                ) : (
                  <ul className="space-y-2">
                    {opportunities.ctrUnderperformers.map((r, i) => (
                      <li key={i} className="flex items-start justify-between gap-2 text-xs">
                        <span className="truncate text-foreground" title={r.query}>
                          {r.query}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {fmtCtr(r.ctr)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* High impressions low clicks */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-secondary-foreground" />
                  <CardTitle className="text-sm">High Impressions, Low Clicks</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lots of visibility but few clicks — consider dedicated landing pages
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {opportunities.highImpressionsLowClicks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">None found</p>
                ) : (
                  <ul className="space-y-2">
                    {opportunities.highImpressionsLowClicks.map((r, i) => (
                      <li key={i} className="flex items-start justify-between gap-2 text-xs">
                        <span className="truncate text-foreground" title={r.query}>
                          {r.query}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {r.impressions.toLocaleString()} impr
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
