import { BookOpen } from "lucide-react";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

const MaterialEncyclopedia = () => (
  <FeatureComingSoon
    featureName="Material Encyclopedia"
    description="Deep-dive reference for every 3D printing material type — from PLA basics to advanced engineering polymers."
    icon={<BookOpen className="w-7 h-7" />}
    details={[
      "Comprehensive profiles for 30+ material families",
      "Print settings, strengths, and best use cases",
      "Side-by-side material property comparisons",
      "Community tips and real-world applications",
    ]}
  />
);

export default MaterialEncyclopedia;
