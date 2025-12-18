import React, { useState, useMemo } from 'react';
import { Check, Plus, Palette, ShoppingCart, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColorVariant } from './types';

interface ColorVariantsQuickAddProps {
  variants: ColorVariant[];
  currentProductId: string;
  basePrice: number;
  multiColorDiscount?: number;
  onAddColors?: (colorIds: string[], totalPrice: number) => void;
  onViewAllColors?: () => void;
}

export const ColorVariantsQuickAdd: React.FC<ColorVariantsQuickAddProps> = ({
  variants,
  currentProductId,
  basePrice,
  multiColorDiscount = 6,
  onAddColors,
  onViewAllColors
}) => {
  // Current product is always selected
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set([currentProductId])
  );

  const toggleColor = (variantId: string) => {
    // Can't deselect current product
    if (variantId === currentProductId) return;

    const newSelected = new Set(selectedIds);
    if (newSelected.has(variantId)) {
      newSelected.delete(variantId);
    } else {
      newSelected.add(variantId);
    }
    setSelectedIds(newSelected);
  };

  // Calculate pricing with multi-color discount
  const pricing = useMemo(() => {
    const selectedCount = selectedIds.size;
    const originalTotal = selectedCount * basePrice;
    
    // Apply discount for 2+ colors
    const discountApplies = selectedCount >= 2;
    const discountAmount = discountApplies 
      ? originalTotal * (multiColorDiscount / 100) 
      : 0;
    const finalTotal = originalTotal - discountAmount;

    return {
      selectedCount,
      originalTotal,
      discountAmount,
      finalTotal,
      discountApplies
    };
  }, [selectedIds, basePrice, multiColorDiscount]);

  const handleAddToCart = () => {
    const selectedColorIds = Array.from(selectedIds);
    onAddColors?.(selectedColorIds, pricing.finalTotal);
  };

  // Show max 7 colors + "more" indicator
  const visibleVariants = variants.slice(0, 7);
  const remainingCount = variants.length - 7;

  if (variants.length <= 1) return null;

  return (
    <div className="bg-card/50 border border-border rounded-2xl p-5 mt-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Palette className="w-5 h-5 text-pink-500" />
            Get More Colors
            <span className="text-xs font-medium text-muted-foreground">
              {variants.length} available
            </span>
          </h3>
        </div>
        
        {pricing.discountApplies && (
          <div className="mt-1.5 text-[13px] font-semibold text-emerald-400">
            Save {multiColorDiscount}% when you buy 2+ colors!
          </div>
        )}
      </div>

      {/* Colors Grid */}
      <div className="flex flex-wrap gap-2.5">
        {visibleVariants.map((variant) => {
          const isSelected = selectedIds.has(variant.id);
          const isCurrent = variant.id === currentProductId;
          
          return (
            <div
              key={variant.id}
              onClick={() => variant.inStock && toggleColor(variant.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 w-14 py-2 px-1 rounded-xl transition-all",
                isSelected
                  ? "bg-primary/10 border-2 border-primary"
                  : isCurrent
                    ? "bg-white/[0.02] border-2 border-primary/30"
                    : "bg-white/[0.02] border-2 border-white/[0.08] hover:border-primary/50 hover:bg-primary/5",
                !variant.inStock && "opacity-40 cursor-not-allowed",
                variant.inStock && !isCurrent && "cursor-pointer"
              )}
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`${variant.color}${isCurrent ? ' (current)' : ''}${!variant.inStock ? ' - out of stock' : ''}${isSelected ? ', selected' : ''}`}
              aria-disabled={!variant.inStock}
              tabIndex={variant.inStock ? 0 : -1}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && variant.inStock) {
                  e.preventDefault();
                  toggleColor(variant.id);
                }
              }}
            >
              {/* Color Swatch */}
              <div
                className="w-8 h-8 rounded-full border border-white/10 shadow-inner"
                style={{ backgroundColor: variant.colorHex }}
              />
              
              {/* Selection/Add Indicator */}
              {isSelected && (
                <div className={cn(
                  "absolute top-1 right-1 flex items-center justify-center w-[18px] h-[18px] rounded-full",
                  isCurrent ? "bg-primary" : "bg-emerald-500"
                )}>
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              
              {!isSelected && variant.inStock && (
                <div className="absolute top-1 right-1 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              
              {!variant.inStock && (
                <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-destructive">
                  ✕
                </div>
              )}
              
              {/* Color Name */}
              <span className="text-[10px] font-semibold text-muted-foreground text-center max-w-full truncate">
                {variant.color}
              </span>
              
              {/* Current Indicator */}
              {isCurrent && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </div>
          );
        })}
        
        {/* More Colors Button */}
        {remainingCount > 0 && (
          <button
            onClick={onViewAllColors}
            className="flex flex-col items-center justify-center gap-0.5 w-14 h-[72px] bg-white/5 border-2 border-dashed border-white/15 rounded-xl hover:bg-white/[0.08] hover:border-white/25 transition-colors"
          >
            <span className="text-base font-bold text-muted-foreground">+{remainingCount}</span>
            <span className="text-[10px] font-medium text-muted-foreground/70">more</span>
          </button>
        )}
      </div>

      {/* Selection Summary */}
      {pricing.selectedCount > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3 mt-4 pt-4 border-t border-white/[0.08]">
          <span className="text-sm font-semibold text-foreground/90">
            {pricing.selectedCount} colors selected
          </span>
          
          <div className="flex items-center gap-2.5">
            {pricing.discountApplies && (
              <span className="text-sm font-medium text-muted-foreground line-through">
                ${pricing.originalTotal.toFixed(2)}
              </span>
            )}
            <span className="text-lg font-extrabold text-foreground">
              ${pricing.finalTotal.toFixed(2)}
            </span>
            {pricing.discountApplies && (
              <span className="text-xs font-bold text-emerald-400">
                Save ${pricing.discountAmount.toFixed(2)} ({multiColorDiscount}%)
              </span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ShoppingCart className="w-4 h-4" />
            Add {pricing.selectedCount} Colors to Cart
          </button>
        </div>
      )}

      {/* View All Link */}
      <button
        onClick={onViewAllColors}
        className="flex items-center gap-1 mt-3 p-0 bg-transparent border-none text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
      >
        View all {variants.length} color options
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ColorVariantsQuickAdd;
