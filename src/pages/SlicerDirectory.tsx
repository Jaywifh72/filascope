import { Layers } from "lucide-react";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

const SlicerDirectory = () => (
  <FeatureComingSoon
    featureName="Slicer Directory"
    description="Compare slicer software features, compatibility, and community ratings to find the perfect slicer for your workflow."
    icon={<Layers className="w-7 h-7" />}
    details={[
      "Feature-by-feature slicer comparisons",
      "Printer compatibility matrices",
      "Plugin and profile ecosystem ratings",
      "Community reviews and workflow tips",
    ]}
  />
);

export default SlicerDirectory;
