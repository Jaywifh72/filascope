import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Eye, GitCompare } from "lucide-react";
import { Link } from "react-router-dom";

export function ContentGapsPanel() {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  const startDate = last30Days.toISOString();

  // Zero-result searches ranked
  const { data: zeroResults, isLoading: zeroLoading } = useQuery({
    queryKey: ["content-gaps-zero-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_zero_results")
        .select("*")
        .order("search_count", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  // Brands with click distribution (low-CTR proxy using source_page frequency)
  const { data: brandCtr, isLoading: brandLoading } = useQuery({
    queryKey: ["content-gaps-brand-ctr"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_clicks")
        .select("brand_name, source_page, session_id")
        .gte("clicked_at", startDate)
        .limit(1000);
      if (error) throw error;

      // Group by brand: count clicks and unique source pages as proxy for reach
      const map: Record<string, { clicks: number; pages: Set<string>; sessions: Set<string> }> = {};
      for (const row of data || []) {
        const b = row.brand_name || "Unknown";
        if (!map[b]) map[b] = { clicks: 0, pages: new Set(), sessions: new Set() };
        map[b].clicks++;
        map[b].pages.add(row.source_page || "");
        if (row.session_id) map[b].sessions.add(row.session_id);
      }

      return Object.entries(map)
        .map(([brand, d]) => ({
          brand,
          clicks: d.clicks,
          uniquePages: d.pages.size,
          uniqueSessions: d.sessions.size,
          // clicks per page as CTR proxy — lower means more pages with fewer clicks
          ctrProxy: d.clicks / Math.max(d.pages.size, 1),
        }))
        .sort((a, b) => a.ctrProxy - b.ctrProxy) // lowest CTR first
        .slice(0, 10);
    },
  });

  // Source pages with high frequency (brands viewed a lot but page might lack buy buttons)
  const { data: topSourcePages, isLoading: pagesLoading } = useQuery({
    queryKey: ["content-gaps-source-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_clicks")
        .select("source_page, brand_name, session_id")
        .gte("clicked_at", startDate)
        .limit(1000);
      if (error) throw error;

      const map: Record<string, { clicks: number; brands: Set<string>; sessions: Set<string> }> = {};
      for (const row of data || []) {
        const p = row.source_page || "unknown";
        if (!map[p]) map[p] = { clicks: 0, brands: new Set(), sessions: new Set() };
        map[p].clicks++;
        map[p].brands.add(row.brand_name || "");
        if (row.session_id) map[p].sessions.add(row.session_id);
      }

      return Object.entries(map)
        .map(([page, d]) => ({
          page,
          clicks: d.clicks,
          brands: d.brands.size,
          sessions: d.sessions.size,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);
    },
  });

  // Most viewed products WITHOUT affiliate clicks (UX gap detector)
  const { data: noClickProducts, isLoading: noClickLoading } = useQuery({
    queryKey: ["content-gaps-no-click-products"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const since = thirtyDaysAgo.toISOString();

      const [{ data: browseRows }, { data: clickRows }] = await Promise.all([
        supabase.from("user_browse_history").select("filament_id").gte("viewed_at", since).not("filament_id", "is", null),
        supabase.from("affiliate_clicks").select("product_id").gte("clicked_at", since).not("product_id", "is", null),
      ]);

      const clickedIds = new Set((clickRows || []).map((r) => r.product_id));
      const viewMap: Record<string, number> = {};
      for (const row of browseRows || []) {
        if (row.filament_id && !clickedIds.has(row.filament_id)) {
          viewMap[row.filament_id] = (viewMap[row.filament_id] || 0) + 1;
        }
      }

      const topIds = Object.entries(viewMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([id]) => id);

      if (topIds.length === 0) return [];

      const { data: filaments } = await supabase
        .from("filaments")
        .select("id, product_title, vendor, product_handle, variant_price")
        .in("id", topIds);

      return (filaments || [])
        .map((f) => ({ ...f, views: viewMap[f.id] || 0 }))
        .sort((a, b) => b.views - a.views);
    },
  });

  const hasNoData =
    !zeroLoading &&
    !brandLoading &&
    !pagesLoading &&
    (!zeroResults || zeroResults.length === 0) &&
    (!brandCtr || brandCtr.length === 0);

  if (hasNoData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertTriangle className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">No content gap data yet</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            As users search and click affiliate links, content gaps will be identified here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Zero-result searches */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <div>
              <CardTitle className="text-base">Zero-Result Searches</CardTitle>
              <CardDescription>These terms found nothing — potential content to create</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {zeroLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : !zeroResults || zeroResults.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No zero-result searches recorded 🎉
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Search Term</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Searches</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Sessions</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {zeroResults.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-4 font-medium text-muted-foreground italic">
                        "{row.search_term}"
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <Badge variant="secondary">{row.search_count}</Badge>
                      </td>
                      <td className="py-2 pr-4 text-right text-muted-foreground">{row.unique_sessions}</td>
                      <td className="py-2">
                        <span className="text-xs text-muted-foreground italic">→ Create guide or add products</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brands with low CTR */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Brands — Low Click Efficiency</CardTitle>
                <CardDescription>Brands appearing across many pages but with low clicks per page</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {brandLoading ? (
              <p className="text-sm text-muted-foreground py-4">Loading…</p>
            ) : !brandCtr || brandCtr.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No data yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Brand</th>
                      <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Clicks</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Pages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brandCtr.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-4 font-medium">{row.brand}</td>
                        <td className="py-2 pr-4 text-right">{row.clicks}</td>
                        <td className="py-2 text-right text-muted-foreground">{row.uniquePages}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top source pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Source Pages (30 Days)</CardTitle>
            <CardDescription>Pages driving the most affiliate clicks</CardDescription>
          </CardHeader>
          <CardContent>
            {pagesLoading ? (
              <p className="text-sm text-muted-foreground py-4">Loading…</p>
            ) : !topSourcePages || topSourcePages.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No data yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Page</th>
                      <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Clicks</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Brands</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSourcePages.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-4 font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                          {row.page}
                        </td>
                        <td className="py-2 pr-4 text-right font-medium">{row.clicks}</td>
                        <td className="py-2 text-right text-muted-foreground">{row.brands}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Most Viewed Products WITHOUT Affiliate Clicks */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Viewed But Never Clicked (30 Days)</CardTitle>
              <CardDescription>Products with page views but zero affiliate clicks — potential UX or affiliate link issues</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {noClickLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : !noClickProducts || noClickProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              All viewed products have received at least one affiliate click 🎉
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-2 font-medium text-muted-foreground w-6">#</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Brand</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Views</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {noClickProducts.map((row, i) => (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-2 text-muted-foreground text-xs">{i + 1}</td>
                      <td className="py-2 pr-4">
                        {row.product_handle ? (
                          <Link
                            to={`/filament/${row.product_handle}`}
                            className="text-primary hover:underline text-xs truncate max-w-[180px] block"
                          >
                            {row.product_title}
                          </Link>
                        ) : (
                          <span className="text-xs truncate max-w-[180px] block">{row.product_title}</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="secondary" className="text-xs">{row.vendor}</Badge>
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <Badge variant="outline" className="text-xs">{row.views}</Badge>
                      </td>
                      <td className="py-2 text-right text-muted-foreground text-xs">
                        {row.variant_price ? `$${row.variant_price}` : "—"}
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

