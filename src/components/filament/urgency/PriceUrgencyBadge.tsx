import React from 'react';
import { TrendingDown, Flame, AlertTriangle } from 'lucide-react';
import { usePriceHistory } from '@/hooks/usePriceHistory';
import { cn } from '@/lib/utils';

interface PriceUrgencyBadgeProps {
  filamentId: string;
  currentPrice: number | null;
  originalPrice?: number | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function PriceUrgencyBadge({ 
  filamentId, 
  currentPrice, 
  originalPrice,
  size = 'medium',
  className
}: PriceUrgencyBadgeProps) {
  const priceHistory = usePriceHistory(filamentId, currentPrice, 30);
  
  if (priceHistory.isLoading || !currentPrice) {
    return null;
  }

  const { avg, isBestIn30Days, isBestIn6Months, trendPercent } = priceHistory;
  const percentBelowAverage = avg > 0 ? Math.round(((avg - currentPrice) / avg) * 100) : 0;
  const savingsPercent = originalPrice && originalPrice > currentPrice 
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) 
    : null;

  // Determine urgency type and content
  const getUrgencyContent = () => {
    // Highest urgency: Lowest in 6 months or 30 days
    if (isBestIn6Months) {
      return {
        type: 'hot',
        icon: <Flame className={cn(size === 'small' ? 'w-3 h-3' : 'w-4 h-4')} />,
        text: 'Lowest price in 6mo',
        subtext: savingsPercent ? `Save ${savingsPercent}%` : 'Best deal'
      };
    }

    if (isBestIn30Days) {
      return {
        type: 'hot',
        icon: <Flame className={cn(size === 'small' ? 'w-3 h-3' : 'w-4 h-4')} />,
        text: 'Lowest in 30 days',
        subtext: savingsPercent ? `Save ${savingsPercent}%` : 'Great deal'
      };
    }

    // High urgency: Significantly below average
    if (percentBelowAverage >= 15) {
      return {
        type: 'great',
        icon: <TrendingDown className={cn(size === 'small' ? 'w-3 h-3' : 'w-4 h-4')} />,
        text: `${percentBelowAverage}% below avg`,
        subtext: 'Great time to buy'
      };
    }

    // Medium urgency: Below average
    if (percentBelowAverage >= 5) {
      return {
        type: 'good',
        icon: <TrendingDown className={cn(size === 'small' ? 'w-3 h-3' : 'w-4 h-4')} />,
        text: `${percentBelowAverage}% below avg`,
        subtext: 'Good price'
      };
    }

    // Falling price trend
    if (trendPercent !== null && trendPercent < -5) {
      return {
        type: 'trend',
        icon: <TrendingDown className={cn(size === 'small' ? 'w-3 h-3' : 'w-4 h-4')} />,
        text: 'Price dropping',
        subtext: 'Good time to buy'
      };
    }

    // Rising price warning
    if (trendPercent !== null && trendPercent > 10 && percentBelowAverage < 0) {
      return {
        type: 'warning',
        icon: <AlertTriangle className={cn(size === 'small' ? 'w-3 h-3' : 'w-4 h-4')} />,
        text: 'Price rising',
        subtext: 'May increase'
      };
    }

    return null;
  };

  const content = getUrgencyContent();
  
  if (!content) return null;

  const sizeClasses = {
    small: 'gap-1.5 px-2.5 py-1 rounded-md',
    medium: 'gap-2 px-3.5 py-2 rounded-lg',
    large: 'gap-3 px-5 py-3 rounded-xl'
  };

  const textSizeClasses = {
    small: 'text-[11px]',
    medium: 'text-[13px]',
    large: 'text-[15px]'
  };

  const subtextSizeClasses = {
    small: 'text-[9px]',
    medium: 'text-[11px]',
    large: 'text-[13px]'
  };

  const typeStyles = {
    hot: {
      bg: 'bg-gradient-to-r from-red-500/15 to-red-500/5',
      border: 'border-red-500/30',
      iconColor: 'text-red-400',
      pulse: true
    },
    great: {
      bg: 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5',
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      pulse: false
    },
    good: {
      bg: 'bg-gradient-to-r from-primary/15 to-primary/5',
      border: 'border-primary/30',
      iconColor: 'text-primary',
      pulse: false
    },
    trend: {
      bg: 'bg-gradient-to-r from-purple-500/15 to-purple-500/5',
      border: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      pulse: false
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-500/15 to-amber-500/5',
      border: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      pulse: false
    }
  };

  const style = typeStyles[content.type as keyof typeof typeStyles];

  return (
    <div 
      className={cn(
        "inline-flex items-center border",
        sizeClasses[size],
        style.bg,
        style.border,
        style.pulse && "animate-pulse",
        className
      )}
    >
      <div className={cn("flex items-center justify-center", style.iconColor)}>
        {content.icon}
      </div>
      <div className="flex flex-col">
        <span className={cn("font-bold text-white leading-tight", textSizeClasses[size])}>
          {content.text}
        </span>
        {content.subtext && size !== 'small' && (
          <span className={cn("font-semibold text-muted-foreground leading-tight", subtextSizeClasses[size])}>
            {content.subtext}
          </span>
        )}
      </div>
    </div>
  );
}
