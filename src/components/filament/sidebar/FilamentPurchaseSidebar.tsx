import React, { useState, useCallback } from 'react';
import { 
  ShoppingCart, 
  ExternalLink, 
  ChevronRight,
  RefreshCw,
  Globe,
  Calculator,
  GitCompare,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MaterialBadge } from '@/components/MaterialBadge';
import { useConversionTracking } from '@/hooks/useConversionTracking';
import { invalidatePriceCache } from '@/hooks/useCurrentPrice';
import { cn } from '@/lib/utils';
import { PriceUrgencyBadge } from '../urgency/PriceUrgencyBadge';
import { useCompare } from '@/hooks/useCompare';
import { useRegion } from '@/contexts/RegionContext';
import { REGIONS } from '@/config/regions';
import { RegionalPriceResult, CurrencyCode, RegionCode } from '@/types/regional';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { PriceConfidence } from '@/hooks/usePriceFreshness';
import { HonestPriceDisplay, getCtaText } from '@/components/price/HonestPriceDisplay';
import type { StorePrice } from '@/hooks/useFilamentStorePricing';
import { StorePricingDisplay } from './StorePricingDisplay';
import { SidebarPriceHistory } from './SidebarPriceHistory';
import { PriceAlertPopover } from './PriceAlertPopover';
import { PrivateNotePopover } from '@/components/notes/PrivateNotePopover';
import { PrivateNoteIndicator } from '@/components/notes/PrivateNoteIndicator';
import { MarkPurchasedButton } from '@/components/purchases/MarkPurchasedDialog';
import { PurchaseBuyToast } from '@/components/purchases/PurchaseBuyToast';
import { AddToProjectButton } from '@/components/projects/AddToProjectButton';
import { CheaperAlternativeCallout } from '@/components/filament/CheaperAlternativeCallout';

interface FilamentPurchaseSidebarProps {
  filamentId: string;
  vendor: string | null;
  material: string | null;
  productTitle?: string | null; // Product name for search fallback on 404
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
  // NEW: Regional price result from parent (the inner priceResult from useRegionalPricing)
  regionalPriceResult?: RegionalPriceResult | null;
  // Price freshness tracking
  lastScrapedAt?: string | null;
  priceSource?: string | null;
  priceConfidence?: PriceConfidence | null;
  // Callback to refetch filament data after admin price refresh
  onAdminRefresh?: () => void;
  // NEW: Store-based pricing from filament_prices table
  storePricing?: StorePrice | null;
  // Flag to indicate if using store pricing vs legacy fallback
  hasStorePricing?: boolean;
  // Callback to scroll to pricing tab and show full price history
  onViewPriceHistory?: () => void;
  // Per-spool price and store name from the best (cheapest) retailer
  bestSpoolPrice?: number | null;
  bestSpoolStoreName?: string | null;
  bestSpoolIsConverted?: boolean;
}

