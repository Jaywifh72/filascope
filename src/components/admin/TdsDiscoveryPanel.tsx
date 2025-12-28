import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useEnrichmentQueue } from '@/hooks/useEnrichmentQueue';
import { useEnrichmentMetrics } from '@/hooks/useEnrichmentMetrics';

export function TdsDiscoveryPanel() {
  const [dryRun, setDryRun] = useState(true);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const { runSingle, runQueue, state, isRunning } = useEnrichmentQueue();
  const { lowTdsBrands, isLoading, refresh } = useEnrichmentMetrics();

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

  const handleDiscoverSingle = async (brandSlug: string) => {
    await runSingle({ type: 'tds-discovery', brandSlug, dryRun });
    if (!dryRun) refresh();
  };

  const handleDiscoverSelected = async () => {
    const ops = Array.from(selectedBrands).map(brandSlug => ({
      type: 'tds-discovery' as const,
      brandSlug,
      dryRun,
    }));
    await runQueue(ops);
    if (!dryRun) refresh();
  };

  const handleDiscoverAll = async () => {
    const ops = lowTdsBrands.map(b => ({
      type: 'tds-discovery' as const,
      brandSlug: b.brandSlug,
      dryRun,
    }));
    await runQueue(ops);
    if (!dryRun) refresh();
  };

  const getResultForBrand = (slug: string) => {
    return state.results.find(r => 
      r.operation.type === 'tds-discovery' && 
      r.operation.brandSlug === slug
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle>TDS Discovery</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="tds-dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
            <Label htmlFor="tds-dry-run" className="text-sm">Dry Run</Label>
          </div>
        </div>
        <CardDescription>
          Discover Technical Data Sheet URLs for {lowTdsBrands.length} brands with &lt;50% TDS coverage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRunning && state.currentOperation?.type === 'tds-discovery' && (
          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Discovering TDS for: {state.currentOperation.brandSlug}</span>
            </div>
            <Progress value={(state.currentIndex / state.totalOperations) * 100} />
            <p className="text-xs text-muted-foreground">
              {state.currentIndex + 1} of {state.totalOperations} brands
            </p>
          </div>
        )}

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-4 h-4" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="w-16 h-8" />
              </div>
            ))
          ) : (
            lowTdsBrands.map(brand => {
              const result = getResultForBrand(brand.brandSlug);
              const isProcessing = isRunning && 
                state.currentOperation?.type === 'tds-discovery' && 
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
                      <p className="text-xs text-muted-foreground">
                        {brand.withTds}/{brand.totalProducts} products with TDS ({brand.tdsCoverage}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result && (
                      result.success ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {result.details?.discovered || 0} found
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )
                    )}
                    <Badge variant={brand.tdsCoverage === 0 ? 'destructive' : brand.tdsCoverage < 25 ? 'secondary' : 'outline'}>
                      {brand.tdsCoverage}%
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDiscoverSingle(brand.brandSlug)}
                      disabled={isRunning}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Discover'
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
            onClick={handleDiscoverSelected}
            disabled={isRunning || selectedBrands.size === 0}
            variant="secondary"
          >
            Discover Selected ({selectedBrands.size})
          </Button>
          <Button
            onClick={handleDiscoverAll}
            disabled={isRunning || lowTdsBrands.length === 0}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Discover All ({lowTdsBrands.length} brands)
              </>
            )}
          </Button>
        </div>

        {state.results.length > 0 && !isRunning && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Results</p>
            <div className="space-y-1 text-sm max-h-[200px] overflow-y-auto">
              {state.results.filter(r => r.operation.type === 'tds-discovery').map((result, i) => (
                <div key={i} className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  <span className="truncate">{result.operation.brandSlug}: {result.message}</span>
                  {result.success && result.details?.discovered > 0 && (
                    <Badge variant="outline" className="ml-auto shrink-0">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {result.details.discovered} URLs
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
