import { ShoppingCart, ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import { useRegion } from "@/contexts/RegionContext";
import type { CurrencyCode } from "@/types/regional";

interface MobileBottomBarProps {
  /** Regional display price (already converted if needed) */
  price: number | null | undefined;
  msrp?: number | null;
  officialStoreUrl?: string | null;
  getAffiliateUrl: (url: string | null | undefined, vendor?: string | null) => string | null;
  brand: string | null;
  isDiscontinued?: boolean;
  /** Whether the displayed price is a conversion estimate */
  isConverted?: boolean;
  /** Original price before conversion (shown in parentheses) */
  originalPrice?: number | null;
  /** Original currency code before conversion */
  originalCurrency?: CurrencyCode | null;
  isLocalStore?: boolean;
  storeRegion?: string | null;
  shipsFromCountry?: string | null;
}

export function MobileBottomBar({
  price,
  msrp,
  officialStoreUrl,
  getAffiliateUrl,
  brand,
  isDiscontinued,
  isConverted = false,
  originalPrice,
  originalCurrency,
  isLocalStore,
  storeRegion,
  shipsFromCountry,
}: MobileBottomBarProps) {
  const { formatPrice } = useCurrency();
  const { formatPrice: formatRegional, currency } = useRegion();
  const { count: compareCount } = usePrinterCompare();

  // Don't show if discontinued or if compare bar is active
  if (isDiscontinued || compareCount > 0) return null;

  // Format price using regional formatter
  const formattedPrice = price != null ? formatRegional(price) : null;
  const formattedMsrp = msrp && msrp > (price || 0) ? formatRegional(msrp) : null;
  
  // Calculate discount percentage
  const discountPercent = msrp && price && msrp > price 
    ? Math.round((1 - price / msrp) * 100) 
    : null;

  // Format original price for conversion note
  // formatPrice from useCurrency already includes symbol + currency code (e.g., "$399.00 USD")
  // Don't append originalCurrency again to avoid "($399.00 USD USD)"
  const originalPriceText = isConverted && originalPrice && originalCurrency
    ? `(${formatPrice(originalPrice, false)} ${originalCurrency})`
    : null;

  const affiliateUrl = getAffiliateUrl(officialStoreUrl, brand);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Gradient overlay for better visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background to-transparent -top-4 pointer-events-none" />
      
      {/* Bottom bar content */}
      <div 
        className="relative bg-card border-t border-border/60 px-4 py-3 flex items-center justify-between gap-4"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        {/* Price section */}
        <div className="flex-1 min-w-0">
          {formattedPrice ? (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                {/* Price with ~ prefix for converted prices */}
                <span className="text-xl font-bold text-foreground">
                  {isConverted ? '~' : ''}{formattedPrice}
                </span>
                {formattedMsrp && (
                  <>
                    {/* Original Price - strikethrough */}
                    <span className="text-sm text-muted-foreground line-through">{isConverted ? '~' : ''}{formattedMsrp}</span>
                    {/* Discount Badge */}
                    {discountPercent && (
                      <span className="text-xs font-semibold bg-emerald-500 text-emerald-50 px-2 py-0.5 rounded-full">
                        -{discountPercent}%
                      </span>
                    )}
                  </>
                )}
              </div>
              {/* Conversion source note */}
              {originalPriceText && (
                <span className="text-xs text-muted-foreground">
                  {originalPriceText}
                </span>
              )}
              {/* Fallback region indicator */}
              {!isLocalStore && shipsFromCountry && (
                <div className="flex items-center gap-1 text-xs text-amber-400 mt-0.5">
                  <Globe className="w-3 h-3" />
                  <span>Ships from {shipsFromCountry}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Price not available</span>
          )}
        </div>

        {/* Buy button */}
        {affiliateUrl ? (
          <a 
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <Button size="lg" className="gap-2 px-6">
              <ShoppingCart className="h-4 w-4" />
              <span>Buy Now</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Button>
          </a>
        ) : (
          <Button size="lg" disabled className="gap-2 px-6 opacity-50">
            <ShoppingCart className="h-4 w-4" />
            <span>Unavailable</span>
          </Button>
        )}
      </div>
    </div>
  );
}