import React, { useState, useEffect } from 'react';
import { Clock, Truck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShippingCountdownProps {
  sameDayCutoffHour?: number;
  freeShippingThreshold?: number;
  currentCartValue?: number;
  compact?: boolean;
  className?: string;
}

export function ShippingCountdown({ 
  sameDayCutoffHour = 14, // 2 PM default
  freeShippingThreshold = 35,
  currentCartValue = 0,
  compact = false,
  className
}: ShippingCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(sameDayCutoffHour, 0, 0, 0);
      
      // If cutoff has passed today, no same-day available
      if (cutoff <= now) {
        return null;
      }
      
      const diff = cutoff.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return { hours, minutes, seconds };
    };

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [sameDayCutoffHour]);

  const amountToFreeShipping = freeShippingThreshold - currentCartValue;
  const qualifiesForFreeShipping = amountToFreeShipping <= 0;
  const isUrgent = timeRemaining && timeRemaining.hours < 2;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        {timeRemaining && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {timeRemaining.hours}h {timeRemaining.minutes}m for same-day
            </span>
          </div>
        )}
        {qualifiesForFreeShipping && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <Truck className="w-3.5 h-3.5" />
            <span>Free shipping!</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Same-day shipping countdown */}
      {timeRemaining && (
        <div className={cn(
          "flex items-center gap-3.5 p-3.5 rounded-xl border",
          isUrgent 
            ? "bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/20"
            : "bg-white/[0.02] border-border/30"
        )}>
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg",
            isUrgent ? "bg-red-500/15 text-red-400" : "bg-primary/10 text-primary"
          )}>
            <Zap className="w-[18px] h-[18px]" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Order within
            </div>
            <div className={cn(
              "flex items-center gap-1",
              isUrgent ? "text-red-400" : "text-white"
            )}>
              <div className="flex flex-col items-center">
                <span className="text-xl font-extrabold tabular-nums leading-none">
                  {String(timeRemaining.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase">hrs</span>
              </div>
              <span className="text-lg font-bold text-muted-foreground mx-0.5">:</span>
              <div className="flex flex-col items-center">
                <span className="text-xl font-extrabold tabular-nums leading-none">
                  {String(timeRemaining.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase">min</span>
              </div>
              <span className="text-lg font-bold text-muted-foreground mx-0.5">:</span>
              <div className="flex flex-col items-center">
                <span className="text-xl font-extrabold tabular-nums leading-none">
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase">sec</span>
              </div>
            </div>
            <div className="text-xs font-semibold text-muted-foreground mt-1">
              for same-day shipping
            </div>
          </div>
        </div>
      )}

      {/* Free shipping progress */}
      {!qualifiesForFreeShipping && amountToFreeShipping < 20 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
          <Truck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-[13px] font-medium text-muted-foreground mb-1.5">
              Add <span className="font-bold text-emerald-400">${amountToFreeShipping.toFixed(2)}</span> for free shipping
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((currentCartValue / freeShippingThreshold) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Qualified for free shipping */}
      {qualifiesForFreeShipping && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Truck className="w-4 h-4 text-emerald-400" />
          <span className="text-[13px] font-bold text-emerald-400">
            You qualify for FREE shipping!
          </span>
        </div>
      )}
    </div>
  );
}
