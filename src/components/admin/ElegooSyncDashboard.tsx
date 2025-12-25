import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Image, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Database,
  TrendingUp,
  FileText,
  BarChart3
} from "lucide-react";
import { SyncActivityLog } from "./SyncActivityLog";
import { SyncSummaryCard } from "./SyncSummaryCard";

interface DataQualityMetrics {
  totalProducts: number;
  withImages: number;
  imagesCoverage: number;
  withUSUrl: number;
  withCAUrl: number;
  withEUUrl: number;
  withAUUrl: number;
  withPrice: number;
  priceCoverage: number;
  missingImages: number;
}

interface SyncStatus {
  isRunning: boolean;
  phase: string;
  progress: number;
  lastSync?: string;
  jobId?: string;
}

export function ElegooSyncDashboard() {
  const [metrics, setMetrics] = useState<DataQualityMetrics | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    phase: "idle",
    progress: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState({
    dryRun: true,
    skipImageFix: false,
    skipProductSync: false,
    regions: ["US", "CA", "EU", "AU"],
  });
  const [activeTab, setActiveTab] = useState("progress");

  // Fetch data quality metrics
  const fetchMetrics = async () => {
    try {
      // Get exact total count first
      const { count: totalCount, error: countError } = await supabase
        .from("filaments")
        .select("*", { count: "exact", head: true })
        .eq("vendor", "Elegoo");

      if (countError) throw countError;

      const total = totalCount || 0;

      // Fetch all products with extended range (up to 2000)
      const { data, error } = await supabase
        .from("filaments")
        .select("id, featured_image, product_url, product_url_ca, product_url_eu, product_url_au, variant_price")
        .eq("vendor", "Elegoo")
        .range(0, 1999); // Fetch up to 2000 products

      if (error) throw error;

      const withImages = data?.filter(f => f.featured_image).length || 0;
      const withUSUrl = data?.filter(f => f.product_url).length || 0;
      const withCAUrl = data?.filter(f => f.product_url_ca).length || 0;
      const withEUUrl = data?.filter(f => f.product_url_eu).length || 0;
      const withAUUrl = data?.filter(f => f.product_url_au).length || 0;
      const withPrice = data?.filter(f => f.variant_price).length || 0;

      setMetrics({
        totalProducts: total,
        withImages,
        imagesCoverage: total > 0 ? Math.round((withImages / total) * 100) : 0,
        withUSUrl,
        withCAUrl,
        withEUUrl,
        withAUUrl,
        withPrice,
        priceCoverage: total > 0 ? Math.round((withPrice / total) * 100) : 0,
        missingImages: total - withImages,
      });
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    }
  };

  // Check for active sync jobs - check all job types
  const checkSyncStatus = async () => {
    try {
      // Check for running jobs with any elegoo job type
      const { data, error } = await supabase
        .from("scrape_jobs")
        .select("*")
        .in("job_type", ["elegoo_full_sync", "elegoo_sync", "fix_elegoo_images", "scrape_variant_images"])
        .eq("status", "running")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const progress = data.progress as any;
        const regionsProcessed = progress?.regionsProcessed || 0;
        const totalRegions = progress?.totalRegions || 1;
        const phase = progress?.phase || "running";
        
        // Calculate progress based on phase
        let progressPercent = 0;
        if (phase === 'regions') {
          progressPercent = Math.round((regionsProcessed / totalRegions) * 60); // 0-60% for regions
        } else if (phase === 'images') {
          progressPercent = 60 + Math.round((progress?.imagesFixed || 0) / Math.max(progress?.total || 1, 1) * 25); // 60-85%
        } else if (phase === 'quality') {
          progressPercent = 90; // 90% during quality check
        }

        setSyncStatus({
          isRunning: true,
          phase: progress?.currentRegion || phase,
          progress: progressPercent,
          jobId: data.id,
        });
        
        // Auto-switch to activity log when running
        if (activeTab === "summary") {
          setActiveTab("activity");
        }
      } else {
        // Get last completed sync (any type)
        const { data: lastJob } = await supabase
          .from("scrape_jobs")
          .select("*")
          .in("job_type", ["elegoo_full_sync", "elegoo_sync", "fix_elegoo_images", "scrape_variant_images"])
          .in("status", ["completed", "completed_with_errors", "failed"])
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const wasRunning = syncStatus.isRunning;
        
        setSyncStatus({
          isRunning: false,
          phase: "idle",
          progress: 0,
          lastSync: lastJob?.completed_at,
          jobId: lastJob?.id,
        });
        
        // Auto-switch to summary when job completes
        if (wasRunning && lastJob) {
          setActiveTab("summary");
        }
      }
    } catch (err) {
      console.error("Failed to check sync status:", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    checkSyncStatus();
    
    // Poll for updates
    const interval = setInterval(() => {
      if (syncStatus.isRunning) {
        checkSyncStatus();
        fetchMetrics();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [syncStatus.isRunning]);

  const handleStartSync = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("elegoo-full-sync", {
        body: {
          dryRun: options.dryRun,
          skipImageFix: options.skipImageFix,
          skipProductSync: options.skipProductSync,
          regions: options.regions,
        },
      });

      if (error) throw error;

      toast.success(
        options.dryRun 
          ? "Dry run completed - no changes made" 
          : "Full sync started successfully"
      );

      setSyncStatus({
        isRunning: !options.dryRun,
        phase: "starting",
        progress: 5,
        jobId: data?.jobId,
      });
      
      // Switch to activity log
      if (!options.dryRun) {
        setActiveTab("activity");
      }

      // Refresh metrics after sync
      setTimeout(fetchMetrics, 2000);
    } catch (err) {
      console.error("Sync failed:", err);
      toast.error("Failed to start sync: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixImages = async () => {
    setIsLoading(true);
    let newJobId: string | null = null;
    
    try {
      // 1. Create a job record first
      const { data: jobData, error: jobError } = await supabase
        .from('scrape_jobs')
        .insert({
          job_type: 'fix_elegoo_images',
          status: 'running',
          dry_run: options.dryRun,
          progress: { phase: 'images', started: new Date().toISOString() }
        })
        .select()
        .single();
      
      if (jobError) throw jobError;
      newJobId = jobData.id;
      
      // Update state so ActivityLog can subscribe
      setSyncStatus(prev => ({
        ...prev,
        isRunning: true,
        phase: 'images',
        progress: 10,
        jobId: newJobId!,
      }));
      setActiveTab('activity'); // Switch to activity tab
      
      // 2. Call edge function WITH jobId
      const { data, error } = await supabase.functions.invoke("fix-elegoo-images", {
        body: {
          dryRun: options.dryRun,
          forceUpdate: false,
          limit: 500,
          jobId: newJobId,
        },
      });

      if (error) throw error;
      
      // 3. Update job as completed
      await supabase
        .from('scrape_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          results: data,
          progress: { phase: 'completed', ...data.stats }
        })
        .eq('id', newJobId);

      toast.success(
        `Image fix ${options.dryRun ? "(dry run)" : ""}: ${data?.stats?.updated || 0} updated, ${data?.stats?.skipped || 0} skipped`
      );
      
      setActiveTab('summary'); // Switch to summary when done
      fetchMetrics();
    } catch (err) {
      console.error("Image fix failed:", err);
      // Mark job as failed
      if (newJobId) {
        await supabase
          .from('scrape_jobs')
          .update({ 
            status: 'failed', 
            completed_at: new Date().toISOString(),
            error: String(err) 
          })
          .eq('id', newJobId);
      }
      toast.error("Failed to fix images: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsLoading(false);
      setSyncStatus(prev => ({ ...prev, isRunning: false }));
      checkSyncStatus(); // Refresh to get final job state
    }
  };

  const handleScrapeVariantImages = async () => {
    setIsLoading(true);
    let newJobId: string | null = null;
    
    try {
      // 1. Create a job record first
      const { data: jobData, error: jobError } = await supabase
        .from('scrape_jobs')
        .insert({
          job_type: 'scrape_variant_images',
          status: 'running',
          dry_run: options.dryRun,
          progress: { phase: 'variants', regions: options.regions, started: new Date().toISOString() }
        })
        .select()
        .single();
      
      if (jobError) throw jobError;
      newJobId = jobData.id;
      
      // Update state so ActivityLog can subscribe
      setSyncStatus(prev => ({
        ...prev,
        isRunning: true,
        phase: 'variants',
        progress: 10,
        jobId: newJobId!,
      }));
      setActiveTab('activity'); // Switch to activity tab
      
      // 2. Call edge function WITH jobId
      const { data, error } = await supabase.functions.invoke("scrape-elegoo-variant-images", {
        body: {
          dryRun: options.dryRun,
          regions: options.regions,
          onlyMissingImages: true,
          limit: 200,
          jobId: newJobId,
        },
      });

      if (error) throw error;
      
      // 3. Update job as completed
      await supabase
        .from('scrape_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          results: data,
          progress: { phase: 'completed', ...data.summary }
        })
        .eq('id', newJobId);

      toast.success(
        `Variant scrape ${options.dryRun ? "(dry run)" : ""}: ${data?.summary?.updated || 0} updated`
      );
      
      setActiveTab('summary'); // Switch to summary when done
      fetchMetrics();
    } catch (err) {
      console.error("Variant scrape failed:", err);
      // Mark job as failed
      if (newJobId) {
        await supabase
          .from('scrape_jobs')
          .update({ 
            status: 'failed', 
            completed_at: new Date().toISOString(),
            error: String(err) 
          })
          .eq('id', newJobId);
      }
      toast.error("Failed to scrape variant images: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsLoading(false);
      setSyncStatus(prev => ({ ...prev, isRunning: false }));
      checkSyncStatus(); // Refresh to get final job state
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Elegoo Data Pipeline
            </CardTitle>
            <CardDescription>
              Sync products, fix images, and track data quality for Elegoo filaments
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { fetchMetrics(); checkSyncStatus(); }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Quality Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                Total Products
              </div>
              <div className="text-2xl font-bold">{metrics.totalProducts}</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Image className="h-4 w-4" />
                Images Coverage
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{metrics.imagesCoverage}%</span>
                {metrics.missingImages > 0 && (
                  <Badge variant="outline" className="text-amber-600">
                    {metrics.missingImages} missing
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                Regional URLs
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">US: {metrics.withUSUrl}</Badge>
                <Badge variant="outline">CA: {metrics.withCAUrl}</Badge>
                <Badge variant="outline">EU: {metrics.withEUUrl}</Badge>
                <Badge variant="outline">AU: {metrics.withAUUrl}</Badge>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Pricing Coverage
              </div>
              <div className="text-2xl font-bold">{metrics.priceCoverage}%</div>
            </div>
          </div>
        )}

        {/* Sync Status */}
        {syncStatus.isRunning && (
          <div className="p-4 bg-primary/5 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="font-medium">Sync in Progress</span>
              </div>
              <Badge>{syncStatus.phase}</Badge>
            </div>
            <Progress value={syncStatus.progress} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {syncStatus.progress}% complete
            </div>
          </div>
        )}

        {syncStatus.lastSync && !syncStatus.isRunning && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
          </div>
        )}

        {/* Sync Options */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
          <div className="text-sm font-medium">Sync Options</div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dryRun"
                checked={options.dryRun}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, dryRun: !!checked }))
                }
              />
              <Label htmlFor="dryRun" className="text-sm">
                Dry Run (no changes)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipProductSync"
                checked={options.skipProductSync}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, skipProductSync: !!checked }))
                }
              />
              <Label htmlFor="skipProductSync" className="text-sm">
                Skip Product Sync
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipImageFix"
                checked={options.skipImageFix}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, skipImageFix: !!checked }))
                }
              />
              <Label htmlFor="skipImageFix" className="text-sm">
                Skip Image Fix
              </Label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleStartSync}
            disabled={isLoading || syncStatus.isRunning}
            className="gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Run Full Sync
          </Button>

          <Button
            variant="outline"
            onClick={handleFixImages}
            disabled={isLoading}
            className="gap-2"
          >
            <Image className="h-4 w-4" />
            Fix Missing Images
          </Button>

          <Button
            variant="outline"
            onClick={handleScrapeVariantImages}
            disabled={isLoading}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            Scrape Variant Images
          </Button>
        </div>

        {/* Activity Log & Summary Tabs */}
        {syncStatus.jobId && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activity" className="gap-2">
                <FileText className="h-4 w-4" />
                Activity Log
              </TabsTrigger>
              <TabsTrigger value="summary" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Summary
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity" className="mt-4">
              <SyncActivityLog 
                jobId={syncStatus.jobId} 
                maxHeight="350px"
              />
            </TabsContent>
            
            <TabsContent value="summary" className="mt-4">
              <SyncSummaryCard jobId={syncStatus.jobId} />
            </TabsContent>
          </Tabs>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p className="flex items-start gap-1">
            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
            Full Sync: Fetches products from Impact.com API, then fixes images via Shopify.
          </p>
          <p className="flex items-start gap-1">
            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
            Fix Images: Uses Firecrawl + Shopify JSON API to match color variants to images.
          </p>
          <p className="flex items-start gap-1">
            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
            Variant Images: Scrapes regional Shopify stores for per-variant images.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}