import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subMonths, subDays, subYears } from 'date-fns';
import { cn } from '@/lib/utils';

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  printerName: string;
  printerId: string;
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'All';

export function PriceHistoryModal({
  isOpen,
  onClose,
  printerName,
  printerId,
}: PriceHistoryModalProps) {
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
    enabled: isOpen && !!printerId,
  });

  const getFilteredData = () => {
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
  };

  const chartData = getFilteredData();

  const minPrice = chartData.length > 0 ? Math.min(...chartData.map((d) => d.price)) : 0;
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map((d) => d.price)) : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">
            {formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] w-[95vw] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Price History: {printerName}
          </DialogTitle>
        </DialogHeader>

        {/* Time Range Selector */}
        <div className="flex gap-2 flex-wrap">
          {(['1M', '3M', '6M', '1Y', 'All'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-semibold transition-all',
                timeRange === range
                  ? 'bg-primary/20 border border-primary/50 text-primary'
                  : 'bg-muted/30 border border-border/50 text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary'
              )}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Graph Container */}
        <div className="w-full h-[350px] md:h-[400px] bg-muted/10 border border-border/30 rounded-xl p-4 md:p-5">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Loading price history...
            </div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No price history available for this time range
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="formattedDate"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                  domain={[minPrice * 0.95, maxPrice * 1.05]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Price Stats */}
        {chartData.length > 0 && (
          <div className="flex gap-4 flex-wrap">
            <div className="bg-muted/20 border border-border/30 rounded-lg px-4 py-3 flex-1 min-w-[120px]">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Lowest</div>
              <div className="text-lg font-bold text-green-500">{formatPrice(minPrice)}</div>
            </div>
            <div className="bg-muted/20 border border-border/30 rounded-lg px-4 py-3 flex-1 min-w-[120px]">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Highest</div>
              <div className="text-lg font-bold text-red-500">{formatPrice(maxPrice)}</div>
            </div>
            <div className="bg-muted/20 border border-border/30 rounded-lg px-4 py-3 flex-1 min-w-[120px]">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Data Points</div>
              <div className="text-lg font-bold text-foreground">{chartData.length}</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
