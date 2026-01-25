import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useCurrency, CurrencyCode } from "@/hooks/useCurrency";
import { PriceFreshnessIndicator } from "@/components/price/PriceFreshnessIndicator";
import { PriceConfidence } from "@/hooks/usePriceFreshness";

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
}: PriceSectionProps) {
  const {
    formatPrice,
    formatRegionalPrice,
    currency: userCurrency
  } = useCurrency();

  // Never show price for discontinued printers
  if (isDiscontinued) return null;
  if (!price && !msrp) return null;
  
  const displayPrice = price || msrp;
  const hasDiscount = price && msrp && price < msrp;
  const discountPercent = hasDiscount ? Math.round((1 - price / msrp) * 100) : 0;

  // Determine if we should skip conversion
  // If priceCurrency matches user's selected currency, the price is already in their currency
  const isAlreadyInUserCurrency = priceCurrency && priceCurrency === userCurrency;

  // Format the price correctly based on whether conversion is needed
  const formatDisplayPrice = (priceValue: number): string => {
    if (isAlreadyInUserCurrency) {
      // Price is already in user's currency, no conversion needed
      return formatRegionalPrice(priceValue);
    }
    // Price is in USD (or unknown), convert to user's currency
    return formatPrice(priceValue);
  };

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
        {/* Price - WHITE for consistency */}
        <span className={`font-bold text-white ${compact ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
          {formatDisplayPrice(displayPrice!)}
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
            {formatDisplayPrice(msrp)}
          </span>
          <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>MSRP</span>
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
