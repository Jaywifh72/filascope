import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Calendar, ArrowDown, Minus, Clock, Bell } from 'lucide-react';
import { usePriceHistory, PricePoint } from '@/hooks/usePriceHistory';
import { useRegion } from '@/contexts/RegionContext';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface PriceHistoryChartProps {
  filamentId: string;
  currentPrice: number | null;
  /** @deprecated – currency symbol is now derived from useRegion */
  currencySymbol?: string;
}

type TimeRange = 30 | 90 | 180;

export function PriceHistoryChart({ 
  filamentId, 
  currentPrice,
}: PriceHistoryChartProps) {
  // Default to 6M (180 days) for best historical context
  const [timeRange, setTimeRange] = useState<TimeRange>(180);
  const { convertPrice, currency, hasRates } = useRegion();
  
  const { 
    prices, 
    min, 
    max, 
    avg, 
    isLoading,
    isBestIn30Days,
    isBestIn6Months,
    trendPercent,
    minPoint,
    maxPoint
  } = usePriceHistory(filamentId, currentPrice, timeRange);

  // Convert all USD price history values to user's currency
  const converted = useMemo(() => {
    const conv = (val: number) => {
      if (currency === 'USD' || !hasRates) return val;
      return convertPrice(val, 'USD') ?? val;
    };
    return {
      prices: prices.map(p => ({ ...p, price: conv(p.price) })),
      min: conv(min),
      max: conv(max),
      avg: conv(avg),
      currentPrice: currentPrice != null ? conv(currentPrice) : null,
      minPoint: minPoint ? { ...minPoint, price: conv(minPoint.price) } : null,
      maxPoint: maxPoint ? { ...maxPoint, price: conv(maxPoint.price) } : null,
    };
  }, [prices, min, max, avg, currentPrice, minPoint, maxPoint, currency, hasRates, convertPrice]);

  // Currency symbol map
  const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$', CAD: 'C$', EUR: '€', GBP: '£', AUD: 'A$',
    JPY: '¥', CNY: '¥', KRW: '₩', PLN: 'zł', CZK: 'Kč',
    SEK: 'kr', CHF: 'CHF', INR: '₹', MXN: 'MX$',
  };
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  // Get the most recent scraped price point
  const latestPoint = converted.prices.length > 0 ? converted.prices[converted.prices.length - 1] : null;

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg border border-dashed border-border">
        <div className="text-muted-foreground animate-pulse">Loading price history...</div>
      </div>
    );
  }

  if (!prices || prices.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Price History</h3>
          <p className="text-sm text-muted-foreground">Track price trends over time</p>
        </div>
        <div className="py-10 text-center bg-muted/10 rounded-lg border border-dashed border-border">
          <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-medium text-foreground">No Price History Yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            We'll start tracking prices for this filament soon. Set a price alert to get notified of changes.
          </p>
        </div>
      </div>
    );
  }

  const insufficientData = prices.length < 3;

  // Format price for display — use converted values
  const formatDisplayPrice = (value: number) => `${currencySymbol}${value.toFixed(2)}`;
  
  // Format date for tooltip
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  // Format date for X axis
  const formatAxisDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return dateStr;
    }
  };

  // Calculate domain padding using converted min/max
  const pricePadding = (converted.max - converted.min) * 0.1;
  const yMin = Math.max(0, converted.min - pricePadding);
  const yMax = converted.max + pricePadding;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">
            {formatDate(label)}
          </p>
          <p className="text-lg font-bold text-foreground">
            {formatDisplayPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Trend indicator
  const getTrendInfo = () => {
    if (trendPercent === null) return null;
    if (trendPercent < -5) {
      return { icon: <TrendingDown className="w-4 h-4" />, label: `${trendPercent}%`, color: 'text-emerald-400' };
    } else if (trendPercent > 5) {
      return { icon: <TrendingUp className="w-4 h-4" />, label: `+${trendPercent}%`, color: 'text-red-400' };
    }
    return { icon: <Minus className="w-4 h-4" />, label: 'Stable', color: 'text-muted-foreground' };
  };

  const trendInfo = getTrendInfo();

  // Format date for stats display
  const formatStatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return '';
    }
  };

  // Determine if current price matches lowest
  const isCurrentLowest = converted.currentPrice != null && Math.abs(converted.currentPrice - converted.min) < 0.02;
  // Determine current vs average
  const currentVsAvg = converted.currentPrice != null
    ? converted.currentPrice < converted.avg ? 'below' : converted.currentPrice > converted.avg ? 'above' : 'equal'
    : null;

  // Trend icon for inline display
  const trendInline = (() => {
    if (!trendInfo) return null;
    if (trendPercent !== null && trendPercent < -5) return { symbol: '↓', color: 'text-emerald-400' };
    if (trendPercent !== null && trendPercent > 5) return { symbol: '↑', color: 'text-amber-400' };
    return { symbol: '→', color: 'text-muted-foreground' };
  })();

  const limitedData = prices.length >= 3 && prices.length < 5;

  return (
    <div className="space-y-4">
      {/* Unified header row: title left, toggles right */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Price History</h3>
            <p className="text-xs text-muted-foreground">Track price trends over time</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
            {([30, 90, 180] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant="ghost"
                size="sm"
                onClick={() => setTimeRange(range)}
                className={cn(
                  "h-7 px-3 text-xs rounded-md transition-colors duration-150",
                  timeRange === range 
                    ? "bg-cyan-500 text-black font-semibold hover:bg-cyan-500/90" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {range === 180 ? '6M' : `${range}D`}
              </Button>
            ))}
          </div>
          {trendInline && trendInfo && (
            <span className={cn("text-xs flex items-center gap-1", trendInline.color)}>
              {trendInline.symbol} {trendInfo.label} vs {timeRange}d ago
            </span>
          )}
        </div>
      </div>

      {/* Price Badges */}
      {(isBestIn30Days || isBestIn6Months) && (
        <div className="flex flex-wrap gap-2">
          {isBestIn30Days && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
              <ArrowDown className="w-3 h-3" />
              Best in 30 days
            </Badge>
          )}
          {isBestIn6Months && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
              <TrendingDown className="w-3 h-3" />
              Best in 6 months
            </Badge>
          )}
        </div>
      )}

      {/* Historical low banner */}
      {converted.min > 0 && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-4 py-2 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm text-emerald-400">
            Lowest recorded in {timeRange === 180 ? '6 months' : `${timeRange} days`}:
          </span>
          <span className="font-bold text-emerald-400 ml-auto">{formatDisplayPrice(converted.min)}/kg</span>
        </div>
      )}

      {/* Chart */}
      <div className="border border-border/50 rounded-xl p-4 bg-muted/5">
        {insufficientData ? (
          <div className="h-64 flex items-center justify-center text-center">
            <p className="text-sm text-muted-foreground max-w-xs">
              Price tracking started recently — not enough data for a trend chart yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={converted.prices}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatAxisDate}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis 
                  domain={[yMin, yMax]}
                  tickFormatter={(v) => `${currencySymbol}${v.toFixed(0)}`}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Average line */}
                <ReferenceLine 
                  y={converted.avg} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                
                {/* Current price line */}
                {converted.currentPrice && (
                  <ReferenceLine 
                    y={converted.currentPrice} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="5 5"
                    strokeOpacity={0.7}
                  />
                )}
                
                {/* Price line */}
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ 
                    r: 6, 
                    fill: 'hsl(var(--primary))', 
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2 
                  }}
                />

                {/* Min point marker */}
                {converted.minPoint && (
                  <ReferenceDot
                    x={converted.minPoint.date}
                    y={converted.minPoint.price}
                    r={5}
                    fill="hsl(142 76% 36%)"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                )}
                
                {/* Max point marker */}
                {converted.maxPoint && (
                  <ReferenceDot
                    x={converted.maxPoint.date}
                    y={converted.maxPoint.price}
                    r={5}
                    fill="hsl(0 84% 60%)"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Limited data note */}
      {limitedData && (
        <p className="text-xs text-muted-foreground italic text-center">
          Limited price history available. More data points will improve trend accuracy.
        </p>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center border border-gray-700/50">
          <div className="text-xs text-gray-500 mb-1">Lowest</div>
          <div className="text-lg font-semibold text-green-400">{formatDisplayPrice(converted.min)}</div>
          {isCurrentLowest && (
            <div className="text-xs text-green-400 mt-0.5">← Current</div>
          )}
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center border border-gray-700/50">
          <div className="text-xs text-gray-500 mb-1">Average</div>
          <div className="text-lg font-semibold text-gray-200">{formatDisplayPrice(converted.avg)}</div>
          {currentVsAvg === 'below' && (
            <div className="text-xs text-green-400 mt-0.5">Below avg</div>
          )}
          {currentVsAvg === 'above' && (
            <div className="text-xs text-amber-400 mt-0.5">Above avg</div>
          )}
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center border border-gray-700/50">
          <div className="text-xs text-gray-500 mb-1">Highest</div>
          <div className="text-lg font-semibold text-red-400/70">{formatDisplayPrice(converted.max)}</div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        Prices scraped weekly from store websites. Current store prices may differ.
      </p>
    </div>
  );
}
