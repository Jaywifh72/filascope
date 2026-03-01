import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTdFilterOptions } from '@/hooks/useTdManagement';
import { useAddReferenceValue } from '@/hooks/useTdManagement';
import { useTdMatching } from '@/hooks/useTdMatching';
import { TdMatchResultsPanel } from './TdMatchResultsPanel';
import { supabase } from '@/integrations/supabase/client';
import { downloadCSV } from '@/lib/csvExport';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Play, Upload, Download, Loader2, Zap, Check, CloudDownload } from 'lucide-react';

interface RpcMatchResult {
  filament_id: string;
  vendor: string;
  product_title: string;
  color_family: string;
  material: string;
  ref_brand: string;
  ref_color: string;
  ref_material: string;
  td_value: number;
  confidence: string;
}

export function TdActionToolbar() {
  const qc = useQueryClient();
  const [brand, setBrand] = useState('all');
  const [dryRun, setDryRun] = useState(true);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [resultsOpen, setResultsOpen] = useState(false);

  // Quick Match RPC state
  const [quickMatchOpen, setQuickMatchOpen] = useState(false);
  const [quickMatchResults, setQuickMatchResults] = useState<RpcMatchResult[]>([]);
  const [quickMatchLoading, setQuickMatchLoading] = useState(false);
  const [quickMatchApplying, setQuickMatchApplying] = useState(false);

  // Fetch External TD state
  const [fetchingExternal, setFetchingExternal] = useState(false);

  const { data: options } = useTdFilterOptions();
  const addRefMut = useAddReferenceValue();
  const { matches, unmatchedRefs, isRunning, isApplying, progress, stats, runMatching, applyMatches } = useTdMatching();

  const handleRun = async () => {
    await runMatching({ dryRun, brandFilter: brand });
    setResultsOpen(true);
  };

  // Quick Match via RPC
  const handleQuickMatch = async () => {
    setQuickMatchLoading(true);
    setQuickMatchResults([]);
    try {
      const brandFilter = brand === 'all' ? null : brand;
      const { data, error } = await supabase.rpc('match_td_reference_values', {
        p_dry_run: true,
        p_brand_filter: brandFilter,
      });
      if (error) throw error;
      setQuickMatchResults((data as RpcMatchResult[]) ?? []);
      setQuickMatchOpen(true);
    } catch (err: any) {
      toast({ title: 'Quick Match failed', description: err.message, variant: 'destructive' });
    } finally {
      setQuickMatchLoading(false);
    }
  };

  const handleQuickMatchApply = async () => {
    setQuickMatchApplying(true);
    try {
      const brandFilter = brand === 'all' ? null : brand;
      const { data, error } = await supabase.rpc('match_td_reference_values', {
        p_dry_run: false,
        p_brand_filter: brandFilter,
      });
      if (error) throw error;
      const count = (data as RpcMatchResult[])?.length ?? 0;
      toast({ title: `Applied ${count} TD values from reference data` });
      qc.invalidateQueries({ queryKey: ['td-stats'] });
      qc.invalidateQueries({ queryKey: ['td-filaments'] });
      qc.invalidateQueries({ queryKey: ['td-population-log'] });
      setQuickMatchOpen(false);
      setQuickMatchResults([]);
    } catch (err: any) {
      toast({ title: 'Apply failed', description: err.message, variant: 'destructive' });
    } finally {
      setQuickMatchApplying(false);
    }
  };

  // Fetch External TD from 3DFilamentProfiles
  const handleFetchExternal = async () => {
    setFetchingExternal(true);
    try {
      const body = brand === 'all' ? { allBrands: true } : { brand };
      const { data, error } = await supabase.functions.invoke('scrape-td-values', { body });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Unknown error');

      const results = data.results || [];
      const totals = results.reduce(
        (acc: any, r: any) => ({
          withTd: acc.withTd + (r.withTd || 0),
          inserted: acc.inserted + (r.inserted || 0),
          updated: acc.updated + (r.updated || 0),
          skipped: acc.skipped + (r.skipped || 0),
        }),
        { withTd: 0, inserted: 0, updated: 0, skipped: 0 }
      );

      toast({
        title: `Fetched TD values from 3DFilamentProfiles`,
        description: `${totals.withTd} with TD → ${totals.inserted} inserted, ${totals.updated} updated, ${totals.skipped} skipped (${data.elapsed_seconds}s)`,
      });

      qc.invalidateQueries({ queryKey: ['td-stats'] });
      qc.invalidateQueries({ queryKey: ['td-reference'] });
      qc.invalidateQueries({ queryKey: ['td-population-log'] });
    } catch (err: any) {
      toast({ title: 'Fetch External TD failed', description: err.message, variant: 'destructive' });
    } finally {
      setFetchingExternal(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(Boolean);
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(',').map((v) => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => (obj[h] = vals[i] || ''));
        return obj;
      });
      setCsvRows(rows);
    };
    reader.readAsText(file);
  };

  const importCsv = async () => {
    for (const row of csvRows) {
      const val = parseFloat(row.td_value);
      if (isNaN(val) || val < 0.1 || val > 15) continue;
      await addRefMut.mutateAsync({
        brand_name: row.brand_name || '',
        color_name: row.color_name || '',
        material_type: row.material || 'PLA',
        td_value: val,
        source: row.source || 'csv_import',
        confidence: 'medium',
      });
    }
    setCsvOpen(false);
    setCsvRows([]);
    toast({ title: `Imported ${csvRows.length} values` });
  };

  const exportMissing = async () => {
    const { data } = await supabase
      .from('filaments')
      .select('id, vendor, product_title, material, color_family, color_hex, product_url')
      .is('transmission_distance', null)
      .order('vendor')
      .limit(1000);
    if (data?.length) downloadCSV(data, 'filaments-missing-td');
    else toast({ title: 'No missing filaments found' });
  };

  const CONFIDENCE_COLORS: Record<string, string> = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {/* Brand filter */}
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Brand" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {(options?.brands ?? []).map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch id="dry-run" checked={dryRun} onCheckedChange={setDryRun} />
          <Label htmlFor="dry-run" className="text-xs">Dry Run</Label>
        </div>

        {/* Client-side matching */}
        <Button size="sm" onClick={handleRun} disabled={isRunning}>
          {isRunning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
          {isRunning ? progress.phase : 'Run Matching'}
        </Button>

        {/* Quick Match RPC */}
        <Button size="sm" variant="secondary" onClick={handleQuickMatch} disabled={quickMatchLoading}>
          {quickMatchLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />}
          Quick Match
        </Button>

        {/* Fetch External TD */}
        <Button size="sm" variant="outline" onClick={handleFetchExternal} disabled={fetchingExternal}>
          {fetchingExternal ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CloudDownload className="w-4 h-4 mr-1" />}
          {fetchingExternal ? `Fetching ${brand === 'all' ? 'all' : brand}...` : 'Fetch External TD'}
        </Button>

        {isRunning && (
          <Progress value={progress.total ? (progress.current / progress.total) * 100 : 0} className="w-32 h-2" />
        )}

        <div className="h-6 w-px bg-border" />

        {/* CSV Import */}
        <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-1" /> Bulk Import CSV</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Import TD Values from CSV</DialogTitle></DialogHeader>
            <p className="text-xs text-muted-foreground">CSV format: brand_name, color_name, material, td_value, source</p>
            <input type="file" accept=".csv" onChange={handleCsvUpload} className="text-sm" />
            {csvRows.length > 0 && (
              <>
                <div className="max-h-64 overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand</TableHead><TableHead>Color</TableHead><TableHead>Material</TableHead><TableHead>TD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvRows.slice(0, 20).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{r.brand_name}</TableCell>
                          <TableCell className="text-xs">{r.color_name}</TableCell>
                          <TableCell className="text-xs">{r.material}</TableCell>
                          <TableCell className="text-xs">{r.td_value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={importCsv} disabled={addRefMut.isPending}>Import {csvRows.length} rows</Button>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Export Missing */}
        <Button variant="outline" size="sm" onClick={exportMissing}>
          <Download className="w-4 h-4 mr-1" /> Export Missing
        </Button>
      </div>

      {/* Client-side Results Dialog */}
      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>TD Matching Results</DialogTitle></DialogHeader>
          <TdMatchResultsPanel
            matches={matches}
            unmatchedRefs={unmatchedRefs}
            isApplying={isApplying}
            progress={progress}
            stats={stats}
            onApply={applyMatches}
          />
        </DialogContent>
      </Dialog>

      {/* Quick Match RPC Results Dialog */}
      <Dialog open={quickMatchOpen} onOpenChange={setQuickMatchOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Quick Match Results (Server-Side)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found <span className="font-semibold text-foreground">{quickMatchResults.length}</span> matches from reference data
              </p>
              <Button
                size="sm"
                onClick={handleQuickMatchApply}
                disabled={quickMatchApplying || quickMatchResults.length === 0}
              >
                {quickMatchApplying ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                Apply All ({quickMatchResults.length})
              </Button>
            </div>

            {quickMatchResults.length > 0 && (
              <div className="max-h-96 overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Ref Material</TableHead>
                      <TableHead>TD</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quickMatchResults.map((r) => (
                      <TableRow key={r.filament_id}>
                        <TableCell className="text-xs font-medium">{r.vendor}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{r.product_title}</TableCell>
                        <TableCell className="text-xs">{r.color_family}</TableCell>
                        <TableCell className="text-xs">{r.ref_material}</TableCell>
                        <TableCell className="text-xs font-mono font-semibold">{r.td_value}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={CONFIDENCE_COLORS[r.confidence] ?? ''}>
                            {r.confidence}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {quickMatchResults.length === 0 && !quickMatchLoading && (
              <p className="text-sm text-muted-foreground text-center py-8">No matches found. All filaments may already have TD values assigned.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
