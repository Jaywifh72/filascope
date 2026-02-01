import { useMemo } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { useRegion } from '@/contexts/RegionContext';
import { PriceFreshnessIndicator } from './PriceFreshnessIndicator';
import { PriceSourceBadge, PriceSourceIndicator } from './PriceSourceBadge';
import { cn } from '@/lib/utils';
import { CurrencyCode } from '@/types/regional';

export interface EnhancedPriceDisplayProps {
  /** The price amount to display */
  price: number | null;
  /** Whether this is an actual regional price or converted */
  isActualRegionalPrice: boolean;
  /** The price source type */
  priceSource: 'regional' | 'converted' | 'unavailable';
  /** The currency the price is in */
  currency: CurrencyCode;
  /** Source currency if converted */
  sourceCurrency?: CurrencyCode;
  /** Store name for attribution */
  storeName?: string;
  /** Store URL */
  storeUrl?: string | null;
  /** Last time price was verified */
  lastVerifiedAt?: string | null;
  /** Whether using a fallback region */
  isUsingFallback?: boolean;
  /** Ships from country */
  shipsFromCountry?: string | null;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show per-unit suffix */
  suffix?: string;
  /** Show the source badge */
  showSourceBadge?: boolean;
  /** Show freshness indicator */
  showFreshness?: boolean;
  /** Compact mode - inline indicators */
  compact?: boolean;
  /** Additional className */
  className?: string;
  /** Callback when live price differs from cached */
  onPriceDiscrepancy?: (cachedPrice: number, livePrice: number) => void;
}

const sizeClasses = {
  sm: { price: 'text-lg', unit: 'text-xs' },
  md: { price: 'text-2xl', unit: 'text-sm' },
  lg: { price: 'text-3xl md:text-4xl', unit: 'text-base' },
};

/**
 * EnhancedPriceDisplay - Full-featured price display with source and freshness indicators
 * 
 * Shows:
 * - Price with tilde (~) prefix for converted prices
 * - Source badge (EU Store Price / Converted from USD)
 * - Freshness indicator (Verified today / May be outdated)
 * - Ships from warning for fallback regions
 */
export function EnhancedPriceDisplay({
  price,
  isActualRegionalPrice,
  priceSource,
  currency,
  sourceCurrency = 'USD',
  storeName,
  storeUrl,
  lastVerifiedAt,
  isUsingFallback = false,
  shipsFromCountry,
  size = 'lg',
  suffix = '/kg',
  showSourceBadge = true,
  showFreshness = true,
  compact = false,
  className,
  onPriceDiscrepancy,
}: EnhancedPriceDisplayProps) {
  const { formatPrice } = useRegion();
  const sizes = sizeClasses[size];
  
  // Determine if we should show the tilde prefix
  const showApproximate = !isActualRegionalPrice && priceSource === 'converted';
  
  // Format the price with appropriate prefix
  const formattedPrice = useMemo(() => {
    if (price === null) return null;
    const formatted = formatPrice(price, { showApproximate: false });
    return showApproximate ? `~${formatted}` : formatted;
  }, [price, formatPrice, showApproximate]);
  
  // Get region name for display
  const getRegionName = () => {
    switch (currency) {
      case 'EUR': return 'EU';
      case 'GBP': return 'UK';
      case 'CAD': return 'CA';
      case 'AUD': return 'AU';
      case 'JPY': return 'JP';
      default: return 'US';
    }
  };
  
  if (price === null) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="text-muted-foreground text-sm">Price unavailable</div>
        {storeUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={storeUrl} target="_blank" rel="noopener noreferrer">
              Check at store
              <ExternalLink className="w-3 h-3 ml-1.5" />
            </a>
          </Button>
        )}
      </div>
    );
  }
  
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        <span className={cn('font-bold text-foreground', sizes.price)}>
          {formattedPrice}
        </span>
        {suffix && (
          <span className={cn('text-muted-foreground', sizes.unit)}>{suffix}</span>
        )}
        <PriceSourceIndicator 
          sourceType={priceSource} 
          sourceCurrency={showApproximate ? sourceCurrency : undefined}
        />
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <div className={cn('space-y-3', className)}>
        {/* Main price display */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            {/* Price with tooltip for converted prices */}
            {showApproximate ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn('font-bold text-foreground cursor-help', sizes.price)}>
                    {formattedPrice}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px]">
                  <div className="space-y-2">
                    <p className="font-medium">Estimated price</p>
                    <p className="text-xs text-muted-foreground">
                      This price is converted from {sourceCurrency} using current exchange rates.
                      The actual store price may differ slightly.
                    </p>
                    {storeUrl && (
                      <p className="text-xs text-primary">
                        Click "Buy Now" to see the exact price
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className={cn('font-bold text-foreground', sizes.price)}>
                {formattedPrice}
              </span>
            )}
            
            {suffix && (
              <span className={cn('text-muted-foreground font-medium', sizes.unit)}>
                {suffix}
              </span>
            )}
          </div>
          
          {/* Source and freshness badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {showSourceBadge && (
              <PriceSourceBadge
                sourceType={priceSource}
                storeName={isActualRegionalPrice ? `${getRegionName()} Store` : undefined}
                storeUrl={storeUrl}
                sourceCurrency={showApproximate ? sourceCurrency : undefined}
                targetCurrency={currency}
                isUsingFallback={isUsingFallback}
                fallbackRegion={shipsFromCountry}
                size="sm"
              />
            )}
            
            {showFreshness && lastVerifiedAt && (
              <PriceFreshnessIndicator
                lastVerified={lastVerifiedAt}
                compact
              />
            )}
          </div>
        </div>
        
        {/* Ships from warning */}
        {isUsingFallback && shipsFromCountry && (
          <div className="flex flex-col gap-0.5 px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs text-amber-400">
              ⚠️ Ships from {shipsFromCountry} - local store not available
            </span>
            <span className="text-[10px] text-amber-400/60">
              International shipping • Duties may apply
            </span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Price comparison display for admin/verification
 * Shows when live price differs from cached price
 */
interface PriceComparisonProps {
  cachedPrice: number;
  livePrice: number;
  currency: CurrencyCode;
  storeName?: string;
  onUpdate?: () => void;
  isAdmin?: boolean;
  className?: string;
}

export function PriceComparison({
  cachedPrice,
  livePrice,
  currency,
  storeName = 'store',
  onUpdate,
  isAdmin = false,
  className,
}: PriceComparisonProps) {
  const { formatPrice } = useRegion();
  
  const priceDiff = livePrice - cachedPrice;
  const percentChange = ((priceDiff / cachedPrice) * 100).toFixed(1);
  const isIncrease = priceDiff > 0;
  
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border',
      isIncrease 
        ? 'bg-red-500/10 border-red-500/30' 
        : 'bg-green-500/10 border-green-500/30',
      className
    )}>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium',
            isIncrease ? 'text-red-400' : 'text-green-400'
          )}>
            Price {isIncrease ? 'increased' : 'decreased'} {Math.abs(Number(percentChange))}%
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Store price: <span className="font-medium text-foreground">{formatPrice(livePrice)}</span>
          {' '}(was {formatPrice(cachedPrice)} in our database)
        </div>
      </div>
      
      {isAdmin && onUpdate && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={onUpdate}
          className="shrink-0"
        >
          <RefreshCw className="w-3 h-3 mr-1.5" />
          Update
        </Button>
      )}
    </div>
  );
}

export default EnhancedPriceDisplay;
