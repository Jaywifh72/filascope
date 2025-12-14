import { TrendingModule } from "./TrendingModule";
import { SafetyAlertsModule } from "./SafetyAlertsModule";
import { DealsModule } from "./DealsModule";

interface EngagementSidebarProps {
  currentMaterialFilter?: string;
}

export function EngagementSidebar({ currentMaterialFilter }: EngagementSidebarProps) {
  return (
    <aside className="hidden lg:block w-80 xl:w-[320px] shrink-0">
      <div className="sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-1">
        {/* Priority 1: Safety Alerts (always first if present) */}
        <SafetyAlertsModule />

        {/* Priority 2: Trending This Week */}
        <TrendingModule />

        {/* Priority 3: Best Deals Today */}
        <DealsModule />
      </div>
    </aside>
  );
}
