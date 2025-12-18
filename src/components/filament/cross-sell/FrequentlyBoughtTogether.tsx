import React, { useState, useMemo } from 'react';
import { Plus, Check, ShoppingCart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrossSellProduct } from './types';

interface FrequentlyBoughtTogetherProps {
  currentProduct: {
    id: string;
    name: string;
    image: string;
    price: number;
  };
  suggestedProducts: CrossSellProduct[];
  bundleDiscount: number;
  onAddToCart?: (productIds: string[], totalPrice: number) => void;
}

export const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtTogetherProps> = ({
  currentProduct,
  suggestedProducts,
  bundleDiscount,
  onAddToCart
}) => {
  // Current product is always selected
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set([currentProduct.id, ...suggestedProducts.slice(0, 2).map(p => p.id)])
  );

  const toggleProduct = (productId: string) => {
    // Can't deselect current product
    if (productId === currentProduct.id) return;
    
    const newSelected = new Set(selectedIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedIds(newSelected);
  };

  // Calculate pricing
  const pricing = useMemo(() => {
    const allProducts = [
      { ...currentProduct, type: 'filament' as const, inStock: true },
      ...suggestedProducts
    ];
    const selectedProducts = allProducts.filter(p => selectedIds.has(p.id));
    
    const originalTotal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
    
    // Apply bundle discount only if 2+ items selected
    const discountApplies = selectedProducts.length >= 2;
    const discountAmount = discountApplies ? originalTotal * (bundleDiscount / 100) : 0;
    const finalTotal = originalTotal - discountAmount;
    
    return {
      originalTotal,
      discountAmount,
      finalTotal,
      discountApplies,
      itemCount: selectedProducts.length
    };
  }, [selectedIds, currentProduct, suggestedProducts, bundleDiscount]);

  const handleAddAllToCart = () => {
    const selectedProductIds = Array.from(selectedIds);
    onAddToCart?.(selectedProductIds, pricing.finalTotal);
  };

  const allProducts = [
    { ...currentProduct, isCurrentProduct: true, type: 'filament' as const, inStock: true },
    ...suggestedProducts.map(p => ({ ...p, isCurrentProduct: false }))
  ];

  if (suggestedProducts.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl p-5 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Frequently Bought Together
        </h3>
        {pricing.discountApplies && (
          <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-md text-xs font-bold text-emerald-400">
            Save {bundleDiscount}%
          </span>
        )}
      </div>

      {/* Products Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {allProducts.slice(0, 4).map((product, index) => (
          <React.Fragment key={product.id}>
            {index > 0 && (
              <div className="flex items-center justify-center w-7 h-7 flex-shrink-0 text-muted-foreground">
                <Plus className="w-5 h-5" />
              </div>
            )}
            
            <div
              onClick={() => toggleProduct(product.id)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 min-w-[100px] rounded-xl transition-all cursor-pointer",
                selectedIds.has(product.id)
                  ? "bg-purple-500/10 border-2 border-purple-500"
                  : "bg-white/[0.02] border-2 border-white/[0.08] hover:border-purple-500/50 hover:bg-purple-500/5",
                product.isCurrentProduct && "cursor-default"
              )}
              role="checkbox"
              aria-checked={selectedIds.has(product.id)}
              aria-label={`${product.isCurrentProduct ? 'Current product: ' : ''}${product.name}, $${product.price.toFixed(2)}${selectedIds.has(product.id) ? ', selected' : ', click to add'}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleProduct(product.id);
                }
              }}
            >
              {/* Product Image */}
              <div className="relative w-[70px] h-[70px]">
                <img
                  src={product.image || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-contain rounded-lg bg-white/5"
                />
                
                {/* Selection Indicator */}
                <div className={cn(
                  "absolute -top-1.5 -right-1.5 flex items-center justify-center w-6 h-6 rounded-full transition-all",
                  selectedIds.has(product.id)
                    ? "bg-purple-500 border-2 border-purple-500"
                    : "bg-white/10 border-2 border-white/20"
                )}>
                  {selectedIds.has(product.id) ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                
                {/* Current Badge */}
                {product.isCurrentProduct && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-background border border-white/10 rounded text-[9px] font-bold text-muted-foreground uppercase whitespace-nowrap">
                    This Item
                  </div>
                )}
              </div>
              
              {/* Product Info */}
              <div className="text-center">
                <div className="text-[11px] font-semibold text-foreground/90 max-w-[80px] truncate">
                  {product.name}
                </div>
                <div className="text-[13px] font-bold text-foreground mt-0.5">
                  ${product.price.toFixed(2)}
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}

        {/* Total Section */}
        <div className="flex flex-col items-center gap-1 px-3 md:border-l md:border-white/10 md:ml-2">
          <div className="text-xl font-bold text-muted-foreground">=</div>
          <div className="text-center">
            {pricing.discountApplies && (
              <div className="text-[13px] font-medium text-muted-foreground line-through">
                ${pricing.originalTotal.toFixed(2)}
              </div>
            )}
            <div className="text-xl font-extrabold text-foreground">
              ${pricing.finalTotal.toFixed(2)}
            </div>
            {pricing.discountApplies && (
              <div className="text-xs font-bold text-emerald-400">
                Save ${pricing.discountAmount.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add All Button */}
      <button
        onClick={handleAddAllToCart}
        disabled={pricing.itemCount < 1}
        className="flex items-center justify-center gap-2.5 w-full py-3.5 px-6 mt-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-none rounded-xl text-[15px] font-bold text-white cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ShoppingCart className="w-5 h-5" />
        Add {pricing.itemCount > 1 ? `All ${pricing.itemCount} Items` : 'to Cart'}
        {pricing.discountApplies && ` — Save ${bundleDiscount}%`}
      </button>

      {/* Selection Hint */}
      <div className="text-center mt-2.5 text-xs font-medium text-muted-foreground">
        {pricing.itemCount < 2 
          ? 'Select 2+ items to unlock bundle discount'
          : `${pricing.itemCount} items selected`
        }
      </div>
    </div>
  );
};

export default FrequentlyBoughtTogether;
