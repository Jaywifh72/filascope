import React from 'react';
import { Check, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockUrgencyIndicatorProps {
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder' | 'unknown';
  stockQuantity?: number | null;
  restockDate?: Date;
  showQuantity?: boolean;
  compact?: boolean;
  className?: string;
}

export function StockUrgencyIndicator({ 
  stockStatus, 
  stockQuantity,
  restockDate,
  showQuantity = true,
  compact = false,
  className
}: StockUrgencyIndicatorProps) {
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStockContent = () => {
    // Determine stock level based on status and quantity
    const isLowStock = stockStatus === 'low_stock' || (stockQuantity !== null && stockQuantity !== undefined && stockQuantity <= 10);
    const isCritical = stockQuantity !== null && stockQuantity !== undefined && stockQuantity <= 3;
    const showExactCount = showQuantity && stockQuantity !== null && stockQuantity !== undefined && stockQuantity <= 10;

    if (stockStatus === 'out_of_stock') {
      return {
        status: 'out',
        icon: <XCircle className="w-4 h-4" />,
        text: 'Out of Stock',
        subtext: restockDate ? `Expected ${formatDate(restockDate)}` : 'Check back soon',
        pulse: false
      };
    }

    if (isCritical) {
      return {
        status: 'critical',
        icon: <AlertTriangle className="w-4 h-4" />,
        text: showExactCount ? `Only ${stockQuantity} left!` : 'Almost gone!',
        subtext: 'Order now before it sells out',
        pulse: true
      };
    }

    if (isLowStock) {
      return {
        status: 'low',
        icon: <AlertTriangle className="w-4 h-4" />,
        text: showExactCount ? `Only ${stockQuantity} left` : 'Low stock',
        subtext: 'Selling fast',
        pulse: false
      };
    }

    // Default: in stock
    return {
      status: 'high',
      icon: <Check className="w-4 h-4" />,
      text: 'In Stock',
      subtext: 'Ships within 24hrs',
      pulse: false
    };
  };

  const content = getStockContent();

  const statusStyles = {
    critical: {
      iconColor: 'text-red-400',
      textColor: 'text-red-400'
    },
    low: {
      iconColor: 'text-amber-400',
      textColor: 'text-amber-400'
    },
    out: {
      iconColor: 'text-muted-foreground',
      textColor: 'text-muted-foreground'
    },
    high: {
      iconColor: 'text-emerald-400',
      textColor: 'text-emerald-400'
    }
  };

  const style = statusStyles[content.status as keyof typeof statusStyles];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <div className={cn(style.iconColor, content.pulse && "animate-pulse")}>
          {content.icon}
        </div>
        <span className={cn("text-sm font-semibold", style.textColor)}>
          {content.text}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", content.pulse && "animate-pulse", className)}>
      <div className={cn("flex items-center justify-center", style.iconColor)}>
        {content.icon}
      </div>
      <div className="flex flex-col">
        <span className={cn("text-sm font-bold", style.textColor)}>
          {content.text}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {content.subtext}
        </span>
      </div>
    </div>
  );
}
