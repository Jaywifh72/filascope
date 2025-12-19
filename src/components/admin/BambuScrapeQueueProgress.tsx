import { QueueState } from "@/hooks/useBambuScrapeQueue";
import { ScrapeJob } from "@/hooks/useBambuScrapeJob";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BambuScrapeProgress } from "./BambuScrapeProgress";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  X,
  Layers,
  RotateCcw
} from "lucide-react";

interface BambuScrapeQueueProgressProps {
  queueState: QueueState;
  overallProgress: number;
  totalMaterials: number;
  completedCount: number;
  isQueueRunning: boolean;
  isQueueComplete: boolean;
  onCancel: () => void;
  onReset: () => void;
  onJobComplete?: (job: ScrapeJob) => void;
}

function MaterialStatusIcon({ status }: { status: 'pending' | 'running' | 'completed' | 'failed' }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-destructive" />;
    case 'running':
      return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    case 'pending':
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

function getMaterialStatus(
  material: string, 
  queueState: QueueState
): 'pending' | 'running' | 'completed' | 'failed' {
  if (queueState.completed.includes(material)) return 'completed';
  if (queueState.failed.includes(material)) return 'failed';
  if (queueState.current === material) return 'running';
  return 'pending';
}

export function BambuScrapeQueueProgress({
  queueState,
  overallProgress,
  totalMaterials,
  completedCount,
  isQueueRunning,
  isQueueComplete,
  onCancel,
  onReset,
  onJobComplete,
}: BambuScrapeQueueProgressProps) {
  const allMaterials = [
    ...queueState.completed,
    ...queueState.failed,
    ...(queueState.current ? [queueState.current] : []),
    ...queueState.pending,
  ];

  // Calculate totals from results
  const totals = Object.values(queueState.results).reduce(
    (acc, job) => ({
      created: acc.created + (job.results?.filamentsCreated || 0),
      updated: acc.updated + (job.results?.filamentsUpdated || 0),
    }),
    { created: 0, updated: 0 }
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            <CardTitle className="text-lg">Queue Progress</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isQueueComplete && (
              <Badge variant={queueState.failed.length > 0 ? "destructive" : "default"}>
                {queueState.failed.length > 0 
                  ? `${queueState.completed.length} completed, ${queueState.failed.length} failed`
                  : "All completed"
                }
              </Badge>
            )}
            {isQueueRunning && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
            {isQueueComplete && (
              <Button variant="outline" size="sm" onClick={onReset}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedCount} of {totalMaterials} materials processed
            </span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Material status grid */}
        <div className="grid grid-cols-4 gap-2">
          {allMaterials.map((material) => {
            const status = getMaterialStatus(material, queueState);
            return (
              <div
                key={material}
                className={`flex items-center gap-2 p-2 rounded-md border ${
                  status === 'running' ? 'border-primary bg-primary/5' :
                  status === 'completed' ? 'border-green-500/30 bg-green-500/5' :
                  status === 'failed' ? 'border-destructive/30 bg-destructive/5' :
                  'border-border'
                }`}
              >
                <MaterialStatusIcon status={status} />
                <span className={`text-sm ${
                  status === 'pending' ? 'text-muted-foreground' : ''
                }`}>
                  {material}
                </span>
              </div>
            );
          })}
        </div>

        {/* Summary stats */}
        {(totals.created > 0 || totals.updated > 0) && (
          <div className="flex gap-4 text-sm text-muted-foreground pt-2 border-t">
            <span>Total Created: <strong className="text-foreground">{totals.created}</strong></span>
            <span>Total Updated: <strong className="text-foreground">{totals.updated}</strong></span>
          </div>
        )}

        {/* Current job progress */}
        {queueState.currentJobId && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">
              Current: {queueState.current}
            </p>
            <BambuScrapeProgress 
              jobId={queueState.currentJobId} 
              onComplete={onJobComplete}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
