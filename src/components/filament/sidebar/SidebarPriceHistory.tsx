import { useMemo } from "react";
import { Clock, TrendingDown } from "lucide-react";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { PriceSparkline } from "@/components/PriceSparkline";
import { useRegion } from "@/contexts/RegionContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarPriceHistoryProps {
  filamentId: string;
  currentPrice: number | null;
  onViewFullHistory?: () => void;
}

export function SidebarPriceHistory({
  filamentId,
  currentPrice,
  onViewFullHistory,
}: SidebarPriceHistoryProps) {
  const { formatPrice } = useRegion();
  const priceData = usePriceHistory(filamentId, currentPrice, 90);

  // Determine which state to render
  const state = useMemo(() => {
    if (priceData.isLoading) return "loading" as const;
    if (priceData.prices.length === 0) return "empty" as const;
    if (priceData.prices.length < 3) return "early" as const;
    return "sparkline" as const;
  }, [priceData.isLoading, priceData.prices.length]);

  // Get the earliest tracking date for "early" state
  const trackingStartDate = useMemo(() => {
    if (priceData.prices.length === 0) return null;
    const earliest = priceData.prices[0]?.date;
    if (!earliest) return null;
    return new Date(earliest).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [priceData.prices]);

  // State C: No data — render nothing
  if (state === "empty" || state === "loading") {
    return null;
  }

  // State B: Early tracking (1-2 data points)
  if (state === "early") {
    return (
      <button
        onClick={onViewFullHistory}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg",
          "bg-muted/30 border border-border/40",
          "text-xs text-muted-foreground",
          "hover:bg-muted/50 hover:border-border/60 transition-colors cursor-pointer",
          "group"
        )}
      >
        <Clock className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/70" />
        <span>
          Price tracking started{" "}
          <span className="font-medium text-foreground/70">{trackingStartDate}</span>
        </span>
      </button>
    );
  }

  // State A: Sparkline (3+ data points)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onViewFullHistory}
          className={cn(
            "w-full rounded-lg border border-border/40 bg-muted/20",
            "hover:bg-muted/40 hover:border-border/60",
            "transition-all duration-200 cursor-pointer",
            "p-3 space-y-2",
            "group"
          )}
        >
          {/* Sparkline Header */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              90-Day Price History
            </span>
            <TrendingDown className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </div>

          {/* Sparkline Chart */}
          <PriceSparkline
            prices={priceData.prices}
            currentPrice={priceData.currentPrice}
            min={priceData.min}
            max={priceData.max}
            minPoint={priceData.minPoint}
            maxPoint={priceData.maxPoint}
            showMinMax={true}
            className="w-full h-[40px]"
          />

          {/* Price Summary */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              Low:{" "}
              <span className="font-medium text-emerald-400">
                {formatPrice(priceData.min)}
              </span>
            </span>
            <span>
              Avg:{" "}
              <span className="font-medium text-foreground/70">
                {formatPrice(priceData.avg)}
              </span>
            </span>
            <span>
              High:{" "}
              <span className="font-medium text-red-400">
                {formatPrice(priceData.max)}
              </span>
            </span>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs">
        View full price history
      </TooltipContent>
    </Tooltip>
  );
}
