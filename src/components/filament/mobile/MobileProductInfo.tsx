import React from 'react';
import { Star, Check, AlertTriangle, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MobileProductData } from './types';

interface MobileProductInfoProps {
  product: MobileProductData;
  onReviewsClick: () => void;
  className?: string;
}

const MobileProductInfo: React.FC<MobileProductInfoProps> = ({
  product,
  onReviewsClick,
  className,
}) => {
  const getStockColor = (level?: string) => {
    switch (level) {
      case 'critical': return 'text-destructive';
      case 'low': return 'text-amber-500';
      default: return 'text-emerald-500';
    }
  };

  const getStockText = (level?: string) => {
    switch (level) {
      case 'critical': return 'Almost Gone!';
      case 'low': return 'Low Stock';
      default: return 'In Stock';
    }
  };

  return (
    <div className={cn("px-4 py-4 bg-gradient-to-b from-background to-card", className)}>
      {/* Brand */}
      <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
        {product.brand}
      </div>
      
      {/* Product Name */}
      <h1 className="text-[22px] font-extrabold text-foreground leading-tight mb-3">
        {product.name}
      </h1>
      
      {/* Rating & Stock Row */}
      <div className="flex items-center gap-2.5 mb-4">
        <button 
          onClick={onReviewsClick} 
          aria-label={`${product.rating} stars, ${product.reviewCount} reviews, tap to see reviews`}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-lg active:bg-[#FFB800]/20"
        >
          <Star size={16} fill="#FFB800" className="text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.6)]" />
          <span className="text-sm font-bold text-[#FFB800]">{product.rating.toFixed(1)}</span>
          <span className="text-[13px] font-medium text-muted-foreground">({product.reviewCount})</span>
        </button>
        
        <span className="text-muted-foreground/50">•</span>
        
        <div className={cn("flex items-center gap-1 text-[13px] font-semibold", getStockColor(product.stockLevel))}>
          {product.stockLevel === 'critical' || product.stockLevel === 'low' ? (
            <AlertTriangle size={14} />
          ) : (
            <Check size={14} />
          )}
          <span>{getStockText(product.stockLevel)}</span>
        </div>
      </div>
      
      {/* Price Row */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[28px] font-extrabold text-foreground">
          ${product.price.toFixed(2)}
        </span>
        
        {product.originalPrice && product.originalPrice > product.price && (
          <span className="text-lg font-medium text-muted-foreground line-through">
            ${product.originalPrice.toFixed(2)}
          </span>
        )}
        
        {product.isLowestPrice && (
          <div className="flex items-center gap-1 px-2.5 py-1 bg-destructive/15 border border-destructive/30 rounded-md text-xs font-bold text-destructive">
            <Flame size={12} />
            {product.discountPercent ? `${product.discountPercent}% OFF` : 'Best Price'}
          </div>
        )}
      </div>
      
      {product.isLowestPrice && (
        <div className="mt-1.5 text-xs font-semibold text-emerald-500">
          Lowest price in 30 days
        </div>
      )}
    </div>
  );
};

export default MobileProductInfo;
