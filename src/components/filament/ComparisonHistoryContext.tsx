import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { History, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useComparisonHistory } from "@/hooks/useComparisonHistory";
import { formatDistanceToNow } from "date-fns";

interface ComparisonHistoryContextProps {
  currentFilamentId: string;
  currentFilamentName: string;
}

export function ComparisonHistoryContext({
  currentFilamentId,
  currentFilamentName
}: ComparisonHistoryContextProps) {
  const navigate = useNavigate();
  const { history } = useComparisonHistory();

  // Find comparisons involving this filament
  const relevantHistory = useMemo(() => {
    return history.filter(h => h.filamentIds.includes(currentFilamentId));
  }, [history, currentFilamentId]);

  // Get the most recent comparison with this filament
  const recentComparison = relevantHistory[0];
  
  // Get the "other" filament from the comparison
  const comparedWith = useMemo(() => {
    if (!recentComparison) return null;
    
    const otherIndex = recentComparison.filamentIds.findIndex(id => id !== currentFilamentId);
    if (otherIndex === -1) return null;
    
    return {
      id: recentComparison.filamentIds[otherIndex],
      name: recentComparison.filamentNames[otherIndex],
      timeAgo: formatDistanceToNow(recentComparison.createdAt, { addSuffix: true })
    };
  }, [recentComparison, currentFilamentId]);

  const handleViewComparison = () => {
    if (recentComparison) {
      const ids = recentComparison.filamentIds.join(",");
      navigate(`/materials/compare?ids=${ids}`);
    }
  };

  if (!comparedWith) return null;

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
      {/* Previous comparison */}
      <div className="flex items-start gap-2">
        <History className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/80">
            You previously compared this with:
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium text-primary truncate">
              {comparedWith.name}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              • {comparedWith.timeAgo}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs shrink-0"
          onClick={handleViewComparison}
        >
          View
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {/* Others also compared (simulated based on similar materials) */}
      {relevantHistory.length > 1 && (
        <div className="flex items-start gap-2 pt-2 border-t border-border/30">
          <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">
              Your other comparisons with this material:
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {relevantHistory.slice(1, 4).map((h, i) => {
                const otherName = h.filamentNames.find((_, idx) => h.filamentIds[idx] !== currentFilamentId);
                return (
                  <button
                    key={h.id}
                    onClick={() => navigate(`/materials/compare?ids=${h.filamentIds.join(",")}`)}
                    className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {otherName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
