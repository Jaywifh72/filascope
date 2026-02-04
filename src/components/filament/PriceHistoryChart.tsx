import React, { useState } from 'react';
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
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface PriceHistoryChartProps {
  filamentId: string;
  currentPrice: number | null;
  currencySymbol?: string;
}

type TimeRange = 30 | 90 | 180;

export function PriceHistoryChart({ 
  filamentId, 
  currentPrice,
  currencySymbol = '$'
}: PriceHistoryChartProps) {
  // Default to 6M (180 days) for best historical context
  const [timeRange, setTimeRange] = useState<TimeRange>(180);
  
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

  // Get the most recent scraped price point
  const latestPoint = prices.length > 0 ? prices[prices.length - 1] : null;

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
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-foreground">Price History</h3>
          <p className="text-sm text-muted-foreground">Track price trends over time</p>
        </div>
        
        {/* Empty state */}
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

  // Format price for display
  const formatPrice = (value: number) => `${currencySymbol}${value.toFixed(2)}`;
  
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

  // Calculate domain padding
  const pricePadding = (max - min) * 0.1;
  const yMin = Math.max(0, min - pricePadding);
  const yMax = max + pricePadding;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">
            {formatDate(label)}
          </p>
          <p className="text-lg font-bold text-foreground">
            {formatPrice(payload[0].value)}
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Price History</h3>
        <p className="text-sm text-muted-foreground">Historical prices from our periodic scrapes</p>
      </div>

      {/* Time Range Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Time Range</span>
        </div>
        <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
          {([30, 90, 180] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant="ghost"
              size="sm"
              onClick={() => setTimeRange(range)}
              className={cn(
                "h-7 px-3 text-xs transition-colors",
                timeRange === range 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "hover:bg-muted/50"
              )}
            >
              {range === 180 ? '6M' : `${range}D`}
            </Button>
          ))}
        </div>
      </div>

      {/* Price Badges */}
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
        {trendInfo && (
          <Badge variant="outline" className={cn("gap-1", trendInfo.color)}>
            {trendInfo.icon}
            {trendInfo.label} vs {timeRange}d ago
          </Badge>
        )}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={prices}
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
              y={avg} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
            
            {/* Current price line */}
            {currentPrice && (
              <ReferenceLine 
                y={currentPrice} 
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
            {minPoint && (
              <ReferenceDot
                x={minPoint.date}
                y={minPoint.price}
                r={5}
                fill="hsl(142 76% 36%)"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            )}
            
            {/* Max point marker */}
            {maxPoint && (
              <ReferenceDot
                x={maxPoint.date}
                y={maxPoint.price}
                r={5}
                fill="hsl(0 84% 60%)"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="text-center p-3 bg-muted/20 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Lowest</div>
          <div className="text-sm font-semibold text-emerald-400">{formatPrice(min)}</div>
          {minPoint && (
            <div className="text-xs text-muted-foreground mt-0.5">{formatStatDate(minPoint.date)}</div>
          )}
        </div>
        <div className="text-center p-3 bg-muted/20 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Average</div>
          <div className="text-sm font-semibold">{formatPrice(avg)}</div>
        </div>
        <div className="text-center p-3 bg-muted/20 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Current</div>
          <div className="text-sm font-semibold">{latestPoint ? formatPrice(latestPoint.price) : formatPrice(currentPrice || 0)}</div>
          {latestPoint && (
            <div className="text-xs text-muted-foreground mt-0.5">{formatStatDate(latestPoint.date)}</div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        Prices scraped weekly from store websites. Current store prices may differ.
      </p>
    </div>
  );
}
