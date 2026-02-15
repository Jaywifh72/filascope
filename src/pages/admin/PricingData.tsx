import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageLoadingSkeleton } from '@/components/skeletons/PageLoadingSkeleton';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSign, Search, ArrowUpRight, ArrowDownRight, Minus, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type LinkStatus = 'active' | 'stale' | 'broken' | 'alert' | 'unknown';

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
  // computed
  priceChange: { percent: number; direction: 'up' | 'down' | 'unchanged' } | null;
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

function PriceChangeIndicator({ change }: { change: PricingRow['priceChange'] }) {
  if (!change) return <span className="text-muted-foreground">—</span>;
  if (change.direction === 'unchanged') return <span className="text-muted-foreground flex items-center gap-1"><Minus className="w-3 h-3" /> —</span>;
  if (change.direction === 'up') {
    return (
      <span className="text-red-400 flex items-center gap-0.5 font-mono text-xs">
        <ArrowUpRight className="w-3 h-3" />↑{Math.abs(change.percent).toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="text-emerald-400 flex items-center gap-0.5 font-mono text-xs">
      <ArrowDownRight className="w-3 h-3" />↓{Math.abs(change.percent).toFixed(1)}%
    </span>
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

  // Fetch filaments with pricing data
  const { data: filaments, isLoading: filamentsLoading } = useQuery({
    queryKey: ['admin-pricing-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, material, variant_price, variant_compare_at_price, price_cad, price_eur, price_gbp, price_aud, price_jpy, product_url, product_url_ca, product_url_uk, product_url_eu, product_url_au, product_url_jp, last_scraped_at, price_confidence')
        .not('variant_price', 'is', null)
        .order('vendor', { ascending: true })
        .order('product_title', { ascending: true })
        .limit(1000);
      if (error) throw error;
      return data || [];
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
      // Get last 2 price records per filament to compute % change
      const { data, error } = await supabase
        .from('price_history')
        .select('filament_id, price, recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      
      // Group by filament_id, get last two prices
      const grouped = new Map<string, number[]>();
      (data || []).forEach(r => {
        const existing = grouped.get(r.filament_id) || [];
        if (existing.length < 2) {
          existing.push(r.price);
          grouped.set(r.filament_id, existing);
        }
      });
      
      const changes = new Map<string, { percent: number; direction: 'up' | 'down' | 'unchanged' }>();
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
          changes.set(id, { percent: pct, direction: pct > 0 ? 'up' : 'down' });
        }
      });
      return changes;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Compute link status for a URL
  function computeLinkStatus(url: string | null, priceChangePercent: number | null): LinkStatus {
    // Check for price alert first
    if (priceChangePercent != null && Math.abs(priceChangePercent) > 10) return 'alert';
    
    if (!url || !urlCache) return 'unknown';
    const cached = urlCache.get(url);
    if (!cached) return 'stale'; // never tested
    
    if (cached.status === 'invalid' || (cached.status_code && cached.status_code >= 400)) return 'broken';
    
    if (cached.last_checked) {
      const checkedAt = new Date(cached.last_checked);
      const now = new Date();
      const hoursSince = (now.getTime() - checkedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) return 'active';
      if (hoursSince > 168) return 'stale'; // 7 days
      return 'active';
    }
    
    return 'stale';
  }

  const rows: PricingRow[] = useMemo(() => {
    if (!filaments) return [];
    return filaments.map(f => {
      const change = priceChanges?.get(f.id) || null;
      const changePct = change?.percent ?? null;
      return {
        ...f,
        priceChange: change,
        linkStatus: computeLinkStatus(f.product_url, changePct),
      };
    });
  }, [filaments, urlCache, priceChanges]);

  // Unique vendors
  const vendors = useMemo(() => {
    const set = new Set(rows.map(r => r.vendor).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  // Filter
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

  // Stats
  const stats = useMemo(() => {
    const active = rows.filter(r => r.linkStatus === 'active').length;
    const stale = rows.filter(r => r.linkStatus === 'stale' || r.linkStatus === 'unknown').length;
    const broken = rows.filter(r => r.linkStatus === 'broken').length;
    const alerts = rows.filter(r => r.linkStatus === 'alert').length;
    const withMultiRegion = rows.filter(r => [r.price_cad, r.price_eur, r.price_gbp, r.price_aud, r.price_jpy].filter(p => p != null).length > 0).length;
    return { total: rows.length, active, stale, broken, alerts, withMultiRegion };
  }, [rows]);

  if (filamentsLoading) {
    return <AdminLayout><PageLoadingSkeleton /></AdminLayout>;
  }

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
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-[11px] text-muted-foreground">Total Products</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
              <p className="text-[11px] text-emerald-400/70">Active Links</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.stale}</p>
              <p className="text-[11px] text-yellow-400/70">Stale Links</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-400">{stats.broken}</p>
              <p className="text-[11px] text-red-400/70">Broken Links</p>
            </CardContent>
          </Card>
          <Card className="border-purple-500/30 bg-purple-500/5">
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

        {/* Data table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">USD</TableHead>
                    <TableHead className="text-right">CAD</TableHead>
                    <TableHead className="text-right">EUR</TableHead>
                    <TableHead className="text-right">GBP</TableHead>
                    <TableHead className="text-right">AUD</TableHead>
                    <TableHead className="text-right">JPY</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 200).map(row => (
                    <TableRow key={row.id}>
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
                      <TableCell className="text-right font-mono text-xs">
                        {formatCurrency(row.variant_price, '$')}
                        {row.variant_compare_at_price != null && row.variant_compare_at_price > (row.variant_price ?? 0) && (
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
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
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
