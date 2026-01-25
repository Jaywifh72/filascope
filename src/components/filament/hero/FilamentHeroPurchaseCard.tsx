import React, { useState, useCallback } from 'react';
import { 
  ShoppingCart, 
  ExternalLink, 
  Truck, 
  RotateCcw, 
  ChevronRight,
  RefreshCw,
  Globe,
  Check,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency, CurrencyCode, CURRENCIES } from '@/hooks/useCurrency';
import { useConversionTracking } from '@/hooks/useConversionTracking';
import { useCurrentPrice } from '@/hooks/useCurrentPrice';
import { useLivePriceFetch, LivePriceFetchResult } from '@/hooks/useLivePriceFetch';
import { cn } from '@/lib/utils';
import { getShippingRule } from '@/lib/pricingRules';
import { PriceUrgencyBadge } from '../urgency/PriceUrgencyBadge';
import { StockUrgencyIndicator } from '../urgency/StockUrgencyIndicator';
import { ShippingCountdown } from '../urgency/ShippingCountdown';
import { RegionalAvailabilityBadge, CrossBorderNote } from '../RegionalAvailabilityBadge';
import { PriceConfidence } from '@/hooks/usePriceFreshness';
import { HonestPriceDisplay, getCtaText, shouldUsePrimaryCta } from '@/components/price/HonestPriceDisplay';
import { BrokenUrlReport } from '@/components/price/BrokenUrlReport';
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
  
  // State for manual live price check
  const [manualLivePrice, setManualLivePrice] = useState<LivePriceFetchResult | null>(null);
  const [hasCheckedLivePrice, setHasCheckedLivePrice] = useState(false);
  
  // Hook for manual live price fetching
  const { 
    fetchLivePrice, 
    isLoading: manualPriceLoading, 
    error: manualPriceError,
    reset: resetManualPrice 
  } = useLivePriceFetch();
  
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

  // Check if we should show the manual price check button (low/stale confidence)
  const needsManualCheck = priceConfidence === 'low' || priceConfidence === 'stale' || priceConfidence === 'unknown';
  
  // Handle manual live price check
  const handleCheckLivePrice = useCallback(async () => {
    if (!productUrl || manualPriceLoading) return;
    
    trackStoreClick({
      moduleName: 'hero_live_price_check',
      entityId: filamentId,
      entityType: 'filament',
    });
    
    const result = await fetchLivePrice(productUrl, originalUsUrl);
    if (result) {
      setManualLivePrice(result);
      setHasCheckedLivePrice(true);
    } else {
      // Still mark as checked even on error (to show error state)
      setHasCheckedLivePrice(true);
    }
  }, [productUrl, originalUsUrl, manualPriceLoading, fetchLivePrice, trackStoreClick, filamentId]);

  // Check if we got a 404 error from the manual price check
  const isUrl404 = hasCheckedLivePrice && manualLivePrice?.urlStatus === 'not_found';

  const handleBuyClick = () => {
    if (!affiliateUrl) return;
    
    trackStoreClick({
      moduleName: 'hero_purchase_card',
      entityId: filamentId,
      entityType: 'filament',
    });
    
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  // Determine which live price to use: manual check takes precedence
  const effectiveLivePrice = manualLivePrice?.price ?? (isLivePrice ? currentPrice : null);
  const effectiveCompareAtPrice = manualLivePrice?.compareAtPrice ?? (isLivePrice ? compareAtPrice : null);
  const effectiveLiveCurrency = manualLivePrice?.currency ?? priceCurrency;
  const isShowingLivePrice = manualLivePrice !== null || isLivePrice;
  
  // Use live price if available, otherwise fall back to stored price
  const displayPrice = effectiveLivePrice !== null ? effectiveLivePrice : pricePerSpool;
  
  // Calculate price per kg using live weight when available
  const effectiveLiveWeightGrams = manualLivePrice?.weightGrams ?? liveWeightGrams;
  const liveWeightKg = effectiveLiveWeightGrams ? effectiveLiveWeightGrams / 1000 : null;
  const fallbackWeightKg = weightGrams ? weightGrams / 1000 : null;
  
  let displayPricePerKg: number | null = null;
  if (isShowingLivePrice && effectiveLivePrice !== null && liveWeightKg) {
    // Use live price and live weight for accurate price/kg
    displayPricePerKg = effectiveLivePrice / liveWeightKg;
  } else if (displayPrice && fallbackWeightKg) {
    // Fall back to using display price with database weight
    displayPricePerKg = displayPrice / fallbackWeightKg;
  } else {
    // Last resort: use the passed pricePerKg prop
    displayPricePerKg = pricePerKg;
  }
  
  // Calculate price difference for savings display
  const estimatedPrice = pricePerSpool;
  const priceSavings = hasCheckedLivePrice && manualLivePrice?.price && estimatedPrice
    ? estimatedPrice - manualLivePrice.price
    : null;
  const savingsPercent = priceSavings && estimatedPrice 
    ? Math.round((priceSavings / estimatedPrice) * 100) 
    : null;

  // Format live prices in their original currency (no conversion)
  // This is important because Bambu Lab regional stores often show USD prices regardless of region
  const formatLivePrice = (price: number, showCurrency = false): string => {
    const symbols: Record<string, string> = { 'USD': '$', 'CAD': 'C$', 'EUR': '€', 'GBP': '£', 'AUD': 'A$', 'JPY': '¥' };
    const symbol = symbols[effectiveLiveCurrency] || '$';
    const formatted = price.toFixed(2);
    return showCurrency ? `${symbol}${formatted} ${effectiveLiveCurrency}` : `${symbol}${formatted}`;
  };

  // Format the price - live prices should be displayed in their actual currency, not converted
  const formattedPricePerKg = displayPricePerKg 
    ? (isShowingLivePrice 
        ? formatLivePrice(displayPricePerKg) 
        : hasActualRegionalPrice ? formatRegionalPrice(displayPricePerKg, false) : formatPrice(displayPricePerKg, false))
    : null;
  const formattedPricePerSpool = displayPrice 
    ? (isShowingLivePrice 
        ? formatLivePrice(displayPrice) 
        : hasActualRegionalPrice ? formatRegionalPrice(displayPrice, false) : formatPrice(displayPrice, false))
    : null;

  // Show a note about the currency if it differs from what user expected
  const showCurrencyNote = isShowingLivePrice && effectiveLiveCurrency && effectiveLiveCurrency !== currency;
  const currencyNote = showCurrencyNote ? `(Store price in ${effectiveLiveCurrency})` : null;

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
        {priceLoading || manualPriceLoading ? (
          <div className="flex items-center gap-2 py-4">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            <span className="text-lg text-muted-foreground">
              {manualPriceLoading ? 'Fetching live price...' : 'Checking price...'}
            </span>
          </div>
        ) : isUrl404 ? (
          // Show broken URL report when 404 detected
          <div className="space-y-3 animate-in fade-in duration-300">
            <BrokenUrlReport
              entityType="filament"
              entityId={filamentId}
              urlField="product_url"
              currentUrl={productUrl || ''}
              productName={vendor || undefined}
              errorType="404"
              className="mb-2"
            />
            {/* Still show stored price as fallback */}
            {pricePerSpool && (
              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-2xl font-bold text-muted-foreground">
                  {formatPrice(pricePerSpool, false)}
                </span>
                <span className="text-sm text-muted-foreground">/spool</span>
                <span className="text-xs text-muted-foreground ml-2">(last known price)</span>
              </div>
            )}
          </div>
        ) : hasCheckedLivePrice && manualLivePrice?.price ? (
          // Show verified live price after manual check
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground tracking-tight">
                {formattedPricePerKg}
              </span>
              <span className="text-lg text-muted-foreground">/kg</span>
              <div className="flex items-center gap-1 text-emerald-400 ml-2">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Live</span>
              </div>
            </div>
            
            {/* Verified timestamp */}
            <p className="text-xs text-emerald-400/80">
              ✓ verified: just now
            </p>
            
            {/* Savings indicator */}
            {priceSavings !== null && priceSavings > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">
                  ${priceSavings.toFixed(2)} lower than estimated
                  {savingsPercent && savingsPercent >= 10 && (
                    <span className="ml-1 text-xs bg-emerald-500/20 px-1.5 py-0.5 rounded">
                      {savingsPercent}% savings!
                    </span>
                  )}
                </span>
              </div>
            )}
            
            {/* Price higher than estimated warning */}
            {priceSavings !== null && priceSavings < 0 && Math.abs(priceSavings) > 1 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <TrendingDown className="w-4 h-4 text-amber-400 rotate-180" />
                <span className="text-sm text-amber-400">
                  ${Math.abs(priceSavings).toFixed(2)} higher than estimated
                </span>
              </div>
            )}
            
            {/* Compare at price (sale indicator) */}
            {effectiveCompareAtPrice && effectiveCompareAtPrice > (effectiveLivePrice || 0) && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground line-through">
                  {formatLivePrice(effectiveCompareAtPrice)}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  {Math.round((1 - (effectiveLivePrice || 0) / effectiveCompareAtPrice) * 100)}% OFF
                </span>
              </div>
            )}
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
            {isShowingLivePrice && effectiveCompareAtPrice && effectiveCompareAtPrice > (effectiveLivePrice || 0) && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground line-through">
                  {formatLivePrice(effectiveCompareAtPrice)}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  {Math.round((1 - (effectiveLivePrice || 0) / effectiveCompareAtPrice) * 100)}% OFF
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

      {/* Primary CTA - Dynamic based on confidence and live price state */}
      {hasCheckedLivePrice && manualLivePrice ? (
        // After live price verified - show prominent Buy Now
        <Button
          onClick={handleBuyClick}
          disabled={!affiliateUrl || stockStatus === 'out_of_stock'}
          className={cn(
            "w-full h-16 text-xl font-extrabold tracking-wide",
            "bg-gradient-to-r from-emerald-600 to-emerald-500",
            "hover:from-emerald-500 hover:to-emerald-400",
            "shadow-[0_8px_24px_rgba(16,185,129,0.3),inset_0_2px_0_rgba(255,255,255,0.2)]",
            "hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)]",
            "hover:-translate-y-0.5 transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
          )}
        >
          <ShoppingCart className="w-5 h-5 mr-3" />
          Buy Now at {finalRetailerName}
          <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
        </Button>
      ) : needsManualCheck && !hasCheckedLivePrice ? (
        // Low/stale confidence - show Check Current Price button
        <div className="space-y-3">
          <Button
            onClick={handleCheckLivePrice}
            disabled={!productUrl || manualPriceLoading}
            variant="default"
            className={cn(
              "w-full h-16 text-xl font-extrabold tracking-wide",
              "bg-gradient-to-r from-primary to-primary/80",
              "hover:from-primary/90 hover:to-primary/70",
              "shadow-[0_8px_24px_rgba(0,212,212,0.3),inset_0_2px_0_rgba(255,255,255,0.2)]",
              "hover:shadow-[0_12px_32px_rgba(0,212,212,0.4)]",
              "hover:-translate-y-0.5 transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <RefreshCw className="w-5 h-5 mr-3" />
            Check Current Price
          </Button>
          
          {/* Secondary: Go directly to store */}
          <button
            onClick={handleBuyClick}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>or go directly to {finalRetailerName}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        // High/medium confidence - standard Buy Now
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
      )}

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
