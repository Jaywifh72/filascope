import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MousePointerClick, TrendingUp, CalendarDays, Trophy } from "lucide-react";

export function AffiliateStatsCards() {
  const { data: stats } = useQuery({
    queryKey: ["affiliate-admin-stats"],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfWeek = new Date(now.getTime() - now.getDay() * 86400000).toISOString().slice(0, 10);

      const [allTime, month, week, topBrand] = await Promise.all([
        supabase.from("affiliate_clicks").select("id", { count: "exact", head: true }),
        supabase.from("affiliate_clicks").select("id", { count: "exact", head: true }).gte("clicked_at", startOfMonth),
        supabase.from("affiliate_clicks").select("id", { count: "exact", head: true }).gte("clicked_at", startOfWeek),
        supabase.from("affiliate_clicks").select("brand_name").gte("clicked_at", startOfMonth).limit(1000),
      ]);

      let topBrandName = "—";
      let topBrandCount = 0;
      if (topBrand.data && topBrand.data.length > 0) {
        const counts: Record<string, number> = {};
        topBrand.data.forEach((r) => { counts[r.brand_name] = (counts[r.brand_name] || 0) + 1; });
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
  );
}
