import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Handshake, Plus } from "lucide-react";
import { useAffiliatePrograms } from "@/hooks/useAffiliatePrograms";
import { AffiliateSummaryStats } from "@/components/admin/affiliate-hub/AffiliateSummaryStats";
import { BrandAccordionItem } from "@/components/admin/affiliate-hub/BrandAccordionItem";
import { ProgramFormDialog } from "@/components/admin/affiliate-hub/ProgramFormDialog";

const AdminAffiliateHub = () => {
  const { data: programs = [], isLoading } = useAffiliatePrograms();
  const [createOpen, setCreateOpen] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof programs>();
    for (const p of programs) {
      const arr = map.get(p.brand_name) || [];
      arr.push(p);
      map.set(p.brand_name, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [programs]);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <AdminPageHeader
            title="Affiliate Hub"
            description="Manage affiliate programs, discount codes, campaigns, and performance across all brands and regions"
            icon={Handshake}
            iconColor="text-primary"
            actions={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Program
              </Button>
            }
          />

          <AffiliateSummaryStats />

          <Tabs defaultValue="programs">
            <TabsList>
              <TabsTrigger value="programs">Brand Programs</TabsTrigger>
              <TabsTrigger value="analytics">Click Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="programs" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : grouped.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">
                  No affiliate programs configured yet. Click "Add Program" to get started.
                </p>
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {grouped.map(([brandName, progs]) => (
                    <BrandAccordionItem key={brandName} brandName={brandName} programs={progs} />
                  ))}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <p className="text-muted-foreground text-center py-12">Click Analytics — coming soon.</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ProgramFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </AdminLayout>
  );
};

export default AdminAffiliateHub;
