import { useState } from 'react';
import { RefreshCw, ChevronDown, Globe, Check, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { RegionCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';
import { formatDistanceToNow } from 'date-fns';

interface RegionSyncSelectorProps {
  availableRegions?: RegionCode[];
  onSync: (regions: RegionCode[] | null) => void;
  isLoading?: boolean;
  lastSyncByRegion?: Map<RegionCode, Date>;
  priceByRegion?: Map<RegionCode, number | null>;
  currencyByRegion?: Map<RegionCode, string>;
  productCountByRegion?: Map<RegionCode, number>;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
  showLabel?: boolean;
  label?: string;
  disabled?: boolean;
}

const ALL_REGIONS: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU'];

export function RegionSyncSelector({
  availableRegions,
  onSync,
  isLoading = false,
  lastSyncByRegion,
  priceByRegion,
  currencyByRegion,
  productCountByRegion,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  label = 'Sync',
  disabled = false,
}: RegionSyncSelectorProps) {
  const [customMode, setCustomMode] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<Set<RegionCode>>(new Set());

  const regions = availableRegions || ALL_REGIONS;

  const handleSyncSingleRegion = (region: RegionCode) => {
    onSync([region]);
  };

  const handleSyncAllRegions = () => {
    onSync(null); // null means all configured regions
  };

  const handleSyncMissingOnly = () => {
    // Find regions that haven't been synced recently (no last sync time)
    const missingRegions = regions.filter(r => !lastSyncByRegion?.has(r));
    if (missingRegions.length > 0) {
      onSync(missingRegions);
    } else {
      onSync(null);
    }
  };

  const handleCustomSync = () => {
    if (selectedRegions.size > 0) {
      onSync(Array.from(selectedRegions));
      setSelectedRegions(new Set());
      setCustomMode(false);
    }
  };

  const toggleRegion = (region: RegionCode) => {
    const next = new Set(selectedRegions);
    if (next.has(region)) {
      next.delete(region);
    } else {
      next.add(region);
    }
    setSelectedRegions(next);
  };

  const formatPrice = (region: RegionCode): string | null => {
    const price = priceByRegion?.get(region);
    if (price == null) return null;
    const currency = currencyByRegion?.get(region) || REGIONS[region]?.defaultCurrency || 'USD';
    return `${currency} ${price.toFixed(2)}`;
  };

  const formatLastSync = (region: RegionCode): string | null => {
    const lastSync = lastSyncByRegion?.get(region);
    if (!lastSync) return null;
    return formatDistanceToNow(lastSync, { addSuffix: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isLoading}
          className={cn('gap-1', size === 'icon' && 'w-8 h-8')}
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          {showLabel && size !== 'icon' && <span>{label}</span>}
          {size !== 'icon' && <ChevronDown className="w-3 h-3 ml-1" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {!customMode ? (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Quick Sync
            </DropdownMenuLabel>
            
            {/* Individual region options */}
            {regions.map((region) => {
              const regionInfo = REGIONS[region];
              const lastSync = formatLastSync(region);
              const price = formatPrice(region);
              const count = productCountByRegion?.get(region);

              return (
                <DropdownMenuItem
                  key={region}
                  onClick={() => handleSyncSingleRegion(region)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{regionInfo?.flag}</span>
                    <span>{regionInfo?.name || region}</span>
                    {count != null && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">
                        {count}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {price && <div className="font-mono">{price}</div>}
                    {lastSync && <div>{lastSync}</div>}
                    {!lastSync && !price && <span className="italic">Not synced</span>}
                  </div>
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />

            {/* All Regions */}
            <DropdownMenuItem onClick={handleSyncAllRegions}>
              <Globe className="w-4 h-4 mr-2" />
              Sync All Regions
            </DropdownMenuItem>

            {/* Missing Regions Only */}
            {lastSyncByRegion && (
              <DropdownMenuItem onClick={handleSyncMissingOnly}>
                <Check className="w-4 h-4 mr-2" />
                Sync Missing Only
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Custom Selection */}
            <DropdownMenuItem onClick={() => setCustomMode(true)}>
              <Settings2 className="w-4 h-4 mr-2" />
              Custom Selection...
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center justify-between">
              Select Regions
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setCustomMode(false)}
              >
                Cancel
              </Button>
            </DropdownMenuLabel>

            {regions.map((region) => {
              const regionInfo = REGIONS[region];
              return (
                <DropdownMenuCheckboxItem
                  key={region}
                  checked={selectedRegions.has(region)}
                  onCheckedChange={() => toggleRegion(region)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{regionInfo?.flag}</span>
                    <span>{regionInfo?.name || region}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              );
            })}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              disabled={selectedRegions.size === 0}
              onClick={handleCustomSync}
              className="justify-center font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync {selectedRegions.size > 0 ? `${selectedRegions.size} Regions` : 'Selected'}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
