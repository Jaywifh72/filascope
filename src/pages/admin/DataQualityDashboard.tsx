import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, RefreshCw, Download, ExternalLink, Package, CheckCircle, AlertTriangle, LinkIcon, Clock, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useBrokenProductUrls } from '@/hooks/useBrokenProductUrls';
import { usePriceSync } from '@/hooks/usePriceSync';
import { BrandRegionMatrix } from '@/components/admin/inventory/sync-status/BrandRegionMatrix';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { downloadCSV } from '@/lib/csvExport';
import { formatDistanceToNow } from 'date-fns';

// ---------- Types ----------
interface OverviewMetrics {
  totalProducts: number;
  freshPrices: number;
  pendingReviews: number;
  brokenLinks: number;
  avgStaleDays: number;
}

interface StaleProduct {
  id: string;
  product_title: string;
  vendor: string;
  last_scraped_at: string | null;
  days_old: number;
  price_confidence: string | null;
}

interface SyncLog {
  id: string;
  brand_slug: string;
  sync_type: string;
  status: string;
  duration_seconds: number | null;
  products_updated: number | null;
  started_at: string;
}

// ---------- Constants ----------
const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#22c55e',
  medium: '#eab308',
  low: '#f97316',
  stale: '#ef4444',
  unknown: '#94a3b8',
};

const STALENESS_OPTIONS = [
  { label: '7+ days', value: '7' },
  { label: '14+ days', value: '14' },
  { label: '30+ days', value: '30' },
];

