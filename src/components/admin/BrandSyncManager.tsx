import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Wand2, ChevronDown, Loader2, CheckCircle2, XCircle, AlertTriangle, Trash2, Zap, Settings2 } from "lucide-react";
import { useBrandSyncManager } from "@/hooks/useBrandSyncManager";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Slider } from "@/components/ui/slider";
import { PostSyncCheckPanel } from "./PostSyncCheckPanel";

interface Brand {
  id: string;
  brand_slug: string;
  brand_name: string;
  display_name: string;
  platform_type: string;
  product_count: number | null;
  last_scrape_at: string | null;
  scraping_enabled: boolean;
}

export function BrandSyncManager() {
  const [selectedBrandSlug, setSelectedBrandSlug] = useState<string>("");
  const [dryRun, setDryRun] = useState(true);
  const [cleanSlate, setCleanSlate] = useState(false);
  const [materialFilter, setMaterialFilter] = useState("");
  const [limit, setLimit] = useState<number>(100);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const {
    executeSync,
    deleteAllProducts,
    detectSyncFunction,
    hasBrandSpecificFunction,
    isLoading,
    isDeleting,
    progress,
    result,
    error,
    reset,
  } = useBrandSyncManager();

  // Fetch all brands
  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ['automated-brands-for-sync'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automated_brands')
        .select('id, brand_slug, brand_name, display_name, platform_type, product_count, last_scrape_at, scraping_enabled')
        .eq('scraping_enabled', true)
        .order('display_name');
      
      if (error) throw error;
      return data as Brand[];
    },
  });

  const selectedBrand = brands.find(b => b.brand_slug === selectedBrandSlug);
  const syncType = selectedBrandSlug ? detectSyncFunction(selectedBrandSlug) : null;

  const handleSync = async () => {
    if (!selectedBrand) return;
    
    await executeSync({
      brandSlug: selectedBrand.brand_slug,
      brandName: selectedBrand.brand_name,
      dryRun,
      cleanSlate,
      materialFilter: materialFilter || undefined,
      limit,
    });
  };

  const handleDeleteOnly = async () => {
    if (!selectedBrand) return;
    await deleteAllProducts(selectedBrand.brand_name);
  };

  const getSyncTypeBadge = () => {
    if (!syncType) return null;
    
    switch (syncType) {
      case 'specific':
        return (
          <Badge variant="default" className="bg-green-600">
            <Zap className="w-3 h-3 mr-1" />
            High-Fidelity Pipeline
          </Badge>
        );
      case 'special':
        return (
          <Badge variant="secondary" className="bg-blue-600 text-white">
            <Settings2 className="w-3 h-3 mr-1" />
            Dedicated Tab
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Generic Sync
          </Badge>
        );
    }
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          <CardTitle>Brand Sync Manager</CardTitle>
        </div>
        <CardDescription>
          Execute high-fidelity sync pipelines for any brand. Brands with dedicated sync functions will use optimized enrichment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Brand Selector */}
        <div className="space-y-2">
          <Label>Select Brand</Label>
          <div className="flex items-center gap-3">
            <Select 
              value={selectedBrandSlug} 
              onValueChange={(value) => {
                setSelectedBrandSlug(value);
                reset();
              }}
              disabled={brandsLoading}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose a brand to sync..." />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.brand_slug}>
                    <div className="flex items-center gap-2">
                      <span>{brand.display_name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({brand.platform_type})
                      </span>
                      {hasBrandSpecificFunction(brand.brand_slug) && (
                        <Zap className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getSyncTypeBadge()}
          </div>
        </div>

        {/* Brand Info */}
        {selectedBrand && (
          <div className="flex items-center gap-6 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <div>
              <span className="font-medium">Platform:</span> {selectedBrand.platform_type}
            </div>
            <div>
              <span className="font-medium">Products:</span> {selectedBrand.product_count || 0}
            </div>
            <div>
              <span className="font-medium">Last Sync:</span> {formatLastSync(selectedBrand.last_scrape_at)}
            </div>
          </div>
        )}

        {/* Basic Options */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
            <Label htmlFor="dry-run" className="cursor-pointer">
              Dry Run
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="clean-slate"
              checked={cleanSlate}
              onCheckedChange={setCleanSlate}
            />
            <Label htmlFor="clean-slate" className="cursor-pointer text-destructive">
              Clean Slate (Delete First)
            </Label>
          </div>
        </div>

        {/* Advanced Options */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              Advanced Options
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Material Filter</Label>
                <Input
                  placeholder="e.g., PLA, PETG"
                  value={materialFilter}
                  onChange={(e) => setMaterialFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Product Limit: {limit}</Label>
                <Slider
                  value={[limit]}
                  onValueChange={([val]) => setLimit(val)}
                  min={10}
                  max={500}
                  step={10}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSync}
            disabled={!selectedBrandSlug || isLoading || isDeleting || syncType === 'special'}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Execute Sync
              </>
            )}
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleDeleteOnly}
            disabled={!selectedBrandSlug || isLoading || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Delete Products Only
          </Button>
        </div>

        {/* Special Brand Warning */}
        {syncType === 'special' && (
          <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 text-blue-500" />
            <span>
              {selectedBrandSlug === 'bambu-lab' 
                ? 'Bambu Lab has a dedicated sync tab with material selection and queue support.'
                : 'Elegoo has a dedicated sync tab with region selection and catalog discovery.'}
            </span>
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{progress.stage}</span>
              <span className="text-muted-foreground">{progress.current}%</span>
            </div>
            <Progress value={progress.current} className="h-2" />
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-500/10 border-green-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
            <div className="flex items-center gap-2 mb-3">
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <span className="font-medium">
                {result.success ? 'Sync Completed' : 'Sync Failed'}
              </span>
              {result.duration_ms != null && (
                <span className="text-muted-foreground text-sm">
                  ({(result.duration_ms / 1000).toFixed(1)}s)
                </span>
              )}
            </div>
            
            {result.summary && (
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div className="text-lg font-semibold text-green-600">{result.summary.created}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Updated</div>
                  <div className="text-lg font-semibold text-blue-600">{result.summary.updated}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Skipped</div>
                  <div className="text-lg font-semibold text-muted-foreground">{result.summary.skipped}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Errors</div>
                  <div className="text-lg font-semibold text-destructive">{result.summary.errors}</div>
                </div>
              </div>
            )}

            {result.fieldCoverage && Object.keys(result.fieldCoverage).length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm font-medium mb-2">Field Coverage</div>
                <div className="flex flex-wrap gap-2">
                {Object.entries(result.fieldCoverage).map(([field, value]) => {
                    let displayValue: string;
                    if (typeof value === 'number') {
                      displayValue = `${value}%`;
                    } else if (value && typeof value === 'object' && 'percent' in value) {
                      displayValue = `${(value as { percent: number }).percent}%`;
                    } else {
                      displayValue = String(value);
                    }
                    return (
                      <Badge key={field} variant="outline" className="text-xs">
                        {field}: {displayValue}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {result.message && !result.summary && (
              <p className="text-sm text-muted-foreground">{result.message}</p>
            )}
          </div>
        )}

        {/* Timeout Warning */}
        {result?.timedOut && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span>
              The sync request timed out on the client side but likely completed in the background. 
              Run <strong>Post Sync Check</strong> below to verify the data.
            </span>
          </div>
        )}

        {/* Post Sync Check - shown after sync completes or times out */}
        {(result?.success || result?.timedOut) && selectedBrand && (
          <PostSyncCheckPanel 
            brandSlug={selectedBrand.brand_slug}
            brandName={selectedBrand.brand_name}
            disabled={isLoading}
          />
        )}

        {/* Error */}
        {error && !result && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            <XCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
