import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Loader2, Palette, Archive, Layers, ShoppingBag } from "lucide-react";
import { BambuLabRegionalDashboard } from "@/components/admin/BambuLabRegionalDashboard";
import { BambuScrapeProgress, BambuScrapeJobRow } from "@/components/admin/BambuScrapeProgress";
import { BambuScrapeQueueProgress } from "@/components/admin/BambuScrapeQueueProgress";
import { ScrapeAnalyticsWidget } from "@/components/admin/ScrapeAnalyticsWidget";
import { AIScrapeLogsCard } from "@/components/admin/AIScrapeLogsCard";
import { ScrapeProgressBanner } from "@/components/admin/ScrapeProgressBanner";
import { ElegooSyncProgress } from "@/components/admin/ElegooSyncProgress";
import { useStartBambuScrapeJob, useRecentScrapeJobs, ScrapeJob } from "@/hooks/useBambuScrapeJob";
import { useBambuScrapeQueue } from "@/hooks/useBambuScrapeQueue";
import { useActiveScrapeJob } from "@/hooks/useActiveScrapeJob";
import { useElegooSync } from "@/hooks/useElegooSync";

const AdminMaintenance = () => {
  const [bambuColorsDryRun, setBambuColorsDryRun] = useState(true);
  const [bambuMaterials, setBambuMaterials] = useState<string[]>(['PLA']);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  
  // Elegoo state
  const [elegooDryRun, setElegooDryRun] = useState(true);
  const [elegooMaterialFilter, setElegooMaterialFilter] = useState<string>('');
  
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
    { id: 'PLA', label: 'PLA' },
    { id: 'PLA+', label: 'PLA+' },
    { id: 'PETG', label: 'PETG' },
    { id: 'ABS', label: 'ABS' },
    { id: 'TPU', label: 'TPU' },
    { id: 'PLA-CF', label: 'PLA-CF' },
  ];
  
  const { toast } = useToast();
  const { startJob, isStarting } = useStartBambuScrapeJob();
  const { jobs: recentJobs } = useRecentScrapeJobs(5);
  const { activeJob, hasActiveJob } = useActiveScrapeJob();
  const { syncProducts, isLoading: elegooLoading, result: elegooResult, error: elegooError, reset: resetElegoo } = useElegooSync();
  
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
    try {
      await syncProducts(elegooDryRun, elegooMaterialFilter || undefined);
      toast({
        title: elegooDryRun ? "Preview Complete" : "Sync Complete",
        description: "Elegoo catalog sync finished successfully",
      });
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

      {/* Scrape Analytics Widget */}
      <ScrapeAnalyticsWidget />

      {/* AI Scrape Logs */}
      <AIScrapeLogsCard />

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

              {/* Elegoo Sync Progress */}
              {(elegooLoading || elegooResult || elegooError) && (
                <div className="pt-4 border-t">
                  <ElegooSyncProgress 
                    result={elegooResult} 
                    isLoading={elegooLoading} 
                    error={elegooError} 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
};

export default AdminMaintenance;
