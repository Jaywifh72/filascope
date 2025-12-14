import { Flame, ArrowUp, ChevronRight } from "lucide-react";
import { SidebarModule } from "./SidebarModule";
import { useTrendingMaterials } from "@/hooks/useTrendingMaterials";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export function TrendingModule() {
  const { data: trending, isLoading, error } = useTrendingMaterials();
  const navigate = useNavigate();

  const handleMaterialClick = (materialFilter: string | null) => {
    if (materialFilter) {
      navigate(`/?material=${encodeURIComponent(materialFilter)}`);
    }
  };

  // Get the most recent update time
  const lastUpdated = trending?.[0]?.updated_at
    ? formatDistanceToNow(new Date(trending[0].updated_at), { addSuffix: true })
    : null;

  return (
    <SidebarModule
      icon={<Flame className="h-5 w-5" />}
      title="Trending This Week"
      isLoading={isLoading}
      isEmpty={!trending || trending.length === 0}
      emptyMessage="No trending materials this week"
      accentColor="orange"
      className="bg-gradient-to-br from-orange-950/20 to-transparent"
      headerAction={
        lastUpdated && (
          <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
        )
      }
    >
      <div className="space-y-4">
        {trending?.map((item, index) => (
          <div key={item.id}>
            {index > 0 && (
              <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground/50">
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => handleMaterialClick(item.material_filter)}
                className="text-left w-full group"
              >
                <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
              </button>
              
              {item.search_increase_percent && (
                <div className="flex items-center gap-1 text-cyan-400 text-sm font-semibold">
                  <ArrowUp className="h-3.5 w-3.5" />
                  <span>+{item.search_increase_percent}%</span>
                  <span className="text-muted-foreground font-normal ml-1">
                    {item.context || "this week"}
                  </span>
                </div>
              )}

              <button
                onClick={() => handleMaterialClick(item.material_filter)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-2"
              >
                Explore materials
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        {/* View all trends link */}
        <button
          onClick={() => navigate("/?sort=trending")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center pt-2"
        >
          View all trends
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </SidebarModule>
  );
}
