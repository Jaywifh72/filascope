import React from 'react';
import { 
  ShoppingCart, 
  ExternalLink, 
  Truck, 
  RotateCcw, 
  ChevronRight,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency, CurrencyCode, CURRENCIES } from '@/hooks/useCurrency';
import { useConversionTracking } from '@/hooks/useConversionTracking';
import { useCurrentPrice } from '@/hooks/useCurrentPrice';
import { cn } from '@/lib/utils';
import { getShippingRule } from '@/lib/pricingRules';
import { PriceUrgencyBadge } from '../urgency/PriceUrgencyBadge';
import { StockUrgencyIndicator } from '../urgency/StockUrgencyIndicator';
import { ShippingCountdown } from '../urgency/ShippingCountdown';
import { RegionalAvailabilityBadge, CrossBorderNote } from '../RegionalAvailabilityBadge';
import { PriceConfidence } from '@/hooks/usePriceFreshness';
import { HonestPriceDisplay, getCtaText, shouldUsePrimaryCta } from '@/components/price/HonestPriceDisplay';

interface FilamentHeroPurchaseCardProps {
  filamentId: string;
  vendor: string | null;
  pricePerKg: number | null;
  pricePerSpool: number | null;
  weightGrams: number | null;
  affiliateUrl: string | null;
  productUrl: string | null;
  originalUsUrl?: string;
  retailerName?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
  stockQuantity?: number | null;
  hasInventoryData?: boolean;
  onViewRetailers?: () => void;
  retailerCount?: number;
  hasActualRegionalPrice?: boolean;
  isUsingFallbackRegion?: boolean;
  actualUrlCurrency?: CurrencyCode | null;
  isAvailableInUserRegion?: boolean;
  isRegionalBrand?: boolean;
  lastScrapedAt?: string | null;
  priceConfidence?: PriceConfidence | string | null;
}

