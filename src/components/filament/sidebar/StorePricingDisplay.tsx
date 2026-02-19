/**
 * StorePricingDisplay Component
 * 
 * Displays store-based pricing from the filament_prices table with:
 * - Price in user's currency (auto-converted if needed)
 * - Store name badge with store type indicator
 * - "Local" badge for same-region stores
 * - "Ships from [Country]" warning for international
 * - Original currency shown in parentheses for conversions
 */

import React from 'react';
import { ExternalLink, Globe, Truck, Store, CheckCircle2, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { REGIONS } from '@/config/regions';
import type { StorePrice } from '@/hooks/useFilamentStorePricing';
import { getStoreTypeBadge, getShippingDisplayText } from '@/hooks/useFilamentStorePricing';
import type { RegionCode } from '@/types/regional';

interface StorePricingDisplayProps {
  /** The store price to display */
  storePrice: StorePrice;
  /** Weight in grams for per-kg calculation */
  weightGrams?: number | null;
  /** Affiliate URL for the buy button */
  affiliateUrl?: string | null;
  /** Callback when buy button is clicked */
  onBuyClick?: () => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the buy button */
  showBuyButton?: boolean;
  /** Whether to show per-kg price */
  showPerKg?: boolean;
}

export function StorePricingDisplay({
  storePrice,
  weightGrams,
  affiliateUrl,
  onBuyClick,
  size = 'lg',
  showBuyButton = true,
  showPerKg = true,
}: StorePricingDisplayProps) {
  const regionConfig = REGIONS[storePrice.storeRegion];
  const storeTypeBadge = getStoreTypeBadge(storePrice.storeType);
  const shippingText = getShippingDisplayText(storePrice);
  
  // Calculate price per kg
  const pricePerKg = weightGrams && weightGrams > 0
    ? storePrice.priceDisplay / (weightGrams / 1000)
    : null;
  
  // Format price per kg with ~ for converted
  const formattedPerKg = pricePerKg !== null
    ? `${storePrice.isConverted ? '~' : ''}${storePrice.formattedPrice.charAt(0)}${pricePerKg.toFixed(2)}/kg`
    : null;
  
  // Format price date
  const priceDate = storePrice.lastVerifiedAt 
    ? format(new Date(storePrice.lastVerifiedAt), 'MMM d, yyyy')
    : null;
  
  const handleBuyClick = () => {
    if (onBuyClick) {
      onBuyClick();
    }
    if (affiliateUrl || storePrice.productUrl) {
      window.open(affiliateUrl || storePrice.productUrl || '', '_blank', 'noopener,noreferrer');
    }
  };
  
  const sizeClasses = {
    sm: {
      price: 'text-lg font-bold',
      perKg: 'text-sm',
      badge: 'text-xs',
    },
    md: {
      price: 'text-xl font-bold',
      perKg: 'text-sm',
      badge: 'text-xs',
    },
    lg: {
      price: 'text-2xl font-bold',
      perKg: 'text-base',
      badge: 'text-xs',
    },
  };
  
  const classes = sizeClasses[size];

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Price Display */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={cn(classes.price, 'text-foreground')}>
              {showPerKg && formattedPerKg ? formattedPerKg : storePrice.formattedPrice}
            </span>
            
            {/* Original price for conversions */}
            {storePrice.isConverted && storePrice.originalPrice && (
              <span className="text-sm text-muted-foreground">
                ({storePrice.originalCurrency} {storePrice.originalPrice.toFixed(2)})
              </span>
            )}
          </div>
          
          {/* Store name and price date */}
          <div className="text-sm text-muted-foreground">
            from {storePrice.storeName} {regionConfig?.flag}
          </div>
          
          {/* Show spool price if displaying per-kg */}
          {showPerKg && formattedPerKg && (
            <div className="text-sm text-muted-foreground">
              {storePrice.formattedPrice} per spool
            </div>
          )}
          
          {/* Price date */}
          {priceDate && (
            <div className="text-xs text-muted-foreground">
              Price from {priceDate}
            </div>
          )}
        </div>

        {/* Store Info Badges */}
        <div className="flex flex-wrap gap-2">
          {/* Store Name Badge */}
          <Badge 
            variant="outline" 
            className={cn(
              "font-medium",
              storeTypeBadge.className
            )}
          >
            <Store className="w-3 h-3 mr-1" />
            {storePrice.storeName}
          </Badge>
          
          {/* Store Type Badge */}
          <Badge 
            variant="secondary" 
            className={cn("font-medium", storeTypeBadge.className)}
          >
            {storeTypeBadge.label}
          </Badge>
        </div>

        {/* Region Badge */}
        <div className="flex items-center">
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
            storePrice.isLocalStore 
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-muted/50 border border-border/60 text-muted-foreground"
          )}>
            <span className="text-base">{regionConfig?.flag || '🌐'}</span>
            {storePrice.isLocalStore ? (
              <>
                <span>{regionConfig?.name || storePrice.storeRegion} Store</span>
                <span className="text-xs bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Local
                </span>
              </>
            ) : (
              <span>Ships from {regionConfig?.name || storePrice.storeRegion}</span>
            )}
          </div>
        </div>

        {/* International Shipping Warning */}
        {!storePrice.isLocalStore && shippingText && (
          <div className="flex items-start gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2 py-1.5 rounded-md">
            <Truck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="font-medium">{shippingText}</span>
              {storePrice.shipsToUser ? (
                <span className="text-amber-400/60 text-[10px]">
                  International shipping • Duties may apply
                </span>
              ) : (
                <span className="text-amber-400/80 text-[10px]">
                  May not ship to your region
                </span>
              )}
            </div>
          </div>
        )}

        {/* Buy Button */}
        {showBuyButton && (affiliateUrl || storePrice.productUrl) && (
          <Button
            onClick={handleBuyClick}
            className={cn(
              "w-full font-bold tracking-wide",
              size === 'lg' && "h-14 text-lg",
              size === 'md' && "h-12 text-base",
              size === 'sm' && "h-10 text-sm",
              "bg-gradient-to-r from-primary to-primary/80",
              "hover:from-primary/90 hover:to-primary/70",
              "shadow-[0_4px_16px_rgba(0,212,212,0.25)]",
              "hover:shadow-[0_8px_24px_rgba(0,212,212,0.35)]",
              "hover:-translate-y-0.5 transition-all duration-200"
            )}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy at {storePrice.storeName}
            <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Compact version for list views
 */
export function StorePricingBadge({
  storePrice,
  weightGrams,
}: {
  storePrice: StorePrice;
  weightGrams?: number | null;
}) {
  const regionConfig = REGIONS[storePrice.storeRegion];
  
  const pricePerKg = weightGrams && weightGrams > 0
    ? storePrice.priceDisplay / (weightGrams / 1000)
    : null;

  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-foreground">
        {storePrice.isConverted && '~'}
        {storePrice.formattedPrice}
      </span>
      <span className="text-xs text-muted-foreground">
        at {storePrice.storeName}
      </span>
      {!storePrice.isLocalStore && (
        <span className="text-xs">
          {regionConfig?.flag}
        </span>
      )}
    </div>
  );
}
