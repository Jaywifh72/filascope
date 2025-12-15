import { ShoppingCart, Check, Zap } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

interface PrimaryBuyButtonProps {
  retailerName: string;
  url: string;
  price: number | null;
  currency: string;
  hasBestPrice?: boolean;
  hasBundle?: boolean;
  hasFastShipping?: boolean;
  onClick?: () => void;
}

export function PrimaryBuyButton({
  retailerName,
  url,
  price,
  currency,
  hasBestPrice = false,
  hasBundle = false,
  hasFastShipping = false,
  onClick,
}: PrimaryBuyButtonProps) {
  const { formatPrice } = useCurrency();
  
  return (
    <div className="space-y-2">
      {/* Badges above button */}
      {(hasBestPrice || hasBundle || hasFastShipping) && (
        <div className="flex flex-wrap gap-2">
          {hasBestPrice && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
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
          "h-14 px-5 rounded-lg",
          "bg-primary text-primary-foreground",
          "font-semibold text-lg",
          "shadow-[0_4px_12px_hsl(var(--primary)/0.3)]",
          "hover:brightness-110 hover:scale-[1.02] hover:shadow-[0_8px_24px_hsl(var(--primary)/0.4)]",
          "active:scale-[0.98]",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        )}
      >
        <span className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <span>Buy from {retailerName}</span>
        </span>
        
        {price !== null && (
          <span className="font-bold tabular-nums">
            {formatPrice(price)}
          </span>
        )}
      </a>
    </div>
  );
}
