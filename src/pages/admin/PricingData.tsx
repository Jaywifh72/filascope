import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageLoadingSkeleton } from '@/components/skeletons/PageLoadingSkeleton';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Search, ArrowUpRight, ArrowDownRight, Minus, ExternalLink, Loader2, Play, Zap, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { downloadCSV } from '@/lib/csvExport';
import { invalidatePriceCache } from '@/hooks/useCurrentPrice';

type LinkStatus = 'active' | 'stale' | 'broken' | 'alert' | 'unknown';

interface TestResult {
  status: 'testing' | 'ok' | 'broken' | 'redirect' | 'timeout';
  statusCode?: number;
  latencyMs?: number;
  redirectUrl?: string | null;
  error?: string;
}

interface SyncResult {
  status: 'syncing' | 'success' | 'failed' | 'unchanged';
  oldPrice?: number;
  newPrice?: number;
  percentChange?: number;
  error?: string;
}

interface PricingRow {
  id: string;
  product_title: string;
  vendor: string;
  material: string | null;
  variant_price: number | null;
  variant_compare_at_price: number | null;
  price_cad: number | null;
  price_eur: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  price_jpy: number | null;
  product_url: string | null;
  product_url_ca: string | null;
  product_url_uk: string | null;
  product_url_eu: string | null;
  product_url_au: string | null;
  product_url_jp: string | null;
  last_scraped_at: string | null;
  price_confidence: string | null;
  net_weight_g: number | null;
  priceChange: { percent: number; direction: 'up' | 'down' | 'unchanged'; oldPrice?: number; newPrice?: number } | null;
  linkStatus: LinkStatus;
}

function getLinkStatusBadge(status: LinkStatus) {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">🟢 Active</Badge>;
    case 'stale':
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">🟡 Stale</Badge>;
    case 'broken':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">🔴 Broken</Badge>;
    case 'alert':
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">🟣 Price Alert</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">—</Badge>;
  }
}

function getTestResultBadge(result: TestResult | undefined) {
  if (!result) return null;
  switch (result.status) {
    case 'testing':
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Testing…
        </Badge>
      );
    case 'ok':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] gap-1 cursor-default">
              <CheckCircle2 className="w-3 h-3" /> {result.statusCode} · {result.latencyMs}ms
            </Badge>
          </TooltipTrigger>
          <TooltipContent>HTTP {result.statusCode} — {result.latencyMs}ms response</TooltipContent>
        </Tooltip>
      );
    case 'redirect':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] gap-1 cursor-default">
              <AlertTriangle className="w-3 h-3" /> {result.statusCode} → Redirect
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>HTTP {result.statusCode} · {result.latencyMs}ms</p>
            {result.redirectUrl && <p className="text-[10px] mt-1 break-all">→ {result.redirectUrl}</p>}
          </TooltipContent>
        </Tooltip>
      );
    case 'broken':
    case 'timeout':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] gap-1 cursor-default">
              <XCircle className="w-3 h-3" /> {result.status === 'timeout' ? 'Timeout' : `${result.statusCode || 'Error'}`}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{result.error || `HTTP ${result.statusCode}`} · {result.latencyMs}ms</TooltipContent>
        </Tooltip>
      );
    default:
      return null;
  }
}

function PriceChangeIndicator({ change }: { change: PricingRow['priceChange'] }) {
  if (!change) return <span className="text-muted-foreground">—</span>;
  if (change.direction === 'unchanged') return <span className="text-muted-foreground flex items-center gap-1"><Minus className="w-3 h-3" /> —</span>;

  const diff = change.newPrice != null && change.oldPrice != null
    ? (change.newPrice - change.oldPrice)
    : null;
  const tooltipText = change.oldPrice != null && change.newPrice != null
    ? `Was $${change.oldPrice.toFixed(2)}, now $${change.newPrice.toFixed(2)} (${diff != null && diff > 0 ? '+' : ''}$${diff?.toFixed(2)})`
    : `${change.direction === 'up' ? '+' : '-'}${Math.abs(change.percent).toFixed(1)}%`;

  if (change.direction === 'up') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-red-400 flex items-center gap-0.5 font-mono text-xs cursor-default">
            <ArrowUpRight className="w-3 h-3" />↑{Math.abs(change.percent).toFixed(1)}%
          </span>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-emerald-400 flex items-center gap-0.5 font-mono text-xs cursor-default">
          <ArrowDownRight className="w-3 h-3" />↓{Math.abs(change.percent).toFixed(1)}%
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}

