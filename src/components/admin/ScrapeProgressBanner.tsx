import { useActiveScrapeJob } from "@/hooks/useActiveScrapeJob";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Palette, 
  Package, 
  Globe, 
  Clock,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

export function ScrapeProgressBanner() {
  const { 
    activeJob, 
    isConnected, 
    hasActiveJob, 
    progressPercent,
    elapsedMs,
    estimatedRemainingMs
  } = useActiveScrapeJob();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayElapsed, setDisplayElapsed] = useState(0);

  // Update elapsed time every second for smooth display
  useEffect(() => {
    if (!activeJob?.started_at) {
      setDisplayElapsed(0);
      return;
    }

    const updateElapsed = () => {
      setDisplayElapsed(Date.now() - new Date(activeJob.started_at!).getTime());
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeJob?.started_at]);

  if (!hasActiveJob || !activeJob) {
    return null;
  }

  const progress = activeJob.progress;
  const isRunning = activeJob.status === 'running';

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        {/* Main Banner Row */}
        <div 
          className="flex items-center justify-between py-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-4">
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="font-semibold text-sm">
                {isRunning ? 'Scraping' : 'Starting'} {activeJob.materials.join(', ')}...
              </span>
              {activeJob.dry_run && (
                <Badge variant="outline" className="text-xs">Preview</Badge>
              )}
            </div>

            {/* Connection Status */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-yellow-500" />
                  <span>Polling</span>
                </>
              )}
            </div>
          </div>

          {/* Progress Stats */}
          <div className="flex items-center gap-4">
            {/* Progress Bar */}
            <div className="hidden md:flex items-center gap-2 min-w-[200px]">
              <Progress value={progressPercent} className="h-2 flex-1" />
              <span className="text-sm font-medium w-10 text-right">{progressPercent}%</span>
            </div>

            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-3 text-sm text-muted-foreground">
              {progress?.productsProcessed !== undefined && (
                <div className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  <span>{progress.productsProcessed}/{progress.totalProducts || '?'}</span>
                </div>
              )}
              {progress?.colorsDiscovered !== undefined && progress.colorsDiscovered > 0 && (
                <div className="flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" />
                  <span>{progress.colorsDiscovered}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDuration(displayElapsed)}</span>
              </div>
            </div>

            {/* Expand Button */}
            <button className="p-1 hover:bg-muted rounded">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pb-4 border-t border-border/50 pt-3 space-y-3">
            {/* Mobile Progress Bar */}
            <div className="md:hidden">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Current Operation */}
            {isRunning && progress && (
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Current:</span>
                  {progress.currentProduct && (
                    <Badge variant="secondary" className="font-normal">
                      <Package className="w-3 h-3 mr-1" />
                      {progress.currentProduct}
                    </Badge>
                  )}
                  {progress.currentRegion && (
                    <Badge variant="outline" className="font-normal">
                      <Globe className="w-3 h-3 mr-1" />
                      {progress.currentRegion}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <StatCard 
                icon={Package} 
                label="Products" 
                value={`${progress?.productsProcessed || 0}/${progress?.totalProducts || 0}`}
              />
              <StatCard 
                icon={Palette} 
                label="Colors" 
                value={progress?.colorsDiscovered || 0}
              />
              <StatCard 
                icon={CheckCircle} 
                label="Created" 
                value={progress?.filamentsCreated || 0}
                iconColor="text-green-500"
              />
              <StatCard 
                icon={Sparkles} 
                label="Updated" 
                value={progress?.filamentsUpdated || 0}
                iconColor="text-blue-500"
              />
              <StatCard 
                icon={Clock} 
                label="Elapsed" 
                value={formatDuration(displayElapsed)}
              />
              {estimatedRemainingMs && estimatedRemainingMs > 0 && (
                <StatCard 
                  icon={Clock} 
                  label="Remaining" 
                  value={`~${formatDuration(estimatedRemainingMs)}`}
                />
              )}
            </div>

            {/* Recent Activity */}
            {progress?.recentActivity && progress.recentActivity.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">Recent Activity</span>
                <div className="bg-muted/30 rounded-lg p-2 max-h-24 overflow-y-auto text-xs font-mono space-y-0.5">
                  {progress.recentActivity.slice(0, 5).map((activity, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0">[{activity.time}]</span>
                      <span className={cn(
                        activity.type === 'error' && 'text-destructive',
                        activity.type === 'success' && 'text-green-600'
                      )}>
                        {activity.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconColor?: string;
}

function StatCard({ icon: Icon, label, value, iconColor }: StatCardProps) {
  return (
    <div className="bg-muted/40 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("w-3.5 h-3.5", iconColor || "text-muted-foreground")} />
        <span className="font-semibold text-sm">{value}</span>
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
