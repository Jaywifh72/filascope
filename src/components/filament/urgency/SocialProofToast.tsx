import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Purchase {
  name: string;
  location: string;
  timeAgo: string;
  variant?: string;
}

interface SocialProofToastProps {
  purchases: Purchase[];
  interval?: number;
  maxToasts?: number;
  onClose?: () => void;
  className?: string;
}

export function SocialProofToast({
  purchases,
  interval = 30000,
  maxToasts = 5,
  onClose,
  className
}: SocialProofToastProps) {
  const [currentToast, setCurrentToast] = useState<Purchase | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [toastCount, setToastCount] = useState(0);
  const [purchaseIndex, setPurchaseIndex] = useState(0);

  const showNextToast = useCallback(() => {
    if (toastCount >= maxToasts || purchases.length === 0) return;

    const purchase = purchases[purchaseIndex % purchases.length];
    setCurrentToast(purchase);
    setIsVisible(true);
    setToastCount(prev => prev + 1);
    setPurchaseIndex(prev => prev + 1);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  }, [purchases, purchaseIndex, toastCount, maxToasts]);

  useEffect(() => {
    if (purchases.length === 0) return;
    
    // Show first toast after 10 seconds
    const initialTimeout = setTimeout(() => {
      showNextToast();
    }, 10000);

    return () => clearTimeout(initialTimeout);
  }, [purchases.length]);

  useEffect(() => {
    if (toastCount === 0 || purchases.length === 0) return;

    const intervalId = setInterval(() => {
      showNextToast();
    }, interval);

    return () => clearInterval(intervalId);
  }, [toastCount, interval, showNextToast, purchases.length]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!currentToast || !isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-24 left-6 z-[900]",
        "flex items-center gap-3.5",
        "px-4 py-3.5",
        "bg-slate-900/95 backdrop-blur-xl",
        "border border-white/10 rounded-xl",
        "shadow-[0_10px_40px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.05)]",
        "animate-in slide-in-from-left duration-400",
        "max-sm:left-4 max-sm:right-4 max-sm:bottom-24",
        "motion-reduce:animate-none",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Recent purchase notification"
    >
      <div className="flex items-center justify-center w-10 h-10 bg-emerald-500/15 rounded-lg">
        <ShoppingCart className="w-[18px] h-[18px] text-emerald-500" />
      </div>
      
      <div className="flex-1">
        <div className="text-sm font-semibold text-white mb-0.5">
          {currentToast.name} just purchased this
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <MapPin className="w-3 h-3" />
          {currentToast.location} • {currentToast.timeAgo}
        </div>
      </div>
      
      <button 
        onClick={handleClose} 
        aria-label="Dismiss notification"
        className={cn(
          "flex items-center justify-center w-7 h-7",
          "bg-white/5 rounded-md",
          "text-muted-foreground hover:text-white hover:bg-white/10",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
