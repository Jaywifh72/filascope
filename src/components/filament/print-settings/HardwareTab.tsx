import { Flame, Package, Layers } from "lucide-react";
import { HardwareSearchList } from "./HardwareSearchList";
import { PrinterHardwareStatus } from "./PrinterHardwareStatus";
import { CompatibilityWarningBanner } from "./CompatibilityWarningBanner";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import type { Database } from "@/integrations/supabase/types";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];
type Printer = Database["public"]["Tables"]["printers"]["Row"];

interface HardwareItem {
  id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  product_url: string | null;
  price?: number | null;
  currency?: string | null;
  specs?: Record<string, unknown> | null;
  compatibility: {
    rating: 'green' | 'orange' | 'red';
    reason: string;
    details?: string[];
  };
}

interface HardwareTabProps {
  compatibleHotends: HardwareItem[];
  compatibleBuildPlates: HardwareItem[];
  compatibleAms: HardwareItem[];
  printerModel: string;
  printer?: Printer | null;
  filament?: Filament | null;
}

export function HardwareTab({
  compatibleHotends,
  compatibleBuildPlates,
  compatibleAms,
  printerModel,
  printer,
  filament,
}: HardwareTabProps) {
  const { getAffiliateUrl } = useAffiliateLinks();

  // Get recommended items (green rating)
  const recommendedHotends = compatibleHotends
    .filter(h => h.compatibility.rating === 'green')
    .slice(0, 3)
    .map(h => h.id);
    
  const recommendedPlates = compatibleBuildPlates
    .filter(p => p.compatibility.rating === 'green')
    .slice(0, 3)
    .map(p => p.id);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">
        Hardware Compatibility
      </h3>
      
      {/* Printer Hardware Status */}
      {printerModel && filament && (
        <PrinterHardwareStatus
          printerModel={printerModel}
          filamentMaterial={filament.material || ""}
          isAbrasive={filament.is_nozzle_abrasive || false}
          requiredNozzleTemp={filament.nozzle_temp_sweetspot_c || filament.nozzle_temp_max_c || 200}
        />
      )}
      
      {/* Compatibility Warnings */}
      {printer && filament && (
        <CompatibilityWarningBanner
          printer={printer}
          filament={filament}
        />
      )}
      
      {/* Hotends */}
      <HardwareSearchList
        title="Compatible Hotends"
        icon={<Flame className="w-4 h-4 text-primary" />}
        items={compatibleHotends}
        printerStatus={compatibleHotends.length > 0 
          ? "Standard brass hotend works perfectly" 
          : "Check hotend compatibility"}
        recommendedItems={recommendedHotends}
        detailPath="/hotends"
        emptyMessage="No hotends found for this printer"
        getAffiliateUrl={getAffiliateUrl}
        accessoryType="hotend"
      />
      
      {/* Build Plates */}
      <HardwareSearchList
        title="Compatible Build Plates"
        icon={<Package className="w-4 h-4 text-primary" />}
        items={compatibleBuildPlates}
        printerStatus="Multiple options work well"
        recommendedItems={recommendedPlates}
        detailPath="/build-plates"
        emptyMessage="No build plates found"
        getAffiliateUrl={getAffiliateUrl}
        accessoryType="build_plate"
      />
      
      {/* AMS/MMU Systems */}
      <HardwareSearchList
        title="Compatible AMS/MMU Systems"
        icon={<Layers className="w-4 h-4 text-primary" />}
        items={compatibleAms}
        printerStatus="Compatible with multi-material printing"
        detailPath="/ams"
        emptyMessage="No AMS/MMU systems found"
        getAffiliateUrl={getAffiliateUrl}
        accessoryType="ams_mmu"
      />
    </div>
  );
}
