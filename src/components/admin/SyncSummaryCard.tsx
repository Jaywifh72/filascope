import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Globe, 
  Image, 
  Database,
  TrendingUp,
  AlertTriangle,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncJobResult {
  created: number;
  updated: number;
  skipped: number;
  filtered: number;
  errors: number;
  total: number;
  imagesFixed: number;
  imagesFailed: number;
  regions: string[];
  regionResults: Record<string, { created: number; updated: number; errors: number }>;
  dryRun: boolean;
}

interface SyncJob {
  id: string;
  job_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  results: SyncJobResult | null;
  error: string | null;
}

interface SyncSummaryCardProps {
  jobId: string | null;
  className?: string;
}

export function SyncSummaryCard({ jobId, className }: SyncSummaryCardProps) {
  const [job, setJob] = useState<SyncJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setIsLoading(false);
      return;
    }

    const fetchJob = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('scrape_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Failed to fetch job:', error);
      } else if (data) {
        setJob({
          id: data.id,
          job_type: data.job_type,
          status: data.status,
          started_at: data.started_at,
          completed_at: data.completed_at,
          results: data.results as unknown as SyncJobResult | null,
          error: data.error,
        });
      }
      setIsLoading(false);
    };

    fetchJob();

    // Subscribe to job updates
    const channel = supabase
      .channel(`sync-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scrape_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setJob({
            id: newData.id,
            job_type: newData.job_type,
            status: newData.status,
            started_at: newData.started_at,
            completed_at: newData.completed_at,
            results: newData.results as SyncJobResult | null,
            error: newData.error,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  if (!jobId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className="p-6">
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Show job progress even if results aren't populated yet
  if (!job) {
    return (
      <Card className={cn(className)}>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No job data available</p>
        </CardContent>
      </Card>
    );
  }

  const results = job.results;
  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const duration = job.completed_at && job.started_at
    ? Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)
    : null;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <Card className={cn(
      "transition-all",
      isCompleted && "border-green-500/50",
      isFailed && "border-destructive/50",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : isFailed ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : (
              <Clock className="h-5 w-5 text-muted-foreground" />
            )}
            Sync Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isCompleted ? "default" : isFailed ? "destructive" : "secondary"}>
              {job.status}
            </Badge>
            {results?.dryRun && (
              <Badge variant="outline">Dry Run</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Duration & Time */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {duration !== null ? formatDuration(duration) : 'In progress...'}
          </div>
          {job.completed_at && (
            <div>
              Completed {new Date(job.completed_at).toLocaleString()}
            </div>
          )}
        </div>

        {isFailed && job.error && (
          <div className="p-3 bg-destructive/10 rounded-md text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>{job.error}</div>
            </div>
          </div>
        )}

        {results && (
          <>
            <Separator />
            
            {/* Product Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Database}
                label="Total Processed"
                value={results.total}
                color="text-foreground"
              />
              <StatCard
                icon={TrendingUp}
                label="Created"
                value={results.created}
                color="text-green-500"
              />
              <StatCard
                icon={CheckCircle2}
                label="Updated"
                value={results.updated}
                color="text-blue-500"
              />
              <StatCard
                icon={XCircle}
                label="Errors"
                value={results.errors}
                color={results.errors > 0 ? "text-destructive" : "text-muted-foreground"}
              />
            </div>

            {/* Image Stats */}
            {(results.imagesFixed > 0 || results.imagesFailed > 0) && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Image Fix Results
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      icon={CheckCircle2}
                      label="Images Fixed"
                      value={results.imagesFixed}
                      color="text-green-500"
                    />
                    <StatCard
                      icon={XCircle}
                      label="Failed"
                      value={results.imagesFailed}
                      color={results.imagesFailed > 0 ? "text-amber-500" : "text-muted-foreground"}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Region Breakdown */}
            {results.regionResults && Object.keys(results.regionResults).length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Region Breakdown
                  </div>
                  <div className="space-y-2">
                    {Object.entries(results.regionResults).map(([region, stats]) => {
                      if (region === 'image_fix' || region === 'quality_check') return null;
                      const total = stats.created + stats.updated;
                      return (
                        <div key={region} className="flex items-center gap-3">
                          <Badge variant="outline" className="w-12 justify-center">
                            {region}
                          </Badge>
                          <div className="flex-1">
                            <Progress 
                              value={total > 0 ? 100 : 0} 
                              className="h-2"
                            />
                          </div>
                          <div className="text-xs text-muted-foreground w-32 text-right">
                            {stats.created} new, {stats.updated} updated
                            {stats.errors > 0 && (
                              <span className="text-destructive ml-1">
                                ({stats.errors} errors)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Skipped/Filtered */}
            {(results.skipped > 0 || results.filtered > 0) && (
              <div className="text-xs text-muted-foreground">
                {results.skipped > 0 && <span>{results.skipped} skipped</span>}
                {results.skipped > 0 && results.filtered > 0 && <span> • </span>}
                {results.filtered > 0 && <span>{results.filtered} filtered</span>}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number; 
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={cn("text-xl font-semibold", color)}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}