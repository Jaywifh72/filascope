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
import { getPriceEndpoint } from '@/utils/priceEndpointRouter';
import { AuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { downloadCSV } from '@/lib/csvExport';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { BrandRegionMatrix } from '@/components/admin/inventory/sync-status/BrandRegionMatrix';
import { BuyButtonValidator } from '@/components/admin/inventory/sync-status/BuyButtonValidator';
import { SmartUrlValidator } from '@/components/admin/inventory/sync-status/SmartUrlValidator';
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
  current_brand_slug: string | null;
  current_brand_name: string | null;
  current_product_name: string | null;
  current_product_url: string | null;
}

interface OrchestrationBatch {
  id: string;
  orchestration_id: string;
  batch_number: number;
  status: string;
  brand_slugs: string[];
  started_at: string | null;
  completed_at: string | null;
  brands_synced: number;
  products_synced: number;
  errors_count: number;
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

interface RegionSyncDetail {
  updated?: number;
  created?: number;
  errors?: number;
  skipped?: number;
  reason?: string;
  error_messages?: string[];
  products_found?: number;
  matched?: number;
  duration_ms?: number;
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
  region_code: string | null;
  regions_synced: string[] | null;
  products_processed: Record<string, unknown>[] | null;
  success_details: Record<string, unknown> | null;
  regional_breakdown: Record<string, unknown> | null;
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
  const [historyRegionFilter, setHistoryRegionFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [syncBrandSlug, setSyncBrandSlug] = useState('');
  const [syncProductSearch, setSyncProductSearch] = useState('');
  const [countdown, setCountdown] = useState('');
  const [errorsLastRefreshed, setErrorsLastRefreshed] = useState<Date>(new Date());

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
        .select('id, brand_slug, started_at, completed_at, status, products_updated, products_created, products_failed, duration_seconds, price_changes, sync_type, triggered_by, region_code, regions_synced, products_processed, success_details, regional_breakdown')
        .order('started_at', { ascending: false })
        .limit(100);
      return (data || []) as BrandSyncLog[];
    },
    refetchInterval: 30000,
  });

  const latestRun = runs[0] || null;
  const isRunning = latestRun?.status === 'running';

  // Batches for the latest run
  const { data: batches = [] } = useQuery({
    queryKey: ['sync-monitor-batches', latestRun?.id],
    queryFn: async () => {
      if (!latestRun?.id) return [];
      const { data } = await supabase
        .from('orchestration_batches')
        .select('*')
        .eq('orchestration_id', latestRun.id)
        .order('batch_number', { ascending: true });
      return (data || []) as unknown as OrchestrationBatch[];
    },
    enabled: !!latestRun?.id,
    refetchInterval: isRunning ? 5000 : 30000,
  });

  const currentBatch = batches.find(b => b.status === 'running');
  const pendingBatches = batches.filter(b => b.status === 'pending');
  const hasResumableBatches = pendingBatches.length > 0 && (latestRun?.status === 'running' || latestRun?.status === 'partial');

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
        .or('is_resolved.eq.false,is_resolved.is.null');
      return count || 0;
    },
    refetchInterval: isRunning ? 5000 : 30000,
  });

  const { data: scrapeErrors = [] } = useQuery({
    queryKey: ['sync-monitor-errors', errorFilters],
    queryFn: async () => {
      let q = supabase
        .from('scrape_errors')
        .select('*')
        .or('is_resolved.eq.false,is_resolved.is.null')
        .order('created_at', { ascending: false })
        .limit(100);
      if (errorFilters.brand) q = q.eq('brand_slug', errorFilters.brand);
      if (errorFilters.type) q = q.eq('error_type', errorFilters.type);
      if (errorFilters.region) q = q.eq('region', errorFilters.region);
      const { data, error } = await q;
      if (error) console.error('[SyncMonitor] scrape_errors query error:', error);
      console.log('[SyncMonitor] scrape_errors returned:', data?.length, 'rows');
      setErrorsLastRefreshed(new Date());
      return (data || []) as unknown as ScrapeError[];
    },
    refetchInterval: isRunning ? 5000 : 30000,
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orchestration_batches' }, () => {
        queryClient.invalidateQueries({ queryKey: ['sync-monitor-batches'] });
        queryClient.invalidateQueries({ queryKey: ['sync-monitor-runs'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scrape_errors' }, () => {
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
      const fnName = getPriceEndpoint(url);
      const res = await supabase.functions.invoke(fnName, {
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

  const forceCompleteRun = useCallback(async (runId: string) => {
    const { error } = await supabase
      .from('orchestration_runs')
      .update({
        status: 'partial',
        completed_at: new Date().toISOString(),
        current_brand_slug: null,
        current_brand_name: null,
        current_product_name: null,
        current_product_url: null,
        summary: { note: 'Force-completed by admin via Sync Monitor' },
      } as any)
      .eq('id', runId);
    if (error) toast.error('Failed to force complete');
    else {
      toast.success('Run marked as partial (force-completed)');
      queryClient.invalidateQueries({ queryKey: ['sync-monitor-runs'] });
    }
  }, [queryClient]);

  const resumeSync = useCallback(async () => {
    try {
      const res = await supabase.functions.invoke('orchestrator-continue');
      if (res.error) { toast.error(res.error.message); return; }
      if (res.data?.error) { toast.error(res.data.error); return; }
      toast.success(res.data?.message || 'Resuming next batch...');
      queryClient.invalidateQueries({ queryKey: ['sync-monitor-runs'] });
      queryClient.invalidateQueries({ queryKey: ['sync-monitor-batches'] });
    } catch { toast.error('Failed to resume sync'); }
  }, [queryClient]);

  // Detect stuck run: status='running' and started >5 minutes ago with no recent update
  const isStuckRun = useMemo(() => {
    if (!latestRun || latestRun.status !== 'running') return false;
    const startedAt = new Date(latestRun.started_at).getTime();
    return (Date.now() - startedAt) > 5 * 60 * 1000;
  }, [latestRun]);

  // Determine which data source to show in Sync History
  const hasOrchestrationData = runs.length > 0;

  // Region flags for display
  const REGION_FLAGS: Record<string, { flag: string; name: string }> = {
    US: { flag: '🇺🇸', name: 'United States' },
    CA: { flag: '🇨🇦', name: 'Canada' },
    EU: { flag: '🇪🇺', name: 'Europe' },
    UK: { flag: '🇬🇧', name: 'United Kingdom' },
    AU: { flag: '🇦🇺', name: 'Australia' },
    JP: { flag: '🇯🇵', name: 'Japan' },
    CN: { flag: '🇨🇳', name: 'China' },
  };
  const ALL_REGIONS = ['US', 'CA', 'EU', 'UK', 'AU', 'JP'];

  // Extract region details from a sync log's regional_breakdown, success_details, or products_processed
  const getRegionBreakdown = useCallback((log: BrandSyncLog): Record<string, RegionSyncDetail> => {
    // Priority 1: Use dedicated regional_breakdown column (new standard)
    if (log.regional_breakdown) {
      const rb = log.regional_breakdown as Record<string, unknown>;
      const regionKeys = Object.keys(rb).filter(k => ALL_REGIONS.includes(k));
      if (regionKeys.length > 0) {
        const result: Record<string, RegionSyncDetail> = {};
        regionKeys.forEach(r => {
          const rd = rb[r] as Record<string, unknown> | undefined;
          result[r] = {
            updated: (rd?.updated as number) || (rd?.prices_updated as number) || 0,
            created: (rd?.created as number) || 0,
            errors: (rd?.errors as number) || (rd?.prices_failed as number) || 0,
            skipped: (rd?.skipped as number) || 0,
            reason: rd?.reason as string | undefined,
            error_messages: (rd?.error_messages as string[]) || undefined,
          };
        });
        return result;
      }
    }

    // Priority 2: Try success_details (legacy structured regional data)
    if (log.success_details) {
      const details = log.success_details as Record<string, unknown>;
      // Check for regionBreakdown key inside success_details
      const regionBreakdownInDetails = details.regionBreakdown as Record<string, unknown> | undefined;
      const source = regionBreakdownInDetails || details;
      const regionKeys = Object.keys(source).filter(k => ALL_REGIONS.includes(k));
      if (regionKeys.length > 0) {
        const result: Record<string, RegionSyncDetail> = {};
        regionKeys.forEach(r => {
          const rd = source[r] as Record<string, unknown> | undefined;
          result[r] = {
            updated: (rd?.updated as number) || (rd?.products_updated as number) || 0,
            created: (rd?.created as number) || 0,
            errors: (rd?.errors as number) || (rd?.failed as number) || (rd?.prices_failed as number) || 0,
            skipped: (rd?.skipped as number) || (rd?.rejected as number) || 0,
            reason: rd?.reason as string | undefined,
          };
        });
        return result;
      }
    }

    // Priority 3: Try products_processed array - group by region
    if (log.products_processed && Array.isArray(log.products_processed)) {
      const result: Record<string, RegionSyncDetail> = {};
      (log.products_processed as Record<string, unknown>[]).forEach(p => {
        const region = (p.region as string) || 'US';
        if (!result[region]) result[region] = { updated: 0, created: 0, errors: 0 };
        const action = p.action as string;
        if (action === 'updated') result[region].updated = (result[region].updated || 0) + 1;
        else if (action === 'created') result[region].created = (result[region].created || 0) + 1;
        else if (action === 'error') result[region].errors = (result[region].errors || 0) + 1;
      });
      return result;
    }

    // Priority 4: use regions_synced array + totals
    if (log.regions_synced?.length) {
      const result: Record<string, RegionSyncDetail> = {};
      const perRegion = Math.ceil((log.products_updated || 0) / log.regions_synced.length);
      log.regions_synced.forEach(r => {
        result[r] = { updated: perRegion, errors: 0 };
      });
      return result;
    }

    // Priority 5: Single region fallback
    if (log.region_code) {
      return { [log.region_code]: { updated: log.products_updated || 0, created: log.products_created || 0, errors: log.products_failed || 0 } };
    }

    return {};
  }, []);

  // Filter sync logs by region
  const filteredSyncLogs = useMemo(() => {
    if (!historyRegionFilter) return syncLogs;
    return syncLogs.filter(log => {
      if (log.regions_synced?.includes(historyRegionFilter)) return true;
      if (log.region_code === historyRegionFilter) return true;
      const breakdown = getRegionBreakdown(log);
      return historyRegionFilter in breakdown;
    });
  }, [syncLogs, historyRegionFilter, getRegionBreakdown]);

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
              {/* Batch progress */}
              {batches.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-foreground">
                    Batch {currentBatch?.batch_number || (batches.filter(b => b.status === 'completed' || b.status === 'failed').length)} of {batches.length}
                  </span>
                  {currentBatch && (
                    <span className="text-muted-foreground">
                      — {currentBatch.brands_synced}/{currentBatch.brand_slugs.length} brands synced
                    </span>
                  )}
                  <div className="flex gap-1 ml-auto">
                    {batches.map(b => (
                      <div
                        key={b.id}
                        title={`Batch ${b.batch_number}: ${b.status} (${b.brand_slugs.join(', ')})`}
                        className={`w-5 h-2 rounded-sm ${
                          b.status === 'completed' ? 'bg-green-500' :
                          b.status === 'running' ? 'bg-blue-500 animate-pulse' :
                          b.status === 'failed' ? 'bg-red-500' :
                          'bg-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{latestRun.brands_synced} / {latestRun.brands_total} brands</span>
                <span>{latestRun.total_products_updated} products updated</span>
              </div>
              <Progress
                value={latestRun.brands_total > 0 ? (latestRun.brands_synced / latestRun.brands_total) * 100 : 0}
                className="h-3"
              />
              {/* Live progress: current brand & product */}
              {latestRun.current_brand_slug && (
                <div className="text-xs space-y-0.5 p-2 rounded bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                    <span className="text-muted-foreground">Currently syncing:</span>
                    <span className="font-medium">{latestRun.current_brand_name || latestRun.current_brand_slug}</span>
                  </div>
                  {latestRun.current_product_name && (
                    <div className="pl-[18px] text-muted-foreground truncate">
                      {latestRun.current_product_name}
                      {latestRun.current_product_url && (
                        <a href={latestRun.current_product_url} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-400 hover:underline inline-flex items-center">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
              {latestRun.brands_synced > 0 && latestRun.brands_total > latestRun.brands_synced && (() => {
                const elapsed = (Date.now() - new Date(latestRun.started_at).getTime()) / 1000;
                const perBrand = elapsed / latestRun.brands_synced;
                const remaining = Math.round(perBrand * (latestRun.brands_total - latestRun.brands_synced) / 60);
                return <p className="text-xs text-muted-foreground">Est. {remaining}m remaining</p>;
              })()}
              {/* Stuck run warning */}
              {isStuckRun && (
                <div className="flex items-center justify-between p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>This run appears stuck (running &gt;5 min). The edge function may have timed out.</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => forceCompleteRun(latestRun!.id)}
                  >
                    Force Complete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── Resume Sync (when batches pending) ────────────────────────── */}
        {!isRunning && hasResumableBatches && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>{pendingBatches.length} batch(es) remaining</span>
                <span className="text-muted-foreground text-xs">
                  ({pendingBatches.reduce((s, b) => s + b.brand_slugs.length, 0)} brands)
                </span>
              </div>
              <Button size="sm" onClick={resumeSync}>
                <Play className="w-4 h-4 mr-1" /> Resume Sync
              </Button>
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
            <TabsTrigger value="buy-buttons">Buy Button Validator</TabsTrigger>
            <TabsTrigger value="smart-validator">Smart URL Repair</TabsTrigger>
          </TabsList>

          {/* ── Tab B: Sync History ──────────────────────────────────────── */}
          <TabsContent value="history">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {hasOrchestrationData ? 'Orchestration Runs' : 'Brand Sync History'}
                    </CardTitle>
                    {!hasOrchestrationData && (
                      <CardDescription className="text-xs">
                        Showing individual brand syncs with regional breakdown
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Select value={historyRegionFilter} onValueChange={v => setHistoryRegionFilter(v === 'all' ? '' : v)}>
                      <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="All Regions" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        {ALL_REGIONS.map(r => (
                          <SelectItem key={r} value={r}>{REGION_FLAGS[r]?.flag} {REGION_FLAGS[r]?.name || r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (hasOrchestrationData) {
                        downloadCSV(runs.map(r => ({
                          started: r.started_at, status: r.status,
                          brands_synced: r.brands_synced, products: r.total_products_updated,
                          trigger: r.trigger_type,
                        })), 'sync-history');
                      } else {
                        downloadCSV(filteredSyncLogs.map(l => ({
                          started: l.started_at, brand: l.brand_slug, status: l.status,
                          products_updated: l.products_updated || 0, regions: (l.regions_synced || []).join(','),
                          duration_seconds: l.duration_seconds || 0, type: l.sync_type,
                        })), 'sync-history');
                      }
                    }}>
                      <Download className="w-4 h-4 mr-1" /> CSV
                    </Button>
                  </div>
                </div>
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
                                    <p className="text-xs text-destructive mt-2">Failed: {run.brands_failed.join(', ')}</p>
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
                  /* Brand sync logs table with regional breakdown */
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8" />
                        <TableHead>Started</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Regions</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSyncLogs.map(log => {
                        const breakdown = getRegionBreakdown(log);
                        const hasBreakdown = Object.keys(breakdown).length > 0;
                        const isExpanded = expandedLogId === log.id;
                        const totalUpdated = (log.products_updated || 0) + (log.products_created || 0);

                        return (
                          <>
                            <TableRow
                              key={log.id}
                              className={hasBreakdown ? 'cursor-pointer' : ''}
                              onClick={() => hasBreakdown && setExpandedLogId(isExpanded ? null : log.id)}
                            >
                              <TableCell className="px-2">
                                {hasBreakdown ? (
                                  isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                                ) : <span className="w-4 h-4 block" />}
                              </TableCell>
                              <TableCell className="text-xs whitespace-nowrap">
                                {format(new Date(log.started_at), 'MMM d, HH:mm')}
                              </TableCell>
                              <TableCell className="text-xs font-medium">{log.brand_slug}</TableCell>
                              <TableCell className="text-xs font-mono">
                                {log.duration_seconds ? `${Math.round(log.duration_seconds)}s` : '—'}
                              </TableCell>
                              <TableCell><StatusBadge status={log.status} /></TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {hasBreakdown ? (
                                    ALL_REGIONS.filter(r => r in breakdown || (log.regions_synced || []).includes(r)).map(r => {
                                      const detail = breakdown[r];
                                      const totalForRegion = (detail?.updated || 0) + (detail?.created || 0);
                                      const hasErrors = (detail?.errors || 0) > 0;
                                      const notAvail = detail?.reason === 'not_available' || (totalForRegion === 0 && !hasErrors);
                                      return (
                                        <span
                                          key={r}
                                          className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border ${
                                            notAvail
                                              ? 'bg-muted/50 text-muted-foreground border-border/30'
                                              : hasErrors && totalForRegion === 0
                                                ? 'bg-destructive/10 text-destructive border-destructive/30'
                                                : hasErrors
                                                  ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                                                  : 'bg-green-500/10 text-green-500 border-green-500/30'
                                          }`}
                                          title={`${REGION_FLAGS[r]?.name}: ${totalForRegion} synced, ${detail?.errors || 0} errors`}
                                        >
                                          <span>{REGION_FLAGS[r]?.flag}</span>
                                          {notAvail ? (
                                            <span>✗</span>
                                          ) : hasErrors && totalForRegion === 0 ? (
                                            <span>✗</span>
                                          ) : hasErrors ? (
                                            <span>⚠</span>
                                          ) : (
                                            <span>✓</span>
                                          )}
                                        </span>
                                      );
                                    })
                                  ) : log.region_code ? (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border bg-green-500/10 text-green-500 border-green-500/30">
                                      <span>{REGION_FLAGS[log.region_code]?.flag || '🌐'}</span>
                                      <span>✓</span>
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs font-mono text-right">{totalUpdated}</TableCell>
                              <TableCell className="text-xs capitalize">{log.sync_type}</TableCell>
                            </TableRow>

                            {/* Expanded regional detail row */}
                            {isExpanded && hasBreakdown && (
                              <TableRow key={`${log.id}-detail`}>
                                <TableCell colSpan={8} className="bg-muted/30 px-4 py-3">
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Regional Sync Details</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {ALL_REGIONS.map((r, idx) => {
                                        const detail = breakdown[r];
                                        const totalForRegion = (detail?.updated || 0) + (detail?.created || 0);
                                        const hasErrors = (detail?.errors || 0) > 0;
                                        const notAvail = !detail || detail.reason === 'not_available';
                                        const isLast = idx === ALL_REGIONS.length - 1;

                                        return (
                                          <div
                                            key={r}
                                            className={`flex items-start gap-2 p-2 rounded border text-xs ${
                                              notAvail
                                                ? 'bg-muted/30 border-border/30 text-muted-foreground'
                                                : hasErrors
                                                  ? 'bg-yellow-500/5 border-yellow-500/20'
                                                  : 'bg-green-500/5 border-green-500/20'
                                            }`}
                                          >
                                            <span className="text-base leading-none mt-0.5">{REGION_FLAGS[r]?.flag || '🌐'}</span>
                                            <div className="flex-1 min-w-0">
                                              <span className="font-medium">{REGION_FLAGS[r]?.name || r} ({r})</span>
                                              {notAvail ? (
                                                <p className="text-muted-foreground">Not available</p>
                                              ) : (
                                                <div className="space-y-0.5">
                                                  {(detail?.updated || 0) > 0 && (
                                                    <p className="text-green-500">{detail!.updated} updated</p>
                                                  )}
                                                  {(detail?.created || 0) > 0 && (
                                                    <p className="text-blue-500">{detail!.created} created</p>
                                                  )}
                                                  {(detail?.skipped || 0) > 0 && (
                                                    <p className="text-muted-foreground">{detail!.skipped} skipped</p>
                                                  )}
                                                  {(detail?.errors || 0) > 0 && (
                                                    <p className="text-destructive">{detail!.errors} errors</p>
                                                  )}
                                                  {totalForRegion === 0 && !hasErrors && (
                                                    <p className="text-muted-foreground">0 products</p>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Error details from products_processed */}
                                    {log.products_processed && Array.isArray(log.products_processed) && (() => {
                                      const errors = (log.products_processed as Record<string, unknown>[])
                                        .filter(p => p.action === 'error');
                                      if (errors.length === 0) return null;
                                      return (
                                        <div className="mt-2 space-y-1">
                                          <p className="text-xs font-medium text-destructive">Errors:</p>
                                          {errors.slice(0, 5).map((err, i) => (
                                            <p key={i} className="text-xs text-muted-foreground pl-3">
                                              • {(err.title as string) || (err.productId as string) || 'Unknown'} failed in {(err.region as string) || '?'}{err.reason ? ` (${err.reason})` : ''}
                                            </p>
                                          ))}
                                          {errors.length > 5 && (
                                            <p className="text-xs text-muted-foreground pl-3">…and {errors.length - 5} more</p>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                      {filteredSyncLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            {historyRegionFilter ? `No syncs found for ${REGION_FLAGS[historyRegionFilter]?.name || historyRegionFilter}` : 'No sync logs found'}
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
                        queryClient.invalidateQueries({ queryKey: ['sync-monitor-errors'] });
                        queryClient.invalidateQueries({ queryKey: ['sync-monitor-error-count'] });
                        toast.info('Refreshing errors...');
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Refresh
                      <span className="text-[10px] text-muted-foreground ml-1">
                        {format(errorsLastRefreshed, 'HH:mm:ss')}
                      </span>
                    </Button>
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

          {/* ── Tab: Buy Button Validator ─────────────────────────────────── */}
          <TabsContent value="buy-buttons">
            <BuyButtonValidator />
          </TabsContent>

          {/* ── Tab: Smart URL Repair ──────────────────────────────────── */}
          <TabsContent value="smart-validator">
            <SmartUrlValidator />
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
