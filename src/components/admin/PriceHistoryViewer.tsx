import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subMonths, subDays, subYears } from 'date-fns';
import { Search, TrendingUp, TrendingDown, Download, History, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimeRange = '30d' | '90d' | '6m' | '1y' | 'all';

interface PriceHistoryViewerProps {
  productId?: string;
  productName?: string;
  onClose?: () => void;
  isModal?: boolean;
}

interface PriceRecord {
  recorded_at: string;
  price: number;
  source: string | null;
  notes: string | null;
  currency: string | null;
}

export function PriceHistoryViewer({
  productId: initialProductId,
  productName: initialProductName,
  onClose,
  isModal = false,
}: PriceHistoryViewerProps) {
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(initialProductId || '');
  const [selectedProductName, setSelectedProductName] = useState(initialProductName || '');
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');

  // Search products
  const { data: searchResults } = useQuery({
    queryKey: ['price-history-search', search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, variant_price')
        .or(`product_title.ilike.%${search}%,vendor.ilike.%${search}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !initialProductId && search.length >= 2,
  });

  // Fetch price history
  const { data: priceHistory, isLoading: historyLoading } = useQuery<PriceRecord[]>({
    queryKey: ['price-history-detail', selectedProductId, timeRange],
    queryFn: async () => {
      if (!selectedProductId) return [];

      let startDate: Date;
      const now = new Date();

      switch (timeRange) {
        case '30d':
          startDate = subDays(now, 30);
          break;
        case '90d':
          startDate = subDays(now, 90);
          break;
        case '6m':
          startDate = subMonths(now, 6);
          break;
        case '1y':
          startDate = subYears(now, 1);
          break;
        case 'all':
        default:
          startDate = new Date('2020-01-01');
      }

      const { data, error } = await supabase
        .from('price_history')
        .select('recorded_at, price, source, notes, currency')
        .eq('filament_id', selectedProductId)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProductId,
  });

  const chartData = priceHistory?.map((record) => ({
    date: record.recorded_at,
    price: Number(record.price),
    formattedDate: format(parseISO(record.recorded_at), 'MMM d, yyyy'),
  })) || [];

  const stats = priceHistory && priceHistory.length > 0
    ? {
        min: Math.min(...priceHistory.map((r) => Number(r.price))),
        max: Math.max(...priceHistory.map((r) => Number(r.price))),
        avg: priceHistory.reduce((sum, r) => sum + Number(r.price), 0) / priceHistory.length,
        latest: Number(priceHistory[priceHistory.length - 1].price),
        earliest: Number(priceHistory[0].price),
      }
    : null;

  const trendPercent = stats
    ? ((stats.latest - stats.earliest) / stats.earliest) * 100
    : null;

  const handleSelectProduct = (id: string, name: string) => {
    setSelectedProductId(id);
    setSelectedProductName(name);
    setSearch('');
  };

  const handleExportCSV = () => {
    if (!priceHistory || priceHistory.length === 0) return;

    const csv = [
      ['Date', 'Price', 'Currency', 'Source', 'Notes'],
      ...priceHistory.map((r) => [
        format(parseISO(r.recorded_at), 'yyyy-MM-dd HH:mm:ss'),
        r.price.toString(),
        r.currency || 'USD',
        r.source || '',
        r.notes || '',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price_history_${selectedProductId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatPrice = (value: number) => `$${value.toFixed(2)}`;
  const formatAxisDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">
            {payload[0].payload.formattedDate}
          </p>
          <p className="text-lg font-bold text-foreground">
            {formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const content = (
    <div className="space-y-6">
      {/* Product Search (only if no initial product) */}
      {!initialProductId && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for a product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {searchResults && searchResults.length > 0 && (
            <Card className="absolute z-10 w-full max-w-md">
              <div className="divide-y">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => handleSelectProduct(product.id, product.product_title)}
                  >
                    <p className="font-medium text-sm">{product.product_title}</p>
                    <p className="text-xs text-muted-foreground">{product.vendor}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Selected Product */}
      {selectedProductId && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{selectedProductName}</h3>
              <p className="text-sm text-muted-foreground">Product ID: {selectedProductId}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-1 bg-muted/30 rounded-lg p-1 w-fit">
            {(['30d', '90d', '6m', '1y', 'all'] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant="ghost"
                size="sm"
                onClick={() => setTimeRange(range)}
                className={cn(
                  'h-7 px-3 text-xs transition-colors',
                  timeRange === range
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'hover:bg-muted/50'
                )}
              >
                {range.toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Latest</p>
                <p className="text-lg font-bold">{formatPrice(stats.latest)}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Low</p>
                <p className="text-lg font-bold text-emerald-500">{formatPrice(stats.min)}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">High</p>
                <p className="text-lg font-bold text-red-500">{formatPrice(stats.max)}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Trend</p>
                <div className="flex items-center gap-1">
                  {trendPercent !== null && trendPercent < 0 ? (
                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  )}
                  <p
                    className={cn(
                      'text-lg font-bold',
                      trendPercent !== null && trendPercent < 0 ? 'text-emerald-500' : 'text-red-500'
                    )}
                  >
                    {trendPercent !== null
                      ? `${trendPercent > 0 ? '+' : ''}${trendPercent.toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 ? (
            <Card>
              <CardContent className="p-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
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
                        tickFormatter={(v) => `$${v.toFixed(0)}`}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                        width={50}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      {stats && (
                        <ReferenceLine
                          y={stats.avg}
                          stroke="hsl(var(--muted-foreground))"
                          strokeDasharray="3 3"
                          strokeOpacity={0.5}
                        />
                      )}
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
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : historyLoading ? (
            <Card className="p-8 text-center text-muted-foreground">
              Loading price history...
            </Card>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              No price history available for this time range
            </Card>
          )}

          {/* History Table */}
          {priceHistory && priceHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Price History Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...priceHistory].reverse().map((record, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(parseISO(record.recorded_at), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatPrice(Number(record.price))}
                          </TableCell>
                          <TableCell>
                            {record.source && (
                              <Badge variant="outline" className="text-xs">
                                {record.source.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                            {record.notes || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!selectedProductId && !initialProductId && (
        <Card className="p-8 text-center text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Search for a product to view its price history</p>
        </Card>
      )}
    </div>
  );

  if (isModal && onClose) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Price History</span>
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Price History Viewer
        </CardTitle>
        <CardDescription>
          View and analyze historical price data for any product
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
