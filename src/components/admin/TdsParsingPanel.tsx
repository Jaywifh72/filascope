import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FileSearch, Loader2, CheckCircle2, XCircle, ChevronDown, 
  Thermometer, Droplets, Scale, Zap, AlertTriangle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ParsingBrandStats {
  brandSlug: string;
  brandName: string;
  withTds: number;
  fullyParsed: number;
  partiallyParsed: number;
  needsParsing: number;
  parsingCoverage: number;
}

interface ParseResult {
  filamentId: string;
  productTitle: string;
  success: boolean;
  fieldsExtracted: number;
  confidence: number;
  error?: string;
  data?: Record<string, any>;
  validationWarnings?: string[];
}

interface BatchParseResult {
  brandSlug: string;
  processed: number;
  successful: number;
  failed: number;
  results: ParseResult[];
}

function useParsingStats() {
  return useQuery({
    queryKey: ['tds-parsing-stats'],
    queryFn: async () => {
      // Get ALL scraping-enabled brands (all 43)
      const { data: brands } = await supabase
        .from('automated_brands')
        .select('id, brand_slug, display_name')
        .eq('scraping_enabled', true)
        .order('display_name');

      if (!brands) return [];

      const stats: ParsingBrandStats[] = [];

      for (const brand of brands) {
        // Get filaments with TDS URL for this brand
        const { count: withTds } = await supabase
          .from('filaments')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brand.id)
          .not('tds_url', 'is', null);

        // Get fully parsed (has temps + drying + density)
        const { count: fullyParsed } = await supabase
          .from('filaments')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brand.id)
          .not('tds_url', 'is', null)
          .not('nozzle_temp_min_c', 'is', null)
          .not('drying_temp_c', 'is', null)
          .not('density_g_cm3', 'is', null);

        // Get partially parsed (has at least temps but missing drying or density)
        const { count: partiallyParsed } = await supabase
          .from('filaments')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brand.id)
          .not('tds_url', 'is', null)
          .not('nozzle_temp_min_c', 'is', null)
          .or('drying_temp_c.is.null,density_g_cm3.is.null');

        const tdsCount = withTds || 0;
        const parsed = fullyParsed || 0;
        const partial = Math.max(0, (partiallyParsed || 0) - parsed);
        const needs = Math.max(0, tdsCount - (parsed + partial));

        stats.push({
          brandSlug: brand.brand_slug,
          brandName: brand.display_name,
          withTds: tdsCount,
          fullyParsed: parsed,
          partiallyParsed: partial,
          needsParsing: needs,
          parsingCoverage: tdsCount > 0 ? Math.round((parsed / tdsCount) * 100) : 0,
        });
      }

      // Sort by needs parsing (descending), then by name
      return stats.sort((a, b) => {
        if (b.needsParsing !== a.needsParsing) return b.needsParsing - a.needsParsing;
        if (b.partiallyParsed !== a.partiallyParsed) return b.partiallyParsed - a.partiallyParsed;
        return a.brandName.localeCompare(b.brandName);
      });
    },
    staleTime: 60000,
  });
}

