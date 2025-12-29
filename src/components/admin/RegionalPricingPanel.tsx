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
  { id: 'JP', label: 'Japan (JPY)', currency: '¥' },
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

  // Calculate overall regional coverage stats
  const overallStats = {
    eur: regionalBrands.length > 0 
      ? Math.round(regionalBrands.filter(b => b.supportedRegions.includes('EU')).reduce((acc, b) => acc + b.eurCoverage, 0) / Math.max(1, regionalBrands.filter(b => b.supportedRegions.includes('EU')).length))
      : 0,
    gbp: regionalBrands.length > 0 
      ? Math.round(regionalBrands.filter(b => b.supportedRegions.includes('UK')).reduce((acc, b) => acc + b.gbpCoverage, 0) / Math.max(1, regionalBrands.filter(b => b.supportedRegions.includes('UK')).length))
      : 0,
    cad: regionalBrands.length > 0 
      ? Math.round(regionalBrands.filter(b => b.supportedRegions.includes('CA')).reduce((acc, b) => acc + b.cadCoverage, 0) / Math.max(1, regionalBrands.filter(b => b.supportedRegions.includes('CA')).length))
      : 0,
    aud: regionalBrands.length > 0 
      ? Math.round(regionalBrands.filter(b => b.supportedRegions.includes('AU')).reduce((acc, b) => acc + b.audCoverage, 0) / Math.max(1, regionalBrands.filter(b => b.supportedRegions.includes('AU')).length))
      : 0,
    jpy: regionalBrands.length > 0 
      ? Math.round(regionalBrands.filter(b => b.supportedRegions.includes('JP')).reduce((acc, b) => acc + (b.jpyCoverage || 0), 0) / Math.max(1, regionalBrands.filter(b => b.supportedRegions.includes('JP')).length))
      : 0,
  };

  const lowCoverageBrands = regionalBrands.filter(b => 
    (b.supportedRegions.includes('EU') && b.eurCoverage === 0) ||
    (b.supportedRegions.includes('UK') && b.gbpCoverage === 0) ||
    (b.supportedRegions.includes('CA') && b.cadCoverage === 0) ||
    (b.supportedRegions.includes('AU') && b.audCoverage === 0)
  );

  const handleSyncLowCoverage = async () => {
    const ops = lowCoverageBrands.map(brand => ({
      type: 'regional-pricing' as const,
      brandSlug: brand.brandSlug,
      regions: brand.supportedRegions.filter(r => r !== 'US'),
      dryRun,
    }));
    await runQueue(ops);
    if (!dryRun) refresh();
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
          Sync regional prices (EUR, GBP, CAD, AUD, JPY) from {regionalBrands.length} brand Shopify stores
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coverage Summary */}
        <div className="grid grid-cols-5 gap-2 p-3 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">EUR</p>
            <p className={`text-lg font-bold ${overallStats.eur < 30 ? 'text-destructive' : overallStats.eur < 60 ? 'text-yellow-600' : 'text-green-600'}`}>
              {overallStats.eur}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">GBP</p>
            <p className={`text-lg font-bold ${overallStats.gbp < 30 ? 'text-destructive' : overallStats.gbp < 60 ? 'text-yellow-600' : 'text-green-600'}`}>
              {overallStats.gbp}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">CAD</p>
            <p className={`text-lg font-bold ${overallStats.cad < 30 ? 'text-destructive' : overallStats.cad < 60 ? 'text-yellow-600' : 'text-green-600'}`}>
              {overallStats.cad}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">AUD</p>
            <p className={`text-lg font-bold ${overallStats.aud < 30 ? 'text-destructive' : overallStats.aud < 60 ? 'text-yellow-600' : 'text-green-600'}`}>
              {overallStats.aud}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">JPY</p>
            <p className={`text-lg font-bold ${overallStats.jpy < 30 ? 'text-destructive' : overallStats.jpy < 60 ? 'text-yellow-600' : 'text-green-600'}`}>
              {overallStats.jpy}%
            </p>
          </div>
        </div>

        {lowCoverageBrands.length > 0 && (
          <div className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg">
            <span className="text-sm text-destructive">
              {lowCoverageBrands.length} brand(s) with 0% coverage in supported regions
            </span>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleSyncLowCoverage}
              disabled={isRunning}
            >
              Sync Low Coverage
            </Button>
          </div>
        )}
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
                      {brand.supportedRegions.includes('JP') && (
                        <Badge variant={getCoverageColor(brand.jpyCoverage || 0)} className="text-xs">
                          ¥{brand.jpyCoverage || 0}%
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
