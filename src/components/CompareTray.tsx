import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GitCompare, ChevronUp, ChevronDown, ArrowRight, Loader2, AlertCircle, Sparkles, Minus, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCompare } from "@/hooks/useCompare";
import { useComparisonHistory } from "@/hooks/useComparisonHistory";
import { useComparePresets } from "@/hooks/useComparePresets";
import { useCompareKeyboardShortcuts } from "@/hooks/useCompareKeyboardShortcuts";
import { MiniFilamentCard } from "@/components/compare/MiniFilamentCard";
import { EmptySlot } from "@/components/compare/EmptySlot";
import { SuggestionChips } from "@/components/compare/SuggestionChips";
import { SwapModal } from "@/components/compare/SwapModal";
import { HistoryDropdown } from "@/components/compare/HistoryDropdown";
import { RestorationToast } from "@/components/compare/RestorationToast";
import { TrayActionsMenu } from "@/components/compare/TrayActionsMenu";
import { PresetDialog } from "@/components/compare/PresetDialog";
import { PresetGallery } from "@/components/compare/PresetGallery";
import { TrayFilters, TrayFilter, TraySortOption, sortTrayItems, filterTrayItems } from "@/components/compare/TrayFilters";
import { KeyboardHints } from "@/components/compare/KeyboardHints";
import { ClearConfirmDialog } from "@/components/compare/ClearConfirmDialog";
import { SaveComparisonDialog } from "@/components/compare/SaveComparisonDialog";
import { MobileCompareTray } from "@/components/compare/MobileCompareTray";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Popular comparison suggestions
const POPULAR_COMPARISONS = [
  { label: "PLA vs PETG", materials: ["PLA", "PETG"] },
  { label: "ABS vs ASA", materials: ["ABS", "ASA"] },
  { label: "TPU vs TPE", materials: ["TPU", "TPE"] },
];

const TRAY_MINIMIZED_KEY = "filascope_tray_minimized";

