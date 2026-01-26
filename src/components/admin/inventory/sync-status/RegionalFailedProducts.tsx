import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { REGIONS } from '@/config/regions';
import { RegionCode } from '@/types/regional';
import { useRegionalPriceSync } from '@/hooks/useRegionalPriceSync';

interface FailedRegionalSync {
  region_code: string;
  product_id: string;
  product_type: string;
  product_name: string;
  brand_slug: string;
  store_url: string | null;
  last_sync_error: string | null;
  last_sync_at: string | null;
}

interface GroupedByRegion {
  region_code: string;
  products: FailedRegionalSync[];
}

export function RegionalFailedProducts() {
  const queryClient = useQueryClient();
  const { syncRegion, isSyncing } = useRegionalPriceSync();
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});
  const [retryingRegion, setRetryingRegion] = useState<string | null>(null);

  const { data: failedSyncs, isLoading, refetch } = useQuery({
    queryKey: ['regional-failed-syncs'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_regional_failed_syncs' as never);
      if (error) throw error;
      return (data as unknown as FailedRegionalSync[]) || [];
    },
    refetchInterval: 30000,
  });

  // Group by region
  const groupedByRegion: GroupedByRegion[] = failedSyncs
    ? Object.entries(
        failedSyncs.reduce((acc, sync) => {
          if (!acc[sync.region_code]) acc[sync.region_code] = [];
          acc[sync.region_code].push(sync);
          return acc;
        }, {} as Record<string, FailedRegionalSync[]>)
      )
        .map(([region_code, products]) => ({ region_code, products }))
        .sort((a, b) => a.region_code.localeCompare(b.region_code))
    : [];

  const toggleRegion = (region: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) {
        next.delete(region);
      } else {
        next.add(region);
      }
      return next;
    });
  };

  const handleRetryProduct = (product: FailedRegionalSync) => {
    if (!product.store_url) {
      toast.error('No URL configured for this product');
      return;
    }
    syncRegion({
      productId: product.product_id,
      productType: product.product_type as 'filament' | 'printer',
      regionCode: product.region_code as RegionCode,
      storeUrl: product.store_url,
    });
  };

  const handleRetryAllRegion = async (regionCode: string, products: FailedRegionalSync[]) => {
    setRetryingRegion(regionCode);
    const productsWithUrls = products.filter((p) => p.store_url);
    
    toast.info(`Retrying ${productsWithUrls.length} failed syncs for ${regionCode}...`);

    // Retry in batches
    const batchSize = 5;
    for (let i = 0; i < productsWithUrls.length; i += batchSize) {
      const batch = productsWithUrls.slice(i, i + batchSize);
      await Promise.all(
        batch.map((product) =>
          supabase.functions.invoke('sync-prices', {
            body: {
              syncType: 'single',
              productType: product.product_type,
              targetId: product.product_id,
              regionCodes: [product.region_code],
              triggeredBy: 'admin',
            },
          })
        )
      );
      // Small delay between batches
      if (i + batchSize < productsWithUrls.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setRetryingRegion(null);
    refetch();
    queryClient.invalidateQueries({ queryKey: ['regional-sync-health'] });
    toast.success(`Completed retry for ${regionCode}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Failed Syncs by Region
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!failedSyncs || failedSyncs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            Failed Syncs by Region
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No failed regional syncs! All regions are healthy.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Failed Syncs by Region
            <Badge variant="destructive" className="ml-2">
              {failedSyncs.length} total
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {groupedByRegion.map(({ region_code, products }) => {
          const isExpanded = expandedRegions.has(region_code);
          const regionInfo = REGIONS[region_code as RegionCode];
          const displayLimit = 5;
          const showingAll = showAll[region_code];
          const visibleProducts = showingAll ? products : products.slice(0, displayLimit);

          return (
            <Collapsible
              key={region_code}
              open={isExpanded}
              onOpenChange={() => toggleRegion(region_code)}
              className="border border-destructive/30 rounded-lg bg-destructive/5"
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full p-3 hover:bg-destructive/10 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    <span className="text-lg">{regionInfo?.flag || '🌐'}</span>
                    <span className="font-medium">{region_code}</span>
                    <Badge variant="destructive" className="text-xs">
                      {products.length} failed
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRetryAllRegion(region_code, products);
                    }}
                    disabled={retryingRegion === region_code}
                  >
                    <RefreshCw className={cn('w-4 h-4 mr-1', retryingRegion === region_code && 'animate-spin')} />
                    Retry All {region_code}
                  </Button>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-destructive/20">
                  {visibleProducts.map((product) => {
                    const syncing = isSyncing(product.product_id, product.region_code);

                    return (
                      <div
                        key={`${product.product_id}-${product.region_code}`}
                        className="flex items-center justify-between p-3 border-b border-destructive/10 last:border-b-0 hover:bg-destructive/5"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {product.product_name}
                            </p>
                            {product.store_url && (
                              <a
                                href={product.store_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-destructive truncate">
                            {product.last_sync_error || 'Unknown error'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{product.brand_slug}</span>
                            {product.last_sync_at && (
                              <>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(product.last_sync_at), { addSuffix: true })}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetryProduct(product)}
                          disabled={syncing || !product.store_url}
                        >
                          <RefreshCw className={cn('w-4 h-4 mr-1', syncing && 'animate-spin')} />
                          Retry
                        </Button>
                      </div>
                    );
                  })}
                  
                  {/* Show more/less */}
                  {products.length > displayLimit && (
                    <button
                      className="w-full p-2 text-sm text-center text-muted-foreground hover:text-foreground hover:bg-destructive/5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAll((prev) => ({ ...prev, [region_code]: !prev[region_code] }));
                      }}
                    >
                      {showingAll
                        ? 'Show less'
                        : `Show ${products.length - displayLimit} more...`}
                    </button>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
