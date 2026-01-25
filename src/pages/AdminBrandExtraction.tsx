import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BrandExtractionConfig } from "@/components/admin/BrandExtractionConfig";
import { Wrench } from "lucide-react";

export default function AdminBrandExtraction() {
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <AdminPageHeader
            title="Price Extraction Config"
            description="Configure and monitor brand-specific price extraction patterns"
            icon={Wrench}
          />
          <BrandExtractionConfig />
        </div>
      </div>
    </AdminLayout>
  );
}
