import { Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useComparisonHistory } from "@/hooks/useComparisonHistory";
import { useCompare } from "@/hooks/useCompare";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ComparisonHistoryBannerProps {
  currentMaterial?: string | null;
}

export function ComparisonHistoryBanner({
  currentMaterial,
}: ComparisonHistoryBannerProps) {
  const { history } = useComparisonHistory();
  const { addItem, clearAll, items } = useCompare();

  // Find a relevant recent comparison (matching material or recent)
  const relevantComparison = history.find((h) => {
    // Check if any filament names contain the current material
    if (currentMaterial) {
      return h.filamentNames.some((name) =>
        name.toLowerCase().includes(currentMaterial.toLowerCase())
      );
    }
    return true;
  });

  if (!relevantComparison) return null;

  const timeAgo = formatDistanceToNow(new Date(relevantComparison.createdAt), {
    addSuffix: true,
  });

  const handleRestore = async () => {
    // Clear current items first if any
    if (items.length > 0) {
      clearAll();
    }

    // Fetch filaments and add them
    // Note: We can't restore directly, so we show a toast with the IDs
    toast.success("View your previous comparison", {
      description: `${relevantComparison.filamentNames.length} materials from ${timeAgo}`,
      action: {
        label: "Open Compare",
        onClick: () => {
          // Navigate to compare with ids
          window.location.href = `/compare?ids=${relevantComparison.filamentIds.join(",")}`;
        },
      },
    });
  };

  // Don't show if too old (more than 7 days)
  const daysOld = Math.floor(
    (Date.now() - new Date(relevantComparison.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (daysOld > 7) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground/80">
          You compared {relevantComparison.filamentNames.length} materials{" "}
          {timeAgo}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          {relevantComparison.filamentNames.slice(0, 3).map((name, idx) => (
            <span
              key={idx}
              className="text-xs text-muted-foreground truncate max-w-[100px]"
            >
              {idx > 0 && "• "}
              {name.split(" ").slice(0, 2).join(" ")}
            </span>
          ))}
          {relevantComparison.filamentNames.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{relevantComparison.filamentNames.length - 3} more
            </span>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        className="border-primary/30 text-primary hover:bg-primary/10 flex-shrink-0"
      >
        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
        Compare Again
      </Button>
    </div>
  );
}
