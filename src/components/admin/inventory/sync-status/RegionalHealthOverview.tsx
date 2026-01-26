import { useQuery } from '@tanstack/react-query';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { REGIONS } from '@/config/regions';
import { RegionCode } from '@/types/regional';
import { usePriceSync } from '@/hooks/usePriceSync';

interface RegionalHealth {
  region_code: string;
  total_urls: number;
  synced_successfully: number;
  failed: number;
  never_synced: number;
  last_sync_at: string | null;
  success_rate: number;
}

export function RegionalHealthOverview() {
  const { syncAll, isSyncing } = usePriceSync();

  const { data: regionalHealth, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['regional-sync-health'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_regional_sync_health' as never);
      if (error) throw error;
      return (data as unknown as RegionalHealth[]) || [];
    },
    refetchInterval: 30000,
  });

  const getHealthStatus = (rate: number) => {
    if (rate >= 90) {
      return { 
        icon: CheckCircle, 
        color: 'text-green-500', 
        bgColor: 'bg-green-500/10 border-green-500/30',
        label: 'Healthy' 
      };
    }
    if (rate >= 50) {
      return { 
        icon: AlertTriangle, 
        color: 'text-amber-500', 
        bgColor: 'bg-amber-500/10 border-amber-500/30',
        label: 'Warning' 
      };
    }
    return { 
      icon: XCircle, 
      color: 'text-destructive', 
      bgColor: 'bg-destructive/10 border-destructive/30',
      label: 'Critical' 
    };
  };

  const handleSyncRegion = (regionCode: string) => {
    syncAll('filament', { regions: [regionCode as RegionCode] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Regional Sync Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!regionalHealth || regionalHealth.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Regional Sync Health</CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('w-4 h-4 mr-2', isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            No regional price data yet. Add regional URLs to products to begin tracking.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Regional Sync Health</CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          {regionalHealth.map((region) => {
            const regionInfo = REGIONS[region.region_code as RegionCode];
            const status = getHealthStatus(region.success_rate);
            const StatusIcon = status.icon;

            return (
              <div
                key={region.region_code}
                className={cn(
                  'flex flex-col items-center p-4 rounded-lg border transition-all',
                  status.bgColor
                )}
              >
                {/* Region flag and code */}
                <div className="text-2xl mb-1">{regionInfo?.flag || '🌐'}</div>
                <span className="font-semibold text-sm">{region.region_code}</span>

                {/* Success rate with icon */}
                <div className="flex items-center gap-1 mt-2">
                  <StatusIcon className={cn('w-4 h-4', status.color)} />
                  <span className={cn('text-xl font-bold', status.color)}>
                    {Math.round(region.success_rate)}%
                  </span>
                </div>

                {/* Stats breakdown */}
                <div className="text-xs text-muted-foreground mt-1 text-center">
                  <div>
                    <span className="text-green-500">{region.synced_successfully}</span> /
                    <span className="text-destructive ml-1">{region.failed}</span> /
                    <span className="text-amber-500 ml-1">{region.never_synced}</span>
                  </div>
                  <div className="text-[10px] mt-0.5">✓ / ✗ / ○</div>
                </div>

                {/* Last sync time */}
                {region.last_sync_at && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDistanceToNow(new Date(region.last_sync_at), { addSuffix: true })}
                  </div>
                )}

                {/* Sync button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  onClick={() => handleSyncRegion(region.region_code)}
                  disabled={isSyncing}
                >
                  <RefreshCw className={cn('w-3 h-3 mr-1', isSyncing && 'animate-spin')} />
                  Sync All
                </Button>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>≥90% Healthy</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>50-90% Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-destructive" />
            <span>&lt;50% Critical</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
