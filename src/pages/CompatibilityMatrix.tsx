import { Grid3X3 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

const CompatibilityMatrix = () => (
  <>
    <Helmet>
      <title>Filament Compatibility Matrix | FilaScope</title>
      <meta name="description" content="Check filament compatibility with your 3D printer. Select your printer model to see recommended materials, temperatures, and settings." />
      <meta property="og:description" content="Check filament compatibility with your 3D printer. Select your printer model to see recommended materials, temperatures, and settings." />
    </Helmet>
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
