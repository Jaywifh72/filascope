import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useTdFilterOptions } from '@/hooks/useTdManagement';
import { useAddReferenceValue } from '@/hooks/useTdManagement';
import { useTdMatching } from '@/hooks/useTdMatching';
import { TdMatchResultsPanel } from './TdMatchResultsPanel';
import { supabase } from '@/integrations/supabase/client';
import { downloadCSV } from '@/lib/csvExport';
import { toast } from '@/hooks/use-toast';
import { Play, Upload, Download, Loader2 } from 'lucide-react';

export function TdActionToolbar() {
  const [brand, setBrand] = useState('all');
  const [dryRun, setDryRun] = useState(true);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [resultsOpen, setResultsOpen] = useState(false);
  const { data: options } = useTdFilterOptions();
  const addRefMut = useAddReferenceValue();
  const { matches, unmatchedRefs, isRunning, isApplying, progress, stats, runMatching, applyMatches } = useTdMatching();

  const handleRun = async () => {
    await runMatching({ dryRun, brandFilter: brand });
    setResultsOpen(true);
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
        <Button size="sm" onClick={handleRun} disabled={isRunning}>
          {isRunning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
          {isRunning ? progress.phase : 'Run Matching'}
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

      {/* Results Dialog */}
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
    </>
  );
}
