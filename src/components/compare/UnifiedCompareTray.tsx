import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompare } from "@/hooks/useCompare";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

/**
 * Persistent sticky bottom comparison drawer.
 * Collapsed: 72px with swatches + CTA. Expanded: ~180px with names + progress.
 */
export function UnifiedCompareTray() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    items: filamentItems,
    count: filamentCount,
    removeItem: removeFilament,
    clearAll: clearFilaments,
    maxItems: maxFilaments,
    isExpanded,
    setIsExpanded,
  } = useCompare();

  const { selectedPrinters, count: printerCount } = usePrinterCompare();

  const totalCount = filamentCount + printerCount;
  const [isNavigating, setIsNavigating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle visibility animation
  useEffect(() => {
    const isOnComparePage =
      (location.pathname === "/compare" && new URLSearchParams(location.search).has("ids")) ||
      location.pathname === "/printers/compare";

    if (filamentCount > 0 && !isOnComparePage) {
      setShouldRender(true);
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [filamentCount, location.pathname, location.search]);

  useEffect(() => {
    setIsNavigating(false);
  }, [location]);

  if (!shouldRender) return null;

  const canCompare = filamentCount >= 2;
  const progressPercent = (filamentCount / maxFilaments) * 100;
  const needMore = Math.max(0, 2 - filamentCount);

  const handleCompare = () => {
    if (!canCompare) return;
    setIsNavigating(true);
    const ids = filamentItems.map((i) => i.id).join(",");
    navigate(`/compare?ids=${ids}`);
  };

  return (
    <div
      className={cn(
        "hidden lg:block fixed bottom-0 left-0 right-0 z-[70]",
        "bg-card/95 backdrop-blur-sm border-t border-border",
        "transition-all duration-300 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
      role="region"
      aria-label="Comparison drawer"
    >
      {/* Collapsed bar — always visible, 72px */}
      <div
        className="max-w-[1400px] mx-auto px-6 flex items-center justify-between gap-4"
        style={{ height: 72 }}
      >
        {/* Left: color swatches with names */}
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-3 flex-1 min-w-0 overflow-x-auto">
            {filamentItems.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <div className="relative group/swatch flex-shrink-0 flex items-center gap-2">
                    {/* Color circle */}
                    <div
                      className="w-6 h-6 rounded-full border border-border flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: item.color_hex || '#888' }}
                    />
                    {/* Truncated name */}
                    <span className="text-xs text-foreground font-medium max-w-[80px] truncate hidden xl:inline">
                      {item.product_title}
                    </span>
                    {/* Remove X on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFilament(item.id);
                      }}
                      aria-label={`Remove ${item.product_title}`}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-muted border border-border flex items-center justify-center opacity-0 group-hover/swatch:opacity-100 transition-opacity hover:bg-destructive hover:border-destructive hover:text-white"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-medium">{item.product_title}</p>
                  {item.vendor && <p className="text-muted-foreground">{item.vendor}</p>}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        {/* Center: progress indicator */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[200px]">
          <span className="text-xs text-muted-foreground">
            {filamentCount} of {maxFilaments} selected
            {needMore > 0 && (
              <> — add {needMore} more to compare</>
            )}
          </span>
          <div className="w-full max-w-[160px]">
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFilaments}
            aria-label="Clear all"
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleCompare}
            disabled={!canCompare || isNavigating}
            className={cn(
              "h-10 px-6 rounded-lg font-bold text-sm",
              "bg-amber-500 hover:bg-amber-400 text-black",
              canCompare && !isNavigating && "shadow-[0_0_20px_-5px] shadow-amber-500/40"
            )}
          >
            {isNavigating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Compare {filamentCount} filament{filamentCount !== 1 ? "s" : ""}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded section — additional detail */}
      {isExpanded && filamentCount > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 pb-4 border-t border-border/30">
          <div className="flex flex-wrap gap-2 pt-3">
            {filamentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50"
              >
                {item.featured_image ? (
                  <img
                    src={getOptimizedImageUrl(item.featured_image, 48)}
                    alt=""
                    className="w-8 h-8 object-contain rounded"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color_hex || '#888' }}
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate max-w-[120px]">{item.product_title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{item.vendor} · {item.material || 'Filament'}</p>
                </div>
                <button
                  onClick={() => removeFilament(item.id)}
                  className="p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-colors text-muted-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