export function FilamentPurchaseSidebar({
  filamentId,
  vendor,
  material,
  productTitle,
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
  regionalPriceResult,
  lastScrapedAt,
  priceSource,
  priceConfidence,
  onAdminRefresh,
  storePricing,
  hasStorePricing = false,
  onViewPriceHistory,
  bestSpoolPrice,
  bestSpoolStoreName,
  bestSpoolIsConverted = false,
}: FilamentPurchaseSidebarProps) {
  const { formatPrice, currency } = useRegion();
  const { trackStoreClick } = useConversionTracking();
  const { addItem, removeItem, isInCompare } = useCompare();

  // Determine the primary retailer name
  const displayRetailer = retailerName || vendor || 'Store';
  
  /** Strip trailing region codes (US, UK, EU, etc.) from store names to avoid
   *  redundancy like "Amazon US" when a region badge is already shown */
  const cleanName = (name: string) => name.replace(/\s+(US|UK|EU|CA|AU|JP|CN|DE)$/i, '').trim();
  
  // Check if this is actually an Amazon link (must contain amazon domain)
  const isAmazon = affiliateUrl?.toLowerCase().includes('amazon.com') || 
                   affiliateUrl?.toLowerCase().includes('amazon.co.') ||
                   affiliateUrl?.toLowerCase().includes('amazon.de') ||
                   affiliateUrl?.toLowerCase().includes('amzn.');
  const finalRetailerName = isAmazon ? 'Amazon' : `${cleanName(displayRetailer)} Store`;

  const isComparing = isInCompare(filamentId);
  
  // State to force re-fetch after admin refresh
  const [priceRefreshKey, setPriceRefreshKey] = useState(0);
  // Track buy-click for purchase toast
  const [buyClicked, setBuyClicked] = useState(false);

  const handleBuyClick = () => {
    if (!affiliateUrl) return;
    
    trackStoreClick({
      moduleName: 'sidebar_purchase',
      entityId: filamentId,
      entityType: 'filament',
    });
    
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    setBuyClicked(true);
  };
  
  // Handler for admin price refresh - invalidates cache and triggers re-fetch
  const handleAdminRefresh = useCallback(() => {
    console.log('[Sidebar] Admin refresh triggered, invalidating caches...');
    if (productUrl) {
      invalidatePriceCache(productUrl);
    }
    if (originalUsUrl) {
      invalidatePriceCache(originalUsUrl);
    }
    // Force a re-render by incrementing key
    setPriceRefreshKey(prev => prev + 1);
    // Call parent callback to refetch filament data from database
    console.log('[Sidebar] Calling parent onAdminRefresh callback');
    onAdminRefresh?.();
  }, [productUrl, originalUsUrl, onAdminRefresh]);

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

  // === UNIFIED PRICING: Trust parent-provided values directly ===
  // The parent (FilamentDetail) uses useFilamentDetailPricing to compute the
  // canonical best price. The sidebar is a "dumb display" — no recalculation.
  const hasValidRegionalPrice = regionalPriceResult && regionalPriceResult.displayPrice !== null && regionalPriceResult.displayPrice > 0;
  
  const displayPrice = hasValidRegionalPrice 
    ? regionalPriceResult.displayPrice 
    : pricePerSpool;
  
  // Track if we're using a converted price (from regional pricing)
  const isConvertedPrice = hasValidRegionalPrice 
    ? regionalPriceResult.isConverted 
    : false;
  
  // Use the parent-provided pricePerKg directly — NO independent recalculation.
  // This ensures the sidebar always agrees with the sticky bar, mobile bar,
  // and BestPricesSection because they all receive from the same SSOT hook.
  const displayPricePerKg: number | null = pricePerKg;

  // Format price with approximate indicator for converted prices
  const formattedPricePerKg = displayPricePerKg 
    ? formatPrice(displayPricePerKg, { showApproximate: isConvertedPrice })
    : null;

  // Store region info for display

  // Store region info for display
  const storeRegionCode = regionalPriceResult?.store?.regionCode;
  const storeRegionFlag = storeRegionCode ? REGIONS[storeRegionCode]?.flag : null;
  
  // Determine if this is a local store based on user's region matching store region
  const { region: userRegion } = useRegion();
  const isLocalStore = storeRegionCode === userRegion;

  return (
    <TooltipProvider>
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

          {/* Price Section - Honest Display */}
          <div className="space-y-3">
            {/* Price + Alert Bell */}
            <div className="flex items-start gap-1">
              <div className="flex-1">
                {/* Honest Price Display with confidence-aware messaging */}
                <HonestPriceDisplay
                  price={displayPricePerKg}
                  confidence={priceConfidence}
                  lastVerifiedAt={lastScrapedAt}
                  storeName={regionalPriceResult?.store?.name || finalRetailerName}
                  storeUrl={affiliateUrl}
                  isConverted={isConvertedPrice}
                  conversionTooltip={
                    isConvertedPrice && hasValidRegionalPrice && regionalPriceResult
                      ? `Converted from ${regionalPriceResult.originalCurrency}${regionalPriceResult.conversionRate ? ` (Rate: 1 ${regionalPriceResult.originalCurrency} = ${regionalPriceResult.conversionRate.toFixed(4)} ${currency})` : ''}`
                      : null
                  }
                  size="lg"
                  showCTA={false}
                  showPerKg={true}
                  filamentId={filamentId}
                  productUrl={affiliateUrl || productUrl || undefined}
                  onAdminRefresh={handleAdminRefresh}
                  netWeightGrams={weightGrams}
                />
              </div>
              {displayPricePerKg && (
                <div className="pt-1">
                  <PriceAlertPopover
                    filamentId={filamentId}
                    currentPricePerKg={displayPricePerKg}
                    productTitle={productTitle}
                    isConverted={isConvertedPrice}
                  />
                </div>
              )}
            </div>

            {/* Per-spool price secondary line — connects /kg price to actual purchase price */}
            {bestSpoolPrice != null && bestSpoolStoreName && (
              <div className="text-xs text-muted-foreground px-1">
                {formatPrice(bestSpoolPrice, { showApproximate: bestSpoolIsConverted })}/spool at {cleanName(bestSpoolStoreName)}
              </div>
            )}

            {/* Fallback region warning - show when price is from a different region */}
            {!isLocalStore && storeRegionCode && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2 py-1.5 rounded-md">
                <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {storeRegionFlag} {REGIONS[storeRegionCode]?.name || storeRegionCode} store
                  </span>
                  {regionalPriceResult?.store?.shipsFrom && (
                    <span className="text-amber-400/80">
                      Ships from {regionalPriceResult.store.shipsFrom}
                    </span>
                  )}
                  <span className="text-amber-400/60 text-[10px]">
                    International shipping • Duties may apply
                  </span>
                </div>
              </div>
            )}

            {/* Price Urgency Badge */}
            {(displayPricePerKg || displayPrice) && priceConfidence !== 'stale' && priceConfidence !== 'unknown' && (
              <PriceUrgencyBadge
                filamentId={filamentId}
                currentPrice={displayPricePerKg || displayPrice}
                size="small"
              />
            )}

            {/* Price History Sparkline */}
            <SidebarPriceHistory
              filamentId={filamentId}
              currentPrice={displayPricePerKg || displayPrice || null}
              onViewFullHistory={onViewPriceHistory}
            />
          </div>


          {/* Primary CTA - Always "Buy at [Store]" */}
          <Button
            onClick={handleBuyClick}
            disabled={!affiliateUrl}
            variant="default"
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
            {getCtaText(cleanName(regionalPriceResult?.store?.name || finalRetailerName))}
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

          {/* Add to Project */}
          <AddToProjectButton
            filamentId={filamentId}
            productTitle={productTitle || 'Filament'}
          />

          {/* Mark as Purchased */}
          <MarkPurchasedButton
            productId={filamentId}
            productType="filament"
            productName={productTitle || 'Filament'}
            currentPrice={displayPrice}
            storeName={cleanName(regionalPriceResult?.store?.name || finalRetailerName)}
          />

          {/* Private Note Button */}
          <PrivateNotePopover
            productId={filamentId}
            productType="filament"
            productTitle={productTitle}
          />

          {/* Private Note Indicator (shows existing note) */}
          <PrivateNoteIndicator
            productId={filamentId}
            productType="filament"
            productTitle={productTitle || undefined}
          />

          {/* Store Region Badge */}
          {storeRegionCode && (
            <div className="flex items-center justify-center">
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                isLocalStore 
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-muted/50 border border-border/60 text-muted-foreground"
              )}>
                <span className="text-base">{storeRegionFlag}</span>
                <span>{REGIONS[storeRegionCode]?.name || storeRegionCode} Store</span>
                {isLocalStore && (
                  <span className="text-xs bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">
                    Local
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Retailer Info */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Best Price:</span>
            <span className="font-bold text-foreground/80">
              {cleanName(regionalPriceResult?.store?.name || finalRetailerName)}
            </span>
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

          {/* Similar But Cheaper callout */}
          <CheaperAlternativeCallout
            filamentId={filamentId}
            material={material}
            vendor={vendor}
            currentPricePerKg={displayPricePerKg}
          />

          {/* Disclaimer */}
          <div className="pt-4 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Prices shown are from our database and may not reflect current store prices. 
              Click "Buy" to verify the latest price.
            </p>
          </div>
        </div>
      </aside>

      {/* Purchase toast after clicking buy */}
      <PurchaseBuyToast
        productId={filamentId}
        productType="filament"
        productName={productTitle || 'Filament'}
        currentPrice={displayPrice}
        storeName={regionalPriceResult?.store?.name || finalRetailerName}
        triggered={buyClicked}
        onDismiss={() => setBuyClicked(false)}
      />
    </TooltipProvider>
  );
}
