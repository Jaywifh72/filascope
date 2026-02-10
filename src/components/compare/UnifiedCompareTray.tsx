import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GitCompare, Printer as PrinterIcon, FlaskConical, ArrowRight, Trash2, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompare } from "@/hooks/useCompare";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";
import { useCompareTrayMode } from "@/hooks/useCompareTrayMode";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MiniFilamentCard } from "./MiniFilamentCard";
import { toast } from "sonner";

type TrayTab = "filaments" | "printers";

/**
 * Unified comparison tray that shows both filament and printer comparisons
 * using tabs. Replaces the separate CompareTray desktop portion and PrinterCompareBar.
 */
export function UnifiedCompareTray() {
  const navigate = useNavigate();
  const location = useLocation();
  const trayMode = useCompareTrayMode();

  // Filament compare
  const {
    items: filamentItems,
    count: filamentCount,
    removeItem: removeFilament,
    clearAll: clearFilaments,
    maxItems: maxFilaments,
    isExpanded,
    setIsExpanded,
  } = useCompare();

  // Printer compare
  const {
    selectedPrinters,
    removePrinter,
    clearAll: clearPrinters,
    count: printerCount,
    recentlyAdded: printerRecentlyAdded,
  } = usePrinterCompare();

  const [activeTab, setActiveTab] = useState<TrayTab>("filaments");
  const [isNavigating, setIsNavigating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const totalCount = filamentCount + printerCount;

  // Auto-select tab based on which has items
  useEffect(() => {
    if (filamentCount > 0 && printerCount === 0) setActiveTab("filaments");
    else if (printerCount > 0 && filamentCount === 0) setActiveTab("printers");
  }, [filamentCount, printerCount]);

  // Handle visibility animation
  useEffect(() => {
    const isOnPrinterCompare = location.pathname === "/printers/compare";
    const isOnFilamentCompare = location.pathname === "/compare" && new URLSearchParams(location.search).has("ids");

    if (totalCount > 0 && !isOnPrinterCompare && !isOnFilamentCompare) {
      setShouldRender(true);
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalCount, location.pathname, location.search]);

  // Reset nav state on location change
  useEffect(() => {
    setIsNavigating(false);
  }, [location]);

  if (!shouldRender) return null;

  // On non-filament pages and trayMode is "pill", show the pill instead
  // But only if we don't have printers — printers should always show full tray
  if (trayMode === "hidden" && printerCount === 0) return null;

  const canCompareFilaments = filamentCount >= 2;
  const canComparePrinters = printerCount >= 2;
  const canCompare = activeTab === "filaments" ? canCompareFilaments : canComparePrinters;

  const handleCompare = () => {
    if (!canCompare) return;
    setIsNavigating(true);

    if (activeTab === "filaments") {
      const ids = filamentItems.map(i => i.id).join(",");
      navigate(`/compare?ids=${ids}`);
    } else {
      const ids = selectedPrinters.map(p => p.id).join(",");
      navigate(`/printers/compare?ids=${ids}`);
    }
  };

  const handleClearActive = () => {
    if (activeTab === "filaments") {
      clearFilaments();
    } else {
      clearPrinters();
    }
  };

  return (
    <div
      className={cn(
        "hidden lg:block fixed bottom-4 left-1/2 z-[70]",
        "w-[95vw] max-w-[1100px]",
        "bg-card/95 backdrop-blur-xl",
        "border border-primary/20 rounded-xl",
        "shadow-[0_-4px_30px_rgba(0,0,0,0.4)]",
        "transition-all duration-300 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}
      style={{ transform: isVisible ? "translateX(-50%)" : "translateX(-50%) translateY(2rem)" }}
      role="region"
      aria-label="Comparison tray"
    >
      {/* Tab Bar */}
      <div className="flex items-center border-b border-border/30" role="tablist" aria-label="Comparison type">
        {/* Filaments Tab */}
        <button
          onClick={() => setActiveTab("filaments")}
          role="tab"
          aria-selected={activeTab === "filaments"}
          aria-controls="compare-filaments-panel"
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative",
            activeTab === "filaments"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Filaments</span>
          {filamentCount > 0 && (
            <span className={cn(
              "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
              activeTab === "filaments"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              {filamentCount}
            </span>
          )}
          {activeTab === "filaments" && (
            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
          )}
        </button>

        {/* Printers Tab */}
        <button
          onClick={() => setActiveTab("printers")}
          role="tab"
          aria-selected={activeTab === "printers"}
          aria-controls="compare-printers-panel"
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative",
            activeTab === "printers"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <PrinterIcon className="w-4 h-4" />
          <span>Printers</span>
          {printerCount > 0 && (
            <span className={cn(
              "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
              activeTab === "printers"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              {printerCount}
            </span>
          )}
          {activeTab === "printers" && (
            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Items display */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            {activeTab === "filaments" ? (
              filamentCount > 0 ? (
                <div className="flex items-center gap-2">
                  {filamentItems.slice(0, 4).map((item, index) => (
                    <div key={item.id} className="relative flex-shrink-0 group">
                      <div className="w-12 h-12 rounded-lg border-2 border-primary/30 bg-background/80 overflow-hidden flex items-center justify-center relative">
                        {item.featured_image ? (
                          <img
                            src={getOptimizedImageUrl(item.featured_image, 96)}
                            alt={item.product_title}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const swatch = e.currentTarget.nextElementSibling;
                              if (swatch) (swatch as HTMLElement).style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-8 h-8 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: item.color_hex || '#888',
                            display: item.featured_image ? 'none' : 'block',
                          }}
                        />
                      </div>
                      <button
                        onClick={() => removeFilament(item.id)}
                        aria-label={`Remove ${item.product_title} from comparison`}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="h-3 w-3 text-white" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  {filamentCount > 4 && (
                    <span className="text-xs text-muted-foreground ml-1">+{filamentCount - 4}</span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No filaments selected</p>
              )
            ) : (
              printerCount > 0 ? (
                <TooltipProvider delayDuration={200}>
                  <div className="flex items-center gap-2">
                    {selectedPrinters.slice(0, 4).map((printer) => (
                      <Tooltip key={printer.id}>
                        <TooltipTrigger asChild>
                          <div className="relative flex-shrink-0 group">
                            <div className={cn(
                              "w-12 h-12 rounded-lg border-2 overflow-hidden flex items-center justify-center",
                              printerRecentlyAdded.has(printer.id)
                                ? "border-green-500 bg-green-500/10"
                                : "border-primary/30 bg-background/80"
                            )}>
                              {printer.imageUrl ? (
                                <img src={getOptimizedImageUrl(printer.imageUrl, 96)} alt={printer.name} className="w-full h-full object-contain p-1" />
                              ) : (
                                <PrinterIcon className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            {printerRecentlyAdded.has(printer.id) && (
                              <div className="absolute inset-0 flex items-center justify-center bg-green-500/90 rounded-lg animate-fade-in">
                                <Check className="h-5 w-5 text-white" />
                              </div>
                            )}
                            <button
                              onClick={() => removePrinter(printer.id)}
                              aria-label={`Remove ${printer.name} from comparison`}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                              <X className="h-3 w-3 text-white" aria-hidden="true" />
                            </button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-card border-border">
                          <p className="font-medium text-sm">{printer.name}</p>
                          {printer.brand && <p className="text-xs text-muted-foreground">{printer.brand}</p>}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {printerCount > 4 && (
                      <span className="text-xs text-muted-foreground ml-1">+{printerCount - 4}</span>
                    )}
                  </div>
                </TooltipProvider>
              ) : (
                <p className="text-sm text-muted-foreground">No printers selected</p>
              )
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground hidden md:block">
              {!canCompare && (activeTab === "filaments"
                ? `Add ${2 - filamentCount} more`
                : `Add ${2 - printerCount} more`
              )}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearActive}
              aria-label={`Clear all ${activeTab}`}
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>

            <Button
              onClick={handleCompare}
              disabled={!canCompare || isNavigating}
              className={cn(
                "h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-lg",
                canCompare && !isNavigating && "shadow-[0_0_20px_-5px] shadow-primary/50"
              )}
            >
              {isNavigating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Compare</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
