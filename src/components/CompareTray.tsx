import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GitCompare, ChevronUp, ChevronDown, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCompare } from "@/hooks/useCompare";
import { MiniFilamentCard } from "@/components/compare/MiniFilamentCard";
import { EmptySlot } from "@/components/compare/EmptySlot";

export function CompareTray() {
  const navigate = useNavigate();
  const trayRef = useRef<HTMLDivElement>(null);
  const { 
    items, 
    removeItem, 
    clearAll, 
    count, 
    maxItems, 
    isFull,
    isExpanded,
    setIsExpanded,
    setTrayElement,
    isGlowing
  } = useCompare();

  // Register tray element for fly animation targeting
  useEffect(() => {
    setTrayElement(trayRef.current);
    return () => setTrayElement(null);
  }, [setTrayElement]);

  // Don't render if no items
  if (count === 0) {
    return null;
  }

  const canCompare = count >= 2;

  const handleCompareNow = () => {
    if (canCompare) {
      const ids = items.map(i => i.id).join(',');
      navigate(`/compare?ids=${ids}`);
    }
  };

  const handleAddMore = () => {
    navigate('/');
  };

  // Build slots array
  const slots = [];
  
  // Add filled cards
  items.forEach((item) => {
    slots.push(
      <MiniFilamentCard 
        key={item.id} 
        item={item} 
        onRemove={removeItem}
      />
    );
  });
  
  // Add "Add More" slot if not full
  if (!isFull) {
    slots.push(
      <EmptySlot 
        key="add-more" 
        isAddMore 
        onClick={handleAddMore}
      />
    );
  }
  
  // Fill remaining with empty slots (up to 4 total)
  while (slots.length < maxItems) {
    slots.push(
      <EmptySlot 
        key={`empty-${slots.length}`} 
        isFull={isFull}
      />
    );
  }

  return (
    <div 
      ref={trayRef}
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-40",
        "w-[95vw] max-w-[1100px]",
        "bg-card/95 backdrop-blur-md",
        "border border-primary/20 rounded-xl",
        "shadow-[0_-4px_30px_rgba(0,0,0,0.4)]",
        "transition-all duration-300 ease-out",
        "compare-tray-enter",
        isGlowing && "tray-success-glow"
      )}
      role="region"
      aria-label={`Compare tray containing ${count} of ${maxItems} materials`}
    >
      {/* Collapsed View */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full h-14 px-4 flex items-center justify-between hover:bg-muted/20 transition-colors rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GitCompare className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium">
              Compare ({count})
            </span>
            {!canCompare && (
              <span className="text-xs text-muted-foreground">
                • Add {2 - count} more to compare
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {canCompare && (
              <span className="text-sm text-primary font-medium">
                View Comparison →
              </span>
            )}
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsExpanded(false)}
                className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
                aria-label="Collapse compare tray"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold">
                  Compare Tray
                </span>
                <span className="text-xs text-muted-foreground">
                  ({count}/{maxItems} items)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {count > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </button>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={handleCompareNow}
                      disabled={!canCompare}
                      className={cn(
                        "gap-2 font-semibold",
                        canCompare && "animate-pulse-once"
                      )}
                      size="sm"
                    >
                      Compare Now
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canCompare && (
                  <TooltipContent>
                    <p>Add at least 2 materials to compare</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {slots}
          </div>

          {/* Helper text */}
          {count === 1 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Add 1 more material to enable comparison
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default CompareTray;
