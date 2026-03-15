import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, SkipForward, Clock, RefreshCw } from 'lucide-react';
import type { PriceSyncSummary } from '@/hooks/usePrinterPriceSync';

interface Props {
  summary: PriceSyncSummary;
  brandName: string;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

export function PriceSyncSummaryCard({ summary, brandName }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Price Sync Results — {brandName}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(summary.duration)}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatBadge
            icon={<RefreshCw className="w-4 h-4" />}
            label="Checked"
            value={summary.printersChecked}
            variant="outline"
          />
          <StatBadge
            icon={<CheckCircle className="w-4 h-4" />}
            label="Updated"
            value={summary.pricesUpdated}
            variant={summary.pricesUpdated > 0 ? 'success' : 'outline'}
          />
          <StatBadge
            icon={<XCircle className="w-4 h-4" />}
            label="Errors"
            value={summary.errors}
            variant={summary.errors > 0 ? 'destructive' : 'outline'}
          />
          <StatBadge
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Anomalies"
            value={summary.anomalies}
            variant={summary.anomalies > 0 ? 'warning' : 'outline'}
          />
          <StatBadge
            icon={<SkipForward className="w-4 h-4" />}
            label="Skipped"
            value={summary.skipped}
            variant="outline"
          />
          <StatBadge
            icon={<SkipForward className="w-4 h-4" />}
            label="Manual Only"
            value={summary.manualOnly}
            variant="outline"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function StatBadge({
  icon,
  label,
  value,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  variant: 'outline' | 'success' | 'destructive' | 'warning';
}) {
  const colors = {
    outline: 'border-border bg-card text-foreground',
    success: 'border-green-600/30 bg-green-950/20 text-green-400',
    destructive: 'border-red-600/30 bg-red-950/20 text-red-400',
    warning: 'border-yellow-600/30 bg-yellow-950/20 text-yellow-400',
  };

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${colors[variant]}`}>
      {icon}
      <div>
        <div className="text-xl font-bold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
