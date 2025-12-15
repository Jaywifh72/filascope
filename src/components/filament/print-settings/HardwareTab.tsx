import { Flame, Package, Layers } from "lucide-react";
import { HardwareSearchList } from "./HardwareSearchList";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";

interface HardwareItem {
  id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  product_url: string | null;
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
}

export function HardwareTab({
  compatibleHotends,
  compatibleBuildPlates,
  compatibleAms,
  printerModel,
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
      />
    </div>
  );
}