function formatCurrency(val: number | null, symbol: string) {
  if (val == null) return '—';
  return `${symbol}${val.toFixed(2)}`;
}

export default function PricingData() {
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map());
  const [syncResults, setSyncResults] = useState<Map<string, SyncResult>>(new Map());
  const [bulkTesting, setBulkTesting] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ tested: number; total: number } | null>(null);
  const [bulkSyncProgress, setBulkSyncProgress] = useState<{ done: number; total: number } | null>(null);
  const abortRef = useRef(false);
  const abortSyncRef = useRef(false);
  const queryClient = useQueryClient();

  // Fetch filaments with pricing data
  const { data: filaments, isLoading: filamentsLoading } = useQuery({
    queryKey: ['admin-pricing-data'],
    queryFn: async () => {
      // Fetch all products (no limit) using pagination
      const allData: any[] = [];
      const pageSize = 1000;
      let from = 0;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('filaments')
          .select('id, product_title, vendor, material, variant_price, variant_compare_at_price, price_cad, price_eur, price_gbp, price_aud, price_jpy, product_url, product_url_ca, product_url_uk, product_url_eu, product_url_au, product_url_jp, last_scraped_at, price_confidence, net_weight_g')
          .not('variant_price', 'is', null)
          .order('vendor', { ascending: true })
          .order('product_title', { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        allData.push(...(data || []));
        hasMore = (data?.length || 0) === pageSize;
        from += pageSize;
      }
      return allData;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch URL validation cache for link health
  const { data: urlCache } = useQuery({
    queryKey: ['admin-url-validation-cache'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('url_validation_cache')
        .select('url, status, status_code, last_checked');
      if (error) throw error;
      const map = new Map<string, { status: string; status_code: number | null; last_checked: string | null }>();
      (data || []).forEach(r => map.set(r.url, r));
      return map;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch recent price history to compute changes
  const { data: priceChanges } = useQuery({
    queryKey: ['admin-recent-price-changes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_history')
        .select('filament_id, price, recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      const grouped = new Map<string, number[]>();
      (data || []).forEach(r => {
        const existing = grouped.get(r.filament_id) || [];
        if (existing.length < 2) {
          existing.push(r.price);
          grouped.set(r.filament_id, existing);
        }
      });
      const changes = new Map<string, { percent: number; direction: 'up' | 'down' | 'unchanged'; oldPrice?: number; newPrice?: number }>();
      grouped.forEach((prices, id) => {
        if (prices.length < 2 || prices[1] === 0) {
          changes.set(id, { percent: 0, direction: 'unchanged' });
          return;
        }
        const [current, previous] = prices;
        const pct = ((current - previous) / previous) * 100;
        if (Math.abs(pct) < 0.1) {
          changes.set(id, { percent: 0, direction: 'unchanged' });
        } else {
          changes.set(id, { percent: pct, direction: pct > 0 ? 'up' : 'down', oldPrice: previous, newPrice: current });
        }
      });
      return changes;
    },
    staleTime: 1000 * 60 * 5,
  });

  function computeLinkStatus(url: string | null, priceChangePercent: number | null): LinkStatus {
    if (priceChangePercent != null && Math.abs(priceChangePercent) > 10) return 'alert';
    if (!url || !urlCache) return 'unknown';
    const cached = urlCache.get(url);
    if (!cached) return 'stale';
    if (cached.status === 'invalid' || (cached.status_code && cached.status_code >= 400)) return 'broken';
    if (cached.last_checked) {
      const checkedAt = new Date(cached.last_checked);
      const hoursSince = (Date.now() - checkedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince > 168) return 'stale';
      return 'active';
    }
    return 'stale';
  }

  const rows: PricingRow[] = useMemo(() => {
    if (!filaments) return [];
    return filaments.map(f => {
      const change = priceChanges?.get(f.id) || null;
      const changePct = change?.percent ?? null;
      return { ...f, priceChange: change, linkStatus: computeLinkStatus(f.product_url, changePct) };
    });
  }, [filaments, urlCache, priceChanges]);

  // Fetch ALL distinct vendors from the database (not just from loaded rows)
  const { data: allVendors } = useQuery({
    queryKey: ['admin-pricing-all-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('vendor')
        .not('variant_price', 'is', null)
        .not('vendor', 'is', null);
      if (error) throw error;
      const set = new Set((data || []).map(r => r.vendor).filter(Boolean));
      return Array.from(set).sort() as string[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const vendors = allVendors || [];

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (vendorFilter !== 'all' && r.vendor !== vendorFilter) return false;
      if (statusFilter !== 'all' && r.linkStatus !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.product_title?.toLowerCase().includes(q) && !r.vendor?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, vendorFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const active = rows.filter(r => r.linkStatus === 'active').length;
    const stale = rows.filter(r => r.linkStatus === 'stale' || r.linkStatus === 'unknown').length;
    const broken = rows.filter(r => r.linkStatus === 'broken').length;
    const alerts = rows.filter(r => r.linkStatus === 'alert').length;
    const withMultiRegion = rows.filter(r => [r.price_cad, r.price_eur, r.price_gbp, r.price_aud, r.price_jpy].filter(p => p != null).length > 0).length;
    const stalePrices = rows.filter(r => {
      if (!r.last_scraped_at) return true;
      return (Date.now() - new Date(r.last_scraped_at).getTime()) > 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { total: rows.length, active, stale, broken, alerts, withMultiRegion, stalePrices };
  }, [rows]);

  // --- Link testing ---
  const testSingleUrl = useCallback(async (rowId: string, url: string, showToast = true): Promise<TestResult> => {
    const startTime = Date.now();
    setTestResults(prev => new Map(prev).set(rowId, { status: 'testing' }));

    try {
      const { data, error } = await supabase.functions.invoke('test-url', {
        body: { url },
      });

      const latencyMs = Date.now() - startTime;

      if (error) throw error;

      let result: TestResult;
      if (data.ok) {
        result = { status: 'ok', statusCode: data.statusCode, latencyMs };
      } else if (data.isRedirect) {
        result = { status: 'redirect', statusCode: data.statusCode, latencyMs, redirectUrl: data.redirectLocation };
      } else {
        result = { status: 'broken', statusCode: data.statusCode, latencyMs, error: data.error };
      }

      setTestResults(prev => new Map(prev).set(rowId, result));

      // Update url_validation_cache
      const cacheStatus = result.status === 'ok' ? 'valid' : result.status === 'redirect' ? 'redirect' : 'invalid';
      await supabase
        .from('url_validation_cache')
        .upsert({
          url,
          status: cacheStatus,
          status_code: result.statusCode ?? null,
          redirect_url: result.redirectUrl ?? null,
          last_checked: new Date().toISOString(),
          check_count: 1,
        }, { onConflict: 'url' });

      if (showToast) {
        if (result.status === 'ok') toast.success(`✅ Link active (${result.statusCode}) — ${latencyMs}ms`);
        else if (result.status === 'redirect') toast.warning(`⚠️ Redirect (${result.statusCode}) → ${result.redirectUrl?.slice(0, 60) || 'unknown'}`);
        else toast.error(`❌ Link broken (${result.statusCode || result.error})`);
      }

      return result;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const isTimeout = latencyMs >= 4900 || err?.name === 'AbortError';
      const result: TestResult = {
        status: isTimeout ? 'timeout' : 'broken',
        latencyMs,
        error: isTimeout ? 'Request timeout (5s)' : (err?.message || 'Unknown error'),
      };
      setTestResults(prev => new Map(prev).set(rowId, result));

      await supabase
        .from('url_validation_cache')
        .upsert({
          url,
          status: 'invalid',
          status_code: null,
          redirect_url: null,
          last_checked: new Date().toISOString(),
          consecutive_failures: 1,
        }, { onConflict: 'url' });

      if (showToast) {
        toast.error(`❌ ${isTimeout ? 'Timeout (5s)' : 'Network error'}`);
      }

      return result;
    }
  }, []);

  const testBatch = useCallback(async (rowsToTest: PricingRow[]) => {
    const withUrls = rowsToTest.filter(r => r.product_url);
    if (withUrls.length === 0) {
      toast.info('No testable URLs in selection');
      return;
    }

    setBulkTesting(true);
    setBulkProgress({ tested: 0, total: withUrls.length });
    abortRef.current = false;
    const startTime = Date.now();
    let tested = 0;
    let ok = 0;
    let broken = 0;
    let warnings = 0;

    for (let i = 0; i < withUrls.length; i += 3) {
      if (abortRef.current) break;
      const batch = withUrls.slice(i, i + 3);
      const results = await Promise.all(
        batch.map(r => testSingleUrl(r.id, r.product_url!, false))
      );
      results.forEach(r => {
        tested++;
        if (r.status === 'ok') ok++;
        else if (r.status === 'broken' || r.status === 'timeout') broken++;
        else warnings++;
      });
      setBulkProgress({ tested, total: withUrls.length });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    setBulkTesting(false);
    setBulkProgress(null);
    toast.success(`Tested ${tested} links in ${elapsed}s — ${ok} active, ${broken} broken, ${warnings} warnings`);
  }, [testSingleUrl]);

  const handleTestSelected = useCallback(() => {
    const selectedRows = filtered.filter(r => selectedIds.has(r.id));
    testBatch(selectedRows);
  }, [filtered, selectedIds, testBatch]);

  const handleTestAllStale = useCallback(() => {
    const staleRows = filtered.filter(r => r.linkStatus === 'stale' || r.linkStatus === 'unknown');
    testBatch(staleRows);
  }, [filtered, testBatch]);

  // --- Price sync ---
  const syncSinglePrice = useCallback(async (row: PricingRow, showToast = true): Promise<SyncResult> => {
    if (!row.product_url) return { status: 'failed', error: 'No product URL' };
    if (row.linkStatus === 'broken') return { status: 'failed', error: 'Link is broken' };

    const oldPrice = row.variant_price;
    setSyncResults(prev => new Map(prev).set(row.id, { status: 'syncing' }));

    try {
      // Call get-current-price edge function
      const { data, error } = await supabase.functions.invoke('get-current-price', {
        body: {
          productUrl: row.product_url,
          forceRefresh: true,
          targetWeightGrams: row.net_weight_g,
        },
      });

      if (error) {
        const errorMsg = data?.error || error.message || 'Failed to fetch price';
        const result: SyncResult = { status: 'failed', error: errorMsg };
        setSyncResults(prev => new Map(prev).set(row.id, result));
        if (showToast) toast.error(`✗ Failed to sync price — ${errorMsg}`);
        return result;
      }

      if (!data?.success || data.price == null) {
        const errorMsg = data?.error || 'Invalid price data received';
        const result: SyncResult = { status: 'failed', error: errorMsg };
        setSyncResults(prev => new Map(prev).set(row.id, result));
        if (showToast) toast.error(`✗ ${errorMsg}`);
        return result;
      }

      const { price, compareAtPrice, currency = 'USD' } = data;

      // Persist via RPC
      const { error: rpcError } = await supabase.rpc('update_filament_price_after_refresh', {
        p_filament_id: row.id,
        p_new_price: price,
        p_compare_at_price: compareAtPrice || null,
        p_currency: currency,
        p_source: 'manual',
      });

      if (rpcError) {
        const errorMsg = rpcError.message?.includes('Unauthorized') ? 'Admin access required' : 'Failed to save price';
        const result: SyncResult = { status: 'failed', error: errorMsg };
        setSyncResults(prev => new Map(prev).set(row.id, result));
        if (showToast) toast.error(`✗ ${errorMsg}`);
        return result;
      }

      // Invalidate price cache
      invalidatePriceCache(row.product_url);

      // Determine result
      const priceChanged = oldPrice != null && Math.abs(price - oldPrice) > 0.01;
      const pctChange = oldPrice && oldPrice > 0 ? ((price - oldPrice) / oldPrice) * 100 : 0;

      const result: SyncResult = {
        status: priceChanged ? 'success' : 'unchanged',
        oldPrice: oldPrice ?? undefined,
        newPrice: price,
        percentChange: pctChange,
      };
      setSyncResults(prev => new Map(prev).set(row.id, result));

      if (showToast) {
        if (!priceChanged) {
          toast.success(`✓ Price confirmed: $${price.toFixed(2)}`);
        } else if (pctChange > 0) {
          toast.warning(`⚠️ Price increased: $${oldPrice?.toFixed(2)} → $${price.toFixed(2)} (+${pctChange.toFixed(1)}%)`);
        } else {
          toast.success(`✓ Price decreased: $${oldPrice?.toFixed(2)} → $${price.toFixed(2)} (${pctChange.toFixed(1)}%)`);
        }
      }

      return result;
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : 'Unexpected error';
      const result: SyncResult = { status: 'failed', error: errorMsg };
      setSyncResults(prev => new Map(prev).set(row.id, result));
      if (showToast) toast.error(`✗ ${errorMsg}`);
      return result;
    }
  }, []);

  const syncBatch = useCallback(async (rowsToSync: PricingRow[]) => {
    const syncable = rowsToSync.filter(r => r.product_url && r.linkStatus !== 'broken');
    if (syncable.length === 0) {
      toast.info('No syncable products in selection');
      return;
    }

    setBulkSyncing(true);
    setBulkSyncProgress({ done: 0, total: syncable.length });
    abortSyncRef.current = false;
    const startTime = Date.now();
    let done = 0;
    let updated = 0;
    let unchanged = 0;
    let failed = 0;

    // Batch of 2 to avoid rate limits
    for (let i = 0; i < syncable.length; i += 2) {
      if (abortSyncRef.current) break;
      const batch = syncable.slice(i, i + 2);
      const results = await Promise.all(
        batch.map(r => syncSinglePrice(r, false))
      );
      results.forEach(r => {
        done++;
        if (r.status === 'success') updated++;
        else if (r.status === 'unchanged') unchanged++;
        else failed++;
      });
      setBulkSyncProgress({ done, total: syncable.length });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    setBulkSyncing(false);
    setBulkSyncProgress(null);

    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['admin-pricing-data'] });
    queryClient.invalidateQueries({ queryKey: ['admin-recent-price-changes'] });

    if (abortSyncRef.current) {
      toast.info(`⚠️ Sync cancelled — ${done}/${syncable.length} completed (${updated} updated, ${unchanged} unchanged, ${failed} failed)`);
    } else {
      toast.success(`Synced ${done} prices in ${elapsed}s — ${updated} updated, ${unchanged} unchanged, ${failed} failed`);
    }
  }, [syncSinglePrice, queryClient]);

  const handleSyncSelected = useCallback(() => {
    const selectedRows = filtered.filter(r => selectedIds.has(r.id));
    syncBatch(selectedRows);
  }, [filtered, selectedIds, syncBatch]);

  const handleSyncStale = useCallback(() => {
    const staleRows = filtered.filter(r => {
      if (!r.last_scraped_at) return true;
      return (Date.now() - new Date(r.last_scraped_at).getTime()) > 7 * 24 * 60 * 60 * 1000;
    });
    syncBatch(staleRows);
  }, [filtered, syncBatch]);

  // --- CSV Export ---
  const handleExportPricing = useCallback(() => {
    const exportData = filtered.map(r => ({
      Product: r.product_title,
      Brand: r.vendor,
      Material: r.material || '',
      Status: r.linkStatus,
      USD: r.variant_price?.toFixed(2) || '',
      CAD: r.price_cad?.toFixed(2) || '',
      EUR: r.price_eur?.toFixed(2) || '',
      GBP: r.price_gbp?.toFixed(2) || '',
      AUD: r.price_aud?.toFixed(2) || '',
      JPY: r.price_jpy?.toFixed(2) || '',
      'Change %': r.priceChange?.percent?.toFixed(1) || '0',
      'Last Sync': r.last_scraped_at || '',
    }));
    downloadCSV(exportData, 'pricing-report');
    toast.success('Exported pricing report');
  }, [filtered]);

  const handleExportChanges = useCallback(() => {
    const changedRows = filtered.filter(r => r.priceChange && r.priceChange.direction !== 'unchanged');
    if (changedRows.length === 0) {
      toast.info('No price changes to export');
      return;
    }
    const exportData = changedRows.map(r => ({
      Product: r.product_title,
      Brand: r.vendor,
      'Old Price': r.priceChange?.oldPrice?.toFixed(2) || '',
      'New Price': r.priceChange?.newPrice?.toFixed(2) || '',
      'Change %': r.priceChange?.percent?.toFixed(1) || '',
      Direction: r.priceChange?.direction || '',
      'Last Sync': r.last_scraped_at || '',
    }));
    downloadCSV(exportData, 'price-changes');
    toast.success(`Exported ${changedRows.length} price changes`);
  }, [filtered]);

  // Selection helpers
  const visibleIds = useMemo(() => filtered.slice(0, 200).map(r => r.id), [filtered]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some(id => selectedIds.has(id));

  const toggleSelectAll = useCallback(() => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleIds));
    }
  }, [allVisibleSelected, visibleIds]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (filamentsLoading) {
    return <AdminLayout><PageLoadingSkeleton /></AdminLayout>;
  }

  const selectedCount = [...selectedIds].filter(id => visibleIds.includes(id)).length;
  const isBusy = bulkTesting || bulkSyncing;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pricing Data</h1>
            <p className="text-sm text-muted-foreground">Comprehensive raw pricing information across all regions</p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setStatusFilter('all')}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-[11px] text-muted-foreground">Total Products</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/30 bg-emerald-500/5 cursor-pointer hover:border-emerald-400/50 transition-colors" onClick={() => setStatusFilter('active')}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
              <p className="text-[11px] text-emerald-400/70">Active Links</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-yellow-500/5 cursor-pointer hover:border-yellow-400/50 transition-colors" onClick={() => setStatusFilter('stale')}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.stale}</p>
              <p className="text-[11px] text-yellow-400/70">Stale Links</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-red-500/5 cursor-pointer hover:border-red-400/50 transition-colors" onClick={() => setStatusFilter('broken')}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-400">{stats.broken}</p>
              <p className="text-[11px] text-red-400/70">Broken Links</p>
            </CardContent>
          </Card>
          <Card className="border-purple-500/30 bg-purple-500/5 cursor-pointer hover:border-purple-400/50 transition-colors" onClick={() => setStatusFilter('alert')}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.alerts}</p>
              <p className="text-[11px] text-purple-400/70">Price Alerts</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.withMultiRegion}</p>
              <p className="text-[11px] text-muted-foreground">Multi-Region</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or brand..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {vendors.map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">🟢 Active</SelectItem>
              <SelectItem value="stale">🟡 Stale</SelectItem>
              <SelectItem value="broken">🔴 Broken</SelectItem>
              <SelectItem value="alert">🟣 Price Alert</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground self-center">{filtered.length} results</span>
        </div>

        {/* Bulk action toolbar */}
        <div className="flex items-center gap-3 flex-wrap rounded-lg border border-border/50 bg-card p-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all visible"
            />
            <span className="text-xs text-muted-foreground">
              {selectedCount > 0 ? (
                <Badge variant="secondary" className="text-[10px]">{selectedCount} selected</Badge>
              ) : 'Select all'}
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          {/* Link testing buttons */}
          <Button
            size="sm"
            variant="outline"
            disabled={selectedCount === 0 || isBusy}
            onClick={handleTestSelected}
            className="text-xs gap-1.5"
          >
            {bulkTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Test Selected ({selectedCount})
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={handleTestAllStale}
            className="text-xs gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            Test All Stale
          </Button>
          <div className="h-4 w-px bg-border" />
          {/* Price sync buttons */}
          <Button
            size="sm"
            variant="outline"
            disabled={selectedCount === 0 || isBusy}
            onClick={handleSyncSelected}
            className="text-xs gap-1.5"
          >
            {bulkSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Resync Selected ({selectedCount})
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={handleSyncStale}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Resync Stale
            {stats.stalePrices > 0 && (
              <Badge variant="secondary" className="text-[9px] ml-1">{stats.stalePrices}</Badge>
            )}
          </Button>
          <div className="h-4 w-px bg-border" />
          {/* Export buttons */}
          <Button size="sm" variant="ghost" onClick={handleExportPricing} className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export Pricing
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportChanges} className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export Changes
          </Button>
          {isBusy && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { abortRef.current = true; abortSyncRef.current = true; }}
              className="text-xs text-destructive"
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Bulk progress bar */}
        {bulkProgress && (
          <div className="space-y-1">
            <Progress value={(bulkProgress.tested / bulkProgress.total) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Testing {bulkProgress.tested}/{bulkProgress.total} links…
            </p>
          </div>
        )}
        {bulkSyncProgress && (
          <div className="space-y-1">
            <Progress value={(bulkSyncProgress.done / bulkSyncProgress.total) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Syncing prices: {bulkSyncProgress.done}/{bulkSyncProgress.total}
            </p>
          </div>
        )}

        {/* Data table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="min-w-[220px]">Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Test Result</TableHead>
                    <TableHead className="text-right">USD</TableHead>
                    <TableHead className="text-right">CAD</TableHead>
                    <TableHead className="text-right">EUR</TableHead>
                    <TableHead className="text-right">GBP</TableHead>
                    <TableHead className="text-right">AUD</TableHead>
                    <TableHead className="text-right">JPY</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 200).map(row => {
                    const result = testResults.get(row.id);
                    const syncResult = syncResults.get(row.id);
                    const hasLargeChange = row.priceChange && Math.abs(row.priceChange.percent) > 10;
                    const displayPrice = syncResult?.status === 'success' || syncResult?.status === 'unchanged'
                      ? syncResult.newPrice ?? row.variant_price
                      : row.variant_price;

                    return (
                      <TableRow
                        key={row.id}
                        data-state={selectedIds.has(row.id) ? 'selected' : undefined}
                        className={hasLargeChange ? 'bg-purple-500/5' : undefined}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(row.id)}
                            onCheckedChange={() => toggleSelect(row.id)}
                            aria-label={`Select ${row.product_title}`}
                          />
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs truncate block">{row.product_title}</span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">{row.product_title}</TooltipContent>
                          </Tooltip>
                          {row.material && (
                            <span className="text-[10px] text-muted-foreground font-mono">{row.material}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{row.vendor}</TableCell>
                        <TableCell>{getLinkStatusBadge(row.linkStatus)}</TableCell>
                        <TableCell>
                          {result ? getTestResultBadge(result) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">⚪ Not Tested</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          <span className={
                            syncResult?.status === 'success' && syncResult.percentChange
                              ? syncResult.percentChange > 0 ? 'text-red-400' : 'text-emerald-400'
                              : ''
                          }>
                            {formatCurrency(displayPrice, '$')}
                          </span>
                          {row.variant_compare_at_price != null && row.variant_compare_at_price > (displayPrice ?? 0) && (
                            <span className="text-[10px] text-muted-foreground line-through ml-1">
                              ${row.variant_compare_at_price.toFixed(2)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatCurrency(row.price_cad, 'C$')}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatCurrency(row.price_eur, '€')}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatCurrency(row.price_gbp, '£')}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatCurrency(row.price_aud, 'A$')}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatCurrency(row.price_jpy, '¥')}</TableCell>
                        <TableCell><PriceChangeIndicator change={row.priceChange} /></TableCell>
                        <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {row.last_scraped_at
                            ? formatDistanceToNow(new Date(row.last_scraped_at), { addSuffix: true })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {/* Resync Price button */}
                            {row.product_url && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    disabled={syncResult?.status === 'syncing' || row.linkStatus === 'broken' || isBusy}
                                    onClick={() => syncSinglePrice(row)}
                                  >
                                    {syncResult?.status === 'syncing' ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <RefreshCw className={`w-3.5 h-3.5 ${syncResult?.status === 'success' ? 'text-emerald-400' : syncResult?.status === 'failed' ? 'text-red-400' : ''}`} />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {row.linkStatus === 'broken' ? 'Cannot sync — link is broken' : 'Fetch current price from store'}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {/* Test link button */}
                            {row.product_url && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    disabled={result?.status === 'testing' || isBusy}
                                    onClick={() => testSingleUrl(row.id, row.product_url!)}
                                  >
                                    {result?.status === 'testing' ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Test link</TooltipContent>
                              </Tooltip>
                            )}
                            {row.product_url ? (
                              <a
                                href={row.product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                        No pricing data found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {filtered.length > 200 && (
              <p className="text-xs text-muted-foreground text-center py-3">
                Showing 200 of {filtered.length} results. Use filters to narrow down.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
