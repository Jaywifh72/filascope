/**
 * StorePriceDisplay Component
 *
 * Unified component for displaying store prices consistently across the app.
 * Handles:
 * - Tilde (~) prefix for converted prices
 * - Original currency in parentheses
 * - Price per kg calculation
 * - Flag and store name display
 * - Local badge for same-region stores
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { REGIONS } from '@/config/regions';
import { useRegion } from '@/contexts/RegionContext';
import { 
  CurrencyCode, 
  RegionCode, 
  formatCurrencyPrice, 
  CURRENCY_CONFIGS 
} from '@/types/regional';

export interface StorePriceDisplayProps {
  /** Price in cents (will be divided by 100) or dollars if isDollars=true */
  price: number;
  /** Whether price is already in dollars (not cents) */
  isDollars?: boolean;
  /** Display currency (user's selected) */
  currency: CurrencyCode;
  /** Source currency if different from display currency */
  originalCurrency?: CurrencyCode;
  /** Original price in same unit as `price` if converted */
  originalPrice?: number;
  /** Store name to display */
  storeName?: string;
  /** Store's region for flag display */
  storeRegion?: RegionCode;
  /** Show "/kg" suffix */
  showPerKg?: boolean;
  /** Show "at StoreName" text */
  showStoreName?: boolean;
  /** Show region flag emoji */
  showFlag?: boolean;
  /** Show "Local" badge when isLocal=true */
  showLocalBadge?: boolean;
  /** Whether this is a local store for the user */
  isLocal?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
  /** Show the original price in parentheses for conversions */
  showOriginalPrice?: boolean;
  /** Inline layout (price and store on same line) */
  inline?: boolean;
}

const sizeClasses = {
  sm: {
    price: 'text-sm font-bold',
    suffix: 'text-xs',
    store: 'text-xs',
    badge: 'text-[9px] px-1 py-0.5',
  },
  md: {
    price: 'text-lg font-bold',
    suffix: 'text-sm',
    store: 'text-sm',
    badge: 'text-[10px] px-1.5 py-0.5',
  },
  lg: {
    price: 'text-xl font-bold',
    suffix: 'text-base',
    store: 'text-sm',
    badge: 'text-xs px-2 py-1',
  },
};

export function StorePriceDisplay({
  price,
  isDollars = true,
  currency,
  originalCurrency,
  originalPrice,
  storeName,
  storeRegion,
  showPerKg = false,
  showStoreName = true,
  showFlag = true,
  showLocalBadge = true,
  isLocal = false,
  size = 'md',
  className,
  showOriginalPrice = true,
  inline = false,
}: StorePriceDisplayProps) {
  const { formatPrice: regionFormatPrice } = useRegion();
  
  // Convert cents to dollars if needed
  const displayPrice = isDollars ? price : price / 100;
  const displayOriginalPrice = originalPrice 
    ? (isDollars ? originalPrice : originalPrice / 100) 
    : null;
  
  // Determine if this is a converted price
  const isConverted = originalCurrency && originalCurrency !== currency;
  
  // Get region config for flag
  const regionConfig = storeRegion ? REGIONS[storeRegion] : null;
  const flag = regionConfig?.flag;
  
  // Format the display price
  const formattedPrice = formatCurrencyPrice(displayPrice, currency);
  
  // Format original price if showing
  const formattedOriginal = displayOriginalPrice && originalCurrency
    ? formatCurrencyPrice(displayOriginalPrice, originalCurrency)
    : null;
  
  const classes = sizeClasses[size];

  const priceContent = (
    <>
      {/* Tilde for converted prices */}
      {isConverted && (
        <span className="text-muted-foreground">~</span>
      )}
      {formattedPrice}
      {/* Per kg suffix */}
      {showPerKg && (
        <span className={cn('text-muted-foreground font-normal', classes.suffix)}>/kg</span>
      )}
    </>
  );

  const originalContent = isConverted && showOriginalPrice && formattedOriginal && originalCurrency && (
    <span className={cn('text-muted-foreground', classes.suffix)}>
      ({formattedOriginal} {originalCurrency})
    </span>
  );

  const storeContent = (showStoreName || showFlag) && (
    <span className={cn('text-muted-foreground flex items-center gap-1', classes.store)}>
      {showStoreName && storeName && (
        <span>at {storeName}</span>
      )}
      {showFlag && flag && (
        <span>{flag}</span>
      )}
    </span>
  );

  const localBadge = showLocalBadge && isLocal && (
    <span className={cn(
      'inline-flex items-center font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded',
      classes.badge
    )}>
      Local
    </span>
  );

  if (inline) {
    return (
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        <span className={cn('text-foreground', classes.price)}>
          {priceContent}
        </span>
        {originalContent}
        {storeContent}
        {localBadge}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={cn('text-foreground', classes.price)}>
          {priceContent}
        </span>
        {originalContent}
      </div>
      {(storeContent || localBadge) && (
        <div className="flex items-center gap-2">
          {storeContent}
          {localBadge}
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline price display for lists
 * Format: ~$22.57/kg at Polymaker 🇺🇸 Local
 */
export function StorePriceInline({
  price,
  isDollars = true,
  currency,
  originalCurrency,
  storeName,
  storeRegion,
  showPerKg = true,
  isLocal = false,
  size = 'sm',
  className,
}: Omit<StorePriceDisplayProps, 'inline' | 'showOriginalPrice' | 'originalPrice' | 'showStoreName' | 'showFlag' | 'showLocalBadge'>) {
  return (
    <StorePriceDisplay
      price={price}
      isDollars={isDollars}
      currency={currency}
      originalCurrency={originalCurrency}
      storeName={storeName}
      storeRegion={storeRegion}
      showPerKg={showPerKg}
      showStoreName={!!storeName}
      showFlag={!!storeRegion}
      showLocalBadge={true}
      isLocal={isLocal}
      size={size}
      className={className}
      showOriginalPrice={false}
      inline={true}
    />
  );
}

/**
 * Price badge for compact displays (cards, lists)
 * Shows just the price with tilde if converted
 */
export function StorePriceBadge({
  price,
  isDollars = true,
  currency,
  originalCurrency,
  showPerKg = false,
  size = 'md',
  className,
}: Pick<StorePriceDisplayProps, 'price' | 'isDollars' | 'currency' | 'originalCurrency' | 'showPerKg' | 'size' | 'className'>) {
  const displayPrice = isDollars ? price : price / 100;
  const isConverted = originalCurrency && originalCurrency !== currency;
  const formattedPrice = formatCurrencyPrice(displayPrice, currency);
  const classes = sizeClasses[size];

  return (
    <span className={cn('text-foreground', classes.price, className)}>
      {isConverted && <span className="text-muted-foreground">~</span>}
      {formattedPrice}
      {showPerKg && (
        <span className={cn('text-muted-foreground font-normal', classes.suffix)}>/kg</span>
      )}
    </span>
  );
}

export default StorePriceDisplay;
