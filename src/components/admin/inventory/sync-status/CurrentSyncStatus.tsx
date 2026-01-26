import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Clock, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface RunningSyncLog {
  id: string;
  brand_slug: string;
  sync_type: string;
  status: string;
  started_at: string;
  products_discovered: number | null;
  products_updated: number | null;
  products_failed: number | null;
}

export function CurrentSyncStatus() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { data: runningSyncs, isLoading } = useQuery({
    queryKey: ['running-syncs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_sync_logs')
        .select('id, brand_slug, sync_type, status, started_at, products_discovered, products_updated, products_failed')
        .eq('status', 'running')
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as RunningSyncLog[];
    },
    refetchInterval: 2000, // Poll every 2 seconds while syncs might be running
  });

  // Update elapsed time counter
  useEffect(() => {
    if (!runningSyncs || runningSyncs.length === 0) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const oldestSync = runningSyncs[runningSyncs.length - 1];
      const startedAt = new Date(oldestSync.started_at);
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [runningSyncs]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Current Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-8 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!runningSyncs || runningSyncs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Current Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Clock className="w-5 h-5" />
            <span>No active syncs</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary animate-spin" />
          Current Sync Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {runningSyncs.map((sync) => {
          const totalProcessed = (sync.products_updated || 0) + (sync.products_failed || 0);
          const total = sync.products_discovered || 0;
          const progress = total > 0 ? (totalProcessed / total) * 100 : 0;

          return (
            <div key={sync.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{sync.brand_slug}</span>
                  <Badge variant="secondary" className="text-xs">
                    {sync.sync_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Started {formatDistanceToNow(new Date(sync.started_at), { addSuffix: true })}</span>
                  <Badge variant="outline" className="font-mono">
                    {formatDuration(elapsedSeconds)}
                  </Badge>
                </div>
              </div>

              {total > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {totalProcessed} of {total} products processed
                    </span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <div className="flex gap-4 text-sm">
                {sync.products_updated !== null && sync.products_updated > 0 && (
                  <span className="text-green-500">✓ {sync.products_updated} updated</span>
                )}
                {sync.products_failed !== null && sync.products_failed > 0 && (
                  <span className="text-destructive">✗ {sync.products_failed} failed</span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
