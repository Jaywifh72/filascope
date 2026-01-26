import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Json } from '@/integrations/supabase/types';

interface SyncRun {
  id: string;
  brand_slug: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  products_discovered: number | null;
  products_updated: number | null;
  products_failed: number | null;
  products_created: number | null;
  price_changes: number | null;
  triggered_by: string | null;
  error_details: Json | null;
}

interface RecentSyncRunsProps {
  brandFilter?: string;
  onClearBrandFilter?: () => void;
}

const PAGE_SIZE = 10;

export function RecentSyncRuns({ brandFilter, onClearBrandFilter }: RecentSyncRunsProps) {
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['sync-runs', page, typeFilter, statusFilter, brandFilter],
    queryFn: async () => {
      let query = supabase
        .from('brand_sync_logs')
        .select('*', { count: 'exact' })
        .order('started_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (brandFilter) {
        query = query.eq('brand_slug', brandFilter);
      }
      if (typeFilter !== 'all') {
        query = query.eq('sync_type', typeFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { runs: data as SyncRun[], total: count || 0 };
    },
    refetchInterval: 30000,
  });

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null) return '—';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      completed: { variant: 'outline', className: 'border-green-500 text-green-500' },
      failed: { variant: 'outline', className: 'border-destructive text-destructive' },
      running: { variant: 'outline', className: 'border-blue-500 text-blue-500' },
      partial: { variant: 'outline', className: 'border-amber-500 text-amber-500' },
    };
    const config = variants[status] || { variant: 'secondary' as const, className: '' };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Sync Runs</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          
          {brandFilter && (
            <Badge variant="secondary" className="gap-1">
              Brand: {brandFilter}
              <button 
                onClick={onClearBrandFilter}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="prices">Prices</SelectItem>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !data?.runs || data.runs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sync runs found matching your filters
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead className="text-center">✓</TableHead>
                    <TableHead className="text-center">✗</TableHead>
                    <TableHead className="text-center">Δ</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.runs.map((run) => {
                    const isExpanded = expandedRows.has(run.id);
                    const hasErrors = run.error_details && Object.keys(run.error_details).length > 0;

                    return (
                      <Collapsible key={run.id} open={isExpanded} asChild>
                        <>
                          <CollapsibleTrigger asChild>
                            <TableRow 
                              className={cn(
                                'cursor-pointer hover:bg-muted/50',
                                hasErrors && 'bg-destructive/5'
                              )}
                              onClick={() => toggleRow(run.id)}
                            >
                              <TableCell className="w-8 p-2">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                <span title={format(new Date(run.started_at), 'PPpp')}>
                                  {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {run.sync_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {run.brand_slug}
                              </TableCell>
                              <TableCell className="text-center text-green-500 font-mono">
                                {run.products_updated || 0}
                              </TableCell>
                              <TableCell className="text-center text-destructive font-mono">
                                {run.products_failed || 0}
                              </TableCell>
                              <TableCell className="text-center text-blue-500 font-mono">
                                {run.price_changes || 0}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {formatDuration(run.duration_seconds)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(run.status)}
                              </TableCell>
                            </TableRow>
                          </CollapsibleTrigger>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={9} className="p-4">
                                <div className="space-y-2 text-sm">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                      <span className="text-muted-foreground">Started:</span>
                                      <p className="font-medium">{format(new Date(run.started_at), 'PPpp')}</p>
                                    </div>
                                    {run.completed_at && (
                                      <div>
                                        <span className="text-muted-foreground">Completed:</span>
                                        <p className="font-medium">{format(new Date(run.completed_at), 'PPpp')}</p>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-muted-foreground">Discovered:</span>
                                      <p className="font-medium">{run.products_discovered || 0} products</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Triggered By:</span>
                                      <p className="font-medium">{run.triggered_by || 'Unknown'}</p>
                                    </div>
                                  </div>
                                  {hasErrors && (
                                    <div className="mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                                      <p className="font-medium text-destructive mb-1">Error Details:</p>
                                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(run.error_details, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                  Showing {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, data.total)} of {data.total}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
