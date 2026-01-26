import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BrandSection } from './BrandSection';
import { ProductTable, ProductRow } from './ProductTable';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

interface FilamentsInventoryTabProps {
  searchTerm: string;
  selectedBrand: string;
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
}

export function FilamentsInventoryTab({
  searchTerm,
  selectedBrand,
}: FilamentsInventoryTabProps) {
  const { data: filaments, isLoading, error } = useQuery({
    queryKey: ['admin-filaments'],
    queryFn: async () => {
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
          vendor
        `)
        .order('vendor')
        .order('product_title');

      if (error) throw error;
      return data as FilamentRecord[];
    },
  });

  // Filter filaments based on search term and selected brand
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

      return true;
    });
  }, [filaments, searchTerm, selectedBrand]);

  // Group by vendor
  const groupedByBrand = useMemo(() => {
    const groups: Record<string, FilamentRecord[]> = {};

    filteredFilaments.forEach((filament) => {
      const brand = filament.vendor || 'Unknown';
      if (!groups[brand]) {
        groups[brand] = [];
      }
      groups[brand].push(filament);
    });

    // Sort brands alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredFilaments]);

  const handleSyncBrand = (brandSlug: string) => {
    toast.info('Sync Brand', {
      description: `Syncing ${brandSlug} - Coming soon in Part 4`,
    });
  };

  const handleSyncProduct = (id: string) => {
    toast.info('Sync Product', {
      description: `Syncing product ${id} - Coming soon in Part 4`,
    });
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
          message={searchTerm || selectedBrand 
            ? "No filaments match your current filters. Try adjusting your search or brand filter."
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
      {groupedByBrand.map(([brandName, brandFilaments]) => {
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
            brandSlug={brandName.toLowerCase().replace(/\s+/g, '-')}
            productCount={brandFilaments.length}
            onSyncBrand={handleSyncBrand}
            defaultExpanded={groupedByBrand.length === 1}
          >
            <ProductTable
              products={products}
              type="filament"
              onSync={handleSyncProduct}
            />
          </BrandSection>
        );
      })}
    </div>
  );
}
