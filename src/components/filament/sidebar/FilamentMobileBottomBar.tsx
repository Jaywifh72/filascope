import { ShoppingCart, Calculator, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";
import { useCompare } from "@/hooks/useCompare";
import { useCurrentPrice } from "@/hooks/useCurrentPrice";
import { PriceConfidence } from "@/hooks/usePriceFreshness";
import { HonestPriceDisplayCompact, getCtaText, shouldUsePrimaryCta } from "@/components/price/HonestPriceDisplay";

interface FilamentMobileBottomBarProps {
  filamentId: string;
  pricePerKg: number | null;
  pricePerSpool: number | null;
  weightGrams: number | null;
  affiliateUrl: string | null;
  productUrl: string | null;
  originalUsUrl?: string;
  hasActualRegionalPrice?: boolean;
  priceCurrency?: string;
  onOpenCalculator?: () => void;
  lastScrapedAt?: string | null;
  priceConfidence?: PriceConfidence | string | null;
}

export function FilamentMobileBottomBar({
  filamentId,
  pricePerKg,
  pricePerSpool,
  weightGrams,
  affiliateUrl,
  productUrl,
  originalUsUrl,
  hasActualRegionalPrice = false,
  priceCurrency,
  onOpenCalculator,
  lastScrapedAt,
  priceConfidence,
}: FilamentMobileBottomBarProps) {
  const { formatPrice, formatRegionalPrice } = useCurrency();
  const { count: compareCount } = useCompare();

  // Fetch live price
  const { 
    currentPrice, 
    compareAtPrice,
    weightGrams: liveWeightGrams,
    isLivePrice,
    currency: livePriceCurrency
  } = useCurrentPrice(productUrl, pricePerSpool, originalUsUrl);

  // Don't show if compare bar is active
  if (compareCount > 0) return null;

  // Calculate display price
  const displayPrice = isLivePrice && currentPrice !== null ? currentPrice : pricePerSpool;
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

  // Format price
  const formatDisplayPrice = (p: number | null | undefined): string | null => {
    if (p === null || p === undefined) return null;
    if (isLivePrice && livePriceCurrency) {
      const symbols: Record<string, string> = { 'USD': '$', 'CAD': 'C$', 'EUR': '€', 'GBP': '£', 'AUD': 'A$', 'JPY': '¥' };
      const symbol = symbols[livePriceCurrency] || '$';
      return `${symbol}${p.toFixed(2)}`;
    }
    if (hasActualRegionalPrice) {
      return formatRegionalPrice(p);
    }
    return formatPrice(p);
  };

  const formattedPrice = formatDisplayPrice(displayPricePerKg);
  
  // Calculate discount
  const discountPercent = isLivePrice && compareAtPrice && currentPrice && compareAtPrice > currentPrice
    ? Math.round((1 - currentPrice / compareAtPrice) * 100)
    : null;

  const handleBuyClick = () => {
    if (!affiliateUrl) return;
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Gradient overlay for better visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background to-transparent -top-4 pointer-events-none" />
      
      {/* Bottom bar content */}
      <div 
        className="relative bg-card border-t border-border/60 px-4 py-3 flex items-center justify-between gap-4"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        {/* Price section - Honest Display */}
        <div className="flex-1 min-w-0">
          <HonestPriceDisplayCompact
            price={displayPricePerKg}
            confidence={priceConfidence as PriceConfidence | undefined}
            lastVerifiedAt={lastScrapedAt}
            storeName="Store"
            isConverted={false}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Calculator button */}
          {onOpenCalculator && (
            <Button 
              size="lg"
              variant="outline"
              onClick={onOpenCalculator}
              className="px-3 border-border/60"
              aria-label="Open print calculator"
            >
              <Calculator className="h-5 w-5" />
            </Button>
          )}
          
          {/* Buy button - dynamic based on confidence */}
          {affiliateUrl ? (
            <Button 
              size="lg" 
              onClick={handleBuyClick}
              variant={shouldUsePrimaryCta(priceConfidence as PriceConfidence) ? 'default' : 'outline'}
              className="gap-2 px-6"
            >
              {shouldUsePrimaryCta(priceConfidence as PriceConfidence) && <ShoppingCart className="h-4 w-4" />}
              <span>{getCtaText(priceConfidence as PriceConfidence, 'Store')}</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Button>
          ) : (
            <Button size="lg" disabled className="gap-2 px-6 opacity-50">
              <ShoppingCart className="h-4 w-4" />
              <span>Unavailable</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
