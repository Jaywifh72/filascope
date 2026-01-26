import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, Check, AlertCircle, Clock, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';
import { formatPrice } from '@/config/currencies';

export interface RegionalPriceData {
  id?: string;
  region_code: RegionCode;
  currency_code: CurrencyCode;
  current_price: number | null;
  msrp: number | null;
  compare_at_price: number | null;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
}

interface RegionalPriceEditorProps {
  productId: string;
  productType: 'filament' | 'printer';
  prices: RegionalPriceData[];
  configuredRegions: RegionCode[];
  baseMsrp: number | null;
  onChange: (prices: RegionalPriceData[]) => void;
  onSyncRegion?: (regionCode: RegionCode) => Promise<void>;
  syncingRegions?: RegionCode[];
  disabled?: boolean;
}

function getSyncStatusInfo(status: string | null, error: string | null) {
  if (!status) {
    return { icon: Minus, color: 'text-muted-foreground', label: 'Never synced' };
  }
  switch (status.toLowerCase()) {
    case 'success':
    case 'synced':
      return { icon: Check, color: 'text-green-500', label: 'Success' };
    case 'failed':
    case 'error':
      return { icon: AlertCircle, color: 'text-destructive', label: error || 'Failed' };
    case 'pending':
    case 'running':
      return { icon: Clock, color: 'text-amber-500', label: 'Pending' };
    default:
      return { icon: Minus, color: 'text-muted-foreground', label: status };
  }
}

export function RegionalPriceEditor({
  productId,
  productType,
  prices,
  configuredRegions,
  baseMsrp,
  onChange,
  onSyncRegion,
  syncingRegions = [],
  disabled = false,
}: RegionalPriceEditorProps) {
  // Create a map for quick lookup
  const pricesByRegion = new Map(prices.map((p) => [p.region_code, p]));

  const handlePriceChange = (
    regionCode: RegionCode,
    field: keyof RegionalPriceData,
    value: any
  ) => {
    const existing = pricesByRegion.get(regionCode);
    if (existing) {
      const updated = prices.map((p) =>
        p.region_code === regionCode ? { ...p, [field]: value } : p
      );
      onChange(updated);
    } else {
      // Create new price entry
      const region = REGIONS[regionCode];
      const newPrice: RegionalPriceData = {
        region_code: regionCode,
        currency_code: region?.defaultCurrency || 'USD',
        current_price: null,
        msrp: null,
        compare_at_price: null,
        last_sync_at: null,
        last_sync_status: null,
        last_sync_error: null,
        [field]: value,
      };
      onChange([...prices, newPrice]);
    }
  };

  if (configuredRegions.length === 0) {
    return (
      <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground">
        <p className="text-sm">No regional URLs configured</p>
        <p className="text-xs mt-1">Add regional URLs first to manage prices</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Regional Prices</Label>
        {baseMsrp && (
          <span className="text-sm text-muted-foreground">
            Base MSRP: ${baseMsrp.toFixed(2)} USD
          </span>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[120px_1fr_1fr_100px_80px] gap-2 p-3 bg-muted/50 text-sm font-medium text-muted-foreground">
          <div>Region</div>
          <div>Current Price</div>
          <div>MSRP Override</div>
          <div>Last Synced</div>
          <div className="text-center">Actions</div>
        </div>

        {/* Rows */}
        <div className="divide-y">
          {configuredRegions.map((regionCode) => {
            const region = REGIONS[regionCode];
            const priceData = pricesByRegion.get(regionCode);
            const statusInfo = getSyncStatusInfo(
              priceData?.last_sync_status || null,
              priceData?.last_sync_error || null
            );
            const StatusIcon = statusInfo.icon;
            const isSyncing = syncingRegions.includes(regionCode);
            const currency = priceData?.currency_code || region?.defaultCurrency || 'USD';

            return (
              <div
                key={regionCode}
                className="grid grid-cols-[120px_1fr_1fr_100px_80px] gap-2 p-3 items-center"
              >
                {/* Region */}
                <div className="flex items-center gap-2">
                  <span>{region?.flag}</span>
                  <span className="font-medium">{regionCode}</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <StatusIcon className={cn('w-4 h-4', statusInfo.color)} />
                    </TooltipTrigger>
                    <TooltipContent>{statusInfo.label}</TooltipContent>
                  </Tooltip>
                </div>

                {/* Current Price */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">{currency}</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceData?.current_price ?? ''}
                    onChange={(e) =>
                      handlePriceChange(
                        regionCode,
                        'current_price',
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="—"
                    className="h-8 w-24"
                    disabled={disabled}
                  />
                  {priceData?.current_price != null && (
                    <span className="text-xs text-muted-foreground">
                      {formatPrice(priceData.current_price, currency)}
                    </span>
                  )}
                </div>

                {/* MSRP Override */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">{currency}</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceData?.msrp ?? ''}
                    onChange={(e) =>
                      handlePriceChange(
                        regionCode,
                        'msrp',
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder={baseMsrp ? `~${baseMsrp}` : '—'}
                    className="h-8 w-24"
                    disabled={disabled}
                  />
                </div>

                {/* Last Synced */}
                <div className="text-xs text-muted-foreground">
                  {priceData?.last_sync_at ? (
                    <Tooltip>
                      <TooltipTrigger>
                        {formatDistanceToNow(new Date(priceData.last_sync_at), {
                          addSuffix: true,
                        })}
                      </TooltipTrigger>
                      <TooltipContent>
                        {new Date(priceData.last_sync_at).toLocaleString()}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    'Never'
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-center">
                  {onSyncRegion && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onSyncRegion(regionCode)}
                          disabled={disabled || isSyncing}
                        >
                          <RefreshCw
                            className={cn('w-4 h-4', isSyncing && 'animate-spin')}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isSyncing ? 'Syncing...' : `Sync ${regionCode} price`}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Prices are stored in the local currency for each region. Leave MSRP empty to use the
        base MSRP with currency conversion.
      </p>
    </div>
  );
}
