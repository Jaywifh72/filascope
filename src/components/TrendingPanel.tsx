import { X, Flame, TrendingUp, Users, Clock, Sparkles, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingMaterial } from "@/hooks/useTrendingMaterials";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTab: 'week' | 'month' | 'all-time';
  onTabChange: (tab: 'week' | 'month' | 'all-time') => void;
  activeTrends: TrendingMaterial[];
  predictions: TrendingMaterial[];
  isLoading: boolean;
  error: Error | null;
  viewedTrendIds: string[];
}

const VELOCITY_COLORS: Record<string, string> = {
  rising_fast: "text-emerald-400",
  rising: "text-green-400",
  steady: "text-cyan-400",
  plateau: "text-amber-400",
};

export function TrendingPanel({
  isOpen,
  onClose,
  selectedTab,
  onTabChange,
  activeTrends,
  predictions,
  isLoading,
  error,
  viewedTrendIds
}: TrendingPanelProps) {
  const navigate = useNavigate();
  
  if (!isOpen) return null;
  
  const handleTrendClick = (trend: TrendingMaterial) => {
    if (trend.article_url) {
      window.open(trend.article_url, '_blank');
    } else if (trend.material_filter) {
      navigate(`/?material=${encodeURIComponent(trend.material_filter)}`);
      onClose();
    }
  };
  
  const handleExplore = (trend: TrendingMaterial, e: React.MouseEvent) => {
    e.stopPropagation();
    if (trend.related_content_url) {
      navigate(trend.related_content_url);
      onClose();
    } else if (trend.material_filter) {
      navigate(`/?material=${encodeURIComponent(trend.material_filter)}`);
      onClose();
    }
  };
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#1A1F2E] z-[1000]",
          "flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.5)]",
          "animate-slide-in-from-right"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trending-panel-title"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 bg-orange-400/8 border-b-2 border-orange-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="h-7 w-7 text-orange-400 animate-flame-flicker" />
              <div>
                <h2 id="trending-panel-title" className="text-xl font-bold text-foreground">
                  Trending This Week
                </h2>
                <p className="text-sm text-muted-foreground">
                  Popular materials in the community
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className={cn(
                "relative w-10 h-10 flex items-center justify-center rounded-lg",
                "bg-white/8 border border-white/15 hover:bg-white/15 hover:border-white/30",
                "transition-all duration-200"
              )}
              aria-label="Close trending panel"
            >
              <X className="h-5 w-5 text-muted-foreground" />
              <span className="absolute bottom-0.5 right-1 text-[10px] text-muted-foreground/60">
                ESC
              </span>
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4">
            {(['week', 'month', 'all-time'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  selectedTab === tab
                    ? "bg-orange-400/20 text-orange-400 border border-orange-400/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {tab === 'week' ? 'This Week' : tab === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-orange-400/40 scrollbar-track-white/5">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState />
          ) : activeTrends.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {activeTrends.map((trend, index) => (
                <TrendingCard
                  key={trend.id}
                  trend={trend}
                  rank={index + 1}
                  isNew={!viewedTrendIds.includes(trend.id)}
                  onClick={() => handleTrendClick(trend)}
                  onExplore={(e) => handleExplore(trend, e)}
                />
              ))}
              
              {/* Predictions Section */}
              {predictions.length > 0 && (
                <>
                  <div className="flex items-center gap-2 pt-4 pb-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-semibold text-purple-400">
                      Predicted Next Week
                    </span>
                  </div>
                  {predictions.map((trend, index) => (
                    <TrendingCard
                      key={trend.id}
                      trend={trend}
                      rank={activeTrends.length + index + 1}
                      isNew={!viewedTrendIds.includes(trend.id)}
                      isPrediction
                      onClick={() => handleTrendClick(trend)}
                      onExplore={(e) => handleExplore(trend, e)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface TrendingCardProps {
  trend: TrendingMaterial;
  rank: number;
  isNew: boolean;
  isPrediction?: boolean;
  onClick: () => void;
  onExplore: (e: React.MouseEvent) => void;
}

function TrendingCard({ trend, rank, isNew, isPrediction, onClick, onExplore }: TrendingCardProps) {
  const velocityColor = trend.trend_velocity ? VELOCITY_COLORS[trend.trend_velocity] || "text-cyan-400" : "text-cyan-400";
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-5 rounded-xl cursor-pointer transition-all duration-200",
        "bg-white/3 border border-white/8",
        "hover:bg-white/5 hover:border-orange-400/30 hover:-translate-x-1 hover:shadow-lg"
      )}
    >
      {/* Rank Badge */}
      {rank <= 3 && !isPrediction && (
        <div className={cn(
          "absolute -top-2 -left-2 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-background",
          "bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg shadow-orange-400/40"
        )}>
          #{rank}
        </div>
      )}
      
      {/* NEW Badge */}
      {isNew && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white bg-gradient-to-r from-red-500 to-red-600 rounded-md shadow-lg animate-subtle-pulse">
          NEW
        </div>
      )}
      
      {/* Content */}
      <div className={cn(rank <= 3 && !isPrediction && "ml-4")}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-semibold text-foreground leading-tight">
            {trend.title}
          </h3>
          {isPrediction && (
            <Sparkles className="h-4 w-4 text-purple-400 flex-shrink-0" />
          )}
        </div>
        
        {/* Category Badge */}
        {trend.material_filter && (
          <span className="inline-flex px-2.5 py-1 text-[11px] font-semibold rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 mb-3">
            {trend.material_filter}
          </span>
        )}
        
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {trend.extended_context || trend.context || trend.description}
        </p>
        
        {/* Metrics */}
        <div className="flex flex-wrap gap-3 mb-4">
          {trend.search_increase_percent && (
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className={cn("h-4 w-4", velocityColor)} />
              <span className="text-emerald-400 font-semibold">
                +{trend.search_increase_percent}%
              </span>
            </div>
          )}
          
          {trend.upvote_count && trend.upvote_count > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-blue-400">
              <Users className="h-4 w-4" />
              <span>{trend.upvote_count} makers agree</span>
            </div>
          )}
          
          {trend.week_of && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Week of {new Date(trend.week_of).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        {/* Why Now */}
        {trend.why_now && (
          <div className="text-xs text-amber-400/80 italic mb-4">
            💡 {trend.why_now}
          </div>
        )}
        
        {/* CTA */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
          <button
            onClick={onExplore}
            className={cn(
              "flex-1 h-9 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold",
              "border border-orange-400/40 text-orange-400",
              "hover:bg-orange-400/12 hover:border-orange-400 transition-all"
            )}
          >
            Explore
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          
          {trend.related_content_count && trend.related_content_count > 0 && (
            <span className="text-xs text-muted-foreground px-3">
              {trend.related_content_count} products
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-5 rounded-xl bg-white/3 border border-white/8">
          <Skeleton className="h-5 w-3/4 mb-3" />
          <Skeleton className="h-6 w-16 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="flex gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <p className="text-base text-muted-foreground">No trending materials right now</p>
      <p className="text-sm text-muted-foreground/70 mt-2">Check back soon for community trends</p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-12 h-12 rounded-full bg-orange-400/10 flex items-center justify-center mb-4">
        <Flame className="h-6 w-6 text-orange-400" />
      </div>
      <p className="text-base text-muted-foreground">Unable to load trending data</p>
      <p className="text-sm text-muted-foreground/70 mt-2">Please try again later</p>
    </div>
  );
}
