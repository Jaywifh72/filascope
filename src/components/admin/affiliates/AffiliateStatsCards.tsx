import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MousePointerClick, TrendingUp, CalendarDays, Trophy } from "lucide-react";

const REGION_OPTIONS = ["All", "AU", "UK", "US", "CA", "EU", "GLOBAL"];

export function AffiliateStatsCards() {
  const [regionFilter, setRegionFilter] = useState("All");

  const { data: stats } = useQuery({
    queryKey: ["affiliate-admin-stats", regionFilter],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfWeek = new Date(now.getTime() - now.getDay() * 86400000).toISOString().slice(0, 10);

      const applyRegion = (q: any) =>
        regionFilter !== "All" ? q.eq("region_code", regionFilter) : q;

      const [allTime, month, week, topBrand] = await Promise.all([
        applyRegion(supabase.from("affiliate_clicks").select("id", { count: "exact", head: true })),
        applyRegion(supabase.from("affiliate_clicks").select("id", { count: "exact", head: true }).gte("clicked_at", startOfMonth)),
        applyRegion(supabase.from("affiliate_clicks").select("id", { count: "exact", head: true }).gte("clicked_at", startOfWeek)),
        applyRegion(supabase.from("affiliate_clicks").select("brand_name").gte("clicked_at", startOfMonth).limit(1000)),
      ]);

      let topBrandName = "—";
      let topBrandCount = 0;
      if (topBrand.data && topBrand.data.length > 0) {
        const counts: Record<string, number> = {};
        topBrand.data.forEach((r: any) => { counts[r.brand_name] = (counts[r.brand_name] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (sorted[0]) { topBrandName = sorted[0][0]; topBrandCount = sorted[0][1]; }
      }

      return {
        allTime: allTime.count || 0,
        month: month.count || 0,
        week: week.count || 0,
        topBrandName,
        topBrandCount,
      };
    },
    staleTime: 30_000,
  });

  const cards = [
    { label: "Total Clicks", value: stats?.allTime ?? "—", icon: MousePointerClick },
    { label: "This Month", value: stats?.month ?? "—", icon: CalendarDays },
    { label: "This Week", value: stats?.week ?? "—", icon: TrendingUp },
    { label: "Top Brand (Month)", value: stats ? `${stats.topBrandName} (${stats.topBrandCount})` : "—", icon: Trophy },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Region:</span>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[100px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REGION_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
