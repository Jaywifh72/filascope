import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiRegionComparison } from '@/components/admin/region-test/MultiRegionComparison';
import { StoreRegionAuditTable } from '@/components/admin/region-test/StoreRegionAuditTable';
import { AutomatedSpotCheck } from '@/components/admin/region-test/AutomatedSpotCheck';
import { PriceVerificationMatrix } from '@/components/admin/region-test/PriceVerificationMatrix';
import { RegionTestExport } from '@/components/admin/region-test/RegionTestExport';
import { Globe, ArrowRightLeft, Table2, Zap, Download } from 'lucide-react';

const AdminRegionTest = () => {
  const [activeTab, setActiveTab] = useState('comparison');

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <AdminPageHeader
            title="Regional Pricing Test Dashboard"
            description="Verify pricing accuracy across all regions and currencies"
            icon={Globe}
            iconColor="text-cyan-500"
          />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Region Comparison</span>
                <span className="sm:hidden">Compare</span>
              </TabsTrigger>
              <TabsTrigger value="matrix" className="flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                <span className="hidden sm:inline">Price Matrix</span>
                <span className="sm:hidden">Matrix</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Store Audit</span>
                <span className="sm:hidden">Audit</span>
              </TabsTrigger>
              <TabsTrigger value="spotcheck" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Spot Check</span>
                <span className="sm:hidden">Check</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Export</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="comparison" className="mt-0">
                <MultiRegionComparison />
              </TabsContent>

              <TabsContent value="matrix" className="mt-0">
                <PriceVerificationMatrix />
              </TabsContent>

              <TabsContent value="audit" className="mt-0">
                <StoreRegionAuditTable />
              </TabsContent>

              <TabsContent value="spotcheck" className="mt-0">
                <AutomatedSpotCheck />
              </TabsContent>

              <TabsContent value="export" className="mt-0">
                <RegionTestExport />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRegionTest;
