import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, RefreshCw, AlertTriangle, CheckCircle, Search, Calendar, Timer, Zap } from 'lucide-react';
import { formatDistanceToNow, differenceInDays, differenceInHours } from 'date-fns';

interface StaleProduct {
  id: string;
  product_title: string;
  vendor: string;
  variant_price: number | null;
  last_scraped_at: string | null;
  product_url: string | null;
  staleness_days: number;
  staleness_hours: number;
}

const AdminPriceFreshness = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<StaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterStaleness, setFilterStaleness] = useState<'all' | '7d' | '14d' | '30d'>('7d');
  const [brands, setBrands] = useState<string[]>([]);
  const [marking, setMarking] = useState(false);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStaleProducts();
  }, [filterStaleness, filterBrand]);

  const fetchStaleProducts = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let daysThreshold = 7;
      if (filterStaleness === '14d') daysThreshold = 14;
      if (filterStaleness === '30d') daysThreshold = 30;
      if (filterStaleness === 'all') daysThreshold = 365;

      const cutoffDate = new Date(now.getTime() - daysThreshold * 24 * 60 * 60 * 1000);

      let query = supabase
        .from('filaments')
        .select('id, product_title, vendor, variant_price, last_scraped_at, product_url')
        .or(`last_scraped_at.is.null,last_scraped_at.lt.${cutoffDate.toISOString()}`)
        .eq('variant_available', true)
        .not('variant_price', 'is', null)
        .order('last_scraped_at', { ascending: true, nullsFirst: true })
        .limit(500);

      if (filterBrand !== 'all') {
        query = query.ilike('vendor', filterBrand);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate staleness
      const staleProducts: StaleProduct[] = (data || []).map((p) => {
        const lastScraped = p.last_scraped_at ? new Date(p.last_scraped_at) : null;
        const staleness_days = lastScraped ? differenceInDays(now, lastScraped) : 999;
        const staleness_hours = lastScraped ? differenceInHours(now, lastScraped) : 999 * 24;
        
        return {
          ...p,
          staleness_days,
          staleness_hours,
        };
      });

      setProducts(staleProducts);

      // Get unique brands for filter
      const uniqueBrands = [...new Set(staleProducts.map((p) => p.vendor))].filter(Boolean).sort();
      setBrands(uniqueBrands);
    } catch (error) {
      console.error('Error fetching stale products:', error);
      toast({ title: 'Error loading data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(getFilteredProducts().map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const getFilteredProducts = useCallback(() => {
    return products.filter((p) => {
      if (search) {
        const searchLower = search.toLowerCase();
        if (!p.product_title?.toLowerCase().includes(searchLower) &&
            !p.vendor?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [products, search]);

  const handleMarkForRefresh = async () => {
    if (selectedIds.size === 0) {
      toast({ title: 'No products selected', variant: 'destructive' });
      return;
    }

    setMarking(true);
    try {
      // Mark products as needing refresh by clearing last_scraped_at
      // This causes them to be prioritized by scraper jobs
      const { error } = await supabase
        .from('filaments')
        .update({ 
          last_scraped_at: null,
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({ title: `${selectedIds.size} products marked for refresh` });
      setSelectedIds(new Set());
      fetchStaleProducts();
    } catch (error: any) {
      console.error('Error marking products:', error);
      toast({ title: 'Failed to mark products', description: error.message, variant: 'destructive' });
    } finally {
      setMarking(false);
    }
  };

  const handleRefreshNow = async (productId: string, productUrl: string | null) => {
    if (!productUrl) {
      toast({ title: 'No product URL available', variant: 'destructive' });
      return;
    }

    setRefreshingIds((prev) => new Set([...prev, productId]));
    try {
      const { error } = await supabase.functions.invoke('get-current-price', {
        body: { 
          url: productUrl,
          filamentId: productId,
          updateDatabase: true,
        },
      });

      if (error) throw error;

      toast({ title: 'Price refreshed successfully' });
      fetchStaleProducts();
    } catch (error: any) {
      console.error('Error refreshing price:', error);
      toast({ title: 'Failed to refresh price', description: error.message, variant: 'destructive' });
    } finally {
      setRefreshingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const getStalenessColor = (days: number) => {
    if (days > 30) return 'text-red-500';
    if (days > 14) return 'text-amber-500';
    if (days > 7) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const getStalenessLabel = (days: number) => {
    if (days > 30) return <Badge className="bg-red-500/20 text-red-400">Very Stale</Badge>;
    if (days > 14) return <Badge className="bg-amber-500/20 text-amber-400">Stale</Badge>;
    if (days > 7) return <Badge className="bg-yellow-500/20 text-yellow-400">Aging</Badge>;
    return <Badge className="bg-green-500/20 text-green-400">Fresh</Badge>;
  };

  const filteredProducts = getFilteredProducts();
  const stats = {
    total: products.length,
    veryStale: products.filter((p) => p.staleness_days > 30).length,
    stale: products.filter((p) => p.staleness_days > 14 && p.staleness_days <= 30).length,
    aging: products.filter((p) => p.staleness_days > 7 && p.staleness_days <= 14).length,
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <AdminPageHeader
            title="Price Freshness"
            description="Monitor and refresh stale product prices"
            icon={Clock}
            iconColor="text-amber-500"
            actions={
              <div className="flex gap-2">
                <Button
                  onClick={handleMarkForRefresh}
                  disabled={marking || selectedIds.size === 0}
                  variant="default"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Mark for Refresh ({selectedIds.size})
                </Button>
                <Button onClick={fetchStaleProducts} variant="outline">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            }
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Timer className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Stale</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.veryStale}</p>
                  <p className="text-sm text-muted-foreground">Very Stale (30+ days)</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.stale}</p>
                  <p className="text-sm text-muted-foreground">Stale (14-30 days)</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.aging}</p>
                  <p className="text-sm text-muted-foreground">Aging (7-14 days)</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-9"
              />
            </div>

            <Select value={filterStaleness} onValueChange={(v) => setFilterStaleness(v as any)}>
              <SelectTrigger className="w-48">
                <Clock className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Staleness filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Older than 7 days</SelectItem>
                <SelectItem value="14d">Older than 14 days</SelectItem>
                <SelectItem value="30d">Older than 30 days</SelectItem>
                <SelectItem value="all">All stale products</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>Staleness</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No stale products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.slice(0, 100).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(product.id)}
                          onCheckedChange={(checked) => handleSelect(product.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate" title={product.product_title}>
                        {product.product_title}
                      </TableCell>
                      <TableCell>{product.vendor}</TableCell>
                      <TableCell>
                        {product.variant_price ? `$${product.variant_price.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className={getStalenessColor(product.staleness_days)}>
                        {product.last_scraped_at
                          ? formatDistanceToNow(new Date(product.last_scraped_at), { addSuffix: true })
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {getStalenessLabel(product.staleness_days)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefreshNow(product.id, product.product_url)}
                          disabled={refreshingIds.has(product.id) || !product.product_url}
                        >
                          {refreshingIds.has(product.id) ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {filteredProducts.length > 100 && (
            <p className="text-center text-muted-foreground mt-4">
              Showing 100 of {filteredProducts.length} products
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPriceFreshness;
