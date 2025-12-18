import React, { useRef } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileColorVariant {
  id: string;
  color: string;
  colorHex: string;
  inStock: boolean;
  isCurrentProduct?: boolean;
}

interface MobileColorSelectorProps {
  variants: MobileColorVariant[];
  selectedId: string;
  onSelectColor: (id: string) => void;
  onViewAllColors: () => void;
  className?: string;
}

const MobileColorSelector: React.FC<MobileColorSelectorProps> = ({
  variants,
  selectedId,
  onSelectColor,
  onViewAllColors,
  className
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedVariant = variants.find(v => v.id === selectedId);

  // Display max 8, then show "more" button
  const visibleVariants = variants.slice(0, 8);
  const remainingCount = variants.length - 8;

  return (
    <div 
      className={cn(
        "px-4 py-4",
        "bg-secondary/30 border-y border-border/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">
          Color: <span className="font-bold text-foreground">{selectedVariant?.color || 'Select'}</span>
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {variants.length} colors
        </span>
      </div>

      {/* Colors Scroll */}
      <div 
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto overflow-y-hidden pb-1 -mx-4 px-4 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {visibleVariants.map((variant) => {
          const isSelected = variant.id === selectedId;
          
          return (
            <button
              key={variant.id}
              onClick={() => variant.inStock && onSelectColor(variant.id)}
              disabled={!variant.inStock}
              className={cn(
                "relative flex items-center justify-center flex-shrink-0",
                "w-12 h-12 rounded-[14px]",
                "transition-all duration-200",
                "active:scale-95",
                isSelected 
                  ? "bg-primary/15 border-2 border-primary" 
                  : "bg-secondary/50 border-2 border-border/50",
                !variant.inStock && "opacity-40 cursor-not-allowed"
              )}
              aria-label={`${variant.color}${isSelected ? ', selected' : ''}${!variant.inStock ? ', out of stock' : ''}`}
              aria-pressed={isSelected}
            >
              {/* Color Circle */}
              <div 
                className="w-7 h-7 rounded-full border border-white/15 shadow-inner"
                style={{ 
                  backgroundColor: variant.colorHex,
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              />
              
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-primary border-2 border-background rounded-full text-primary-foreground">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
              
              {/* Out of Stock Line */}
              {!variant.inStock && (
                <div className="absolute w-0.5 h-9 bg-destructive rounded-sm rotate-45" />
              )}
            </button>
          );
        })}

        {/* More Button */}
        {remainingCount > 0 && (
          <button
            onClick={onViewAllColors}
            className={cn(
              "flex items-center justify-center gap-0.5 flex-shrink-0",
              "min-w-12 h-12 px-3 rounded-[14px]",
              "bg-secondary/50 border-2 border-dashed border-border/50",
              "text-muted-foreground",
              "active:bg-secondary"
            )}
          >
            <span className="text-sm font-bold">+{remainingCount}</span>
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileColorSelector;
