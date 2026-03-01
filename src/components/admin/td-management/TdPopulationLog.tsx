import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTdPopulationLogBatched, type TdLogFilters, type LogBatch, type LogEntry } from '@/hooks/useTdManagement';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, Trash2, Activity, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

const SOURCE_LABELS: Record<string, { label: string; icon: string }> = {
  reference_match: { label: 'Run Matching', icon: '🔄' },
  csv_import: { label: 'Bulk Import', icon: '📤' },
  '3dfilamentprofiles_auto': { label: 'Fetch External', icon: '🌐' },
  manual: { label: 'Manual Edit', icon: '✏️' },
};

function parseNotes(notes: string | null): Record<string, any> | null {
  if (!notes) return null;
  try { return JSON.parse(notes); } catch { return null; }
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function BatchCard({ batch }: { batch: LogBatch }) {
  const [open, setOpen] = useState(false);
  const { summary } = batch;
  const srcInfo = SOURCE_LABELS[batch.source] || { label: batch.source, icon: '📋' };
  const brandText = summary.brands.length <= 3
    ? summary.brands.join(', ')
    : `${summary.brands.slice(0, 3).join(', ')} +${summary.brands.length - 3} more`;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
          <div className="text-lg">{srcInfo.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{srcInfo.label}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(batch.timestamp).toLocaleString()} · {formatDistanceToNow(new Date(batch.timestamp), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {summary.applied > 0 && <span className="text-xs text-green-600 font-medium">{summary.applied} applied</span>}
              {summary.skipped > 0 && <span className="text-xs text-yellow-600 font-medium">{summary.skipped} skipped</span>}
              {summary.errors > 0 && <span className="text-xs text-red-600 font-medium">{summary.errors} errors</span>}
              {summary.dryRun > 0 && <span className="text-xs text-blue-600 font-medium">{summary.dryRun} dry-run</span>}
              {brandText && <span className="text-xs text-muted-foreground">· {brandText}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {summary.highConf > 0 && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{summary.highConf} high</Badge>}
            {summary.medConf > 0 && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{summary.medConf} med</Badge>}
            {summary.lowConf > 0 && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{summary.lowConf} low</Badge>}
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">{batch.entries.length}</Badge>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Filament</TableHead>
                <TableHead className="text-xs">Brand</TableHead>
                <TableHead className="text-xs">Color / Material</TableHead>
                <TableHead className="text-xs">TD Value</TableHead>
                <TableHead className="text-xs">Previous</TableHead>
                <TableHead className="text-xs">Confidence</TableHead>
                <TableHead className="text-xs">Rule</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batch.entries.map((log) => {
                const parsed = parseNotes(log.notes);
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      {log.filament?.product_title || log.filament_id || '—'}
                    </TableCell>
                    <TableCell className="text-xs">{parsed?.refBrand || log.filament?.vendor || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {parsed?.refColor || log.filament?.color_family || '—'} / {parsed?.refMaterial || log.filament?.material || '—'}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium">{log.td_value}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{log.previous_value ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{log.confidence || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {parsed?.matchRule || parsed?.matchReason || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={log.status === 'applied' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}
                        className="text-[10px]"
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TdPopulationLog() {
  const [filters, setFilters] = useState<TdLogFilters>({
    status: 'all', source: 'all', confidence: 'all', dateRange: 'all',
  });
  const [page, setPage] = useState(0);
  const { data, isLoading } = useTdPopulationLogBatched(filters);
  const qc = useQueryClient();
  const [clearing, setClearing] = useState(false);

  const batches = data?.batches ?? [];
  const stats = data?.stats;
  const PAGE_SIZE = 20;
  const pagedBatches = batches.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = pagedBatches.length < batches.length;

  const handleClearLog = async () => {
    setClearing(true);
    try {
      const { error } = await (supabase.from('td_population_log') as any).delete().neq('id', '');
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['td-population-log'] });
      toast({ title: 'Population log cleared' });
    } catch (err: any) {
      toast({ title: 'Failed to clear log', description: err.message, variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Activity} label="Total Runs" value={stats.totalRuns} />
          <StatCard icon={CheckCircle2} label="TD Values Applied" value={stats.totalApplied} />
          <StatCard
            icon={Clock}
            label="Last Run"
            value={stats.lastRun ? formatDistanceToNow(new Date(stats.lastRun), { addSuffix: true }) : 'Never'}
          />
          <StatCard
            icon={TrendingUp}
            label="Most Active Brand"
            value={stats.topBrand?.name ?? '—'}
            sub={stats.topBrand ? `${stats.topBrand.count} values` : undefined}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filters.dateRange} onValueChange={(v) => { setFilters(f => ({ ...f, dateRange: v })); setPage(0); }}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.source} onValueChange={(v) => { setFilters(f => ({ ...f, source: v })); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="reference_match">Run Matching</SelectItem>
            <SelectItem value="csv_import">Bulk Import</SelectItem>
            <SelectItem value="3dfilamentprofiles_auto">Fetch External</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => { setFilters(f => ({ ...f, status: v })); setPage(0); }}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="dry-run">Dry Run</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.confidence} onValueChange={(v) => { setFilters(f => ({ ...f, confidence: v })); setPage(0); }}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Confidence</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear Log
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Population Log?</AlertDialogTitle>
                <AlertDialogDescription>
                  This deletes all log entries. Applied TD values on filaments will NOT be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearLog} disabled={clearing}>
                  {clearing ? 'Clearing...' : 'Clear All'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Batch List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading log entries...</div>
        ) : batches.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No log entries found</div>
        ) : (
          <>
            {pagedBatches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} />
            ))}
            {hasMore && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>
                  Load More ({batches.length - pagedBatches.length} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
