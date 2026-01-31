import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { REGIONS, REGION_LIST } from '@/config/regions';
import { RegionCode } from '@/types/regional';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandStoreData {
  id: string;
  brand_name: string;
  brand_slug: string;
  is_visible: boolean;
}

interface StoreData {
  brand_id: string;
  region_code: string;
  store_name: string;
  base_url: string;
  ships_from_country: string | null;
  is_active: boolean;
}

interface BrandRegionMatrix {
  brandId: string;
  brandName: string;
  brandSlug: string;
  isVisible: boolean;
  regions: Record<RegionCode, {
    hasStore: boolean;
    storeName: string | null;
    storeUrl: string | null;
    shipsFrom: string | null;
  }>;
  storeCount: number;
}

export function StoreRegionAuditTable() {
  // Fetch all brands
  const { data: brands = [], isLoading: loadingBrands } = useQuery({
    queryKey: ['audit-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automated_brands')
        .select('id, brand_name, brand_slug, is_visible')
        .order('brand_name');
      
      if (error) throw error;
      return data as BrandStoreData[];
    },
  });

  // Fetch all regional stores
  const { data: stores = [], isLoading: loadingStores } = useQuery({
    queryKey: ['audit-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_regional_stores')
        .select('brand_id, region_code, store_name, base_url, ships_from_country, is_active')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as StoreData[];
    },
  });

  // Build the matrix
  const matrix = useMemo((): BrandRegionMatrix[] => {
    const storesByBrand = stores.reduce((acc, store) => {
      if (!acc[store.brand_id]) acc[store.brand_id] = [];
      acc[store.brand_id].push(store);
      return acc;
    }, {} as Record<string, StoreData[]>);

    return brands.map(brand => {
      const brandStores = storesByBrand[brand.id] || [];
      const regions: Record<RegionCode, { hasStore: boolean; storeName: string | null; storeUrl: string | null; shipsFrom: string | null }> = {
        US: { hasStore: false, storeName: null, storeUrl: null, shipsFrom: null },
        CA: { hasStore: false, storeName: null, storeUrl: null, shipsFrom: null },
        EU: { hasStore: false, storeName: null, storeUrl: null, shipsFrom: null },
        UK: { hasStore: false, storeName: null, storeUrl: null, shipsFrom: null },
        AU: { hasStore: false, storeName: null, storeUrl: null, shipsFrom: null },
        JP: { hasStore: false, storeName: null, storeUrl: null, shipsFrom: null },
        CN: { hasStore: false, storeName: null, storeUrl: null, shipsFrom: null },
      };

      brandStores.forEach(store => {
        const regionCode = store.region_code as RegionCode;
        if (regions[regionCode]) {
          regions[regionCode] = {
            hasStore: true,
            storeName: store.store_name,
            storeUrl: store.base_url,
            shipsFrom: store.ships_from_country,
          };
        }
      });

      return {
        brandId: brand.id,
        brandName: brand.brand_name,
        brandSlug: brand.brand_slug,
        isVisible: brand.is_visible ?? true,
        regions,
        storeCount: brandStores.length,
      };
    });
  }, [brands, stores]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalBrands = matrix.length;
    const brandsWithStores = matrix.filter(b => b.storeCount > 0).length;
    const regionCoverage = REGION_LIST.map(region => ({
      code: region.code,
      name: region.name,
      flag: region.flag,
      count: matrix.filter(b => b.regions[region.code].hasStore).length,
      percentage: Math.round((matrix.filter(b => b.regions[region.code].hasStore).length / totalBrands) * 100),
    }));

    return { totalBrands, brandsWithStores, regionCoverage };
  }, [matrix]);

  if (loadingBrands || loadingStores) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="p-4 col-span-2 md:col-span-1">
          <div className="text-2xl font-bold">{stats.totalBrands}</div>
          <div className="text-xs text-muted-foreground">Total Brands</div>
        </Card>
        {stats.regionCoverage.map(region => (
          <Card 
            key={region.code} 
            className={cn(
              "p-4 text-center",
              region.percentage > 50 && "border-green-500/30",
              region.percentage > 20 && region.percentage <= 50 && "border-amber-500/30",
              region.percentage <= 20 && "border-red-500/30"
            )}
          >
            <div className="text-lg">{region.flag}</div>
            <div className="text-xl font-bold">{region.count}</div>
            <div className="text-xs text-muted-foreground">{region.percentage}%</div>
          </Card>
        ))}
      </div>

      {/* Matrix Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10">Brand</TableHead>
                {REGION_LIST.map(region => (
                  <TableHead key={region.code} className="text-center min-w-[80px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg">{region.flag}</span>
                      <span className="text-xs">{region.code}</span>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrix.map(brand => (
                <TableRow key={brand.brandId} className={cn(!brand.isVisible && "opacity-50")}>
                  <TableCell className="sticky left-0 bg-card font-medium">
                    <div className="flex items-center gap-2">
                      {brand.brandName}
                      {!brand.isVisible && (
                        <Badge variant="outline" className="text-xs">Hidden</Badge>
                      )}
                    </div>
                  </TableCell>
                  {REGION_LIST.map(region => {
                    const cell = brand.regions[region.code];
                    return (
                      <TableCell key={region.code} className="text-center">
                        {cell.hasStore ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <div className="font-medium">{cell.storeName}</div>
                                {cell.shipsFrom && (
                                  <div className="text-muted-foreground">Ships from: {cell.shipsFrom}</div>
                                )}
                                {cell.storeUrl && (
                                  <a 
                                    href={cell.storeUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary flex items-center gap-1 mt-1"
                                  >
                                    Visit <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center">
                    <Badge variant={brand.storeCount > 3 ? "default" : brand.storeCount > 0 ? "secondary" : "outline"}>
                      {brand.storeCount}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Local store configured</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-muted-foreground/30" />
            <span>No regional store (uses fallback)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
