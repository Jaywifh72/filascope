import { ShoppingCart, Check, Zap, Loader2 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { calculateDiscountedPrice } from "@/lib/pricingRules";

interface PrimaryBuyButtonProps {
  retailerName: string;
  url: string;
  price: number | null;
  currency: string;
  quantity?: number;
  hasBestPrice?: boolean;
  hasBundle?: boolean;
  hasFastShipping?: boolean;
  hasActualRegionalPrice?: boolean;
  isLoading?: boolean;
  compareAtPrice?: number | null;
  onClick?: () => void;
}

export function PrimaryBuyButton({
  retailerName,
  url,
  price,
  currency,
  quantity = 1,
  hasBestPrice = false,
  hasBundle = false,
  hasFastShipping = false,
  hasActualRegionalPrice = false,
  isLoading = false,
  compareAtPrice,
  onClick,
}: PrimaryBuyButtonProps) {
  const { formatPrice, formatRegionalPrice } = useCurrency();
  
  // Use the appropriate formatter based on whether we have an actual regional price
  const formatPriceValue = (value: number) => 
    hasActualRegionalPrice ? formatRegionalPrice(value) : formatPrice(value);
  
  // Calculate discounted price if quantity > 1
  const discountedPrice = price !== null 
    ? calculateDiscountedPrice(price, retailerName, quantity)
    : null;
  const total = discountedPrice !== null ? discountedPrice * quantity : null;
  const hasDiscount = price !== null && discountedPrice !== null && discountedPrice < price;
  const hasLiveSale = compareAtPrice !== null && price !== null && compareAtPrice > price;
  
  return (
    <div className="space-y-2">
      {/* Badges above button */}
      {(hasBestPrice || hasBundle || hasFastShipping) && (
        <div className="flex flex-wrap gap-2">
          {hasBestPrice && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              <Check className="w-3 h-3" />
              Best Price
            </span>
          )}
          {hasFastShipping && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
              <Zap className="w-3 h-3" />
              Fast Shipping
            </span>
          )}
          {hasBundle && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20">
              🎁 Bundle Available
            </span>
          )}
        </div>
      )}
      
      {/* Primary Button */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={cn(
          "group flex items-center justify-between w-full",
          "min-h-14 py-3 px-5 rounded-lg",
          "bg-primary text-primary-foreground",
          "font-semibold text-lg",
          "shadow-[0_4px_12px_hsla(187,100%,46%,0.3)]",
          "hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_hsla(187,100%,46%,0.4)]",
          "active:scale-[0.98]",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          "btn-breathing",
          isLoading && "opacity-70 pointer-events-none animate-none"
        )}
      >
        <span className="flex items-center gap-2 flex-wrap">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
          ) : (
            <ShoppingCart className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-left">Buy from {retailerName}</span>
        </span>
        
        {isLoading ? (
          <span className="flex flex-col items-end gap-0.5">
            <span className="h-5 w-16 rounded bg-primary-foreground/20 animate-pulse" />
          </span>
        ) : total !== null ? (
          <span className="flex flex-col items-end">
            <span className="font-bold tabular-nums">
              {formatPriceValue(total)}
            </span>
            {hasLiveSale && quantity === 1 && (
              <span className="text-xs opacity-80 line-through">
                {formatPriceValue(compareAtPrice)}
              </span>
            )}
            {quantity > 1 && (
              <span className="text-xs opacity-80 tabular-nums">
                {quantity} × {formatPriceValue(discountedPrice || 0)}
                {hasDiscount && <span className="ml-1 line-through opacity-60">{formatPriceValue(price || 0)}</span>}
              </span>
            )}
          </span>
        ) : null}
      </a>
    </div>
  );
}
