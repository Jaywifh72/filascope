import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  RefreshCw, 
  ExternalLink, 
  Image, 
  FileText, 
  Palette, 
  DollarSign, 
  Barcode,
  ChevronDown,
  ChevronRight,
  Settings2,
  History,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { useBrandSync } from "@/hooks/useBrandSync";
import { useBrandDataQuality } from "@/hooks/useBrandDataQuality";
import { useBrandSyncJob, useRecentBrandSyncJobs } from "@/hooks/useBrandSyncJob";
import { BrandSyncResultPanel } from "./BrandSyncResultPanel";
import { BrandSyncResult } from "@/types/brand-sync";
import { formatDistanceToNow, format } from "date-fns";

interface BrandSyncPanelProps {
  brand: {
    brand_slug: string;
    brand_name: string;
    display_name: string;
    platform_type: string;
    base_url: string;
    product_count: number | null;
    products_with_prices: number | null;
    products_with_images: number | null;
    products_with_tds: number | null;
    products_with_color_hex: number | null;
    products_with_mpn: number | null;
    products_with_codes: number | null;
    last_scrape_at: string | null;
    scraping_enabled: boolean | null;
    scraping_active: boolean | null;
    supported_regions?: string[] | null;
  };
  onSyncComplete?: () => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  shopify: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  woocommerce: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  bigcommerce: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  amazon: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  firecrawl: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function BrandSyncPanel({ brand, onSyncComplete }: BrandSyncPanelProps) {
  const [dryRun, setDryRun] = useState(true);
  const [materialFilter, setMaterialFilter] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [syncResult, setSyncResult] = useState<BrandSyncResult | null>(null);
  
  const { syncBrand, isLoading, currentJobId } = useBrandSync();
  const { data: quality, isLoading: qualityLoading } = useBrandDataQuality(brand.brand_slug);
  const { job, isRunning: jobRunning, progressPercent } = useBrandSyncJob(currentJobId);
  const { jobs: recentJobs, isLoading: jobsLoading } = useRecentBrandSyncJobs(brand.brand_slug, 5);

  const handleSync = async () => {
    setSyncResult(null);
    const result = await syncBrand({
      brandSlug: brand.brand_slug,
      dryRun,
      materialFilter: materialFilter || undefined,
      tasks: ['products'],
    });

    if (result.success && onSyncComplete) {
      onSyncComplete();
    }

    // Transform to BrandSyncResult format if we have detailed data
    if (result.success && result.summary) {
      const mockResult: BrandSyncResult = {
        success: true,
        jobId: result.jobId || '',
        brandSlug: brand.brand_slug,
        platform: brand.platform_type,
        dryRun,
        summary: {
          totalDiscovered: result.summary.total || 0,
          created: result.summary.created || 0,
          updated: result.summary.updated || 0,
          skipped: result.summary.skipped || 0,
          errors: result.summary.errors || 0,
        },
        products: [],
        fieldCoverage: {
          images: { count: 0, percent: 0 },
          prices: { count: 0, percent: 0 },
          tds: { count: 0, percent: 0 },
          colors: { count: 0, percent: 0 },
          mpn: { count: 0, percent: 0 },
          specifications: { count: 0, percent: 0 },
        },
        duration_ms: 0,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
      setSyncResult(mockResult);
    }
  };

  const total = brand.product_count || 0;
  const completeness = quality?.completenessScore ?? 0;

  const stats = [
    { 
      label: 'Prices', 
      value: brand.products_with_prices || 0, 
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400'
    },
    { 
      label: 'Images', 
      value: brand.products_with_images || 0, 
      icon: Image,
      color: 'text-blue-600 dark:text-blue-400'
    },
    { 
      label: 'TDS', 
      value: brand.products_with_tds || 0, 
      icon: FileText,
      color: 'text-purple-600 dark:text-purple-400'
    },
    { 
      label: 'Colors', 
      value: brand.products_with_color_hex || 0, 
      icon: Palette,
      color: 'text-pink-600 dark:text-pink-400'
    },
    { 
      label: 'MPN', 
      value: brand.products_with_mpn || 0, 
      icon: Barcode,
      color: 'text-orange-600 dark:text-orange-400'
    },
  ];

  const isActive = isLoading || brand.scraping_active || jobRunning;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">{brand.display_name}</CardTitle>
              <Badge className={PLATFORM_COLORS[brand.platform_type] || 'bg-muted'}>
                {brand.platform_type}
              </Badge>
              {isActive && (
                <Badge variant="outline" className="animate-pulse">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Syncing
                </Badge>
              )}
            </div>
            <a 
              href={brand.base_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <CardDescription className="flex items-center gap-4 mt-1">
            <span>{total} products</span>
            {brand.supported_regions && brand.supported_regions.length > 1 && (
              <span className="text-xs">{brand.supported_regions.length} regions</span>
            )}
            {brand.last_scrape_at && (
              <span className="text-xs">
                Last sync: {formatDistanceToNow(new Date(brand.last_scrape_at), { addSuffix: true })}
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar (when syncing) */}
          {isActive && job?.progress && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {job.progress.stage === 'fetching' && 'Fetching products...'}
                  {job.progress.stage === 'processing' && `Processing ${job.progress.currentProduct || ''}...`}
                  {job.progress.stage === 'saving' && 'Saving to database...'}
                  {job.progress.currentRegion && ` (${job.progress.currentRegion})`}
                </span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {job.progress.productsProcessed} / {job.progress.totalProducts} products
                {job.progress.totalRegions > 1 && ` • ${job.progress.regionsProcessed}/${job.progress.totalRegions} regions`}
              </p>
            </div>
          )}

          {/* Data Quality Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Data Completeness</span>
              <span className="font-medium">{completeness}%</span>
            </div>
            <Progress value={completeness} className="h-2" />
          </div>

          {/* Field Coverage Stats */}
          <div className="grid grid-cols-5 gap-2">
            {stats.map(stat => {
              const percentage = total > 0 ? Math.round((stat.value / total) * 100) : 0;
              return (
                <div 
                  key={stat.label} 
                  className="flex flex-col items-center p-2 rounded-lg bg-muted/50"
                >
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs font-medium mt-1">{percentage}%</span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              );
            })}
          </div>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  <span>Advanced Options</span>
                </div>
                {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label htmlFor={`material-${brand.brand_slug}`} className="text-sm">Material Filter</Label>
                <Input
                  id={`material-${brand.brand_slug}`}
                  placeholder="e.g., PLA, PETG"
                  value={materialFilter}
                  onChange={(e) => setMaterialFilter(e.target.value)}
                  className="h-8"
                />
              </div>
              {brand.supported_regions && brand.supported_regions.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-sm">Regions</Label>
                  <div className="flex flex-wrap gap-2">
                    {brand.supported_regions.map(region => (
                      <Badge key={region} variant="outline" className="text-xs">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Sync Controls */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`dry-run-${brand.brand_slug}`}
                checked={dryRun}
                onCheckedChange={(checked) => setDryRun(checked === true)}
              />
              <Label 
                htmlFor={`dry-run-${brand.brand_slug}`} 
                className="text-sm font-normal cursor-pointer"
              >
                Dry run
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="w-4 h-4 mr-1" />
                History
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={isActive || !brand.scraping_enabled}
              >
                {isActive ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                Sync
              </Button>
            </div>
          </div>

          {/* Recent Sync History */}
          {showHistory && (
            <div className="pt-3 border-t space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <History className="w-4 h-4" />
                Recent Syncs
              </h4>
              <ScrollArea className="h-[150px]">
                {recentJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">No sync history</p>
                ) : (
                  <div className="space-y-2">
                    {recentJobs.map(j => (
                      <div 
                        key={j.id} 
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          {j.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : j.status === 'failed' ? (
                            <XCircle className="w-4 h-4 text-destructive" />
                          ) : (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          <div>
                            <p className="text-xs font-medium">
                              {j.products_discovered || 0} discovered
                              {j.products_created ? `, ${j.products_created} created` : ''}
                              {j.products_updated ? `, ${j.products_updated} updated` : ''}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(j.started_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {j.duration_seconds && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {Math.round(j.duration_seconds)}s
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Results */}
      {syncResult && (
        <BrandSyncResultPanel result={syncResult} />
      )}
    </div>
  );
}
