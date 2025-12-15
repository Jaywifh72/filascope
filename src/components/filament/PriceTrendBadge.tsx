import { TrendingDown, TrendingUp, Trophy, Sparkles } from "lucide-react";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { PriceSparkline } from "@/components/PriceSparkline";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

interface PriceTrendBadgeProps {
  filamentId: string;
  currentPrice: number | null;
}

export function PriceTrendBadge({ filamentId, currentPrice }: PriceTrendBadgeProps) {
  const priceHistory = usePriceHistory(filamentId, currentPrice, 90);
  const { formatPrice } = useCurrency();
  
  if (priceHistory.isLoading || priceHistory.prices.length < 2 || !currentPrice) {
    return null;
  }
  
  const { trendPercent, avg, isBestIn30Days, isBestIn6Months, prices, min, max, minPoint, maxPoint } = priceHistory;
  const percentFromAvg = avg > 0 ? ((currentPrice - avg) / avg) * 100 : 0;
  const isBelowAvg = percentFromAvg < -2;
  const isAboveAvg = percentFromAvg > 2;
  
  return (
    <div className="space-y-3">
      {/* Price trend indicator */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {isBelowAvg ? (
            <TrendingDown className="h-4 w-4 text-emerald-500" />
          ) : isAboveAvg ? (
            <TrendingUp className="h-4 w-4 text-amber-500" />
          ) : null}
          
          <span className={cn(
            "text-sm font-medium",
            isBelowAvg && "text-emerald-500",
            isAboveAvg && "text-amber-500",
            !isBelowAvg && !isAboveAvg && "text-muted-foreground"
          )}>
            {isBelowAvg 
              ? `${Math.abs(Math.round(percentFromAvg))}% below avg`
              : isAboveAvg 
                ? `${Math.round(percentFromAvg)}% above avg`
                : 'At average price'
            }
          </span>
          
          <span className="text-xs text-muted-foreground">
            (avg {formatPrice(avg)})
          </span>
        </div>
        
        {/* Badges */}
        <div className="flex items-center gap-2">
          {isBestIn6Months && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-medium">
              <Trophy className="h-3 w-3" />
              <span>Lowest in 6mo</span>
            </div>
          )}
          {isBestIn30Days && !isBestIn6Months && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              <span>Best in 30d</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Sparkline */}
      <div className="h-10 w-full">
        <PriceSparkline
          prices={prices}
          currentPrice={currentPrice}
          min={min}
          max={max}
          minPoint={minPoint}
          maxPoint={maxPoint}
          showMinMax
          className="w-full h-full"
        />
      </div>
      
      {/* Trend prediction */}
      {trendPercent !== null && Math.abs(trendPercent) > 5 && (
        <p className="text-xs text-muted-foreground">
          {trendPercent > 5 
            ? '📈 Price trending up — consider buying soon'
            : '📉 Price has been dropping — good time to buy'
          }
        </p>
      )}
    </div>
  );
}
