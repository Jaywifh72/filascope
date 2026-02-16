import { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageLoadingSkeleton } from '@/components/skeletons/PageLoadingSkeleton';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Search, ArrowUpRight, ArrowDownRight, Minus, ExternalLink, Loader2, Play, Zap, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Download, ChevronRight, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { downloadCSV } from '@/lib/csvExport';
import { invalidatePriceCache } from '@/hooks/useCurrentPrice';

// =============================================
// Types
// =============================================

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

/** One store entry (region) for a product */
interface StoreRow {
  /** Unique key: `${filamentId}::${region}` */
  storeKey: string;
  filamentId: string;
  region: string;
  regionFlag: string;
  storeName: string;
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  currencySymbol: string;
  productUrl: string | null;
  lastScrapedAt: string | null;
  linkStatus: LinkStatus;
  priceChange: { percent: number; direction: 'up' | 'down' | 'unchanged'; oldPrice?: number; newPrice?: number } | null;
  netWeightG: number | null;
}

/** Parent product group */
interface ProductGroup {
  filamentId: string;
  productTitle: string;
  vendor: string;
  material: string | null;
  stores: StoreRow[];
  /** Summary counts */
  activeCount: number;
  staleCount: number;
  brokenCount: number;
  alertCount: number;
}

// =============================================
// Region config
// =============================================

const REGION_CONFIG: Record<string, { flag: string; currency: string; symbol: string; label: string }> = {
  US: { flag: '🇺🇸', currency: 'USD', symbol: '$', label: 'US' },
  CA: { flag: '🇨🇦', currency: 'CAD', symbol: 'C$', label: 'CA' },
  UK: { flag: '🇬🇧', currency: 'GBP', symbol: '£', label: 'UK' },
  EU: { flag: '🇪🇺', currency: 'EUR', symbol: '€', label: 'EU' },
  AU: { flag: '🇦🇺', currency: 'AUD', symbol: 'A$', label: 'AU' },
  JP: { flag: '🇯🇵', currency: 'JPY', symbol: '¥', label: 'JP' },
};

const REGION_FIELD_MAP: { region: string; priceField: string; urlField: string }[] = [
  { region: 'US', priceField: 'variant_price', urlField: 'product_url' },
  { region: 'CA', priceField: 'price_cad', urlField: 'product_url_ca' },
  { region: 'UK', priceField: 'price_gbp', urlField: 'product_url_uk' },
  { region: 'EU', priceField: 'price_eur', urlField: 'product_url_eu' },
  { region: 'AU', priceField: 'price_aud', urlField: 'product_url_au' },
  { region: 'JP', priceField: 'price_jpy', urlField: 'product_url_jp' },
];

// =============================================
// Helper components
// =============================================

