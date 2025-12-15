import { getVolumeTiers, getCurrentDiscount } from "@/lib/pricingRules";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { Tag } from "lucide-react";

interface VolumeDiscountSliderProps {
  price: number;
  vendor: string;
  quantity: number;
  onQuantityChange: (qty: number) => void;
}

export function VolumeDiscountSlider({ 
  price, 
  vendor, 
  quantity,
  onQuantityChange 
}: VolumeDiscountSliderProps) {
  const { formatPrice } = useCurrency();
  const tiers = getVolumeTiers(vendor);
  const currentTier = getCurrentDiscount(vendor, quantity);
  
  // Only show if there are actual discounts available
  const hasDiscounts = tiers.some(t => t.discountPercent > 0);
  if (!hasDiscounts) return null;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Tag className="h-4 w-4" />
        <span>Volume Discounts</span>
      </div>
      
      <div className="space-y-1.5">
        {tiers.map((tier, index) => {
          const isActive = tier.minQty === currentTier.minQty;
          const discountedPrice = price * (1 - tier.discountPercent / 100);
          const totalSavings = tier.discountPercent > 0 
            ? (price - discountedPrice) * tier.minQty 
            : 0;
          
          return (
            <button
              key={tier.minQty}
              onClick={() => onQuantityChange(tier.minQty)}
              className={cn(
                "w-full flex items-center justify-between p-2 rounded-lg transition-all text-sm",
                "hover:bg-muted/50",
                isActive 
                  ? "bg-cyan-500/10 border border-cyan-500/30" 
                  : "border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full border-2",
                  isActive 
                    ? "border-cyan-500 bg-cyan-500" 
                    : "border-muted-foreground"
                )} />
                <span className={cn(isActive && "font-medium")}>
                  {tier.minQty === 1 ? '1 spool' : `${tier.minQty}+ spools`}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={cn(
                  "tabular-nums",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {formatPrice(discountedPrice)}/ea
                </span>
                
                {tier.discountPercent > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 tabular-nums">
                    Save {tier.discountPercent}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {currentTier.discountPercent > 0 && (
        <p className="text-xs text-emerald-500 text-center">
          You're saving {currentTier.discountPercent}% with bulk pricing
        </p>
      )}
    </div>
  );
}
