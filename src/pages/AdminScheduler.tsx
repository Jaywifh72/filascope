import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, RefreshCw, Play, CheckCircle, XCircle, Clock,
  AlertTriangle, History
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface TaskRun {
  id: string;
  task_name: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  items_processed: number;
  items_failed: number;
  error_log: string | null;
}

interface ScheduledTask {
  name: string;
  description: string;
  schedule: string;
  lastRun: TaskRun | null;
  nextRun: string | null;
}

const SCHEDULED_TASKS: Omit<ScheduledTask, 'lastRun' | 'nextRun'>[] = [
  {
    name: 'log-printer-prices',
    description: 'Log current printer prices to history table',
    schedule: 'Daily at 3:00 AM UTC'
  },
  {
    name: 'update-global-prices',
    description: 'Scrape and update printer prices across regions',
    schedule: 'Daily at 4:00 AM UTC'
  },
  {
    name: 'validate-product-urls',
    description: 'Check product URLs for broken links',
    schedule: 'Weekly on Sundays'
  },
  {
    name: 'cleanup-images',
    description: 'Remove orphaned images from storage',
    schedule: 'Monthly'
  }
];

const AdminScheduler = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [recentRuns, setRecentRuns] = useState<TaskRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningTask, setRunningTask] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      navigate("/");
    } else if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [isAdmin, authLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchTaskData();
    }
  }, [isAdmin]);

  const fetchTaskData = async () => {
    setLoading(true);
    
    // Fetch recent task runs
    const { data: runs } = await supabase
      .from("scheduled_task_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);

    if (runs) {
      setRecentRuns(runs);
      
      // Map tasks with their last run
      const tasksWithRuns = SCHEDULED_TASKS.map(task => {
        const lastRun = runs.find(r => r.task_name === task.name) || null;
        return {
          ...task,
          lastRun,
          nextRun: null // Would calculate based on schedule
        };
      });
      
      setTasks(tasksWithRuns);
    }
    
    setLoading(false);
  };

  const runTaskManually = async (taskName: string) => {
    setRunningTask(taskName);
    
    try {
      // Insert a new task run record
      const { data: run, error: insertError } = await supabase
        .from("scheduled_task_runs")
        .insert({
          task_name: taskName,
          status: 'running'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Try to invoke the edge function
      const { error } = await supabase.functions.invoke(taskName, {
        body: { manual: true }
      });

      // Update the run record
      if (error) {
        await supabase
          .from("scheduled_task_runs")
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_log: error.message
          })
          .eq("id", run.id);
      } else {
        await supabase
          .from("scheduled_task_runs")
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq("id", run.id);
      }

      fetchTaskData();
    } catch (error) {
      console.error("Error running task:", error);
    } finally {
      setRunningTask(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return "bg-green-500/10 text-green-500 border-green-500/30";
      case 'failed': return "bg-red-500/10 text-red-500 border-red-500/30";
      case 'running': return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-500" />
            <h1 className="text-3xl font-bold text-foreground">Task Scheduler</h1>
          </div>
          <Button onClick={fetchTaskData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Scheduled Tasks */}
        <h2 className="text-xl font-semibold text-foreground mb-4">Scheduled Tasks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {tasks.map((task) => (
            <Card key={task.name} className="p-4 bg-card border-border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{task.name}</h3>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {task.schedule}
                </Badge>
              </div>

              {task.lastRun && (
                <div className="mb-3 p-2 rounded bg-muted/30">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last run:</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.lastRun.status)}
                      <span>{formatDistanceToNow(new Date(task.lastRun.started_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  {task.lastRun.items_processed > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Processed: {task.lastRun.items_processed} | Failed: {task.lastRun.items_failed}
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => runTaskManually(task.name)}
                disabled={runningTask === task.name}
              >
                {runningTask === task.name ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Now
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>

        {/* Recent Task Runs */}
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          Recent Task Runs
        </h2>
        
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : recentRuns.length === 0 ? (
          <Card className="p-8 text-center">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No task runs recorded yet</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentRuns.slice(0, 20).map((run) => (
              <Card key={run.id} className="p-3 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(run.status)}
                    <div>
                      <span className="font-medium text-foreground">{run.task_name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {format(new Date(run.started_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {run.items_processed > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {run.items_processed} processed
                      </span>
                    )}
                    <Badge className={getStatusColor(run.status)}>
                      {run.status}
                    </Badge>
                  </div>
                </div>
                {run.error_log && (
                  <div className="mt-2 p-2 bg-red-500/10 rounded text-sm text-red-500">
                    {run.error_log}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminScheduler;
