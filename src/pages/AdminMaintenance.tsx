import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Loader2, Palette, Archive, Layers } from "lucide-react";
import { BambuLabRegionalDashboard } from "@/components/admin/BambuLabRegionalDashboard";
import { BambuScrapeProgress, BambuScrapeJobRow } from "@/components/admin/BambuScrapeProgress";
import { BambuScrapeQueueProgress } from "@/components/admin/BambuScrapeQueueProgress";
import { useStartBambuScrapeJob, useRecentScrapeJobs, ScrapeJob } from "@/hooks/useBambuScrapeJob";
import { useBambuScrapeQueue } from "@/hooks/useBambuScrapeQueue";

const AdminMaintenance = () => {
  const [bambuColorsDryRun, setBambuColorsDryRun] = useState(true);
  const [bambuMaterials, setBambuMaterials] = useState<string[]>(['PLA']);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  
  const BAMBU_MATERIAL_OPTIONS = [
    { id: 'PLA', label: 'PLA', count: 16 },
    { id: 'PETG', label: 'PETG', count: 4 },
    { id: 'TPU', label: 'TPU', count: 3 },
    { id: 'ABS', label: 'ABS', count: 1 },
    { id: 'ASA', label: 'ASA', count: 1 },
    { id: 'PA', label: 'PA (Nylon)', count: 4 },
    { id: 'PC', label: 'PC', count: 2 },
    { id: 'Support', label: 'Support', count: 5 },
  ];
  
  const { toast } = useToast();
  const { startJob, isStarting } = useStartBambuScrapeJob();
  const { jobs: recentJobs } = useRecentScrapeJobs(5);
  
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

  return (
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

      {/* Bambu Lab Scraper Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <CardTitle>Bambu Lab Filament Scraper</CardTitle>
          </div>
          <CardDescription>
            Scrape Bambu Lab filaments across all materials (PLA, PETG, TPU, ABS, ASA, PA, PC, Support) with regional pricing for US, CA, UK, EU, AU, JP
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
              {bambuColorsDryRun ? "Preview All (8)" : "Scrape All Materials (8)"}
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
    </div>
  );
};

export default AdminMaintenance;
