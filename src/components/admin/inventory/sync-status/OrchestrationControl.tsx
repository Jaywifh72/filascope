import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Play, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrchestrationRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  brands_total: number;
  brands_synced: number;
  brands_failed: string[];
  total_products_updated: number;
  trigger_type: string;
  triggered_by_user: string | null;
  error_log: Record<string, unknown> | null;
  summary: Record<string, unknown> | null;
}

export function OrchestrationControl() {
  const { user } = useContext(AuthContext);
  const [latestRun, setLatestRun] = useState<OrchestrationRun | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLatestRun = async () => {
    const { data } = await supabase
      .from('orchestration_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) setLatestRun(data as unknown as OrchestrationRun);
    setLoading(false);
  };

  useEffect(() => {
    fetchLatestRun();

    // Poll every 5 seconds when a run is active
    const interval = setInterval(() => {
      if (latestRun?.status === 'running') {
        fetchLatestRun();
      }
    }, 5000);

    // Realtime subscription
    const channel = supabase
      .channel('orchestration-runs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orchestration_runs',
      }, () => fetchLatestRun())
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [latestRun?.status]);

  const triggerSync = async () => {
    setIsTriggering(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const response = await supabase.functions.invoke('daily-price-orchestrator', {
        body: { trigger: 'manual', userId: user?.id },
      });

      if (response.error) {
        toast.error(`Failed: ${response.error.message}`);
        return;
      }

      const result = response.data;
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Orchestration started: ${result.eligibleBrands} brands queued`);
      fetchLatestRun();
    } catch (err) {
      toast.error('Failed to trigger orchestration');
    } finally {
      setIsTriggering(false);
    }
  };

  const isRunning = latestRun?.status === 'running';
  const isStale = latestRun?.completed_at 
    ? (Date.now() - new Date(latestRun.completed_at).getTime()) > 36 * 3600000
    : !latestRun;

  const statusIcon = {
    running: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
    partial: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  };

  const statusColor = {
    running: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    failed: 'bg-red-500/10 text-red-500 border-red-500/20',
    partial: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  };

  const durationStr = latestRun?.summary 
    ? `${Math.round((latestRun.summary as any).duration_seconds / 60)}m ${(latestRun.summary as any).duration_seconds % 60}s`
    : null;

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Price Sync Orchestrator
          </CardTitle>
          <Button
            onClick={triggerSync}
            disabled={isTriggering || isRunning}
            size="sm"
            variant="default"
          >
            {isTriggering || isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            {isRunning ? 'Running...' : 'Run Full Price Sync'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Staleness Alert */}
        {isStale && !isRunning && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>No orchestration run in the last 36 hours. Prices may be stale.</span>
          </div>
        )}

        {/* Latest Run Status */}
        {latestRun && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {statusIcon[latestRun.status as keyof typeof statusIcon]}
              <Badge variant="outline" className={statusColor[latestRun.status as keyof typeof statusColor]}>
                {latestRun.status}
              </Badge>
              <span className="text-muted-foreground">
                {latestRun.trigger_type === 'cron' ? 'Scheduled' : 'Manual'} · {formatDistanceToNow(new Date(latestRun.started_at), { addSuffix: true })}
              </span>
            </div>

            {/* Progress Bar for running */}
            {isRunning && latestRun.brands_total > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress: {latestRun.brands_synced} / {latestRun.brands_total} brands</span>
                  <span>{Math.round((latestRun.brands_synced / latestRun.brands_total) * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(latestRun.brands_synced / latestRun.brands_total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Results Summary */}
            {latestRun.status !== 'running' && (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-lg font-semibold">{latestRun.brands_synced}</div>
                  <div className="text-xs text-muted-foreground">Brands Synced</div>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-lg font-semibold">{latestRun.total_products_updated}</div>
                  <div className="text-xs text-muted-foreground">Products Updated</div>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-lg font-semibold">{durationStr || '—'}</div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
              </div>
            )}

            {/* Failed Brands */}
            {latestRun.brands_failed.length > 0 && (
              <div className="text-xs">
                <span className="text-red-400 font-medium">Failed: </span>
                <span className="text-muted-foreground">{latestRun.brands_failed.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {!latestRun && (
          <p className="text-sm text-muted-foreground">No orchestration runs yet. Click "Run Full Price Sync" to start.</p>
        )}
      </CardContent>
    </Card>
  );
}
