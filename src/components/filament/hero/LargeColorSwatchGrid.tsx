import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { normalizeColorHex } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronUp, Check, Palette } from 'lucide-react';

interface ColorVariant {
  id: string;
  color_hex: string | null;
  color_family: string | null;
  product_title: string;
  net_weight_g: number | null;
  product_url?: string | null;
  variant_available?: boolean | null;
}

interface LargeColorSwatchGridProps {
  colorVariants: ColorVariant[];
  currentVariantId: string;
  onSelectColor: (variant: ColorVariant) => void;
  getColorName: (title: string) => string | null;
  className?: string;
}

/** Extract color name from product title as a last-resort fallback */
function extractColorFallback(title: string): string | null {
  if (!title) return null;
  const dashMatch = title.match(/\s+-\s+(.+?)$/);
  if (dashMatch) return dashMatch[1].trim();
  return null;
}

export function LargeColorSwatchGrid({
  colorVariants,
  currentVariantId,
  onSelectColor,
  getColorName,
  className,
}: LargeColorSwatchGridProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (colorVariants.length <= 1) return null;

  const currentVariant = colorVariants.find(v => v.id === currentVariantId);
  const currentColorName = currentVariant 
    ? (getColorName(currentVariant.product_title) || currentVariant.color_family || extractColorFallback(currentVariant.product_title) || 'Color')
    : 'Color';

  // Show first 10 colors, then expandable
  const visibleCount = isExpanded ? colorVariants.length : 10;
  const visibleColors = colorVariants.slice(0, visibleCount);
  const remainingCount = colorVariants.length - 10;
  const hasMore = remainingCount > 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm text-muted-foreground">
          Color: <span className="font-semibold text-foreground">{currentColorName}</span>
          <span className="ml-2 text-xs text-muted-foreground/70">({colorVariants.length} available)</span>
        </label>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-gray-800 text-cyan-400 text-xs font-mono px-2 py-0.5 rounded-full cursor-pointer hover:bg-gray-700 transition-colors inline-flex items-center gap-1"
          >
            {isExpanded ? (
              <>Show Less <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>+{remainingCount} more <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}
      </div>
      
      <TooltipProvider delayDuration={150}>
        <div className={cn(
          "flex flex-wrap gap-2",
          isExpanded && "max-h-[240px] overflow-y-auto pr-1 scrollbar-thin"
        )}>
          {visibleColors.map((variant) => {
            const colorName = getColorName(variant.product_title) || variant.color_family || extractColorFallback(variant.product_title) || 'Color';
            const isSelected = variant.id === currentVariantId;
            const colorHex = variant.color_hex ? normalizeColorHex(variant.color_hex) : null;
            const isWhite = colorHex?.toUpperCase() === '#FFFFFF';
            const isTransparent = colorName.toLowerCase().includes('clear') || 
                                   colorName.toLowerCase().includes('transparent') ||
                                   colorName.toLowerCase().includes('natural');
            const isOutOfStock = variant.variant_available === false;
            // Determine if the color is dark for checkmark contrast
            const isDarkColor = colorHex ? isDark(colorHex) : true;
            
            return (
              <Tooltip key={variant.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => !isOutOfStock && onSelectColor(variant)}
                    disabled={isOutOfStock}
                    className={cn(
                      "relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200",
                      "border-2 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isSelected 
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 border-primary" 
                        : isWhite || isTransparent
                          ? "border-border hover:border-primary/50"
                          : "border-transparent hover:border-white/30",
                      isOutOfStock && "opacity-50 cursor-not-allowed hover:scale-100"
                    )}
                    style={{ 
                      backgroundColor: colorHex || '#888',
                      backgroundImage: isTransparent 
                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                        : undefined,
                      backgroundSize: isTransparent ? '8px 8px' : undefined,
                      backgroundPosition: isTransparent ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
                    }}
                    aria-label={`${colorName}${isSelected ? ', selected' : ''}${isOutOfStock ? ', out of stock' : ''}`}
                    aria-pressed={isSelected}
                  >
                    {/* Checkmark overlay for selected */}
                    {isSelected && (
                      <Check 
                        className={cn(
                          "w-4 h-4 drop-shadow-md",
                          isDarkColor ? "text-primary-foreground" : "text-foreground"
                        )} 
                        strokeWidth={3} 
                      />
                    )}
                    {/* Out of stock diagonal line */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[130%] h-0.5 bg-destructive rounded-full rotate-45" />
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="font-medium">{colorName}</div>
                  {isOutOfStock && (
                    <div className="text-destructive font-medium">Out of Stock</div>
                  )}
                  {variant.color_hex && (
                    <div className="text-muted-foreground font-mono text-[10px]">
                      {variant.color_hex.toUpperCase()}
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Find similar colors link */}
      {currentVariant?.color_hex && (
        <Link
          to={`/colors?hex=${normalizeColorHex(currentVariant.color_hex).replace('#', '')}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Palette className="w-3 h-3" />
          Find similar colors from other brands
        </Link>
      )}
    </div>
  );
}

/** Simple luminance check to determine if a hex color is dark */
function isDark(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  // Relative luminance
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}
