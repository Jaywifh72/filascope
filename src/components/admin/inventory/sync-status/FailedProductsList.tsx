import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePriceSync } from '@/hooks/usePriceSync';

interface FailedProduct {
  id: string;
  display_name: string | null;
  product_title: string;
  vendor: string | null;
  product_url: string | null;
  last_scraped_at: string | null;
  last_sync_error: string | null;
  sync_status: string | null;
}

interface GroupedFailedProducts {
  brand: string;
  products: FailedProduct[];
}

export function FailedProductsList() {
  const queryClient = useQueryClient();
  const { syncSingle, isItemSyncing } = usePriceSync();
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [retryingAll, setRetryingAll] = useState(false);

  const { data: failedProducts, isLoading, refetch } = useQuery({
    queryKey: ['failed-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('id, display_name, product_title, vendor, product_url, last_scraped_at, last_sync_error, sync_status')
        .eq('sync_status', 'failed')
        .order('vendor')
        .order('product_title');

      if (error) throw error;
      return data as FailedProduct[];
    },
    refetchInterval: 30000,
  });

  // Ignore mutation - sets sync_enabled to false
  const ignoreMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('filaments')
        .update({ sync_enabled: false, sync_status: 'ignored' })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['failed-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-filaments'] });
      toast.success('Product ignored from future syncs');
    },
    onError: (error: Error) => {
      toast.error('Failed to ignore product', { description: error.message });
    },
  });

  const handleRetryProduct = (productId: string) => {
    syncSingle(productId, 'filament');
  };

  const handleRetryAll = async () => {
    if (!failedProducts || failedProducts.length === 0) return;
    
    setRetryingAll(true);
    toast.info(`Retrying ${failedProducts.length} failed products...`);
    
    // Retry products in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < failedProducts.length; i += batchSize) {
      const batch = failedProducts.slice(i, i + batchSize);
      await Promise.all(batch.map((p) => 
        supabase.functions.invoke('sync-prices', {
          body: {
            syncType: 'single',
            productType: 'filament',
            targetId: p.id,
            triggeredBy: 'admin',
          },
        })
      ));
      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    
    setRetryingAll(false);
    refetch();
    queryClient.invalidateQueries({ queryKey: ['admin-filaments'] });
    toast.success('Retry completed for all failed products');
  };

  const handleIgnoreProduct = (productId: string) => {
    ignoreMutation.mutate(productId);
  };

  const toggleBrand = (brand: string) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) {
        next.delete(brand);
      } else {
        next.add(brand);
      }
      return next;
    });
  };

  // Group products by brand
  const groupedProducts: GroupedFailedProducts[] = failedProducts
    ? Object.entries(
        failedProducts.reduce((acc, product) => {
          const brand = product.vendor || 'Unknown';
          if (!acc[brand]) acc[brand] = [];
          acc[brand].push(product);
          return acc;
        }, {} as Record<string, FailedProduct[]>)
      )
        .map(([brand, products]) => ({ brand, products }))
        .sort((a, b) => a.brand.localeCompare(b.brand))
    : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Failed Products
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

  if (!failedProducts || failedProducts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            Failed Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No failed products! All syncs are healthy.</p>
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
            Failed Products
            <Badge variant="destructive" className="ml-2">
              {failedProducts.length}
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryAll}
            disabled={retryingAll}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', retryingAll && 'animate-spin')} />
            Retry All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {groupedProducts.map(({ brand, products }) => {
          const isExpanded = expandedBrands.has(brand);

          return (
            <Collapsible
              key={brand}
              open={isExpanded}
              onOpenChange={() => toggleBrand(brand)}
              className="border border-border rounded-lg"
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors text-left">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    <span className="font-medium">{brand}</span>
                    <Badge variant="secondary" className="text-xs">
                      {products.length} failed
                    </Badge>
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border">
                  {products.map((product) => {
                    const isSyncing = isItemSyncing(product.id);

                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border-b border-border last:border-b-0 hover:bg-muted/30"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {product.display_name || product.product_title}
                          </p>
                          <p className="text-sm text-destructive truncate">
                            {product.last_sync_error || 'Unknown error'}
                          </p>
                          {product.last_scraped_at && (
                            <p className="text-xs text-muted-foreground">
                              Last attempt: {formatDistanceToNow(new Date(product.last_scraped_at), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryProduct(product.id)}
                            disabled={isSyncing || ignoreMutation.isPending}
                          >
                            <RefreshCw className={cn('w-4 h-4 mr-1', isSyncing && 'animate-spin')} />
                            Retry
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleIgnoreProduct(product.id)}
                            disabled={isSyncing || ignoreMutation.isPending}
                            title="Ignore from future syncs"
                          >
                            <EyeOff className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