export function CompareTray() {
  const navigate = useNavigate();
  const location = useLocation();
  const trayRef = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showMinItemsHelp, setShowMinItemsHelp] = useState(false);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [user, setUser] = useState<any>(null);
  const lastClickTime = useRef<number>(0);
  
  // Minimized state (persisted across navigation)
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      return localStorage.getItem(TRAY_MINIMIZED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  
  // Advanced filters
  const [activeFilters, setActiveFilters] = useState<TrayFilter[]>([]);
  const [sortOption, setSortOption] = useState<TraySortOption>('recent');
  
  // Check auth on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);
  
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
    isRestoring,
    restorationDate,
    dismissRestoration,
    startFresh,
    duplicatePulseId,
    storageWarning,
    clearOldData,
  } = useCompare();

  const { saveToHistory } = useComparisonHistory();
  const { savePreset } = useComparePresets();

  // Keyboard shortcuts
  const { focusedCardIndex } = useCompareKeyboardShortcuts({
    onShowHints: () => setShowKeyboardHints(true),
  });

  // Sort and filter items
  const displayItems = useMemo(() => {
    const sorted = sortTrayItems(items, sortOption);
    const visibleIds = filterTrayItems(items, activeFilters);
    return sorted.map(item => ({
      ...item,
      isFiltered: !visibleIds.includes(item.id),
    }));
  }, [items, sortOption, activeFilters]);

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
    if (!canCompare) {
      setShowMinItemsHelp(true);
      return;
    }
    if (isNavigating) return;
    
    setIsNavigating(true);
    setShowMinItemsHelp(false);
    // Save to history
    saveToHistory(
      items.map(i => i.id),
      items.map(i => i.product_title)
    );
    // Save current finder params to sessionStorage for back navigation
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.toString()) {
      sessionStorage.setItem('finder_last_params', currentParams.toString());
    }
    const ids = items.map(i => i.id).join(',');
    // Collapse tray when navigating
    setIsExpanded(false);
    navigate(`/compare?ids=${ids}`);
  };

  const handleSuggestedComparison = (materials: string[]) => {
    // Navigate to finder with material filters
    setShowMinItemsHelp(false);
    navigate(`/?material=${materials[0]}`);
  };

  const handleRestoreFromHistory = (filamentIds: string[]) => {
    // Navigate to compare page with these IDs
    navigate(`/compare?ids=${filamentIds.join(',')}`);
  };

  const handleAddMore = () => {
    navigate('/');
  };

  const handleSavePreset = (name: string) => {
    savePreset(name, items);
  };

  // Toggle minimized state with persistence
  const toggleMinimized = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    try {
      localStorage.setItem(TRAY_MINIMIZED_KEY, String(newState));
    } catch {}
  };

  // Handle double-click to expand from minimized
  const handleMinimizedClick = () => {
    const now = Date.now();
    if (now - lastClickTime.current < 300) {
      // Double click - expand
      setIsMinimized(false);
      setIsExpanded(true);
      try {
        localStorage.setItem(TRAY_MINIMIZED_KEY, 'false');
      } catch {}
    } else {
      // Single click - just expand from minimized
      setIsMinimized(false);
      try {
        localStorage.setItem(TRAY_MINIMIZED_KEY, 'false');
      } catch {}
    }
    lastClickTime.current = now;
  };

  // Share comparison link
  const handleShare = async () => {
    if (!canCompare) {
      toast.info("Add at least 2 materials to share");
      return;
    }
    
    const ids = items.map(i => i.id).join(',');
    const url = `${window.location.origin}/compare?ids=${ids}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Comparison link copied!", {
        description: "Share this link with anyone to show your comparison",
      });
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Clear all with confirmation
  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    clearAll();
    setShowClearConfirm(false);
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
      toast.success("Items reordered");
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
  displayItems.forEach((item, index) => {
    const isNew = item.id === newItemId;
    const isDragging = draggedIndex === index;
    const isDragOver = dragOverIndex === index;
    const isDuplicatePulse = item.id === duplicatePulseId;
    const isFocused = focusedCardIndex === index;
    const dragDirection = dragOverIndex !== null && draggedIndex !== null && draggedIndex < dragOverIndex ? 'left' : 'right';
    
    slots.push(
      <MiniFilamentCard 
        key={item.id} 
        item={item} 
        onRemove={removeItem}
        onSwapUnavailable={(id) => {
          // Remove and navigate to finder to find replacement
          removeItem(id);
          navigate('/');
        }}
        isNew={isNew}
        isDragging={isDragging}
        isDragOver={isDragOver}
        isDuplicatePulse={isDuplicatePulse}
        isFocused={isFocused}
        isFiltered={item.isFiltered}
        dragDirection={dragDirection}
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(index)}
        onDragEnd={handleDragEnd}
        cardIndex={index}
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
    <>
      {/* Mobile Compare Tray */}
      <MobileCompareTray onSaveForLater={() => setShowSaveDialog(true)} />

      {/* Desktop Tray (hidden on mobile) */}
      <div 
        ref={trayRef}
        data-tour="compare-tray"
        className={cn(
          "hidden lg:block fixed bottom-4 left-1/2 z-40",
          "w-[95vw] max-w-[1100px]",
          "bg-card/95 backdrop-blur-md",
          "border border-primary/20 rounded-xl",
          "shadow-[0_-4px_30px_rgba(0,0,0,0.4)]",
          isFirstItem ? "tray-entrance" : "-translate-x-1/2",
          isGlowing && "tray-success-glow",
          isMinimized && "transition-all duration-200"
        )}
        style={!isFirstItem ? { transform: 'translateX(-50%)' } : undefined}
        role="region"
        aria-label={`Compare tray containing ${count} of ${maxItems} materials`}
      >
        {/* Minimized Bar */}
        {isMinimized && (
          <button
            onClick={handleMinimizedClick}
            className="w-full h-10 px-4 flex items-center justify-center gap-3 hover:bg-muted/20 transition-colors rounded-xl group"
            title="Double-click to expand"
          >
            <GitCompare className="w-4 h-4 text-primary" />
            <span className={cn(
              "inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold",
              countBadgeClass
            )}>
              {count}
            </span>
            {canCompare && (
              <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                Click to expand
              </span>
            )}
          </button>
        )}

        {/* Collapsed View */}
        {!isMinimized && !isExpanded && (
          <div className="flex items-center">
            <button
              onClick={() => setIsExpanded(true)}
              className="flex-1 h-14 px-4 flex items-center justify-between hover:bg-muted/20 transition-colors rounded-l-xl"
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
            {/* Minimize button */}
            <button
              onClick={toggleMinimized}
              className="h-14 px-3 flex items-center justify-center hover:bg-muted/20 transition-colors rounded-r-xl border-l border-border/30"
              aria-label="Minimize compare tray"
            >
              <Minus className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Expanded View */}
        {!isMinimized && isExpanded && (
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
                <button
                  onClick={toggleMinimized}
                  className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
                  aria-label="Minimize tray"
                  title="Minimize to thin bar"
                >
                  <Minus className="w-4 h-4 text-muted-foreground" />
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
                
                {/* Preset Gallery */}
                <PresetGallery onRestore={handleRestoreFromHistory} />
                
                {/* Tray Filters */}
                <TrayFilters
                  items={items}
                  activeFilters={activeFilters}
                  onFiltersChange={setActiveFilters}
                  sortOption={sortOption}
                  onSortChange={setSortOption}
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Share Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleShare}
                  disabled={!canCompare}
                  aria-label="Share comparison link"
                >
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                </Button>

                {/* Save for Later (if logged in) */}
                {user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowSaveDialog(true)}
                    disabled={!canCompare}
                    aria-label="Save comparison for later"
                  >
                    <Bookmark className="w-4 h-4" aria-hidden="true" />
                  </Button>
                )}

                {/* Quick Actions Menu */}
                <TrayActionsMenu
                  items={items}
                  onSavePreset={() => setShowPresetDialog(true)}
                  onViewHistory={() => setShowHistory(!showHistory)}
                  onClearAll={handleClearAll}
                  onShowKeyboardHints={() => setShowKeyboardHints(true)}
                />
                
                {/* History dropdown (legacy) */}
                <HistoryDropdown onRestore={handleRestoreFromHistory} />
                
                <Popover open={showMinItemsHelp} onOpenChange={setShowMinItemsHelp}>
                  <PopoverTrigger asChild>
                    <span>
                      <Button
                        onClick={handleCompareNow}
                        disabled={isNavigating}
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
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-4" align="end">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-amber-500">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium text-sm">Add at least 2 materials</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select filaments from the grid to compare their properties side-by-side.
                      </p>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Popular comparisons:
                        </p>
                        <div className="space-y-1.5">
                          {POPULAR_COMPARISONS.map((comp) => (
                            <Button 
                              key={comp.label}
                              variant="outline" 
                              size="sm" 
                              className="w-full justify-start text-xs h-8"
                              onClick={() => handleSuggestedComparison(comp.materials)}
                            >
                              {comp.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
              {slots}
            </div>

            {/* Helper text */}
            {count === 1 && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Add 1 more material to enable comparison • Drag to reorder • Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">?</kbd> for shortcuts
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

        {/* Restoration Toast */}
        {isRestoring && restorationDate && count > 0 && (
          <RestorationToast
            itemCount={count}
            savedDate={restorationDate}
            onDismiss={dismissRestoration}
            onStartFresh={startFresh}
          />
        )}

        {/* Storage Warning */}
        {storageWarning && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-amber-500/20 border border-amber-500/50 rounded-lg px-4 py-2 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-amber-200">Storage full</span>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={clearOldData}>
              Clear old data
            </Button>
          </div>
        )}
      </div>

      {/* Preset Dialog */}
      <PresetDialog
        isOpen={showPresetDialog}
        onClose={() => setShowPresetDialog(false)}
        onSave={handleSavePreset}
        items={items}
      />

      {/* Keyboard Hints Dialog */}
      <KeyboardHints
        isOpen={showKeyboardHints}
        onClose={() => setShowKeyboardHints(false)}
      />

      {/* Clear Confirmation Dialog */}
      <ClearConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={confirmClearAll}
        itemCount={count}
      />

      {/* Save Comparison Dialog */}
      <SaveComparisonDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        items={items}
      />
    </>
  );
}

export default CompareTray;
