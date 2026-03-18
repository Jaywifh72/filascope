import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle, XCircle, SkipForward, Clock, RefreshCw, Zap, Package,
} from 'lucide-react';
import type { AmazonSyncSummary } from '@/hooks/useAmazonPriceSync';

interface Props {
  summary: AmazonSyncSummary;
  label: string;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

export function AmazonSyncSummaryCard({ summary, label }: Props) {
  const statusColor =
    summary.status === 'completed'
      ? 'text-green-400'
      : summary.status === 'partial'
        ? 'text-yellow-400'
        : 'text-red-400';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">
              Amazon Price Sync Results
            </h3>
            <Badge variant="outline" className="text-xs">
              {label}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs capitalize ${statusColor}`}
            >
              {summary.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(summary.durationMs)}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatBadge
            icon={<Package className="w-4 h-4" />}
            label="Total Items"
            value={summary.totalItems}
            variant="outline"
          />
          <StatBadge
            icon={<RefreshCw className="w-4 h-4" />}
            label="Processed"
            value={summary.processed}
            variant="outline"
          />
          <StatBadge
            icon={<CheckCircle className="w-4 h-4" />}
            label="Prices Updated"
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
            icon={<SkipForward className="w-4 h-4" />}
            label="Skipped"
            value={summary.skipped}
            variant="outline"
          />
          <StatBadge
            icon={<Zap className="w-4 h-4" />}
            label="API Calls"
            value={summary.apiCallsUsed}
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
  variant: 'outline' | 'success' | 'destructive';
}) {
  const colors = {
    outline: 'border-border bg-card text-foreground',
    success: 'border-green-600/30 bg-green-950/20 text-green-400',
    destructive: 'border-red-600/30 bg-red-950/20 text-red-400',
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
