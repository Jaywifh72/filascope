import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FlaskConical, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtractionConfig {
  priceSectionAnchor?: string;
  pricePatterns?: string[];
  excludePatterns?: string[];
  priceRangeMin?: number;
  priceRangeMax?: number;
  currencyDetection?: string;
}

interface BrandConfig {
  id: string;
  brand_name: string;
  brand_slug: string;
  base_url: string;
  extraction_method: string | null;
  price_extraction_config: Record<string, unknown> | null;
  test_product_url: string | null;
  last_extraction_test_at: string | null;
  extraction_working: boolean | null;
  extraction_success_rate: number | null;
}

interface TestResult {
  success: boolean;
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  method: string;
  matchedPattern: string | null;
  rawSample: string;
  responseTimeMs: number;
  error?: string;
}

interface LiveTestResult {
  success: boolean;
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  source: string;
  available: boolean;
  fetchedAt: string;
  error?: string;
  is404?: boolean;
  dbData?: {
    filament_id: string;
    product_title: string;
    current_db_price: number | null;
    compare_at_price: number | null;
    last_scraped: string | null;
    price_source: string | null;
    vendor: string | null;
  };
}

interface BrandExtractionEditorProps {
  brand: BrandConfig;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function BrandExtractionEditor({ brand, open, onClose, onSave }: BrandExtractionEditorProps) {
  const { toast } = useToast();
  const config = (brand.price_extraction_config || {}) as ExtractionConfig;
  
  const [extractionMethod, setExtractionMethod] = useState(brand.extraction_method || 'auto');
  const [testUrl, setTestUrl] = useState(brand.test_product_url || '');
  const [anchorText, setAnchorText] = useState(config.priceSectionAnchor || '');
  const [pricePatterns, setPricePatterns] = useState((config.pricePatterns || []).join('\n'));
  const [excludePatterns, setExcludePatterns] = useState((config.excludePatterns || []).join('\n'));
  const [priceRangeMin, setPriceRangeMin] = useState(config.priceRangeMin?.toString() || '10');
  const [priceRangeMax, setPriceRangeMax] = useState(config.priceRangeMax?.toString() || '150');
  
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [liveTestResult, setLiveTestResult] = useState<LiveTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isLiveTesting, setIsLiveTesting] = useState(false);

  const buildConfig = (): ExtractionConfig => ({
    priceSectionAnchor: anchorText || undefined,
    pricePatterns: pricePatterns.split('\n').filter(p => p.trim()),
    excludePatterns: excludePatterns.split('\n').filter(p => p.trim()),
    priceRangeMin: parseFloat(priceRangeMin) || 3,
    priceRangeMax: parseFloat(priceRangeMax) || 150,
  });

  const testExtraction = async () => {
    if (!testUrl) {
      toast({ title: "Error", description: "Please enter a test URL", variant: "destructive" });
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-price-extraction', {
        body: {
          productUrl: testUrl,
          config: buildConfig(),
          currency: 'USD',
        },
      });
      
      if (error) throw error;
      setTestResult(data as TestResult);
      