export function TdsParsingPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: parsingStats = [], isLoading } = useParsingStats();
  
  const [dryRun, setDryRun] = useState(true);
  const [forceReparse, setForceReparse] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<BatchParseResult[]>([]);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const toggleBrand = (slug: string) => {
    setSelectedBrands(prev => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  const handleParseBrand = async (brandSlug: string) => {
    setIsRunning(true);
    setCurrentBrand(brandSlug);
    setProgress({ current: 0, total: 1 });

    try {
      const { data, error } = await supabase.functions.invoke('parse-filament-tds', {
        body: { 
          brand_slug: brandSlug, 
          dry_run: dryRun,
          force: forceReparse,
          limit: 25 
        }
      });

      if (error) throw error;

      const result: BatchParseResult = {
        brandSlug,
        processed: data?.processed || 0,
        successful: data?.successful || 0,
        failed: data?.failed || 0,
        results: data?.results || [],
      };

      setResults(prev => [result, ...prev]);
      setExpandedResults(prev => new Set([...prev, brandSlug]));

      toast({
        title: dryRun ? 'Dry Run Complete' : 'Parsing Complete',
        description: `${result.successful}/${result.processed} filaments parsed for ${brandSlug}`,
      });

      if (!dryRun) {
        queryClient.invalidateQueries({ queryKey: ['tds-parsing-stats'] });
        queryClient.invalidateQueries({ queryKey: ['enrichment-metrics'] });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to parse TDS',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
      setCurrentBrand(null);
    }
  };

  const handleParseSelected = async () => {
    const brands = Array.from(selectedBrands);
    setIsRunning(true);
    setProgress({ current: 0, total: brands.length });

    for (let i = 0; i < brands.length; i++) {
      setCurrentBrand(brands[i]);
      setProgress({ current: i, total: brands.length });

      try {
        const { data, error } = await supabase.functions.invoke('parse-filament-tds', {
          body: { 
            brand_slug: brands[i], 
            dry_run: dryRun,
            force: forceReparse,
            limit: 25 
          }
        });

        if (!error && data) {
          const result: BatchParseResult = {
            brandSlug: brands[i],
            processed: data.processed || 0,
            successful: data.successful || 0,
            failed: data.failed || 0,
            results: data.results || [],
          };
          setResults(prev => [result, ...prev]);
        }
      } catch (err) {
        console.error(`Error parsing ${brands[i]}:`, err);
      }

      // Rate limit between brands
      if (i < brands.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    setIsRunning(false);
    setCurrentBrand(null);
    setSelectedBrands(new Set());

    if (!dryRun) {
      queryClient.invalidateQueries({ queryKey: ['tds-parsing-stats'] });
      queryClient.invalidateQueries({ queryKey: ['enrichment-metrics'] });
    }

    toast({
      title: dryRun ? 'Dry Run Complete' : 'Batch Parsing Complete',
      description: `Processed ${brands.length} brands`,
    });
  };

  const totalNeedsParsing = parsingStats.reduce((sum, b) => sum + b.needsParsing, 0);
  const totalPartial = parsingStats.reduce((sum, b) => sum + b.partiallyParsed, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-primary" />
            <CardTitle>TDS Parsing</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="force-reparse" checked={forceReparse} onCheckedChange={setForceReparse} />
              <Label htmlFor="force-reparse" className="text-sm">Force Re-parse</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="parse-dry-run" checked={dryRun} onCheckedChange={setDryRun} />
              <Label htmlFor="parse-dry-run" className="text-sm">Dry Run</Label>
            </div>
          </div>
        </div>
        <CardDescription>
          Extract specifications from TDS PDFs • {totalNeedsParsing} need parsing, {totalPartial} partially parsed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRunning && (
          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Parsing TDS for: <strong>{currentBrand}</strong></span>
            </div>
            {progress.total > 1 && (
              <>
                <Progress value={(progress.current / progress.total) * 100} />
                <p className="text-xs text-muted-foreground">
                  {progress.current + 1} of {progress.total} brands
                </p>
              </>
            )}
          </div>
        )}

        <ScrollArea className="h-[350px]">
          <div className="space-y-2 pr-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="w-20 h-8" />
                </div>
              ))
            ) : parsingStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p>All TDS documents are fully parsed!</p>
              </div>
            ) : (
              parsingStats.map(brand => {
                const isProcessing = currentBrand === brand.brandSlug;
                const brandResult = results.find(r => r.brandSlug === brand.brandSlug);
                const isExpanded = expandedResults.has(brand.brandSlug);

                return (
                  <Collapsible 
                    key={brand.brandSlug}
                    open={isExpanded}
                    onOpenChange={(open) => {
                      setExpandedResults(prev => {
                        const next = new Set(prev);
                        open ? next.add(brand.brandSlug) : next.delete(brand.brandSlug);
                        return next;
                      });
                    }}
                  >
                    <div className="border rounded-lg">
                      <div className="flex items-center justify-between p-3">
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
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                {brand.fullyParsed} parsed
                              </span>
                              {brand.partiallyParsed > 0 && (
                                <span className="flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                                  {brand.partiallyParsed} partial
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-muted-foreground" />
                                {brand.needsParsing} pending
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {brandResult && (
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </Button>
                            </CollapsibleTrigger>
                          )}
                          <Badge 
                            variant={brand.parsingCoverage >= 80 ? 'default' : brand.parsingCoverage >= 50 ? 'secondary' : 'destructive'}
                          >
                            {brand.parsingCoverage}%
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleParseBrand(brand.brandSlug)} 
                            disabled={isRunning}
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Parse'}
                          </Button>
                        </div>
                      </div>

                      {brandResult && (
                        <CollapsibleContent>
                          <div className="border-t p-3 bg-muted/30">
                            <div className="flex items-center gap-4 mb-3 text-sm">
                              <span className="text-green-600 font-medium">
                                ✓ {brandResult.successful} successful
                              </span>
                              {brandResult.failed > 0 && (
                                <span className="text-destructive font-medium">
                                  ✗ {brandResult.failed} failed
                                </span>
                              )}
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                              {brandResult.results.slice(0, 10).map((r, i) => (
                                <div key={i} className="text-xs p-2 bg-background rounded border">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium truncate max-w-[250px]">{r.productTitle}</span>
                                    {r.success ? (
                                      <Badge variant="outline" className="text-xs">
                                        {r.fieldsExtracted} fields • {r.confidence}% conf
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive" className="text-xs">Failed</Badge>
                                    )}
                                  </div>
                                  {r.success && r.data && (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {r.data.nozzle_temp_min_c && (
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                          <Thermometer className="w-3 h-3" />
                                          {r.data.nozzle_temp_min_c}-{r.data.nozzle_temp_max_c}°C
                                        </span>
                                      )}
                                      {r.data.drying_temp_c && (
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                          <Droplets className="w-3 h-3" />
                                          {r.data.drying_temp_c}°C/{r.data.drying_time_hours}h
                                        </span>
                                      )}
                                      {r.data.density_g_cm3 && (
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                          <Scale className="w-3 h-3" />
                                          {r.data.density_g_cm3}g/cm³
                                        </span>
                                      )}
                                      {r.data.tensile_strength_xy_mpa && (
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                          <Zap className="w-3 h-3" />
                                          {r.data.tensile_strength_xy_mpa}MPa
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {r.validationWarnings && r.validationWarnings.length > 0 && (
                                    <div className="mt-1 text-amber-600">
                                      ⚠ {r.validationWarnings.join(', ')}
                                    </div>
                                  )}
                                  {r.error && (
                                    <div className="mt-1 text-destructive">{r.error}</div>
                                  )}
                                </div>
                              ))}
                              {brandResult.results.length > 10 && (
                                <p className="text-xs text-muted-foreground text-center">
                                  +{brandResult.results.length - 10} more results
                                </p>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      )}
                    </div>
                  </Collapsible>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-2 border-t">
          <Button 
            onClick={handleParseSelected} 
            disabled={isRunning || selectedBrands.size === 0} 
            variant="secondary"
          >
            Parse Selected ({selectedBrands.size})
          </Button>
          <Button 
            onClick={() => {
              parsingStats.forEach(b => selectedBrands.add(b.brandSlug));
              handleParseSelected();
            }} 
            disabled={isRunning || parsingStats.length === 0}
          >
            {isRunning ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
            ) : (
              <>Parse All ({parsingStats.length})</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
