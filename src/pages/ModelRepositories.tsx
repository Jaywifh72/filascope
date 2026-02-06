import { Box } from "lucide-react";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

const ModelRepositories = () => (
  <FeatureComingSoon
    featureName="Model Repositories"
    description="Curated links to the best 3D model sources — find printable models across all major platforms in one place."
    icon={<Box className="w-7 h-7" />}
    details={[
      "Aggregated search across top model sites",
      "Material and printer requirement tags",
      "Curated collections by category and difficulty",
      "Community ratings and print success reports",
    ]}
  />
);

export default ModelRepositories;
