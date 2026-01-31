import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRegion } from '@/contexts/RegionContext';
import { REGIONS, REGION_LIST } from '@/config/regions';
import { formatPrice, CURRENCIES } from '@/config/currencies';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Play, CheckCircle2, AlertTriangle, XCircle, 
  Loader2, ExternalLink, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpotCheckResult {
  productId: string;
  productTitle: string;
  vendor: string;
  regionCode: RegionCode;
  currencyCode: CurrencyCode;
  displayPrice: string;
  priceValue: number | null;
  storeType: 'local' | 'fallback' | 'converted' | 'missing';
  storeUrl: string | null;
  status: 'pass' | 'warning' | 'fail';
  notes: string;
}

interface RandomProduct {
  id: string;
  product_title: string;
  vendor: string;
  variant_price: number | null;
  price_cad: number | null;
  price_eur: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  product_url: string | null;
}

export function AutomatedSpotCheck() {
  const [selectedRegion, setSelectedRegion] = useState<RegionCode | 'all'>('all');
  const [results, setResults] = useState<SpotCheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const { getConversionRate } = useRegion();

  // Fetch regional stores map
  const { data: storesMap = {} } = useQuery({
    queryKey: ['spot-check-stores'],
    queryFn: async () => {
      const { data: brands } = await supabase
        .from('automated_brands')
        .select('id, brand_name');
      
      const { data: stores } = await supabase
        .from('brand_regional_stores')
        .select('brand_id, region_code, store_name, base_url')
        .eq('is_active', true);
      
      const brandNameMap = new Map((brands || []).map(b => [b.id, b.brand_name.toLowerCase()]));
      const storesByBrand: Record<string, Record<string, { name: string; url: string }>> = {};
      
      (stores || []).forEach(store => {
        const brandName = brandNameMap.get(store.brand_id);
        if (brandName) {
          if (!storesByBrand[brandName]) storesByBrand[brandName] = {};
          storesByBrand[brandName][store.region_code] = {
            name: store.store_name,
            url: store.base_url,
          };
        }
      });
      
      return storesByBrand;
    },
  });

  const runSpotCheck = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    const regionsToTest = selectedRegion === 'all' 
      ? REGION_LIST.map(r => r.code)
      : [selectedRegion];

    const allResults: SpotCheckResult[] = [];
    const totalTests = regionsToTest.length * 10;
    let completed = 0;

    for (const regionCode of regionsToTest) {
      // Fetch 10 random products
      const { data: products } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, variant_price, price_cad, price_eur, price_gbp, price_aud, product_url')
        .not('variant_price', 'is', null)
        .eq('variant_available', true)
        .limit(30);
      
      // Shuffle and take 10
      const shuffled = ((products || []) as unknown as RandomProduct[]).sort(() => Math.random() - 0.5).slice(0, 10);

      const regionCurrencyMap: Record<RegionCode, { currency: CurrencyCode; field: keyof RandomProduct | null }> = {
        US: { currency: 'USD', field: 'variant_price' },
        CA: { currency: 'CAD', field: 'price_cad' },
        EU: { currency: 'EUR', field: 'price_eur' },
        UK: { currency: 'GBP', field: 'price_gbp' },
        AU: { currency: 'AUD', field: 'price_aud' },
        JP: { currency: 'JPY', field: null }, // No direct JPY column
        CN: { currency: 'CNY', field: null }, // No direct CNY column
      };

      for (const product of shuffled) {
        const mapping = regionCurrencyMap[regionCode];
        const vendorLower = product.vendor.toLowerCase();
        const brandStores = storesMap[vendorLower] || {};
        const hasLocalStore = !!brandStores[regionCode];
        
        const directPrice = mapping.field ? (product[mapping.field] as number | null) : null;
        let priceValue: number | null = null;
        let storeType: SpotCheckResult['storeType'] = 'missing';
        let displayPrice = '—';
        let status: SpotCheckResult['status'] = 'fail';
        let notes = '';

        if (directPrice !== null) {
          priceValue = directPrice;
          displayPrice = formatPrice(directPrice, mapping.currency);
          storeType = hasLocalStore ? 'local' : 'fallback';
          status = hasLocalStore ? 'pass' : 'warning';
          notes = hasLocalStore ? 'Local store pricing' : 'Using fallback store';
        } else if (product.variant_price !== null) {
          const rate = getConversionRate('USD', mapping.currency);
          if (rate) {
            priceValue = product.variant_price * rate;
            displayPrice = '~' + formatPrice(priceValue, mapping.currency);
            storeType = 'converted';
            status = 'warning';
            notes = 'Converted from USD';
          } else {
            notes = 'No conversion rate available';
          }
        } else {
          notes = 'No price data';
        }

        allResults.push({
          productId: product.id,
          productTitle: product.product_title,
          vendor: product.vendor,
          regionCode,
          currencyCode: mapping.currency,
          displayPrice,
          priceValue,
          storeType,
          storeUrl: product.product_url,
          status,
          notes,
        });

        completed++;
        setProgress(Math.round((completed / totalTests) * 100));
      }
    }

    setResults(allResults);
    setIsRunning(false);
  };

  // Summary stats
  const stats = useMemo(() => {
    const total = results.length;
    const passed = results.filter(r => r.status === 'pass').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return { total, passed, warnings, failed, passRate };
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Select 
            value={selectedRegion} 
            onValueChange={(v) => setSelectedRegion(v as RegionCode | 'all')}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions (70 tests)</SelectItem>
              {REGION_LIST.map(region => (
                <SelectItem key={region.code} value={region.code}>
                  {region.flag} {region.name} (10 tests)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={runSpotCheck} 
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Spot Check
              </>
            )}
          </Button>

          {results.length > 0 && !isRunning && (
            <Button variant="outline" onClick={runSpotCheck}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-run
            </Button>
          )}
        </div>

        {isRunning && (
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-1">{progress}% complete</p>
          </div>
        )}
      </Card>

      {/* Summary Stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Tests</div>
          </Card>
          <Card className="p-4 border-green-500/30">
            <div className="text-2xl font-bold text-green-500">{stats.passed}</div>
            <div className="text-sm text-muted-foreground">Passed</div>
          </Card>
          <Card className="p-4 border-amber-500/30">
            <div className="text-2xl font-bold text-amber-500">{stats.warnings}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </Card>
          <Card className="p-4 border-red-500/30">
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{stats.passRate}%</div>
            <div className="text-sm text-muted-foreground">Pass Rate</div>
          </Card>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto max-h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, idx) => (
                  <TableRow key={`${result.productId}-${result.regionCode}-${idx}`}>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate font-medium text-sm" title={result.productTitle}>
                        {result.productTitle}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{result.vendor}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{REGIONS[result.regionCode].flag}</span>
                        <span className="text-sm">{result.regionCode}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{result.displayPrice}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          result.storeType === 'local' && "border-green-500/50 text-green-500",
                          result.storeType === 'fallback' && "border-blue-500/50 text-blue-500",
                          result.storeType === 'converted' && "border-amber-500/50 text-amber-500",
                          result.storeType === 'missing' && "border-red-500/50 text-red-500"
                        )}
                      >
                        {result.storeType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {result.status === 'pass' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {result.status === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                      {result.status === 'fail' && <XCircle className="h-5 w-5 text-red-500" />}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{result.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {results.length === 0 && !isRunning && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a region and click "Run Spot Check" to test pricing accuracy</p>
            <p className="text-sm mt-2">Tests 10 random products per region</p>
          </div>
        </Card>
      )}
    </div>
  );
}
