import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Package, DollarSign, Image, FileText, Tag } from "lucide-react";
import { useDealsCount } from "@/hooks/useDealsCount";
import { format } from "date-fns";

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            )}
            {sub && !loading && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
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

function pct(part: number, total: number) {
  if (!total) return "—";
  return `${((part / total) * 100).toFixed(1)}%`;
}

export function ContentMetricsPanel() {
  // Product completeness
  const { data: completeness, isLoading: completenessLoading } = useQuery({
    queryKey: ["content-metrics-completeness"],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { count: total } = await supabase
        .from("filaments")
        .select("id", { count: "exact", head: true });

      const { count: withPrice } = await supabase
        .from("filaments")
        .select("id", { count: "exact", head: true })
        .not("variant_price", "is", null);

      const { count: withImage } = await supabase
        .from("filaments")
        .select("id", { count: "exact", head: true })
        .not("featured_image", "is", null);

      const { count: withTds } = await supabase
        .from("filaments")
        .select("id", { count: "exact", head: true })
        .not("tds_url", "is", null);

      return {
        total: total ?? 0,
        withPrice: withPrice ?? 0,
        withImage: withImage ?? 0,
        withTds: withTds ?? 0,
      };
    },
  });

  // Material breakdown (top 12)
  const { data: materialData, isLoading: materialLoading } = useQuery({
    queryKey: ["content-metrics-materials"],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("material")
        .not("material", "is", null)
        .limit(10000);
      if (error) throw error;

      const map: Record<string, number> = {};
      for (const row of data || []) {
        const m = row.material || "Unknown";
        map[m] = (map[m] || 0) + 1;
      }
      return Object.entries(map)
        .map(([material, count]) => ({ material, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
    },
  });

  // Recently added (10)
  const { data: recentProducts, isLoading: recentLoading } = useQuery({
    queryKey: ["content-metrics-recent"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("product_title, vendor, material, variant_price, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  // Deals discount distribution
  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ["content-metrics-deals-distribution"],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("variant_price, variant_compare_at_price")
        .not("variant_compare_at_price", "is", null)
        .not("variant_price", "is", null)
        .gt("variant_compare_at_price", 0)
        .limit(5000);
      if (error) throw error;

      let b1 = 0, b2 = 0, b3 = 0, b4 = 0;
      for (const row of data || []) {
        const cap = row.variant_compare_at_price!;
        const price = row.variant_price!;
        if (cap <= price) continue;
        const pctOff = ((cap - price) / cap) * 100;
        if (pctOff >= 10 && pctOff < 20) b1++;
        else if (pctOff >= 20 && pctOff < 30) b2++;
        else if (pctOff >= 30 && pctOff < 50) b3++;
        else if (pctOff >= 50) b4++;
      }
      return [
        { bracket: "10–20%", count: b1 },
        { bracket: "20–30%", count: b2 },
        { bracket: "30–50%", count: b3 },
        { bracket: "50%+", count: b4 },
      ];
    },
  });

  const { data: dealsCount, isLoading: dealsCountLoading } = useDealsCount();

  const total = completeness?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard
          label="Total Products"
          value={completeness?.total.toLocaleString() ?? "—"}
          icon={Package}
          loading={completenessLoading}
        />
        <KpiCard
          label="With Price"
          value={completeness?.withPrice.toLocaleString() ?? "—"}
          sub={pct(completeness?.withPrice ?? 0, total)}
          icon={DollarSign}
          loading={completenessLoading}
        />
        <KpiCard
          label="With Image"
          value={completeness?.withImage.toLocaleString() ?? "—"}
          sub={pct(completeness?.withImage ?? 0, total)}
          icon={Image}
          loading={completenessLoading}
        />
        <KpiCard
          label="With TDS"
          value={completeness?.withTds.toLocaleString() ?? "—"}
          sub={pct(completeness?.withTds ?? 0, total)}
          icon={FileText}
          loading={completenessLoading}
        />
        <KpiCard
          label="Active Deals"
          value={dealsCount?.totalVariants.toLocaleString() ?? "—"}
          sub="compare price set"
          icon={Tag}
          loading={dealsCountLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Products by Material (Top 12)</CardTitle>
          </CardHeader>
          <CardContent>
            {materialLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : !materialData || materialData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={materialData} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="material"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Deals Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Discount Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {dealsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dealsData} margin={{ top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="bracket"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 6,
                      }}
                    />
                    <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Products with <code>compare_at_price &gt; price</code>, grouped by % off
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recently Added Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recently Added Products</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !recentProducts || recentProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No products yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Brand</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Material</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Price</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2 pr-4 max-w-[220px] truncate font-medium">
                        {row.product_title || "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="secondary" className="text-xs">
                          {row.vendor || "—"}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{row.material || "—"}</td>
                      <td className="py-2 pr-4 text-right font-medium">
                        {row.variant_price ? `$${row.variant_price.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2 text-right text-muted-foreground text-xs">
                        {row.created_at
                          ? format(new Date(row.created_at), "MMM d, yyyy")
                          : "—"}
                      </td>
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
