import { Flame, ArrowUp, ChevronRight, Sparkles } from "lucide-react";
import { SidebarModule } from "./SidebarModule";
import { useTrendingMaterials } from "@/hooks/useTrendingMaterials";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { TrendSparkline } from "./TrendSparkline";
import { TrendUpvoteButton } from "./TrendUpvoteButton";
import { cn } from "@/lib/utils";

const velocityLabels: Record<string, { label: string; color: string }> = {
  rising_fast: { label: "Rising fast", color: "text-green-400" },
  rising: { label: "Rising", color: "text-green-400" },
  steady: { label: "Steady growth", color: "text-cyan-400" },
  plateauing: { label: "Plateauing", color: "text-yellow-400" },
  cooling: { label: "Cooling off", color: "text-red-400" },
};

export function TrendingModule() {
  const { activeTrends, predictions, isLoading, dataUpdatedAt } = useTrendingMaterials();
  const navigate = useNavigate();

  const handleMaterialClick = (materialFilter: string | null, url?: string | null) => {
    if (url) {
      navigate(url);
    } else if (materialFilter) {
      navigate(`/?material=${encodeURIComponent(materialFilter)}`);
    }
  };

  // Get the most recent update time
  const lastUpdated = dataUpdatedAt
    ? formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true })
    : null;

  return (
    <SidebarModule
      icon={<Flame className="h-5 w-5" />}
      title="Trending This Week"
      isLoading={isLoading}
      isEmpty={!activeTrends || activeTrends.length === 0}
      emptyMessage="No trending materials this week"
      accentColor="orange"
      className="bg-gradient-to-br from-orange-950/20 to-transparent"
      headerAction={
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="flex items-center gap-1 text-xs text-green-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="font-medium">Live</span>
          </div>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              {lastUpdated}
            </span>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {activeTrends?.map((item, index) => {
          const velocity = velocityLabels[item.trend_velocity || "steady"];
          const sparklineData = item.sparkline_data || [];

          return (
            <div key={item.id}>
              {index > 0 && (
                <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground/50">
                  <span className="h-1 w-1 rounded-full bg-current" />
                  <span className="h-1 w-1 rounded-full bg-current" />
                  <span className="h-1 w-1 rounded-full bg-current" />
                </div>
              )}
              <div className="space-y-2">
                {/* Title */}
                <button
                  onClick={() => handleMaterialClick(item.material_filter, item.related_content_url)}
                  className="text-left w-full group"
                >
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                </button>

                {/* Extended context */}
                {item.extended_context && (
                  <p className="text-xs text-muted-foreground">
                    {item.extended_context}
                  </p>
                )}

                {/* Stats row with sparkline */}
                <div className="flex items-center gap-3">
                  <TrendSparkline 
                    data={sparklineData} 
                    velocity={item.trend_velocity || "steady"} 
                  />
                  {item.search_increase_percent && (
                    <div className="flex items-center gap-1 text-cyan-400 text-sm font-semibold">
                      <ArrowUp className="h-3.5 w-3.5" />
                      <span>+{item.search_increase_percent}%</span>
                    </div>
                  )}
                  <span className={cn("text-xs font-medium", velocity.color)}>
                    {velocity.label}
                  </span>
                </div>

                {/* Why now explanation */}
                {item.why_now && (
                  <p className="text-xs text-amber-500/80 italic flex items-start gap-1">
                    <span>💡</span>
                    <span>{item.why_now}</span>
                  </p>
                )}

                {/* Upvote button */}
                <TrendUpvoteButton 
                  trendId={item.id} 
                  initialCount={item.upvote_count || 0} 
                />

                {/* Related content link */}
                {item.related_content_count && item.related_content_count > 0 && (
                  <button
                    onClick={() => handleMaterialClick(item.material_filter, item.related_content_url)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    See {item.related_content_count} {item.material_filter || ''} materials
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Predictions section */}
        {predictions && predictions.length > 0 && (
          <div className="border-t border-border/50 pt-3 mt-3">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Predicted next week
            </p>
            {predictions.slice(0, 1).map(prediction => (
              <button
                key={prediction.id}
                onClick={() => handleMaterialClick(prediction.material_filter)}
                className="text-left w-full group"
              >
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  {prediction.title}
                </span>
                {prediction.prediction_reason && (
                  <span className="text-xs text-muted-foreground ml-1">
                    — {prediction.prediction_reason}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

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
