import { Store, ArrowRightLeft, Globe, MapPin, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CurrencyCode, CURRENCY_CONFIGS } from "@/types/regional";

export type PriceSourceType = 'regional' | 'converted' | 'unavailable';

interface PriceSourceBadgeProps {
  /** The source of the price data */
  sourceType: PriceSourceType;
  /** The store/region the price comes from */
  storeName?: string;
  /** Full store URL for display */
  storeUrl?: string | null;
  /** Source currency if converted */
  sourceCurrency?: CurrencyCode;
  /** Target currency being displayed */
  targetCurrency?: CurrencyCode;
  /** Whether using a fallback region */
  isUsingFallback?: boolean;
  /** The fallback region being used */
  fallbackRegion?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional className */
  className?: string;
}

const sourceConfig = {
  regional: {
    label: 'Store Price',
    icon: Store,
    colorClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    description: 'Direct price from the regional store',
  },
  converted: {
    label: 'Converted',
    icon: ArrowRightLeft,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    description: 'Price converted from another currency',
  },
  unavailable: {
    label: 'Check Store',
    icon: Globe,
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted/50 border-border',
    description: 'Price not available - verify at store',
  },
};

/**
 * Badge component that shows the source of a price
 * Helps users understand if they're seeing an actual store price or a conversion
 */
export function PriceSourceBadge({
  sourceType,
  storeName,
  storeUrl,
  sourceCurrency,
  targetCurrency,
  isUsingFallback = false,
  fallbackRegion,
  size = 'sm',
  className,
}: PriceSourceBadgeProps) {
  const config = sourceConfig[sourceType];
  const Icon = config.icon;
  
  // Extract domain from URL for display
  const storeDomain = storeUrl ? (() => {
    try {
      return new URL(storeUrl).hostname.replace('www.', '');
    } catch {
      return null;
    }
  })() : null;
  
  // Build the label
  const getLabelText = () => {
    if (sourceType === 'regional' && storeName) {
      return `${storeName} Price`;
    }
    if (sourceType === 'converted' && sourceCurrency) {
      const currencyName = CURRENCY_CONFIGS[sourceCurrency]?.name || sourceCurrency;
      return `From ${currencyName}`;
    }
    return config.label;
  };
  
  // Build tooltip content
  const getTooltipContent = () => {
    if (sourceType === 'regional') {
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span className="font-medium">Actual store price</span>
          </div>
          {storeDomain && (
            <p className="text-xs text-muted-foreground">
              from {storeDomain}
            </p>
          )}
          <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
            This is the real price listed on the store, not an estimate
          </p>
        </div>
      );
    }
    
    if (sourceType === 'converted') {
      const sourceName = sourceCurrency ? (CURRENCY_CONFIGS[sourceCurrency]?.name || sourceCurrency) : 'USD';
      const targetName = targetCurrency ? (CURRENCY_CONFIGS[targetCurrency]?.name || targetCurrency) : 'your currency';
      
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium">Estimated price</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Converted from {sourceName} to {targetName} using current exchange rates
          </p>
          {isUsingFallback && fallbackRegion && (
            <p className="text-xs text-amber-400">
              No {targetName} store available - showing {fallbackRegion} store price
            </p>
          )}
          <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
            Actual store price may differ slightly
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-1.5">
        <span className="font-medium">Price unavailable</span>
        <p className="text-xs text-muted-foreground">
          Check the store directly for current pricing
        </p>
      </div>
    );
  };

  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-1.5 py-0.5 gap-1' 
    : 'text-xs px-2 py-1 gap-1.5';
  
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'inline-flex items-center font-medium border cursor-help',
              sizeClasses,
              config.bgClass,
              config.colorClass,
              className
            )}
          >
            <Icon className={iconSize} />
            <span>{getLabelText()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-[250px] bg-card border border-border"
        >
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact inline version for tight spaces
 */
export function PriceSourceIndicator({
  sourceType,
  sourceCurrency,
  className,
}: Pick<PriceSourceBadgeProps, 'sourceType' | 'sourceCurrency' | 'className'>) {
  const config = sourceConfig[sourceType];
  const Icon = config.icon;
  
  const getLabelText = () => {
    if (sourceType === 'converted' && sourceCurrency) {
      return `from ${sourceCurrency}`;
    }
    return sourceType === 'regional' ? 'store price' : 'estimate';
  };
  
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px]', config.colorClass, className)}>
      <Icon className="h-3 w-3" />
      <span>{getLabelText()}</span>
    </span>
  );
}

/**
 * Region badge showing where the price ships from
 * Shows additional international shipping notice when user region doesn't match store region
 */
interface ShipsFromBadgeProps {
  country: string;
  /** User's current region code (e.g., 'EU', 'UK', 'CA') */
  userRegion?: string;
  /** Store's region code (e.g., 'US') */
  storeRegion?: string;
  className?: string;
}

export function ShipsFromBadge({ country, userRegion, storeRegion, className }: ShipsFromBadgeProps) {
  // Determine if this is international shipping
  const isInternationalShipping = userRegion && storeRegion && userRegion !== storeRegion;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5',
              isInternationalShipping
                ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                : 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
              'cursor-help',
              className
            )}
          >
            <MapPin className="h-3 w-3" />
            <span>Ships from {country}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[220px]">
          <p>This product ships from {country}</p>
          {isInternationalShipping ? (
            <>
              <p className="text-amber-400 mt-1">International shipping required</p>
              <p className="text-muted-foreground">Duties and customs fees may apply</p>
            </>
          ) : (
            <p className="text-muted-foreground">Shipping costs and times may vary</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default PriceSourceBadge;
