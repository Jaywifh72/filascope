import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTdFilterOptions, useTdStats } from '@/hooks/useTdManagement';
import { useAddReferenceValue } from '@/hooks/useTdManagement';
import { useTdMatching } from '@/hooks/useTdMatching';
import { TdMatchResultsPanel } from './TdMatchResultsPanel';
import { supabase } from '@/integrations/supabase/client';
import { downloadCSV } from '@/lib/csvExport';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Play, Upload, Download, Loader2, Zap, Check, CloudDownload, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

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

interface CsvImportRow {
  brand: string;
  color: string;
  material: string;
  td_value: string;
  hex_code?: string;
  source?: string;
  notes?: string;
  _status: 'valid' | 'warning' | 'error';
  _message: string;
}

export function TdActionToolbar() {
  const qc = useQueryClient();
  const [brand, setBrand] = useState('all');
  const [dryRun, setDryRun] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(false);

  // Quick Match RPC state
  const [quickMatchOpen, setQuickMatchOpen] = useState(false);
  const [quickMatchResults, setQuickMatchResults] = useState<RpcMatchResult[]>([]);
  const [quickMatchLoading, setQuickMatchLoading] = useState(false);
  const [quickMatchApplying, setQuickMatchApplying] = useState(false);

  // Fetch External TD state
  const [fetchingExternal, setFetchingExternal] = useState(false);

  // Bulk Import CSV state
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<CsvImportRow[]>([]);
  const [importSource, setImportSource] = useState('community_submission');
  const [importConfidence, setImportConfidence] = useState<'high' | 'medium' | 'low'>('medium');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ inserted: number; updated: number; skipped: number } | null>(null);
  const [knownBrands, setKnownBrands] = useState<Set<string>>(new Set());

  // Export Missing state
  const [exporting, setExporting] = useState(false);

  const { data: options } = useTdFilterOptions();
  const { dataUpdatedAt } = useTdStats();
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
      toast({ title: `✅ Applied ${count} TD values from reference data` });
      qc.invalidateQueries({ queryKey: ['td-stats'] });
      qc.invalidateQueries({ queryKey: ['td-filaments'] });
      qc.invalidateQueries({ queryKey: ['td-population-log'] });
      qc.invalidateQueries({ queryKey: ['td-reference-match-stats'] });
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
      qc.invalidateQueries({ queryKey: ['td-reference-values'] });
      qc.invalidateQueries({ queryKey: ['td-reference-match-stats'] });
      qc.invalidateQueries({ queryKey: ['td-population-log'] });
    } catch (err: any) {
      toast({ title: 'Fetch External TD failed', description: err.message, variant: 'destructive' });
    } finally {
      setFetchingExternal(false);
    }
  };

  // ─── Enhanced Export Missing ───────────────────────────────────────
  const exportMissing = async () => {
    setExporting(true);
    try {
      const allRows: any[] = [];
      const PAGE_SIZE = 1000;
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('filaments')
          .select('vendor, product_title, material, color_family, color_hex, product_handle')
          .is('transmission_distance', null)
          .order('vendor')
          .order('material')
          .order('color_family')
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) throw error;
        if (data) allRows.push(...data);
        hasMore = (data?.length ?? 0) === PAGE_SIZE;
        page++;
      }

      if (allRows.length === 0) {
        toast({ title: 'No missing filaments found' });
        return;
      }

      const csvData = allRows.map(f => ({
        brand: f.vendor ?? '',
        product_title: f.product_title ?? '',
        material: f.material ?? '',
        color: f.color_family ?? '',
        hex_code: f.color_hex ?? '',
        current_td: '',
        notes: '',
        filascope_url: f.product_handle
          ? `https://filascope.com/filament/${f.product_handle}`
          : '',
      }));

      const dateStr = new Date().toISOString().slice(0, 10);
      downloadCSV(csvData, `filascope_missing_td_values_${dateStr}`);
      toast({ title: `📥 Exported ${allRows.length} filaments to CSV` });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  // ─── Bulk Import CSV ──────────────────────────────────────────────
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);

    // Load known brands for validation
    const { data: brandData } = await supabase
      .from('filaments')
      .select('vendor')
      .limit(10000);
    const brands = new Set((brandData ?? []).map(b => (b.vendor ?? '').toLowerCase()));
    setKnownBrands(brands);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        toast({ title: 'CSV must have a header row and at least one data row', variant: 'destructive' });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const rows: CsvImportRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const vals = parseCSVLine(lines[i]);
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => (obj[h] = (vals[idx] ?? '').trim()));

        const brandVal = obj.brand || obj.brand_name || '';
        const colorVal = obj.color || obj.color_name || '';
        const materialVal = obj.material || obj.material_type || '';
        const tdVal = obj.td_value || obj.current_td || obj.td || '';
        const hexVal = obj.hex_code || obj.color_hex || '';
        const sourceVal = obj.source || '';
        const notesVal = obj.notes || '';

        const tdNum = parseFloat(tdVal);
        let status: 'valid' | 'warning' | 'error' = 'valid';
        let message = '';

        if (!tdVal || isNaN(tdNum) || tdNum < 0 || tdNum > 100) {
          status = 'error';
          message = `Invalid TD value: "${tdVal}"`;
        } else if (!brandVal) {
          status = 'error';
          message = 'Missing brand';
        } else if (!brands.has(brandVal.toLowerCase())) {
          status = 'warning';
          message = `Brand "${brandVal}" not found in database`;
        }

        if (!colorVal && status !== 'error') {
          status = 'error';
          message = 'Missing color';
        }

        rows.push({
          brand: brandVal,
          color: colorVal,
          material: materialVal || 'PLA',
          td_value: tdVal,
          hex_code: hexVal,
          source: sourceVal,
          notes: notesVal,
          _status: status,
          _message: message,
        });
      }

      setImportRows(rows);
    };
    reader.readAsText(file);
  };

  const importSummary = useMemo(() => {
    const valid = importRows.filter(r => r._status === 'valid').length;
    const warnings = importRows.filter(r => r._status === 'warning').length;
    const errors = importRows.filter(r => r._status === 'error').length;
    return { valid, warnings, errors, total: importRows.length };
  }, [importRows]);

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    let inserted = 0, updated = 0, skipped = 0;

    try {
      const importable = importRows.filter(r => r._status !== 'error');

      for (const row of importable) {
        const tdNum = parseFloat(row.td_value);
        if (isNaN(tdNum)) continue;

        // Check existing entry
        const { data: existing } = await supabase
          .from('td_reference_values')
          .select('id, confidence')
          .ilike('brand_name', row.brand)
          .ilike('color_name', row.color)
          .ilike('material_type', row.material)
          .limit(1)
          .maybeSingle();

        if (existing) {
          // Don't overwrite high confidence with lower
          const confRank = { high: 3, medium: 2, low: 1 };
          const existingRank = confRank[existing.confidence as keyof typeof confRank] ?? 0;
          const newRank = confRank[importConfidence] ?? 0;

          if (newRank > existingRank || (newRank === existingRank)) {
            const { error } = await supabase
              .from('td_reference_values')
              .update({
                td_value: tdNum,
                confidence: importConfidence,
                source: importSource,
                color_hex: row.hex_code || undefined,
              })
              .eq('id', existing.id);
            if (!error) updated++;
            else skipped++;
          } else {
            skipped++;
          }
        } else {
          const { error } = await supabase
            .from('td_reference_values')
            .insert({
              brand_name: row.brand,
              color_name: row.color,
              material_type: row.material,
              td_value: tdNum,
              confidence: importConfidence,
              source: importSource,
              color_hex: row.hex_code || null,
            });
          if (!error) inserted++;
          else skipped++;
        }
      }

      setImportResult({ inserted, updated, skipped });
      qc.invalidateQueries({ queryKey: ['td-stats'] });
      qc.invalidateQueries({ queryKey: ['td-reference-values'] });
      qc.invalidateQueries({ queryKey: ['td-reference-match-stats'] });
      toast({
        title: `✅ Imported ${inserted} new reference values, ${updated} updated`,
        description: `${skipped} skipped`,
      });
    } catch (err: any) {
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const CONFIDENCE_COLORS: Record<string, string> = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {/* Refresh + Last Updated */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => qc.invalidateQueries({ queryKey: ['td-stats'] })}
          title="Refresh stats"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        {dataUpdatedAt ? (
          <span className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
          </span>
        ) : null}
        <div className="h-6 w-px bg-border" />
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

        {/* Bulk Import CSV */}
        <Dialog open={importOpen} onOpenChange={(open) => {
          setImportOpen(open);
          if (!open) { setImportRows([]); setImportResult(null); }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-1" /> Bulk Import CSV</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Import TD Reference Values from CSV</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              Upload a CSV with columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">brand, color, material, td_value</code>.
              Optional: <code className="text-xs bg-muted px-1 py-0.5 rounded">hex_code, source, notes</code>
            </p>

            <input
              type="file"
              accept=".csv"
              onChange={handleImportFileChange}
              className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />

            {importRows.length > 0 && (
              <div className="space-y-4">
                {/* Summary bar */}
                <div className="flex flex-wrap items-center gap-4 rounded-md border bg-muted/30 px-4 py-2.5 text-sm">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {importSummary.valid} valid
                  </span>
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    {importSummary.warnings} warnings
                  </span>
                  <span className="flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-destructive" />
                    {importSummary.errors} errors
                  </span>
                  <span className="text-muted-foreground ml-auto">{importSummary.total} total rows</span>
                </div>

                {/* Preview table */}
                <div className="max-h-64 overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">✓</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>TD</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importRows.slice(0, 20).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            {r._status === 'valid' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            {r._status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                            {r._status === 'error' && <XCircle className="w-4 h-4 text-destructive" />}
                          </TableCell>
                          <TableCell className="text-xs">{r.brand}</TableCell>
                          <TableCell className="text-xs">{r.color}</TableCell>
                          <TableCell className="text-xs">{r.material}</TableCell>
                          <TableCell className="text-xs font-mono">{r.td_value}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r._message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {importRows.length > 20 && (
                  <p className="text-xs text-muted-foreground">Showing first 20 of {importRows.length} rows</p>
                )}

                {/* Source & Confidence selectors */}
                <div className="flex gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Source</Label>
                    <Select value={importSource} onValueChange={setImportSource}>
                      <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="community_submission">Community Submission</SelectItem>
                        <SelectItem value="manufacturer_official">Manufacturer Official</SelectItem>
                        <SelectItem value="self_measured">Self Measured</SelectItem>
                        <SelectItem value="3dfilamentprofiles_community">3DFilamentProfiles Community</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Confidence</Label>
                    <Select value={importConfidence} onValueChange={(v) => setImportConfidence(v as 'high' | 'medium' | 'low')}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Import result */}
                {importResult && (
                  <div className="rounded-md border bg-muted/30 px-4 py-2.5 text-sm">
                    Imported <strong>{importResult.inserted}</strong> new entries,
                    updated <strong>{importResult.updated}</strong> existing,
                    skipped <strong>{importResult.skipped}</strong> (high confidence or errors)
                  </div>
                )}

                {/* Import button */}
                <Button
                  onClick={handleImport}
                  disabled={importing || importSummary.valid + importSummary.warnings === 0}
                >
                  {importing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                  Import {importSummary.valid + importSummary.warnings} entries
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Export Missing */}
        <Button variant="outline" size="sm" onClick={exportMissing} disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
          Export Missing
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

// ─── CSV Line Parser (handles quoted fields) ─────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}
