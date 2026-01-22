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
  isDiscontinued?: boolean;
}
export function PriceSection({
  price,
  msrp,
  trend,
  isDiscontinued
}: PriceSectionProps) {
  const {
    formatPrice
  } = useCurrency();

  // Never show price for discontinued printers
  if (isDiscontinued) return null;
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
  return <div className="space-y-3">
      <div className="text-sm font-medium text-muted-foreground">
        Current Price
      </div>
      
      <div className="flex items-baseline gap-4">
        {/* Main price - amber for industrial look */}
        <span className="font-mono text-3xl md:text-4xl font-bold text-amber-400">
          {formatPrice(displayPrice!)}
        </span>
        
        {hasDiscount}
        
        {!price && msrp && <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            // MSRP
          </span>}
      </div>

      {msrp && price && price !== msrp && (
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="uppercase tracking-wider">
            MSRP: {formatPrice(msrp)}
          </span>
        </div>
      )}
    </div>;
}