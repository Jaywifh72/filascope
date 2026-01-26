import { RefreshCw, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface GlobalActionsBarProps {
  onSyncFilaments: () => void;
  onSyncPrinters: () => void;
  onAddFilament: () => void;
  onAddPrinter: () => void;
  lastSyncTime: Date | null;
  isSyncing?: boolean;
}

export function GlobalActionsBar({
  onSyncFilaments,
  onSyncPrinters,
  onAddFilament,
  onAddPrinter,
  lastSyncTime,
  isSyncing = false,
}: GlobalActionsBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg">
      <div className="flex flex-wrap gap-2">
        <Button onClick={onSyncFilaments} variant="default" size="sm" disabled={isSyncing}>
          {isSyncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Sync All Filaments
        </Button>
        <Button onClick={onSyncPrinters} variant="default" size="sm" disabled={isSyncing}>
          {isSyncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Sync All Printers
        </Button>
        <Button onClick={onAddFilament} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Filament
        </Button>
        <Button onClick={onAddPrinter} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Printer
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {lastSyncTime ? (
          <span>Last sync: {formatDistanceToNow(lastSyncTime, { addSuffix: true })}</span>
        ) : (
          <span>Last sync: Never</span>
        )}
      </div>
    </div>
  );
}
