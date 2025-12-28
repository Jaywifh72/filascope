import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, Loader2, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import { useEnrichmentQueue } from '@/hooks/useEnrichmentQueue';
import { useEnrichmentMetrics } from '@/hooks/useEnrichmentMetrics';

const REGION_OPTIONS = [
  { id: 'EU', label: 'Europe (EUR)', currency: '€' },
  { id: 'UK', label: 'UK (GBP)', currency: '£' },
  { id: 'CA', label: 'Canada (CAD)', currency: 'C$' },
  { id: 'AU', label: 'Australia (AUD)', currency: 'A$' },
];

export function RegionalPricingPanel() {
  const [dryRun, setDryRun] = useState(true);
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set(['EU']));
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const { runSingle, runQueue, state, isRunning } = useEnrichmentQueue();
  const { regionalBrands, isLoading, refresh } = useEnrichmentMetrics();

  const toggleRegion = (regionId: string) => {
    setSelectedRegions(prev => {
      const next = new Set(prev);
      if (next.has(regionId)) {
        next.delete(regionId);
      } else {
        next.add(regionId);
      }
      return next;
    });
  };

  const toggleBrand = (slug: string) => {
    setSelectedBrands(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const handleSyncSingle = async (brandSlug: string) => {
    const brand = regionalBrands.find(b => b.brandSlug === brandSlug);
    if (!brand) return;
    
    // Use selected regions that are also supported by this brand
    const regionsToSync = Array.from(selectedRegions).filter(r => 
      brand.supportedRegions.includes(r)
    );
    
    if (regionsToSync.length === 0) {
      // If no overlap, use brand's supported regions
      await runSingle({ 
        type: 'regional-pricing', 
        brandSlug, 
        regions: brand.supportedRegions,
        dryRun 
      });
    } else {
      await runSingle({ 
        type: 'regional-pricing', 
        brandSlug, 
        regions: regionsToSync,
        dryRun 
      });
    }
    if (!dryRun) refresh();
  };

  const handleSyncSelected = async () => {
    const ops = Array.from(selectedBrands).map(brandSlug => {
      const brand = regionalBrands.find(b => b.brandSlug === brandSlug);
      const regionsToSync = Array.from(selectedRegions).filter(r => 
        brand?.supportedRegions.includes(r)
      );
      return {
        type: 'regional-pricing' as const,
        brandSlug,
        regions: regionsToSync.length > 0 ? regionsToSync : (brand?.supportedRegions || ['EU']),
        dryRun,
      };
    });
    await runQueue(ops);
    if (!dryRun) refresh();
  };

  const handleSyncAll = async () => {
    const ops = regionalBrands.map(brand => ({
      type: 'regional-pricing' as const,
      brandSlug: brand.brandSlug,
      regions: brand.supportedRegions,
      dryRun,
    }));
    await runQueue(ops);
    if (!dryRun) refresh();
  };

  const getResultForBrand = (slug: string) => {
    return state.results.find(r => 
      r.operation.type === 'regional-pricing' && 
      r.operation.brandSlug === slug
    );
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage === 0) return 'destructive';
    if (coverage < 50) return 'secondary';
    return 'outline';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <CardTitle>Regional Pricing</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="regional-dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
            <Label htmlFor="regional-dry-run" className="text-sm">Dry Run</Label>
          </div>
        </div>
        <CardDescription>
          Sync regional prices (EUR, GBP, CAD, AUD) from {regionalBrands.length} brand Shopify stores
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Region Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Target Regions</Label>
          <div className="flex flex-wrap gap-3">
            {REGION_OPTIONS.map(region => (
              <div key={region.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`region-${region.id}`}
                  checked={selectedRegions.has(region.id)}
                  onCheckedChange={() => toggleRegion(region.id)}
                  disabled={isRunning}
                />
                <Label 
                  htmlFor={`region-${region.id}`} 
                  className="text-sm font-normal cursor-pointer"
                >
                  {region.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {isRunning && state.currentOperation?.type === 'regional-pricing' && (
          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                Syncing: {state.currentOperation.brandSlug} 
                ({(state.currentOperation as any).regions?.join(', ')})
              </span>
            </div>
            <Progress value={(state.currentIndex / state.totalOperations) * 100} />
            <p className="text-xs text-muted-foreground">
              {state.currentIndex + 1} of {state.totalOperations} brands
            </p>
          </div>
        )}

        <div className="space-y-2 max-h-[350px] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-4 h-4" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="w-16 h-8" />
              </div>
            ))
          ) : (
            regionalBrands.map(brand => {
              const result = getResultForBrand(brand.brandSlug);
              const isProcessing = isRunning && 
                state.currentOperation?.type === 'regional-pricing' && 
                state.currentOperation.brandSlug === brand.brandSlug;

              return (
                <div
                  key={brand.brandSlug}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedBrands.has(brand.brandSlug)}
                      onChange={() => toggleBrand(brand.brandSlug)}
                      className="rounded"
                      disabled={isRunning}
                    />
                    <div>
                      <p className="font-medium">{brand.brandName}</p>
                      <div className="flex gap-1 mt-1">
                        {brand.supportedRegions.map(r => (
                          <Badge key={r} variant="outline" className="text-xs py-0">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result && (
                      result.success ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {result.details?.summary?.totalUpdated || 0} updated
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )
                    )}
                    <div className="hidden md:flex gap-1">
                      {brand.supportedRegions.includes('EU') && (
                        <Badge variant={getCoverageColor(brand.eurCoverage)} className="text-xs">
                          €{brand.eurCoverage}%
                        </Badge>
                      )}
                      {brand.supportedRegions.includes('UK') && (
                        <Badge variant={getCoverageColor(brand.gbpCoverage)} className="text-xs">
                          £{brand.gbpCoverage}%
                        </Badge>
                      )}
                      {brand.supportedRegions.includes('CA') && (
                        <Badge variant={getCoverageColor(brand.cadCoverage)} className="text-xs">
                          C${brand.cadCoverage}%
                        </Badge>
                      )}
                      {brand.supportedRegions.includes('AU') && (
                        <Badge variant={getCoverageColor(brand.audCoverage)} className="text-xs">
                          A${brand.audCoverage}%
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSyncSingle(brand.brandSlug)}
                      disabled={isRunning}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Sync'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button
            onClick={handleSyncSelected}
            disabled={isRunning || selectedBrands.size === 0 || selectedRegions.size === 0}
            variant="secondary"
          >
            Sync Selected ({selectedBrands.size})
          </Button>
          <Button
            onClick={handleSyncAll}
            disabled={isRunning || regionalBrands.length === 0}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Sync All Brands ({regionalBrands.length})
              </>
            )}
          </Button>
        </div>

        {state.results.length > 0 && !isRunning && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Results</p>
            <div className="space-y-1 text-sm max-h-[150px] overflow-y-auto">
              {state.results.filter(r => r.operation.type === 'regional-pricing').map((result, i) => (
                <div key={i} className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  <span className="truncate">
                    {result.operation.brandSlug} ({(result.operation as any).regions?.join(', ')}): {result.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
