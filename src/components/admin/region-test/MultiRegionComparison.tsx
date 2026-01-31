import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRegion } from '@/contexts/RegionContext';
import { REGIONS, REGION_LIST } from '@/config/regions';
import { formatPrice, CURRENCIES } from '@/config/currencies';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilamentResult {
  id: string;
  product_title: string;
  vendor: string;
  variant_price: number | null;
  price_cad: number | null;
  price_eur: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  product_handle: string | null;
  product_url: string | null;
  last_scraped_at: string | null;
}

interface RegionalPriceCell {
  regionCode: RegionCode;
  currencyCode: CurrencyCode;
  price: number | null;
  formattedPrice: string;
  source: 'direct' | 'converted' | 'missing';
  hasLocalStore: boolean;
}

export function MultiRegionComparison() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<FilamentResult | null>(null);
  const { convertPrice, getConversionRate } = useRegion();

  // Search products query
  const { data: searchResults = [], isLoading: searching } = useQuery({
    queryKey: ['region-test-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, variant_price, price_cad, price_eur, price_gbp, price_aud, product_handle, product_url, last_scraped_at')
        .or(`product_title.ilike.%${searchTerm}%,vendor.ilike.%${searchTerm}%`)
        .not('variant_price', 'is', null)
        .limit(10);
      
      if (error) throw error;
      return (data || []) as unknown as FilamentResult[];
    },
    enabled: searchTerm.length >= 2,
  });

  // Fetch brand regional stores for selected product
  const { data: brandStores = [], isLoading: loadingStores } = useQuery({
    queryKey: ['brand-regional-stores', selectedProduct?.vendor],
    queryFn: async () => {
      if (!selectedProduct?.vendor) return [];
      
      // Get brand ID first
      const { data: brandData } = await supabase
        .from('automated_brands')
        .select('id')
        .ilike('brand_name', selectedProduct.vendor)
        .limit(1)
        .maybeSingle();
      
      if (!brandData?.id) return [];
      
      const { data: stores } = await supabase
        .from('brand_regional_stores')
        .select('region_code, store_name, base_url, currency_code')
        .eq('brand_id', brandData.id)
        .eq('is_active', true);
      
      return stores || [];
    },
    enabled: !!selectedProduct?.vendor,
  });

  // Build region price matrix
  const regionPrices = useMemo((): RegionalPriceCell[] => {
    if (!selectedProduct) return [];
    
    const storeRegions = new Set(brandStores.map(s => s.region_code));
    
    const regionCurrencyMap: Record<RegionCode, { currency: CurrencyCode; priceField: keyof FilamentResult | null }> = {
      US: { currency: 'USD', priceField: 'variant_price' },
      CA: { currency: 'CAD', priceField: 'price_cad' },
      EU: { currency: 'EUR', priceField: 'price_eur' },
      UK: { currency: 'GBP', priceField: 'price_gbp' },
      AU: { currency: 'AUD', priceField: 'price_aud' },
      JP: { currency: 'JPY', priceField: null },
      CN: { currency: 'CNY', priceField: null },
    };
    
    return REGION_LIST.map(region => {
      const mapping = regionCurrencyMap[region.code];
      const directPrice = mapping.priceField 
        ? (selectedProduct[mapping.priceField] as number | null)
        : null;
      
      let price: number | null = null;
      let source: 'direct' | 'converted' | 'missing' = 'missing';
      
      if (directPrice !== null) {
        price = directPrice;
        source = 'direct';
      } else if (selectedProduct.variant_price !== null) {
        // Convert from USD
        const rate = getConversionRate('USD', mapping.currency);
        if (rate) {
          price = selectedProduct.variant_price * rate;
          source = 'converted';
        }
      }
      
      const formattedPrice = price !== null 
        ? (source === 'converted' ? '~' : '') + formatPrice(price, mapping.currency)
        : '—';
      
      return {
        regionCode: region.code,
        currencyCode: mapping.currency,
        price,
        formattedPrice,
        source,
        hasLocalStore: storeRegions.has(region.code),
      };
    });
  }, [selectedProduct, brandStores, getConversionRate]);

  const handleSelectProduct = (product: FilamentResult) => {
    setSelectedProduct(product);
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a filament to compare across regions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && searchTerm && (
          <div className="mt-2 border rounded-md divide-y bg-card max-h-60 overflow-auto">
            {searchResults.map(result => (
              <button
                key={result.id}
                onClick={() => handleSelectProduct(result)}
                className="w-full px-4 py-2 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="font-medium text-sm">{result.product_title}</div>
                <div className="text-xs text-muted-foreground">{result.vendor}</div>
              </button>
            ))}
          </div>
        )}
        
        {searching && searchTerm.length >= 2 && (
          <div className="mt-2 text-sm text-muted-foreground">Searching...</div>
        )}
      </Card>

      {/* Selected Product Info */}
      {selectedProduct && (
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{selectedProduct.product_title}</h3>
              <p className="text-sm text-muted-foreground">{selectedProduct.vendor}</p>
              {selectedProduct.last_scraped_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last checked: {new Date(selectedProduct.last_scraped_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedProduct(null)}
            >
              Clear
            </Button>
          </div>
        </Card>
      )}

      {/* Regional Price Matrix */}
      {selectedProduct && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {regionPrices.map(cell => (
            <Card 
              key={cell.regionCode}
              className={cn(
                "p-4 text-center",
                cell.source === 'direct' && cell.hasLocalStore && "border-green-500/50 bg-green-500/5",
                cell.source === 'converted' && "border-amber-500/50 bg-amber-500/5",
                cell.source === 'missing' && "border-red-500/50 bg-red-500/5"
              )}
            >
              <div className="text-2xl mb-1">{REGIONS[cell.regionCode].flag}</div>
              <div className="font-medium text-sm">{REGIONS[cell.regionCode].name}</div>
              <div className="text-lg font-bold mt-2">{cell.formattedPrice}</div>
              
              <div className="mt-2 flex items-center justify-center gap-1">
                {cell.source === 'direct' && cell.hasLocalStore && (
                  <Badge variant="outline" className="text-green-500 border-green-500/50 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Local
                  </Badge>
                )}
                {cell.source === 'converted' && (
                  <Badge variant="outline" className="text-amber-500 border-amber-500/50 text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Converted
                  </Badge>
                )}
                {cell.source === 'missing' && (
                  <Badge variant="outline" className="text-red-500 border-red-500/50 text-xs">
                    <XCircle className="h-3 w-3 mr-1" />
                    Missing
                  </Badge>
                )}
                {cell.source === 'direct' && !cell.hasLocalStore && (
                  <Badge variant="outline" className="text-blue-500 border-blue-500/50 text-xs">
                    Direct
                  </Badge>
                )}
              </div>
              
              {!cell.hasLocalStore && cell.source !== 'missing' && (
                <div className="text-xs text-muted-foreground mt-1">No store</div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!selectedProduct && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Search for a product above to see pricing across all regions</p>
          </div>
        </Card>
      )}
    </div>
  );
}
