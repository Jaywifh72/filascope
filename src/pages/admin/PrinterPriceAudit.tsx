import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  DollarSign, Search, RefreshCw, Loader2, AlertTriangle,
  CheckCircle2, XCircle, Clock, Ban, Pencil, History, Zap,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────
interface PrinterRow {
  id: string;
  model_name: string;
  slug: string | null;
  brand_name: string;
  brand_slug: string;
  current_price_usd_store: number | null;
  current_price_cad_store: number | null;
  current_price_gbp_store: number | null;
  current_price_eur_store: number | null;
  msrp_usd: number | null;
  sync_status: string | null;
  sync_method: string | null;
  last_synced_at: string | null;
  variant_selected: string | null;
  product_url: string | null;
  product_url_ca: string | null;
  product_url_uk: string | null;
  product_url_eu: string | null;
}

interface BrandSyncConfig {
  brand_id: string;
  primary_extraction: string;
  store_platform: string;
}

type StatusFilter = 'all' | 'needs_review' | 'failed' | 'never_synced' | 'stale' | 'synced';

// ─── Helpers ─────────────────────────────────────────────────────
function priceFreshness(lastSynced: string | null, price: number | null): 'green' | 'yellow' | 'red' {
  if (!price || price <= 0) return 'red';
  if (!lastSynced) return 'red';
  const days = (Date.now() - new Date(lastSynced).getTime()) / 86_400_000;
  if (days <= 7) return 'green';
  return 'yellow';
}

const freshnessClasses: Record<string, string> = {
  green: 'text-emerald-400',
  yellow: 'text-amber-400',
  red: 'text-destructive',
};

function statusBadge(status: string | null) {
  const map: Record<string, { label: string; cls: string }> = {
    synced: { label: 'Synced', cls: 'bg-emerald-500/20 text-emerald-400' },
    manual_review: { label: 'Review', cls: 'bg-amber-500/20 text-amber-400' },
    extraction_failed: { label: 'Failed', cls: 'bg-destructive/20 text-destructive' },
    never_synced: { label: 'Never', cls: 'bg-muted text-muted-foreground' },
    manual_only: { label: 'Manual', cls: 'bg-blue-500/20 text-blue-400' },
  };
  const s = map[status ?? 'never_synced'] ?? map.never_synced;
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}

function priceCell(price: number | null, lastSynced: string | null) {
  const f = priceFreshness(lastSynced, price);
  if (!price) return <span className="text-muted-foreground">—</span>;
  return <span className={freshnessClasses[f]}>${price.toFixed(2)}</span>;
}

