import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { useAmazonSyncRuns, AmazonSyncRun } from '@/hooks/useAmazonSyncRuns';
import { formatDistanceToNow } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  running: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  partial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const TYPE_LABELS: Record<string, string> = {
  price_refresh: 'Price Refresh',
  discovery: 'Discovery',
  verification: 'Verification',
  legacy_import: 'Legacy Import',
};

function formatDuration(ms: number | null): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function AmazonSyncAuditLog() {
  const { data: runs, isLoading } = useAmazonSyncRuns({ limit: 50 });
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRunId(prev => prev === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!runs?.length) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p>No sync runs yet. Run a price refresh or discovery to see the audit log.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {runs.map(run => (
        <Card key={run.id} className="bg-card/50 border-border/50">
          <div
            className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
            onClick={() => toggleExpand(run.id)}
          >
            {expandedRunId === run.id ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}

            <Badge className={`text-xs flex-shrink-0 ${STATUS_STYLES[run.status] || ''}`}>
              {run.status}
            </Badge>

            <span className="text-sm font-medium flex-shrink-0">
              {TYPE_LABELS[run.run_type] || run.run_type}
            </span>

            {run.marketplace && (
              <Badge variant="outline" className="text-[10px] flex-shrink-0">{run.marketplace}</Badge>
            )}
            {run.brand_slug && (
              <Badge variant="outline" className="text-[10px] flex-shrink-0">{run.brand_slug}</Badge>
            )}

            <div className="flex-1" />

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
              <span>{run.processed}/{run.total_items} items</span>
              <span className="text-green-400">{run.prices_updated} updated</span>
              {run.errors > 0 && <span className="text-red-400">{run.errors} errors</span>}
              <span>{formatDuration(run.duration_ms)}</span>
              <span title={run.started_at}>
                {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {expandedRunId === run.id && (
            <div className="px-4 pb-4 border-t border-border/30">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div>
                  <div className="text-xs text-muted-foreground">Total Items</div>
                  <div className="text-lg font-semibold">{run.total_items}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Processed</div>
                  <div className="text-lg font-semibold">{run.processed}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Prices Updated</div>
                  <div className="text-lg font-semibold text-green-400">{run.prices_updated}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">New Mappings</div>
                  <div className="text-lg font-semibold text-blue-400">{run.new_mappings}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                  <div className="text-lg font-semibold text-red-400">{run.errors}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                  <div className="text-lg font-semibold">{run.skipped}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">API Calls</div>
                  <div className="text-lg font-semibold">{run.api_calls_used}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="text-lg font-semibold">{formatDuration(run.duration_ms)}</div>
                </div>
              </div>

              {/* Error Log */}
              {run.error_log && (run.error_log as any[]).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-red-400 flex items-center gap-1 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    Error Log ({(run.error_log as any[]).length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {(run.error_log as any[]).map((err: any, i: number) => (
                      <div key={i} className="text-xs font-mono bg-red-500/5 p-2 rounded text-red-300">
                        {typeof err === 'string' ? err : JSON.stringify(err)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
