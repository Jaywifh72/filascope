import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, AlertTriangle, RefreshCw, ExternalLink,
  BarChart3, XCircle, Info, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import type { ImportResult, ImportError } from '@/hooks/useCatalogSync';

interface Props {
  result: ImportResult;
  brandSlug: string;
  onReset: () => void;
  onRetry?: (error: ImportError) => Promise<boolean>;
}

export function ImportCompleteCard({ result, brandSlug, onReset, onRetry }: Props) {
  const [errorsExpanded, setErrorsExpanded] = useState(false);

  const hasErrors = result.errorDetails?.length > 0 || result.errors > 0;
  const criticalCount = result.errorDetails?.filter(e => e.severity === 'critical').length ?? 0;
  const warningCount = result.errorDetails?.filter(e => e.severity === 'warning').length ?? 0;
  const infoCount = result.errorDetails?.filter(e => e.severity === 'info').length ?? 0;

  return (
    <Card className={hasErrors ? 'border-amber-500/30 bg-amber-500/5' : 'border-green-500/30 bg-green-500/5'}>
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          {hasErrors
            ? <AlertTriangle className="w-6 h-6 text-amber-500" />
            : <CheckCircle2 className="w-6 h-6 text-green-500" />
          }
          <div>
            <h3 className="text-lg font-semibold">
              {hasErrors ? 'Import Complete with Issues' : 'Import Complete'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {result.imported} filament{result.imported !== 1 ? 's' : ''} imported
              {result.updatedPrices > 0 && `, ${result.updatedPrices} prices updated`}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <MiniStat label="Imported" value={result.imported} icon={<CheckCircle2 className="w-3.5 h-3.5 text-green-500" />} />
          <MiniStat label="Price Updates" value={result.updatedPrices} icon={<BarChart3 className="w-3.5 h-3.5 text-blue-500" />} />
          <MiniStat label="Price History" value={result.priceHistoryCount} icon={<BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />} />
          <MiniStat
            label="Avg Quality"
            value={`${result.avgQualityScore}%`}
            icon={
              result.avgQualityScore >= 70
                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            }
          />
        </div>

        {/* Error Summary + Expandable Details */}
        {hasErrors && (
          <div className="space-y-2">
            {/* Summary bar */}
            <div className="flex items-center gap-3 p-2.5 rounded bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                {criticalCount > 0 && (
                  <span className="text-sm text-red-400">
                    {criticalCount} error{criticalCount !== 1 ? 's' : ''}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="text-sm text-amber-400">
                    {warningCount} warning{warningCount !== 1 ? 's' : ''}
                  </span>
                )}
                {infoCount > 0 && (
                  <span className="text-sm text-blue-400">
                    {infoCount} info
                  </span>
                )}
                {/* Fallback when errorDetails is empty but errors count > 0 */}
                {(!result.errorDetails || result.errorDetails.length === 0) && result.errors > 0 && (
                  <span className="text-sm text-red-400">
                    {result.errors} error{result.errors !== 1 ? 's' : ''} during import
                  </span>
                )}
              </div>
              {result.errorDetails?.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setErrorsExpanded(!errorsExpanded)}
                >
                  {errorsExpanded ? (
                    <>Hide details <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Show details <ChevronDown className="w-3 h-3" /></>
                  )}
                </Button>
              )}
            </div>

            {/* Expanded error list */}
            {errorsExpanded && result.errorDetails?.length > 0 && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {result.errorDetails.map((err, i) => (
                  <ImportErrorRow key={`${err.itemId}-${i}`} error={err} onRetry={onRetry} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Broken URLs */}
        {result.urlsBroken.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-amber-500">
              {result.urlsBroken.length} broken URL{result.urlsBroken.length !== 1 ? 's' : ''} detected:
            </p>
            <div className="max-h-[100px] overflow-y-auto text-xs text-muted-foreground">
              {result.urlsBroken.map((url, i) => (
                <div key={i} className="truncate">{url}</div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/50">
          <Button onClick={onReset} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Start New Scan
          </Button>
          {brandSlug && (
            <a
              href={`/brands/${brandSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              View Brand Page <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Error Row Component ──

const SEVERITY_CONFIG = {
  critical: {
    Icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    badgeVariant: 'destructive' as const,
  },
  warning: {
    Icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    badgeVariant: 'secondary' as const,
  },
  info: {
    Icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    badgeVariant: 'secondary' as const,
  },
};

function ImportErrorRow({
  error,
  onRetry,
}: {
  error: ImportError;
  onRetry?: (error: ImportError) => Promise<boolean>;
}) {
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<'success' | 'failed' | null>(null);

  const cfg = SEVERITY_CONFIG[error.severity];
  const canAutoFix = error.resolutionType !== 'manual' && error.resolutionType !== 'none';

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    setRetryResult(null);
    try {
      const success = await onRetry(error);
      setRetryResult(success ? 'success' : 'failed');
    } catch {
      setRetryResult('failed');
    } finally {
      setRetrying(false);
    }
  };

  if (retryResult === 'success') {
    return (
      <div className="flex items-center gap-2 py-2 px-3 rounded bg-green-500/5 border border-green-500/20">
        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        <span className="text-sm text-green-400">{error.displayName} — Fixed</span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 py-2.5 px-3 rounded ${cfg.bg} border ${cfg.border}`}>
      <cfg.Icon className={`w-4 h-4 ${cfg.color} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0 space-y-1">
        {/* Title row */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{error.displayName}</p>
          <Badge variant={cfg.badgeVariant} className="text-[10px] shrink-0 uppercase h-4 px-1.5">
            {error.severity}
          </Badge>
        </div>
        {/* Explanation */}
        <p className="text-xs text-muted-foreground">{error.explanation}</p>
        {/* Raw error message */}
        <p className="text-[11px] text-muted-foreground/50 font-mono truncate">{error.message}</p>
        {/* Resolution */}
        <div className="flex items-center gap-2 pt-0.5">
          {canAutoFix && onRetry ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs gap-1"
                onClick={handleRetry}
                disabled={retrying}
              >
                {retrying ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Fixing...</>
                ) : (
                  <><RefreshCw className="w-3 h-3" /> Fix this</>
                )}
              </Button>
              {retryResult === 'failed' && (
                <span className="text-xs text-red-400">Retry failed</span>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground/70 italic">{error.resolution}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mini Stat ──

function MiniStat({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-muted/50">
      {icon}
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-bold">{value}</div>
      </div>
    </div>
  );
}
