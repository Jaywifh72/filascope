import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { normalizeColorHex } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ColorVariant {
  id: string;
  color_hex: string | null;
  color_family: string | null;
  product_title: string;
  net_weight_g: number | null;
}

interface LargeColorSwatchGridProps {
  colorVariants: ColorVariant[];
  currentVariantId: string;
  onSelectColor: (variant: ColorVariant) => void;
  getColorName: (title: string) => string | null;
  className?: string;
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

  // Show first 10 colors, then expandable
  const visibleCount = isExpanded ? colorVariants.length : 10;
  const visibleColors = colorVariants.slice(0, visibleCount);
  const remainingCount = colorVariants.length - 10;
  const hasMore = remainingCount > 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {colorVariants.length} Colors Available
        </label>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
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
        <div className="flex flex-wrap gap-2">
          {visibleColors.map((variant) => {
            const colorName = getColorName(variant.product_title) || variant.color_family || 'Color';
            const isSelected = variant.id === currentVariantId;
            const colorHex = variant.color_hex ? normalizeColorHex(variant.color_hex) : null;
            const isWhite = colorHex?.toUpperCase() === '#FFFFFF';
            const isTransparent = colorName.toLowerCase().includes('clear') || 
                                   colorName.toLowerCase().includes('transparent') ||
                                   colorName.toLowerCase().includes('natural');
            
            return (
              <Tooltip key={variant.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectColor(variant)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all duration-200",
                      "border-2 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isSelected 
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 border-primary" 
                        : isWhite || isTransparent
                          ? "border-border hover:border-primary/50"
                          : "border-transparent hover:border-white/30"
                    )}
                    style={{ 
                      backgroundColor: colorHex || '#888',
                      backgroundImage: isTransparent 
                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                        : undefined,
                      backgroundSize: isTransparent ? '8px 8px' : undefined,
                      backgroundPosition: isTransparent ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
                    }}
                    aria-label={colorName}
                    aria-pressed={isSelected}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="font-medium">{colorName}</div>
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
    </div>
  );
}