      if (data.success) {
        toast({ title: "Success", description: `Extracted price: $${data.price}` });
      } else {
        toast({ title: "Extraction Failed", description: data.error || "Could not extract price", variant: "destructive" });
      }
    } catch (err) {
      toast({ 
        title: "Test Failed", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Live production test using get-current-price with forceRefresh
  const liveProductionTest = async () => {
    if (!testUrl) {
      toast({ title: "Error", description: "Please enter a test URL", variant: "destructive" });
      return;
    }
    
    setIsLiveTesting(true);
    setLiveTestResult(null);
    
    try {
      // First, get current DB data for comparison
      const { data: dbData } = await supabase.rpc('test_price_extraction', { p_url: testUrl });
      const dbDataParsed = dbData as Record<string, unknown> | null;
      
      // Then call the live edge function
      const { data, error } = await supabase.functions.invoke('get-current-price', {
        body: {
          productUrl: testUrl,
          preferredCurrency: 'USD',
          forceRefresh: true,
        },
      });
      
      if (error) throw error;
      
      const hasDbError = dbDataParsed && typeof dbDataParsed === 'object' && 'error' in dbDataParsed;
      const result: LiveTestResult = {
        ...data,
        dbData: hasDbError ? undefined : dbDataParsed as LiveTestResult['dbData'],
      };
      
      setLiveTestResult(result);
      
      const dbPrice = dbDataParsed?.current_db_price;
      if (data.success) {
        toast({ 
          title: "Live Test Success", 
          description: `Extracted: $${data.price} (DB: $${dbPrice || 'N/A'})`
        });
      } else {
        toast({ 
          title: "Live Test Failed", 
          description: data.error || "Could not extract price", 
          variant: "destructive" 
        });
      }
    } catch (err) {
      toast({ 
        title: "Live Test Failed", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsLiveTesting(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const configToSave = JSON.parse(JSON.stringify(buildConfig()));
      const { error } = await supabase
        .from('automated_brands')
        .update({
          extraction_method: extractionMethod,
          price_extraction_config: configToSave,
          test_product_url: testUrl || null,
          last_extraction_test_at: testResult?.success ? new Date().toISOString() : brand.last_extraction_test_at,
          extraction_working: testResult ? testResult.success : brand.extraction_working,
        })
        .eq('id', brand.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Extraction configuration updated" });
      onSave();
    },
    onError: (err) => {
      toast({ 
        title: "Save Failed", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive" 
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure: {brand.brand_name}</DialogTitle>
          <DialogDescription>
            Set up price extraction patterns for {brand.base_url}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Method Selection */}
          <div className="space-y-2">
            <Label>Extraction Method</Label>
            <Select value={extractionMethod} onValueChange={setExtractionMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (detect platform)</SelectItem>
                <SelectItem value="shopify_json">Shopify JSON API</SelectItem>
                <SelectItem value="firecrawl">Firecrawl (scrape page)</SelectItem>
                <SelectItem value="custom">Custom patterns only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Patterns Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Price Patterns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Anchor Text (regex)</Label>
                <Input
                  placeholder="Add to Cart|Buy Now"
                  value={anchorText}
                  onChange={(e) => setAnchorText(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Text near the price to focus extraction. Regex supported.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Price Patterns (one per line)</Label>
                <Textarea
                  placeholder="\\$([\\d,]+(?:\\.\\d{2})?)\\s*USD"
                  value={pricePatterns}
                  onChange={(e) => setPricePatterns(e.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Regex patterns to extract price. First capture group should be the price value.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Exclude Patterns (one per line)</Label>
                <Textarea
                  placeholder="coupon|bundle|pack of \\d{2,}"
                  value={excludePatterns}
                  onChange={(e) => setExcludePatterns(e.target.value)}
                  rows={2}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Patterns to filter out (e.g., coupons, bundles).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Price ($)</Label>
                  <Input
                    type="number"
                    value={priceRangeMin}
                    onChange={(e) => setPriceRangeMin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Price ($)</Label>
                  <Input
                    type="number"
                    value={priceRangeMax}
                    onChange={(e) => setPriceRangeMax(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                Test Extraction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://store.example.com/products/filament"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="secondary" 
                  onClick={testExtraction}
                  disabled={isTesting || isLiveTesting || !testUrl}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Config"
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={liveProductionTest}
                  disabled={isTesting || isLiveTesting || !testUrl}
                  title="Test with actual production edge function"
                >
                  {isLiveTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Live...
                    </>
                  ) : (
                    "Live Test"
                  )}
                </Button>
                {testUrl && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={testUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>

              {/* Config Test Result */}
              {testResult && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-medium">
                      {testResult.success ? "Config Test Successful" : "Config Test Failed"}
                    </span>
                    <Badge variant="outline" className="text-xs">test-price-extraction</Badge>
                  </div>
                  
                  {testResult.success && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Price:</span>{" "}
                        <span className="font-mono font-medium">${testResult.price}</span>
                      </div>
                      {testResult.compareAtPrice && (
                        <div>
                          <span className="text-muted-foreground">Compare at:</span>{" "}
                          <span className="font-mono line-through">${testResult.compareAtPrice}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Response:</span>{" "}
                        <span>{testResult.responseTimeMs}ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pattern:</span>{" "}
                        <Badge variant="outline" className="font-mono text-xs">
                          {testResult.matchedPattern || 'none'}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {testResult.error && (
                    <p className="text-sm text-destructive">{testResult.error}</p>
                  )}
                  
                  {testResult.rawSample && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">
                        Raw content sample ({testResult.rawSample.length} chars)
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-40">
                        {testResult.rawSample}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Live Production Test Result */}
              {liveTestResult && (
                <div className="rounded-lg border border-primary/50 p-4 space-y-3 bg-primary/5">
                  <div className="flex items-center gap-2">
                    {liveTestResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-medium">
                      {liveTestResult.success ? "Live Production Test" : "Live Test Failed"}
                    </span>
                    <Badge variant="secondary" className="text-xs">get-current-price</Badge>
                    {liveTestResult.is404 && (
                      <Badge variant="destructive" className="text-xs">404 Detected</Badge>
                    )}
                  </div>
                  
                  {/* Comparison Table */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Live Extraction</p>
                      <p className="font-mono text-lg">
                        {liveTestResult.price ? `$${liveTestResult.price}` : 'N/A'}
                      </p>
                      {liveTestResult.compareAtPrice && (
                        <p className="text-xs text-muted-foreground line-through">
                          ${liveTestResult.compareAtPrice}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Source: {liveTestResult.source}
                      </p>
                    </div>
                    
                    {liveTestResult.dbData && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Database (Current)</p>
                        <p className="font-mono text-lg">
                          {liveTestResult.dbData.current_db_price ? `$${liveTestResult.dbData.current_db_price}` : 'N/A'}
                        </p>
                        {liveTestResult.dbData.compare_at_price && (
                          <p className="text-xs text-muted-foreground line-through">
                            ${liveTestResult.dbData.compare_at_price}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Source: {liveTestResult.dbData.price_source || 'unknown'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Price Mismatch Warning */}
                  {liveTestResult.success && liveTestResult.dbData && 
                   liveTestResult.price !== liveTestResult.dbData.current_db_price && (
                    <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/20 p-2 rounded">
                      ⚠️ Price mismatch: Live extraction got ${liveTestResult.price} but DB shows ${liveTestResult.dbData.current_db_price}
                    </div>
                  )}
                  
                  {liveTestResult.error && (
                    <p className="text-sm text-destructive font-mono">{liveTestResult.error}</p>
                  )}
                  
                  {liveTestResult.dbData && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">
                        Database details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(liveTestResult.dbData, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
