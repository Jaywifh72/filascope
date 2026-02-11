import React from 'react';
import { cn } from '@/lib/utils';
import { normalizeColorHex } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ColorVariant {
  id: string;
  color_hex: string | null;
  color_family: string | null;
  product_title: string;
  net_weight_g: number | null;
  product_url?: string | null;
}

interface SpoolWeight {
  weight: number;
  pricePerKg: number | null;
  count: number;
}

interface HeroColorQuantitySelectorProps {
  colorVariants: ColorVariant[];
  availableWeights: SpoolWeight[];
  selectedWeight: number | null;
  currentVariantId: string;
  onSelectWeight: (weight: number | null) => void;
  onSelectColor: (variant: ColorVariant) => void;
  getColorFromTitle: (title: string, baseName: string) => string | null;
  getBaseProductName: (title: string) => string;
  className?: string;
}

export function HeroColorQuantitySelector({
  colorVariants,
  availableWeights,
  selectedWeight,
  currentVariantId,
  onSelectWeight,
  onSelectColor,
  getColorFromTitle,
  getBaseProductName,
  className
}: HeroColorQuantitySelectorProps) {
  const baseName = colorVariants.length > 0 ? getBaseProductName(colorVariants[0].product_title) : '';
  
  // Filter colors by selected weight
  const filteredColors = selectedWeight 
    ? colorVariants.filter(v => v.net_weight_g === selectedWeight)
    : colorVariants;
  
  // Show max 12 colors, with +more indicator
  const visibleColors = filteredColors.slice(0, 12);
  const remainingCount = filteredColors.length - 12;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Spool Size Selector */}
      {availableWeights.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Spool Size
          </label>
          <div className="flex flex-wrap gap-2">
            {availableWeights.map(({ weight, count }) => {
              const isSelected = selectedWeight === weight;
              const label = weight >= 1000 ? `${weight / 1000}kg` : `${weight}g`;
              
              return (
                <button
                  key={weight}
                  onClick={() => onSelectWeight(isSelected ? null : weight)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    "border",
                    isSelected 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-muted/50 border-border hover:bg-muted hover:border-primary/50"
                  )}
                >
                  {label}
                  <span className="text-xs ml-1 opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Selector - Compact Swatches */}
      {colorVariants.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Color ({filteredColors.length} available)
          </label>
          <TooltipProvider delayDuration={200}>
            <div className="flex flex-wrap gap-1.5">
              {visibleColors.map((variant) => {
                const colorName = getColorFromTitle(variant.product_title, baseName) || variant.color_family || 'Color';
                const isSelected = variant.id === currentVariantId;
                const colorHex = variant.color_hex ? normalizeColorHex(variant.color_hex) : null;
                const isWhite = colorHex?.toUpperCase() === '#FFFFFF';
                
                return (
                  <Tooltip key={variant.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onSelectColor(variant)}
                        className={cn(
                          "w-7 h-7 rounded-full transition-all border-2",
                          isSelected 
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" 
                            : "hover:scale-110",
                          isWhite ? "border-border" : "border-transparent"
                        )}
                        style={{ 
                          backgroundColor: colorHex || '#888',
                          boxShadow: isWhite ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined
                        }}
                        aria-label={colorName}
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
              {remainingCount > 0 && (
                <span className="bg-gray-800 text-cyan-400 text-xs font-mono px-2 py-0.5 rounded-full cursor-pointer hover:bg-gray-700 transition-colors inline-flex items-center">
                  +{remainingCount} more
                </span>
              )}
            </div>
          </TooltipProvider>
        </div>
      )}

    </div>
  );
}
