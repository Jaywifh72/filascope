import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BrandSection } from './BrandSection';
import { ProductTable, ProductRow } from './ProductTable';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { usePriceSync } from '@/hooks/usePriceSync';
import { RegionCode } from '@/types/regional';

interface FilamentsInventoryTabProps {
  searchTerm: string;
  selectedBrand: string;
  selectedRegion?: RegionCode;
  regionalUrlFilter?: RegionCode | 'any' | null;
  showMissingUrls?: boolean;
}

interface FilamentRecord {
  id: string;
  product_title: string;
  display_name: string | null;
  material: string | null;
  product_url: string | null;
  msrp: number | null;
  variant_price: number | null;
  last_scraped_at: string | null;
  sync_status: string | null;
  last_sync_error: string | null;
  vendor: string | null;
  // Regional fields
  primary_region: string | null;
  has_regional_urls: boolean | null;
  available_regions: string[] | null;
}

export function FilamentsInventoryTab({
  searchTerm,
  selectedBrand,
  selectedRegion = 'US',
  regionalUrlFilter = null,
  showMissingUrls = false,
}: FilamentsInventoryTabProps) {
  const { syncBrand, syncSingle, isBrandSyncing, getSyncingIds } = usePriceSync();
  const syncingIds = getSyncingIds();

  const { data: filaments, isLoading, error } = useQuery({
    queryKey: ['admin-filaments'],
    queryFn: async () => {
      // Fetch all filaments in batches to bypass 1000-row limit
      const PAGE_SIZE = 1000;
      let allFilaments: FilamentRecord[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('filaments')
          .select(`
            id,
            product_title,
            display_name,
            material,
            product_url,
            msrp,
            variant_price,
            last_scraped_at,
            sync_status,
            last_sync_error,
            vendor,
            primary_region,
            has_regional_urls,
            available_regions
          `)
          .order('vendor')
          .order('product_title')
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allFilaments = [...allFilaments, ...data];
          page++;
          hasMore = data.length === PAGE_SIZE;
        } else {
          hasMore = false;
        }
      }

      return allFilaments as FilamentRecord[];
    },
  });

  // Filter filaments based on search term, brand, and regional filters
  const filteredFilaments = useMemo(() => {
    if (!filaments) return [];

    return filaments.filter((filament) => {
      // Brand filter
      if (selectedBrand) {
        const vendorMatch = filament.vendor?.toLowerCase() === selectedBrand.toLowerCase();
        if (!vendorMatch) return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = filament.product_title?.toLowerCase().includes(search) ||
                           filament.display_name?.toLowerCase().includes(search);
        const matchesVendor = filament.vendor?.toLowerCase().includes(search);
        const matchesUrl = filament.product_url?.toLowerCase().includes(search);
        if (!matchesName && !matchesVendor && !matchesUrl) return false;
      }

      // Regional URL filter
      if (regionalUrlFilter) {
        if (regionalUrlFilter === 'any') {
          // Has any regional URL
          if (!filament.has_regional_urls) return false;
        } else {
          // Has URL for specific region
          const regions = filament.available_regions || [];
          if (!regions.includes(regionalUrlFilter)) return false;
        }
      }

      // Missing URLs filter
      if (showMissingUrls) {
        if (filament.has_regional_urls === true) return false;
      }

      return true;
    });
  }, [filaments, searchTerm, selectedBrand, regionalUrlFilter, showMissingUrls]);

  // Group by vendor and calculate regional coverage
  const groupedByBrand = useMemo(() => {
    const groups: Record<string, { filaments: FilamentRecord[]; coverage: RegionCode[] }> = {};

    filteredFilaments.forEach((filament) => {
      const brand = filament.vendor || 'Unknown';
      if (!groups[brand]) {
        groups[brand] = { filaments: [], coverage: [] };
      }
      groups[brand].filaments.push(filament);
      
      // Aggregate regional coverage for the brand
      if (filament.available_regions) {
        filament.available_regions.forEach((region) => {
          if (!groups[brand].coverage.includes(region as RegionCode)) {
            groups[brand].coverage.push(region as RegionCode);
          }
        });
      }
    });

    // Sort brands alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredFilaments]);

  const handleSyncBrand = (brandSlug: string) => {
    syncBrand(brandSlug, 'filament');
  };

  const handleSyncProduct = (id: string) => {
    syncSingle(id, 'filament');
  };

  const handleSyncBrandAllRegions = (brandSlug: string) => {
    // For now, same as regular sync - can be enhanced later
    syncBrand(brandSlug, 'filament');
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
        <p className="text-destructive">Error loading filaments: {error.message}</p>
      </div>
    );
  }

  if (groupedByBrand.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          icon={Package}
          title="No filaments found"
          message={searchTerm || selectedBrand || regionalUrlFilter || showMissingUrls
            ? "No filaments match your current filters. Try adjusting your search or filter options."
            : "No filaments in the database yet."
          }
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Showing {filteredFilaments.length} filaments across {groupedByBrand.length} brands
      </p>
      {groupedByBrand.map(([brandName, { filaments: brandFilaments, coverage }]) => {
        const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-');
        const products: ProductRow[] = brandFilaments.map((f) => ({
          id: f.id,
          displayName: f.display_name || f.product_title,
          productTitle: f.product_title,
          material: f.material,
          productUrl: f.product_url,
          msrp: f.msrp,
          currentPrice: f.variant_price,
          lastSyncedAt: f.last_scraped_at,
          syncStatus: f.sync_status,
          syncError: f.last_sync_error,
        }));

        return (
          <BrandSection
            key={brandName}
            brandName={brandName}
            brandSlug={brandSlug}
            productCount={brandFilaments.length}
            onSyncBrand={handleSyncBrand}
            isSyncing={isBrandSyncing(brandSlug, 'filament')}
            defaultExpanded={groupedByBrand.length === 1}
            regionalCoverage={coverage}
            onSyncBrandAllRegions={handleSyncBrandAllRegions}
          >
            <ProductTable
              products={products}
              type="filament"
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
