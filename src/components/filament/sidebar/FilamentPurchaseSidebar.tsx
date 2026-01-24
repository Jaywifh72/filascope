import React from 'react';
import { 
  ShoppingCart, 
  ExternalLink, 
  Shield, 
  Truck, 
  RotateCcw, 
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Globe,
  Calculator,
  GitCompare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MaterialBadge } from '@/components/MaterialBadge';
import { useCurrency, CurrencyCode, CURRENCIES } from '@/hooks/useCurrency';
import { useConversionTracking } from '@/hooks/useConversionTracking';
import { useCurrentPrice } from '@/hooks/useCurrentPrice';
import { cn } from '@/lib/utils';
import { getShippingRule } from '@/lib/pricingRules';
import { PriceUrgencyBadge } from '../urgency/PriceUrgencyBadge';
import { ShippingCountdown } from '../urgency/ShippingCountdown';
import { useCompare } from '@/hooks/useCompare';

interface FilamentPurchaseSidebarProps {
  filamentId: string;
  vendor: string | null;
  material: string | null;
  pricePerKg: number | null;
  pricePerSpool: number | null;
  weightGrams: number | null;
  affiliateUrl: string | null;
  productUrl: string | null;
  originalUsUrl?: string;
  retailerName?: string;
  onViewRetailers?: () => void;
  retailerCount?: number;
  hasActualRegionalPrice?: boolean;
  isUsingFallbackRegion?: boolean;
  actualUrlCurrency?: CurrencyCode | null;
  isAvailableInUserRegion?: boolean;
  isRegionalBrand?: boolean;
  onOpenCalculator?: () => void;
}

