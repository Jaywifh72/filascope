import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { RefreshCw, Search, ChevronDown, ExternalLink, Pencil, AlertTriangle, Check, X } from 'lucide-react';

const REGIONS = ['US', 'CA', 'UK', 'EU', 'AU', 'JP'] as const;
type Region = typeof REGIONS[number];

const URL_COLUMNS: Record<Region, string> = {
  US: 'product_url', CA: 'product_url_ca', UK: 'product_url_uk',
  EU: 'product_url_eu', AU: 'product_url_au', JP: 'product_url_jp',
};

type StatusFilter = 'all' | 'valid' | 'invalid' | 'redirect' | 'unchecked' | 'price_mismatch';

interface Validation {
  id: string;
  printer_id: string;
  region: string;
  url: string;
  status_code: number | null;
  status: string;
  redirect_url: string | null;
  error_message: string | null;
  price_found: number | null;
  price_in_db: number | null;
  price_mismatch: boolean;
  validated_at: string;
}

interface PrinterRow {
  id: string;
  model_name: string;
  slug: string;
  brand_name: string;
  product_url: string | null;
  product_url_ca: string | null;
  product_url_uk: string | null;
  product_url_eu: string | null;
  product_url_au: string | null;
  product_url_jp: string | null;
  validations: Record<string, Validation>;
}

