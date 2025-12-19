import { useEffect, useRef } from "react";
import { useBambuScrapeJob, ScrapeJob } from "@/hooks/useBambuScrapeJob";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Palette, 
  Globe, 
  Package,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BambuScrapeProgressProps {
  jobId: string | null;
  onComplete?: (job: ScrapeJob) => void;
}

export function BambuScrapeProgress({ jobId, onComplete }: BambuScrapeProgressProps) {
  const { job, isLoading, error, isComplete, isRunning, progressPercent } = useBambuScrapeJob(jobId);
  const hasNotifiedRef = useRef(false);

  // Reset notification flag when jobId changes (new job started)
  useEffect(() => {
    hasNotifiedRef.current = false;
  }, [jobId]);

  // Call onComplete when job finishes - must be in useEffect to avoid calling during render
  useEffect(() => {
    if (isComplete && job && onComplete && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      onComplete(job);
    }
  }, [isComplete, job, onComplete]);

  if (!jobId) return null;

  if (isLoading && !job) {
    return (
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading job status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load job: {error}</AlertDescription>
      </Alert>
    );
  }

  if (!job) return null;

  const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string; label: string; animate?: boolean }> = {
    pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pending' },
    running: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Running', animate: true },
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Completed' },
    failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed' },
  };

  const status = statusConfig[job.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <Card className={`border ${isRunning ? 'border-blue-500/50' : 'border-muted'}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${status.color} ${status.animate ? 'animate-spin' : ''}`} />
            <span className="font-medium">{status.label}</span>
            {job.dry_run && (
              <Badge variant="outline" className="ml-2">Dry Run</Badge>
            )}
          </div>
          {job.started_at && (
            <span className="text-xs text-muted-foreground">
              Started {formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* Materials */}
        <div className="flex flex-wrap gap-1">
          {job.materials.map((mat) => (
            <Badge 
              key={mat} 
              variant={job.progress?.currentMaterial === mat ? 'default' : 'outline'}
              className="text-xs"
            >
              {mat}
            </Badge>
          ))}
        </div>

        {/* Progress Bar */}
        {isRunning && job.progress?.totalProducts && (
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {job.progress.productsProcessed || 0} / {job.progress.totalProducts} products
              </span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        )}

        {/* Current Operation */}
        {isRunning && job.progress && (
          <div className="grid grid-cols-3 gap-2 text-sm">
            {job.progress.currentProduct && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Package className="w-3.5 h-3.5" />
                <span className="truncate">{job.progress.currentProduct}</span>
              </div>
            )}
            {job.progress.currentRegion && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="w-3.5 h-3.5" />
                <span>{job.progress.currentRegion}</span>
              </div>
            )}
            {job.progress.colorsDiscovered !== undefined && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Palette className="w-3.5 h-3.5" />
                <span>{job.progress.colorsDiscovered} colors</span>
              </div>
            )}
          </div>
        )}

        {/* Completed Stats */}
        {isComplete && job.results && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-2.5">
              <div className="text-lg font-bold">{job.results.productsScraped || 0}</div>
              <div className="text-xs text-muted-foreground">Products</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5">
              <div className="text-lg font-bold">{job.results.colorsDiscovered || 0}</div>
              <div className="text-xs text-muted-foreground">Colors</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-2.5">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-lg font-bold">{job.results.filamentsCreated || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground">Created</div>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-2.5">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-lg font-bold">{job.results.filamentsUpdated || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground">Updated</div>
            </div>
          </div>
        )}

        {/* Duration */}
        {job.completed_at && job.started_at && (
          <div className="text-xs text-muted-foreground">
            Completed in {((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000).toFixed(1)}s
          </div>
        )}

        {/* Error */}
        {job.status === 'failed' && job.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{job.error}</AlertDescription>
          </Alert>
        )}

        {/* Errors from results */}
        {job.results?.errors && job.results.errors.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">{job.results.errors.length} warning(s)</div>
              <ul className="list-disc list-inside text-xs max-h-20 overflow-y-auto">
                {job.results.errors.slice(0, 3).map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
                {job.results.errors.length > 3 && (
                  <li>...and {job.results.errors.length - 3} more</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Controlled display component - receives job data as prop (no internal subscription)
export function BambuScrapeProgressDisplay({ job }: { job: ScrapeJob | null }) {
  if (!job) return null;

  const isRunning = job.status === 'running';
  const isComplete = job.status === 'completed' || job.status === 'failed';
  const progressPercent = job.progress?.totalProducts 
    ? Math.round((job.progress.productsProcessed || 0) / job.progress.totalProducts * 100)
    : 0;

  const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string; label: string; animate?: boolean }> = {
    pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pending' },
    running: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Running', animate: true },
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Completed' },
    failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed' },
  };

  const status = statusConfig[job.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <Card className={`border ${isRunning ? 'border-blue-500/50' : 'border-muted'}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${status.color} ${status.animate ? 'animate-spin' : ''}`} />
            <span className="font-medium">{status.label}</span>
            {job.dry_run && (
              <Badge variant="outline" className="ml-2">Dry Run</Badge>
            )}
          </div>
          {job.started_at && (
            <span className="text-xs text-muted-foreground">
              Started {formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* Materials */}
        <div className="flex flex-wrap gap-1">
          {job.materials.map((mat) => (
            <Badge 
              key={mat} 
              variant={job.progress?.currentMaterial === mat ? 'default' : 'outline'}
              className="text-xs"
            >
              {mat}
            </Badge>
          ))}
        </div>

        {/* Progress Bar */}
        {isRunning && job.progress?.totalProducts && (
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {job.progress.productsProcessed || 0} / {job.progress.totalProducts} products
              </span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        )}

        {/* Current Operation */}
        {isRunning && job.progress && (
          <div className="grid grid-cols-3 gap-2 text-sm">
            {job.progress.currentProduct && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Package className="w-3.5 h-3.5" />
                <span className="truncate">{job.progress.currentProduct}</span>
              </div>
            )}
            {job.progress.currentRegion && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="w-3.5 h-3.5" />
                <span>{job.progress.currentRegion}</span>
              </div>
            )}
            {job.progress.colorsDiscovered !== undefined && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Palette className="w-3.5 h-3.5" />
                <span>{job.progress.colorsDiscovered} colors</span>
              </div>
            )}
          </div>
        )}

        {/* Completed Stats */}
        {isComplete && job.results && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-2.5">
              <div className="text-lg font-bold">{job.results.productsScraped || 0}</div>
              <div className="text-xs text-muted-foreground">Products</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5">
              <div className="text-lg font-bold">{job.results.colorsDiscovered || 0}</div>
              <div className="text-xs text-muted-foreground">Colors</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-2.5">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-lg font-bold">{job.results.filamentsCreated || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground">Created</div>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-2.5">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-lg font-bold">{job.results.filamentsUpdated || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground">Updated</div>
            </div>
          </div>
        )}

        {/* Duration */}
        {job.completed_at && job.started_at && (
          <div className="text-xs text-muted-foreground">
            Completed in {((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000).toFixed(1)}s
          </div>
        )}

        {/* Error */}
        {job.status === 'failed' && job.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{job.error}</AlertDescription>
          </Alert>
        )}

        {/* Errors from results */}
        {job.results?.errors && job.results.errors.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">{job.results.errors.length} warning(s)</div>
              <ul className="list-disc list-inside text-xs max-h-20 overflow-y-auto">
                {job.results.errors.slice(0, 3).map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
                {job.results.errors.length > 3 && (
                  <li>...and {job.results.errors.length - 3} more</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for job history
export function BambuScrapeJobRow({ job }: { job: ScrapeJob }) {
  const statusConfig: Record<string, { icon: typeof Clock; color: string; animate?: boolean }> = {
    pending: { icon: Clock, color: 'text-muted-foreground' },
    running: { icon: Loader2, color: 'text-blue-500', animate: true },
    completed: { icon: CheckCircle, color: 'text-green-500' },
    failed: { icon: XCircle, color: 'text-destructive' },
  };

  const status = statusConfig[job.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg text-sm">
      <div className="flex items-center gap-2">
        <StatusIcon className={`w-4 h-4 ${status.color} ${status.animate ? 'animate-spin' : ''}`} />
        <span className="font-medium">{job.materials.join(', ')}</span>
        {job.dry_run && <Badge variant="outline" className="text-xs">Dry</Badge>}
      </div>
      <div className="flex items-center gap-4 text-muted-foreground text-xs">
        {job.results && (
          <span>
            {job.results.filamentsCreated || 0} created, {job.results.filamentsUpdated || 0} updated
          </span>
        )}
        <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
      </div>
    </div>
  );
}
