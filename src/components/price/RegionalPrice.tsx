import { Info, ArrowRightLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRegion } from "@/contexts/RegionContext";
import { CurrencyCode, CURRENCY_CONFIGS, formatCurrencyPrice } from "@/types/regional";
import { cn } from "@/lib/utils";

interface RegionalPriceProps {
  /** The amount in source currency */
  amount: number;
  /** The currency the amount is stored in (source currency) */
  sourceCurrency?: CurrencyCode;
  /** Override the target currency (defaults to user's selected currency) */
  targetCurrency?: CurrencyCode;
  /** Show tooltip with conversion details */
  showTooltip?: boolean;
  /** Show the "~" prefix for converted prices */
  showConversionIndicator?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional className */
  className?: string;
  /** Show per-unit suffix like "/kg" */
  suffix?: string;
  /** Price style variant */
  variant?: 'default' | 'sale' | 'muted';
  /** Show currency code after price */
  showCurrencyCode?: boolean;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const variantClasses = {
  default: 'text-white font-bold',
  sale: 'text-green-400 font-bold',
  muted: 'text-muted-foreground',
};

/**
 * RegionalPrice - Unified component for displaying prices with regional conversion
 * 
 * Automatically converts prices to the user's selected currency and shows
 * conversion indicators and tooltips with original price/rate details.
 * 
 * @example
 * // Price stored in USD, user viewing in CAD
 * <RegionalPrice amount={12.00} sourceCurrency="USD" />
 * // Renders: ~C$16.20 with tooltip showing conversion details
 * 
 * @example
 * // Price per kg
 * <RegionalPrice amount={25.00} sourceCurrency="USD" suffix="/kg" size="lg" />
 * // Renders: ~C$33.75/kg
 */
export function RegionalPrice({
  amount,
  sourceCurrency = 'USD',
  targetCurrency,
  showTooltip = true,
  showConversionIndicator = true,
  size = 'md',
  className,
  suffix,
  variant = 'default',
  showCurrencyCode = false,
}: RegionalPriceProps) {
  const { currency, getConversionRate, exchangeRates } = useRegion();
  
  // Use target currency from props or fall back to user's selected currency
  const displayCurrency = targetCurrency || currency;
  
  // Check if conversion is needed
  const needsConversion = sourceCurrency !== displayCurrency;
  
  // Get conversion rate
  const rate = needsConversion 
    ? getConversionRate(sourceCurrency, displayCurrency) 
    : 1;
  
  // Calculate display amount
  const displayAmount = needsConversion ? amount * rate : amount;
  
  // Format the prices
  const formattedDisplayPrice = formatCurrencyPrice(displayAmount, displayCurrency);
  const formattedOriginalPrice = formatCurrencyPrice(amount, sourceCurrency);
  
  // Get last updated time from exchange rates
  const lastUpdated = exchangeRates?.[displayCurrency]?.fetched_at;
  const lastUpdatedFormatted = lastUpdated 
    ? new Date(lastUpdated).toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  const priceContent = (
    <span
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        needsConversion && showConversionIndicator && 'cursor-help',
        className
      )}
    >
      {needsConversion && showConversionIndicator && (
        <span className="text-muted-foreground">~</span>
      )}
      {formattedDisplayPrice}
      {showCurrencyCode && (
        <span className="text-muted-foreground text-[0.8em] ml-1">{displayCurrency}</span>
      )}
      {suffix && (
        <span className="text-muted-foreground text-[0.8em] font-normal">{suffix}</span>
      )}
    </span>
  );

  // If no conversion or tooltip disabled, just return the price
  if (!needsConversion || !showTooltip) {
    return priceContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {priceContent}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-[250px] bg-card border border-border p-3"
        >
          <div className="space-y-2">
            {/* Conversion indicator header */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowRightLeft className="w-3 h-3" />
              <span>Converted from {CURRENCY_CONFIGS[sourceCurrency].name}</span>
            </div>
            
            {/* Original price */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Original:</span>
              <span className="font-medium text-foreground">
                {formattedOriginalPrice} {sourceCurrency}
              </span>
            </div>
            
            {/* Exchange rate */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Rate:</span>
              <span className="font-mono text-xs text-foreground">
                1 {sourceCurrency} = {rate.toFixed(4)} {displayCurrency}
              </span>
            </div>
            
            {/* Last updated */}
            {lastUpdatedFormatted && (
              <div className="flex justify-between items-center text-xs text-muted-foreground pt-1 border-t border-border/50">
                <span>Updated:</span>
                <span>{lastUpdatedFormatted}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * RegionalPricePair - Shows both original and sale price together
 */
interface RegionalPricePairProps {
  originalAmount: number;
  saleAmount: number;
  sourceCurrency?: CurrencyCode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function RegionalPricePair({
  originalAmount,
  saleAmount,
  sourceCurrency = 'USD',
  size = 'md',
  className,
}: RegionalPricePairProps) {
  const { currency, getConversionRate } = useRegion();
  
  const needsConversion = sourceCurrency !== currency;
  const rate = needsConversion ? getConversionRate(sourceCurrency, currency) : 1;
  
  const displayOriginal = needsConversion ? originalAmount * rate : originalAmount;
  const displaySale = needsConversion ? saleAmount * rate : saleAmount;
  
  const formattedOriginal = formatCurrencyPrice(displayOriginal, currency);
  const formattedSale = formatCurrencyPrice(displaySale, currency);
  
  const discount = Math.round(((originalAmount - saleAmount) / originalAmount) * 100);

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <RegionalPrice
        amount={saleAmount}
        sourceCurrency={sourceCurrency}
        size={size}
        variant="sale"
      />
      <span className={cn("line-through", sizeClasses[size === 'xl' ? 'lg' : size === 'lg' ? 'md' : 'sm'], "text-muted-foreground")}>
        {needsConversion && '~'}{formattedOriginal}
      </span>
      {discount > 0 && (
        <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
          -{discount}%
        </span>
      )}
    </div>
  );
}

export default RegionalPrice;
