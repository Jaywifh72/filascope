import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useCurrency, CurrencyCode } from "@/hooks/useCurrency";

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
}

export function PriceSection({
  price,
  msrp,
  trend,
  isDiscontinued,
  priceCurrency,
  compact = false
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
      <div className={`font-medium text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
        Current Price
      </div>
      
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`font-bold text-foreground inline-flex items-center gap-2 ${compact ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
          {formatDisplayPrice(displayPrice!)}
          {hasDiscount && (
            <span className={`font-semibold text-emerald-500 ${compact ? 'text-sm' : 'text-base'}`}>
              -{discountPercent}%
            </span>
          )}
        </span>
        
        {!price && msrp && (
          <span className="text-xs text-muted-foreground">
            MSRP
          </span>
        )}
      </div>

      {msrp && price && price !== msrp && (
        <div className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
          <span className="line-through">{formatDisplayPrice(msrp)}</span>
          <span className="ml-2">MSRP</span>
        </div>
      )}
    </div>
  );
}
