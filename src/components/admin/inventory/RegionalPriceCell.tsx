import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Clock, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';
import { formatPrice as formatCurrencyPrice } from '@/config/currencies';
import { useRegionalPriceSync } from '@/hooks/useRegionalPriceSync';

interface RegionalPriceCellProps {
  productId: string;
  productType: 'filament' | 'printer';
  regionCode: RegionCode;
  price?: number | null;
  currency: CurrencyCode;
  msrp?: number | null;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
  viewCurrency?: CurrencyCode;
  comparisonPrice?: number | null; // For highlighting best price
  compact?: boolean;
  storeUrl?: string | null; // For enabling sync
  showSyncButton?: boolean;
}

type SyncStatus = 'success' | 'failed' | 'pending' | 'never';

function getSyncStatus(status: string | null | undefined, lastSyncAt: string | null | undefined): SyncStatus {
  if (!lastSyncAt) return 'never';
  if (!status) return 'never';
  switch (status.toLowerCase()) {
    case 'success':
    case 'synced':
      return 'success';
    case 'failed':
    case 'error':
      return 'failed';
    case 'pending':
    case 'running':
      return 'pending';
    default:
      return 'never';
  }
}

function getPriceComparisonClass(
  price: number | null | undefined,
  comparisonPrice: number | null | undefined
): string {
  if (!price || !comparisonPrice) return '';
  
  const diff = ((price - comparisonPrice) / comparisonPrice) * 100;
  
  if (diff < 0) {
    // This is the best price
    return 'text-green-600 font-semibold';
  } else if (diff <= 10) {
    // Within 10% of best
    return 'text-amber-600';
  } else if (diff > 20) {
    // More than 20% higher
    return 'text-destructive';
  }
  return '';
}

export function RegionalPriceCell({
  productId,
  productType,
  regionCode,
  price,
  currency,
  msrp,
  lastSyncAt,
  lastSyncStatus,
  viewCurrency,
  comparisonPrice,
  compact = false,
  storeUrl,
  showSyncButton = false,
}: RegionalPriceCellProps) {
  const region = REGIONS[regionCode];
  const syncStatus = getSyncStatus(lastSyncStatus, lastSyncAt);
  const { syncRegion, isSyncing } = useRegionalPriceSync();
  
  const isCurrentlySyncing = isSyncing(productId, regionCode);
  
  const handleSync = () => {
    if (!storeUrl) {
      return;
    }
    syncRegion({
      productId,
      productType,
      regionCode,
      storeUrl,
    });
  };

  // No price data
  if (price == null) {
    return (
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 text-muted-foreground/50">
              {syncStatus === 'never' ? (
                <>
                  <Minus className="w-3 h-3" />
                  {!compact && <span className="text-xs">No data</span>}
                </>
              ) : syncStatus === 'failed' ? (
                <>
                  <AlertCircle className="w-3 h-3 text-destructive" />
                  {!compact && <span className="text-xs">Sync failed</span>}
                </>
              ) : syncStatus === 'pending' ? (
                <>
                  <Clock className="w-3 h-3 text-amber-500" />
                  {!compact && <span className="text-xs">Pending</span>}
                </>
              ) : (
                <span className="text-xs">—</span>
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {syncStatus === 'never'
              ? `No ${region?.name || regionCode} price data`
              : syncStatus === 'failed'
              ? 'Last sync failed'
              : syncStatus === 'pending'
              ? 'Sync in progress'
              : 'No price available'}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // Format price
  const formattedPrice = formatCurrencyPrice(price, currency);
  const priceComparisonClass = getPriceComparisonClass(price, comparisonPrice);

  // Calculate price change from MSRP
  const priceChange = msrp && price ? ((price - msrp) / msrp) * 100 : null;

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('font-mono text-sm', priceComparisonClass)}>
            {formattedPrice}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <div>
              {region?.name || regionCode} price: {formattedPrice}
            </div>
            {msrp && (
              <div>
                MSRP: {formatCurrencyPrice(msrp, currency)}
              </div>
            )}
            {priceChange !== null && (
              <div className={priceChange < 0 ? 'text-green-400' : 'text-red-400'}>
                {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}% vs MSRP
              </div>
            )}
            {lastSyncAt && (
              <div className="text-muted-foreground">
                Updated {formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Price change indicator (compact mode only shows icon) */}
      {!compact && priceChange !== null && (
        <span
          className={cn(
            'text-xs',
            priceChange < 0 && 'text-green-600',
            priceChange > 0 && 'text-destructive'
          )}
        >
          {priceChange < 0 ? (
            <TrendingDown className="w-3 h-3 inline" />
          ) : priceChange > 0 ? (
            <TrendingUp className="w-3 h-3 inline" />
          ) : null}
        </span>
      )}

      {/* Sync status indicator */}
      {compact && syncStatus === 'success' && !showSyncButton && (
        <Check className="w-3 h-3 text-green-500" />
      )}
      
      {/* Sync button */}
      {showSyncButton && storeUrl && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSync}
              disabled={isCurrentlySyncing}
              className="h-6 w-6 ml-1"
            >
              <RefreshCw className={cn(
                "h-3 w-3",
                isCurrentlySyncing && "animate-spin"
              )} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isCurrentlySyncing ? 'Syncing...' : `Sync ${region?.name || regionCode} price`}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
