import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link2, AlertCircle, ChevronDown, ChevronUp, Plus, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { REGIONS } from '@/config/regions';
import { RegionCode } from '@/types/regional';

interface MissingUrlProduct {
  product_id: string;
  product_type: string;
  product_name: string;
  brand_slug: string;
  has_regions: string[];
  missing_regions: string[];
}

interface MissingRegionalUrlsReportProps {
  onAddUrls?: (productId: string, productType: string) => void;
}

export function MissingRegionalUrlsReport({ onAddUrls }: MissingRegionalUrlsReportProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [limit, setLimit] = useState(20);

  const { data: missingUrls, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['missing-regional-urls', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_missing_regional_urls' as never, { 
        limit_count: limit 
      } as never);
      if (error) throw error;
      return (data as unknown as MissingUrlProduct[]) || [];
    },
    refetchInterval: 60000,
  });

  const totalMissing = missingUrls?.reduce((acc, p) => acc + p.missing_regions.length, 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5 text-amber-500" />
            Missing Regional URLs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!missingUrls || missingUrls.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5 text-muted-foreground" />
            Missing Regional URLs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>All products have complete regional coverage!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full text-left">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-amber-500" />
                  Missing Regional URLs
                  <Badge variant="secondary" className="ml-2">
                    {missingUrls.length} products
                  </Badge>
                  <Badge variant="outline" className="text-amber-500 border-amber-500/50">
                    {totalMissing} missing
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  Products that exist in some regions but not others
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    refetch();
                  }}
                  disabled={isFetching}
                >
                  <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
                </Button>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Has URLs</TableHead>
                    <TableHead>Missing</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missingUrls.map((product) => (
                    <TableRow key={`${product.product_id}-${product.product_type}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {product.product_type}
                          </Badge>
                          <span className="font-medium truncate max-w-[200px]">
                            {product.product_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.brand_slug}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.has_regions.map((region) => (
                            <span key={region} className="text-sm" title={REGIONS[region as RegionCode]?.name}>
                              {REGIONS[region as RegionCode]?.flag || region}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.missing_regions.map((region) => (
                            <Badge 
                              key={region} 
                              variant="outline" 
                              className="text-amber-500 border-amber-500/50 text-xs"
                            >
                              {REGIONS[region as RegionCode]?.flag} {region}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {onAddUrls && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAddUrls(product.product_id, product.product_type)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Load more */}
            {missingUrls.length >= limit && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLimit((prev) => prev + 20)}
                  disabled={isFetching}
                >
                  Load more
                </Button>
              </div>
            )}

            {/* Info box */}
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    Improve regional coverage
                  </p>
                  <p className="text-muted-foreground mt-1">
                    These products may be available in more regions. Adding regional URLs enables 
                    accurate local pricing and improves user experience for visitors from those regions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
