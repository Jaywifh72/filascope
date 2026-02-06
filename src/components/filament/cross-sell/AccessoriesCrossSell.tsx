import React from 'react';
import { Wrench, Plus, Star, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccessoryProduct } from './types';
import { useRegion } from '@/contexts/RegionContext';

interface AccessoriesCrossSellProps {
  accessories: AccessoryProduct[];
  onAddAccessory?: (accessoryId: string) => void;
  addedAccessoryIds?: Set<string>;
}

const categoryLabels: Record<string, string> = {
  storage: '📦 Storage & Drying',
  tools: '🔧 Tools',
  upgrades: '⬆️ Upgrades',
  maintenance: '🛠️ Maintenance'
};

export const AccessoriesCrossSell: React.FC<AccessoriesCrossSellProps> = ({
  accessories,
  onAddAccessory,
  addedAccessoryIds = new Set()
}) => {
  const { formatPrice, convertPrice, currency } = useRegion();
  
  if (accessories.length === 0) return null;

  // Group by category
  const groupedAccessories = accessories.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, AccessoryProduct[]>);

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="mb-5">
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Wrench className="w-5 h-5 text-blue-500" />
          Complete Your Setup
        </h3>
        <p className="text-[13px] text-muted-foreground mt-1">
          Essential accessories for best results
        </p>
      </div>

      {/* Category Sections */}
      {Object.entries(groupedAccessories).map(([category, items]) => (
        <div key={category} className="mb-6 last:mb-0">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
            {categoryLabels[category] || category}
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((accessory) => {
              const isAdded = addedAccessoryIds.has(accessory.id);
              const hasDiscount = accessory.originalPrice && accessory.originalPrice > accessory.price;
              const discountPercent = hasDiscount 
                ? Math.round((1 - accessory.price / accessory.originalPrice!) * 100)
                : 0;
              
              // Convert prices from USD
              const isConverted = currency !== 'USD';
              const convertedPrice = convertPrice(accessory.price, 'USD');
              const convertedOriginalPrice = accessory.originalPrice ? convertPrice(accessory.originalPrice, 'USD') : null;
              
              return (
                <div
                  key={accessory.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all",
                    isAdded
                      ? "bg-emerald-500/5 border border-emerald-500/20"
                      : "bg-card/50 border border-border hover:border-blue-500/30 hover:bg-blue-500/5"
                  )}
                >
                  {/* Image */}
                  <div className="relative w-16 h-16 flex-shrink-0 bg-white/5 rounded-lg overflow-hidden">
                    <img
                      src={accessory.image || '/placeholder.svg'}
                      alt={accessory.name}
                      className="w-full h-full object-contain"
                    />
                    {hasDiscount && (
                      <div className="absolute top-1 left-1 px-1 py-0.5 bg-destructive rounded text-[9px] font-bold text-white">
                        {discountPercent}% OFF
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-foreground truncate">
                      {accessory.name}
                    </div>
                    
                    {/* Rating */}
                    {accessory.rating && (
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span className="font-bold text-amber-500">{accessory.rating.toFixed(1)}</span>
                        <span>({accessory.reviewCount})</span>
                      </div>
                    )}
                    
                    {/* Relevance Hint */}
                    {accessory.relevanceReason && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-blue-400">
                        <Info className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{accessory.relevanceReason}</span>
                      </div>
                    )}
                    
                    {/* Pricing */}
                    <div className="flex items-center gap-1.5 mt-1">
                      {hasDiscount && convertedOriginalPrice && (
                        <span className="text-[11px] font-medium text-muted-foreground line-through">
                          {isConverted ? '~' : ''}{formatPrice(convertedOriginalPrice)}
                        </span>
                      )}
                      <span className="text-[15px] font-extrabold text-foreground">
                        {isConverted ? '~' : ''}{formatPrice(convertedPrice)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Add Button */}
                  <button
                    onClick={() => onAddAccessory?.(accessory.id)}
                    disabled={!accessory.inStock || isAdded}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 flex-shrink-0 rounded-lg text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      isAdded
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-default"
                        : "bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 cursor-pointer",
                      !accessory.inStock && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label={isAdded 
                      ? `${accessory.name} added to cart` 
                      : `Add ${accessory.name} to cart for ${formatPrice(convertedPrice)}`
                    }
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AccessoriesCrossSell;
