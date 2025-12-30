import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertCircle, CheckCircle2, XCircle, ExternalLink, 
  Sun, RefreshCw, Eye, EyeOff, Loader2 
} from 'lucide-react';
import { useTdReviewQueue, useTdReviewStats, useResolveReviewItem, type ReviewReason, type ReviewStatus } from '@/hooks/useTdReviewQueue';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const REASON_LABELS: Record<ReviewReason, { label: string; color: string; icon: React.ReactNode }> = {
  td_missing: { label: 'TD Missing', color: 'text-amber-600', icon: <Sun className="w-3 h-3" /> },
  low_confidence: { label: 'Low Confidence', color: 'text-orange-600', icon: <AlertCircle className="w-3 h-3" /> },
  parse_failed: { label: 'Parse Failed', color: 'text-destructive', icon: <XCircle className="w-3 h-3" /> },
  manual_flag: { label: 'Manual Flag', color: 'text-blue-600', icon: <Eye className="w-3 h-3" /> },
};

export function TdReviewPanel() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('pending');
  const [reasonFilter, setReasonFilter] = useState<ReviewReason | 'all'>('all');
  
  const { data: items = [], isLoading, refetch, isFetching } = useTdReviewQueue({
    status: statusFilter,
    reason: reasonFilter === 'all' ? undefined : reasonFilter,
  });
  const { data: stats } = useTdReviewStats();
  const resolveItem = useResolveReviewItem();

  const handleResolve = async (id: string, status: 'resolved' | 'ignored') => {
    try {
      await resolveItem.mutateAsync({ id, status });
      toast({ title: 'Updated', description: `Item marked as ${status}` });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-primary" />
            <CardTitle>TD Review Queue</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          {stats?.total || 0} items pending review • Filaments needing manual TD verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
            <p className="text-lg font-bold text-amber-600">{stats?.td_missing || 0}</p>
            <p className="text-xs text-muted-foreground">TD Missing</p>
          </div>
          <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
            <p className="text-lg font-bold text-orange-600">{stats?.low_confidence || 0}</p>
            <p className="text-xs text-muted-foreground">Low Confidence</p>
          </div>
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <p className="text-lg font-bold text-destructive">{stats?.parse_failed || 0}</p>
            <p className="text-xs text-muted-foreground">Parse Failed</p>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p className="text-lg font-bold text-blue-600">{stats?.manual_flag || 0}</p>
            <p className="text-xs text-muted-foreground">Manual Flags</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReviewStatus)}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="ignored">Ignored</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={reasonFilter} onValueChange={(v) => setReasonFilter(v as ReviewReason | 'all')}>
            <TabsList>
              <TabsTrigger value="all">All Reasons</TabsTrigger>
              <TabsTrigger value="td_missing">TD Missing</TabsTrigger>
              <TabsTrigger value="low_confidence">Low Conf</TabsTrigger>
              <TabsTrigger value="parse_failed">Failed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Items List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p>No items in queue matching filters</p>
              </div>
            ) : (
              items.map((item) => {
                const reasonInfo = REASON_LABELS[item.reason];
                return (
                  <div key={item.id} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-xs ${reasonInfo.color}`}>
                            {reasonInfo.icon}
                            <span className="ml-1">{reasonInfo.label}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="font-medium text-sm truncate">
                          {item.filament?.product_title || 'Unknown Filament'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.filament?.vendor} • {item.filament?.material}
                        </p>
                        {item.filament?.transmission_distance && (
                          <Badge variant="outline" className="mt-1 text-xs text-green-600">
                            <Sun className="w-3 h-3 mr-1" />
                            TD: {item.filament.transmission_distance}mm
                          </Badge>
                        )}
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {item.tds_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => window.open(item.tds_url!, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            TDS
                          </Button>
                        )}
                        {item.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleResolve(item.id, 'resolved')}
                              disabled={resolveItem.isPending}
                            >
                              {resolveItem.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                              )}
                              Resolve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground"
                              onClick={() => handleResolve(item.id, 'ignored')}
                              disabled={resolveItem.isPending}
                            >
                              <EyeOff className="w-3 h-3 mr-1" />
                              Ignore
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
