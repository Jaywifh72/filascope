import { RefreshCw, Plus, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { AdminRegionSelector, AdminCurrencySelector } from './AdminRegionSelector';
import { RegionSyncSelector } from './RegionSyncSelector';

interface GlobalActionsBarProps {
  onSyncFilaments: (regions?: RegionCode[] | null) => void;
  onSyncPrinters: (regions?: RegionCode[] | null) => void;
  onAddFilament: () => void;
  onAddPrinter: () => void;
  lastSyncTime: Date | null;
  isSyncing?: boolean;
  // Regional props
  selectedRegion: RegionCode;
  onRegionChange: (region: RegionCode) => void;
  viewCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  showAllRegions: boolean;
  onShowAllRegionsChange: (show: boolean) => void;
}

export function GlobalActionsBar({
  onSyncFilaments,
  onSyncPrinters,
  onAddFilament,
  onAddPrinter,
  lastSyncTime,
  isSyncing = false,
  selectedRegion,
  onRegionChange,
  viewCurrency,
  onCurrencyChange,
  showAllRegions,
  onShowAllRegionsChange,
}: GlobalActionsBarProps) {
  return (
    <div 
      className="flex flex-col gap-4 p-4 bg-card border border-border rounded-lg"
      role="toolbar"
      aria-label="Inventory actions"
    >
      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {/* Sync Filaments with Region Selector */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <RegionSyncSelector
                  onSync={(regions) => onSyncFilaments(regions)}
                  isLoading={isSyncing}
                  label="Sync Filaments"
                  variant="default"
                  size="sm"
                  disabled={isSyncing}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Sync filament prices by region</TooltipContent>
          </Tooltip>
          
          {/* Sync Printers with Region Selector */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <RegionSyncSelector
                  onSync={(regions) => onSyncPrinters(regions)}
                  isLoading={isSyncing}
                  label="Sync Printers"
                  variant="default"
                  size="sm"
                  disabled={isSyncing}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Sync printer prices by region</TooltipContent>
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

        <div className="text-sm text-muted-foreground">
          {lastSyncTime ? (
            <span>Last sync: {formatDistanceToNow(lastSyncTime, { addSuffix: true })}</span>
          ) : (
            <span>Last sync: Never</span>
          )}
        </div>
      </div>

      {/* Regional Controls Row */}
      <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">View:</span>
        </div>
        
        <AdminRegionSelector
          value={selectedRegion}
          onChange={onRegionChange}
          size="sm"
        />
        
        <AdminCurrencySelector
          value={viewCurrency}
          onChange={(c) => onCurrencyChange(c as CurrencyCode)}
          size="sm"
          label="Currency:"
        />
        
        <div className="flex items-center gap-2">
          <Switch
            id="show-all-regions"
            checked={showAllRegions}
            onCheckedChange={onShowAllRegionsChange}
          />
          <Label 
            htmlFor="show-all-regions" 
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Show All Regions
          </Label>
        </div>
      </div>
    </div>
  );
}