function getLinkStatusBadge(status: LinkStatus) {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">🟢 Active</Badge>;
    case 'stale':
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">🟡 Stale</Badge>;
    case 'broken':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">🔴 Broken</Badge>;
    case 'alert':
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">🟣 Alert</Badge>;
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

function PriceChangeIndicator({ change }: { change: StoreRow['priceChange'] }) {
  if (!change) return <span className="text-muted-foreground">—</span>;
  if (change.direction === 'unchanged') return <span className="text-muted-foreground flex items-center gap-1"><Minus className="w-3 h-3" /> —</span>;

  const diff = change.newPrice != null && change.oldPrice != null
    ? (change.newPrice - change.oldPrice) : null;
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

function StatusSummary({ group }: { group: ProductGroup }) {
  const parts: React.ReactNode[] = [];
  if (group.activeCount > 0) parts.push(<span key="a" className="text-emerald-400">{group.activeCount} Active</span>);
  if (group.staleCount > 0) parts.push(<span key="s" className="text-yellow-400">{group.staleCount} Stale</span>);
  if (group.brokenCount > 0) parts.push(<span key="b" className="text-red-400">{group.brokenCount} Broken</span>);
  if (group.alertCount > 0) parts.push(<span key="al" className="text-purple-400">{group.alertCount} Alert</span>);
  if (parts.length === 0) return <span className="text-muted-foreground text-[10px]">No URLs</span>;
  return (
    <span className="text-[10px] flex items-center gap-1.5 flex-wrap">
      {parts.reduce((prev, curr, i) => i === 0 ? [curr] : [...(prev as React.ReactNode[]), <span key={`sep-${i}`} className="text-muted-foreground">·</span>, curr], [] as React.ReactNode[])}
    </span>
  );
}

// =============================================
// Main Component
// =============================================

export default function PricingData() {
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStoreKeys, setSelectedStoreKeys] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map());
  const [syncResults, setSyncResults] = useState<Map<string, SyncResult>>(new Map());
  const [bulkTesting, setBulkTesting] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkSyncProgress, setBulkSyncProgress] = useState<{ done: number; total: number } | null>(null);
  const abortRef = useRef(false);
  const abortSyncRef = useRef(false);
  const queryClient = useQueryClient();

  // =============================================
  // Data fetching
  // =============================================

  const { data: filaments, isLoading: filamentsLoading } = useQuery({
    queryKey: ['admin-pricing-data'],
    queryFn: async () => {
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

  // =============================================
  // Compute link status
  // =============================================

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

  // =============================================
  // Build grouped data: ProductGroup[]
  // =============================================

  const productGroups: ProductGroup[] = useMemo(() => {
    if (!filaments) return [];

    return filaments.map((f: any) => {
      const change = priceChanges?.get(f.id) || null;
      const stores: StoreRow[] = [];

      for (const { region, priceField, urlField } of REGION_FIELD_MAP) {
        const price = f[priceField] as number | null;
        const url = f[urlField] as string | null;
        // Only include regions that have a URL or price
        if (!url && price == null) continue;

        const rc = REGION_CONFIG[region];
        const storeKey = `${f.id}::${region}`;
        // For US, use the product-level price change. For other regions, no change data yet.
        const storeChange = region === 'US' ? change : null;
        const changePct = storeChange?.percent ?? null;

        stores.push({
          storeKey,
          filamentId: f.id,
          region,
          regionFlag: rc.flag,
          storeName: `${f.vendor} ${rc.label}`,
          price,
          compareAtPrice: region === 'US' ? f.variant_compare_at_price : null,
          currency: rc.currency,
          currencySymbol: rc.symbol,
          productUrl: url,
          lastScrapedAt: region === 'US' ? f.last_scraped_at : null,
          linkStatus: computeLinkStatus(url, changePct),
          priceChange: storeChange,
          netWeightG: f.net_weight_g,
        });
      }

      const activeCount = stores.filter(s => s.linkStatus === 'active').length;
      const staleCount = stores.filter(s => s.linkStatus === 'stale' || s.linkStatus === 'unknown').length;
      const brokenCount = stores.filter(s => s.linkStatus === 'broken').length;
      const alertCount = stores.filter(s => s.linkStatus === 'alert').length;

      return {
        filamentId: f.id,
        productTitle: f.product_title,
        vendor: f.vendor,
        material: f.material,
        stores,
        activeCount,
        staleCount,
        brokenCount,
        alertCount,
      } as ProductGroup;
    }).filter((g: ProductGroup) => g.stores.length > 0);
  }, [filaments, urlCache, priceChanges]);

  // =============================================
  // Filtering
  // =============================================

  const filtered = useMemo(() => {
    return productGroups.filter(g => {
      if (vendorFilter !== 'all' && g.vendor !== vendorFilter) return false;
      if (statusFilter !== 'all') {
        // Filter: at least one store must match status
        const hasMatch = g.stores.some(s => {
          if (statusFilter === 'stale') return s.linkStatus === 'stale' || s.linkStatus === 'unknown';
          return s.linkStatus === statusFilter;
        });
        if (!hasMatch) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!g.productTitle?.toLowerCase().includes(q) && !g.vendor?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [productGroups, vendorFilter, statusFilter, search]);

  // =============================================
  // Stats
  // =============================================

  const stats = useMemo(() => {
    let totalStores = 0;
    let active = 0;
    let stale = 0;
    let broken = 0;
    let alerts = 0;
    let multiRegion = 0;

    for (const g of productGroups) {
      totalStores += g.stores.length;
      active += g.activeCount;
      stale += g.staleCount;
      broken += g.brokenCount;
      alerts += g.alertCount;
      if (g.stores.length > 1) multiRegion++;
    }

    const stalePrices = productGroups.reduce((acc, g) => {
      return acc + g.stores.filter(s => {
        if (!s.lastScrapedAt) return true;
        return (Date.now() - new Date(s.lastScrapedAt).getTime()) > 7 * 24 * 60 * 60 * 1000;
      }).length;
    }, 0);

    return { totalProducts: productGroups.length, totalStores, active, stale, broken, alerts, multiRegion, stalePrices };
  }, [productGroups]);

  // =============================================
  // All visible store keys (for selection)
  // =============================================

  const visibleStoreKeys = useMemo(() => {
    const keys: string[] = [];
    for (const g of filtered.slice(0, 200)) {
      if (expandedProducts.has(g.filamentId)) {
        for (const s of g.stores) {
          keys.push(s.storeKey);
        }
      }
    }
    return keys;
  }, [filtered, expandedProducts]);

  const selectedCount = [...selectedStoreKeys].filter(k => visibleStoreKeys.includes(k)).length;
  const allVisibleSelected = visibleStoreKeys.length > 0 && visibleStoreKeys.every(k => selectedStoreKeys.has(k));

  // =============================================
  // Expand/Collapse
  // =============================================

  const toggleExpand = useCallback((id: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedProducts(new Set(filtered.slice(0, 200).map(g => g.filamentId)));
  }, [filtered]);

  const collapseAll = useCallback(() => {
    setExpandedProducts(new Set());
  }, []);

  // =============================================
  // Selection
  // =============================================

  const toggleSelectAll = useCallback(() => {
    if (allVisibleSelected) {
      setSelectedStoreKeys(new Set());
    } else {
      setSelectedStoreKeys(new Set(visibleStoreKeys));
    }
  }, [allVisibleSelected, visibleStoreKeys]);

  const toggleSelectStore = useCallback((key: string) => {
    setSelectedStoreKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // =============================================
  // Helpers to find store row from key
  // =============================================

  const storeKeyMap = useMemo(() => {
    const map = new Map<string, { store: StoreRow; group: ProductGroup }>();
    for (const g of productGroups) {
      for (const s of g.stores) {
        map.set(s.storeKey, { store: s, group: g });
      }
    }
    return map;
  }, [productGroups]);

  // =============================================
  // Link testing (per store)
  // =============================================

  const testSingleUrl = useCallback(async (storeKey: string, url: string, showToast = true): Promise<TestResult> => {
    const startTime = Date.now();
    setTestResults(prev => new Map(prev).set(storeKey, { status: 'testing' }));

    try {
      const { data, error } = await supabase.functions.invoke('test-url', { body: { url } });
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

      setTestResults(prev => new Map(prev).set(storeKey, result));

      const cacheStatus = result.status === 'ok' ? 'valid' : result.status === 'redirect' ? 'redirect' : 'invalid';
      await supabase.from('url_validation_cache').upsert({
        url,
        status: cacheStatus,
        status_code: result.statusCode ?? null,
        redirect_url: result.redirectUrl ?? null,
        last_checked: new Date().toISOString(),
        check_count: 1,
      }, { onConflict: 'url' });

      if (showToast) {
        if (result.status === 'ok') toast.success(`✅ Link active (${result.statusCode}) — ${latencyMs}ms`);
        else if (result.status === 'redirect') toast.warning(`⚠️ Redirect (${result.statusCode})`);
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
      setTestResults(prev => new Map(prev).set(storeKey, result));

      await supabase.from('url_validation_cache').upsert({
        url,
        status: 'invalid',
        status_code: null,
        redirect_url: null,
        last_checked: new Date().toISOString(),
        consecutive_failures: 1,
      }, { onConflict: 'url' });

      if (showToast) toast.error(`❌ ${isTimeout ? 'Timeout (5s)' : 'Network error'}`);
      return result;
    }
  }, []);

  const testBatch = useCallback(async (storesToTest: StoreRow[]) => {
    const withUrls = storesToTest.filter(s => s.productUrl);
    if (withUrls.length === 0) { toast.info('No testable URLs'); return; }

    setBulkTesting(true);
    setBulkProgress({ done: 0, total: withUrls.length });
    abortRef.current = false;
    const startTime = Date.now();
    let done = 0, ok = 0, broken = 0, warnings = 0;

    for (let i = 0; i < withUrls.length; i += 3) {
      if (abortRef.current) break;
      const batch = withUrls.slice(i, i + 3);
      const results = await Promise.all(batch.map(s => testSingleUrl(s.storeKey, s.productUrl!, false)));
      results.forEach(r => { done++; if (r.status === 'ok') ok++; else if (r.status === 'broken' || r.status === 'timeout') broken++; else warnings++; });
      setBulkProgress({ done, total: withUrls.length });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    setBulkTesting(false);
    setBulkProgress(null);
    toast.success(`Tested ${done} store links in ${elapsed}s — ${ok} active, ${broken} broken, ${warnings} warnings`);
  }, [testSingleUrl]);

  // =============================================
  // Price sync (per store)
  // =============================================

  const syncSinglePrice = useCallback(async (store: StoreRow, showToast = true): Promise<SyncResult> => {
    if (!store.productUrl) return { status: 'failed', error: 'No product URL' };
    if (store.linkStatus === 'broken') return { status: 'failed', error: 'Link is broken' };

    const oldPrice = store.price;
    setSyncResults(prev => new Map(prev).set(store.storeKey, { status: 'syncing' }));

    try {
      const { data, error } = await supabase.functions.invoke('get-current-price', {
        body: { productUrl: store.productUrl, forceRefresh: true, targetWeightGrams: store.netWeightG },
      });

      if (error) {
        const errorMsg = data?.error || error.message || 'Failed to fetch price';
        const result: SyncResult = { status: 'failed', error: errorMsg };
        setSyncResults(prev => new Map(prev).set(store.storeKey, result));
        if (showToast) toast.error(`✗ Failed to sync — ${errorMsg}`);
        return result;
      }

      if (!data?.success || data.price == null) {
        const errorMsg = data?.error || 'Invalid price data';
        const result: SyncResult = { status: 'failed', error: errorMsg };
        setSyncResults(prev => new Map(prev).set(store.storeKey, result));
        if (showToast) toast.error(`✗ ${errorMsg}`);
        return result;
      }

      const { price, compareAtPrice, currency = store.currency } = data;

      const { error: rpcError } = await supabase.rpc('update_filament_price_after_refresh', {
        p_filament_id: store.filamentId,
        p_new_price: price,
        p_compare_at_price: compareAtPrice || null,
        p_currency: currency,
        p_source: 'manual',
      });

      if (rpcError) {
        const errorMsg = rpcError.message?.includes('Unauthorized') ? 'Admin access required' : 'Failed to save price';
        const result: SyncResult = { status: 'failed', error: errorMsg };
        setSyncResults(prev => new Map(prev).set(store.storeKey, result));
        if (showToast) toast.error(`✗ ${errorMsg}`);
        return result;
      }

      invalidatePriceCache(store.productUrl);

      const priceChanged = oldPrice != null && Math.abs(price - oldPrice) > 0.01;
      const pctChange = oldPrice && oldPrice > 0 ? ((price - oldPrice) / oldPrice) * 100 : 0;

      const result: SyncResult = {
        status: priceChanged ? 'success' : 'unchanged',
        oldPrice: oldPrice ?? undefined,
        newPrice: price,
        percentChange: pctChange,
      };
      setSyncResults(prev => new Map(prev).set(store.storeKey, result));

      if (showToast) {
        if (!priceChanged) toast.success(`✓ Price confirmed: ${store.currencySymbol}${price.toFixed(2)}`);
        else if (pctChange > 0) toast.warning(`⚠️ Price increased: ${store.currencySymbol}${oldPrice?.toFixed(2)} → ${store.currencySymbol}${price.toFixed(2)} (+${pctChange.toFixed(1)}%)`);
        else toast.success(`✓ Price decreased: ${store.currencySymbol}${oldPrice?.toFixed(2)} → ${store.currencySymbol}${price.toFixed(2)} (${pctChange.toFixed(1)}%)`);
      }
      return result;
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : 'Unexpected error';
      const result: SyncResult = { status: 'failed', error: errorMsg };
      setSyncResults(prev => new Map(prev).set(store.storeKey, result));
      if (showToast) toast.error(`✗ ${errorMsg}`);
      return result;
    }
  }, []);

  const syncBatch = useCallback(async (storesToSync: StoreRow[]) => {
    const syncable = storesToSync.filter(s => s.productUrl && s.linkStatus !== 'broken');
    if (syncable.length === 0) { toast.info('No syncable stores'); return; }

    setBulkSyncing(true);
    setBulkSyncProgress({ done: 0, total: syncable.length });
    abortSyncRef.current = false;
    const startTime = Date.now();
    let done = 0, updated = 0, unchanged = 0, failed = 0;

    for (let i = 0; i < syncable.length; i += 2) {
      if (abortSyncRef.current) break;
      const batch = syncable.slice(i, i + 2);
      const results = await Promise.all(batch.map(s => syncSinglePrice(s, false)));
      results.forEach(r => { done++; if (r.status === 'success') updated++; else if (r.status === 'unchanged') unchanged++; else failed++; });
      setBulkSyncProgress({ done, total: syncable.length });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    setBulkSyncing(false);
    setBulkSyncProgress(null);
    queryClient.invalidateQueries({ queryKey: ['admin-pricing-data'] });
    queryClient.invalidateQueries({ queryKey: ['admin-recent-price-changes'] });

    if (abortSyncRef.current) {
      toast.info(`⚠️ Sync cancelled — ${done}/${syncable.length} (${updated} updated, ${unchanged} unchanged, ${failed} failed)`);
    } else {
      toast.success(`Synced ${done} store prices in ${elapsed}s — ${updated} updated, ${unchanged} unchanged, ${failed} failed`);
    }
  }, [syncSinglePrice, queryClient]);

  // =============================================
  // Bulk action handlers
  // =============================================

  const getSelectedStores = useCallback((): StoreRow[] => {
    return [...selectedStoreKeys]
      .map(k => storeKeyMap.get(k)?.store)
      .filter(Boolean) as StoreRow[];
  }, [selectedStoreKeys, storeKeyMap]);

  const handleTestSelected = useCallback(() => {
    testBatch(getSelectedStores());
  }, [getSelectedStores, testBatch]);

  const handleTestAllStale = useCallback(() => {
    const staleStores: StoreRow[] = [];
    for (const g of filtered) {
      for (const s of g.stores) {
        if (s.linkStatus === 'stale' || s.linkStatus === 'unknown') staleStores.push(s);
      }
    }
    testBatch(staleStores);
  }, [filtered, testBatch]);

  const handleSyncSelected = useCallback(() => {
    syncBatch(getSelectedStores());
  }, [getSelectedStores, syncBatch]);

  const handleSyncStale = useCallback(() => {
    const staleStores: StoreRow[] = [];
    for (const g of filtered) {
      for (const s of g.stores) {
        if (!s.lastScrapedAt || (Date.now() - new Date(s.lastScrapedAt).getTime()) > 7 * 24 * 60 * 60 * 1000) {
          staleStores.push(s);
        }
      }
    }
    syncBatch(staleStores);
  }, [filtered, syncBatch]);

  // =============================================
  // CSV Export
  // =============================================

  const handleExportPricing = useCallback(() => {
    const exportData: Record<string, string>[] = [];
    for (const g of filtered) {
      for (const s of g.stores) {
        exportData.push({
          Product: g.productTitle,
          Brand: g.vendor,
          Material: g.material || '',
          Store: s.storeName,
          Region: s.region,
          Price: s.price?.toFixed(2) || '',
          Currency: s.currency,
          Status: s.linkStatus,
          'Change %': s.priceChange?.percent?.toFixed(1) || '0',
          'Last Sync': s.lastScrapedAt || '',
          URL: s.productUrl || '',
        });
      }
    }
    downloadCSV(exportData, 'pricing-report');
    toast.success('Exported pricing report');
  }, [filtered]);

  const handleExportChanges = useCallback(() => {
    const exportData: Record<string, string>[] = [];
    for (const g of filtered) {
      for (const s of g.stores) {
        if (s.priceChange && s.priceChange.direction !== 'unchanged') {
          exportData.push({
            Product: g.productTitle,
            Brand: g.vendor,
            Store: s.storeName,
            'Old Price': s.priceChange.oldPrice?.toFixed(2) || '',
            'New Price': s.priceChange.newPrice?.toFixed(2) || '',
            'Change %': s.priceChange.percent?.toFixed(1) || '',
            Currency: s.currency,
          });
        }
      }
    }
    if (exportData.length === 0) { toast.info('No price changes to export'); return; }
    downloadCSV(exportData, 'price-changes');
    toast.success(`Exported ${exportData.length} price changes`);
  }, [filtered]);

  // =============================================
  // Render
  // =============================================

  if (filamentsLoading) {
    return <AdminLayout><PageLoadingSkeleton /></AdminLayout>;
  }

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
            <p className="text-sm text-muted-foreground">
              {stats.totalProducts.toLocaleString()} products across {stats.totalStores.toLocaleString()} store entries
            </p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setStatusFilter('all')}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.totalProducts.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">{stats.totalStores.toLocaleString()} stores</p>
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
              <p className="text-2xl font-bold text-foreground">{stats.multiRegion}</p>
              <p className="text-[11px] text-muted-foreground">Multi-Region</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or brand..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {vendors.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
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
          <span className="text-xs text-muted-foreground self-center">{filtered.length} products</span>
        </div>

        {/* Bulk action toolbar */}
        <div className="flex items-center gap-3 flex-wrap rounded-lg border border-border/50 bg-card p-3">
          <div className="flex items-center gap-2">
            <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAll} aria-label="Select all visible" />
            <span className="text-xs text-muted-foreground">
              {selectedCount > 0 ? <Badge variant="secondary" className="text-[10px]">{selectedCount} stores</Badge> : 'Select all'}
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          {/* Expand/collapse */}
          <Button size="sm" variant="ghost" onClick={expandAll} className="text-xs gap-1.5">
            <ChevronsUpDown className="w-3.5 h-3.5" /> Expand All
          </Button>
          <Button size="sm" variant="ghost" onClick={collapseAll} className="text-xs gap-1.5">
            Collapse All
          </Button>
          <div className="h-4 w-px bg-border" />
          {/* Link testing */}
          <Button size="sm" variant="outline" disabled={selectedCount === 0 || isBusy} onClick={handleTestSelected} className="text-xs gap-1.5">
            {bulkTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Test Selected ({selectedCount})
          </Button>
          <Button size="sm" variant="outline" disabled={isBusy} onClick={handleTestAllStale} className="text-xs gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Test All Stale
          </Button>
          <div className="h-4 w-px bg-border" />
          {/* Price sync */}
          <Button size="sm" variant="outline" disabled={selectedCount === 0 || isBusy} onClick={handleSyncSelected} className="text-xs gap-1.5">
            {bulkSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Resync Selected ({selectedCount})
          </Button>
          <Button size="sm" variant="outline" disabled={isBusy} onClick={handleSyncStale} className="text-xs gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Resync Stale
            {stats.stalePrices > 0 && <Badge variant="secondary" className="text-[9px] ml-1">{stats.stalePrices}</Badge>}
          </Button>
          <div className="h-4 w-px bg-border" />
          {/* Export */}
          <Button size="sm" variant="ghost" onClick={handleExportPricing} className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportChanges} className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Changes
          </Button>
          {isBusy && (
            <Button size="sm" variant="ghost" onClick={() => { abortRef.current = true; abortSyncRef.current = true; }} className="text-xs text-destructive">
              Cancel
            </Button>
          )}
        </div>

        {/* Progress bars */}
        {bulkProgress && (
          <div className="space-y-1">
            <Progress value={(bulkProgress.done / bulkProgress.total) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">Testing store links: {bulkProgress.done}/{bulkProgress.total}</p>
          </div>
        )}
        {bulkSyncProgress && (
          <div className="space-y-1">
            <Progress value={(bulkSyncProgress.done / bulkSyncProgress.total) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">Syncing prices: {bulkSyncProgress.done}/{bulkSyncProgress.total}</p>
          </div>
        )}

        {/* Data table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-10">
                      <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />
                    </TableHead>
                    <TableHead className="min-w-[220px]">Product / Store</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Compare</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Test Result</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 200).map(group => {
                    const isExpanded = expandedProducts.has(group.filamentId);

                    return (
                      <ProductGroupRows
                        key={group.filamentId}
                        group={group}
                        isExpanded={isExpanded}
                        onToggleExpand={() => toggleExpand(group.filamentId)}
                        selectedStoreKeys={selectedStoreKeys}
                        onToggleSelectStore={toggleSelectStore}
                        testResults={testResults}
                        syncResults={syncResults}
                        isBusy={isBusy}
                        onTestUrl={testSingleUrl}
                        onSyncPrice={syncSinglePrice}
                      />
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                        No pricing data found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {filtered.length > 200 && (
              <p className="text-xs text-muted-foreground text-center py-3">
                Showing 200 of {filtered.length} products. Use filters to narrow down.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

// =============================================
// ProductGroupRows - renders parent + children
// =============================================

interface ProductGroupRowsProps {
  group: ProductGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedStoreKeys: Set<string>;
  onToggleSelectStore: (key: string) => void;
  testResults: Map<string, TestResult>;
  syncResults: Map<string, SyncResult>;
  isBusy: boolean;
  onTestUrl: (storeKey: string, url: string, showToast?: boolean) => Promise<TestResult>;
  onSyncPrice: (store: StoreRow, showToast?: boolean) => Promise<SyncResult>;
}

function ProductGroupRows({
  group, isExpanded, onToggleExpand, selectedStoreKeys, onToggleSelectStore,
  testResults, syncResults, isBusy, onTestUrl, onSyncPrice,
}: ProductGroupRowsProps) {
  return (
    <>
      {/* Parent row */}
      <TableRow
        className="bg-muted/30 hover:bg-muted/50 cursor-pointer border-b-0"
        onClick={onToggleExpand}
      >
        <TableCell className="w-8 px-2">
          {isExpanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </TableCell>
        <TableCell className="w-10">
          {/* No checkbox on parent — selection is per store */}
        </TableCell>
        <TableCell className="min-w-[220px]" colSpan={1}>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-foreground truncate max-w-[300px] block">{group.productTitle}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{group.vendor}</span>
              {group.material && <span className="text-[10px] text-muted-foreground font-mono">· {group.material}</span>}
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">{group.stores.length} store{group.stores.length !== 1 ? 's' : ''}</Badge>
            </div>
          </div>
        </TableCell>
        <TableCell colSpan={4}></TableCell>
        <TableCell colSpan={1}>
          <StatusSummary group={group} />
        </TableCell>
        <TableCell colSpan={3}></TableCell>
      </TableRow>

      {/* Child store rows */}
      {isExpanded && group.stores.map((store, idx) => {
        const result = testResults.get(store.storeKey);
        const syncResult = syncResults.get(store.storeKey);
        const displayPrice = syncResult?.status === 'success' || syncResult?.status === 'unchanged'
          ? syncResult.newPrice ?? store.price
          : store.price;
        const isLast = idx === group.stores.length - 1;

        return (
          <TableRow
            key={store.storeKey}
            className={`${isLast ? '' : 'border-b-0'} hover:bg-muted/20`}
          >
            <TableCell className="w-8 px-2">
              {/* Connecting line indicator */}
              <span className="text-muted-foreground/40 text-xs pl-1">└</span>
            </TableCell>
            <TableCell className="w-10">
              <Checkbox
                checked={selectedStoreKeys.has(store.storeKey)}
                onCheckedChange={() => onToggleSelectStore(store.storeKey)}
                aria-label={`Select ${store.storeName}`}
              />
            </TableCell>
            <TableCell className="min-w-[220px]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs flex items-center gap-1.5 cursor-default">
                    <span>{store.regionFlag}</span>
                    <span className="font-medium">{group.vendor} {store.region}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {store.productUrl ? new URL(store.productUrl).hostname : 'No URL'}
                </TooltipContent>
              </Tooltip>
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              <span className={
                syncResult?.status === 'success' && syncResult.percentChange
                  ? syncResult.percentChange > 0 ? 'text-red-400' : 'text-emerald-400'
                  : ''
              }>
                {formatCurrency(displayPrice, store.currencySymbol)}
              </span>
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {store.compareAtPrice != null && store.compareAtPrice > (displayPrice ?? 0)
                ? <span className="text-muted-foreground line-through">{formatCurrency(store.compareAtPrice, store.currencySymbol)}</span>
                : '—'}
            </TableCell>
            <TableCell><PriceChangeIndicator change={store.priceChange} /></TableCell>
            <TableCell className="text-xs text-muted-foreground">{store.currency}</TableCell>
            <TableCell>{getLinkStatusBadge(store.linkStatus)}</TableCell>
            <TableCell>
              {result ? getTestResultBadge(result) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">⚪ Not Tested</Badge>
              )}
            </TableCell>
            <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
              {store.lastScrapedAt
                ? formatDistanceToNow(new Date(store.lastScrapedAt), { addSuffix: true })
                : '—'}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {store.productUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7"
                        disabled={syncResult?.status === 'syncing' || store.linkStatus === 'broken' || isBusy}
                        onClick={() => onSyncPrice(store)}
                      >
                        {syncResult?.status === 'syncing'
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <RefreshCw className={`w-3.5 h-3.5 ${syncResult?.status === 'success' ? 'text-emerald-400' : syncResult?.status === 'failed' ? 'text-red-400' : ''}`} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{store.linkStatus === 'broken' ? 'Cannot sync — broken link' : 'Sync price'}</TooltipContent>
                  </Tooltip>
                )}
                {store.productUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7"
                        disabled={result?.status === 'testing' || isBusy}
                        onClick={() => onTestUrl(store.storeKey, store.productUrl!)}
                      >
                        {result?.status === 'testing'
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Play className="w-3.5 h-3.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Test link</TooltipContent>
                  </Tooltip>
                )}
                {store.productUrl ? (
                  <a href={store.productUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
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
    </>
  );
}
