import { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { downloadCSV } from '@/lib/csvExport';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { BrandRegionMatrix } from '@/components/admin/inventory/sync-status/BrandRegionMatrix';
import {
  Activity, Play, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock,
  Download, RefreshCw, Search, ChevronDown, ChevronRight, ExternalLink,
  Timer, Zap, TrendingUp, AlertCircle, BarChart3
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrchestrationRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  brands_total: number;
  brands_synced: number;
  brands_failed: string[];
  total_products_updated: number;
  trigger_type: string;
  triggered_by_user: string | null;
  error_log: Record<string, unknown> | null;
  summary: Record<string, unknown> | null;
}

interface ScrapeError {
  id: string;
  filament_id: string | null;
  brand_slug: string;
  region: string | null;
  error_type: string | null;
  error_message: string | null;
  url: string | null;
  is_resolved: boolean;
  created_at: string;
}

interface BrandSyncLog {
  id: string;
  brand_slug: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  products_updated: number | null;
  products_created: number | null;
  products_failed: number | null;
  duration_seconds: number | null;
  price_changes: number | null;
  sync_type: string;
  triggered_by: string | null;
}

interface StaleProduct {
  id: string;
  product_title: string;
  vendor: string;
  last_scraped_at: string | null;
  product_url: string | null;
}

// ─── Helper Components ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    running: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    failed: 'bg-red-500/10 text-red-500 border-red-500/20',
    partial: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  };
  return (
    <Badge variant="outline" className={styles[status] || 'bg-muted text-muted-foreground'}>
      {status}
    </Badge>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color = 'text-primary' }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ComponentType<{ className?: string }>; color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function SyncMonitorContent() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('history');
  const [isTriggering, setIsTriggering] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [errorFilters, setErrorFilters] = useState({ brand: '', type: '', region: '' });
  const [syncBrandSlug, setSyncBrandSlug] = useState('');
  const [syncProductSearch, setSyncProductSearch] = useState('');
  const [countdown, setCountdown] = useState('');

  // ── Queries ──────────────────────────────────────────────────────────────

  // Primary: orchestration_runs (may be empty)
  const { data: runs = [] } = useQuery({
    queryKey: ['sync-monitor-runs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orchestration_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(30);
      return (data || []) as unknown as OrchestrationRun[];
    },
    refetchInterval: 10000,
  });

  // Fallback: brand_sync_logs (always has data)
  const { data: syncLogs = [] } = useQuery({
    queryKey: ['sync-monitor-brand-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('brand_sync_logs')
        .select('id, brand_slug, started_at, completed_at, status, products_updated, products_created, products_failed, duration_seconds, price_changes, sync_type, triggered_by')
        .order('started_at', { ascending: false })
        .limit(100);
      return (data || []) as BrandSyncLog[];
    },
    refetchInterval: 30000,
  });

  const latestRun = runs[0] || null;
  const isRunning = latestRun?.status === 'running';

  // Derive "last sync" from brand_sync_logs if no orchestration_runs
  const lastSyncInfo = useMemo(() => {
    if (latestRun) {
      return {
        status: latestRun.status,
        time: latestRun.started_at,
        completedAt: latestRun.completed_at,
      };
    }
    const lastLog = syncLogs.find(l => l.status === 'completed');
    if (lastLog) {
      return {
        status: lastLog.status,
        time: lastLog.started_at,
        completedAt: lastLog.completed_at,
      };
    }
    return null;
  }, [latestRun, syncLogs]);

  const { data: todayStats } = useQuery({
    queryKey: ['sync-monitor-today'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('brand_sync_logs')
        .select('products_updated')
        .gte('started_at', today.toISOString());
      const total = (data || []).reduce((s, r) => s + (r.products_updated || 0), 0);
      return { count: data?.length || 0, products: total };
    },
    refetchInterval: 30000,
  });

  const { data: errorCount = 0 } = useQuery({
    queryKey: ['sync-monitor-error-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('scrape_errors')
        .select('*', { count: 'exact', head: true })
        .eq('is_resolved', false);
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: scrapeErrors = [] } = useQuery({
    queryKey: ['sync-monitor-errors', errorFilters],
    queryFn: async () => {
      let q = supabase
        .from('scrape_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (errorFilters.brand) q = q.eq('brand_slug', errorFilters.brand);
      if (errorFilters.type) q = q.eq('error_type', errorFilters.type);
      if (errorFilters.region) q = q.eq('region', errorFilters.region);
      const { data } = await q;
      return (data || []) as unknown as ScrapeError[];
    },
  });

  const { data: staleProducts = [] } = useQuery({
    queryKey: ['sync-monitor-stale'],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 48 * 3600000).toISOString();
      const { data } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, last_scraped_at, product_url')
        .or(`last_scraped_at.lt.${cutoff},last_scraped_at.is.null`)
        .not('product_url', 'is', null)
        .order('last_scraped_at', { ascending: true, nullsFirst: true })
        .limit(100);
      return (data || []) as StaleProduct[];
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['sync-monitor-brands'],
    queryFn: async () => {
      const { data } = await supabase
        .from('automated_brands')
        .select('brand_slug, display_name')
        .eq('scraping_enabled', true)
        .order('display_name');
      return data || [];
    },
    staleTime: 300000,
  });

  // Performance chart data: prefer orchestration_runs, fallback to brand_sync_logs aggregated by day
  const { data: chartData = [] } = useQuery({
    queryKey: ['sync-monitor-charts', runs.length],
    queryFn: async () => {
      // If we have orchestration runs, use them
      if (runs.length > 0) {
        return runs.filter(r => r.completed_at).map(r => {
          const duration = Math.round((new Date(r.completed_at!).getTime() - new Date(r.started_at).getTime()) / 60000);
          return {
            date: format(new Date(r.started_at), 'MM/dd'),
            duration,
            products: r.total_products_updated || 0,
            successRate: r.brands_synced > 0
              ? Math.round((r.brands_synced / (r.brands_synced + (r.brands_failed?.length || 0))) * 100)
              : 0,
          };
        }).reverse();
      }

      // Fallback: aggregate brand_sync_logs by day
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000).toISOString();
      const { data } = await supabase
        .from('brand_sync_logs')
        .select('started_at, completed_at, status, products_updated, duration_seconds')
        .gte('started_at', thirtyDaysAgo)
        .order('started_at', { ascending: true });

      if (!data?.length) return [];

      // Group by day
      const byDay = new Map<string, { total: number; completed: number; failed: number; products: number; totalDuration: number }>();
      data.forEach(log => {
        const day = format(new Date(log.started_at), 'MM/dd');
        const entry = byDay.get(day) || { total: 0, completed: 0, failed: 0, products: 0, totalDuration: 0 };
        entry.total++;
        if (log.status === 'completed') entry.completed++;
        if (log.status === 'failed') entry.failed++;
        entry.products += log.products_updated || 0;
        entry.totalDuration += log.duration_seconds || 0;
        byDay.set(day, entry);
      });

      return Array.from(byDay.entries()).map(([date, d]) => ({
        date,
        duration: d.total > 0 ? Math.round(d.totalDuration / d.total / 60) : 0,
        products: d.products,
        successRate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
      }));
    },
    staleTime: 60000,
  });

  // ── Computed ─────────────────────────────────────────────────────────────

  // Avg duration from orchestration_runs or brand_sync_logs
  const avgDuration = useMemo(() => {
    if (runs.length > 0) {
      const completed = runs.filter(r => r.completed_at);
      if (!completed.length) return '—';
      const avg = completed.reduce((s, r) => {
        return s + (new Date(r.completed_at!).getTime() - new Date(r.started_at).getTime()) / 1000;
      }, 0) / completed.length;
      return `${Math.round(avg / 60)}m`;
    }
    // Fallback: avg from recent brand_sync_logs
    const withDuration = syncLogs.filter(l => l.duration_seconds && l.duration_seconds > 0);
    if (!withDuration.length) return '—';
    const avg = withDuration.slice(0, 30).reduce((s, l) => s + (l.duration_seconds || 0), 0) / Math.min(withDuration.length, 30);
    return `${Math.round(avg)}s`;
  }, [runs, syncLogs]);

  // Error pattern detection
  const errorPatterns = useMemo(() => {
    const groups: Record<string, number> = {};
    scrapeErrors.forEach(e => {
      const key = `${e.brand_slug}|${e.region || 'global'}`;
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.entries(groups)
      .filter(([, count]) => count >= 5)
      .map(([key, count]) => {
        const [brand, region] = key.split('|');
        return { brand, region, count };
      });
  }, [scrapeErrors]);

  // ── Countdown Timer ──────────────────────────────────────────────────────

  useEffect(() => {
    const completedAt = lastSyncInfo?.completedAt;
    if (!completedAt) { setCountdown('—'); return; }
    const nextSync = new Date(completedAt).getTime() + 24 * 3600000;
    const tick = () => {
      const diff = nextSync - Date.now();
      if (diff <= 0) { setCountdown('Due now'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [lastSyncInfo?.completedAt]);

  // ── Realtime ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const ch = supabase
      .channel('sync-monitor-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orchestration_runs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['sync-monitor-runs'] });
        queryClient.invalidateQueries({ queryKey: ['sync-monitor-today'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scrape_errors' }, () => {
        queryClient.invalidateQueries({ queryKey: ['sync-monitor-errors'] });
        queryClient.invalidateQueries({ queryKey: ['sync-monitor-error-count'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brand_sync_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['sync-monitor-today'] });
        queryClient.invalidateQueries({ queryKey: ['sync-monitor-brand-logs'] });
        queryClient.invalidateQueries({ queryKey: ['sync-monitor-charts'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const triggerFullSync = useCallback(async () => {
    setIsTriggering(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Not authenticated'); return; }
      const res = await supabase.functions.invoke('daily-price-orchestrator', {
        body: { trigger: 'manual', userId: user?.id },
      });
      if (res.error) { toast.error(res.error.message); return; }
      if (res.data?.error) { toast.error(res.data.error); return; }
      toast.success(`Sync started: ${res.data?.eligibleBrands || 0} brands queued`);
    } catch { toast.error('Failed to trigger sync'); }
    finally { setIsTriggering(false); }
  }, [user?.id]);

  const syncSingleProduct = useCallback(async (filamentId: string, productUrl?: string) => {
    try {
      let url = productUrl;
      if (!url) {
        const { data } = await supabase.from('filaments').select('product_url').eq('id', filamentId).maybeSingle();
        url = data?.product_url ?? undefined;
      }
      if (!url) { toast.error('No product URL available'); return; }
      const res = await supabase.functions.invoke('get-current-price', {
        body: { filamentId, productUrl: url },
      });
      if (res.error) toast.error(res.error.message);
      else toast.success('Price refresh triggered');
    } catch { toast.error('Sync failed'); }
  }, []);

  const markErrorsResolved = useCallback(async (ids: string[]) => {
    const { error } = await supabase
      .from('scrape_errors')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() } as any)
      .in('id', ids);
    if (error) toast.error('Failed to update');
    else {
      toast.success(`${ids.length} error(s) resolved`);
      queryClient.invalidateQueries({ queryKey: ['sync-monitor-errors'] });
      queryClient.invalidateQueries({ queryKey: ['sync-monitor-error-count'] });
    }
  }, [queryClient]);

  // Determine which data source to show in Sync History
  const hasOrchestrationData = runs.length > 0;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Sync Monitor"
          description="Central command center for price synchronization operations"
          icon={Activity}
          iconColor="text-blue-500"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/old-admin/inventory?tab=sync">Review Price Changes</a>
              </Button>
              <Button
                size="sm"
                onClick={triggerFullSync}
                disabled={isTriggering || isRunning}
              >
                {isTriggering || isRunning
                  ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  : <Play className="w-4 h-4 mr-1" />}
                {isRunning ? 'Running…' : 'Run Full Sync'}
              </Button>
            </div>
          }
        />

        {/* ─── Section A: Overview Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            title="Last Sync"
            value={lastSyncInfo ? lastSyncInfo.status : '—'}
            subtitle={lastSyncInfo ? formatDistanceToNow(new Date(lastSyncInfo.time), { addSuffix: true }) : 'No syncs yet'}
            icon={lastSyncInfo?.status === 'completed' ? CheckCircle2 : lastSyncInfo?.status === 'failed' ? XCircle : Clock}
            color={lastSyncInfo?.status === 'completed' ? 'text-green-500' : lastSyncInfo?.status === 'failed' ? 'text-red-500' : 'text-blue-500'}
          />
          <StatCard
            title="Synced Today"
            value={todayStats?.products || 0}
            subtitle={`${todayStats?.count || 0} brand syncs`}
            icon={Zap}
            color="text-amber-500"
          />
          <StatCard
            title="Active Errors"
            value={errorCount}
            subtitle="Unresolved"
            icon={AlertCircle}
            color={errorCount > 0 ? 'text-red-500' : 'text-green-500'}
          />
          <StatCard
            title="Avg Duration"
            value={avgDuration}
            subtitle={hasOrchestrationData ? 'Per orchestration' : 'Per brand sync'}
            icon={Timer}
          />
          <StatCard
            title="Next Sync"
            value={countdown}
            subtitle="Estimated"
            icon={Clock}
            color="text-blue-500"
          />
        </div>

        {/* ─── Live Monitor (when running) ───────────────────────────────── */}
        {isRunning && latestRun && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                Live Sync In Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{latestRun.brands_synced} / {latestRun.brands_total} brands</span>
                <span>{latestRun.total_products_updated} products updated</span>
              </div>
              <Progress
                value={latestRun.brands_total > 0 ? (latestRun.brands_synced / latestRun.brands_total) * 100 : 0}
                className="h-3"
              />
              {latestRun.brands_synced > 0 && latestRun.brands_total > latestRun.brands_synced && (() => {
                const elapsed = (Date.now() - new Date(latestRun.started_at).getTime()) / 1000;
                const perBrand = elapsed / latestRun.brands_synced;
                const remaining = Math.round(perBrand * (latestRun.brands_total - latestRun.brands_synced) / 60);
                return <p className="text-xs text-muted-foreground">Est. {remaining}m remaining</p>;
              })()}
            </CardContent>
          </Card>
        )}

        {/* ─── Tabs ──────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="history">Sync History</TabsTrigger>
            <TabsTrigger value="errors">
              Errors {errorCount > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">{errorCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="health">Brand Health</TabsTrigger>
            <TabsTrigger value="stale">Stale Products</TabsTrigger>
            <TabsTrigger value="controls">Manual Sync</TabsTrigger>
            <TabsTrigger value="charts">Performance</TabsTrigger>
          </TabsList>

          {/* ── Tab B: Sync History ──────────────────────────────────────── */}
          <TabsContent value="history">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {hasOrchestrationData ? 'Orchestration Runs' : 'Brand Sync History'}
                  </CardTitle>
                  {!hasOrchestrationData && (
                    <CardDescription className="text-xs">
                      Showing individual brand syncs (no orchestration runs yet)
                    </CardDescription>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  if (hasOrchestrationData) {
                    downloadCSV(runs.map(r => ({
                      started: r.started_at, status: r.status,
                      brands_synced: r.brands_synced, products: r.total_products_updated,
                      trigger: r.trigger_type,
                    })), 'sync-history');
                  } else {
                    downloadCSV(syncLogs.map(l => ({
                      started: l.started_at, brand: l.brand_slug, status: l.status,
                      products_updated: l.products_updated || 0,
                      duration_seconds: l.duration_seconds || 0,
                      type: l.sync_type,
                    })), 'sync-history');
                  }
                }}>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
              </CardHeader>
              <CardContent>
                {hasOrchestrationData ? (
                  /* Orchestration runs table */
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8" />
                        <TableHead>Started</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Brands</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Trigger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runs.map(run => {
                        const dur = run.completed_at
                          ? `${Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 60000)}m`
                          : '—';
                        const isExpanded = expandedRun === run.id;
                        const brandResults = (run.summary as any)?.brand_results as Record<string, any> | undefined;
                        return (
                          <>
                            <TableRow
                              key={run.id}
                              className="cursor-pointer"
                              onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                            >
                              <TableCell className="px-2">
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </TableCell>
                              <TableCell className="text-xs">{format(new Date(run.started_at), 'MMM d, HH:mm')}</TableCell>
                              <TableCell className="text-xs font-mono">{dur}</TableCell>
                              <TableCell><StatusBadge status={run.status} /></TableCell>
                              <TableCell className="text-xs">{run.brands_synced}/{run.brands_total}</TableCell>
                              <TableCell className="text-xs font-mono">{run.total_products_updated}</TableCell>
                              <TableCell className="text-xs capitalize">{run.trigger_type}</TableCell>
                            </TableRow>
                            {isExpanded && brandResults && (
                              <TableRow key={`${run.id}-detail`}>
                                <TableCell colSpan={7} className="bg-muted/30 p-4">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    {Object.entries(brandResults).map(([brand, result]: [string, any]) => (
                                      <div key={brand} className="p-2 rounded bg-background border">
                                        <span className="font-medium">{brand}</span>
                                        <div className="text-muted-foreground">
                                          {result.status === 'success' ? '✓' : '✗'} {result.products_updated || 0} updated
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {run.brands_failed.length > 0 && (
                                    <p className="text-xs text-red-400 mt-2">Failed: {run.brands_failed.join(', ')}</p>
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  /* Fallback: brand_sync_logs table */
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Started</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Failed</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {format(new Date(log.started_at), 'MMM d, HH:mm')}
                          </TableCell>
                          <TableCell className="text-xs font-medium">{log.brand_slug}</TableCell>
                          <TableCell className="text-xs font-mono">
                            {log.duration_seconds ? `${Math.round(log.duration_seconds)}s` : '—'}
                          </TableCell>
                          <TableCell><StatusBadge status={log.status} /></TableCell>
                          <TableCell className="text-xs font-mono">{log.products_updated || 0}</TableCell>
                          <TableCell className="text-xs font-mono">{log.products_created || 0}</TableCell>
                          <TableCell className="text-xs font-mono text-red-400">{log.products_failed || 0}</TableCell>
                          <TableCell className="text-xs capitalize">{log.sync_type}</TableCell>
                        </TableRow>
                      ))}
                      {syncLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No sync logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab E: Errors ────────────────────────────────────────────── */}
          <TabsContent value="errors">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <CardTitle className="text-base">Scrape Errors</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={errorFilters.brand} onValueChange={v => setErrorFilters(f => ({ ...f, brand: v === 'all' ? '' : v }))}>
                      <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Brand" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Brands</SelectItem>
                        {brands.map(b => <SelectItem key={b.brand_slug} value={b.brand_slug}>{b.display_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={errorFilters.type} onValueChange={v => setErrorFilters(f => ({ ...f, type: v === 'all' ? '' : v }))}>
                      <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Error Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {['404', 'timeout', 'parse_error', 'rate_limit', 'network', 'selector_fail'].map(t =>
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => {
                        const unresolved = scrapeErrors.filter(e => !e.is_resolved).map(e => e.id);
                        if (unresolved.length) markErrorsResolved(unresolved);
                      }}
                      disabled={!scrapeErrors.some(e => !e.is_resolved)}
                    >
                      Mark All Resolved
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() =>
                      downloadCSV(scrapeErrors.map(e => ({
                        time: e.created_at, brand: e.brand_slug, region: e.region || '',
                        type: e.error_type || '', message: e.error_message || '',
                        url: e.url || '', resolved: e.is_resolved,
                      })), 'scrape-errors')
                    }>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {errorPatterns.length > 0 && (
                  <div className="mb-4 space-y-1">
                    {errorPatterns.map(p => (
                      <div key={`${p.brand}-${p.region}`} className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{p.count} errors from <strong>{p.brand}</strong> ({p.region})</span>
                      </div>
                    ))}
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scrapeErrors.map(err => (
                      <TableRow key={err.id} className={err.is_resolved ? 'opacity-50' : ''}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDistanceToNow(new Date(err.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{err.brand_slug}</TableCell>
                        <TableCell className="text-xs">{err.region || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{err.error_type || 'unknown'}</Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{err.error_message || '—'}</TableCell>
                        <TableCell className="text-xs">
                          {err.url && (
                            <a href={err.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> Link
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          {!err.is_resolved && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs"
                              onClick={() => markErrorsResolved([err.id])}>
                              Resolve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {scrapeErrors.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No errors found — scrape errors will appear here when sync functions report failures
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab D: Brand Health ──────────────────────────────────────── */}
          <TabsContent value="health">
            <BrandRegionMatrix />
          </TabsContent>

          {/* ── Tab F: Stale Products ────────────────────────────────────── */}
          <TabsContent value="stale">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Stale Products</CardTitle>
                  <CardDescription className="text-xs">Not synced in &gt;48 hours</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() =>
                  downloadCSV(staleProducts.map(p => ({
                    product: p.product_title, brand: p.vendor,
                    last_checked: p.last_scraped_at || 'never',
                    url: p.product_url || '',
                  })), 'stale-products')
                }>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Last Checked</TableHead>
                      <TableHead>Days Stale</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staleProducts.map(p => {
                      const daysStale = p.last_scraped_at
                        ? differenceInDays(new Date(), new Date(p.last_scraped_at))
                        : null;
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs font-medium max-w-[200px] truncate">{p.product_title}</TableCell>
                          <TableCell className="text-xs">{p.vendor}</TableCell>
                          <TableCell className="text-xs">
                            {p.last_scraped_at
                              ? formatDistanceToNow(new Date(p.last_scraped_at), { addSuffix: true })
                              : <span className="text-red-400">Never</span>}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {daysStale !== null ? `${daysStale}d` : '∞'}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-6 text-xs"
                              onClick={() => syncSingleProduct(p.id, p.product_url)}>
                              <RefreshCw className="w-3 h-3 mr-1" /> Sync
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {staleProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          All products are fresh ✓
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab G: Manual Sync Controls ──────────────────────────────── */}
          <TabsContent value="controls">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Full Sync</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Trigger the orchestrator to sync all eligible brands.
                  </p>
                  <Button onClick={triggerFullSync} disabled={isTriggering || isRunning} className="w-full">
                    {isTriggering || isRunning
                      ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      : <Play className="w-4 h-4 mr-1" />}
                    {isRunning ? 'Sync Running…' : 'Run Full Price Sync'}
                  </Button>
                  {lastSyncInfo?.completedAt && (
                    <p className="text-xs text-muted-foreground text-center">
                      Last completed: {format(new Date(lastSyncInfo.completedAt), 'MMM d, HH:mm')}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Sync Single Brand</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={syncBrandSlug} onValueChange={setSyncBrandSlug}>
                    <SelectTrigger><SelectValue placeholder="Select a brand" /></SelectTrigger>
                    <SelectContent>
                      {brands.map(b => <SelectItem key={b.brand_slug} value={b.brand_slug}>{b.display_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full" variant="outline"
                    disabled={!syncBrandSlug}
                    onClick={async () => {
                      if (!syncBrandSlug) return;
                      try {
                        const res = await supabase.functions.invoke(`sync-${syncBrandSlug}-products`);
                        if (res.error) toast.error(res.error.message);
                        else toast.success(`Sync triggered for ${syncBrandSlug}`);
                      } catch { toast.error('Failed'); }
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" /> Sync Brand
                  </Button>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Sync Single Product</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by product name…"
                      value={syncProductSearch}
                      onChange={e => setSyncProductSearch(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" disabled={!syncProductSearch}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter a product name to find and sync individual products via the on-demand scraper.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Tab H: Performance Charts ────────────────────────────────── */}
          <TabsContent value="charts">
            {chartData.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No sync data available for charts yet.</p>
                  <p className="text-xs mt-1">Charts will populate as syncs run and complete.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Timer className="w-4 h-4" /> 
                      {hasOrchestrationData ? 'Sync Duration (minutes)' : 'Avg Brand Sync Duration (minutes)'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Line type="monotone" dataKey="duration" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" /> Products Synced Per {hasOrchestrationData ? 'Run' : 'Day'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Bar dataKey="products" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Success Rate (%)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis domain={[0, 100]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Line type="monotone" dataKey="successRate" stroke="hsl(142 76% 36%)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
}

export default function SyncMonitor() {
  return (
    <AdminLayout>
      <div className="p-6">
        <SyncMonitorContent />
      </div>
    </AdminLayout>
  );
}
