import React from 'react';
import { Check, TrendingDown, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuantityTier } from './types';

interface QuantityDiscountSelectorProps {
  tiers: QuantityTier[];
  selectedQuantity: number;
  onSelectQuantity: (quantity: number) => void;
  basePrice: number;
}

export const QuantityDiscountSelector: React.FC<QuantityDiscountSelectorProps> = ({
  tiers,
  selectedQuantity,
  onSelectQuantity,
  basePrice
}) => {
  if (tiers.length === 0) return null;

  return (
    <div className="bg-card/50 border border-border rounded-2xl p-5 mt-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
          <TrendingDown className="w-5 h-5 text-emerald-400" />
          Buy More, Save More
        </h3>
      </div>

      {/* Tiers Grid */}
      <div 
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        role="radiogroup"
        aria-label="Quantity selection"
      >
        {tiers.map((tier) => {
          const isSelected = selectedQuantity === tier.quantity;
          
          return (
            <div
              key={tier.quantity}
              onClick={() => onSelectQuantity(tier.quantity)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition-all",
                tier.isBestValue && "pt-7",
                isSelected
                  ? "bg-primary/10 border-2 border-primary"
                  : tier.isBestValue
                    ? "bg-emerald-500/5 border-2 border-emerald-500/30 hover:border-primary/40 hover:bg-primary/5"
                    : "bg-white/[0.02] border-2 border-white/[0.08] hover:border-primary/40 hover:bg-primary/5"
              )}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${tier.quantity} spool${tier.quantity > 1 ? 's' : ''}, $${tier.pricePerUnit.toFixed(2)} each${tier.discountPercent > 0 ? `, save ${tier.discountPercent}%` : ''}${tier.isBestValue ? ', best value' : ''}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectQuantity(tier.quantity);
                }
              }}
            >
              {/* Best Value Badge */}
              {tier.isBestValue && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-b-lg text-[10px] font-bold text-white uppercase tracking-wider">
                  <Award className="w-3 h-3" />
                  Best Value
                </div>
              )}
              
              {/* Tier Label */}
              {tier.label && !tier.isBestValue && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-background border border-white/10 rounded text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                  {tier.label}
                </div>
              )}

              {/* Quantity */}
              <div className="text-[15px] font-bold text-foreground">
                {tier.quantity} {tier.quantity === 1 ? 'Spool' : 'Spools'}
              </div>

              {/* Pricing */}
              <div className="flex flex-col items-center gap-1">
                <div className="text-xl font-extrabold text-foreground">
                  ${tier.pricePerUnit.toFixed(2)}
                  <span className="text-xs font-medium text-muted-foreground">/each</span>
                </div>
                
                {tier.discountPercent > 0 && (
                  <div className="px-2 py-0.5 bg-emerald-500/15 rounded text-[11px] font-bold text-emerald-400">
                    Save {tier.discountPercent}%
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="text-xs font-medium text-muted-foreground text-center">
                Total: ${tier.totalPrice.toFixed(2)}
                {tier.savingsAmount > 0 && (
                  <span className="block text-emerald-400 font-semibold">
                    (Save ${tier.savingsAmount.toFixed(2)})
                  </span>
                )}
              </div>

              {/* Selection Indicator */}
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full mt-1 transition-all",
                isSelected
                  ? "bg-primary border-2 border-primary"
                  : "border-2 border-white/20"
              )}>
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                ) : (
                  <div className="w-2 h-2 rounded-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Note */}
      <div className="text-center mt-3 text-[11px] font-medium text-muted-foreground">
        Prices compared to buying {tiers[0]?.quantity || 1} at ${basePrice.toFixed(2)}
      </div>
    </div>
  );
};

export default QuantityDiscountSelector;
