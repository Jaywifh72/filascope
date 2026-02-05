import { memo } from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingProgressProps {
  loaded: number;
  total: number | null;
  phase?: "fetching" | "processing" | "rendering";
  className?: string;
}

const PHASE_LABELS: Record<string, string> = {
  fetching: "Fetching Data",
  processing: "Processing",
  rendering: "Rendering",
};

/**
 * Progressive loading indicator with item count and phase display.
 * Shows progress during long data fetches to keep users informed.
 */
export const LoadingProgress = memo(function LoadingProgress({
  loaded,
  total,
  phase = "fetching",
  className,
}: LoadingProgressProps) {
  const progressPercent = total && total > 0 ? Math.min(100, (loaded / total) * 100) : 0;
  const hasTotal = total !== null && total > 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4",
        className
      )}
    >
      {/* Animated loader icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
        <div className="relative bg-card/80 border border-border/60 rounded-full p-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>

      {/* Phase indicator */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs uppercase tracking-wider text-primary font-semibold">
          {PHASE_LABELS[phase] || phase}
        </span>
        <span className="flex gap-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
        </span>
      </div>

      {/* Progress text */}
      <p className="text-lg font-medium text-foreground mb-2">
        {hasTotal ? (
          <>
            Loading <span className="text-primary font-bold">{loaded.toLocaleString()}</span> of{" "}
            <span className="text-primary font-bold">{total.toLocaleString()}</span> products
          </>
        ) : (
          <>
            Loaded <span className="text-primary font-bold">{loaded.toLocaleString()}</span> products
          </>
        )}
      </p>

      {/* Progress bar */}
      {hasTotal && (
        <div className="w-full max-w-xs">
          <Progress value={progressPercent} className="h-2 bg-muted/50" />
          <p className="text-center text-xs text-muted-foreground mt-2">
            {Math.round(progressPercent)}% complete
          </p>
        </div>
      )}

      {/* Helpful tip */}
      <p className="text-xs text-muted-foreground mt-4 max-w-sm text-center">
        {loaded > 3000
          ? "Almost there! Processing a large catalog."
          : "Loading your filament catalog..."}
      </p>
    </div>
  );
});

export default LoadingProgress;
