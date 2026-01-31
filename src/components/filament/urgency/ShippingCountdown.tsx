import React from 'react';
import { Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';

interface ShippingCountdownProps {
  freeShippingThreshold?: number;
  currentCartValue?: number;
  compact?: boolean;
  className?: string;
}

export function ShippingCountdown({ 
  freeShippingThreshold = 50,
  currentCartValue = 0,
  compact = false,
  className
}: ShippingCountdownProps) {
  const { formatPrice } = useCurrency();
  const amountToFreeShipping = freeShippingThreshold - currentCartValue;
  const qualifiesForFreeShipping = amountToFreeShipping <= 0;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        {qualifiesForFreeShipping && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <Truck className="w-3.5 h-3.5" />
            <span>Free shipping!</span>
          </div>
        )}
      </div>
    );
  }

  // Don't show anything if already qualified
  if (qualifiesForFreeShipping) {
    return (
      <div className={cn("flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20", className)}>
        <Truck className="w-4 h-4 text-emerald-400" />
        <span className="text-[13px] font-bold text-emerald-400">
          You qualify for FREE shipping!
        </span>
      </div>
    );
  }

  // Show progress toward free shipping
  const progressPercent = Math.min((currentCartValue / freeShippingThreshold) * 100, 100);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
        <Truck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-[13px] font-medium text-muted-foreground mb-1.5">
            Add <span className="font-bold text-emerald-400">{formatPrice(amountToFreeShipping, false)}</span> for free shipping
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
