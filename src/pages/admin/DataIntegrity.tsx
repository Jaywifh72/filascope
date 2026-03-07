import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Play, AlertTriangle, CheckCircle, XCircle, Database, Trash2, Loader2, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PriceSourceAudit } from '@/components/admin/data-integrity/PriceSourceAudit';
import { TableUsageAudit } from '@/components/admin/data-integrity/TableUsageAudit';
import { PriceSourceConflicts } from '@/components/admin/data-integrity/PriceSourceConflicts';

// ── Helpers ──

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Updated just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours}h ago`;
}

function SectionHeader({ title, dataUpdatedAt }: { title: string; dataUpdatedAt?: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {dataUpdatedAt != null && dataUpdatedAt > 0 && (
        <span className="text-xs text-muted-foreground">{formatRelativeTime(dataUpdatedAt)}</span>
      )}
    </div>
  );
}

function CoverageIndicator({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-red-500';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} bg-current`} />;
}

function StatCard({
  title,
  stats,
  coveragePct,
  action,
}: {
  title: string;
  stats: { label: string; value: string | number }[];
  coveragePct?: number;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {coveragePct !== undefined && <CoverageIndicator pct={coveragePct} />}
            {title}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {stats.map((s) => (
          <div key={s.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-mono font-semibold">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Section 1: Table Coverage ──

function useTableCoverage() {
  return useQuery({
    queryKey: ['data-integrity', 'table-coverage'],
    queryFn: async () => {
      const [
        filTotal,
        filWithPrice,
        filWithoutPrice,
        listingsTotal,
        listingFilamentIds,
        effectiveCoverage,
        prpTotal,
        prpProductIds,
        bsiTotal,
        bsiImported,
        bsiNew,
        bsiMatched,
        bsiPriceChanged,
        bsiSkipped,
        bsiError,
        phTotal,
        phMinMax,
        fpTotal,
        pruTotal,
        pruProductIds,
        flatPriceCount,
        flatUrlCount,
      ] = await Promise.all([
        supabase.from('filaments').select('*', { count: 'exact', head: true }),
        supabase.from('filaments').select('*', { count: 'exact', head: true }).not('variant_price', 'is', null),
        supabase.from('filaments').select('*', { count: 'exact', head: true }).is('variant_price', null),
        supabase.from('filament_listings').select('*', { count: 'exact', head: true }),
        supabase.from('filament_listings').select('filament_id'),
        // Effective coverage: filaments with at least one price AND at least one URL (synthetic fallback works)
        supabase.from('filaments').select('*', { count: 'exact', head: true })
          .or('variant_price.not.is.null,price_aud.not.is.null,price_cad.not.is.null,price_eur.not.is.null,price_gbp.not.is.null,price_jpy.not.is.null')
          .or('product_url.not.is.null,product_url_au.not.is.null,product_url_ca.not.is.null,product_url_eu.not.is.null,product_url_jp.not.is.null,product_url_uk.not.is.null'),
        supabase.from('product_regional_prices').select('*', { count: 'exact', head: true }),
        supabase.from('product_regional_prices').select('product_id'),
        supabase.from('brand_sync_items').select('*', { count: 'exact', head: true }),
        supabase.from('brand_sync_items').select('*', { count: 'exact', head: true }).eq('status', 'imported'),
        supabase.from('brand_sync_items').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('brand_sync_items').select('*', { count: 'exact', head: true }).eq('status', 'matched'),
        supabase.from('brand_sync_items').select('*', { count: 'exact', head: true }).eq('status', 'price_changed'),
        supabase.from('brand_sync_items').select('*', { count: 'exact', head: true }).eq('status', 'skipped'),
        supabase.from('brand_sync_items').select('*', { count: 'exact', head: true }).eq('status', 'error'),
        supabase.from('price_history').select('*', { count: 'exact', head: true }),
        supabase.from('price_history').select('recorded_at').order('recorded_at', { ascending: true }).limit(1),
        // Schema health queries
        supabase.from('filament_properties').select('*', { count: 'exact', head: true }),
        supabase.from('product_regional_urls').select('*', { count: 'exact', head: true }),
        supabase.from('product_regional_urls').select('product_id'),
        supabase.from('filaments').select('*', { count: 'exact', head: true })
          .or('price_cad.not.is.null,price_eur.not.is.null,price_gbp.not.is.null,price_aud.not.is.null,price_jpy.not.is.null'),
        supabase.from('filaments').select('*', { count: 'exact', head: true })
          .or('product_url_ca.not.is.null,product_url_eu.not.is.null,product_url_uk.not.is.null,product_url_au.not.is.null,product_url_jp.not.is.null'),
      ]);

      const uniqueListingFilaments = new Set((listingFilamentIds.data || []).map((r: any) => r.filament_id)).size;
      const uniquePrpProducts = new Set((prpProductIds.data || []).map((r: any) => r.product_id)).size;
      const total = filTotal.count || 0;
      const effectiveCount = effectiveCoverage.count || 0;

      return {
        filaments: { total, withPrice: filWithPrice.count || 0, withoutPrice: filWithoutPrice.count || 0 },
        listings: {
          total: listingsTotal.count || 0,
          uniqueFilaments: uniqueListingFilaments,
          coveragePct: total > 0 ? Math.round((uniqueListingFilaments / total) * 100) : 0,
          effectiveCount,
          effectivePct: total > 0 ? Math.round((effectiveCount / total) * 100) : 0,
        },
        prp: { total: prpTotal.count || 0, uniqueProducts: uniquePrpProducts },
        bsi: {
          total: bsiTotal.count || 0,
          imported: bsiImported.count || 0,
          new: bsiNew.count || 0,
          matched: bsiMatched.count || 0,
          priceChanged: bsiPriceChanged.count || 0,
          skipped: bsiSkipped.count || 0,
          error: bsiError.count || 0,
        },
        priceHistory: { total: phTotal.count || 0, earliest: phMinMax.data?.[0]?.recorded_at ?? 'N/A' },
        schemaHealth: {
          filamentProperties: fpTotal.count || 0,
          pruTotal: pruTotal.count || 0,
          pruUniqueFilaments: new Set((pruProductIds.data || []).map((r: any) => r.product_id)).size,
          flatPricePopulated: flatPriceCount.count || 0,
          flatUrlPopulated: flatUrlCount.count || 0,
        },
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ── Section 2: Price Consistency ──

interface PriceCheckRow {
  id: string;
  product_title: string;
  filament_price: number;
  listing_price: number;
  diff: number;
  match: boolean;
}

function usePriceCheck() {
  const [results, setResults] = useState<PriceCheckRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { data: filaments } = await supabase
        .from('filaments')
        .select('id, product_title, variant_price')
        .not('variant_price', 'is', null)
        .limit(100);
      if (!filaments?.length) { setResults([]); return; }

      const ids = filaments.map((f) => f.id);
      const { data: listings } = await supabase
        .from('filament_listings')
        .select('filament_id, current_price, region')
        .in('filament_id', ids)
        .eq('region', 'US');

      const listingMap = new Map<string, number>();
      (listings || []).forEach((l: any) => {
        if (!listingMap.has(l.filament_id)) listingMap.set(l.filament_id, l.current_price);
      });

      const rows: PriceCheckRow[] = [];
      for (const f of filaments) {
        const lp = listingMap.get(f.id);
        if (lp === undefined) continue;
        const diff = Math.abs((f.variant_price ?? 0) - lp);
        rows.push({
          id: f.id,
          product_title: f.product_title ?? '—',
          filament_price: f.variant_price ?? 0,
          listing_price: lp,
          diff: Math.round(diff * 100) / 100,
          match: diff < 0.01,
        });
      }
      setResults(rows);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, run };
}

// ── Section 3: Orphan Detection ──

function useOrphans() {
  return useQuery({
    queryKey: ['data-integrity', 'orphans'],
    queryFn: async () => {
      const [listingIds, filamentIds, vendors, brandNames] = await Promise.all([
        supabase.from('filament_listings').select('filament_id'),
        supabase.from('filaments').select('id'),
        supabase.from('filaments').select('vendor'),
        supabase.from('automated_brands').select('brand_name'),
      ]);

      const filIdSet = new Set((filamentIds.data || []).map((r: any) => r.id));
      const orphanListings = (listingIds.data || []).filter((r: any) => !filIdSet.has(r.filament_id)).length;

      const brandNameSet = new Set((brandNames.data || []).map((r: any) => r.brand_name?.toLowerCase()));
      const uniqueVendors = [...new Set((vendors.data || []).map((r: any) => r.vendor))];
      const unmatchedVendors = uniqueVendors.filter((v) => v && !brandNameSet.has(v.toLowerCase()));

      return { orphanListings, unmatchedVendorCount: unmatchedVendors.length, unmatchedVendors };
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ── Section 4: Regional Coverage ──

const REGIONS = ['US', 'CA', 'EU', 'UK', 'AU', 'JP'] as const;
const PRICE_COL: Record<string, string> = {
  US: 'variant_price', CA: 'price_cad', EU: 'price_eur', UK: 'price_gbp', AU: 'price_aud', JP: 'price_jpy',
};
const URL_COL: Record<string, string> = {
  US: 'product_url', CA: 'product_url_ca', EU: 'product_url_eu', UK: 'product_url_uk', AU: 'product_url_au', JP: 'product_url_jp',
};

function useRegionalCoverage() {
  return useQuery({
    queryKey: ['data-integrity', 'regional-coverage'],
    queryFn: async () => {
      const results: Record<string, { flatPrice: number; listings: number; prp: number; urls: number }> = {};

      await Promise.all(
        REGIONS.map(async (r) => {
          const [flatPrice, listings, prp, urls] = await Promise.all([
            supabase.from('filaments').select('*', { count: 'exact', head: true }).not(PRICE_COL[r], 'is', null),
            supabase.from('filament_listings').select('*', { count: 'exact', head: true }).eq('region', r),
            supabase.from('product_regional_prices').select('*', { count: 'exact', head: true }).eq('region_code', r),
            supabase.from('filaments').select('*', { count: 'exact', head: true }).not(URL_COL[r], 'is', null),
          ]);
          results[r] = {
            flatPrice: flatPrice.count || 0,
            listings: listings.count || 0,
            prp: prp.count || 0,
            urls: urls.count || 0,
          };
        }),
      );
      return results;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ── Exchange Rates Card (inside Table Coverage grid) ──

const COMPARE_PAIRS = ['EUR', 'GBP', 'CAD', 'AUD', 'JPY'] as const;

function ExchangeRatesCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['data-integrity', 'exchange-rates-audit'],
    queryFn: async () => {
      const [erRes, cerRes] = await Promise.all([
        supabase.from('exchange_rates').select('currency_code, rate_to_usd, updated_at'),
        supabase.from('currency_exchange_rates').select('base_currency, target_currency, rate, fetched_at')
          .eq('base_currency', 'USD'),
      ]);

      const erRows = erRes.data || [];
      const cerRows = cerRes.data || [];

      const erMap = new Map(erRows.map((r: any) => [r.currency_code, r]));
      const cerMap = new Map(cerRows.map((r: any) => [r.target_currency, r]));

      const erLatest = erRows.length > 0
        ? Math.max(...erRows.map((r: any) => new Date(r.updated_at || 0).getTime()))
        : 0;
      const cerLatest = cerRows.length > 0
        ? Math.max(...cerRows.map((r: any) => new Date(r.fetched_at || 0).getTime()))
        : 0;

      const now = Date.now();
      const staleThreshold = 24 * 60 * 60 * 1000;
      const erStale = erLatest > 0 && (now - erLatest) > staleThreshold;
      const cerStale = cerLatest > 0 && (now - cerLatest) > staleThreshold;

      // Compare rates: exchange_rates stores rate_to_usd (i.e. 1 USD = X foreign)
      // currency_exchange_rates stores rate where base=USD, so rate = 1 USD → X target
      const conflicts: { currency: string; erRate: number; cerRate: number; diffPct: number }[] = [];
      for (const cur of COMPARE_PAIRS) {
        const er = erMap.get(cur);
        const cer = cerMap.get(cur);
        if (!er || !cer) continue;
        const erRate = er.rate_to_usd as number;
        const cerRate = cer.rate as number;
        if (erRate > 0 && cerRate > 0) {
          const diffPct = Math.abs((erRate - cerRate) / erRate) * 100;
          if (diffPct > 1) {
            conflicts.push({ currency: cur, erRate, cerRate, diffPct: Math.round(diffPct * 10) / 10 });
          }
        }
      }

      return {
        erCount: erRows.length,
        cerCount: cerRows.length,
        erLatest,
        cerLatest,
        erStale,
        cerStale,
        conflicts,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Exchange Rates</CardTitle>
        </CardHeader>
        <CardContent><p className="text-xs text-muted-foreground">Loading…</p></CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const formatAge = (ts: number) => {
    if (!ts) return 'N/A';
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Exchange Rates
            {(data.erStale || data.cerStale) && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Stale Rates</Badge>
            )}
            {data.conflicts.length > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500 text-yellow-500">
                {data.conflicts.length} mismatch{data.conflicts.length > 1 ? 'es' : ''}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">exchange_rates</span>
          <span className="font-mono font-semibold">{data.erCount} rows · {formatAge(data.erLatest)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">currency_exchange_rates</span>
          <span className="font-mono font-semibold">{data.cerCount} rows · {formatAge(data.cerLatest)}</span>
        </div>
        {data.conflicts.length > 0 && (
          <div className="pt-1 space-y-0.5">
            {data.conflicts.map((c) => (
              <div key={c.currency} className="flex justify-between text-xs text-destructive">
                <span>USD→{c.currency}</span>
                <span className="font-mono">{c.erRate.toFixed(4)} vs {c.cerRate.toFixed(4)} ({c.diffPct}%)</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section 6: Store/Retailer Overlap ──

function StoreRetailerOverlapSection() {
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['data-integrity', 'store-retailer-overlap'],
    queryFn: async () => {
      const [storesRes, retailersRes, brsRes] = await Promise.all([
        supabase.from('stores').select('name'),
        supabase.from('retailers').select('name'),
        supabase.from('brand_regional_stores').select('store_name'),
      ]);

      const storeNames = new Set((storesRes.data || []).map((r: any) => (r.name || '').toLowerCase().trim()).filter(Boolean));
      const retailerNames = new Set((retailersRes.data || []).map((r: any) => (r.name || '').toLowerCase().trim()).filter(Boolean));
      const brsNames = new Set((brsRes.data || []).map((r: any) => (r.store_name || '').toLowerCase().trim()).filter(Boolean));

      const storesOnly: string[] = [];
      const retailersOnly: string[] = [];
      const both: string[] = [];

      storeNames.forEach((n) => {
        if (retailerNames.has(n)) both.push(n);
        else storesOnly.push(n);
      });
      retailerNames.forEach((n) => {
        if (!storeNames.has(n)) retailersOnly.push(n);
      });

      return {
        storesOnly: storesOnly.sort(),
        retailersOnly: retailersOnly.sort(),
        both: both.sort(),
        brsCount: brsNames.size,
      };
    },
    staleTime: 1000 * 60 * 10,
  });

  return (
    <section className="space-y-3">
      <SectionHeader title="Store / Retailer Overlap Audit" dataUpdatedAt={dataUpdatedAt} />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-mono font-bold text-foreground">{data.storesOnly.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Stores only</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-mono font-bold text-foreground">{data.retailersOnly.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Retailers only</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-mono font-bold text-foreground">{data.both.length}</p>
                <p className="text-xs text-muted-foreground mt-1">In both</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-mono font-bold text-foreground">{data.brsCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Brand Regional Stores</p>
              </CardContent>
            </Card>
          </div>

          {(data.storesOnly.length > 0 || data.retailersOnly.length > 0) && (
            <Card>
              <button
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors text-left"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                {data.storesOnly.length + data.retailersOnly.length} mismatched names
              </button>
              {expanded && (
                <div className="px-0 pb-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Present In</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.storesOnly.map((n) => (
                        <TableRow key={`s-${n}`}>
                          <TableCell className="text-xs font-mono">{n}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">stores</Badge></TableCell>
                        </TableRow>
                      ))}
                      {data.retailersOnly.map((n) => (
                        <TableRow key={`r-${n}`}>
                          <TableCell className="text-xs font-mono">{n}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">retailers</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          )}
        </>
      ) : null}
    </section>
  );
}

// ── Section 7: Affiliate Config Audit ──

interface AffiliateConflict {
  brand: string;
  progRate: number | null;
  confRate: number | null;
  progNetwork: string;
  confNetwork: string;
  progTemplate: string;
  confTemplate: string;
  rateDiff: boolean;
  networkDiff: boolean;
}

function AffiliateConfigAuditSection() {
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['data-integrity', 'affiliate-config-audit'],
    queryFn: async () => {
      const [progsRes, confsRes] = await Promise.all([
        supabase.from('affiliate_programs').select('id, brand_name, affiliate_network, commission_rate, link_template, is_active'),
        supabase.from('affiliate_configs').select('id, vendor_name, affiliate_network, commission_rate, tracking_url_template, is_active'),
      ]);

      const progs = progsRes.data || [];
      const confs = confsRes.data || [];

      // Group by lowercase brand name
      const progMap = new Map<string, typeof progs>();
      progs.forEach((p: any) => {
        const key = (p.brand_name || '').toLowerCase().trim();
        if (!progMap.has(key)) progMap.set(key, []);
        progMap.get(key)!.push(p);
      });

      const confMap = new Map<string, typeof confs>();
      confs.forEach((c: any) => {
        const key = (c.vendor_name || '').toLowerCase().trim();
        if (!confMap.has(key)) confMap.set(key, []);
        confMap.get(key)!.push(c);
      });

      const allKeys = new Set([...progMap.keys(), ...confMap.keys()]);
      const programsOnly: string[] = [];
      const configsOnly: string[] = [];
      const conflicts: AffiliateConflict[] = [];

      allKeys.forEach((key) => {
        const hasProg = progMap.has(key);
        const hasConf = confMap.has(key);
        if (hasProg && !hasConf) programsOnly.push(key);
        else if (!hasProg && hasConf) configsOnly.push(key);
        else if (hasProg && hasConf) {
          const p = progMap.get(key)![0];
          const c = confMap.get(key)![0];
          conflicts.push({
            brand: p.brand_name || c.vendor_name || key,
            progRate: p.commission_rate,
            confRate: c.commission_rate,
            progNetwork: p.affiliate_network || '',
            confNetwork: c.affiliate_network || '',
            progTemplate: p.link_template || '',
            confTemplate: c.tracking_url_template || '',
            rateDiff: p.commission_rate !== c.commission_rate,
            networkDiff: (p.affiliate_network || '').toLowerCase() !== (c.affiliate_network || '').toLowerCase(),
          });
        }
      });

      return {
        programsOnly: programsOnly.sort(),
        configsOnly: configsOnly.sort(),
        conflicts: conflicts.sort((a, b) => a.brand.localeCompare(b.brand)),
      };
    },
    staleTime: 1000 * 60 * 10,
  });

  return (
    <section className="space-y-3">
      <SectionHeader title="Affiliate Config Audit" dataUpdatedAt={dataUpdatedAt} />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-mono font-bold text-foreground">{data.programsOnly.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Programs only</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-mono font-bold text-foreground">{data.configsOnly.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Configs only</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-mono font-bold text-foreground">{data.conflicts.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Both (potential conflicts)</p>
              </CardContent>
            </Card>
          </div>

          {data.conflicts.length > 0 && (
            <Card>
              <button
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors text-left"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                {data.conflicts.length} brands in both tables — compare
              </button>
              {expanded && (
                <div className="px-0 pb-0 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand</TableHead>
                        <TableHead>Program Rate</TableHead>
                        <TableHead>Config Rate</TableHead>
                        <TableHead>Network Match</TableHead>
                        <TableHead className="max-w-[180px]">Program Template</TableHead>
                        <TableHead className="max-w-[180px]">Config Template</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.conflicts.map((c) => {
                        const hasIssue = c.rateDiff || c.networkDiff;
                        return (
                          <TableRow key={c.brand} className={hasIssue ? 'bg-destructive/5' : ''}>
                            <TableCell className="text-xs font-medium">{c.brand}</TableCell>
                            <TableCell className={`text-xs font-mono ${c.rateDiff ? 'text-destructive font-semibold' : ''}`}>
                              {c.progRate != null ? `${c.progRate}%` : '—'}
                            </TableCell>
                            <TableCell className={`text-xs font-mono ${c.rateDiff ? 'text-destructive font-semibold' : ''}`}>
                              {c.confRate != null ? `${c.confRate}%` : '—'}
                            </TableCell>
                            <TableCell>
                              {c.networkDiff ? (
                                <Badge variant="destructive" className="text-[10px]">
                                  {c.progNetwork} ≠ {c.confNetwork}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">{c.progNetwork || '—'}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-[10px] font-mono max-w-[180px] truncate text-muted-foreground">
                              {c.progTemplate || '—'}
                            </TableCell>
                            <TableCell className="text-[10px] font-mono max-w-[180px] truncate text-muted-foreground">
                              {c.confTemplate || '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          )}
        </>
      ) : null}
    </section>
  );
}

// ── Main Page ──

export default function DataIntegrity() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: coverage, isLoading: coverageLoading, dataUpdatedAt: coverageUpdatedAt } = useTableCoverage();
  const priceCheck = usePriceCheck();
  const { data: orphans, isLoading: orphansLoading, dataUpdatedAt: orphansUpdatedAt } = useOrphans();
  const { data: regional, isLoading: regionalLoading, dataUpdatedAt: regionalUpdatedAt } = useRegionalCoverage();

  const [backfillLoading, setBackfillLoading] = useState(false);
  const [cleanOrphansLoading, setCleanOrphansLoading] = useState(false);

  const matches = priceCheck.results?.filter((r) => r.match).length ?? 0;
  const mismatches = priceCheck.results?.filter((r) => !r.match).length ?? 0;
  const total = matches + mismatches;

  const handleBackfill = async () => {
    setBackfillLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
      const { data, error } = await supabase.functions.invoke('backfill-filament-listings', {
        body: {},
      });
      clearTimeout(timeout);
      if (error) throw error;
      const created = data?.listings_created ?? data?.created ?? 0;
      const updated = data?.listings_updated ?? data?.updated ?? 0;
      const errors = data?.errors ?? data?.error_count ?? 0;
      toast({
        title: 'Backfill complete',
        description: `Backfill complete: ${created} listings created, ${updated} updated, ${errors} errors`,
      });
      queryClient.invalidateQueries({ queryKey: ['data-integrity'] });
    } catch (err: any) {
      clearTimeout(timeout);
      const msg = err?.name === 'AbortError'
        ? 'Request timed out after 120s'
        : (err?.message || 'Unknown error');
      toast({
        title: 'Backfill failed',
        description: `Backfill failed: ${msg}. The function processes in batches — you can safely retry.`,
        variant: 'destructive',
      });
    } finally {
      setBackfillLoading(false);
    }
  };

  const handleCleanOrphans = async () => {
    setCleanOrphansLoading(true);
    try {
      // Get orphan listing IDs first
      const [listingIds, filamentIds] = await Promise.all([
        supabase.from('filament_listings').select('id, filament_id'),
        supabase.from('filaments').select('id'),
      ]);
      const filIdSet = new Set((filamentIds.data || []).map((r: any) => r.id));
      const orphanIds = (listingIds.data || [])
        .filter((r: any) => !filIdSet.has(r.filament_id))
        .map((r: any) => r.id);

      if (orphanIds.length === 0) {
        toast({ title: 'No orphans found', description: 'All listings have valid filament references.' });
        return;
      }

      // Delete in batches of 100
      let deleted = 0;
      for (let i = 0; i < orphanIds.length; i += 100) {
        const batch = orphanIds.slice(i, i + 100);
        const { error } = await supabase.from('filament_listings').delete().in('id', batch);
        if (error) throw error;
        deleted += batch.length;
      }

      toast({
        title: 'Orphans cleaned',
        description: `Deleted ${deleted} orphan listing${deleted !== 1 ? 's' : ''}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['data-integrity'] });
    } catch (err: any) {
      toast({
        title: 'Cleanup failed',
        description: `Cleanup failed: ${err?.message || 'Unknown error'}. You can safely retry.`,
        variant: 'destructive',
      });
    } finally {
      setCleanOrphansLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <AdminPageHeader
        title="Data Integrity"
        description="Pipeline health checks and cross-table consistency"
        icon={ShieldCheck}
        iconColor="text-green-500"
      />

      {/* ── Section 1: Table Coverage ── */}
      <section className="space-y-3">
        <SectionHeader title="Table Coverage" dataUpdatedAt={coverageUpdatedAt} />
        {coverageLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : coverage ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="filaments"
              coveragePct={coverage.filaments.total > 0 ? Math.round((coverage.filaments.withPrice / coverage.filaments.total) * 100) : 0}
              stats={[
                { label: 'Total', value: coverage.filaments.total },
                { label: 'With prices', value: coverage.filaments.withPrice },
                { label: 'No price', value: coverage.filaments.withoutPrice },
              ]}
            />
            <StatCard
              title="filament_listings"
              coveragePct={coverage.listings.effectivePct}
              stats={[
                { label: 'Total rows', value: coverage.listings.total },
                { label: 'Direct coverage', value: `${coverage.listings.coveragePct}% (${coverage.listings.uniqueFilaments.toLocaleString()} listings)` },
                { label: 'Effective coverage', value: `~${coverage.listings.effectivePct}% (${coverage.listings.effectiveCount.toLocaleString()} via fallback)` },
              ]}
              action={
                isAdmin ? (
                  <div className="flex flex-col items-end gap-1">
                    <Button size="sm" variant="outline" onClick={handleBackfill} disabled={backfillLoading}>
                      {backfillLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Database className="w-3.5 h-3.5 mr-1" />}
                      {backfillLoading ? 'Running backfill...' : 'Run Backfill'}
                    </Button>
                    <span className="text-[11px] text-muted-foreground">Creates listings from filaments table prices. Safe to run multiple times.</span>
                  </div>
                ) : undefined
              }
            />
            <StatCard
              title="product_regional_prices"
              stats={[
                { label: 'Total rows', value: coverage.prp.total },
                { label: 'Unique products', value: coverage.prp.uniqueProducts },
              ]}
            />
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CoverageIndicator pct={coverage.bsi.total > 0 ? Math.round((coverage.bsi.imported / coverage.bsi.total) * 100) : 100} />
                    brand_sync_items
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total synced</span>
                  <span className="font-mono font-semibold">{coverage.bsi.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-muted-foreground inline-flex items-center gap-1 cursor-help">
                          Imported to filaments <Info className="w-3 h-3" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        <p className="text-xs">Items are imported when approved in Brand Catalog Sync and the Import function is run.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="font-mono font-semibold">{coverage.bsi.imported.toLocaleString()}</span>
                </div>
                <div
                  className="flex justify-between text-sm cursor-pointer rounded px-1 -mx-1 hover:bg-accent transition-colors"
                  onClick={() => navigate('/admin/filament-onboarding')}
                  role="link"
                >
                  <span className="text-muted-foreground hover:text-foreground">New (pending review)</span>
                  <span className="font-mono font-semibold">{coverage.bsi.new.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price changed</span>
                  <span className="font-mono font-semibold">{coverage.bsi.priceChanged.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Matched</span>
                  <span className="font-mono font-semibold">{coverage.bsi.matched.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Skipped</span>
                  <span className="font-mono font-semibold">{coverage.bsi.skipped.toLocaleString()}</span>
                </div>
                {coverage.bsi.error > 0 ? (
                  <div
                    className="flex justify-between text-sm cursor-pointer rounded px-1 -mx-1 hover:bg-destructive/10 transition-colors"
                    onClick={() => navigate('/admin/filament-onboarding')}
                    role="link"
                  >
                    <span className="text-destructive inline-flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Errors
                    </span>
                    <span className="font-mono font-semibold text-destructive">{coverage.bsi.error.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Errors</span>
                    <span className="font-mono font-semibold">{coverage.bsi.error.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <StatCard
              title="price_history"
              stats={[
                { label: 'Total records', value: coverage.priceHistory.total },
                { label: 'Earliest', value: coverage.priceHistory.earliest !== 'N/A' ? new Date(coverage.priceHistory.earliest).toLocaleDateString() : 'N/A' },
              ]}
            />
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    Schema Health
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px]">
                        <p className="text-xs">The filaments table has 148 columns. Regional prices and URLs are being migrated from flat columns to product_regional_prices and product_regional_urls tables. Coverage shown here tracks that migration progress.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">filaments table</span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold">148 columns</span>
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">wide</Badge>
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">filament_properties</span>
                  <span className="font-mono font-semibold">{coverage.schemaHealth.filamentProperties.toLocaleString()} rows</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">product_regional_prices</span>
                  <span className="font-mono font-semibold">{coverage.prp.total.toLocaleString()} rows · {coverage.prp.uniqueProducts.toLocaleString()} filaments</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">product_regional_urls</span>
                  <span className="font-mono font-semibold">{coverage.schemaHealth.pruTotal.toLocaleString()} rows · {coverage.schemaHealth.pruUniqueFilaments.toLocaleString()} filaments</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Flat price columns populated</span>
                  <span className="font-mono font-semibold">{coverage.schemaHealth.flatPricePopulated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Flat URL columns populated</span>
                  <span className="font-mono font-semibold">{coverage.schemaHealth.flatUrlPopulated.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
            <ExchangeRatesCard />
          </div>
        ) : null}
      </section>

      {/* ── Section 2: Price Consistency ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Price Consistency Check</h2>
          <Button size="sm" onClick={priceCheck.run} disabled={priceCheck.loading}>
            <Play className="w-3.5 h-3.5 mr-1" />
            {priceCheck.loading ? 'Running…' : 'Run Price Check'}
          </Button>
        </div>

        {priceCheck.results && (
          <>
            <div className="flex gap-4 text-sm">
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                <CheckCircle className="w-3 h-3 mr-1" /> {matches} matches
              </Badge>
              <Badge variant="secondary" className="bg-red-500/10 text-red-500">
                <XCircle className="w-3 h-3 mr-1" /> {mismatches} mismatches
              </Badge>
              <span className="text-muted-foreground">
                {total > 0 ? `${Math.round((matches / total) * 100)}% consistent` : '—'}
              </span>
            </div>

            <Card>
              <div className="overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">filaments.price</TableHead>
                      <TableHead className="text-right">listing.price</TableHead>
                      <TableHead className="text-right">Diff</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceCheck.results.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="max-w-[300px] truncate text-sm">{r.product_title}</TableCell>
                        <TableCell className="text-right font-mono text-sm">${r.filament_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">${r.listing_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">${r.diff.toFixed(2)}</TableCell>
                        <TableCell>
                          {r.match ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {priceCheck.results.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No filaments found with both flat prices and listings
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}
      </section>

      {/* ── Section 2b: Price Source Audit ── */}
      <PriceSourceAudit />

      {/* ── Section 3: Orphan Detection ── */}
      <section className="space-y-3">
        <SectionHeader title="Orphan Detection" dataUpdatedAt={orphansUpdatedAt} />
        {orphansLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : orphans ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Orphan Listings"
              coveragePct={orphans.orphanListings === 0 ? 100 : 0}
              stats={[
                { label: 'Listings missing filament', value: orphans.orphanListings },
              ]}
              action={
                isAdmin && orphans.orphanListings > 0 ? (
                  <Button size="sm" variant="outline" onClick={handleCleanOrphans} disabled={cleanOrphansLoading} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                    {cleanOrphansLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
                    {cleanOrphansLoading ? 'Cleaning…' : 'Clean Orphans'}
                  </Button>
                ) : undefined
              }
            />
            <StatCard
              title="Unmatched Vendors"
              coveragePct={orphans.unmatchedVendorCount === 0 ? 100 : orphans.unmatchedVendorCount < 5 ? 70 : 20}
              stats={[
                { label: 'Vendors without brand', value: orphans.unmatchedVendorCount },
              ]}
            />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unmatched Vendor Names</CardTitle>
              </CardHeader>
              <CardContent>
                {orphans.unmatchedVendors.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {orphans.unmatchedVendors.slice(0, 20).map((v) => (
                      <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
                    ))}
                    {orphans.unmatchedVendors.length > 20 && (
                      <Badge variant="secondary" className="text-xs">+{orphans.unmatchedVendors.length - 20} more</Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">All vendors matched ✓</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </section>

      {/* ── Section 4: Regional Coverage ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            Regional Coverage
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[280px]">
                  <p className="text-xs">Shows how many filaments have pricing data (flat columns on filaments table) vs actual buy links per region. Gaps mean users see a price but cannot click through to purchase.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h2>
          {regionalUpdatedAt != null && regionalUpdatedAt > 0 && (
            <span className="text-xs text-muted-foreground">{formatRelativeTime(regionalUpdatedAt)}</span>
          )}
        </div>
        {regionalLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : regional ? (
          (() => {
            const cellColor = (value: number, flatPrice: number) => {
              if (value > 0) return 'text-green-500';
              if (flatPrice > 0) return 'text-destructive';
              return 'text-muted-foreground';
            };
            const totalWithPrice = new Set(
              REGIONS.filter((r) => regional[r].flatPrice > 0)
            ).size;
            const totalWithUrl = new Set(
              REGIONS.filter((r) => regional[r].urls > 0)
            ).size;
            const allPrices = REGIONS.reduce((sum, r) => sum + regional[r].flatPrice, 0);
            const allUrls = REGIONS.reduce((sum, r) => sum + regional[r].urls, 0);
            const globalCoverage = allPrices > 0 ? Math.round((allUrls / allPrices) * 100) : 0;

            return (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead className="text-right">Flat Prices</TableHead>
                      <TableHead className="text-right">Listings</TableHead>
                      <TableHead className="text-right">Regional Prices</TableHead>
                      <TableHead className="text-right">With URL</TableHead>
                      <TableHead className="text-right">URL Gap</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {REGIONS.map((r) => {
                      const d = regional[r];
                      const gapPct = d.flatPrice > 0 ? Math.round(((d.flatPrice - d.urls) / d.flatPrice) * 100) : 0;
                      return (
                        <TableRow key={r}>
                          <TableCell className="font-medium">{r}</TableCell>
                          <TableCell className="text-right font-mono">{d.flatPrice.toLocaleString()}</TableCell>
                          <TableCell className={`text-right font-mono ${cellColor(d.listings, d.flatPrice)}`}>{d.listings.toLocaleString()}</TableCell>
                          <TableCell className={`text-right font-mono ${cellColor(d.prp, d.flatPrice)}`}>{d.prp.toLocaleString()}</TableCell>
                          <TableCell className={`text-right font-mono ${cellColor(d.urls, d.flatPrice)}`}>{d.urls.toLocaleString()}</TableCell>
                          <TableCell className={`text-right font-mono font-semibold ${gapPct > 50 ? 'text-destructive' : gapPct > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                            {d.flatPrice > 0 ? `${gapPct}%` : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  <span>Regions with prices: <strong className="text-foreground">{totalWithPrice}/{REGIONS.length}</strong></span>
                  <span>Regions with URLs: <strong className="text-foreground">{totalWithUrl}/{REGIONS.length}</strong></span>
                  <span>Total filaments with price: <strong className="text-foreground">{allPrices.toLocaleString()}</strong></span>
                  <span>Total with buy URL: <strong className="text-foreground">{allUrls.toLocaleString()}</strong></span>
                  <span>Global URL coverage: <strong className={globalCoverage >= 80 ? 'text-green-500' : globalCoverage >= 50 ? 'text-yellow-500' : 'text-destructive'}>{globalCoverage}%</strong></span>
                </div>
              </Card>
            );
          })()
        ) : null}
      </section>

      {/* ── Section: 3-Way Price Source Conflicts ── */}
      <section className="space-y-3">
        <SectionHeader title="Price Source Conflicts (3-Way)" />
        <PriceSourceConflicts />
      </section>

      {/* ── Section 6: Store/Retailer Overlap Audit ── */}
      <StoreRetailerOverlapSection />

      {/* ── Section 7: Affiliate Config Audit ── */}
      <AffiliateConfigAuditSection />

      {/* ── Section 8: Table Usage Audit ── */}
      <section className="space-y-3">
        <SectionHeader title="Table Usage Audit" />
        <TableUsageAudit />
      </section>
    </div>
  );
}
