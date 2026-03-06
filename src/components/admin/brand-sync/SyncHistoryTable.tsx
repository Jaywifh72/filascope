import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  brandId: string;
  activeJobId: string | null;
  onJobClick: (jobId: string) => void;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed': return <Badge className="bg-green-500/10 text-green-500 text-xs">Completed</Badge>;
    case 'syncing': return <Badge className="bg-blue-500/10 text-blue-500 text-xs">Syncing</Badge>;
    case 'pending': return <Badge variant="secondary" className="text-xs">Pending</Badge>;
    case 'failed': return <Badge variant="destructive" className="text-xs">Failed</Badge>;
    default: return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  }
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return '—';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function SyncHistoryTable({ brandId, activeJobId, onJobClick }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: jobs } = useQuery({
    queryKey: ['sync-history', brandId],
    queryFn: async () => {
      const { data } = await supabase
        .from('brand_sync_jobs')
        .select('id, status, new_count, changed_count, matched_count, imported_count, error_count, started_at, completed_at, created_at')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!brandId,
  });

  if (!jobs || jobs.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Sync History</CardTitle>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">New</TableHead>
                  <TableHead className="text-right">Changed</TableHead>
                  <TableHead className="text-right">Matched</TableHead>
                  <TableHead className="text-right">Imported</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map(job => (
                  <TableRow
                    key={job.id}
                    className={cn(
                      'cursor-pointer hover:bg-muted/50',
                      activeJobId === job.id && 'bg-primary/5'
                    )}
                    onClick={() => onJobClick(job.id)}
                  >
                    <TableCell className="text-sm">
                      {job.created_at ? new Date(job.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      }) : '—'}
                    </TableCell>
                    <TableCell><StatusBadge status={job.status} /></TableCell>
                    <TableCell className="text-right tabular-nums">{job.new_count ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{job.changed_count ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{job.matched_count ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{job.imported_count ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{job.error_count ?? 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDuration(job.started_at, job.completed_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
