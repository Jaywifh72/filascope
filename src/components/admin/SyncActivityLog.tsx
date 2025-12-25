import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityLogEntry {
  id: string;
  job_id: string;
  timestamp: string;
  phase: string;
  region: string | null;
  action: string;
  product_id: string | null;
  product_title: string | null;
  details: Record<string, any> | null;
  level: 'info' | 'warning' | 'error' | 'success';
}

interface SyncActivityLogProps {
  jobId: string | null;
  className?: string;
  maxHeight?: string;
}

const levelIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle2,
};

const levelColors = {
  info: "text-blue-500",
  warning: "text-amber-500",
  error: "text-destructive",
  success: "text-green-500",
};

const levelBgColors = {
  info: "bg-blue-500/10",
  warning: "bg-amber-500/10",
  error: "bg-destructive/10",
  success: "bg-green-500/10",
};

export function SyncActivityLog({ jobId, className, maxHeight = "400px" }: SyncActivityLogProps) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial entries
  useEffect(() => {
    if (!jobId) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    const fetchEntries = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('sync_activity_log')
        .select('*')
        .eq('job_id', jobId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Failed to fetch activity log:', error);
      } else {
        setEntries((data as ActivityLogEntry[]) || []);
      }
      setIsLoading(false);
    };

    fetchEntries();
  }, [jobId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!jobId) return;

    const channel = supabase
      .channel(`sync-activity-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sync_activity_log',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const newEntry = payload.new as ActivityLogEntry;
          setEntries((prev) => [...prev, newEntry]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  const toggleExpanded = (id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const getActionLabel = (entry: ActivityLogEntry) => {
    const { action, details } = entry;
    switch (action) {
      case 'job_started':
        return details?.message || 'Sync job started';
      case 'job_completed':
        return details?.message || 'Sync completed successfully';
      case 'job_failed':
        return details?.message || 'Sync failed';
      case 'region_started':
        return `Starting region ${entry.region}`;
      case 'region_completed':
        return `Completed ${entry.region}: ${details?.created || 0} created, ${details?.updated || 0} updated`;
      case 'region_failed':
        return `Failed ${entry.region}: ${details?.error || 'Unknown error'}`;
      case 'phase_started':
        return details?.message || `Starting ${entry.phase} phase`;
      case 'phase_completed':
        return details?.message || `Completed ${entry.phase} phase`;
      case 'phase_failed':
        return details?.message || `${entry.phase} phase failed`;
      case 'image_updated':
        return `Updated image: ${entry.product_title || 'Unknown product'}`;
      case 'no_match':
        return `No match: ${entry.product_title || 'Unknown product'}`;
      case 'update_failed':
        return `Update failed: ${entry.product_title || 'Unknown product'}`;
      case 'warning':
        return details?.message || 'Warning';
      default:
        return details?.message || action;
    }
  };

  if (!jobId) {
    return (
      <div className={cn("flex items-center justify-center text-muted-foreground p-8", className)}>
        <Info className="h-5 w-5 mr-2" />
        Select a sync job to view activity log
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center text-muted-foreground p-8", className)}>
        <div className="animate-pulse">Loading activity log...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-muted-foreground p-8", className)}>
        <Info className="h-5 w-5 mr-2" />
        No activity logged yet
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between px-1">
        <div className="text-sm text-muted-foreground">
          {entries.length} log entries
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAutoScroll(!autoScroll)}
          className="h-7 gap-1"
        >
          {autoScroll ? (
            <>
              <Pause className="h-3 w-3" />
              Pause scroll
            </>
          ) : (
            <>
              <Play className="h-3 w-3" />
              Auto-scroll
            </>
          )}
        </Button>
      </div>
      
      <ScrollArea 
        ref={scrollRef}
        className="rounded-md border bg-muted/30"
        style={{ height: maxHeight }}
      >
        <div className="p-2 space-y-1 font-mono text-xs">
          {entries.map((entry) => {
            const Icon = levelIcons[entry.level];
            const isExpanded = expandedEntries.has(entry.id);
            const hasDetails = entry.details && Object.keys(entry.details).length > 0;
            
            return (
              <div key={entry.id}>
                <div
                  className={cn(
                    "flex items-start gap-2 p-1.5 rounded-sm",
                    levelBgColors[entry.level],
                    hasDetails && "cursor-pointer hover:opacity-80"
                  )}
                  onClick={() => hasDetails && toggleExpanded(entry.id)}
                >
                  {hasDetails && (
                    <div className="mt-0.5">
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  {!hasDetails && <div className="w-3" />}
                  
                  <span className="text-muted-foreground w-16 shrink-0">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  
                  <Icon className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", levelColors[entry.level])} />
                  
                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                    {entry.phase}
                  </Badge>
                  
                  {entry.region && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {entry.region}
                    </Badge>
                  )}
                  
                  <span className={cn("flex-1", levelColors[entry.level])}>
                    {getActionLabel(entry)}
                  </span>
                </div>
                
                {isExpanded && entry.details && (
                  <div className="ml-8 p-2 text-[11px] bg-background/50 rounded-sm mt-0.5 mb-1">
                    <pre className="whitespace-pre-wrap overflow-auto">
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}