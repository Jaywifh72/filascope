import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { REGIONS } from '@/config/regions';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { getBrandLogo } from '@/lib/brandLogos';
import { RegionCode } from '@/types/regional';
import { usePriceSync } from '@/hooks/usePriceSync';

interface BrandRegionCoverage {
  brand_slug: string;
  display_name: string;
  logo_url: string | null;
  region_code: string;
  total_products: number;
  with_urls: number;
  with_prices: number;
  last_sync_at: string | null;
  success_rate: number;
}

interface BrandRegionMatrixProps {
  onBrandClick?: (brandSlug: string) => void;
}

export function BrandRegionMatrix({ onBrandClick }: BrandRegionMatrixProps) {
  const { syncBrand, isSyncing } = usePriceSync();
  const [selectedCell, setSelectedCell] = useState<{ brand: string; region: string } | null>(null);

  const { data: coverage, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['brand-region-coverage'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_brand_region_coverage' as never);
      if (error) throw error;
      return (data as unknown as BrandRegionCoverage[]) || [];
    },
    refetchInterval: 60000,
  });

  // Group by brand
  const brandData = coverage?.reduce((acc, row) => {
    if (!acc[row.brand_slug]) {
      acc[row.brand_slug] = {
        display_name: row.display_name,
        logo_url: row.logo_url,
        regions: {},
      };
    }
    acc[row.brand_slug].regions[row.region_code] = row;
    return acc;
  }, {} as Record<string, { display_name: string; logo_url: string | null; regions: Record<string, BrandRegionCoverage> }>);

  // Get all unique regions
  const allRegions = [...new Set(coverage?.map((c) => c.region_code) || [])].sort();

  const getCellStatus = (data: BrandRegionCoverage | undefined) => {
    if (!data || data.total_products === 0) {
      return { icon: null, color: 'text-muted-foreground', bg: 'bg-muted/50' };
    }
    
    const coverageRate = data.total_products > 0 
      ? (data.with_urls / data.total_products) * 100 
      : 0;
    
    if (coverageRate >= 90) {
      return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' };
    }
    if (coverageRate >= 50) {
      return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    }
    return { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' };
  };

  const handleCellClick = (brandSlug: string, regionCode: string, data: BrandRegionCoverage | undefined) => {
    if (data && data.with_urls > 0) {
      setSelectedCell({ brand: brandSlug, region: regionCode });
    }
  };

  const handleSyncBrandRegion = (brandSlug: string, regionCode: string) => {
    syncBrand(brandSlug, 'filament', { regions: [regionCode as RegionCode] });
    setSelectedCell(null);
  };

  const selectedData = selectedCell 
    ? brandData?.[selectedCell.brand]?.regions[selectedCell.region] 
    : null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Brand × Region Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!coverage || coverage.length === 0 || allRegions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Brand × Region Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            No regional coverage data available. Add regional URLs to start tracking.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Brand × Region Coverage</CardTitle>
              <CardDescription>Click any cell to view details or sync</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('w-4 h-4 mr-2', isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">Brand</th>
                  {allRegions.map((region) => {
                    const regionInfo = REGIONS[region as RegionCode];
                    return (
                      <th key={region} className="text-center py-2 px-2 font-medium min-w-[80px]">
                        <div className="flex flex-col items-center">
                          <span className="text-lg">{regionInfo?.flag || '🌐'}</span>
                          <span className="text-xs text-muted-foreground">{region}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Object.entries(brandData || {}).map(([brandSlug, brand]) => (
                  <tr key={brandSlug} className="border-b hover:bg-muted/30">
                    <td className="py-2 pr-4">
                      <button
                        className="flex items-center gap-2 hover:underline text-left"
                        onClick={() => onBrandClick?.(brandSlug)}
                      >
                        <BrandLogo src={brand.logo_url || getBrandLogo(brand.display_name)} brandName={brand.display_name} size="sm" />
                        <span className="font-medium truncate max-w-[120px]">
                          {brand.display_name}
                        </span>
                      </button>
                    </td>
                    {allRegions.map((region) => {
                      const data = brand.regions[region];
                      const status = getCellStatus(data);
                      const StatusIcon = status.icon;

                      return (
                        <td key={region} className="text-center py-1.5 px-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className={cn(
                                  'w-full py-1.5 px-2 rounded transition-all',
                                  status.bg,
                                  data?.with_urls ? 'hover:ring-2 ring-primary/50 cursor-pointer' : 'cursor-default'
                                )}
                                onClick={() => handleCellClick(brandSlug, region, data)}
                                disabled={!data?.with_urls}
                              >
                                <div className="flex flex-col items-center gap-0.5">
                                  {StatusIcon && (
                                    <StatusIcon className={cn('w-3.5 h-3.5', status.color)} />
                                  )}
                                  <span className={cn('text-xs font-mono', status.color)}>
                                    {data ? `${data.with_urls}/${data.total_products}` : '—'}
                                  </span>
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {data ? (
                                <div className="text-xs space-y-1">
                                  <p className="font-medium">{brand.display_name} - {region}</p>
                                  <p>URLs: {data.with_urls}/{data.total_products}</p>
                                  <p>With prices: {data.with_prices}</p>
                                  {data.last_sync_at && (
                                    <p>Last sync: {formatDistanceToNow(new Date(data.last_sync_at), { addSuffix: true })}</p>
                                  )}
                                </div>
                              ) : (
                                <p>No products for this brand</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>≥90% coverage</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>50-90%</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-destructive" />
              <span>&lt;50%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">
                {REGIONS[selectedCell?.region as RegionCode]?.flag}
              </span>
              {selectedData?.display_name} - {selectedCell?.region}
            </DialogTitle>
            <DialogDescription>
              Regional sync details and actions
            </DialogDescription>
          </DialogHeader>
          
          {selectedData && (
            <div className="space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{selectedData.total_products}</p>
                  <p className="text-xs text-muted-foreground">Total Products</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <p className="text-2xl font-bold text-blue-500">{selectedData.with_urls}</p>
                  <p className="text-xs text-muted-foreground">With URLs</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-500">{selectedData.with_prices}</p>
                  <p className="text-xs text-muted-foreground">With Prices</p>
                </div>
              </div>

              {/* Success rate */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm">Sync Success Rate</span>
                <Badge variant={selectedData.success_rate >= 80 ? 'default' : 'secondary'}>
                  {selectedData.success_rate}%
                </Badge>
              </div>

              {/* Last sync */}
              {selectedData.last_sync_at && (
                <p className="text-sm text-muted-foreground text-center">
                  Last synced {formatDistanceToNow(new Date(selectedData.last_sync_at), { addSuffix: true })}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedCell(null)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleSyncBrandRegion(selectedCell!.brand, selectedCell!.region)}
                  disabled={isSyncing}
                >
                  <RefreshCw className={cn('w-4 h-4 mr-2', isSyncing && 'animate-spin')} />
                  Sync {selectedCell?.region}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
