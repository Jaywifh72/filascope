import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';
import { calculatePriceInsights, PriceInsight } from '@/lib/priceInsightsCalculator';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  BarChart2,
  Calendar,
  ChevronRight,
  Target,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceInsightsWidgetProps {
  printerId: string;
  currentPrice: number | null;
  currentAmazonPrice?: number | null;
  msrp?: number | null;
  onViewFullHistory: () => void;
}

export function PriceInsightsWidget({
  printerId,
  currentPrice,
  onViewFullHistory,
}: PriceInsightsWidgetProps) {
  const { formatPrice } = useCurrency();

  const { data: priceHistory } = useQuery({
    queryKey: ['printer-price-history', printerId],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from('printer_price_history')
        .select('price, recorded_at')
        .eq('printer_id', printerId)
        .gte('recorded_at', sixMonthsAgo.toISOString())
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((d) => ({
        date: d.recorded_at || '',
        price: Number(d.price),
      }));
    },
    enabled: !!printerId && !!currentPrice,
  });

  if (!currentPrice) return null;

  const insights = calculatePriceInsights(currentPrice, priceHistory || []);
  const { trend, priceRange, historicalLow, trendStatus, dealIndicator } = insights;

  const getTrendIcon = () => {
    if (trend.direction === 'down') return <TrendingDown className="w-[18px] h-[18px]" />;
    if (trend.direction === 'up') return <TrendingUp className="w-[18px] h-[18px]" />;
    return <Minus className="w-[18px] h-[18px]" />;
  };

  const getTrendText = () => {
    if (trend.direction === 'down') return `↓ ${trend.percentage}% lower than ${trend.period} ago`;
    if (trend.direction === 'up') return `↑ ${trend.percentage}% higher than ${trend.period} ago`;
    return `→ Stable price (no change)`;
  };

  const getTrendStatusText = () => {
    if (trendStatus === 'rising') return 'Trending: Rising';
    if (trendStatus === 'falling') return 'Trending: Falling';
    if (trendStatus === 'volatile') return 'Trending: Volatile';
    return 'Trending: Stable';
  };

  const getTrendStatusEmoji = () => {
    if (trendStatus === 'rising') return '📈';
    if (trendStatus === 'falling') return '📉';
    return '📊';
  };

  const isAtHistoricalLow = historicalLow.date === 'Now';

  // Dynamic styling based on trend
  const cardBgClass = cn(
    'w-full max-w-[500px] p-5 mt-4 mb-6 rounded-xl flex flex-col gap-0',
    trend.direction === 'down' && 'bg-green-500/10 border border-green-500/30',
    trend.direction === 'up' && 'bg-red-500/10 border border-red-500/30',
    trend.direction === 'stable' && 'bg-muted/30 border border-border/50'
  );

  const headerColorClass = cn(
    'text-xs font-bold uppercase tracking-wider',
    trend.direction === 'down' && 'text-green-500',
    trend.direction === 'up' && 'text-red-500',
    trend.direction === 'stable' && 'text-muted-foreground'
  );

  const trendTextClass = cn(
    'flex items-center gap-2.5 text-[15px] font-semibold leading-snug',
    trend.direction === 'down' && 'text-green-500',
    trend.direction === 'up' && 'text-red-500',
    trend.direction === 'stable' && 'text-muted-foreground'
  );

  return (
    <div className={cardBgClass}>
      {/* Header */}
      <div className={cn(headerColorClass, 'flex items-center gap-1.5 mb-4')}>
        <span>💰</span>
        <span>PRICE INSIGHTS</span>
      </div>

      {/* Insights Content */}
      <div className="flex flex-col gap-2.5">
        {/* Insight 1: Current Trend */}
        <div className={trendTextClass}>
          {getTrendIcon()}
          <span>{getTrendText()}</span>
        </div>

        {/* Insight 2: Price Range */}
        <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
          <BarChart2 className="w-4 h-4 text-muted-foreground/70 flex-shrink-0" />
          <span>
            Typical range: {formatPrice(priceRange.low)} - {formatPrice(priceRange.high)}
          </span>
        </div>

        {/* Insight 3: Historical Low */}
        <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
          {isAtHistoricalLow ? (
            <>
              <Target className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-green-500 font-semibold">
                At all-time low! ({formatPrice(historicalLow.price)})
              </span>
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 text-muted-foreground/70 flex-shrink-0" />
              <span>
                Lowest: {formatPrice(historicalLow.price)} ({historicalLow.date})
              </span>
            </>
          )}
        </div>

        {/* Insight 4: Trend Status */}
        <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
          <span className="text-base">{getTrendStatusEmoji()}</span>
          <span>{getTrendStatusText()}</span>
        </div>

        {/* Insight 5: Deal Indicator (optional) */}
        {dealIndicator && (
          <div
            className={cn(
              'flex items-center gap-2.5 text-sm font-semibold py-2 px-3 rounded-md mt-1',
              dealIndicator === 'buy' && 'bg-green-500/10 text-green-500',
              dealIndicator === 'wait' && 'bg-muted/50 text-muted-foreground'
            )}
          >
            {dealIndicator === 'buy' ? (
              <>
                <Target className="w-4 h-4 flex-shrink-0" />
                <span>Good time to buy</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>Consider waiting for price drop</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* View Full History Button */}
      <button
        onClick={onViewFullHistory}
        className="flex items-center justify-center gap-1.5 w-full h-9 px-4 mt-4 bg-transparent border border-border/30 rounded-lg text-[13px] font-semibold text-muted-foreground cursor-pointer transition-all hover:bg-primary/10 hover:border-primary/40 hover:text-primary hover:-translate-y-px active:translate-y-0"
      >
        View Full Price History
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
