import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GitCompare, ChevronUp, ChevronDown, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCompare } from "@/hooks/useCompare";
import { MiniFilamentCard } from "@/components/compare/MiniFilamentCard";
import { EmptySlot } from "@/components/compare/EmptySlot";
import { SuggestionChips } from "@/components/compare/SuggestionChips";
import { SwapModal } from "@/components/compare/SwapModal";

export function CompareTray() {
  const navigate = useNavigate();
  const location = useLocation();
  const trayRef = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const { 
    items, 
    removeItem, 
    clearAll, 
    addItem,
    count, 
    maxItems, 
    isFull,
    isExpanded,
    setIsExpanded,
    setTrayElement,
    isGlowing,
    lastAction,
    reorderItems,
    newItemId,
    isFirstItem,
    pendingSwapItem,
    setPendingSwapItem,
    swapItem,
  } = useCompare();

  // Register tray element for fly animation targeting
  useEffect(() => {
    setTrayElement(trayRef.current);
    return () => setTrayElement(null);
  }, [setTrayElement]);

  // Track first entrance
  useEffect(() => {
    if (count > 0 && !hasEntered) {
      setHasEntered(true);
    } else if (count === 0) {
      setHasEntered(false);
    }
  }, [count, hasEntered]);

  // Reset navigation state when location changes
  useEffect(() => {
    setIsNavigating(false);
  }, [location]);

  // Don't render if no items
  if (count === 0) {
    return null;
  }

  const canCompare = count >= 2;

  const handleCompareNow = () => {
    if (canCompare && !isNavigating) {
      setIsNavigating(true);
      // Save current finder params to sessionStorage for back navigation
      const currentParams = new URLSearchParams(window.location.search);
      if (currentParams.toString()) {
        sessionStorage.setItem('finder_last_params', currentParams.toString());
      }
      const ids = items.map(i => i.id).join(',');
      // Collapse tray when navigating
      setIsExpanded(false);
      navigate(`/compare?ids=${ids}`);
    }
  };

  const handleAddMore = () => {
    navigate('/');
  };

  // Drag handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderItems(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Build slots array
  const slots = [];
  
  // Add filled cards
  items.forEach((item, index) => {
    const isNew = item.id === newItemId;
    const isDragging = draggedIndex === index;
    const isDragOver = dragOverIndex === index;
    const dragDirection = dragOverIndex !== null && draggedIndex !== null && draggedIndex < dragOverIndex ? 'left' : 'right';
    
    slots.push(
      <MiniFilamentCard 
        key={item.id} 
        item={item} 
        onRemove={removeItem}
        isNew={isNew}
        isDragging={isDragging}
        isDragOver={isDragOver}
        dragDirection={dragDirection}
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(index)}
        onDragEnd={handleDragEnd}
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

  // Count badge animation class
  const countBadgeClass = lastAction === 'add' 
    ? 'badge-pop-add' 
    : lastAction === 'remove' 
    ? 'badge-pop-remove' 
    : '';

  return (
    <div 
      ref={trayRef}
      className={cn(
        "fixed bottom-4 left-1/2 z-40",
        "w-[95vw] max-w-[1100px]",
        "bg-card/95 backdrop-blur-md",
        "border border-primary/20 rounded-xl",
        "shadow-[0_-4px_30px_rgba(0,0,0,0.4)]",
        isFirstItem ? "tray-entrance" : "-translate-x-1/2",
        isGlowing && "tray-success-glow"
      )}
      style={!isFirstItem ? { transform: 'translateX(-50%)' } : undefined}
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
            <span className="text-sm font-medium flex items-center gap-1">
              Compare 
              <span className={cn(
                "inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold",
                countBadgeClass
              )}>
                {count}
              </span>
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
        <div className={cn("p-4", isFirstItem && "tray-content-enter")}>
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
                <span className={cn(
                  "inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium",
                  countBadgeClass
                )}>
                  {count}/{maxItems}
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
                      disabled={!canCompare || isNavigating}
                      className={cn(
                        "gap-2 font-semibold min-w-[140px]",
                        canCompare && !isNavigating && "animate-pulse-once"
                      )}
                      size="sm"
                    >
                      {isNavigating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Compare Now
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canCompare && !isNavigating && (
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
              Add 1 more material to enable comparison • Drag to reorder
            </p>
          )}

          {/* Suggestions when 1 item */}
          {count === 1 && items[0] && (
            <SuggestionChips currentItem={items[0]} onAdd={addItem} />
          )}
        </div>
      )}

      {/* Swap Modal */}
      {pendingSwapItem && (
        <SwapModal
          isOpen={!!pendingSwapItem}
          newItem={pendingSwapItem}
          existingItems={items}
          onSwap={(replaceId) => swapItem(replaceId, pendingSwapItem)}
          onCancel={() => setPendingSwapItem(null)}
        />
      )}
    </div>
  );
}

export default CompareTray;