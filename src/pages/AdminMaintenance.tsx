import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Loader2, Palette, Archive, Layers, ShoppingBag, Info, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { BambuLabRegionalDashboard } from "@/components/admin/BambuLabRegionalDashboard";
import { BambuScrapeProgress, BambuScrapeJobRow } from "@/components/admin/BambuScrapeProgress";
import { BambuScrapeQueueProgress } from "@/components/admin/BambuScrapeQueueProgress";
import { ScrapeAnalyticsWidget } from "@/components/admin/ScrapeAnalyticsWidget";
import { AIScrapeLogsCard } from "@/components/admin/AIScrapeLogsCard";
import { ScrapeProgressBanner } from "@/components/admin/ScrapeProgressBanner";
import { ElegooSyncProgress } from "@/components/admin/ElegooSyncProgress";
import { TdsParsingStatus } from "@/components/admin/TdsParsingStatus";
import { SyncQualityCheckPanel } from "@/components/admin/SyncQualityCheckPanel";
import { useStartBambuScrapeJob, useRecentScrapeJobs, ScrapeJob } from "@/hooks/useBambuScrapeJob";
import { useBambuScrapeQueue } from "@/hooks/useBambuScrapeQueue";
import { useActiveScrapeJob } from "@/hooks/useActiveScrapeJob";
import { useElegooSync } from "@/hooks/useElegooSync";
import { useActiveElegooSyncJob } from "@/hooks/useActiveElegooSyncJob";

interface CatalogInfo {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  status: string;
  location?: string;
  currency?: string;
  serviceAreas?: string[];
  region?: string;
  active?: boolean;
}

