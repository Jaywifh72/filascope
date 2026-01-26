import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface SyncLog {
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
  price_changes: number | null;
  triggered_by: string | null;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'running':
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    default:
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge variant="outline" className="border-green-500 text-green-500">Completed</Badge>;
    case 'failed':
      return <Badge variant="outline" className="border-red-500 text-red-500">Failed</Badge>;
    case 'running':
      return <Badge variant="outline" className="border-blue-500 text-blue-500">Running</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function SyncStatusTab() {
  const { data: syncLogs, isLoading } = useQuery({
    queryKey: ['brand-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_sync_logs')
        .select('id, brand_slug, sync_type, status, started_at, completed_at, duration_seconds, products_discovered, products_updated, products_failed, price_changes, triggered_by')
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as SyncLog[];
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-cyan-500" />
            Sync History & Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!syncLogs || syncLogs.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-cyan-500" />
            Sync History & Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No sync history yet</p>
            <p className="text-sm">
              Run a sync operation to see history here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-cyan-500" />
          Sync History & Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {syncLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(log.status)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.brand_slug}</span>
                    <Badge variant="secondary" className="text-xs">
                      {log.sync_type}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}
                    {log.duration_seconds && (
                      <span className="ml-2">
                        ({log.duration_seconds.toFixed(1)}s)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  {log.products_updated !== null && (
                    <div className="text-green-600">
                      {log.products_updated} updated
                    </div>
                  )}
                  {log.products_failed !== null && log.products_failed > 0 && (
                    <div className="text-red-500">
                      {log.products_failed} failed
                    </div>
                  )}
                  {log.price_changes !== null && log.price_changes > 0 && (
                    <div className="text-blue-500">
                      {log.price_changes} price changes
                    </div>
                  )}
                </div>
                {getStatusBadge(log.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