export function FilamentHeroPurchaseCard({
  filamentId,
  vendor,
  pricePerKg,
  pricePerSpool,
  weightGrams,
  affiliateUrl,
  productUrl,
  originalUsUrl,
  retailerName,
  stockStatus = 'unknown',
  stockQuantity,
  hasInventoryData = false,
  onViewRetailers,
  retailerCount = 1,
  hasActualRegionalPrice = false,
  isUsingFallbackRegion = false,
  actualUrlCurrency = null,
  isAvailableInUserRegion = true,
  isRegionalBrand = false,
  lastScrapedAt,
  priceConfidence,
}: FilamentHeroPurchaseCardProps) {
  const { formatPrice, formatRegionalPrice, currency } = useCurrency();
  const { trackStoreClick } = useConversionTracking();
  
  // Fetch live price from the store (with fallback to US URL if regional 404s)
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

  // Format live prices in their original currency (no conversion)
  // This is important because Bambu Lab regional stores often show USD prices regardless of region
  const formatLivePrice = (price: number, showCurrency = false): string => {
    const symbols: Record<string, string> = { 'USD': '$', 'CAD': 'C$', 'EUR': '€', 'GBP': '£', 'AUD': 'A$', 'JPY': '¥' };
    const symbol = symbols[priceCurrency] || '$';
    const formatted = price.toFixed(2);
    return showCurrency ? `${symbol}${formatted} ${priceCurrency}` : `${symbol}${formatted}`;
  };

  // Format the price - live prices should be displayed in their actual currency, not converted
  const formattedPricePerKg = displayPricePerKg 
    ? (isLivePrice 
        ? formatLivePrice(displayPricePerKg) 
        : hasActualRegionalPrice ? formatRegionalPrice(displayPricePerKg, false) : formatPrice(displayPricePerKg, false))
    : null;
  const formattedPricePerSpool = displayPrice 
    ? (isLivePrice 
        ? formatLivePrice(displayPrice) 
        : hasActualRegionalPrice ? formatRegionalPrice(displayPrice, false) : formatPrice(displayPrice, false))
    : null;

  // Show a note about the currency if it differs from what user expected
  const showCurrencyNote = isLivePrice && priceCurrency && priceCurrency !== currency;
  const currencyNote = showCurrencyNote ? `(Store price in ${priceCurrency})` : null;

  // Get vendor-specific shipping rules
  const shippingRule = getShippingRule(vendor || 'default');


  return (
    <div className={cn(
      "rounded-2xl p-6",
      "bg-gradient-to-br from-primary/5 to-primary/[0.02]",
      "border border-primary/15"
    )}>
      {/* Regional Availability Warning - Show prominently at top */}
      {isRegionalBrand && !isAvailableInUserRegion && (
        <div className="mb-4">
          <RegionalAvailabilityBadge
            isAvailableInRegion={isAvailableInUserRegion}
            userCurrency={currency}
            fallbackCurrency={actualUrlCurrency}
            isRegionalBrand={isRegionalBrand}
            size="md"
          />
          {isUsingFallbackRegion && actualUrlCurrency && (
            <p className="text-xs text-muted-foreground mt-2">
              This product is not sold in your region's store. The price shown is from the {CURRENCIES[actualUrlCurrency]?.name || actualUrlCurrency} store and may require international shipping.
            </p>
          )}
        </div>
      )}

      {/* Price Section - Honest Display */}
      <div className="mb-4">
        {priceLoading ? (
          <div className="flex items-center gap-2 py-4">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            <span className="text-lg text-muted-foreground">Checking price...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Honest Price Display */}
            <HonestPriceDisplay
              price={displayPricePerKg}
              confidence={priceConfidence as PriceConfidence}
              lastVerifiedAt={lastScrapedAt}
              storeName={finalRetailerName}
              storeUrl={affiliateUrl}
              isConverted={showCurrencyNote}
              conversionTooltip={currencyNote}
              size="lg"
              showCTA={false}
              showPerKg={true}
            />
            
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

            {/* Fallback region warning - only if not already shown above */}
            {isUsingFallbackRegion && actualUrlCurrency && isAvailableInUserRegion && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md">
                <Globe className="w-3.5 h-3.5" />
                <span className="font-medium">
                  Price from {CURRENCIES[actualUrlCurrency]?.name || actualUrlCurrency} store
                </span>
              </div>
            )}

            {/* Price Urgency Badge - only show for fresh-enough prices */}
            {(displayPricePerKg || displayPrice) && priceConfidence !== 'stale' && priceConfidence !== 'unknown' && (
              <PriceUrgencyBadge
                filamentId={filamentId}
                currentPrice={displayPricePerKg || displayPrice}
                size="medium"
              />
            )}
          </div>
        )}
      </div>

      {/* Stock Status with Urgency - only show when we have real data */}
      {hasInventoryData && (
        <div className="mb-4">
          <StockUrgencyIndicator
            stockStatus={stockStatus}
            stockQuantity={stockQuantity}
            showQuantity={true}
          />
        </div>
      )}

      {/* Free Shipping Progress */}
      {stockStatus !== 'out_of_stock' && shippingRule.flatRate > 0 && (
        <div className="mb-5">
          <ShippingCountdown
            freeShippingThreshold={shippingRule.freeThreshold}
            currentCartValue={displayPrice || pricePerSpool || 0}
          />
        </div>
      )}

      {/* Primary CTA - Dynamic based on confidence */}
      <Button
        onClick={handleBuyClick}
        disabled={!affiliateUrl || stockStatus === 'out_of_stock'}
        variant={shouldUsePrimaryCta(priceConfidence as PriceConfidence) ? 'default' : 'outline'}
        className={cn(
          "w-full h-16 text-xl font-extrabold tracking-wide",
          shouldUsePrimaryCta(priceConfidence as PriceConfidence) && [
            "bg-gradient-to-r from-primary to-primary/80",
            "hover:from-primary/90 hover:to-primary/70",
            "shadow-[0_8px_24px_rgba(0,212,212,0.3),inset_0_2px_0_rgba(255,255,255,0.2)]",
            "hover:shadow-[0_12px_32px_rgba(0,212,212,0.4)]",
          ],
          "hover:-translate-y-0.5 transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
        )}
      >
        {shouldUsePrimaryCta(priceConfidence as PriceConfidence) && <ShoppingCart className="w-5 h-5 mr-3" />}
        {getCtaText(priceConfidence as PriceConfidence, finalRetailerName)}
        <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
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
        <p className="text-[10px] text-muted-foreground">
          Prices may vary — verify at store
        </p>
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
