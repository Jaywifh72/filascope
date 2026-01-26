import { RefreshCw, Plus, Loader2, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
    <div 
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg"
      role="toolbar"
      aria-label="Inventory actions"
    >
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={onSyncFilaments} 
              variant="default" 
              size="sm" 
              disabled={isSyncing}
              aria-label="Sync all filament prices"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              <span className="hidden xs:inline">Sync All</span> Filaments
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh prices for all filaments from their source URLs</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={onSyncPrinters} 
              variant="default" 
              size="sm" 
              disabled={isSyncing}
              aria-label="Sync all printer prices"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              <span className="hidden xs:inline">Sync All</span> Printers
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh prices for all printers from their source URLs</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={onAddFilament} 
              variant="outline" 
              size="sm"
              aria-label="Add new filament"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Add</span> Filament
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-2">
              <span>Add a new filament</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">⌘N</kbd>
            </div>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={onAddPrinter} 
              variant="outline" 
              size="sm"
              aria-label="Add new printer"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Add</span> Printer
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-2">
              <span>Add a new printer</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">⌘⇧N</kbd>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="text-sm text-muted-foreground flex items-center gap-2">
        {lastSyncTime ? (
          <span>Last sync: {formatDistanceToNow(lastSyncTime, { addSuffix: true })}</span>
        ) : (
          <span>Last sync: Never</span>
        )}
      </div>
    </div>
  );
}
