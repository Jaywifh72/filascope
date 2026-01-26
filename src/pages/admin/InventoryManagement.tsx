import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, Keyboard } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { GlobalActionsBar } from '@/components/admin/inventory/GlobalActionsBar';
import { SearchAndFilterBar } from '@/components/admin/inventory/SearchAndFilterBar';
import { FilamentsInventoryTab } from '@/components/admin/inventory/FilamentsInventoryTab';
import { PrintersInventoryTab } from '@/components/admin/inventory/PrintersInventoryTab';
import { SyncStatusTab } from '@/components/admin/inventory/SyncStatusTab';
import { AddFilamentWizard } from '@/components/admin/inventory/AddFilamentWizard';
import { AddPrinterWizard } from '@/components/admin/inventory/AddPrinterWizard';
import { InventoryErrorBoundary } from '@/components/admin/inventory/InventoryErrorBoundary';
import { AdminRegionProvider, useAdminRegion } from '@/contexts/AdminRegionContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { usePriceSync } from '@/hooks/usePriceSync';
import { useInventoryKeyboardShortcuts } from '@/hooks/useInventoryKeyboardShortcuts';
import { RegionCode, CurrencyCode } from '@/types/regional';

type TabValue = 'filaments' | 'printers' | 'sync';

function InventoryManagementContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showAddFilamentWizard, setShowAddFilamentWizard] = useState(false);
  const [showAddPrinterWizard, setShowAddPrinterWizard] = useState(false);
  
  // Regional filter state
  const [regionalUrlFilter, setRegionalUrlFilter] = useState<RegionCode | 'any' | null>(null);
  const [showMissingUrls, setShowMissingUrls] = useState(false);

  const { syncAllFilaments, syncAllPrinters, isSyncing, lastSyncTime } = usePriceSync();
  
  // Admin region context
  const {
    selectedRegion,
    setSelectedRegion,
    viewCurrency,
    setViewCurrency,
    showAllRegions,
    setShowAllRegions,
  } = useAdminRegion();

  // Get active tab from URL, default to filaments
  const activeTab = (searchParams.get('tab') as TabValue) || 'filaments';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Keyboard shortcuts
  const handleAddFilament = useCallback(() => {
    setShowAddFilamentWizard(true);
  }, []);

  const handleAddPrinter = useCallback(() => {
    setShowAddPrinterWizard(true);
  }, []);

  useInventoryKeyboardShortcuts({
    activeTab,
    onAddFilament: handleAddFilament,
    onAddPrinter: handleAddPrinter,
  });

  // Fetch brands for dropdown
  const { data: brands = [] } = useQuery({
    queryKey: ['automated-brands-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('automated_brands')
        .select('brand_name, brand_slug')
        .eq('scraping_enabled', true)
        .order('brand_name');
      return data || [];
    },
  });

  const handleSyncFilaments = (regions?: RegionCode[] | null) => {
    if (!isSyncing) {
      syncAllFilaments({ regions, limit: 50 });
    }
  };

  const handleSyncPrinters = (regions?: RegionCode[] | null) => {
    if (!isSyncing) {
      syncAllPrinters({ regions, limit: 50 });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        title="Inventory Management"
        description="Manage filaments, printers, and sync operations"
        icon={Package}
        iconColor="text-cyan-500"
      />

      <GlobalActionsBar
        onSyncFilaments={handleSyncFilaments}
        onSyncPrinters={handleSyncPrinters}
        onAddFilament={handleAddFilament}
        onAddPrinter={handleAddPrinter}
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        viewCurrency={viewCurrency}
        onCurrencyChange={setViewCurrency}
        showAllRegions={showAllRegions}
        onShowAllRegionsChange={setShowAllRegions}
      />

      <SearchAndFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedBrand={selectedBrand}
        onBrandChange={setSelectedBrand}
        brands={brands}
        regionalUrlFilter={regionalUrlFilter}
        onRegionalUrlFilterChange={setRegionalUrlFilter}
        showMissingUrls={showMissingUrls}
        onShowMissingUrlsChange={setShowMissingUrls}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="filaments">Filaments</TabsTrigger>
            <TabsTrigger value="printers">Printers</TabsTrigger>
            <TabsTrigger value="sync">Sync Status</TabsTrigger>
          </TabsList>
          
          {/* Keyboard shortcuts hint */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                <Keyboard className="w-3 h-3" />
                <span>Shortcuts</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-1 text-xs">
                <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">⌘N</kbd> Add Filament (Filaments tab)</p>
                <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">⌘⇧N</kbd> Add Printer (Printers tab)</p>
                <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> Close modal</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        <TabsContent value="filaments">
          <InventoryErrorBoundary fallbackTitle="Error loading filaments">
            <FilamentsInventoryTab
              searchTerm={searchTerm}
              selectedBrand={selectedBrand}
              selectedRegion={selectedRegion}
              regionalUrlFilter={regionalUrlFilter}
              showMissingUrls={showMissingUrls}
            />
          </InventoryErrorBoundary>
        </TabsContent>

        <TabsContent value="printers">
          <InventoryErrorBoundary fallbackTitle="Error loading printers">
            <PrintersInventoryTab
              searchTerm={searchTerm}
              selectedBrand={selectedBrand}
              selectedRegion={selectedRegion}
              regionalUrlFilter={regionalUrlFilter}
              showMissingUrls={showMissingUrls}
            />
          </InventoryErrorBoundary>
        </TabsContent>

        <TabsContent value="sync">
          <InventoryErrorBoundary fallbackTitle="Error loading sync status">
            <SyncStatusTab />
          </InventoryErrorBoundary>
        </TabsContent>
      </Tabs>

      <AddFilamentWizard
        open={showAddFilamentWizard}
        onOpenChange={setShowAddFilamentWizard}
      />

      <AddPrinterWizard
        open={showAddPrinterWizard}
        onOpenChange={setShowAddPrinterWizard}
      />
    </div>
  );
}

export default function InventoryManagement() {
  return (
    <AdminLayout>
      <AdminRegionProvider>
        <InventoryManagementContent />
      </AdminRegionProvider>
    </AdminLayout>
  );
}
