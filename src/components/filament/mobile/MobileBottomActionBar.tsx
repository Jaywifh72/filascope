import React, { useState, useEffect } from 'react';
import { ShoppingCart, ChevronUp, Store, Heart, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomActionBarProps {
  price: number;
  originalPrice?: number;
  inStock: boolean;
  retailerCount: number;
  isFavorited: boolean;
  onBuyClick: () => void;
  onRetailersClick: () => void;
  onFavoriteClick: () => void;
  onShareClick: () => void;
  className?: string;
}

const MobileBottomActionBar: React.FC<MobileBottomActionBarProps> = ({
  price,
  originalPrice,
  inStock,
  retailerCount,
  isFavorited,
  onBuyClick,
  onRetailersClick,
  onFavoriteClick,
  onShareClick,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Haptic feedback (if available)
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleBuyClick = () => {
    triggerHaptic();
    onBuyClick();
  };

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[999]",
        "bg-gradient-to-b from-background/95 to-background",
        "backdrop-blur-xl border-t border-border/50",
        "transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full",
        className
      )}
    >
      {/* Expanded Options */}
      <div 
        className={cn(
          "flex justify-around overflow-hidden transition-all duration-300",
          "border-b border-border/30",
          isExpanded ? "max-h-20 py-3 px-4" : "max-h-0 py-0 px-4"
        )}
      >
        <button 
          onClick={onFavoriteClick}
          className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground active:text-foreground"
        >
          <Heart size={20} className={cn(isFavorited && "fill-red-500 text-red-500")} />
          <span className="text-xs font-semibold">{isFavorited ? 'Saved' : 'Save'}</span>
        </button>
        
        <button 
          onClick={onShareClick}
          className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground active:text-foreground"
        >
          <Share2 size={20} />
          <span className="text-xs font-semibold">Share</span>
        </button>
        
        <button 
          onClick={onRetailersClick}
          className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground active:text-foreground"
        >
          <Store size={20} />
          <span className="text-xs font-semibold">{retailerCount} Retailers</span>
        </button>
      </div>

      {/* Main Action Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {/* Price Section */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 p-2 -m-2"
        >
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-foreground leading-none">
              ${price.toFixed(2)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-sm font-medium text-muted-foreground line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div 
            className={cn(
              "flex items-center justify-center w-6 h-6 text-muted-foreground transition-transform duration-300",
              isExpanded && "rotate-180"
            )}
          >
            <ChevronUp size={20} />
          </div>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Retailers Quick Button */}
          <button
            onClick={onRetailersClick}
            className="flex items-center justify-center w-12 h-12 bg-secondary/50 border border-border/50 rounded-xl text-muted-foreground active:bg-secondary active:text-foreground"
            aria-label="View retailers"
          >
            <Store size={20} />
          </button>

          {/* Primary Buy Button */}
          <button
            onClick={handleBuyClick}
            disabled={!inStock}
            className={cn(
              "flex items-center justify-center gap-2 h-12 px-6",
              "bg-primary rounded-xl",
              "text-sm font-extrabold text-primary-foreground",
              "transition-all duration-200",
              "active:scale-[0.98]",
              "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            )}
          >
            <ShoppingCart size={18} />
            {inStock ? 'BUY NOW' : 'OUT OF STOCK'}
          </button>
        </div>
      </div>

      {/* Safe Area Spacer */}
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-background" />
    </div>
  );
};

export default MobileBottomActionBar;
