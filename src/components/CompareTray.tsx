import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GitCompare, ChevronUp, ChevronDown, ArrowRight, Loader2, AlertCircle, Sparkles, Minus, Share2, Bookmark, X, Plus, MoreHorizontal } from "lucide-react";
import { SharePopover } from "@/components/sharing/SharePopover";
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
import { CompareTrayPill } from "@/components/compare/CompareTrayPill";
import { useCompareTrayMode } from "@/hooks/useCompareTrayMode";
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
  const trayMode = useCompareTrayMode();
  const [hasEntered, setHasEntered] = useState(false);
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
  const [activeFilters] = useState<TrayFilter[]>([]);
  const [sortOption] = useState<TraySortOption>('recent');
  
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

  // Hidden on active comparison page
  if (trayMode === "hidden") {
    return null;
  }

  // Pill mode on non-filament pages
  if (trayMode === "pill") {
    return <CompareTrayPill />;
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

        {/* Main tray bar (collapsed & expanded share same bar layout) */}
        {!isMinimized && (
          <div className="flex items-center gap-3 px-3 py-2.5">
            {/* Far left: collapse/minimize controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted/30 transition-colors"
                aria-label={isExpanded ? "Collapse tray" : "Expand tray"}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={toggleMinimized}
                className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted/30 transition-colors"
                aria-label="Minimize tray"
              >
                <Minus className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* LEFT: Thumbnail slots */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {Array.from({ length: maxItems }).map((_, i) => {
                const item = items[i];
                if (item) {
                  return (
                    <div
                      key={item.id}
                      className="relative w-10 h-10 rounded-md overflow-hidden bg-muted/40 border border-border/40 group/thumb flex-shrink-0"
                    >
                      {item.featured_image ? (
                        <img
                          src={item.featured_image}
                          alt={item.product_title || "Filament"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: item.color_hex || 'hsl(var(--muted))' }}
                        />
                      )}
                      {/* Remove button on hover */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                        aria-label={`Remove ${item.product_title}`}
                      >
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  );
                }
                return (
                  <div
                    key={`empty-${i}`}
                    className="w-10 h-10 rounded-md border border-dashed border-border/40 flex items-center justify-center flex-shrink-0"
                  >
                    <Plus className="w-3 h-3 text-muted-foreground/40" />
                  </div>
                );
              })}
            </div>

            {/* CENTER: Count + names */}
            <div className="flex-1 min-w-0 px-2">
              <p className="text-[13px] text-muted-foreground">
                {count} / {maxItems} filaments selected
              </p>
              {count > 0 && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  {items.slice(0, 2).map((item) => (
                    <span
                      key={item.id}
                      className="text-[11px] text-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded truncate max-w-[120px]"
                    >
                      {item.product_title?.split(' ').slice(0, 3).join(' ') || 'Filament'}
                    </span>
                  ))}
                  {count > 2 && (
                    <span className="text-[11px] text-muted-foreground">
                      + {count - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: Compare Now + overflow */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Overflow menu */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end" side="top">
                  <div className="flex flex-col">
                    <button
                      onClick={handleShare}
                      disabled={!canCompare}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 rounded-md disabled:opacity-40 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                    {user && (
                      <button
                        onClick={() => setShowSaveDialog(true)}
                        disabled={!canCompare}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 rounded-md disabled:opacity-40 transition-colors"
                      >
                        <Bookmark className="w-3.5 h-3.5" /> Save for Later
                      </button>
                    )}
                    <TrayActionsMenu
                      items={items}
                      onSavePreset={() => setShowPresetDialog(true)}
                      onViewHistory={() => setShowHistory(!showHistory)}
                      onClearAll={handleClearAll}
                      onShowKeyboardHints={() => setShowKeyboardHints(true)}
                    />
                  </div>
                </PopoverContent>
              </Popover>

              {/* Compare Now CTA */}
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
        )}

        {/* Expanded: suggestion chips when 1 item */}
        {!isMinimized && isExpanded && count === 1 && items[0] && (
          <div className="px-4 pb-3">
            <SuggestionChips currentItem={items[0]} onAdd={addItem} />
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
