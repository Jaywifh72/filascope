import { Grid3X3 } from "lucide-react";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

const CompatibilityMatrix = () => (
  <>
    <DocumentHead
      title="Filament Compatibility Matrix | FilaScope"
      description="Check filament compatibility with your 3D printer. Select your printer model to see recommended materials, temperatures, and settings."
      ogDescription="Check filament compatibility with your 3D printer. Select your printer model to see recommended materials, temperatures, and settings."
    />
    <FeatureComingSoon
      featureName="Compatibility Matrix"
      description="Find which filaments work best with your printer — powered by real compatibility data and community testing."
      icon={<Grid3X3 className="w-7 h-7" />}
      details={[
        "Printer-to-filament compatibility scores",
        "Temperature and hardware requirement checks",
        "AMS and multi-material system support indicators",
        "Community-verified print success ratings",
      ]}
    />
  </>
);

export default CompatibilityMatrix;
