import { useQuery } from '@tanstack/react-query';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface BrandHealth {
  brand_slug: string;
  display_name: string;
  logo_url: string | null;
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  success_rate: number;
  last_successful_sync: string | null;
  extraction_success_rate: number | null;
}

interface BrandHealthGridProps {
  onBrandClick?: (brandSlug: string) => void;
}

export function BrandHealthGrid({ onBrandClick }: BrandHealthGridProps) {
  const { data: brandHealth, isLoading } = useQuery({
    queryKey: ['brand-health'],
    queryFn: async () => {
      // Get brands with their extraction success rates
      const { data: brands, error: brandsError } = await supabase
        .from('automated_brands')
        .select('brand_slug, display_name, logo_url, extraction_success_rate')
        .eq('scraping_enabled', true)
        .order('display_name');

      if (brandsError) throw brandsError;

      // Get recent sync stats for each brand (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: syncLogs, error: logsError } = await supabase
        .from('brand_sync_logs')
        .select('brand_slug, status, completed_at')
        .gte('started_at', thirtyDaysAgo);

      if (logsError) throw logsError;

      // Aggregate stats per brand
      const healthMap = new Map<string, BrandHealth>();

      brands?.forEach((brand) => {
        healthMap.set(brand.brand_slug, {
          brand_slug: brand.brand_slug,
          display_name: brand.display_name,
          logo_url: brand.logo_url,
          total_syncs: 0,
          successful_syncs: 0,
          failed_syncs: 0,
          success_rate: brand.extraction_success_rate || 0,
          last_successful_sync: null,
          extraction_success_rate: brand.extraction_success_rate,
        });
      });

      syncLogs?.forEach((log) => {
        const health = healthMap.get(log.brand_slug);
        if (health) {
          health.total_syncs++;
          if (log.status === 'completed') {
            health.successful_syncs++;
            if (!health.last_successful_sync || 
                (log.completed_at && log.completed_at > health.last_successful_sync)) {
              health.last_successful_sync = log.completed_at;
            }
          } else if (log.status === 'failed') {
            health.failed_syncs++;
          }
        }
      });

      // Calculate success rates
      healthMap.forEach((health) => {
        if (health.total_syncs > 0) {
          health.success_rate = (health.successful_syncs / health.total_syncs) * 100;
        } else if (health.extraction_success_rate !== null) {
          health.success_rate = health.extraction_success_rate;
        }
      });

      return Array.from(healthMap.values()).sort((a, b) => 
        a.display_name.localeCompare(b.display_name)
      );
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getHealthIndicator = (rate: number) => {
    if (rate >= 90) {
      return { 
        icon: CheckCircle, 
        color: 'text-green-500', 
        bgColor: 'bg-green-500/10 border-green-500/30',
        label: 'Healthy' 
      };
    }
    if (rate >= 70) {
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Brand Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!brandHealth || brandHealth.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Brand Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No brands configured for syncing
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Brand Health Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {brandHealth.map((brand) => {
            const health = getHealthIndicator(brand.success_rate);
            const HealthIcon = health.icon;

            return (
              <Button
                key={brand.brand_slug}
                variant="outline"
                className={cn(
                  'h-auto p-3 flex flex-col items-center gap-2 transition-all',
                  health.bgColor,
                  'hover:scale-105'
                )}
                onClick={() => onBrandClick?.(brand.brand_slug)}
              >
                <div className="flex items-center gap-2">
                  {brand.logo_url ? (
                    <img 
                      src={brand.logo_url} 
                      alt={brand.display_name}
                      className="w-5 h-5 object-contain"
                    />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium truncate max-w-[80px]">
                    {brand.display_name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <HealthIcon className={cn('w-4 h-4', health.color)} />
                  <span className={cn('text-lg font-bold', health.color)}>
                    {Math.round(brand.success_rate)}%
                  </span>
                </div>
                {brand.last_successful_sync && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(brand.last_successful_sync), { addSuffix: true })}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
