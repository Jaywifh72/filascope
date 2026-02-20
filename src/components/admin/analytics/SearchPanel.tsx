import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Search, AlertCircle, ArrowRight } from "lucide-react";

export function SearchPanel() {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  const startDate = last30Days.toISOString();
  const startDateStr = last30Days.toISOString().slice(0, 10);

  // Top search terms aggregated
  const { data: topTerms, isLoading: termsLoading } = useQuery({
    queryKey: ["analytics-search-terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_logs")
        .select("search_term, results_count, created_at, session_id")
        .gte("created_at", startDate)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;

      const map: Record<string, { count: number; zeroCount: number; lastSeen: string }> = {};
      for (const row of data || []) {
        const term = row.search_term;
        if (!map[term]) map[term] = { count: 0, zeroCount: 0, lastSeen: row.created_at! };
        map[term].count++;
        if ((row.results_count ?? 0) === 0) map[term].zeroCount++;
        if (row.created_at! > map[term].lastSeen) map[term].lastSeen = row.created_at!;
      }
      return Object.entries(map)
        .map(([term, d]) => ({ term, count: d.count, zeroCount: d.zeroCount, lastSeen: d.lastSeen }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    },
  });

  // Zero-result view
  const { data: zeroResults, isLoading: zeroLoading } = useQuery({
    queryKey: ["analytics-zero-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_zero_results")
        .select("*")
        .order("search_count", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  // Search volume trend (daily)
  const { data: trendData } = useQuery({
    queryKey: ["analytics-search-trend"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_logs")
        .select("created_at")
        .gte("created_at", startDate)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const map: Record<string, number> = {};
      for (const row of data || []) {
        const day = row.created_at!.slice(0, 10);
        map[day] = (map[day] || 0) + 1;
      }
      return Object.entries(map).map(([date, count]) => ({ date, count }));
    },
  });

  // Search → Click Funnel: correlate search_logs.session_id with affiliate_clicks.session_id
  const { data: funnelData } = useQuery({
    queryKey: ["analytics-search-funnel"],
    queryFn: async () => {
      const [{ data: searchData }, { data: clickData }] = await Promise.all([
        supabase
          .from("search_logs")
          .select("session_id")
          .gte("created_at", startDate)
          .not("session_id", "is", null)
          .limit(5000),
        supabase
          .from("affiliate_clicks")
          .select("session_id")
          .gte("clicked_at", startDateStr)
          .not("session_id", "is", null)
          .limit(5000),
      ]);

      const searchSessions = new Set((searchData || []).map((r) => r.session_id!));
      const clickSessions = new Set((clickData || []).map((r) => r.session_id!));
      const converted = [...searchSessions].filter((s) => clickSessions.has(s)).length;
      const conversionRate =
        searchSessions.size > 0
          ? ((converted / searchSessions.size) * 100).toFixed(1)
          : "0.0";

      return {
        searchSessions: searchSessions.size,
        converted,
        conversionRate,
      };
    },
  });

  const isEmpty = !termsLoading && (!topTerms || topTerms.length === 0);

  if (isEmpty) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Search className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">No search data yet</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Search logs will appear here as users interact with the site's search features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Volume Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Volume (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {!trendData || trendData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No trend data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="searchGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
                />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#searchGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Search → Click Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search → Affiliate Click Funnel (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Step 1: Searches */}
            <div className="flex-1 min-w-[120px] rounded-lg bg-primary/10 border border-primary/20 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Search Sessions</p>
              <p className="text-2xl font-bold text-foreground">
                {funnelData ? funnelData.searchSessions.toLocaleString() : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">unique sessions w/ search</p>
            </div>

            <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />

            {/* Step 2: Product Views (placeholder) */}
            <div className="flex-1 min-w-[120px] rounded-lg bg-muted/40 border border-border p-4 text-center opacity-50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Product Views</p>
              <p className="text-2xl font-bold text-foreground">—</p>
              <p className="text-xs text-muted-foreground mt-0.5">page view tracking needed</p>
            </div>

            <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />

            {/* Step 3: Affiliate Clicks */}
            <div className="flex-1 min-w-[120px] rounded-lg bg-primary/10 border border-primary/20 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Affiliate Clicks</p>
              <p className="text-2xl font-bold text-foreground">
                {funnelData ? funnelData.converted.toLocaleString() : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {funnelData ? (
                  <>
                    <span className="text-foreground font-semibold">
                      {funnelData.conversionRate}%
                    </span>{" "}
                    conversion rate
                  </>
                ) : (
                  "sessions that also clicked"
                )}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Funnel correlates <code>session_id</code> across search logs and affiliate clicks within the same 30-day window.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Search Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Search Terms (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {termsLoading ? (
              <p className="text-sm text-muted-foreground py-4">Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Term</th>
                      <th className="text-right py-2 pr-2 font-medium text-muted-foreground">Searches</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">0-Results</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(topTerms || []).map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-4 font-medium">{row.term}</td>
                        <td className="py-2 pr-2 text-right">{row.count}</td>
                        <td className="py-2 text-right">
                          {row.zeroCount > 0 ? (
                            <Badge variant="destructive" className="text-xs">{row.zeroCount}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Zero-Result Searches */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <CardTitle className="text-base">Zero-Result Searches</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {zeroLoading ? (
              <p className="text-sm text-muted-foreground py-4">Loading…</p>
            ) : !zeroResults || zeroResults.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No zero-result searches — great!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Term</th>
                      <th className="text-right py-2 pr-2 font-medium text-muted-foreground">Count</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zeroResults.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-4 font-medium text-destructive">{row.search_term}</td>
                        <td className="py-2 pr-2 text-right">{row.search_count}</td>
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
    </div>
  );
}
