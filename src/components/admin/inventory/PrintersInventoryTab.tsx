import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BrandSection } from './BrandSection';
import { ProductTable, ProductRow } from './ProductTable';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { usePriceSync } from '@/hooks/usePriceSync';
import { RegionCode } from '@/types/regional';

interface PrintersInventoryTabProps {
  searchTerm: string;
  selectedBrand: string;
  selectedRegion?: RegionCode;
  regionalUrlFilter?: RegionCode | 'any' | null;
  showMissingUrls?: boolean;
}

interface PrinterRecord {
  id: string;
  model_name: string;
  display_name: string | null;
  official_product_url: string | null;
  msrp_usd: number | null;
  current_price_usd_store: number | null;
  prices_last_updated_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  printer_brands: {
    brand: string;
  } | null;
  // Regional fields
  primary_region: string | null;
  has_regional_urls: boolean | null;
  regional_availability: string[] | null;
}

export function PrintersInventoryTab({
  searchTerm,
  selectedBrand,
  selectedRegion = 'US',
  regionalUrlFilter = null,
  showMissingUrls = false,
}: PrintersInventoryTabProps) {
  const { syncBrand, syncSingle, isBrandSyncing, getSyncingIds } = usePriceSync();
  const syncingIds = getSyncingIds();

  const { data: printers, isLoading, error } = useQuery({
    queryKey: ['admin-printers'],
    queryFn: async () => {
      // Fetch all printers in batches to bypass 1000-row limit
      const PAGE_SIZE = 1000;
      let allPrinters: PrinterRecord[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('printers')
          .select(`
            id,
            model_name,
            display_name,
            official_product_url,
            msrp_usd,
            current_price_usd_store,
            prices_last_updated_at,
            last_sync_status,
            last_sync_error,
            printer_brands (
              brand
            ),
            primary_region,
            has_regional_urls,
            regional_availability
          `)
          .order('model_name')
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allPrinters = [...allPrinters, ...data];
          page++;
          hasMore = data.length === PAGE_SIZE;
        } else {
          hasMore = false;
        }
      }

      return allPrinters as PrinterRecord[];
    },
  });

  // Filter printers based on search term, brand, and regional filters
  const filteredPrinters = useMemo(() => {
    if (!printers) return [];

    return printers.filter((printer) => {
      // Brand filter
      if (selectedBrand) {
        const brandMatch = printer.printer_brands?.brand?.toLowerCase() === selectedBrand.toLowerCase();
        if (!brandMatch) return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = printer.model_name?.toLowerCase().includes(search) ||
                           printer.display_name?.toLowerCase().includes(search);
        const matchesBrand = printer.printer_brands?.brand?.toLowerCase().includes(search);
        const matchesUrl = printer.official_product_url?.toLowerCase().includes(search);
        if (!matchesName && !matchesBrand && !matchesUrl) return false;
      }

      // Regional URL filter
      if (regionalUrlFilter) {
        if (regionalUrlFilter === 'any') {
          // Has any regional URL
          if (!printer.has_regional_urls) return false;
        } else {
          // Has URL for specific region
          const regions = printer.regional_availability || [];
          if (!regions.includes(regionalUrlFilter)) return false;
        }
      }

      // Missing URLs filter
      if (showMissingUrls) {
        if (printer.has_regional_urls === true) return false;
      }

      return true;
    });
  }, [printers, searchTerm, selectedBrand, regionalUrlFilter, showMissingUrls]);

  // Group by brand and calculate regional coverage
  const groupedByBrand = useMemo(() => {
    const groups: Record<string, { printers: PrinterRecord[]; coverage: RegionCode[] }> = {};

    filteredPrinters.forEach((printer) => {
      const brandName = printer.printer_brands?.brand || 'Unknown';
      if (!groups[brandName]) {
        groups[brandName] = { printers: [], coverage: [] };
      }
      groups[brandName].printers.push(printer);
      
      // Aggregate regional coverage for the brand
      if (printer.regional_availability) {
        printer.regional_availability.forEach((region) => {
          if (!groups[brandName].coverage.includes(region as RegionCode)) {
            groups[brandName].coverage.push(region as RegionCode);
          }
        });
      }
    });

    // Sort brands alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPrinters]);

  const handleSyncBrand = (brandSlug: string, regions?: RegionCode[] | null) => {
    syncBrand(brandSlug, 'printer', { regions });
  };

  const handleSyncProduct = (id: string, regions?: RegionCode[] | null) => {
    syncSingle(id, 'printer', regions || undefined);
  };

  if (isLoading) {
    return (
      <div className="mt-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
        <p className="text-destructive">Error loading printers: {error.message}</p>
      </div>
    );
  }

  if (groupedByBrand.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          icon={Printer}
          title="No printers found"
          message={searchTerm || selectedBrand || regionalUrlFilter || showMissingUrls
            ? "No printers match your current filters. Try adjusting your search or filter options."
            : "No printers in the database yet."
          }
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Showing {filteredPrinters.length} printers across {groupedByBrand.length} brands
      </p>
      {groupedByBrand.map(([brandName, { printers: brandPrinters, coverage }]) => {
        const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-');
        const products: ProductRow[] = brandPrinters.map((p) => ({
          id: p.id,
          displayName: p.display_name || p.model_name,
          modelName: p.model_name,
          productUrl: p.official_product_url,
          msrp: p.msrp_usd,
          currentPrice: p.current_price_usd_store,
          lastSyncedAt: p.prices_last_updated_at,
          syncStatus: p.last_sync_status,
          syncError: p.last_sync_error,
        }));

        return (
          <BrandSection
            key={brandName}
            brandName={brandName}
            brandSlug={brandSlug}
            productCount={brandPrinters.length}
            onSyncBrand={handleSyncBrand}
            isSyncing={isBrandSyncing(brandSlug, 'printer')}
            defaultExpanded={groupedByBrand.length === 1}
            regionalCoverage={coverage}
          >
            <ProductTable
              products={products}
              type="printer"
              onSync={handleSyncProduct}
              syncingIds={syncingIds}
              selectedRegion={selectedRegion}
            />
          </BrandSection>
        );
      })}
    </div>
  );
}