export default function PrinterUrlHealth() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editingPrinter, setEditingPrinter] = useState<string | null>(null);
  const [editUrls, setEditUrls] = useState<Record<string, string>>({});
  const [validatingAll, setValidatingAll] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [priceMismatchOpen, setPriceMismatchOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch printers with brand info
  const { data: printers } = useQuery({
    queryKey: ['admin-printer-urls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printers')
        .select('id, model_name, slug, brand_id, product_url, product_url_ca, product_url_uk, product_url_eu, product_url_au, product_url_jp, printer_brands!inner(brand)')
        .order('model_name');
      if (error) throw error;
      return data as unknown as Array<{
        id: string; model_name: string; slug: string; brand_id: string;
        product_url: string | null; product_url_ca: string | null; product_url_uk: string | null;
        product_url_eu: string | null; product_url_au: string | null; product_url_jp: string | null;
        printer_brands: { brand: string };
      }>;
    },
  });

  // Fetch validations
  const { data: validations } = useQuery({
    queryKey: ['admin-printer-validations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printer_url_validations')
        .select('*');
      if (error) throw error;
      return data as Validation[];
    },
  });

  // Build printer rows with validations
  const printerRows: PrinterRow[] = useMemo(() => {
    if (!printers) return [];
    const valMap = new Map<string, Record<string, Validation>>();
    validations?.forEach(v => {
      if (!valMap.has(v.printer_id)) valMap.set(v.printer_id, {});
      valMap.get(v.printer_id)![v.region] = v;
    });
    return printers.map(p => ({
      id: p.id,
      model_name: p.model_name,
      slug: p.slug,
      brand_name: p.printer_brands?.brand || 'Unknown',
      product_url: p.product_url,
      product_url_ca: p.product_url_ca,
      product_url_uk: p.product_url_uk,
      product_url_eu: p.product_url_eu,
      product_url_au: p.product_url_au,
      product_url_jp: p.product_url_jp,
      validations: valMap.get(p.id) || {},
    }));
  }, [printers, validations]);

  // Brands list
  const brands = useMemo(() => {
    const set = new Set(printerRows.map(p => p.brand_name));
    return Array.from(set).sort();
  }, [printerRows]);

  // Summary stats
  const stats = useMemo(() => {
    let totalUrls = 0, valid = 0, invalid = 0, redirect = 0, unchecked = 0, priceMismatches = 0;
    printerRows.forEach(p => {
      REGIONS.forEach(r => {
        const url = p[URL_COLUMNS[r] as keyof PrinterRow];
        if (!url) return;
        totalUrls++;
        const v = p.validations[r];
        if (!v) { unchecked++; return; }
        if (v.status === 'valid') valid++;
        else if (v.status === 'invalid') invalid++;
        else if (v.status === 'redirect') redirect++;
        else unchecked++;
        if (v.price_mismatch) priceMismatches++;
      });
    });
    return { totalUrls, valid, invalid, redirect, unchecked, priceMismatches };
  }, [printerRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return printerRows.filter(p => {
      if (brandFilter !== 'all' && p.brand_name !== brandFilter) return false;
      if (search && !p.model_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter === 'all' && regionFilter === 'all') return true;

      // Check if any region matches filters
      return REGIONS.some(r => {
        if (regionFilter !== 'all' && r !== regionFilter) return false;
        const url = p[URL_COLUMNS[r] as keyof PrinterRow];
        if (!url) return statusFilter === 'unchecked';
        const v = p.validations[r];
        if (statusFilter === 'all') return true;
        if (statusFilter === 'unchecked') return !v;
        if (statusFilter === 'price_mismatch') return v?.price_mismatch;
        return v?.status === statusFilter;
      });
    });
  }, [printerRows, statusFilter, regionFilter, brandFilter, search]);

  // Price mismatches
  const priceMismatches = useMemo(() => {
    const results: Array<{ printer: PrinterRow; region: string; v: Validation }> = [];
    printerRows.forEach(p => {
      REGIONS.forEach(r => {
        const v = p.validations[r];
        if (v?.price_mismatch) results.push({ printer: p, region: r, v });
      });
    });
    return results;
  }, [printerRows]);

  // Validate mutation
  const triggerValidation = async (printerId?: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/validate-printer-urls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify(printerId ? { printerId } : {}),
    });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  };

  const handleValidateAll = async () => {
    setValidatingAll(true);
    try {
      const result = await triggerValidation();
      toast.success(`Validated ${result.summary.total} URLs: ${result.summary.valid} valid, ${result.summary.invalid} broken, ${result.summary.redirect} redirects`);
      queryClient.invalidateQueries({ queryKey: ['admin-printer-validations'] });
    } catch (e) {
      toast.error('Validation failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setValidatingAll(false);
    }
  };

  const handleValidatePrinter = async (id: string) => {
    setValidatingId(id);
    try {
      const result = await triggerValidation(id);
      toast.success(`Validated ${result.summary.total} URLs for this printer`);
      queryClient.invalidateQueries({ queryKey: ['admin-printer-validations'] });
    } catch (e) {
      toast.error('Validation failed');
    } finally {
      setValidatingId(null);
    }
  };

  const handleStartEdit = (p: PrinterRow) => {
    setEditingPrinter(p.id);
    setEditUrls({
      product_url: p.product_url || '',
      product_url_ca: p.product_url_ca || '',
      product_url_uk: p.product_url_uk || '',
      product_url_eu: p.product_url_eu || '',
      product_url_au: p.product_url_au || '',
      product_url_jp: p.product_url_jp || '',
    });
  };

  const handleSaveUrls = async (printerId: string) => {
    const updates: Record<string, string | null> = {};
    Object.entries(editUrls).forEach(([k, v]) => {
      updates[k] = v.trim() || null;
    });
    const { error } = await supabase.from('printers').update(updates).eq('id', printerId);
    if (error) {
      toast.error('Failed to save URLs');
    } else {
      toast.success('URLs updated');
      setEditingPrinter(null);
      queryClient.invalidateQueries({ queryKey: ['admin-printer-urls'] });
    }
  };

  const handleAcceptStorePrice = async (printerId: string, region: string, storePrice: number) => {
    const priceColMap: Record<string, string> = {
      US: 'current_price_usd_store', CA: 'current_price_cad_store',
      UK: 'current_price_gbp_store', EU: 'current_price_eur_store',
      AU: 'current_price_aud_store', JP: 'current_price_jpy_store',
    };
    const col = priceColMap[region];
    if (!col) return;
    const { error } = await supabase.from('printers').update({ [col]: storePrice }).eq('id', printerId);
    if (error) {
      toast.error('Failed to update price');
    } else {
      toast.success('Price updated to match store');
      // Also clear the mismatch flag
      await supabase.from('printer_url_validations')
        .update({ price_mismatch: false, price_in_db: storePrice })
        .eq('printer_id', printerId).eq('region', region);
      queryClient.invalidateQueries({ queryKey: ['admin-printer-validations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-printer-urls'] });
    }
  };

  const getStatusDot = (p: PrinterRow, region: Region) => {
    const url = p[URL_COLUMNS[region] as keyof PrinterRow] as string | null;
    if (!url) return <span className="inline-block w-3 h-3 rounded-full bg-muted" title="No URL" />;
    const v = p.validations[region];
    if (!v) return <span className="inline-block w-3 h-3 rounded-full bg-muted-foreground/30" title="Not checked" />;

    const colorClass = v.status === 'valid' ? 'bg-green-500' : v.status === 'redirect' ? 'bg-yellow-500' : v.status === 'invalid' ? 'bg-destructive' : 'bg-muted-foreground/30';
    const timeStr = new Date(v.validated_at).toLocaleString();

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded-full ${colorClass}`} />
            {v.price_mismatch && <AlertTriangle className="w-3 h-3 text-orange-500" />}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs space-y-1">
          <p className="font-medium">{v.status.toUpperCase()} ({v.status_code || '?'})</p>
          <p className="truncate">{url}</p>
          {v.redirect_url && <p className="text-yellow-400 truncate">→ {v.redirect_url}</p>}
          {v.price_mismatch && (
            <p className="text-orange-400">Price: DB ${v.price_in_db} vs Store ${v.price_found}</p>
          )}
          {v.error_message && <p className="text-destructive">{v.error_message}</p>}
          <p className="text-muted-foreground">{timeStr}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Printer URL Health</h1>
          <Button onClick={handleValidateAll} disabled={validatingAll}>
            <RefreshCw className={`w-4 h-4 mr-2 ${validatingAll ? 'animate-spin' : ''}`} />
            {validatingAll ? 'Validating...' : 'Validate All'}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'Total URLs', value: stats.totalUrls, color: 'text-foreground' },
            { label: 'Valid', value: stats.valid, color: 'text-green-500' },
            { label: 'Broken', value: stats.invalid, color: 'text-destructive' },
            { label: 'Redirects', value: stats.redirect, color: 'text-yellow-500' },
            { label: 'Unchecked', value: stats.unchecked, color: 'text-muted-foreground' },
            { label: 'Price Mismatch', value: stats.priceMismatches, color: 'text-orange-500' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search printer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-60" />
          </div>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}>
            <option value="all">All Status</option>
            <option value="valid">Valid</option>
            <option value="invalid">Broken</option>
            <option value="redirect">Redirect</option>
            <option value="unchecked">Unchecked</option>
            <option value="price_mismatch">Price Mismatch</option>
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
            <option value="all">All Regions</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
            <option value="all">All Brands</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Price Mismatch Section */}
        {priceMismatches.length > 0 && (
          <Collapsible open={priceMismatchOpen} onOpenChange={setPriceMismatchOpen}>
            <Card className="border-orange-500/50">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer flex-row items-center justify-between py-3">
                  <CardTitle className="text-sm text-orange-500 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {priceMismatches.length} Price Mismatches
                  </CardTitle>
                  <ChevronDown className={`w-4 h-4 transition-transform ${priceMismatchOpen ? 'rotate-180' : ''}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Printer</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>DB Price</TableHead>
                        <TableHead>Store Price</TableHead>
                        <TableHead>Diff %</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priceMismatches.map(({ printer, region, v }) => {
                        const diff = v.price_in_db && v.price_found
                          ? Math.round(Math.abs(v.price_found - v.price_in_db) / v.price_in_db * 100)
                          : 0;
                        return (
                          <TableRow key={`${printer.id}-${region}`}>
                            <TableCell className="font-medium">{printer.model_name}</TableCell>
                            <TableCell>{region}</TableCell>
                            <TableCell>${v.price_in_db?.toFixed(2)}</TableCell>
                            <TableCell>${v.price_found?.toFixed(2)}</TableCell>
                            <TableCell className="text-orange-500">{diff}%</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={() => handleAcceptStorePrice(printer.id, region, v.price_found!)}>
                                <Check className="w-3 h-3 mr-1" /> Accept
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Main Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Printer</TableHead>
                  <TableHead>Brand</TableHead>
                  {REGIONS.map(r => <TableHead key={r} className="text-center w-16">{r}</TableHead>)}
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.model_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.brand_name}</TableCell>
                    {REGIONS.map(r => (
                      <TableCell key={r} className="text-center">{getStatusDot(p, r)}</TableCell>
                    ))}
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleValidatePrinter(p.id)} disabled={validatingId === p.id}>
                          <RefreshCw className={`w-3 h-3 ${validatingId === p.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => editingPrinter === p.id ? setEditingPrinter(null) : handleStartEdit(p)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={REGIONS.length + 3} className="text-center text-muted-foreground py-8">
                      No printers match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Inline URL Editor */}
        {editingPrinter && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Edit URLs for {printerRows.find(p => p.id === editingPrinter)?.model_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {REGIONS.map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-medium text-muted-foreground">{r}</span>
                    <Input
                      value={editUrls[URL_COLUMNS[r]] || ''}
                      onChange={e => setEditUrls(prev => ({ ...prev, [URL_COLUMNS[r]]: e.target.value }))}
                      placeholder={`${r} store URL...`}
                      className="flex-1"
                    />
                    {editUrls[URL_COLUMNS[r]] && (
                      <a href={editUrls[URL_COLUMNS[r]]} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSaveUrls(editingPrinter)}>Save URLs</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingPrinter(null)}>
                  <X className="w-3 h-3 mr-1" /> Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
