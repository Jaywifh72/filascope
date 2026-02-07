import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useCurrency, CurrencyCode } from "@/hooks/useCurrency";
import { useRegion } from "@/contexts/RegionContext";
import { PriceFreshnessIndicator } from "@/components/price/PriceFreshnessIndicator";
import { PriceConfidence } from "@/hooks/usePriceFreshness";
import { formatCurrencyPrice } from "@/types/regional";
import type { CurrencyCode as RegionalCurrencyCode } from "@/types/regional";

interface PriceTrend {
  direction: "down" | "up" | "stable";
  percentage: number;
  period: string;
}

interface PriceSectionProps {
  price: number | null | undefined;
  msrp?: number | null;
  trend?: PriceTrend | null;
  isDiscontinued?: boolean;
  /** Currency of the price. If matches user's currency, no conversion is applied. If 'USD' or undefined, price is converted. */
  priceCurrency?: CurrencyCode | string | null;
  /** Compact mode for sidebar display */
  compact?: boolean;
  /** Price freshness tracking */
  pricesLastUpdatedAt?: string | null;
  priceSource?: string | null;
  priceConfidence?: PriceConfidence | null;
  /** Whether the price is already in the user's regional currency (from unified pricing) */
  isRegionalPrice?: boolean;
  /** Whether the displayed price is a conversion estimate */
  isConverted?: boolean;
  /** Original price before conversion (shown in parentheses) */
  originalPrice?: number | null;
  /** Original currency code before conversion */
  originalCurrency?: RegionalCurrencyCode | null;
}

export function PriceSection({
  price,
  msrp,
  trend,
  isDiscontinued,
  priceCurrency,
  compact = false,
  pricesLastUpdatedAt,
  priceSource,
  priceConfidence,
  isRegionalPrice = false,
  isConverted = false,
  originalPrice,
  originalCurrency,
}: PriceSectionProps) {
  const {
    formatPrice,
    formatRegionalPrice,
    currency: userCurrency
  } = useCurrency();
  const { formatPrice: formatRegional } = useRegion();

  // Never show price for discontinued printers
  if (isDiscontinued) return null;
  if (!price && !msrp) return null;
  
  const displayPrice = price || msrp;
  const hasDiscount = price && msrp && price < msrp;
  const discountPercent = hasDiscount ? Math.round((1 - price / msrp) * 100) : 0;

  // Format the price correctly based on whether it's already regional
  const formatDisplayPrice = (priceValue: number): string => {
    if (isRegionalPrice) {
      // Price is already in user's regional currency (from unified pricing)
      return formatRegional(priceValue);
    }
    
    // Legacy path: check if priceCurrency matches user's selected currency
    const isAlreadyInUserCurrency = priceCurrency && priceCurrency === userCurrency;
    if (isAlreadyInUserCurrency) {
      return formatRegionalPrice(priceValue);
    }
    // Price is in USD (or unknown), convert to user's currency
    return formatPrice(priceValue);
  };

  // Format original price for conversion note
  // Use formatCurrencyPrice which already includes the currency symbol (e.g., "$399.00")
  // Don't append the currency code again to avoid "($399.00 USD USD)"
  const originalPriceText = isConverted && originalPrice && originalCurrency
    ? `(${formatCurrencyPrice(originalPrice, originalCurrency)})`
    : null;

  const getTrendColor = () => {
    if (!trend) return "text-muted-foreground";
    if (trend.direction === "down") return "text-green-500";
    if (trend.direction === "up") return "text-destructive";
    return "text-muted-foreground";
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === "down") return <TrendingDown className="h-4 w-4" />;
    if (trend.direction === "up") return <TrendingUp className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className={`font-medium text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
        Current Price
      </div>
      
      <div className="flex items-baseline gap-2 flex-wrap">
        {/* Price - with ~ prefix for converted prices */}
        <span className={`font-bold text-white ${compact ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
          {isConverted ? '~' : ''}{formatDisplayPrice(displayPrice!)}
        </span>
        
        {/* Discount Badge - GREEN filled badge */}
        {hasDiscount && (
          <span className="text-xs font-semibold bg-green-500 text-white px-2 py-0.5 rounded-full">
            -{discountPercent}%
          </span>
        )}
        
        {!price && msrp && (
          <span className="text-xs text-gray-400">
            MSRP
          </span>
        )}
      </div>

      {/* Original Price - gray strikethrough */}
      {msrp && price && price !== msrp && (
        <div className="flex items-center gap-2">
          <span className={`text-gray-500 line-through ${compact ? 'text-xs' : 'text-sm'}`}>
            {isConverted ? '~' : ''}{formatDisplayPrice(msrp)}
          </span>
          <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>MSRP</span>
        </div>
      )}

      {/* Conversion source note */}
      {originalPriceText && (
        <div className="text-xs text-muted-foreground">
          {originalPriceText}
        </div>
      )}

      {/* Price Freshness Indicator */}
      <PriceFreshnessIndicator
        lastVerified={pricesLastUpdatedAt}
        confidence={priceConfidence || undefined}
        source={priceSource}
        compact={compact}
        className="mt-2"
      />
    </div>
  );
}
