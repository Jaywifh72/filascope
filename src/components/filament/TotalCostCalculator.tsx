import { Minus, Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";
import { getShippingRule, calculateShipping, getCurrentDiscount, calculateDiscountedPrice } from "@/lib/pricingRules";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface TotalCostCalculatorProps {
  price: number;
  vendor: string;
  quantity: number;
  onQuantityChange: (qty: number) => void;
}

export function TotalCostCalculator({ 
  price, 
  vendor, 
  quantity, 
  onQuantityChange 
}: TotalCostCalculatorProps) {
  const { formatPrice } = useCurrency();
  
  const shippingRule = getShippingRule(vendor);
  const currentTier = getCurrentDiscount(vendor, quantity);
  const discountedPrice = calculateDiscountedPrice(price, vendor, quantity);
  const subtotal = discountedPrice * quantity;
  const shipping = calculateShipping(vendor, subtotal);
  const total = subtotal + shipping;
  
  const hasDiscount = currentTier.discountPercent > 0;
  const savings = hasDiscount ? (price - discountedPrice) * quantity : 0;
  
  // Progress towards free shipping
  const progressToFreeShipping = shippingRule.flatRate > 0 
    ? Math.min(100, (subtotal / shippingRule.freeThreshold) * 100)
    : 100;
  const amountToFreeShipping = Math.max(0, shippingRule.freeThreshold - subtotal);
  
  return (
    <div className="space-y-4">
      {/* Quantity selector */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Quantity</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-medium tabular-nums">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onQuantityChange(Math.min(99, quantity + 1))}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Price breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {quantity} × {formatPrice(discountedPrice)}
            {hasDiscount && (
              <span className="ml-1 line-through text-muted-foreground/50">
                {formatPrice(price)}
              </span>
            )}
          </span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        
        {hasDiscount && (
          <div className="flex justify-between text-emerald-500">
            <span>Volume discount ({currentTier.discountPercent}%)</span>
            <span>-{formatPrice(savings)}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Truck className="h-3 w-3" />
            Shipping
          </span>
          <span className={cn(shipping === 0 && "text-emerald-500")}>
            {shipping === 0 ? 'Free' : formatPrice(shipping)}
          </span>
        </div>
        
        <div className="border-t border-border pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-lg">{formatPrice(total)}</span>
        </div>
      </div>
      
      {/* Free shipping progress */}
      {shippingRule.flatRate > 0 && progressToFreeShipping < 100 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              {formatPrice(amountToFreeShipping)} more for free shipping
            </span>
            <span>{Math.round(progressToFreeShipping)}%</span>
          </div>
          <Progress value={progressToFreeShipping} className="h-1.5" />
        </div>
      )}
    </div>
  );
}
