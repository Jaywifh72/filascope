import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronDown, ChevronUp, History, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function formatDuration(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function AmazonSyncHistoryTable() {
  const [expanded, setExpanded] = useState(true);

  const { data: runs, isLoading } = useQuery({
    queryKey: ['amazon-sync-history'],
    queryFn: async () => {
      const { data } = await supabase
        .from('amazon_sync_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return data ?? [];
    },
    refetchInterval: 30000, // refresh every 30s
  });

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'partial': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'failed': return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'running': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading || !runs || runs.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          className="flex items-center justify-between mb-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Sync History</h3>
            <Badge variant="outline" className="text-[10px]">{runs.length} runs</Badge>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>

        {expanded && (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">When</TableHead>
                  <TableHead className="w-[100px]">Brand</TableHead>
                  <TableHead className="w-[80px]">Marketplace</TableHead>
                  <TableHead className="text-right w-[60px]">Total</TableHead>
                  <TableHead className="text-right w-[70px]">Updated</TableHead>
                  <TableHead className="text-right w-[60px]">Errors</TableHead>
                  <TableHead className="text-right w-[70px]">API Calls</TableHead>
                  <TableHead className="w-[80px]">Duration</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TooltipProvider>
                  {runs.map((run: any) => (
                    <TableRow key={run.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {timeAgo(run.created_at)}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {run.brand_slug?.replace(/-/g, ' ') || 'All'}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {run.marketplace || 'All'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {run.total_items ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        {run.prices_updated ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {run.errors != null && run.errors > 0 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-red-400 cursor-help flex items-center justify-end gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {run.errors}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <div className="text-xs space-y-1">
                                {(run.error_log || []).slice(0, 5).map((err: string, i: number) => (
                                  <p key={i} className="truncate">{err}</p>
                                ))}
                                {(run.error_log?.length ?? 0) > 5 && (
                                  <p className="text-muted-foreground">
                                    +{run.error_log.length - 5} more...
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          run.errors ?? '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {run.api_calls_used ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDuration(run.duration_ms)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] capitalize ${statusColor(run.status)}`}>
                          {run.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TooltipProvider>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
