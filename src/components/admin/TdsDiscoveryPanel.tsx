import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Loader2, CheckCircle2, XCircle, Play, Database, Search, AlertTriangle } from 'lucide-react';
import { useEnrichmentQueue } from '@/hooks/useEnrichmentQueue';
import { useEnrichmentMetrics } from '@/hooks/useEnrichmentMetrics';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BRAND_SPECIFIC_FUNCTIONS } from '@/lib/brand-sync-config';

// Brand-specific TDS scrapers
const BRAND_SPECIFIC_SCRAPERS: Record<string, string> = {
  'elegoo': 'scrape-elegoo-tds',
  'anycubic': 'scrape-anycubic-tds',
  'ninjatek': 'scrape-ninjatek-tds',
  'sainsmart': 'scrape-sainsmart-tds',
  'azurefilm': 'scrape-azurefilm-tds',
  'push-plastic': 'scrape-pushplastic-tds',
  'filaments-ca': 'scrape-filaments-ca-tds',
  '3d-fuel': 'update-3dfuel-tds',
  '3dxtech': 'update-3dxtech-tds',
  'amolen': 'update-amolen-specs',
};

// Total brands in sync manager for reference
const SYNC_MANAGER_BRAND_COUNT = BRAND_SPECIFIC_FUNCTIONS.length;

interface BatchAuditResult {
  summary: {
    totalBrandsWithTds: number;
    totalFilamentsWithTds: number;
    totalNeedsParsing: number;
    parsingCoverage: number;
  };
  priorityBrands: Array<{
    brandSlug: string;
    brandName: string;
    totalWithTds: number;
    needsParsing: number;
  }>;
}

interface NormalizationAudit {
  summary: {
    filamentsAnalyzed: number;
    filamentsWithIssues: number;
    totalIssues: number;
    errors: number;
    warnings: number;
    issuesByField: Record<string, number>;
  };
}

