import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { REGIONS, REGION_LIST } from '@/config/regions';
import { RegionCode } from '@/types/regional';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileJson, FileText, Loader2 } from 'lucide-react';

interface ExportData {
  timestamp: string;
  summary: {
    totalBrands: number;
    brandsWithStores: number;
    totalProducts: number;
    productsWithPrices: number;
    exchangeRatesAge: string;
  };
  regionCoverage: {
    code: RegionCode;
    name: string;
    storeCount: number;
    percentage: number;
  }[];
  exchangeRates: {
    currency: string;
    rate: number;
    fetchedAt: string;
  }[];
  storeAudit: {
    brandName: string;
    regions: string[];
    storeCount: number;
  }[];
}

export function RegionTestExport() {
  const [isExporting, setIsExporting] = useState(false);

  // Fetch all data needed for export
  const { data: brands } = useQuery({
    queryKey: ['export-brands'],
    queryFn: async () => {
      const { data } = await supabase
        .from('automated_brands')
        .select('id, brand_name')
        .eq('is_visible', true);
      return data || [];
    },
  });

  const { data: stores } = useQuery({
    queryKey: ['export-stores'],
    queryFn: async () => {
      const { data } = await supabase
        .from('brand_regional_stores')
        .select('brand_id, region_code')
        .eq('is_active', true);
      return data || [];
    },
  });

  const { data: exchangeRates } = useQuery({
    queryKey: ['export-rates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('currency_exchange_rates')
        .select('target_currency, rate, fetched_at')
        .order('fetched_at', { ascending: false });
      return data || [];
    },
  });

  const { data: productStats } = useQuery({
    queryKey: ['export-product-stats'],
    queryFn: async () => {
      const { count: total } = await supabase
        .from('filaments')
        .select('id', { count: 'exact', head: true });
      
      const { count: withPrices } = await supabase
        .from('filaments')
        .select('id', { count: 'exact', head: true })
        .not('variant_price', 'is', null);
      
      return { total: total || 0, withPrices: withPrices || 0 };
    },
  });

  const buildExportData = (): ExportData => {
    const brandStoreMap = new Map<string, Set<string>>();
    (stores || []).forEach(store => {
      if (!brandStoreMap.has(store.brand_id)) {
        brandStoreMap.set(store.brand_id, new Set());
      }
      brandStoreMap.get(store.brand_id)!.add(store.region_code);
    });

    const regionCounts: Record<string, number> = {};
    REGION_LIST.forEach(r => regionCounts[r.code] = 0);
    
    (stores || []).forEach(store => {
      if (regionCounts[store.region_code] !== undefined) {
        regionCounts[store.region_code]++;
      }
    });

    const totalBrands = (brands || []).length;

    const oldestRate = exchangeRates && exchangeRates.length > 0
      ? exchangeRates.reduce((oldest, r) => 
          new Date(r.fetched_at) < new Date(oldest.fetched_at) ? r : oldest
        )
      : null;

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalBrands,
        brandsWithStores: brandStoreMap.size,
        totalProducts: productStats?.total || 0,
        productsWithPrices: productStats?.withPrices || 0,
        exchangeRatesAge: oldestRate 
          ? new Date(oldestRate.fetched_at).toISOString() 
          : 'Unknown',
      },
      regionCoverage: REGION_LIST.map(region => ({
        code: region.code,
        name: region.name,
        storeCount: regionCounts[region.code] || 0,
        percentage: totalBrands > 0 
          ? Math.round((regionCounts[region.code] / totalBrands) * 100) 
          : 0,
      })),
      exchangeRates: (exchangeRates || []).map(r => ({
        currency: r.target_currency,
        rate: r.rate,
        fetchedAt: r.fetched_at,
      })),
      storeAudit: (brands || []).map(brand => {
        const regions = brandStoreMap.get(brand.id);
        return {
          brandName: brand.brand_name,
          regions: regions ? Array.from(regions) : [],
          storeCount: regions ? regions.size : 0,
        };
      }).sort((a, b) => b.storeCount - a.storeCount),
    };
  };

  const exportJSON = () => {
    setIsExporting(true);
    try {
      const data = buildExportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `region-audit-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const exportCSV = () => {
    setIsExporting(true);
    try {
      const data = buildExportData();
      
      // Build CSV content
      const lines: string[] = [];
      
      // Header
      lines.push('Brand,' + REGION_LIST.map(r => r.code).join(',') + ',Total Stores');
      
      // Data rows
      data.storeAudit.forEach(brand => {
        const regionCells = REGION_LIST.map(r => 
          brand.regions.includes(r.code) ? 'Yes' : 'No'
        );
        lines.push(`"${brand.brandName}",${regionCells.join(',')},${brand.storeCount}`);
      });
      
      // Summary
      lines.push('');
      lines.push('Summary');
      lines.push(`Total Brands,${data.summary.totalBrands}`);
      lines.push(`Brands with Stores,${data.summary.brandsWithStores}`);
      lines.push(`Total Products,${data.summary.totalProducts}`);
      lines.push(`Products with Prices,${data.summary.productsWithPrices}`);
      
      const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `region-audit-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const data = buildExportData();

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex gap-4">
        <Button onClick={exportJSON} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileJson className="h-4 w-4 mr-2" />
          )}
          Export JSON
        </Button>
        <Button onClick={exportCSV} variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Preview */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Export Preview</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Brands:</span>{' '}
                <span className="font-medium">{data.summary.totalBrands}</span>
              </div>
              <div>
                <span className="text-muted-foreground">With Stores:</span>{' '}
                <span className="font-medium">{data.summary.brandsWithStores}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Products:</span>{' '}
                <span className="font-medium">{data.summary.totalProducts}</span>
              </div>
              <div>
                <span className="text-muted-foreground">With Prices:</span>{' '}
                <span className="font-medium">{data.summary.productsWithPrices}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Region Coverage</h4>
            <div className="flex flex-wrap gap-2">
              {data.regionCoverage.map(region => (
                <Badge key={region.code} variant="outline">
                  {REGIONS[region.code].flag} {region.code}: {region.storeCount} ({region.percentage}%)
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Exchange Rates</h4>
            <div className="flex flex-wrap gap-2">
              {data.exchangeRates.slice(0, 6).map(rate => (
                <Badge key={rate.currency} variant="secondary">
                  {rate.currency}: {rate.rate.toFixed(4)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
