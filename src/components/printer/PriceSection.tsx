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
}

export function PriceSection({
  price,
  msrp,
  trend,
  isDiscontinued,
  priceCurrency
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
    <div className="space-y-3">
      <div className="text-sm font-medium text-muted-foreground">
        Current Price
      </div>
      
      <div className="flex items-baseline gap-4">
        {/* Main price - amber for industrial look */}
        <span className="font-mono text-3xl md:text-4xl font-bold text-amber-400 inline-flex items-center gap-3">
          {formatDisplayPrice(displayPrice!)}
          {hasDiscount && (
            <span className="text-base font-medium text-emerald-400">
              -{discountPercent}%
            </span>
          )}
        </span>
        
        {!price && msrp && (
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            // MSRP
          </span>
        )}
      </div>

      {msrp && price && price !== msrp && (
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="uppercase tracking-wider">
            MSRP: {formatDisplayPrice(msrp)}
          </span>
        </div>
      )}
    </div>
  );
}