const AdminMaintenance = () => {
  const [bambuColorsDryRun, setBambuColorsDryRun] = useState(true);
  const [bambuMaterials, setBambuMaterials] = useState<string[]>(['PLA']);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  
  // Elegoo state
  const [elegooDryRun, setElegooDryRun] = useState(true);
  const [elegooMaterialFilter, setElegooMaterialFilter] = useState<string>('');
  const [elegooSelectedRegions, setElegooSelectedRegions] = useState<string[]>(['US']);
  const [tdsRefreshTrigger, setTdsRefreshTrigger] = useState(0);

  const ELEGOO_REGION_OPTIONS = [
    { id: 'ALL', label: 'All Regions' },
    { id: 'US', label: 'US' },
    { id: 'AU', label: 'AU' },
    { id: 'CA', label: 'CA' },
    { id: 'EU', label: 'EU' },
    { id: 'UK', label: 'UK' },
    { id: 'DE', label: 'DE' },
    { id: 'IT', label: 'IT' },
    { id: 'FR', label: 'FR' },
    { id: 'ES', label: 'ES' },
  ];
  
  const BAMBU_MATERIAL_OPTIONS = [
    { id: 'PLA', label: 'PLA', count: 17 },
    { id: 'PETG', label: 'PETG', count: 3 },
    { id: 'TPU', label: 'TPU', count: 3 },
    { id: 'ABS', label: 'ABS', count: 2 },
    { id: 'ASA', label: 'ASA', count: 3 },
    { id: 'PA', label: 'PA (Nylon)', count: 4 },
    { id: 'PET', label: 'PET', count: 1 },
    { id: 'PC', label: 'PC', count: 2 },
    { id: 'PPS', label: 'PPS', count: 1 },
    { id: 'Support', label: 'Support', count: 5 },
  ];

  const ELEGOO_MATERIAL_OPTIONS = [
    { id: '', label: 'All Materials' },
    // Standard PLA variants
    { id: 'PLA', label: 'PLA' },
    { id: 'PLA Basic', label: 'PLA Basic' },
    { id: 'PLA Plus', label: 'PLA Plus' },
    { id: 'PLA+', label: 'PLA+' },
    // Specialty PLA variants
    { id: 'PLA Matte', label: 'PLA Matte' },
    { id: 'PLA Silk', label: 'PLA Silk' },
    { id: 'PLA Galaxy', label: 'PLA Galaxy' },
    { id: 'PLA Marble', label: 'PLA Marble' },
    { id: 'PLA Metal', label: 'PLA Metal' },
    { id: 'PLA-CF', label: 'PLA-CF' },
    { id: 'Rapid PLA', label: 'Rapid PLA Plus' },
    // PETG variants
    { id: 'PETG', label: 'PETG' },
    { id: 'PETG-CF', label: 'PETG-CF' },
    { id: 'PETG-GF', label: 'PETG-GF' },
    // Engineering & Specialty
    { id: 'ABS', label: 'ABS' },
    { id: 'PC', label: 'PC' },
    { id: 'PAHT-CF', label: 'PAHT-CF' },
    // Flexible
    { id: 'TPU', label: 'TPU' },
    { id: 'Rapid TPU', label: 'Rapid TPU 95A' },
  ];

  // Elegoo Catalog Reference Data (Campaign ID: 19663)
  const DEFAULT_ELEGOO_CATALOGS: CatalogInfo[] = [
    { id: '25495', name: 'Elegoo Filaments Datafeed for US', region: 'US', itemCount: 247, status: 'Active', currency: 'USD' },
    { id: '19909', name: 'Elegoo Product Datafeed for AU', region: 'AU', itemCount: 2114, status: 'Inactive', currency: 'AUD' },
    { id: '19910', name: 'Elegoo Product Datafeed for CA', region: 'CA', itemCount: 2313, status: 'Inactive', currency: 'CAD' },
    { id: '19908', name: 'Elegoo Product Datafeed for EU', region: 'EU', itemCount: 2124, status: 'Inactive', currency: 'EUR' },
    { id: '19907', name: 'Elegoo Product Datafeed for UK', region: 'UK', itemCount: 2113, status: 'Inactive', currency: 'GBP' },
    { id: '19906', name: 'Elegoo Product Datafeed for US', region: 'US', itemCount: 2305, status: 'Inactive', currency: 'USD' },
    { id: '21454', name: 'Elegoo Product Datafeed for DE', region: 'DE', itemCount: 0, status: 'Active', currency: 'EUR' },
    { id: '21456', name: 'Elegoo Product Datafeed for Italy', region: 'IT', itemCount: 0, status: 'Active', currency: 'EUR' },
    { id: '21457', name: 'Elegoo Product Datafeed for FR', region: 'FR', itemCount: 0, status: 'Active', currency: 'EUR' },
    { id: '21458', name: 'Elegoo Product Datafeed for ES', region: 'ES', itemCount: 0, status: 'Active', currency: 'EUR' },
  ];
  const ELEGOO_CAMPAIGN_ID = '19663';
  const [catalogInfoOpen, setCatalogInfoOpen] = useState(false);
  const [availableCatalogs, setAvailableCatalogs] = useState<CatalogInfo[]>(DEFAULT_ELEGOO_CATALOGS);
  const [catalogsLoading, setCatalogsLoading] = useState(false);
  const [catalogsError, setCatalogsError] = useState<string | null>(null);
  const [excludedCatalogIds, setExcludedCatalogIds] = useState<Set<string>>(new Set(['22141']));
  const [lastCatalogRefresh, setLastCatalogRefresh] = useState<Date | null>(null);
  
  const { toast } = useToast();
  const { startJob, isStarting } = useStartBambuScrapeJob();
  const { jobs: recentJobs } = useRecentScrapeJobs(5);
  const { activeJob, hasActiveJob } = useActiveScrapeJob();
  const { syncProducts, discoverCatalogs, isLoading: elegooLoading, error: elegooError, reset: resetElegoo, currentJobId } = useElegooSync();
  const { activeJob: activeElegooJob, hasActiveJob: hasActiveElegooJob, isRunning: isElegooRunning, clearActiveJob: clearActiveElegooJob } = useActiveElegooSyncJob();

  // Helper function to infer region from catalog name
  const inferRegionFromCatalog = (catalog: CatalogInfo): string => {
    const name = catalog.name.toLowerCase();
    if (name.includes(' us') || name.includes('for us')) return 'US';
    if (name.includes(' au') || name.includes('for au')) return 'AU';
    if (name.includes(' ca') || name.includes('for ca')) return 'CA';
    if (name.includes(' eu') || name.includes('for eu')) return 'EU';
    if (name.includes(' uk') || name.includes('for uk')) return 'UK';
    if (name.includes(' jp') || name.includes('for jp')) return 'JP';
    // Try to infer from serviceAreas or location
    if (catalog.serviceAreas?.length) {
      return catalog.serviceAreas[0];
    }
    if (catalog.location) {
      return catalog.location;
    }
    return '?';
  };

  // Refresh catalogs from Impact API
  const handleRefreshCatalogs = async () => {
    setCatalogsLoading(true);
    setCatalogsError(null);
    try {
      const data = await discoverCatalogs();
      if (data.catalogs && Array.isArray(data.catalogs)) {
        const mappedCatalogs: CatalogInfo[] = data.catalogs.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          itemCount: c.itemCount || 0,
          status: c.status || 'Unknown',
          location: c.location,
          currency: c.currency,
          serviceAreas: c.serviceAreas || [],
          region: inferRegionFromCatalog({ 
            id: c.id, 
            name: c.name, 
            itemCount: c.itemCount, 
            status: c.status,
            location: c.location,
            serviceAreas: c.serviceAreas 
          }),
        }));
        setAvailableCatalogs(mappedCatalogs);
        setLastCatalogRefresh(new Date());
        toast({
          title: "Catalogs Refreshed",
          description: `Found ${mappedCatalogs.length} catalogs from Impact API`,
        });
      } else {
        throw new Error('No catalogs returned from API');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch catalogs';
      setCatalogsError(message);
      toast({ 
        title: "Failed to refresh catalogs", 
        description: message,
        variant: "destructive" 
      });
    }
    setCatalogsLoading(false);
  };
  
  // Sync activeJobId with auto-detected job
  useEffect(() => {
    if (activeJob && !activeJobId) {
      setActiveJobId(activeJob.id);
    }
  }, [activeJob, activeJobId]);
  
  const {
    queueState,
    isQueueRunning,
    isQueueComplete,
    overallProgress,
    totalMaterials,
    completedCount,
    currentJob,
    startQueue,
    cancelQueue,
    resetQueue,
    ALL_MATERIALS,
  } = useBambuScrapeQueue(bambuColorsDryRun);

  const handleStartScrape = async () => {
    const jobId = await startJob(bambuMaterials, bambuColorsDryRun);
    if (jobId) {
      setActiveJobId(jobId);
      toast({
        title: "Scrape Started",
        description: `Background job started for ${bambuMaterials.join(', ')}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to start scrape job",
        variant: "destructive",
      });
    }
  };

  const handleJobComplete = (job: ScrapeJob) => {
    // Only show toast for single job mode, not queue mode
    if (!isQueueRunning && !isQueueComplete) {
      toast({
        title: job.status === 'completed' ? "Scrape Complete" : "Scrape Failed",
        description: job.status === 'completed' 
          ? `${job.results?.filamentsCreated || 0} created, ${job.results?.filamentsUpdated || 0} updated`
          : job.error || "Unknown error",
        variant: job.status === 'completed' ? "default" : "destructive",
      });
    }
  };

  const handleStartAllMaterials = () => {
    setActiveJobId(null); // Clear single job mode
    startQueue(ALL_MATERIALS);
    toast({
      title: "Queue Started",
      description: `Scraping all ${ALL_MATERIALS.length} materials sequentially`,
    });
  };

  const handleCancelQueue = () => {
    cancelQueue();
    toast({
      title: "Queue Cancelled",
      description: "Remaining materials will not be processed",
    });
  };

  const handleElegooSync = async () => {
    resetElegoo();
    clearActiveElegooJob();
    try {
      // If ALL is selected, pass all individual regions
      const regionsToSync = elegooSelectedRegions.includes('ALL') 
        ? ['US', 'AU', 'CA', 'EU', 'UK', 'DE', 'IT', 'FR', 'ES'] 
        : elegooSelectedRegions;
      await syncProducts(elegooDryRun, elegooMaterialFilter || undefined, regionsToSync, Array.from(excludedCatalogIds));
      toast({
        title: "Sync Started",
        description: `Elegoo catalog sync started for ${regionsToSync.join(', ')}. Progress will continue even if you leave this page.`,
      });
      // Trigger TDS stats refresh after sync completes (handled by job completion)
    } catch (err) {
      toast({
        title: "Sync Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Sticky Progress Banner - always visible when job running */}
      <ScrapeProgressBanner />
      
      <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Scraping</h1>
          <p className="text-muted-foreground">
            Automated data scraping tools for filament brands
          </p>
        </div>
        <Link to="/admin/maintenance/archive">
          <Button variant="outline">
            <Archive className="w-4 h-4 mr-2" />
            Legacy Scrapers
          </Button>
        </Link>
      </div>

      {/* Tabs for Brand Scrapers */}
      <Tabs defaultValue="bambulab" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="bambulab" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Bambu Lab
          </TabsTrigger>
          <TabsTrigger value="elegoo" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Elegoo
          </TabsTrigger>
        </TabsList>

        {/* Bambu Lab Tab */}
        <TabsContent value="bambulab" className="space-y-6 mt-6">
          {/* Scrape Analytics Widget */}
          <ScrapeAnalyticsWidget />

          {/* AI Scrape Logs */}
          <AIScrapeLogsCard />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                <CardTitle>Bambu Lab Filament Scraper</CardTitle>
              </div>
              <CardDescription>
                Scrape Bambu Lab filaments across all materials (PLA, PETG, TPU, ABS, ASA, PA, PET, PC, PPS, Support) with regional pricing for US, CA, UK, EU, AU, JP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Materials to Scrape</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {BAMBU_MATERIAL_OPTIONS.map((material) => (
                    <div key={material.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`bambu-material-${material.id}`}
                        checked={bambuMaterials.includes(material.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBambuMaterials([...bambuMaterials, material.id]);
                          } else {
                            setBambuMaterials(bambuMaterials.filter(m => m !== material.id));
                          }
                        }}
                      />
                      <Label htmlFor={`bambu-material-${material.id}`} className="text-sm font-normal cursor-pointer">
                        {material.label} <span className="text-muted-foreground">({material.count})</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bambu-dry-run"
                  checked={bambuColorsDryRun}
                  onCheckedChange={(checked) => setBambuColorsDryRun(checked === true)}
                />
                <Label htmlFor="bambu-dry-run" className="text-sm font-normal">
                  Dry run (preview changes without saving)
                </Label>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleStartScrape} 
                  disabled={isStarting || isQueueRunning || bambuMaterials.length === 0}
                  className="w-full sm:w-auto"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Palette className="w-4 h-4 mr-2" />
                      {bambuColorsDryRun ? "Preview Scrape" : `Scrape ${bambuMaterials.length} Material(s)`}
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleStartAllMaterials} 
                  disabled={isStarting || isQueueRunning}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  {bambuColorsDryRun ? "Preview All (10)" : "Scrape All Materials (10)"}
                </Button>
              </div>

              {/* Queue Progress */}
              {(isQueueRunning || isQueueComplete) && (
                <div className="pt-4 border-t">
                  <BambuScrapeQueueProgress
                    queueState={queueState}
                    currentJob={currentJob}
                    overallProgress={overallProgress}
                    totalMaterials={totalMaterials}
                    completedCount={completedCount}
                    isQueueRunning={isQueueRunning}
                    isQueueComplete={isQueueComplete}
                    onCancel={handleCancelQueue}
                    onReset={resetQueue}
                  />
                </div>
              )}

              {/* Active Single Job Progress */}
              {activeJobId && !isQueueRunning && !isQueueComplete && (
                <div className="pt-4 border-t">
                  <BambuScrapeProgress jobId={activeJobId} onComplete={handleJobComplete} />
                </div>
              )}

              {/* Recent Jobs */}
              {recentJobs.length > 0 && !activeJobId && !isQueueRunning && !isQueueComplete && (
                <div className="pt-4 border-t space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Recent Jobs</h4>
                  {recentJobs.slice(0, 3).map((job) => (
                    <BambuScrapeJobRow key={job.id} job={job} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bambu Lab Regional Dashboard */}
          <BambuLabRegionalDashboard />
        </TabsContent>

        {/* Elegoo Tab */}
        <TabsContent value="elegoo" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <CardTitle>Elegoo Filament API</CardTitle>
              </div>
              <CardDescription>
                Sync Elegoo filaments from Impact.com Affiliate API. Fetches product catalog including prices, availability, images, and UPC/EAN codes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Region Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Region to Sync</Label>
                <div className="flex flex-wrap gap-2">
                  {ELEGOO_REGION_OPTIONS.map((region) => (
                    <Button
                      key={region.id}
                      variant={
                        region.id === 'ALL' 
                          ? elegooSelectedRegions.includes('ALL') ? "default" : "outline"
                          : elegooSelectedRegions.includes(region.id) && !elegooSelectedRegions.includes('ALL') 
                            ? "default" 
                            : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        if (region.id === 'ALL') {
                          setElegooSelectedRegions(['ALL']);
                        } else {
                          const newRegions = elegooSelectedRegions.includes('ALL')
                            ? [region.id]
                            : elegooSelectedRegions.includes(region.id)
                              ? elegooSelectedRegions.filter(r => r !== region.id)
                              : [...elegooSelectedRegions, region.id];
                          setElegooSelectedRegions(newRegions.length > 0 ? newRegions : ['US']);
                        }
                      }}
                    >
                      {region.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select regions to sync. Regional prices and URLs will be stored.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Material Filter (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {ELEGOO_MATERIAL_OPTIONS.map((material) => (
                    <Button
                      key={material.id}
                      variant={elegooMaterialFilter === material.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setElegooMaterialFilter(material.id)}
                    >
                      {material.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="elegoo-dry-run"
                  checked={elegooDryRun}
                  onCheckedChange={(checked) => setElegooDryRun(checked === true)}
                />
                <Label htmlFor="elegoo-dry-run" className="text-sm font-normal">
                  Dry run (preview changes without saving)
                </Label>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleElegooSync} 
                  disabled={elegooLoading}
                  className="w-full sm:w-auto"
                >
                  {elegooLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      {elegooDryRun ? "Preview Sync" : "Sync Catalog"}
                    </>
                  )}
                </Button>
              </div>

              {/* Elegoo Sync Progress - Show live progress from DB or error */}
              {(hasActiveElegooJob || elegooError || activeElegooJob?.status === 'completed' || activeElegooJob?.status === 'failed') && (
                <div className="pt-4 border-t">
                  <ElegooSyncProgress 
                    result={activeElegooJob?.status === 'completed' || activeElegooJob?.status === 'failed' ? {
                      success: activeElegooJob.status === 'completed',
                      dryRun: activeElegooJob.dry_run,
                      jobId: activeElegooJob.id,
                      summary: {
                        created: activeElegooJob.progress?.created || 0,
                        updated: activeElegooJob.progress?.updated || 0,
                        skipped: activeElegooJob.progress?.skipped || 0,
                        errors: activeElegooJob.progress?.errors || 0,
                        total: activeElegooJob.progress?.total || 0,
                        filtered: activeElegooJob.progress?.filtered || 0,
                      },
                      products: [],
                      regionsSynced: activeElegooJob.progress?.completedRegions || [],
                    } : null}
                    isLoading={isElegooRunning || elegooLoading}
                    error={elegooError || activeElegooJob?.error || null}
                    progress={isElegooRunning && activeElegooJob?.progress ? {
                      currentRegion: activeElegooJob.progress.currentRegion || '',
                      completedRegions: activeElegooJob.progress.completedRegions || [],
                      totalRegions: activeElegooJob.progress.totalRegions || 0,
                    } : null}
                  />
                  {(activeElegooJob?.status === 'completed' || activeElegooJob?.status === 'failed') && (
                    <div className="mt-2 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={clearActiveElegooJob}>
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* TDS Parsing Status */}
              <TdsParsingStatus refreshTrigger={tdsRefreshTrigger} />

              {/* Sync Quality Check */}
              <SyncQualityCheckPanel />

              {/* Sync Tasks Section */}
              <div className="mt-6 border rounded-lg p-4 bg-muted/30">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Sync Tasks
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Regional Prices:</strong> Syncs prices from all regional catalogs (US, CA, EU, UK, AU, DE, IT, FR, ES) and stores them in currency-specific fields.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Regional URLs:</strong> Captures "Buy Now" URLs for each region so users see their local store link based on currency preference.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Product Images:</strong> Each color variant gets its own product image, displayed when that color is selected on the filament detail page.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Multi-Region Creation:</strong> Products can be created from any regional catalog (priority: US → CA → UK → AU → EU → DE → IT → FR → ES).
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Delta Sync:</strong> Discovers new products in regional catalogs that don't exist in the database and creates entries for them.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Color Extraction:</strong> Extracts color name and hex code from product titles for filtering and display.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Product Line Grouping:</strong> Groups color variants under a common product line ID for the color selector UI.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>TDS URL Capture:</strong> Stores Technical Data Sheet URLs from the catalog feed for each product.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>TDS Data Ingestion:</strong> Uses AI to parse TDS documents and extract print settings (temps, speeds), physical properties (density, strength), and drying requirements. <span className="text-xs text-green-500">(Automatic - runs in background after sync)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Catalog Reference Section */}
              <Collapsible open={catalogInfoOpen} onOpenChange={setCatalogInfoOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between mt-4 text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Catalog Reference
                    </span>
                    <span className="text-xs">{catalogInfoOpen ? 'Hide' : 'Show'}</span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <strong>Campaign ID:</strong> {ELEGOO_CAMPAIGN_ID}
                      {lastCatalogRefresh && (
                        <span className="ml-3 text-xs">
                          Last refreshed: {lastCatalogRefresh.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRefreshCatalogs}
                      disabled={catalogsLoading}
                    >
                      {catalogsLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Refresh from API
                    </Button>
                  </div>
                  
                  {catalogsError && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                      <XCircle className="w-4 h-4" />
                      {catalogsError}
                    </div>
                  )}

                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Sync</TableHead>
                          <TableHead className="w-20">ID</TableHead>
                          <TableHead>Catalog Name</TableHead>
                          <TableHead className="w-20">Region</TableHead>
                          <TableHead className="w-20">Currency</TableHead>
                          <TableHead className="w-24 text-right">Products</TableHead>
                          <TableHead className="w-24">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableCatalogs.map((catalog) => {
                          const isActive = catalog.status === 'Active';
                          const region = catalog.region || inferRegionFromCatalog(catalog);
                          const isExcluded = excludedCatalogIds.has(catalog.id);
                          return (
                            <TableRow key={catalog.id} className={isActive && !isExcluded ? 'bg-primary/5' : isExcluded ? 'bg-muted/30' : ''}>
                              <TableCell>
                                <Switch
                                  checked={!isExcluded}
                                  onCheckedChange={(checked) => {
                                    setExcludedCatalogIds(prev => {
                                      const newSet = new Set(prev);
                                      if (checked) {
                                        newSet.delete(catalog.id);
                                      } else {
                                        newSet.add(catalog.id);
                                      }
                                      return newSet;
                                    });
                                  }}
                                  aria-label={`Toggle sync for ${catalog.name}`}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-xs">{catalog.id}</TableCell>
                              <TableCell className="text-sm">
                                <div>{catalog.name}</div>
                                {catalog.serviceAreas && catalog.serviceAreas.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {catalog.serviceAreas.slice(0, 3).map((area) => (
                                      <Badge key={area} variant="secondary" className="text-xs py-0">
                                        {area}
                                      </Badge>
                                    ))}
                                    {catalog.serviceAreas.length > 3 && (
                                      <Badge variant="secondary" className="text-xs py-0">
                                        +{catalog.serviceAreas.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{region}</Badge>
                              </TableCell>
                              <TableCell>
                                {catalog.currency ? (
                                  <Badge variant="secondary">{catalog.currency}</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">{catalog.itemCount.toLocaleString()}</TableCell>
                              <TableCell>
                                {isActive ? (
                                  <span className="flex items-center gap-1 text-xs text-green-600">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <XCircle className="w-3 h-3" />
                                    {catalog.status || 'Inactive'}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click "Refresh from API" to discover available Elegoo catalogs from Impact.com. 
                    Active catalogs can be synced; inactive catalogs may have been discontinued.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
};

export default AdminMaintenance;
