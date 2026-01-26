import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { GlobalActionsBar } from '@/components/admin/inventory/GlobalActionsBar';
import { SearchAndFilterBar } from '@/components/admin/inventory/SearchAndFilterBar';
import { FilamentsInventoryTab } from '@/components/admin/inventory/FilamentsInventoryTab';
import { PrintersInventoryTab } from '@/components/admin/inventory/PrintersInventoryTab';
import { SyncStatusTab } from '@/components/admin/inventory/SyncStatusTab';
import { AddFilamentWizard } from '@/components/admin/inventory/AddFilamentWizard';
import { AddPrinterWizard } from '@/components/admin/inventory/AddPrinterWizard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { usePriceSync } from '@/hooks/usePriceSync';

type TabValue = 'filaments' | 'printers' | 'sync';

export default function InventoryManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showAddFilamentWizard, setShowAddFilamentWizard] = useState(false);
  const [showAddPrinterWizard, setShowAddPrinterWizard] = useState(false);

  const { syncAllFilaments, syncAllPrinters, isSyncing, lastSyncTime } = usePriceSync();

  // Get active tab from URL, default to filaments
  const activeTab = (searchParams.get('tab') as TabValue) || 'filaments';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

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

  const handleSyncFilaments = () => {
    if (!isSyncing) {
      syncAllFilaments(50);
    }
  };

  const handleSyncPrinters = () => {
    if (!isSyncing) {
      syncAllPrinters(50);
    }
  };

  const handleAddFilament = () => {
    setShowAddFilamentWizard(true);
  };

  const handleAddPrinter = () => {
    setShowAddPrinterWizard(true);
  };

  return (
    <AdminLayout>
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
        />

        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedBrand={selectedBrand}
          onBrandChange={setSelectedBrand}
          brands={brands}
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="filaments">Filaments</TabsTrigger>
            <TabsTrigger value="printers">Printers</TabsTrigger>
            <TabsTrigger value="sync">Sync Status</TabsTrigger>
          </TabsList>

          <TabsContent value="filaments">
            <FilamentsInventoryTab
              searchTerm={searchTerm}
              selectedBrand={selectedBrand}
            />
          </TabsContent>

          <TabsContent value="printers">
            <PrintersInventoryTab
              searchTerm={searchTerm}
              selectedBrand={selectedBrand}
            />
          </TabsContent>

          <TabsContent value="sync">
            <SyncStatusTab />
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
    </AdminLayout>
  );
}
