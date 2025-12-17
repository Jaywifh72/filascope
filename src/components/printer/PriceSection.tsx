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
    if (trend.direction === "up") return "text-red-500";
    return "text-muted-foreground";
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === "down") return <TrendingDown className="h-4 w-4" />;
    if (trend.direction === "up") return <TrendingUp className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl md:text-4xl font-bold text-foreground">
          {formatPrice(displayPrice!)}
        </span>
        {hasDiscount && (
          <span className="text-sm font-medium text-green-500">
            {discountPercent}% off MSRP
          </span>
        )}
        {!price && msrp && (
          <span className="text-sm text-muted-foreground">MSRP</span>
        )}
      </div>

      {trend && trend.percentage > 0 && (
        <div className={`flex items-center gap-1.5 ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="text-sm font-medium">
            {trend.direction === "down" ? "↓" : trend.direction === "up" ? "↑" : ""}
            {" "}{trend.percentage}% from {trend.period}
          </span>
        </div>
      )}
    </div>
  );
}
