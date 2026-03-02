import { useState } from "react";
import { Handshake } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AffiliateStatsCards } from "@/components/admin/affiliates/AffiliateStatsCards";
import { ProgramsTab } from "@/components/admin/affiliates/ProgramsTab";
import { DiscountCodesTab } from "@/components/admin/affiliates/DiscountCodesTab";

export default function Affiliates() {
  const [activeTab, setActiveTab] = useState("programs");

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Affiliate Management"
        description="Manage affiliate programs, discount codes, and track performance"
        icon={Handshake}
      />

      <AffiliateStatsCards />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="codes">Discount Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="programs">
          <ProgramsTab />
        </TabsContent>

        <TabsContent value="codes">
          <DiscountCodesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
