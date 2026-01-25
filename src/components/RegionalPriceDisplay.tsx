import { Info, ExternalLink, MapPin } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { RegionalPriceResult } from '@/types/regional';
import { formatPrice } from '@/config/currencies';
import { CURRENCIES } from '@/config/currencies';
import { REGIONS } from '@/config/regions';
import { useRegion } from '@/contexts/RegionContext';
import { cn } from '@/lib/utils';

interface RegionalPriceDisplayProps {
  priceResult: RegionalPriceResult | null;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showStore?: boolean;
  showConversionInfo?: boolean;
  showShippingInfo?: boolean;
  showLocalBadge?: boolean;
  className?: string;
}

export function RegionalPriceDisplay({
  priceResult,
  isLoading = false,
  size = 'md',
  showStore = true,
  showConversionInfo = true,
  showShippingInfo = false,
  showLocalBadge = true,
  className,
}: RegionalPriceDisplayProps) {
  const { region: userRegion } = useRegion();
  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
        {showStore && <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />}
      </div>
    );
  }

  if (!priceResult) {
    return (
      <div className={cn("text-muted-foreground text-sm", className)}>
        Price unavailable
      </div>
    );
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl font-bold',
  };

  const regionConfig = REGIONS[priceResult.store.regionCode];
  const isLocalStore = priceResult.store.regionCode === userRegion;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Main Price */}
      <div className="flex items-center gap-1.5">
        {/* Price with conversion indicator */}
        {priceResult.isConverted ? (
          <span className={cn("text-muted-foreground", sizeClasses[size])}>
            ~{priceResult.formattedPrice}
          </span>
        ) : (
          <span className={cn("font-semibold text-foreground", sizeClasses[size])}>
            {priceResult.formattedPrice}
          </span>
        )}
        
        {/* Per kg indicator for filaments */}
        {size === 'lg' && (
          <span className="text-muted-foreground text-sm">/kg</span>
        )}
        
        {/* Conversion info tooltip */}
        {priceResult.isConverted && showConversionInfo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                className="bg-popover border-border max-w-xs p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm">
                    Converted from {formatPrice(priceResult.originalPrice, priceResult.originalCurrency)}
                  </p>
                  {priceResult.conversionRate && (
                    <p className="text-xs text-muted-foreground">
                      Rate: 1 {priceResult.originalCurrency} = {priceResult.conversionRate.toFixed(4)} {priceResult.displayCurrency}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    From {regionConfig?.flag} {regionConfig?.name || priceResult.store.regionCode}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Store attribution */}
      {showStore && priceResult.store.name && priceResult.store.name !== 'Direct' && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>
            at {priceResult.store.name}
          </span>
          {regionConfig && (
            <span aria-hidden="true">
              {regionConfig.flag}
            </span>
          )}
          {isLocalStore && showLocalBadge && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Local
            </Badge>
          )}
          {priceResult.store.url && (
            <ExternalLink className="w-3 h-3" />
          )}
        </div>
      )}

      {/* Shipping info */}
      {showShippingInfo && priceResult.store.shipsFrom && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>
            Ships from {priceResult.store.shipsFrom}
          </span>
        </div>
      )}

      {/* Conversion badge for cards */}
      {priceResult.isConverted && size === 'sm' && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 w-fit">
          From {regionConfig?.flag} {priceResult.store.regionCode}
        </Badge>
      )}
    </div>
  );
}

// Simplified version for product cards
export function CompactRegionalPrice({
  priceResult,
  isLoading = false,
  className,
}: {
  priceResult: RegionalPriceResult | null;
  isLoading?: boolean;
  className?: string;
}) {
  if (isLoading) {
    return <div className={cn("h-5 w-16 bg-muted animate-pulse rounded", className)} />;
  }

  if (!priceResult) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }

  const regionConfig = REGIONS[priceResult.store.regionCode];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {priceResult.isConverted ? (
        <>
          <span className="text-muted-foreground">
            ~{priceResult.formattedPrice}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-popover border-border p-2">
                <p className="text-xs">
                  Converted from {formatPrice(priceResult.originalPrice, priceResult.originalCurrency)}
                </p>
                {priceResult.conversionRate && (
                  <p className="text-xs text-muted-foreground">
                    Rate: {priceResult.conversionRate.toFixed(2)}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      ) : (
        <span className="font-semibold text-foreground">
          {priceResult.formattedPrice}
        </span>
      )}
    </div>
  );
}
