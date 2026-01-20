import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface PriceTrend {
  direction: "down" | "up" | "stable";
  percentage: number;
  period: string;
}

interface PriceSectionProps {
  price: number | null | undefined;
  msrp?: number | null;
  trend?: PriceTrend | null;
}

export function PriceSection({ price, msrp, trend }: PriceSectionProps) {
  const { formatPrice } = useCurrency();

  if (!price && !msrp) return null;

  const displayPrice = price || msrp;
  const hasDiscount = price && msrp && price < msrp;
  const discountPercent = hasDiscount ? Math.round((1 - price / msrp) * 100) : 0;

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
      {/* Terminal-style price label */}
      <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
        UNIT_COST:
      </div>
      
      <div className="flex items-baseline gap-4">
        {/* Main price - amber for industrial look */}
        <span className="font-mono text-3xl md:text-4xl font-bold text-amber-400">
          {formatPrice(displayPrice!)}
        </span>
        
        {hasDiscount && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground line-through">
              {formatPrice(msrp)}
            </span>
            <span className="font-mono text-sm font-bold text-green-500">
              -{discountPercent}%
            </span>
          </div>
        )}
        
        {!price && msrp && (
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            // MSRP
          </span>
        )}
      </div>

      {trend && trend.percentage > 0 && (
        <div className={`flex items-center gap-2 font-mono text-xs ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="uppercase tracking-wider">
            TREND: {trend.direction === "down" ? "FALLING" : trend.direction === "up" ? "RISING" : "STABLE"}
            {" "}({trend.percentage}% / {trend.period})
          </span>
        </div>
      )}
    </div>
  );
}