// ─── Component ───────────────────────────────────────────────────
export default function PrinterPriceAudit() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [historyPrinter, setHistoryPrinter] = useState<PrinterRow | null>(null);
  const [editPrinter, setEditPrinter] = useState<PrinterRow | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [syncingBrand, setSyncingBrand] = useState<string | null>(null);

  // ─── Queries ─────────────────────────────────────────────────
  const { data: printers = [], isLoading } = useQuery({
    queryKey: ['admin-printer-price-audit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printers')
        .select(`
          id, model_name, slug,
          current_price_usd_store, current_price_cad_store,
          current_price_gbp_store, current_price_eur_store,
          msrp_usd, sync_status, sync_method, last_synced_at,
          variant_selected, product_url, product_url_ca, product_url_uk, product_url_eu,
          printer_brands!inner(brand)
        `)
        .order('model_name');
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        ...p,
        brand_name: p.printer_brands?.brand ?? 'Unknown',
        brand_slug: (p.printer_brands?.brand ?? '').toLowerCase().replace(/\s+/g, '-').replace(/\./g, ''),
      })) as PrinterRow[];
    },
    enabled: isAdmin,
  });

  const { data: brandConfigs = [] } = useQuery({
    queryKey: ['brand-sync-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_sync_config')
        .select('brand_id, primary_extraction, store_platform');
      if (error) throw error;
      return data as BrandSyncConfig[];
    },
    enabled: isAdmin,
  });

  const configMap = useMemo(() => {
    const m: Record<string, BrandSyncConfig> = {};
    brandConfigs.forEach(c => { m[c.brand_id] = c; });
    return m;
  }, [brandConfigs]);

  const { data: priceHistory = [] } = useQuery({
    queryKey: ['printer-price-history', historyPrinter?.id],
    queryFn: async () => {
      if (!historyPrinter) return [];
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('printer_id', historyPrinter.id)
        .order('recorded_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!historyPrinter,
  });

  // ─── Mutations ───────────────────────────────────────────────
  const syncMutation = useMutation({
    mutationFn: async (params: { brand_id?: string }) => {
      const { data, error } = await supabase.functions.invoke('sync-printer-prices', {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sync complete: ${data?.summary?.pricesUpdated ?? 0} updated, ${data?.summary?.errors ?? 0} errors`);
      queryClient.invalidateQueries({ queryKey: ['admin-printer-price-audit'] });
      setSyncingBrand(null);
    },
    onError: (err) => {
      toast.error('Sync failed: ' + (err as Error).message);
      setSyncingBrand(null);
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ printerId, fields }: { printerId: string; fields: Record<string, any> }) => {
      const { error } = await supabase
        .from('printers')
        .update({
          ...fields,
          sync_status: 'synced',
          sync_method: 'manual',
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', printerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Price updated');
      queryClient.invalidateQueries({ queryKey: ['admin-printer-price-audit'] });
      setEditPrinter(null);
    },
    onError: (err) => toast.error('Update failed: ' + (err as Error).message),
  });

  // ─── Filtering ───────────────────────────────────────────────
  const brands = useMemo(() => {
    const set = new Set(printers.map(p => p.brand_name));
    return Array.from(set).sort();
  }, [printers]);

  const isManualOnly = (p: PrinterRow) => configMap[p.brand_slug]?.primary_extraction === 'manual_only';

  const filtered = useMemo(() => {
    return printers.filter(p => {
      if (brandFilter !== 'all' && p.brand_name !== brandFilter) return false;
      if (search && !p.model_name.toLowerCase().includes(search.toLowerCase())) return false;
      const status = p.sync_status ?? 'never_synced';
      if (statusFilter === 'needs_review' && status !== 'manual_review') return false;
      if (statusFilter === 'failed' && status !== 'extraction_failed') return false;
      if (statusFilter === 'never_synced' && status !== 'never_synced') return false;
      if (statusFilter === 'synced' && status !== 'synced') return false;
      if (statusFilter === 'stale') {
        if (!p.last_synced_at) return true;
        return (Date.now() - new Date(p.last_synced_at).getTime()) > 7 * 86_400_000;
      }
      return true;
    });
  }, [printers, brandFilter, search, statusFilter, configMap]);

  // ─── Summary ─────────────────────────────────────────────────
  const summary = useMemo(() => {
    const s = { total: printers.length, synced: 0, review: 0, failed: 0, never: 0, manual: 0 };
    printers.forEach(p => {
      if (isManualOnly(p)) { s.manual++; return; }
      const st = p.sync_status ?? 'never_synced';
      if (st === 'synced') s.synced++;
      else if (st === 'manual_review') s.review++;
      else if (st === 'extraction_failed') s.failed++;
      else s.never++;
    });
    return s;
  }, [printers, configMap]);

  // ─── Auth guard ──────────────────────────────────────────────
  if (authLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!user || !isAdmin) return <div className="p-8 text-center text-destructive">Admin access required.</div>;

  function openEdit(p: PrinterRow) {
    setEditPrinter(p);
    setEditForm({
      current_price_usd_store: p.current_price_usd_store?.toString() ?? '',
      current_price_cad_store: p.current_price_cad_store?.toString() ?? '',
      current_price_gbp_store: p.current_price_gbp_store?.toString() ?? '',
      current_price_eur_store: p.current_price_eur_store?.toString() ?? '',
      msrp_usd: p.msrp_usd?.toString() ?? '',
      product_url: p.product_url ?? '',
      product_url_ca: p.product_url_ca ?? '',
      product_url_uk: p.product_url_uk ?? '',
      product_url_eu: p.product_url_eu ?? '',
    });
  }

  function handleEditSave() {
    if (!editPrinter) return;
    const fields: Record<string, any> = {};
    const numFields = ['current_price_usd_store', 'current_price_cad_store', 'current_price_gbp_store', 'current_price_eur_store', 'msrp_usd'];
    const strFields = ['product_url', 'product_url_ca', 'product_url_uk', 'product_url_eu'];
    numFields.forEach(k => {
      const v = editForm[k];
      fields[k] = v ? parseFloat(v) : null;
    });
    strFields.forEach(k => {
      fields[k] = editForm[k] || null;
    });
    editMutation.mutate({ printerId: editPrinter.id, fields });
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-[1600px]">
      <AdminPageHeader
        title="Printer Price Audit"
        description="Monitor and fix printer price data before users see it"
        icon={DollarSign}
        actions={
          <div className="flex gap-2">
            <Select
              onValueChange={(v) => {
                setSyncingBrand(v);
                syncMutation.mutate({ brand_id: v });
              }}
            >
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="Sync Brand…" />
              </SelectTrigger>
              <SelectContent>
                {brands.map(b => {
                  const slug = b.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
                  const isManual = configMap[slug]?.primary_extraction === 'manual_only';
                  return (
                    <SelectItem key={b} value={slug} disabled={isManual}>
                      {b} {isManual ? '(manual)' : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setSyncingBrand('all');
                syncMutation.mutate({});
              }}
              disabled={syncMutation.isPending}
              size="sm"
            >
              {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Zap className="w-4 h-4 mr-1" />}
              Sync All
            </Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: summary.total, icon: DollarSign, cls: 'text-foreground' },
          { label: 'Synced OK', value: summary.synced, icon: CheckCircle2, cls: 'text-emerald-400' },
          { label: 'Needs Review', value: summary.review, icon: AlertTriangle, cls: 'text-amber-400' },
          { label: 'Failed', value: summary.failed, icon: XCircle, cls: 'text-destructive' },
          { label: 'Never Synced', value: summary.never, icon: Clock, cls: 'text-muted-foreground' },
          { label: 'Manual Only', value: summary.manual, icon: Ban, cls: 'text-blue-400' },
        ].map(c => (
          <Card key={c.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <c.icon className={`w-5 h-5 ${c.cls}`} />
              <div>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search printers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={brandFilter} onValueChange={v => setBrandFilter(v)}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="synced">Synced OK</SelectItem>
            <SelectItem value="needs_review">Needs Review</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="never_synced">Never Synced</SelectItem>
            <SelectItem value="stale">Stale (&gt;7 days)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading printers…</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Printer</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">US $</TableHead>
                <TableHead className="text-right">CA $</TableHead>
                <TableHead className="text-right">UK £</TableHead>
                <TableHead className="text-right">EU €</TableHead>
                <TableHead className="text-right">MSRP</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Last Synced</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                    No printers match filters
                  </TableCell>
                </TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    <a href={`/printers/${p.slug ?? p.id}`} className="hover:text-primary transition-colors">
                      {p.model_name}
                    </a>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.brand_name}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{priceCell(p.current_price_usd_store, p.last_synced_at)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{priceCell(p.current_price_cad_store, p.last_synced_at)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{priceCell(p.current_price_gbp_store, p.last_synced_at)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{priceCell(p.current_price_eur_store, p.last_synced_at)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {p.msrp_usd ? `$${p.msrp_usd.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.sync_method ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {p.last_synced_at ? formatDistanceToNow(new Date(p.last_synced_at), { addSuffix: true }) : '—'}
                  </TableCell>
                  <TableCell>{statusBadge(isManualOnly(p) ? 'manual_only' : p.sync_status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{p.variant_selected ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        title="Sync Now"
                        disabled={syncMutation.isPending || isManualOnly(p)}
                        onClick={() => syncMutation.mutate({ brand_id: p.brand_slug })}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit Price" onClick={() => openEdit(p)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View History" onClick={() => setHistoryPrinter(p)}>
                        <History className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* History Modal */}
      <Dialog open={!!historyPrinter} onOpenChange={() => setHistoryPrinter(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Price History — {historyPrinter?.model_name}</DialogTitle>
            <DialogDescription>Recent price changes for this printer</DialogDescription>
          </DialogHeader>
          {priceHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No history found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceHistory.map((h: any) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-sm">
                      {h.recorded_at ? format(new Date(h.recorded_at), 'MMM d, yyyy HH:mm') : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">${Number(h.price).toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{h.currency ?? 'USD'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{h.source ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editPrinter} onOpenChange={() => setEditPrinter(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Prices — {editPrinter?.model_name}</DialogTitle>
            <DialogDescription>Manually set prices and URLs for this printer</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'current_price_usd_store', label: 'US Price ($)' },
              { key: 'current_price_cad_store', label: 'CA Price (C$)' },
              { key: 'current_price_gbp_store', label: 'UK Price (£)' },
              { key: 'current_price_eur_store', label: 'EU Price (€)' },
              { key: 'msrp_usd', label: 'MSRP USD' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm[f.key] ?? ''}
                  onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="h-9"
                />
              </div>
            ))}
          </div>
          <div className="space-y-3 mt-2">
            {[
              { key: 'product_url', label: 'US URL' },
              { key: 'product_url_ca', label: 'CA URL' },
              { key: 'product_url_uk', label: 'UK URL' },
              { key: 'product_url_eu', label: 'EU URL' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                <Input
                  value={editForm[f.key] ?? ''}
                  onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="h-9 text-sm"
                  placeholder="https://…"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPrinter(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={editMutation.isPending}>
              {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
