import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Play, AlertTriangle, CheckCircle, XCircle, Database, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

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
      ] = await Promise.all([
        supabase.from('filaments').select('*', { count: 'exact', head: true }),
        supabase.from('filaments').select('*', { count: 'exact', head: true }).not('variant_price', 'is', null),
        supabase.from('filaments').select('*', { count: 'exact', head: true }).is('variant_price', null),
        supabase.from('filament_listings').select('*', { count: 'exact', head: true }),
        supabase.from('filament_listings').select('filament_id'),
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
      ]);

      const uniqueListingFilaments = new Set((listingFilamentIds.data || []).map((r: any) => r.filament_id)).size;
      const uniquePrpProducts = new Set((prpProductIds.data || []).map((r: any) => r.product_id)).size;
      const total = filTotal.count || 0;

      return {
        filaments: { total, withPrice: filWithPrice.count || 0, withoutPrice: filWithoutPrice.count || 0 },
        listings: { total: listingsTotal.count || 0, uniqueFilaments: uniqueListingFilaments, coveragePct: total > 0 ? Math.round((uniqueListingFilaments / total) * 100) : 0 },
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

// ── Main Page ──

export default function DataIntegrity() {
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
    try {
      const { data, error } = await supabase.functions.invoke('backfill-filament-listings');
      if (error) throw error;
      const created = data?.listings_created ?? data?.created ?? 0;
      const updated = data?.listings_updated ?? data?.updated ?? 0;
      toast({
        title: 'Backfill complete',
        description: `Created ${created} listings, updated ${updated} listings.`,
      });
      queryClient.invalidateQueries({ queryKey: ['data-integrity', 'table-coverage'] });
      queryClient.invalidateQueries({ queryKey: ['data-integrity', 'regional-coverage'] });
    } catch (err: any) {
      toast({
        title: 'Backfill failed',
        description: err?.message || 'Unknown error',
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
      queryClient.invalidateQueries({ queryKey: ['data-integrity', 'orphans'] });
      queryClient.invalidateQueries({ queryKey: ['data-integrity', 'table-coverage'] });
    } catch (err: any) {
      toast({
        title: 'Cleanup failed',
        description: err?.message || 'Unknown error',
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
              coveragePct={coverage.listings.coveragePct}
              stats={[
                { label: 'Total rows', value: coverage.listings.total },
                { label: 'Unique filaments', value: coverage.listings.uniqueFilaments },
                { label: 'Coverage', value: `${coverage.listings.coveragePct}%` },
              ]}
              action={
                isAdmin ? (
                  <Button size="sm" variant="outline" onClick={handleBackfill} disabled={backfillLoading}>
                    {backfillLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Database className="w-3.5 h-3.5 mr-1" />}
                    {backfillLoading ? 'Running…' : 'Run Backfill'}
                  </Button>
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
            <StatCard
              title="brand_sync_items"
              coveragePct={coverage.bsi.total > 0 ? Math.round((coverage.bsi.imported / coverage.bsi.total) * 100) : 100}
              stats={[
                { label: 'Total', value: coverage.bsi.total },
                { label: 'Imported', value: coverage.bsi.imported },
              ]}
            />
            <StatCard
              title="price_history"
              stats={[
                { label: 'Total records', value: coverage.priceHistory.total },
                { label: 'Earliest', value: coverage.priceHistory.earliest !== 'N/A' ? new Date(coverage.priceHistory.earliest).toLocaleDateString() : 'N/A' },
              ]}
            />
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
        <SectionHeader title="Regional Coverage" dataUpdatedAt={regionalUpdatedAt} />
        {regionalLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : regional ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Flat Prices</TableHead>
                  <TableHead className="text-right">Listings</TableHead>
                  <TableHead className="text-right">Regional Prices</TableHead>
                  <TableHead className="text-right">With URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {REGIONS.map((r) => {
                  const d = regional[r];
                  return (
                    <TableRow key={r}>
                      <TableCell className="font-medium">{r}</TableCell>
                      <TableCell className="text-right font-mono">{d.flatPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">{d.listings.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">{d.prp.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">{d.urls.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