// ---------- Component ----------
export default function DataQualityDashboard() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [staleProducts, setStaleProducts] = useState<StaleProduct[]>([]);
  const [staleLoading, setStaleLoading] = useState(true);
  const [staleThreshold, setStaleThreshold] = useState('7');
  const [staleLimit, setStaleLimit] = useState(50);
  const [confidenceData, setConfidenceData] = useState<{ name: string; value: number }[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncLogsLoading, setSyncLogsLoading] = useState(true);
  const [lastOrchRun, setLastOrchRun] = useState<string | null>(null);

  const { brokenUrls, stats: brokenStats, loading: brokenLoading, fetchBrokenUrls, markResolved } = useBrokenProductUrls();
  const { syncSingle, isItemSyncing } = usePriceSync();

  // ---------- Fetch overview metrics ----------
  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const [totalRes, freshRes, pendingRes, brokenRes, stalenessRes] = await Promise.all([
        supabase.from('filaments').select('id', { count: 'exact', head: true }),
        supabase.from('filaments').select('id', { count: 'exact', head: true }).eq('price_confidence', 'high'),
        supabase.from('price_discrepancies').select('id', { count: 'exact', head: true }).in('status', ['pending', 'manual_review']),
        supabase.from('broken_product_urls').select('id', { count: 'exact', head: true }).is('resolved_at', null),
        supabase.from('filaments').select('last_scraped_at').not('last_scraped_at', 'is', null).limit(500),
      ]);

      let avgDays = 0;
      if (stalenessRes.data?.length) {
        const now = Date.now();
        const totalDays = stalenessRes.data.reduce((sum, r) => {
          return sum + (now - new Date(r.last_scraped_at!).getTime()) / 86400000;
        }, 0);
        avgDays = Math.round(totalDays / stalenessRes.data.length);
      }

      setMetrics({
        totalProducts: totalRes.count ?? 0,
        freshPrices: freshRes.count ?? 0,
        pendingReviews: pendingRes.count ?? 0,
        brokenLinks: brokenRes.count ?? 0,
        avgStaleDays: avgDays,
      });
    } catch (e) {
      console.error('Failed to fetch metrics', e);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // ---------- Fetch stale products ----------
  const fetchStaleProducts = useCallback(async () => {
    setStaleLoading(true);
    try {
      const cutoff = new Date(Date.now() - parseInt(staleThreshold) * 86400000).toISOString();
      const { data } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, last_scraped_at, price_confidence')
        .or(`last_scraped_at.is.null,last_scraped_at.lt.${cutoff}`)
        .order('last_scraped_at', { ascending: true, nullsFirst: true })
        .limit(staleLimit);

      const now = Date.now();
      setStaleProducts(
        (data ?? []).map((p) => ({
          ...p,
          days_old: p.last_scraped_at ? Math.round((now - new Date(p.last_scraped_at).getTime()) / 86400000) : 999,
        }))
      );
    } catch (e) {
      console.error('Failed to fetch stale products', e);
    } finally {
      setStaleLoading(false);
    }
  }, [staleThreshold, staleLimit]);

  // ---------- Fetch confidence distribution ----------
  const fetchConfidence = useCallback(async () => {
    try {
      const { data } = await supabase.rpc('get_catalog_counts');
      // RPC doesn't give confidence breakdown; query directly
      const { data: raw } = await supabase
        .from('filaments')
        .select('price_confidence')
        .not('price_confidence', 'is', null);

      if (raw) {
        const counts: Record<string, number> = {};
        raw.forEach((r) => {
          const c = r.price_confidence || 'unknown';
          counts[c] = (counts[c] || 0) + 1;
        });
        setConfidenceData(Object.entries(counts).map(([name, value]) => ({ name, value })));
      }
    } catch (e) {
      console.error('Failed to fetch confidence data', e);
    }
  }, []);

  // ---------- Fetch sync logs ----------
  const fetchSyncLogs = useCallback(async () => {
    setSyncLogsLoading(true);
    try {
      const { data } = await supabase
        .from('brand_sync_logs')
        .select('id, brand_slug, sync_type, status, duration_seconds, products_updated, started_at')
        .order('started_at', { ascending: false })
        .limit(20);
      setSyncLogs(data ?? []);
    } catch (e) {
      console.error('Failed to fetch sync logs', e);
    } finally {
      setSyncLogsLoading(false);
    }
  }, []);

  // ---------- Fetch last orchestration run ----------
  const fetchLastOrchRun = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('orchestration_runs')
        .select('started_at')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLastOrchRun(data?.started_at ?? null);
    } catch { /* ignore */ }
  }, []);

  // ---------- Mount ----------
  useEffect(() => {
    fetchMetrics();
    fetchBrokenUrls();
    fetchConfidence();
    fetchSyncLogs();
    fetchLastOrchRun();
  }, [fetchMetrics, fetchBrokenUrls, fetchConfidence, fetchSyncLogs, fetchLastOrchRun]);

  useEffect(() => {
    fetchStaleProducts();
  }, [fetchStaleProducts]);

  // ---------- Realtime ----------
  useEffect(() => {
    const channel = supabase
      .channel('dq-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'filaments' }, () => {
        fetchMetrics();
        fetchConfidence();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brand_sync_logs' }, () => {
        fetchSyncLogs();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'price_discrepancies' }, () => {
        fetchMetrics();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMetrics, fetchConfidence, fetchSyncLogs]);

  // ---------- Export helpers ----------
  const exportStaleProducts = () => {
    downloadCSV(
      staleProducts.map((p) => ({
        product_title: p.product_title,
        vendor: p.vendor,
        last_scraped_at: p.last_scraped_at ?? 'Never',
        days_old: p.days_old,
        price_confidence: p.price_confidence ?? 'unknown',
      })),
      'stale-products'
    );
  };

  const exportBrokenLinks = () => {
    downloadCSV(
      brokenUrls.filter((u) => !u.resolved_at).map((u) => ({
        product_title: u.product_title ?? '',
        product_url: u.product_url,
        store_domain: u.store_domain,
        error_type: u.error_type,
        last_detected_at: u.last_detected_at,
      })),
      'broken-links'
    );
  };

  // ---------- Stat card helper ----------
  const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) => (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {metricsLoading ? <Skeleton className="h-6 w-16 mt-1" /> : <p className="text-xl font-bold text-foreground">{value}</p>}
        </div>
      </CardContent>
    </Card>
  );

  const statusBadge = (status: string) => {
    const variant = status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary';
    return <Badge variant={variant} className="capitalize">{status}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <AdminPageHeader
          title="Data Quality Dashboard"
          description="Consolidated view of pricing health, broken links, regional coverage, and sync activity."
          icon={ShieldCheck}
          iconColor="text-emerald-500"
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ======= Main content (3/4) ======= */}
          <div className="lg:col-span-3 space-y-6">
            {/* Section A: Overview Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard label="Total Products" value={metrics?.totalProducts ?? 0} icon={Package} color="bg-primary/10 text-primary" />
              <StatCard label="Fresh Prices" value={metrics?.freshPrices ?? 0} icon={CheckCircle} color="bg-emerald-500/10 text-emerald-500" />
              <StatCard label="Pending Reviews" value={metrics?.pendingReviews ?? 0} icon={AlertTriangle} color="bg-amber-500/10 text-amber-500" />
              <StatCard label="Broken Links" value={metrics?.brokenLinks ?? 0} icon={LinkIcon} color="bg-destructive/10 text-destructive" />
              <StatCard label="Avg Staleness" value={`${metrics?.avgStaleDays ?? 0}d`} icon={Clock} color="bg-muted text-muted-foreground" />
            </div>

            {/* Section B: Stale Pricing */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Stale Pricing</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={staleThreshold} onValueChange={setStaleThreshold}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STALENESS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={exportStaleProducts}><Download className="w-3 h-3 mr-1" />CSV</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {staleLoading ? (
                  <div className="p-6 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Last Checked</TableHead>
                          <TableHead className="text-right">Days Old</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staleProducts.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium text-sm max-w-[200px] truncate">{p.product_title}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.vendor}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {p.last_scraped_at ? formatDistanceToNow(new Date(p.last_scraped_at), { addSuffix: true }) : 'Never'}
                            </TableCell>
                            <TableCell className="text-right text-sm font-mono">{p.days_old === 999 ? '∞' : p.days_old}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" disabled={isItemSyncing(p.id)} onClick={() => syncSingle(p.id, 'filament')}>
                                {isItemSyncing(p.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {staleProducts.length >= staleLimit && (
                      <div className="p-3 text-center">
                        <Button size="sm" variant="ghost" onClick={() => setStaleLimit((l) => l + 50)}>Show More</Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Section C: Broken Links */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Broken Links ({brokenStats.unresolved})</CardTitle>
                <Button size="sm" variant="outline" onClick={exportBrokenLinks}><Download className="w-3 h-3 mr-1" />CSV</Button>
              </CardHeader>
              <CardContent className="p-0">
                {brokenLoading ? (
                  <div className="p-6 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : brokenUrls.filter((u) => !u.resolved_at).length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No broken links detected.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead>Detected</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brokenUrls.filter((u) => !u.resolved_at).slice(0, 30).map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="text-sm max-w-[180px] truncate">{u.product_title ?? u.product_url}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{u.store_domain}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{u.error_type}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(u.last_detected_at), { addSuffix: true })}</TableCell>
                          <TableCell className="text-right space-x-1">
                            {u.filament_id && (
                              <Button size="sm" variant="ghost" onClick={() => syncSingle(u.filament_id!, 'filament')}>
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => markResolved(u.id, 'Marked discontinued from dashboard')}>
                              ✓
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Section D: Regional Coverage Matrix */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Regional Coverage Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <BrandRegionMatrix />
              </CardContent>
            </Card>

            {/* Section E: Price Confidence Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Price Confidence Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {confidenceData.length === 0 ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={confidenceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                          {confidenceData.map((entry) => (
                            <Cell key={entry.name} fill={CONFIDENCE_COLORS[entry.name] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1">
                      {confidenceData.map((d) => (
                        <div key={d.name} className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CONFIDENCE_COLORS[d.name] || '#94a3b8' }} />
                          <span className="capitalize text-muted-foreground">{d.name}</span>
                          <span className="font-mono text-foreground">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section F: Recent Sync Activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Sync Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {syncLogsLoading ? (
                  <div className="p-6 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead>Started</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncLogs.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium text-sm">{l.brand_slug}</TableCell>
                          <TableCell className="text-sm text-muted-foreground capitalize">{l.sync_type.replace('_', ' ')}</TableCell>
                          <TableCell>{statusBadge(l.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{l.duration_seconds ? `${l.duration_seconds}s` : '—'}</TableCell>
                          <TableCell className="text-sm font-mono">{l.products_updated ?? '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(l.started_at), { addSuffix: true })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ======= Sidebar (1/4) ======= */}
          <div className="space-y-4">
            <Card className="sticky top-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/old-admin/inventory?tab=sync">
                    <RefreshCw className="w-4 h-4 mr-2" />Run Full Sync
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/old-admin/inventory?tab=sync">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Review Price Changes
                    {metrics && metrics.pendingReviews > 0 && (
                      <Badge variant="destructive" className="ml-auto text-xs">{metrics.pendingReviews}</Badge>
                    )}
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={exportStaleProducts}>
                  <Download className="w-4 h-4 mr-2" />Export Weekly Report
                </Button>

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">Last Orchestration Run</p>
                  <p className="text-sm font-mono text-foreground">
                    {lastOrchRun ? formatDistanceToNow(new Date(lastOrchRun), { addSuffix: true }) : 'Never'}
                  </p>
                </div>

                {brokenStats.storeBreakdown.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Broken Links by Store</p>
                    {brokenStats.storeBreakdown.slice(0, 5).map((s) => (
                      <div key={s.domain} className="flex justify-between text-xs">
                        <span className="text-muted-foreground truncate">{s.domain}</span>
                        <span className="font-mono text-foreground">{s.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
