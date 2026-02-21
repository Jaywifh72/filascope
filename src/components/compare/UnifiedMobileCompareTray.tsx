import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Trash2, X, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompare } from "@/hooks/useCompare";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MiniFilamentCard } from "./MiniFilamentCard";

/**
 * Mobile persistent bottom drawer for filament comparison.
 * Shows a compact bar at bottom; expands into a sheet with full details.
 */
export function UnifiedMobileCompareTray() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const {
    items: filamentItems,
    count: filamentCount,
    removeItem: removeFilament,
    clearAll: clearFilaments,
    maxItems: maxFilaments,
  } = useCompare();

  // Hide on compare pages
  const isOnComparePage =
    (location.pathname === "/compare" && new URLSearchParams(location.search).has("ids")) ||
    location.pathname === "/printers/compare";

  if (filamentCount === 0 || isOnComparePage) return null;

  const canCompare = filamentCount >= 2;
  const needMore = Math.max(0, 2 - filamentCount);
  const progressPercent = (filamentCount / maxFilaments) * 100;

  const handleCompare = () => {
    if (!canCompare) return;
    const ids = filamentItems.map((i) => i.id).join(",");
    navigate(`/compare?ids=${ids}`);
    setIsOpen(false);
  };

  return (
    <>
      {/* Sticky bottom bar */}
      <div
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-[70]",
          "bg-card/95 backdrop-blur-sm border-t border-border",
          "animate-in slide-in-from-bottom duration-300"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-full px-4 flex items-center justify-between"
          style={{ height: 64 }}
        >
          {/* Left: swatches */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center -space-x-1.5">
              {filamentItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="w-6 h-6 rounded-full border-2 border-card flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: item.color_hex || '#888' }}
                />
              ))}
            </div>
            <div className="text-left ml-2 min-w-0">
              <p className="text-sm font-medium truncate">
                {filamentCount} filament{filamentCount !== 1 ? "s" : ""}
              </p>
              {needMore > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Add {needMore} more to compare
                </p>
              )}
            </div>
          </div>

          {/* Right: CTA + chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              disabled={!canCompare}
              onClick={(e) => {
                e.stopPropagation();
                handleCompare();
              }}
              className={cn(
                "min-h-[40px] px-4 rounded-lg font-semibold",
                "bg-amber-500 hover:bg-amber-400 text-black"
              )}
            >
              Compare
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          </div>
        </button>
      </div>

      {/* Expanded sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl px-0">
          <SheetHeader className="px-4 pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base font-semibold">
                Building Comparison
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {filamentCount} of {maxFilaments}
                </span>
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="min-h-[44px] min-w-[44px]">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="mt-2 space-y-1">
              <Progress value={progressPercent} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {needMore > 0
                  ? `Add ${needMore} more to unlock side-by-side comparison`
                  : "Ready to compare!"}
              </p>
            </div>
          </SheetHeader>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="grid grid-cols-1 gap-3">
              {filamentItems.map((item, index) => (
                <MiniFilamentCard
                  key={item.id}
                  item={item}
                  onRemove={removeFilament}
                  cardIndex={index}
                />
              ))}
            </div>

            {filamentCount === 1 && (
              <p className="text-center text-sm text-muted-foreground mt-6">
                Add 1 more material to enable comparison
              </p>
            )}
          </div>

          {/* Bottom actions */}
          <div
            className="sticky bottom-0 px-4 py-4 bg-background border-t border-border space-y-3"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
          >
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilaments}
                className="flex-1 min-h-[44px] gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            </div>
            <Button
              onClick={handleCompare}
              disabled={!canCompare}
              className={cn(
                "w-full min-h-[48px] text-base font-semibold rounded-lg",
                "bg-amber-500 hover:bg-amber-400 text-black"
              )}
            >
              Compare {filamentCount} Filament{filamentCount !== 1 ? "s" : ""}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
