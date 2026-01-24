import { ShoppingCart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";

interface MobileBottomBarProps {
  price: number | null | undefined;
  msrp?: number | null;
  officialStoreUrl?: string | null;
  getAffiliateUrl: (url: string | null | undefined, vendor?: string | null) => string | null;
  brand: string | null;
  isDiscontinued?: boolean;
  priceCurrency?: string;
  isLivePrice?: boolean;
}

export function MobileBottomBar({
  price,
  msrp,
  officialStoreUrl,
  getAffiliateUrl,
  brand,
  isDiscontinued,
  priceCurrency,
  isLivePrice,
}: MobileBottomBarProps) {
  const { formatPrice, formatRegionalPrice, currency } = useCurrency();
  const { count: compareCount } = usePrinterCompare();

  // Don't show if discontinued or if compare bar is active
  if (isDiscontinued || compareCount > 0) return null;

  // Format price
  const formatDisplayPrice = (p: number | null | undefined) => {
    if (p === null || p === undefined) return null;
    if (isLivePrice && priceCurrency && priceCurrency === currency) {
      return formatRegionalPrice(p);
    }
    return formatPrice(p);
  };

  const formattedPrice = formatDisplayPrice(price);
  const formattedMsrp = msrp && msrp > (price || 0) ? formatDisplayPrice(msrp) : null;
  
  // Calculate discount percentage
  const discountPercent = msrp && price && msrp > price 
    ? Math.round((1 - price / msrp) * 100) 
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
            <div className="flex items-baseline gap-2 flex-wrap">
              {/* Price - WHITE for consistency */}
              <span className="text-xl font-bold text-white">{formattedPrice}</span>
              {formattedMsrp && (
                <>
                  {/* Original Price - gray strikethrough */}
                  <span className="text-sm text-gray-500 line-through">{formattedMsrp}</span>
                  {/* Discount Badge - GREEN filled */}
                  {discountPercent && (
                    <span className="text-xs font-semibold bg-green-500 text-white px-2 py-0.5 rounded-full">
                      -{discountPercent}%
                    </span>
                  )}
                </>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">Price not available</span>
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
