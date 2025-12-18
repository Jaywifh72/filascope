import React, { useState } from 'react';
import { Package, ShoppingCart, Percent, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bundle } from './types';

interface BundleBuilderProps {
  bundles: Bundle[];
  onAddBundle?: (bundleId: string) => void;
}

export const BundleBuilder: React.FC<BundleBuilderProps> = ({
  bundles,
  onAddBundle
}) => {
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);

  if (bundles.length === 0) return null;

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Package className="w-5 h-5 text-amber-500" />
          Ready-Made Bundles
        </h3>
        <p className="text-[13px] text-muted-foreground mt-1">
          Curated sets at special prices
        </p>
      </div>

      {/* Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bundles.map((bundle) => (
          <div
            key={bundle.id}
            className="relative bg-card/50 border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-amber-500/40 transition-colors"
          >
            {/* Badge */}
            {bundle.badge && (
              <div className="absolute -top-2 right-4 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-md text-[11px] font-bold text-white uppercase">
                {bundle.badge}
              </div>
            )}

            {/* Bundle Info */}
            <div>
              <h4 className="text-base font-bold text-foreground">
                {bundle.name}
              </h4>
              <p className="text-[13px] text-muted-foreground mt-1">
                {bundle.description}
              </p>
            </div>

            {/* Product Thumbnails */}
            <div className="flex items-center gap-2">
              {bundle.products.slice(0, 3).map((product) => (
                <div
                  key={product.id}
                  className="relative w-12 h-12 bg-white/5 rounded-lg overflow-hidden"
                >
                  <img
                    src={product.image || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                  {product.quantity > 1 && (
                    <div className="absolute bottom-0.5 right-0.5 px-1 py-px bg-black/70 rounded text-[9px] font-bold text-white">
                      ×{product.quantity}
                    </div>
                  )}
                </div>
              ))}
              {bundle.products.length > 3 && (
                <div className="flex items-center justify-center w-12 h-12 bg-white/5 rounded-lg text-[13px] font-semibold text-muted-foreground">
                  +{bundle.products.length - 3}
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground line-through">
                ${bundle.originalPrice.toFixed(2)}
              </span>
              <span className="text-xl font-extrabold text-foreground">
                ${bundle.bundlePrice.toFixed(2)}
              </span>
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/15 rounded-md text-xs font-bold text-emerald-400">
                <Percent className="w-3 h-3" />
                Save {bundle.savingsPercent}% (${bundle.savingsAmount.toFixed(2)})
              </div>
            </div>

            {/* Expand Button */}
            <button
              onClick={() => setExpandedBundle(
                expandedBundle === bundle.id ? null : bundle.id
              )}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-transparent border border-white/10 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
              aria-expanded={expandedBundle === bundle.id}
            >
              {expandedBundle === bundle.id ? 'Hide details' : 'View contents'}
              {expandedBundle === bundle.id 
                ? <ChevronUp className="w-3.5 h-3.5" /> 
                : <ChevronDown className="w-3.5 h-3.5" />
              }
            </button>

            {/* Expanded Contents */}
            {expandedBundle === bundle.id && (
              <div className="flex flex-col gap-2 p-3 bg-black/20 rounded-lg">
                {bundle.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-2.5"
                  >
                    <img
                      src={product.image || '/placeholder.svg'}
                      alt={product.name}
                      className="w-8 h-8 object-contain rounded bg-white/5"
                    />
                    <span className="flex-1 text-xs font-medium text-foreground/90">
                      {product.name}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      ×{product.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add Bundle Button */}
            <button
              onClick={() => onAddBundle?.(bundle.id)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border-none rounded-xl text-sm font-bold text-white cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <ShoppingCart className="w-4 h-4" />
              Add Bundle to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BundleBuilder;
