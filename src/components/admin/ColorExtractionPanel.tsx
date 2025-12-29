import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Palette, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useEnrichmentQueue } from '@/hooks/useEnrichmentQueue';
import { useEnrichmentMetrics } from '@/hooks/useEnrichmentMetrics';

export function ColorExtractionPanel() {
  const [dryRun, setDryRun] = useState(true);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const { runSingle, runQueue, state, isRunning } = useEnrichmentQueue();
  const { lowColorBrands, isLoading, refresh } = useEnrichmentMetrics();

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

  const handleExtractSingle = async (brandSlug: string) => {
    await runSingle({ type: 'color-extraction', brandSlug, dryRun });
    if (!dryRun) refresh();
  };

  const handleExtractSelected = async () => {
    const ops = Array.from(selectedBrands).map(brandSlug => ({
      type: 'color-extraction' as const,
      brandSlug,
      dryRun,
    }));
    await runQueue(ops);
    if (!dryRun) refresh();
  };

  const handleExtractAll = async () => {
    const ops = lowColorBrands.map(b => ({
      type: 'color-extraction' as const,
      brandSlug: b.brandSlug,
      dryRun,
    }));
    await runQueue(ops);
    if (!dryRun) refresh();
  };

  const getResultForBrand = (slug: string) => {
    return state.results.find(r => 
      r.operation.type === 'color-extraction' && 
      r.operation.brandSlug === slug
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <CardTitle>Color Extraction</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="color-dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
            <Label htmlFor="color-dry-run" className="text-sm">Dry Run</Label>
          </div>
        </div>
        <CardDescription>
          Extract color hex values from product titles for {lowColorBrands.length} brands with &lt;90% coverage.
          Enhanced with Prusament, Recreus/Filaflex, Eryone, and Jayo pattern matching.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRunning && state.currentOperation?.type === 'color-extraction' && (
          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing: {state.currentOperation.brandSlug}</span>
            </div>
            <Progress value={(state.currentIndex / state.totalOperations) * 100} />
            <p className="text-xs text-muted-foreground">
              {state.currentIndex + 1} of {state.totalOperations} operations
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
            lowColorBrands.map(brand => {
              const result = getResultForBrand(brand.brandSlug);
              const isProcessing = isRunning && 
                state.currentOperation?.type === 'color-extraction' && 
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
                        {brand.withColorHex}/{brand.totalProducts} products ({brand.colorCoverage}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result && (
                      result.success ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Done
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )
                    )}
                    <Badge 
                      variant={brand.colorCoverage < 20 ? 'destructive' : brand.colorCoverage < 50 ? 'secondary' : 'outline'}
                    >
                      {brand.colorCoverage}%
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExtractSingle(brand.brandSlug)}
                      disabled={isRunning}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Extract'
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
            onClick={handleExtractSelected}
            disabled={isRunning || selectedBrands.size === 0}
            variant="secondary"
          >
            Extract Selected ({selectedBrands.size})
          </Button>
          <Button
            onClick={handleExtractAll}
            disabled={isRunning || lowColorBrands.length === 0}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Palette className="w-4 h-4 mr-2" />
                Extract All Low-Coverage ({lowColorBrands.length})
              </>
            )}
          </Button>
        </div>

        {state.results.length > 0 && !isRunning && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Results</p>
            <div className="space-y-1 text-sm">
              {state.results.filter(r => r.operation.type === 'color-extraction').map((result, i) => (
                <div key={i} className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span>{result.operation.brandSlug}: {result.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
