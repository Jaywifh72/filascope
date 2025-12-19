import React from 'react';
import { 
  ShoppingCart, 
  ExternalLink, 
  Shield, 
  Truck, 
  RotateCcw, 
  ChevronRight,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';
import { useConversionTracking } from '@/hooks/useConversionTracking';
import { useCurrentPrice } from '@/hooks/useCurrentPrice';
import { cn } from '@/lib/utils';
import { getShippingRule } from '@/lib/pricingRules';
import { PriceUrgencyBadge } from '../urgency/PriceUrgencyBadge';
import { StockUrgencyIndicator } from '../urgency/StockUrgencyIndicator';
import { ShippingCountdown } from '../urgency/ShippingCountdown';

interface FilamentHeroPurchaseCardProps {
  filamentId: string;
  vendor: string | null;
  pricePerKg: number | null;
  pricePerSpool: number | null;
  weightGrams: number | null;
  affiliateUrl: string | null;
  productUrl: string | null;
  retailerName?: string;
  inStock?: boolean;
  stockQuantity?: number | null;
  onViewRetailers?: () => void;
  retailerCount?: number;
  hasActualRegionalPrice?: boolean;
}

export function FilamentHeroPurchaseCard({
  filamentId,
  vendor,
  pricePerKg,
  pricePerSpool,
  weightGrams,
  affiliateUrl,
  productUrl,
  retailerName,
  inStock = true,
  stockQuantity,
  onViewRetailers,
  retailerCount = 1,
  hasActualRegionalPrice = false
}: FilamentHeroPurchaseCardProps) {
  const { formatPrice, formatRegionalPrice, currency } = useCurrency();
  const { trackStoreClick } = useConversionTracking();
  
  // Fetch live price from the store
  const { 
    currentPrice, 
    compareAtPrice,
    weightGrams: liveWeightGrams,
    isLoading: priceLoading, 
    isLivePrice,
    currency: priceCurrency
  } = useCurrentPrice(productUrl, pricePerSpool);

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

  // Use live price if available, otherwise fall back to stored price
  const displayPrice = isLivePrice && currentPrice !== null ? currentPrice : pricePerSpool;
  
  // Calculate price per kg using live weight when available
  const liveWeightKg = liveWeightGrams ? liveWeightGrams / 1000 : null;
  const fallbackWeightKg = weightGrams ? weightGrams / 1000 : null;
  
  let displayPricePerKg: number | null = null;
  if (isLivePrice && currentPrice !== null && liveWeightKg) {
    // Use live price and live weight for accurate price/kg
    displayPricePerKg = currentPrice / liveWeightKg;
  } else if (displayPrice && fallbackWeightKg) {
    // Fall back to using display price with database weight
    displayPricePerKg = displayPrice / fallbackWeightKg;
  } else {
    // Last resort: use the passed pricePerKg prop
    displayPricePerKg = pricePerKg;
  }

  // Format the price - convert live prices (USD) to user's currency
  const formattedPricePerKg = displayPricePerKg 
    ? (isLivePrice 
        ? formatPrice(displayPricePerKg, false) 
        : hasActualRegionalPrice ? formatRegionalPrice(displayPricePerKg, false) : formatPrice(displayPricePerKg, false))
    : null;
  const formattedPricePerSpool = displayPrice 
    ? (isLivePrice 
        ? formatPrice(displayPrice, false) 
        : hasActualRegionalPrice ? formatRegionalPrice(displayPrice, false) : formatPrice(displayPrice, false))
    : null;

  // Show original currency if converted (live price is in store currency, user selected different)
  const showOriginalCurrency = isLivePrice && priceCurrency && priceCurrency !== currency;
  const currencySymbols: Record<string, string> = { 'USD': '$', 'CAD': 'C$', 'EUR': '€', 'GBP': '£', 'AUD': 'A$', 'JPY': '¥' };
  const originalSymbol = currencySymbols[priceCurrency] || '$';
  const originalPricePerKg = displayPricePerKg ? `${originalSymbol}${displayPricePerKg.toFixed(2)} ${priceCurrency}` : null;

  // Determine stock status for indicator
  const stockStatus = !inStock ? 'out_of_stock' : 
    (stockQuantity !== null && stockQuantity !== undefined && stockQuantity <= 10) ? 'low_stock' : 'in_stock';

  // Get vendor-specific shipping rules
  const shippingRule = getShippingRule(vendor || 'default');


  return (
    <div className={cn(
      "rounded-2xl p-6",
      "bg-gradient-to-br from-primary/5 to-primary/[0.02]",
      "border border-primary/15"
    )}>
      {/* Price Section */}
      <div className="space-y-3 mb-4">
        <div className="flex items-baseline gap-3">
          {priceLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              <span className="text-lg text-muted-foreground">Checking price...</span>
            </div>
          ) : formattedPricePerKg ? (
            <>
              <div className="flex items-baseline gap-3">
                <span className="text-[42px] font-extrabold text-white tracking-tight leading-none">
                  {formattedPricePerKg}
                </span>
                <span className="text-lg text-muted-foreground font-medium">/kg</span>
              </div>
              {showOriginalCurrency && originalPricePerKg && (
                <span className="text-sm text-muted-foreground">
                  ({originalPricePerKg})
                </span>
              )}
            </>
          ) : formattedPricePerSpool ? (
            <span className="text-[42px] font-extrabold text-white tracking-tight leading-none">
              {formattedPricePerSpool}
            </span>
          ) : (
            <span className="text-2xl text-muted-foreground">Price unavailable</span>
          )}
        </div>

        {/* Live price indicator */}
        {isLivePrice && !priceLoading && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-medium">Live price verified</span>
          </div>
        )}

        {/* Compare at price (sale indicator) */}
        {isLivePrice && compareAtPrice && compareAtPrice > (currentPrice || 0) && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground line-through">
              {formatRegionalPrice(compareAtPrice, false)}
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              {Math.round((1 - (currentPrice || 0) / compareAtPrice) * 100)}% OFF
            </span>
          </div>
        )}

        {/* Price Urgency Badge */}
        {(displayPricePerKg || displayPrice) && (
          <PriceUrgencyBadge
            filamentId={filamentId}
            currentPrice={displayPricePerKg || displayPrice}
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

      {/* Free Shipping Progress */}
      {inStock && shippingRule.flatRate > 0 && (
        <div className="mb-5">
          <ShippingCountdown
            freeShippingThreshold={shippingRule.freeThreshold}
            currentCartValue={displayPrice || pricePerSpool || 0}
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

      {/* Trust Signals */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/30">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Price verified</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Truck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {shippingRule.flatRate === 0 
              ? 'Free shipping' 
              : `Free $${shippingRule.freeThreshold}+`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Easy returns</span>
        </div>
      </div>
    </div>
  );
}