export function TdsDiscoveryPanel() {
  const { toast } = useToast();
  const [dryRun, setDryRun] = useState(true);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [specificRunning, setSpecificRunning] = useState<string | null>(null);
  const [specificResults, setSpecificResults] = useState<Record<string, { found: number; notFound: number }>>({});
  const { runSingle, runQueue, state, isRunning } = useEnrichmentQueue();
  const { brands: allBrands, isLoading, refresh } = useEnrichmentMetrics();

  // Batch parsing state
  const [batchAuditResult, setBatchAuditResult] = useState<BatchAuditResult | null>(null);
  const [batchParseRunning, setBatchParseRunning] = useState(false);
  const [batchParseProgress, setBatchParseProgress] = useState<{ current: number; total: number; brand?: string } | null>(null);

  // Normalization state
  const [normalizationAudit, setNormalizationAudit] = useState<NormalizationAudit | null>(null);
  const [normalizationRunning, setNormalizationRunning] = useState(false);

  // Build complete list of ALL 43 Sync Manager brands, including those without products
  const syncManagerBrands = useMemo(() => {
    const brandMap = new Map(allBrands.map(b => [b.brandSlug, b]));
    
    // Create entries for all brands in BRAND_SPECIFIC_FUNCTIONS
    return BRAND_SPECIFIC_FUNCTIONS.map(slug => {
      const existing = brandMap.get(slug);
      if (existing) return existing;
      
      // Create placeholder for brands not yet in database
      const displayName = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return {
        brandId: undefined,
        brandSlug: slug,
        brandName: displayName,
        totalProducts: 0,
        withColorHex: 0,
        withTds: 0,
        withImage: 0,
        withoutImage: 0,
        withFullParsing: 0,
        withEur: 0,
        withGbp: 0,
        withCad: 0,
        withAud: 0,
        withJpy: 0,
        colorCoverage: 0,
        tdsCoverage: 0,
        imageCoverage: 0,
        parsingCoverage: 0,
        eurCoverage: 0,
        gbpCoverage: 0,
        cadCoverage: 0,
        audCoverage: 0,
        jpyCoverage: 0,
        supportedRegions: [],
      };
    }).sort((a, b) => b.totalProducts - a.totalProducts);
  }, [allBrands]);

  // Calculate overall TDS stats for Sync Manager brands
  const tdsStats = useMemo(() => {
    const total = syncManagerBrands.reduce((sum, b) => sum + b.totalProducts, 0);
    const withTds = syncManagerBrands.reduce((sum, b) => sum + b.withTds, 0);
    const withParsing = syncManagerBrands.reduce((sum, b) => sum + b.withFullParsing, 0);
    return {
      totalProducts: total,
      withTds,
      withParsing,
      tdsCoverage: total > 0 ? Math.round((withTds / total) * 100) : 0,
      parsingCoverage: withTds > 0 ? Math.round((withParsing / withTds) * 100) : 0,
    };
  }, [syncManagerBrands]);

  const toggleBrand = (slug: string) => {
    setSelectedBrands(prev => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  const handleDiscoverSingle = async (brandSlug: string) => {
    await runSingle({ type: 'tds-discovery', brandSlug, dryRun });
    if (!dryRun) refresh();
  };

  const handleDiscoverSelected = async () => {
    const ops = Array.from(selectedBrands).map(brandSlug => ({
      type: 'tds-discovery' as const, brandSlug, dryRun,
    }));
    await runQueue(ops);
    if (!dryRun) refresh();
  };

  const handleDiscoverAll = async () => {
    const ops = syncManagerBrands.map(b => ({
      type: 'tds-discovery' as const, brandSlug: b.brandSlug, dryRun,
    }));
    await runQueue(ops);
    if (!dryRun) refresh();
  };

  const handleRunSpecificScraper = async (brandSlug: string, functionName: string) => {
    setSpecificRunning(brandSlug);
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { limit: 100, validateUrls: true, scrapePages: true }
      });
      if (error) throw error;
      setSpecificResults(prev => ({
        ...prev,
        [brandSlug]: { found: data?.found || 0, notFound: data?.notFound || 0 }
      }));
      toast({ title: 'TDS Discovery Complete', description: `Found ${data?.found || 0} TDS URLs for ${brandSlug}` });
      refresh();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setSpecificRunning(null);
    }
  };

  // Run batch TDS parsing audit
  const handleBatchAudit = async () => {
    setBatchParseRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('batch-parse-all-tds', {
        body: { mode: 'audit' }
      });
      if (error) throw error;
      setBatchAuditResult(data);
      toast({ title: 'Audit Complete', description: `${data?.summary?.totalNeedsParsing || 0} filaments need parsing` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Audit failed', variant: 'destructive' });
    } finally {
      setBatchParseRunning(false);
    }
  };

  // Run batch TDS parsing for priority brands
  const handleBatchParsePriority = async () => {
    setBatchParseRunning(true);
    setBatchParseProgress({ current: 0, total: batchAuditResult?.priorityBrands?.length || 0 });
    try {
      const { data, error } = await supabase.functions.invoke('batch-parse-all-tds', {
        body: { mode: 'parse-priority', limit: 10, dryRun }
      });
      if (error) throw error;
      toast({ 
        title: 'Batch Parse Complete', 
        description: `Processed ${data?.summary?.totalProcessed || 0}, updated ${data?.summary?.totalSuccessful || 0}` 
      });
      // Refresh audit
      handleBatchAudit();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Parse failed', variant: 'destructive' });
    } finally {
      setBatchParseRunning(false);
      setBatchParseProgress(null);
    }
  };

  // Run batch TDS parsing for ALL Brand Sync Manager brands
  const handleBatchParseAllSyncManager = async () => {
    setBatchParseRunning(true);
    setBatchParseProgress({ current: 0, total: SYNC_MANAGER_BRAND_COUNT });
    try {
      const { data, error } = await supabase.functions.invoke('batch-parse-all-tds', {
        body: { mode: 'parse-sync-manager', limit: 50, dryRun }
      });
      if (error) throw error;
      toast({ 
        title: 'Batch Parse Complete', 
        description: `Processed ${data?.summary?.brandsProcessed || 0} brands, ${data?.summary?.totalSuccessful || 0} filaments updated` 
      });
      // Refresh audit and metrics
      handleBatchAudit();
      refresh();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Parse failed', variant: 'destructive' });
    } finally {
      setBatchParseRunning(false);
      setBatchParseProgress(null);
    }
  };

  // Run normalization audit
  const handleNormalizationAudit = async () => {
    setNormalizationRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('normalize-filament-specs', {
        body: { mode: 'audit', limit: 1000 }
      });
      if (error) throw error;
      setNormalizationAudit(data);
      toast({ 
        title: 'Normalization Audit Complete', 
        description: `Found ${data?.summary?.totalIssues || 0} issues in ${data?.summary?.filamentsWithIssues || 0} filaments` 
      });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Audit failed', variant: 'destructive' });
    } finally {
      setNormalizationRunning(false);
    }
  };

  const getResultForBrand = (slug: string) => {
    return state.results.find(r => r.operation.type === 'tds-discovery' && r.operation.brandSlug === slug);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle>TDS Management</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="tds-dry-run" checked={dryRun} onCheckedChange={setDryRun} />
            <Label htmlFor="tds-dry-run" className="text-sm">Dry Run</Label>
          </div>
        </div>
        <CardDescription>
          Discover TDS URLs, parse specifications, and normalize data across all brands
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="discovery" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="discovery" className="flex items-center gap-1">
              <Search className="w-4 h-4" />
              Discovery
            </TabsTrigger>
            <TabsTrigger value="parsing" className="flex items-center gap-1">
              <Database className="w-4 h-4" />
              Parsing
            </TabsTrigger>
            <TabsTrigger value="normalization" className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Normalization
            </TabsTrigger>
          </TabsList>

          {/* Discovery Tab */}
          <TabsContent value="discovery" className="space-y-4">
            {/* Overall Stats for Discovery */}
            <div className="grid grid-cols-4 gap-3 text-center p-3 bg-muted rounded-lg">
              <div className="p-2 bg-background rounded">
                <p className="text-2xl font-bold">{syncManagerBrands.length}</p>
                <p className="text-xs text-muted-foreground">Sync Brands</p>
              </div>
              <div className="p-2 bg-background rounded">
                <p className="text-2xl font-bold">{tdsStats.totalProducts}</p>
                <p className="text-xs text-muted-foreground">Total Products</p>
              </div>
              <div className="p-2 bg-background rounded">
                <p className="text-2xl font-bold text-green-600">{tdsStats.withTds}</p>
                <p className="text-xs text-muted-foreground">With TDS</p>
              </div>
              <div className="p-2 bg-background rounded">
                <p className="text-2xl font-bold text-primary">{tdsStats.tdsCoverage}%</p>
                <p className="text-xs text-muted-foreground">TDS Coverage</p>
              </div>
            </div>

            {isRunning && state.currentOperation?.type === 'tds-discovery' && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Discovering TDS for: {state.currentOperation.brandSlug}</span>
                </div>
                <Progress value={(state.currentIndex / state.totalOperations) * 100} />
                <p className="text-xs text-muted-foreground">{state.currentIndex + 1} of {state.totalOperations} brands</p>
              </div>
            )}

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="w-16 h-8" />
                  </div>
                ))
              ) : (
                syncManagerBrands.map(brand => {
                  const result = getResultForBrand(brand.brandSlug);
                  const specificResult = specificResults[brand.brandSlug];
                  const isProcessing = isRunning && state.currentOperation?.brandSlug === brand.brandSlug;
                  const hasSpecificScraper = BRAND_SPECIFIC_SCRAPERS[brand.brandSlug];

                  return (
                    <div key={brand.brandSlug} className="flex items-center justify-between p-3 border rounded-lg">
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
                            {brand.withTds}/{brand.totalProducts} with TDS ({brand.tdsCoverage}%)
                            {hasSpecificScraper && <Badge variant="outline" className="ml-2 text-xs">Has Scraper</Badge>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(result || specificResult) && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {result?.details?.tdsFound || result?.details?.discovered || specificResult?.found || 0} found
                          </Badge>
                        )}
                        <Badge variant={brand.tdsCoverage === 0 ? 'destructive' : brand.tdsCoverage < 50 ? 'secondary' : 'outline'}>
                          {brand.tdsCoverage}%
                        </Badge>
                        {hasSpecificScraper ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleRunSpecificScraper(brand.brandSlug, hasSpecificScraper)}
                            disabled={specificRunning !== null || isRunning}
                          >
                            {specificRunning === brand.brandSlug ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleDiscoverSingle(brand.brandSlug)} disabled={isRunning}>
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Discover'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button onClick={handleDiscoverSelected} disabled={isRunning || selectedBrands.size === 0} variant="secondary">
                Discover Selected ({selectedBrands.size})
              </Button>
              <Button onClick={handleDiscoverAll} disabled={isRunning || syncManagerBrands.length === 0}>
                {isRunning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : <>Discover All ({syncManagerBrands.length} brands)</>}
              </Button>
            </div>
          </TabsContent>

          {/* Parsing Tab */}
          <TabsContent value="parsing" className="space-y-4">
            {/* Overall Parsing Stats from live metrics */}
            <div className="grid grid-cols-4 gap-3 text-center p-3 bg-muted rounded-lg">
              <div className="p-2 bg-background rounded">
                <p className="text-2xl font-bold">{syncManagerBrands.length}</p>
                <p className="text-xs text-muted-foreground">Sync Brands</p>
              </div>
              <div className="p-2 bg-background rounded">
                <p className="text-2xl font-bold text-green-600">{tdsStats.withTds}</p>
                <p className="text-xs text-muted-foreground">With TDS</p>
              </div>
              <div className="p-2 bg-background rounded">
                <p className="text-2xl font-bold text-blue-600">{tdsStats.withParsing}</p>
                <p className="text-xs text-muted-foreground">Fully Parsed</p>
              </div>
              <div className="p-2 bg-background rounded">
                <p className="text-2xl font-bold text-primary">{tdsStats.parsingCoverage}%</p>
                <p className="text-xs text-muted-foreground">Parse Coverage</p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Batch TDS Parsing</p>
                  <p className="text-sm text-muted-foreground">Parse TDS PDFs to extract specifications using AI</p>
                </div>
                <Button onClick={handleBatchAudit} disabled={batchParseRunning} variant="outline">
                  {batchParseRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Run Audit'}
                </Button>
              </div>

              {batchAuditResult && (
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="p-2 bg-background rounded">
                    <p className="text-2xl font-bold">{batchAuditResult.summary.totalFilamentsWithTds}</p>
                    <p className="text-xs text-muted-foreground">With TDS URLs</p>
                  </div>
                  <div className="p-2 bg-background rounded">
                    <p className="text-2xl font-bold text-amber-600">{batchAuditResult.summary.totalNeedsParsing}</p>
                    <p className="text-xs text-muted-foreground">Need Parsing</p>
                  </div>
                  <div className="p-2 bg-background rounded">
                    <p className="text-2xl font-bold text-green-600">{batchAuditResult.summary.parsingCoverage}%</p>
                    <p className="text-xs text-muted-foreground">Parsed</p>
                  </div>
                  <div className="p-2 bg-background rounded">
                    <p className="text-2xl font-bold">{batchAuditResult.summary.totalBrandsWithTds}</p>
                    <p className="text-xs text-muted-foreground">Brands</p>
                  </div>
                </div>
              )}

              {/* All Sync Manager Brands Parsing Status */}
              <div className="space-y-2">
                <p className="text-sm font-medium">All Sync Manager Brands ({syncManagerBrands.length})</p>
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {syncManagerBrands.map(brand => {
                    const needsParsing = brand.withTds - brand.withFullParsing;
                    const parsePercent = brand.withTds > 0 
                      ? Math.round((brand.withFullParsing / brand.withTds) * 100) 
                      : 0;
                    return (
                      <div key={brand.brandSlug} className="flex justify-between items-center text-sm p-2 bg-background rounded">
                        <span>{brand.brandName}</span>
                        <div className="flex items-center gap-2">
                          <span className={needsParsing > 0 ? 'text-amber-600' : 'text-green-600'}>
                            {brand.withFullParsing}/{brand.withTds}
                          </span>
                          <Badge variant={parsePercent === 100 ? 'default' : parsePercent >= 50 ? 'secondary' : 'destructive'}>
                            {parsePercent}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleBatchParsePriority} 
                    disabled={batchParseRunning} 
                    variant="secondary"
                    className="flex-1"
                  >
                    {batchParseRunning ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Parsing...</>
                    ) : (
                      <>Parse Priority {dryRun ? '(Dry)' : ''}</>
                    )}
                  </Button>
                  <Button 
                    onClick={handleBatchParseAllSyncManager} 
                    disabled={batchParseRunning} 
                    className="flex-1"
                  >
                    {batchParseRunning ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Parsing...</>
                    ) : (
                      <>Parse All {SYNC_MANAGER_BRAND_COUNT} Brands {dryRun ? '(Dry)' : ''}</>
                    )}
                  </Button>
                </div>
              </div>

              {batchParseProgress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Processing: {batchParseProgress.brand || '...'}</span>
                    <span>{batchParseProgress.current} / {batchParseProgress.total}</span>
                  </div>
                  <Progress value={(batchParseProgress.current / batchParseProgress.total) * 100} />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Normalization Tab */}
          <TabsContent value="normalization" className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Specification Normalization</p>
                  <p className="text-sm text-muted-foreground">Validate and normalize extracted specifications</p>
                </div>
                <Button onClick={handleNormalizationAudit} disabled={normalizationRunning} variant="outline">
                  {normalizationRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Run Audit'}
                </Button>
              </div>

              {normalizationAudit && (
                <>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="p-2 bg-background rounded">
                      <p className="text-2xl font-bold">{normalizationAudit.summary.filamentsAnalyzed}</p>
                      <p className="text-xs text-muted-foreground">Analyzed</p>
                    </div>
                    <div className="p-2 bg-background rounded">
                      <p className="text-2xl font-bold text-amber-600">{normalizationAudit.summary.filamentsWithIssues}</p>
                      <p className="text-xs text-muted-foreground">With Issues</p>
                    </div>
                    <div className="p-2 bg-background rounded">
                      <p className="text-2xl font-bold text-red-600">{normalizationAudit.summary.errors}</p>
                      <p className="text-xs text-muted-foreground">Errors</p>
                    </div>
                    <div className="p-2 bg-background rounded">
                      <p className="text-2xl font-bold text-yellow-600">{normalizationAudit.summary.warnings}</p>
                      <p className="text-xs text-muted-foreground">Warnings</p>
                    </div>
                  </div>

                  {Object.keys(normalizationAudit.summary.issuesByField).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Issues by Field</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(normalizationAudit.summary.issuesByField)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 8)
                          .map(([field, count]) => (
                            <div key={field} className="flex justify-between p-2 bg-background rounded">
                              <span className="truncate">{field.replace(/_/g, ' ')}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {state.results.length > 0 && !isRunning && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Discovery Results</p>
            <div className="space-y-1 text-sm max-h-[200px] overflow-y-auto">
              {state.results.filter(r => r.operation.type === 'tds-discovery').map((result, i) => (
                <div key={i} className="flex items-center gap-2">
                  {result.success ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-destructive" />}
                  <span className="truncate">{result.operation.brandSlug}: {result.message}</span>
                  {result.success && result.details?.discovered > 0 && (
                    <Badge variant="outline" className="ml-auto">{result.details.discovered}</Badge>
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
