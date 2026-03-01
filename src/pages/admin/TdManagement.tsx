import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TdStatsHeader } from '@/components/admin/td-management/TdStatsHeader';
import { TdFilamentsTable } from '@/components/admin/td-management/TdFilamentsTable';
import { TdReferenceTable } from '@/components/admin/td-management/TdReferenceTable';
import { TdPopulationLog } from '@/components/admin/td-management/TdPopulationLog';
import { TdActionToolbar } from '@/components/admin/td-management/TdActionToolbar';
import { TdSubmissionsReviewPanel } from '@/components/admin/td-management/TdSubmissionsReviewPanel';

export default function TdManagement() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">TD Value Management</h1>
        <p className="text-sm text-muted-foreground">Manage HueForge Transmission Distance values across all filaments</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="filaments">Filaments</TabsTrigger>
          <TabsTrigger value="reference">Reference Values</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="log">Population Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4">
            <TdActionToolbar />
            <TdStatsHeader />
          </div>
        </TabsContent>

        <TabsContent value="filaments">
          <TdFilamentsTable />
        </TabsContent>

        <TabsContent value="reference">
          <TdReferenceTable />
        </TabsContent>

        <TabsContent value="submissions">
          <TdSubmissionsReviewPanel />
        </TabsContent>

        <TabsContent value="log">
          <TdPopulationLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}