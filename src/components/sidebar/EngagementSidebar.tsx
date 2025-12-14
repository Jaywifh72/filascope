import { TrendingModule } from "./TrendingModule";
import { SafetyAlertsModule } from "./SafetyAlertsModule";
import { DealsModule } from "./DealsModule";
import { WatchlistModule } from "./WatchlistModule";
import { RecentlyViewedModule } from "./RecentlyViewedModule";
import { ContextualModule } from "./ContextualModule";
import { useSidebarPreferences } from "@/hooks/useSidebarPreferences";

interface EngagementSidebarProps {
  currentMaterialFilter?: string;
}

const MODULE_COMPONENTS: Record<string, React.FC> = {
  safety: SafetyAlertsModule,
  watchlist: WatchlistModule,
  trending: TrendingModule,
  deals: DealsModule,
  recent: RecentlyViewedModule,
  contextual: ContextualModule,
};

export function EngagementSidebar({ currentMaterialFilter }: EngagementSidebarProps) {
  const { moduleOrder } = useSidebarPreferences();

  return (
    <aside className="hidden lg:block w-80 xl:w-[320px] shrink-0">
      <div className="sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-1">
        {moduleOrder.map((moduleName) => {
          const Component = MODULE_COMPONENTS[moduleName];
          if (!Component) return null;
          return <Component key={moduleName} />;
        })}
      </div>
    </aside>
  );
}
