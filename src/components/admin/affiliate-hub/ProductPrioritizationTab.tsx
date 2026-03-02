import { PrioritySettingsCard } from "./PrioritySettingsCard";
import { BrandPriorityMatrix } from "./BrandPriorityMatrix";
import { CoverageGapAnalysis } from "./CoverageGapAnalysis";

export const ProductPrioritizationTab = () => {
  return (
    <div className="space-y-6">
      <PrioritySettingsCard />
      <BrandPriorityMatrix />
      <CoverageGapAnalysis />
    </div>
  );
};
