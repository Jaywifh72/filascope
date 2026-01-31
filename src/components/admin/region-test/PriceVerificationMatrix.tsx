import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { REGIONS, REGION_LIST } from '@/config/regions';
import { formatPrice } from '@/config/currencies';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, AlertTriangle, XCircle, Clock, 
  ExternalLink, Search, Filter 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceRecord {
  id: string;
  product_title: string;
  vendor: string;
  variant_price: number | null;
  price_cad: number | null;
  price_eur: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  last_scraped_at: string | null;
  product_url: string | null;
}

type FreshnessFilter = 'all' | 'fresh' | 'stale' | 'very_stale';

export function PriceVerificationMatrix() {
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [freshnessFilter, setFreshnessFilter] = useState<FreshnessFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch products with prices
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['price-verification-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, variant_price, price_cad, price_eur, price_gbp, price_aud, last_scraped_at, product_url')
        .not('variant_price', 'is', null)
        .order('last_scraped_at', { ascending: true, nullsFirst: true })
        .limit(200);
      
      if (error) throw error;
      return data as PriceRecord[];
    },
  });

  // Get unique brands for filter
  const brands = [...new Set(products.map(p => p.vendor))].sort();

  // Filter products
  const filteredProducts = products.filter(product => {
    // Brand filter
    if (brandFilter !== 'all' && product.vendor !== brandFilter) return false;
    
    // Search filter
    if (searchTerm && !product.product_title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Freshness filter
    if (freshnessFilter !== 'all') {
      const lastScraped = product.last_scraped_at ? new Date(product.last_scraped_at) : null;
      const now = new Date();
      const daysSinceUpdate = lastScraped 
        ? Math.floor((now.getTime() - lastScraped.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      if (freshnessFilter === 'fresh' && daysSinceUpdate > 7) return false;
      if (freshnessFilter === 'stale' && (daysSinceUpdate <= 7 || daysSinceUpdate > 30)) return false;
      if (freshnessFilter === 'very_stale' && daysSinceUpdate <= 30) return false;
    }
    
    return true;
  });

  // Calculate freshness stats
  const freshnessStats = {
    fresh: products.filter(p => {
      if (!p.last_scraped_at) return false;
      const days = Math.floor((Date.now() - new Date(p.last_scraped_at).getTime()) / (1000 * 60 * 60 * 24));
      return days <= 7;
    }).length,
    stale: products.filter(p => {
      if (!p.last_scraped_at) return false;
      const days = Math.floor((Date.now() - new Date(p.last_scraped_at).getTime()) / (1000 * 60 * 60 * 24));
      return days > 7 && days <= 30;
    }).length,
    veryStale: products.filter(p => {
      if (!p.last_scraped_at) return true;
      const days = Math.floor((Date.now() - new Date(p.last_scraped_at).getTime()) / (1000 * 60 * 60 * 24));
      return days > 30;
    }).length,
  };

  const getFreshnessColor = (lastScraped: string | null): string => {
    if (!lastScraped) return 'text-red-500';
    const days = Math.floor((Date.now() - new Date(lastScraped).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7) return 'text-green-500';
    if (days <= 30) return 'text-amber-500';
    return 'text-red-500';
  };

  const getFreshnessIcon = (lastScraped: string | null) => {
    if (!lastScraped) return <XCircle className="h-4 w-4 text-red-500" />;
    const days = Math.floor((Date.now() - new Date(lastScraped).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (days <= 30) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{products.length}</div>
          <div className="text-sm text-muted-foreground">Total Products</div>
        </Card>
        <Card className="p-4 border-green-500/30">
          <div className="text-2xl font-bold text-green-500">{freshnessStats.fresh}</div>
          <div className="text-sm text-muted-foreground">Fresh (&lt;7 days)</div>
        </Card>
        <Card className="p-4 border-amber-500/30">
          <div className="text-2xl font-bold text-amber-500">{freshnessStats.stale}</div>
          <div className="text-sm text-muted-foreground">Stale (7-30 days)</div>
        </Card>
        <Card className="p-4 border-red-500/30">
          <div className="text-2xl font-bold text-red-500">{freshnessStats.veryStale}</div>
          <div className="text-sm text-muted-foreground">Very Stale (&gt;30 days)</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={freshnessFilter} onValueChange={(v) => setFreshnessFilter(v as FreshnessFilter)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by freshness" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Freshness</SelectItem>
              <SelectItem value="fresh">Fresh (&lt;7 days)</SelectItem>
              <SelectItem value="stale">Stale (7-30 days)</SelectItem>
              <SelectItem value="very_stale">Very Stale (&gt;30 days)</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground ml-auto">
            Showing {filteredProducts.length} of {products.length}
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="min-w-[250px]">Product</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">USD</TableHead>
                <TableHead className="text-right">CAD</TableHead>
                <TableHead className="text-right">EUR</TableHead>
                <TableHead className="text-right">GBP</TableHead>
                <TableHead className="text-right">AUD</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map(product => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-medium text-sm truncate max-w-[250px]" title={product.product_title}>
                      {product.product_title}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{product.vendor}</TableCell>
                  <TableCell className="text-right font-medium">
                    {product.variant_price !== null 
                      ? formatPrice(product.variant_price, 'USD')
                      : '—'}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right",
                    product.price_cad === null && "text-muted-foreground"
                  )}>
                    {product.price_cad !== null 
                      ? formatPrice(product.price_cad, 'CAD')
                      : '—'}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right",
                    product.price_eur === null && "text-muted-foreground"
                  )}>
                    {product.price_eur !== null 
                      ? formatPrice(product.price_eur, 'EUR')
                      : '—'}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right",
                    product.price_gbp === null && "text-muted-foreground"
                  )}>
                    {product.price_gbp !== null 
                      ? formatPrice(product.price_gbp, 'GBP')
                      : '—'}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right",
                    product.price_aud === null && "text-muted-foreground"
                  )}>
                    {product.price_aud !== null 
                      ? formatPrice(product.price_aud, 'AUD')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <div className={cn("flex items-center gap-1", getFreshnessColor(product.last_scraped_at))}>
                      {getFreshnessIcon(product.last_scraped_at)}
                      <span className="text-sm">
                        {product.last_scraped_at 
                          ? formatDistanceToNow(new Date(product.last_scraped_at), { addSuffix: true })
                          : 'Never'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.product_url && (
                      <a 
                        href={product.product_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
