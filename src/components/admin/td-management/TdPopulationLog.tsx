import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTdPopulationLog, type TdLogFilters } from '@/hooks/useTdManagement';

export function TdPopulationLog() {
  const [filters, setFilters] = useState<TdLogFilters>({ status: 'all', source: 'all' });
  const { data: logs, isLoading } = useTdPopulationLog(filters);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="dry-run">Dry Run</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.source} onValueChange={(v) => setFilters((f) => ({ ...f, source: v }))}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="reference_table">Reference Table</SelectItem>
            <SelectItem value="page_scrape">Page Scrape</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="csv_import">CSV Import</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>TD Value</TableHead>
              <TableHead>Previous</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : (logs ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No log entries</TableCell></TableRow>
            ) : (logs ?? []).map((log: any) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs">{new Date(log.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-xs font-mono">{log.td_value}</TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{log.previous_value ?? '—'}</TableCell>
                <TableCell><Badge variant="secondary" className="text-xs">{log.source}</Badge></TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{log.confidence}</Badge></TableCell>
                <TableCell>
                  <Badge variant={log.status === 'applied' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{log.notes || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
