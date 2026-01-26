import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';
import { RegionalUrlCell } from './RegionalUrlCell';
import { RegionalPriceCell } from './RegionalPriceCell';

interface RegionalData {
  region: RegionCode;
  url?: string | null;
  storeName?: string | null;
  isVerified?: boolean;
  isPrimary?: boolean;
  price?: number | null;
  currency: CurrencyCode;
  msrp?: number | null;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
}

interface AllRegionsPriceRowProps {
  productId: string;
  productType: 'filament' | 'printer';
  regionalData: RegionalData[];
  allRegions?: RegionCode[];
  onEditRegion?: (region: RegionCode) => void;
  onSyncRegion?: (region: RegionCode) => void;
  syncingRegions?: RegionCode[];
  colSpan: number;
}

const DEFAULT_REGIONS: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU'];

export function AllRegionsPriceRow({
  productId,
  productType,
  regionalData,
  allRegions = DEFAULT_REGIONS,
  onEditRegion,
  onSyncRegion,
  syncingRegions = [],
  colSpan,
}: AllRegionsPriceRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Create a map for quick lookup
  const dataByRegion = new Map(
    regionalData.map((r) => [r.region, r])
  );

  // Find the lowest price for comparison
  const lowestPrice = Math.min(
    ...regionalData
      .filter((r) => r.price != null)
      .map((r) => r.price as number)
  );

  if (!isExpanded) {
    // Collapsed: show expand button with summary
    const configuredCount = regionalData.filter((r) => r.url).length;
    const priceCount = regionalData.filter((r) => r.price != null).length;

    return (
      <TableRow className="hover:bg-transparent border-none">
        <TableCell colSpan={colSpan} className="py-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(true)}
          >
            <ChevronDown className="w-3 h-3 mr-1" />
            Show all regions ({configuredCount} URLs, {priceCount} prices)
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      <TableRow className="hover:bg-transparent border-none">
        <TableCell colSpan={colSpan} className="py-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(false)}
          >
            <ChevronUp className="w-3 h-3 mr-1" />
            Hide regional details
          </Button>
        </TableCell>
      </TableRow>
      <TableRow className="bg-muted/30 hover:bg-muted/40">
        <TableCell colSpan={colSpan} className="p-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {allRegions.map((regionCode) => {
              const region = REGIONS[regionCode];
              const data = dataByRegion.get(regionCode);
              const isSyncing = syncingRegions.includes(regionCode);

              return (
                <div
                  key={regionCode}
                  className={cn(
                    'border rounded-lg p-2 bg-background',
                    !data?.url && 'border-dashed opacity-60'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {region?.flag} {regionCode}
                    </span>
                    <div className="flex items-center gap-1">
                      {data?.url && onSyncRegion && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => onSyncRegion(regionCode)}
                              disabled={isSyncing}
                            >
                              <RefreshCw
                                className={cn('w-3 h-3', isSyncing && 'animate-spin')}
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Sync {regionCode} price</TooltipContent>
                        </Tooltip>
                      )}
                      {!data?.url && onEditRegion && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => onEditRegion(regionCode)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Add {regionCode} URL</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">URL</div>
                    <RegionalUrlCell
                      productId={productId}
                      productType={productType}
                      regionCode={regionCode}
                      url={data?.url}
                      storeName={data?.storeName}
                      isVerified={data?.isVerified}
                      isPrimary={data?.isPrimary}
                      onEdit={onEditRegion ? () => onEditRegion(regionCode) : undefined}
                      compact
                    />
                  </div>

                  <div className="space-y-1 mt-2">
                    <div className="text-xs text-muted-foreground">Price</div>
                    <RegionalPriceCell
                      productId={productId}
                      productType={productType}
                      regionCode={regionCode}
                      price={data?.price}
                      currency={data?.currency || region?.defaultCurrency || 'USD'}
                      msrp={data?.msrp}
                      lastSyncAt={data?.lastSyncAt}
                      lastSyncStatus={data?.lastSyncStatus}
                      comparisonPrice={lowestPrice !== Infinity ? lowestPrice : undefined}
                      compact
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </TableCell>
      </TableRow>
    </>
  );
}
