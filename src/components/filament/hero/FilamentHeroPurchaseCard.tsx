import React from 'react';
import { 
  ShoppingCart, 
  ExternalLink, 
  Shield, 
  Truck, 
  RotateCcw, 
  Check, 
  Clock, 
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';
import { useConversionTracking } from '@/hooks/useConversionTracking';
import { cn } from '@/lib/utils';

interface FilamentHeroPurchaseCardProps {
  filamentId: string;
  vendor: string | null;
  pricePerKg: number | null;
  pricePerSpool: number | null;
  affiliateUrl: string | null;
  retailerName?: string;
  inStock?: boolean;
  onViewRetailers?: () => void;
  retailerCount?: number;
}

export function FilamentHeroPurchaseCard({
  filamentId,
  vendor,
  pricePerKg,
  pricePerSpool,
  affiliateUrl,
  retailerName,
  inStock = true,
  onViewRetailers,
  retailerCount = 1
}: FilamentHeroPurchaseCardProps) {
  const { formatPrice, convertPrice } = useCurrency();
  const { trackStoreClick } = useConversionTracking();

  // Determine the primary retailer name
  const displayRetailer = retailerName || vendor || 'Store';
  
  // Check if this is an Amazon link
  const isAmazon = affiliateUrl?.includes('amazon');
  const finalRetailerName = isAmazon ? 'Amazon' : displayRetailer;

  const handleBuyClick = () => {
    if (!affiliateUrl) return;
    
    trackStoreClick({
      moduleName: 'hero_purchase_card',
      entityId: filamentId,
      entityType: 'filament',
    });
    
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  // Format the price per kg for display
  const formattedPricePerKg = pricePerKg ? formatPrice(pricePerKg) : null;
  const formattedPricePerSpool = pricePerSpool ? formatPrice(pricePerSpool) : null;

  return (
    <div className={cn(
      "rounded-2xl p-6",
      "bg-gradient-to-br from-primary/5 to-primary/[0.02]",
      "border border-primary/15"
    )}>
      {/* Price Section */}
      <div className="space-y-3 mb-4">
        <div className="flex items-baseline gap-3">
          {formattedPricePerKg ? (
            <>
              <span className="text-[42px] font-extrabold text-white tracking-tight leading-none">
                {formattedPricePerKg}
              </span>
              <span className="text-lg text-muted-foreground font-medium">/kg</span>
            </>
          ) : formattedPricePerSpool ? (
            <span className="text-[42px] font-extrabold text-white tracking-tight leading-none">
              {formattedPricePerSpool}
            </span>
          ) : (
            <span className="text-2xl text-muted-foreground">Price unavailable</span>
          )}
        </div>

        {/* Deal Badge - show if we have a price */}
        {(pricePerKg || pricePerSpool) && (
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
            "bg-gradient-to-r from-emerald-500/15 to-emerald-500/5",
            "border border-emerald-500/30"
          )}>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">
              Great value for quality filament
            </span>
          </div>
        )}
      </div>

      {/* Stock Status */}
      <div className="flex items-center gap-2 mb-5">
        <div className={cn(
          "flex items-center gap-1.5 text-sm font-semibold",
          inStock ? "text-emerald-400" : "text-destructive"
        )}>
          {inStock ? (
            <>
              <Check className="w-4 h-4" />
              <span>In Stock</span>
            </>
          ) : (
            <span>Out of Stock</span>
          )}
        </div>
        {inStock && (
          <>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Ships within 24hrs</span>
            </div>
          </>
        )}
      </div>

      {/* Primary CTA - BUY NOW */}
      <Button
        onClick={handleBuyClick}
        disabled={!affiliateUrl || !inStock}
        className={cn(
          "w-full h-16 text-xl font-extrabold tracking-wide",
          "bg-gradient-to-r from-primary to-primary/80",
          "hover:from-primary/90 hover:to-primary/70",
          "shadow-[0_8px_24px_rgba(0,212,212,0.3),inset_0_2px_0_rgba(255,255,255,0.2)]",
          "hover:shadow-[0_12px_32px_rgba(0,212,212,0.4)]",
          "hover:-translate-y-0.5 transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
        )}
      >
        <ShoppingCart className="w-5 h-5 mr-3" />
        BUY NOW
      </Button>

      {/* Retailer Info */}
      <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
        <span className="font-medium">Best Price:</span>
        <span className="font-bold text-foreground/80">{finalRetailerName}</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </div>

      {/* View All Retailers - only show if more than 1 */}
      {retailerCount > 1 && onViewRetailers && (
        <button
          onClick={onViewRetailers}
          className={cn(
            "w-full h-12 mt-4",
            "flex items-center justify-center gap-2",
            "bg-white/[0.03] border border-white/10 rounded-lg",
            "text-sm font-semibold text-muted-foreground",
            "hover:bg-white/[0.06] hover:border-white/20 hover:text-white",
            "transition-all duration-200 cursor-pointer"
          )}
        >
          View All {retailerCount} Retailers
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Trust Signals */}
      <div className="flex items-center justify-between pt-5 mt-5 border-t border-border/30">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Price verified</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Truck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Free $35+</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Easy returns</span>
        </div>
      </div>
    </div>
  );
}
