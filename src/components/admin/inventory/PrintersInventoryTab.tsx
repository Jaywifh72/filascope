import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BrandSection } from './BrandSection';
import { ProductTable, ProductRow } from './ProductTable';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

interface PrintersInventoryTabProps {
  searchTerm: string;
  selectedBrand: string;
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
}

export function PrintersInventoryTab({
  searchTerm,
  selectedBrand,
}: PrintersInventoryTabProps) {
  const { data: printers, isLoading, error } = useQuery({
    queryKey: ['admin-printers'],
    queryFn: async () => {
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
          )
        `)
        .order('model_name');

      if (error) throw error;
      return data as PrinterRecord[];
    },
  });

  // Filter printers based on search term and selected brand
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

      return true;
    });
  }, [printers, searchTerm, selectedBrand]);

  // Group by brand
  const groupedByBrand = useMemo(() => {
    const groups: Record<string, PrinterRecord[]> = {};

    filteredPrinters.forEach((printer) => {
      const brandName = printer.printer_brands?.brand || 'Unknown';
      if (!groups[brandName]) {
        groups[brandName] = [];
      }
      groups[brandName].push(printer);
    });

    // Sort brands alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPrinters]);

  const handleSyncBrand = (brandSlug: string) => {
    toast.info('Sync Brand', {
      description: `Syncing ${brandSlug} - Coming soon in Part 4`,
    });
  };

  const handleEditProduct = (id: string) => {
    toast.info('Edit Printer', {
      description: `Edit printer ${id} - Coming soon`,
    });
  };

  const handleSyncProduct = (id: string) => {
    toast.info('Sync Printer', {
      description: `Syncing printer ${id} - Coming soon in Part 4`,
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
          message={searchTerm || selectedBrand 
            ? "No printers match your current filters. Try adjusting your search or brand filter."
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
      {groupedByBrand.map(([brandName, brandPrinters]) => {
        const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-');
        const products: ProductRow[] = brandPrinters.map((p) => ({
          id: p.id,
          displayName: p.display_name || p.model_name,
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
            defaultExpanded={groupedByBrand.length === 1}
          >
            <ProductTable
              products={products}
              type="printer"
              onEdit={handleEditProduct}
              onSync={handleSyncProduct}
            />
          </BrandSection>
        );
      })}
    </div>
  );
}