export function FilamentPurchaseSidebar({
  filamentId,
  vendor,
  material,
  pricePerKg,
  pricePerSpool,
  weightGrams,
  affiliateUrl,
  productUrl,
  originalUsUrl,
  retailerName,
  onViewRetailers,
  retailerCount = 1,
  hasActualRegionalPrice = false,
  isUsingFallbackRegion = false,
  actualUrlCurrency = null,
  isAvailableInUserRegion = true,
  isRegionalBrand = false,
  onOpenCalculator,
}: FilamentPurchaseSidebarProps) {
  const { formatPrice, formatRegionalPrice, currency } = useCurrency();
  const { trackStoreClick } = useConversionTracking();
  const { addItem, removeItem, isInCompare } = useCompare();
  
  // Fetch live price from the store
  const { 
    currentPrice, 
    compareAtPrice,
    weightGrams: liveWeightGrams,
    isLoading: priceLoading, 
    isLivePrice,
    currency: priceCurrency
  } = useCurrentPrice(productUrl, pricePerSpool, originalUsUrl);

  // Determine the primary retailer name
  const displayRetailer = retailerName || vendor || 'Store';
  
  // Check if this is an Amazon link
  const isAmazon = affiliateUrl?.includes('amazon');
  const finalRetailerName = isAmazon ? 'Amazon' : displayRetailer;

  const isComparing = isInCompare(filamentId);

  const handleBuyClick = () => {
    if (!affiliateUrl) return;
    
    trackStoreClick({
      moduleName: 'sidebar_purchase',
      entityId: filamentId,
      entityType: 'filament',
    });
    
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCompareToggle = () => {
    if (isComparing) {
      removeItem(filamentId);
    } else {
      addItem({
        id: filamentId,
        product_title: retailerName || 'Filament',
        material: material,
        vendor: vendor,
        color_hex: null,
        variant_price: pricePerSpool,
        net_weight_g: weightGrams,
      });
    }
  };

  // Use live price if available, otherwise fall back to stored price
  const displayPrice = isLivePrice && currentPrice !== null ? currentPrice : pricePerSpool;
  
  // Calculate price per kg using live weight when available
  const liveWeightKg = liveWeightGrams ? liveWeightGrams / 1000 : null;
  const fallbackWeightKg = weightGrams ? weightGrams / 1000 : null;
  
  let displayPricePerKg: number | null = null;
  if (isLivePrice && currentPrice !== null && liveWeightKg) {
    displayPricePerKg = currentPrice / liveWeightKg;
  } else if (displayPrice && fallbackWeightKg) {
    displayPricePerKg = displayPrice / fallbackWeightKg;
  } else {
    displayPricePerKg = pricePerKg;
  }

  // Format live prices in their original currency
  const formatLivePrice = (price: number, showCurrency = false): string => {
    const symbols: Record<string, string> = { 'USD': '$', 'CAD': 'C$', 'EUR': '€', 'GBP': '£', 'AUD': 'A$', 'JPY': '¥' };
    const symbol = symbols[priceCurrency] || '$';
    const formatted = price.toFixed(2);
    return showCurrency ? `${symbol}${formatted} ${priceCurrency}` : `${symbol}${formatted}`;
  };

  const formattedPricePerKg = displayPricePerKg 
    ? (isLivePrice 
        ? formatLivePrice(displayPricePerKg) 
        : hasActualRegionalPrice ? formatRegionalPrice(displayPricePerKg, false) : formatPrice(displayPricePerKg, false))
    : null;

  // Get vendor-specific shipping rules
  const shippingRule = getShippingRule(vendor || 'default');

  return (
    <aside className="hidden lg:block w-[300px] flex-shrink-0">
      <div 
        className="sticky top-20 w-[300px] rounded-xl border border-border/60 p-6 space-y-5"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        {/* Material Badge */}
        {material && (
          <div className="flex items-center gap-2">
            <MaterialBadge 
              material={material} 
              variant="default" 
              size="sm"
              className="text-xs"
            />
          </div>
        )}

        {/* Price Section */}
        <div className="space-y-2">
          {priceLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">Checking price...</span>
            </div>
          ) : formattedPricePerKg ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {formattedPricePerKg}
                </span>
                <span className="text-sm text-muted-foreground font-medium">/kg</span>
              </div>
              
              {/* Compare at price (sale indicator) */}
              {isLivePrice && compareAtPrice && compareAtPrice > (currentPrice || 0) && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground line-through">
                    {formatLivePrice(compareAtPrice)}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                    {Math.round((1 - (currentPrice || 0) / compareAtPrice) * 100)}% OFF
                  </span>
                </div>
              )}
            </>
          ) : (
            <span className="text-lg text-muted-foreground">Price unavailable</span>
          )}

          {/* Live price indicator */}
          {isLivePrice && !priceLoading && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-medium">Live price verified</span>
            </div>
          )}

          {/* Fallback region warning */}
          {isUsingFallbackRegion && actualUrlCurrency && !priceLoading && isAvailableInUserRegion && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md">
              <Globe className="w-3.5 h-3.5" />
              <span className="font-medium">
                Price from {CURRENCIES[actualUrlCurrency]?.name || actualUrlCurrency} store
              </span>
            </div>
          )}

          {/* Price Urgency Badge */}
          {(displayPricePerKg || displayPrice) && (
            <PriceUrgencyBadge
              filamentId={filamentId}
              currentPrice={displayPricePerKg || displayPrice}
              size="small"
            />
          )}
        </div>

        {/* Free Shipping Progress */}
        {shippingRule.flatRate > 0 && (
          <ShippingCountdown
            freeShippingThreshold={shippingRule.freeThreshold}
            currentCartValue={displayPrice || pricePerSpool || 0}
          />
        )}

        {/* Primary CTA - BUY NOW */}
        <Button
          onClick={handleBuyClick}
          disabled={!affiliateUrl}
          className={cn(
            "w-full h-14 text-lg font-bold tracking-wide",
            "bg-gradient-to-r from-primary to-primary/80",
            "hover:from-primary/90 hover:to-primary/70",
            "shadow-[0_4px_16px_rgba(0,212,212,0.25)]",
            "hover:shadow-[0_8px_24px_rgba(0,212,212,0.35)]",
            "hover:-translate-y-0.5 transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
          )}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          BUY NOW
          <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
        </Button>

        {/* Compare Button */}
        <Button
          variant="outline"
          onClick={handleCompareToggle}
          className={cn(
            "w-full h-11 text-sm font-medium",
            isComparing && "border-primary text-primary bg-primary/5"
          )}
        >
          <GitCompare className="w-4 h-4 mr-2" />
          {isComparing ? 'Remove from Compare' : 'Add to Compare'}
        </Button>

        {/* Retailer Info */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">Best Price:</span>
          <span className="font-bold text-foreground/80">{finalRetailerName}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </div>

        {/* View All Retailers */}
        {retailerCount > 1 && onViewRetailers && (
          <button
            onClick={onViewRetailers}
            className={cn(
              "w-full h-10 flex items-center justify-center gap-2",
              "bg-white/[0.03] border border-white/10 rounded-lg",
              "text-sm font-medium text-muted-foreground",
              "hover:bg-white/[0.06] hover:border-white/20 hover:text-white",
              "transition-all duration-200 cursor-pointer"
            )}
          >
            View All {retailerCount} Retailers
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Calculator Link */}
        {onOpenCalculator && (
          <button
            onClick={onOpenCalculator}
            className={cn(
              "w-full h-10 flex items-center justify-center gap-2",
              "bg-primary/5 border border-primary/20 rounded-lg",
              "text-sm font-medium text-primary",
              "hover:bg-primary/10 transition-colors cursor-pointer"
            )}
          >
            <Calculator className="w-4 h-4" />
            Open Print Calculator
          </button>
        )}

        {/* Trust Signals */}
        <div className="pt-4 border-t border-border/40 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Price verified across retailers</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Truck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>
              {shippingRule.flatRate === 0 
                ? 'Free shipping available' 
                : `Free shipping on orders $${shippingRule.freeThreshold}+`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Easy returns policy</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
