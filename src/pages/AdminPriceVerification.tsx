import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import {
  DollarSign,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingDown,
  ExternalLink,
  Edit,
  History,
} from 'lucide-react';
import { PriceUpdateDialog } from '@/components/admin/PriceUpdateDialog';
import { PriceBulkImport } from '@/components/admin/PriceBulkImport';
import { PriceHistoryViewer } from '@/components/admin/PriceHistoryViewer';
import { toast } from 'sonner';

interface PriceStats {
  high: number;
  medium: number;
  low: number;
  stale: number;
  unknown: number;
  total: number;
}

interface ProductRow {
  id: string;
  product_title: string;
  vendor: string;
  variant_price: number | null;
  last_scraped_at: string | null;
  price_confidence: string | null;
  product_url: string | null;
  type: 'filament' | 'printer';
}

type ConfidenceFilter = 'all' | 'high' | 'medium' | 'low' | 'stale' | 'unknown' | 'needs_verification';

export default function AdminPriceVerification() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>('needs_verification');
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'filament' | 'printer'>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [historyProduct, setHistoryProduct] = useState<ProductRow | null>(null);
  const [activeTab, setActiveTab] = useState('verification');

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<PriceStats>({
    queryKey: ['admin-price-verification-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('price_confidence');

      if (error) throw error;

      const counts = (data || []).reduce(
        (acc, row) => {
          const conf = row.price_confidence || 'unknown';
          if (conf === 'high') acc.high++;
          else if (conf === 'medium') acc.medium++;
          else if (conf === 'low') acc.low++;
          else if (conf === 'stale') acc.stale++;
          else acc.unknown++;
          acc.total++;
          return acc;
        },
        { high: 0, medium: 0, low: 0, stale: 0, unknown: 0, total: 0 }
      );

      return counts;
    },
  });

  // Fetch products
  const { data: products, isLoading: productsLoading, refetch } = useQuery<ProductRow[]>({
    queryKey: ['admin-price-verification-products', confidenceFilter, productTypeFilter, search],
    queryFn: async () => {
      let query = supabase
        .from('filaments')
        .select('id, product_title, vendor, variant_price, last_scraped_at, price_confidence, product_url')
        .order('last_scraped_at', { ascending: true, nullsFirst: true })
        .limit(100);

      // Apply confidence filter
      if (confidenceFilter === 'needs_verification') {
        query = query.or('price_confidence.in.(low,stale,unknown),last_scraped_at.is.null');
      } else if (confidenceFilter !== 'all') {
        query = query.eq('price_confidence', confidenceFilter);
      }

      // Apply search
      if (search) {
        query = query.or(`product_title.ilike.%${search}%,vendor.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row) => ({
        ...row,
        type: 'filament' as const,
      }));
    },
  });

  // Quick verify mutation (confirms current price is accurate)
  const quickVerifyMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('filaments')
        .update({
          last_scraped_at: new Date().toISOString(),
          price_source: 'manual_verification',
        })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Price verified successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-price-verification-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-price-verification-stats'] });
    },
    onError: (error) => {
      toast.error('Failed to verify price: ' + (error as Error).message);
    },
  });

  const getConfidenceBadge = (confidence: string | null, lastScraped: string | null) => {
    if (!confidence || confidence === 'unknown') {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Unknown
        </Badge>
      );
    }

    const variants: Record<string, { class: string; icon: React.ReactNode }> = {
      high: { class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: <CheckCircle2 className="w-3 h-3 mr-1" /> },
      medium: { class: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: <Clock className="w-3 h-3 mr-1" /> },
      low: { class: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: <AlertTriangle className="w-3 h-3 mr-1" /> },
      stale: { class: 'bg-red-500/10 text-red-500 border-red-500/20', icon: <TrendingDown className="w-3 h-3 mr-1" /> },
    };

    const variant = variants[confidence] || variants.low;

    return (
      <Badge variant="outline" className={variant.class}>
        {variant.icon}
        {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
      </Badge>
    );
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '—';
    return `$${price.toFixed(2)}`;
  };

  const formatLastVerified = (date: string | null) => {
    if (!date) return 'Never';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <AdminPageHeader
            title="Price Verification"
            description="Manually verify and update product prices"
            icon={DollarSign}
            iconColor="text-green-500"
            actions={
              <Button variant="outline" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            }
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card
              className="cursor-pointer hover:border-emerald-500/50 transition-colors"
              onClick={() => setConfidenceFilter('high')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <p className="text-2xl font-bold text-foreground">{stats?.high ?? '—'}</p>
                </div>
                <p className="text-sm text-muted-foreground">High Confidence</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-blue-500/50 transition-colors"
              onClick={() => setConfidenceFilter('medium')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <p className="text-2xl font-bold text-foreground">{stats?.medium ?? '—'}</p>
                </div>
                <p className="text-sm text-muted-foreground">Medium</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-amber-500/50 transition-colors"
              onClick={() => setConfidenceFilter('low')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <p className="text-2xl font-bold text-foreground">{stats?.low ?? '—'}</p>
                </div>
                <p className="text-sm text-muted-foreground">Low</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-red-500/50 transition-colors"
              onClick={() => setConfidenceFilter('stale')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <p className="text-2xl font-bold text-foreground">{stats?.stale ?? '—'}</p>
                </div>
                <p className="text-sm text-muted-foreground">Stale</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-muted-foreground/50 transition-colors"
              onClick={() => setConfidenceFilter('unknown')}
            >
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-foreground">{stats?.unknown ?? '—'}</p>
                <p className="text-sm text-muted-foreground">Unknown</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="verification">Needs Verification</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
              <TabsTrigger value="history">Price History</TabsTrigger>
            </TabsList>

            <TabsContent value="verification" className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products or brands..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select
                  value={confidenceFilter}
                  onValueChange={(v) => setConfidenceFilter(v as ConfidenceFilter)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="needs_verification">Needs Verification</SelectItem>
                    <SelectItem value="high">High Confidence</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="stale">Stale</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Products Table */}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead>Last Verified</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Loading products...
                        </TableCell>
                      </TableRow>
                    ) : products?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      products?.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium max-w-[300px] truncate">
                            {product.product_title}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {product.vendor || '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatPrice(product.variant_price)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatLastVerified(product.last_scraped_at)}
                          </TableCell>
                          <TableCell>
                            {getConfidenceBadge(product.price_confidence, product.last_scraped_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {product.product_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(product.product_url!, '_blank')}
                                  title="View in Store"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setHistoryProduct(product)}
                                title="View History"
                              >
                                <History className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => quickVerifyMutation.mutate(product.id)}
                                disabled={quickVerifyMutation.isPending}
                                title="Quick Verify (confirm current price)"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedProduct(product)}
                                className="gap-1"
                              >
                                <Edit className="w-4 h-4" />
                                Update
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="bulk">
              <PriceBulkImport
                onImportComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ['admin-price-verification-products'] });
                  queryClient.invalidateQueries({ queryKey: ['admin-price-verification-stats'] });
                }}
              />
            </TabsContent>

            <TabsContent value="history">
              <PriceHistoryViewer />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Update Dialog */}
      <PriceUpdateDialog
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onUpdate={() => {
          setSelectedProduct(null);
          queryClient.invalidateQueries({ queryKey: ['admin-price-verification-products'] });
          queryClient.invalidateQueries({ queryKey: ['admin-price-verification-stats'] });
        }}
      />

      {/* History Modal (inline) */}
      {historyProduct && (
        <PriceHistoryViewer
          productId={historyProduct.id}
          productName={historyProduct.product_title}
          onClose={() => setHistoryProduct(null)}
          isModal
        />
      )}
    </AdminLayout>
  );
}
