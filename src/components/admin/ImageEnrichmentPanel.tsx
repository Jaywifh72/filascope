import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Image, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useEnrichmentMetrics } from '@/hooks/useEnrichmentMetrics';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageResult {
  brandSlug: string;
  success: boolean;
  found: number;
  updated: number;
  failed: number;
  message: string;
}

export function ImageEnrichmentPanel() {
  const [dryRun, setDryRun] = useState(true);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<ImageResult[]>([]);
  
  const { lowImageBrands, isLoading, refresh } = useEnrichmentMetrics();

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

  const runImageDiscovery = async (brandSlug: string): Promise<ImageResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('discover-brand-images', {
        body: { brand: brandSlug, dryRun, limit: 50 }
      });

      if (error) throw error;

      return {
        brandSlug,
        success: true,
        found: data?.imagesFound || 0,
        updated: data?.imagesUpdated || 0,
        failed: data?.failed || 0,
        message: `Found ${data?.imagesFound || 0}, updated ${data?.imagesUpdated || 0}`
      };
    } catch (err) {
      console.error(`Error discovering images for ${brandSlug}:`, err);
      return {
        brandSlug,
        success: false,
        found: 0,
        updated: 0,
        failed: 0,
        message: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  };

  const handleDiscoverSingle = async (brandSlug: string) => {
    setIsRunning(true);
    setCurrentBrand(brandSlug);
    setProgress({ current: 0, total: 1 });
    setResults([]);

    const result = await runImageDiscovery(brandSlug);
    setResults([result]);
    
    if (result.success) {
      toast.success(`${brandSlug}: ${result.message}`);
    } else {
      toast.error(`${brandSlug}: ${result.message}`);
    }

    setIsRunning(false);
    setCurrentBrand(null);
    if (!dryRun) refresh();
  };

  const handleDiscoverSelected = async () => {
    const brands = Array.from(selectedBrands);
    if (brands.length === 0) return;

    setIsRunning(true);
    setResults([]);
    setProgress({ current: 0, total: brands.length });

    const newResults: ImageResult[] = [];
    for (let i = 0; i < brands.length; i++) {
      setCurrentBrand(brands[i]);
      setProgress({ current: i + 1, total: brands.length });
      
      const result = await runImageDiscovery(brands[i]);
      newResults.push(result);
      setResults([...newResults]);
    }

    const successCount = newResults.filter(r => r.success).length;
    toast.success(`Completed: ${successCount}/${brands.length} brands processed`);

    setIsRunning(false);
    setCurrentBrand(null);
    if (!dryRun) refresh();
  };

  const handleDiscoverAll = async () => {
    const brands = lowImageBrands.map(b => b.brandSlug);
    if (brands.length === 0) return;

    setIsRunning(true);
    setResults([]);
    setProgress({ current: 0, total: brands.length });

    const newResults: ImageResult[] = [];
    for (let i = 0; i < brands.length; i++) {
      setCurrentBrand(brands[i]);
      setProgress({ current: i + 1, total: brands.length });
      
      const result = await runImageDiscovery(brands[i]);
      newResults.push(result);
      setResults([...newResults]);
    }

    const successCount = newResults.filter(r => r.success).length;
    const totalUpdated = newResults.reduce((sum, r) => sum + r.updated, 0);
    toast.success(`Completed: ${successCount}/${brands.length} brands, ${totalUpdated} images updated`);

    setIsRunning(false);
    setCurrentBrand(null);
    if (!dryRun) refresh();
  };

  const getResultForBrand = (slug: string) => {
    return results.find(r => r.brandSlug === slug);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            <CardTitle>Image Discovery</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="image-dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
            <Label htmlFor="image-dry-run" className="text-sm">Dry Run</Label>
          </div>
        </div>
        <CardDescription>
          Discover and extract product images for {lowImageBrands.length} brands with &lt;90% coverage.
          Uses brand-specific patterns (Shopify, WooCommerce, OG tags, JSON-LD).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRunning && currentBrand && (
          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Discovering images: {currentBrand}</span>
            </div>
            <Progress value={(progress.current / progress.total) * 100} />
            <p className="text-xs text-muted-foreground">
              {progress.current} of {progress.total} brands
            </p>
          </div>
        )}

        {/* Coverage Summary */}
        {!isLoading && lowImageBrands.length > 0 && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">
                {lowImageBrands.filter(b => b.imageCoverage < 50).length}
              </p>
              <p className="text-xs text-muted-foreground">&lt;50% Coverage</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">
                {lowImageBrands.filter(b => b.imageCoverage >= 50 && b.imageCoverage < 80).length}
              </p>
              <p className="text-xs text-muted-foreground">50-80% Coverage</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {lowImageBrands.filter(b => b.imageCoverage >= 80).length}
              </p>
              <p className="text-xs text-muted-foreground">80-90% Coverage</p>
            </div>
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
          ) : lowImageBrands.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>All brands have 90%+ image coverage!</p>
            </div>
          ) : (
            lowImageBrands.map(brand => {
              const result = getResultForBrand(brand.brandSlug);
              const isProcessing = isRunning && currentBrand === brand.brandSlug;

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
                        {brand.withImage}/{brand.totalProducts} products ({brand.imageCoverage}%)
                        {brand.withoutImage > 0 && (
                          <span className="text-destructive ml-1">
                            • {brand.withoutImage} missing
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result && (
                      result.success ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          +{result.updated}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )
                    )}
                    <Badge 
                      variant={brand.imageCoverage < 20 ? 'destructive' : brand.imageCoverage < 50 ? 'secondary' : 'outline'}
                    >
                      {brand.imageCoverage < 50 && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {brand.imageCoverage}%
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
            disabled={isRunning || lowImageBrands.length === 0}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Image className="w-4 h-4 mr-2" />
                Discover All Low-Coverage ({lowImageBrands.length})
              </>
            )}
          </Button>
        </div>

        {results.length > 0 && !isRunning && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Results</p>
            <div className="space-y-1 text-sm max-h-[200px] overflow-y-auto">
              {results.map((result, i) => (
                <div key={i} className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  <span className="truncate">
                    {result.brandSlug}: {result.message}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
              Total: {results.reduce((sum, r) => sum + r.found, 0)} found, {' '}
              {results.reduce((sum, r) => sum + r.updated, 0)} updated
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
