import React from 'react';
import { 
  ShoppingCart, 
  ExternalLink, 
  Shield, 
  Truck, 
  RotateCcw, 
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';
import { useConversionTracking } from '@/hooks/useConversionTracking';
import { cn } from '@/lib/utils';
import { PriceUrgencyBadge } from '../urgency/PriceUrgencyBadge';
import { StockUrgencyIndicator } from '../urgency/StockUrgencyIndicator';
import { ShippingCountdown } from '../urgency/ShippingCountdown';
import { ActivityStatsBanner } from '../urgency/ActivityStatsBanner';

interface FilamentHeroPurchaseCardProps {
  filamentId: string;
  vendor: string | null;
  pricePerKg: number | null;
  pricePerSpool: number | null;
  affiliateUrl: string | null;
  retailerName?: string;
  inStock?: boolean;
  stockQuantity?: number | null;
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
  stockQuantity,
  onViewRetailers,
  retailerCount = 1
}: FilamentHeroPurchaseCardProps) {
  const { formatPrice } = useCurrency();
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

  // Determine stock status for indicator
  const stockStatus = !inStock ? 'out_of_stock' : 
    (stockQuantity !== null && stockQuantity !== undefined && stockQuantity <= 10) ? 'low_stock' : 'in_stock';

  // Sample social proof data - in production this would come from props or API
  const socialProofData = {
    viewingNow: Math.floor(Math.random() * 15) + 3,
    purchasedToday: Math.floor(Math.random() * 20) + 5,
    purchasedThisWeek: Math.floor(Math.random() * 100) + 30,
    isBestseller: Math.random() > 0.7,
    bestsellerRank: Math.floor(Math.random() * 10) + 1,
    bestsellerCategory: 'PLA Filaments'
  };

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

        {/* Price Urgency Badge */}
        {(pricePerKg || pricePerSpool) && (
          <PriceUrgencyBadge
            filamentId={filamentId}
            currentPrice={pricePerKg || pricePerSpool}
            size="medium"
          />
        )}
      </div>

      {/* Stock Status with Urgency */}
      <div className="mb-4">
        <StockUrgencyIndicator
          stockStatus={stockStatus}
          stockQuantity={stockQuantity}
          showQuantity={true}
        />
      </div>

      {/* Shipping Countdown */}
      {inStock && (
        <div className="mb-5">
          <ShippingCountdown
            sameDayCutoffHour={14}
            freeShippingThreshold={35}
            currentCartValue={pricePerSpool || 0}
          />
        </div>
      )}

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

      {/* Activity Stats - Social Proof */}
      <div className="pt-4 mt-4 border-t border-border/30">
        <ActivityStatsBanner socialProof={socialProofData} compact />
      </div>

      {/* Trust Signals */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/30">
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
