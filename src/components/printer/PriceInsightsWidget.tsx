import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';
import { calculatePriceInsights } from '@/lib/priceInsightsCalculator';
import {
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subMonths, subYears } from 'date-fns';

interface PriceInsightsWidgetProps {
  printerId: string;
  currentPrice: number | null;
  currentAmazonPrice?: number | null;
  msrp?: number | null;
  onViewFullHistory: () => void;
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'All';

export function PriceInsightsWidget({
  printerId,
  currentPrice,
  onViewFullHistory,
}: PriceInsightsWidgetProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('6M');
  const { formatPrice, currency } = useCurrency();

  const { data: priceHistory, isLoading } = useQuery({
    queryKey: ['printer-price-history-full', printerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printer_price_history')
        .select('price, recorded_at')
        .eq('printer_id', printerId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      return (data || []).map((d) => ({
        date: d.recorded_at || '',
        price: Number(d.price),
      }));
    },
    enabled: !!printerId && !!currentPrice,
  });

  // Filter data based on time range - MUST be before any conditional returns
  const chartData = useMemo(() => {
    if (!priceHistory) return [];

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '1M':
        startDate = subMonths(now, 1);
        break;
      case '3M':
        startDate = subMonths(now, 3);
        break;
      case '6M':
        startDate = subMonths(now, 6);
        break;
      case '1Y':
        startDate = subYears(now, 1);
        break;
      case 'All':
      default:
        return priceHistory.map((d) => ({
          ...d,
          formattedDate: format(new Date(d.date), 'MMM d'),
        }));
    }

    return priceHistory
      .filter((d) => new Date(d.date) >= startDate)
      .map((d) => ({
        ...d,
        formattedDate: format(new Date(d.date), 'MMM d'),
      }));
  }, [priceHistory, timeRange]);

  // Early return AFTER all hooks have been called
  if (!currentPrice) return null;

  const insights = calculatePriceInsights(currentPrice, priceHistory || []);
  const { trend, priceRange, historicalLow } = insights;

  const minPrice = chartData.length > 0 ? Math.min(...chartData.map((d) => d.price)) : 0;
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map((d) => d.price)) : 0;

  const getTrendIcon = () => {
    if (trend.direction === 'down') return <TrendingDown className="w-4 h-4" />;
    if (trend.direction === 'up') return <TrendingUp className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendText = () => {
    if (trend.direction === 'down') return `${trend.percentage}% BELOW_AVG`;
    if (trend.direction === 'up') return `${trend.percentage}% ABOVE_AVG`;
    return 'STABLE';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0A0C10] border border-primary/30 px-3 py-2 font-mono">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-sm font-bold text-primary">
            {formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Dynamic styling based on trend
  const trendColorClass = cn(
    trend.direction === 'down' && 'text-green-400',
    trend.direction === 'up' && 'text-red-400',
    trend.direction === 'stable' && 'text-muted-foreground'
  );

  return (
    <div className="relative w-full max-w-[600px] bg-[#0A0C10] border border-primary/20 p-5 mt-4 mb-6">
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary/50" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/50" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary/50" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary/50" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-[11px] text-primary uppercase tracking-[0.15em]">
          {">> "}PRICE_HISTORY
        </div>
        <div className={cn('font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5', trendColorClass)}>
          {getTrendIcon()}
          <span>{getTrendText()}</span>
        </div>
      </div>

      {/* Time Range Selector - Terminal Style */}
      <div className="flex gap-1.5 mb-4">
        {(['1M', '3M', '6M', '1Y', 'All'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={cn(
              'font-mono px-3 py-1.5 text-[10px] uppercase tracking-wider transition-all border',
              timeRange === range
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-transparent border-white/10 text-muted-foreground hover:border-primary/30 hover:text-primary'
            )}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="w-full h-[200px] bg-white/[0.02] border border-white/5">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
            LOADING_DATA...
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
            NO_DATA_AVAILABLE
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="formattedDate"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                fontFamily="monospace"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
                domain={[minPrice * 0.95, maxPrice * 1.05]}
                fontFamily="monospace"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats Row - Terminal Style */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/[0.02] border border-white/5 px-3 py-2">
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">LOW</div>
            <div className="font-mono text-sm font-bold text-green-400">{formatPrice(minPrice)}</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 px-3 py-2">
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">HIGH</div>
            <div className="font-mono text-sm font-bold text-red-400">{formatPrice(maxPrice)}</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 px-3 py-2">
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">RANGE</div>
            <div className="font-mono text-sm font-bold text-primary">{formatPrice(priceRange.high - priceRange.low)}</div>
          </div>
        </div>
      )}

      {/* Historical Low Indicator */}
      {historicalLow.date === 'Now' && (
        <div className="mt-3 font-mono text-[10px] text-green-400 uppercase tracking-wider flex items-center gap-1.5 px-2 py-1.5 bg-green-500/10 border border-green-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          STATUS: AT_HISTORICAL_LOW
        </div>
      )}
    </div>
  );
}
