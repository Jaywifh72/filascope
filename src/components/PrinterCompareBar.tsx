import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import { GitCompare, X, ArrowRight, Printer as PrinterIcon, Loader2, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function PrinterCompareBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPrinters, removePrinter, clearAll, count, recentlyAdded } = usePrinterCompare();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle animation timing
  useEffect(() => {
    if (count > 0 && location.pathname !== "/printers/compare") {
      setShouldRender(true);
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      // Wait for exit animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [count, location.pathname]);

  // Don't render when not needed
  if (!shouldRender) {
    return null;
  }

  const handleCompare = () => {
    setIsNavigating(true);
    const ids = selectedPrinters.map((p) => p.id).join(",");
    setTimeout(() => {
      navigate(`/printers/compare?ids=${ids}`);
    }, 150);
  };

  // Show max 4 thumbnails on mobile, 5 on desktop
  const maxVisible = 4;
  const visiblePrinters = selectedPrinters.slice(0, maxVisible);
  const overflowCount = Math.max(0, selectedPrinters.length - maxVisible);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[70]",
        "transition-transform duration-300 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="region"
      aria-label={`Printer comparison bar with ${count} printers selected`}
    >
      {/* Gradient fade above bar */}
      <div className="h-6 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      
      <div
        className={cn(
          "bg-card/95 backdrop-blur-xl",
          "border-t border-primary/40",
          "shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
        )}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
            {/* Left: Icon and Count */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                <GitCompare className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="hidden sm:block">
                <span className="text-sm md:text-base font-semibold text-foreground">
                  {count} Printer{count !== 1 ? "s" : ""}
                </span>
                <span className="block text-[10px] md:text-xs text-muted-foreground">
                  {count < 2 ? "Add 1 more to compare" : "Ready to compare"}
                </span>
              </div>
              <span className="sm:hidden text-sm font-semibold text-foreground">
                {count}
              </span>
            </div>

            {/* Center: Printer Thumbnails - Hidden on small mobile */}
            <TooltipProvider delayDuration={200}>
              <div className="hidden sm:flex items-center gap-1.5 md:gap-2 overflow-x-auto flex-1 justify-center px-2">
                {visiblePrinters.map((printer) => (
                  <Tooltip key={printer.id}>
                    <TooltipTrigger asChild>
                      <div className="relative flex-shrink-0 group">
                        <div
                          className={cn(
                            "w-11 h-11 md:w-14 md:h-14",
                            "rounded-lg border-2",
                            recentlyAdded.has(printer.id)
                              ? "border-green-500 bg-green-500/10"
                              : "border-primary/40 bg-background/80",
                            "overflow-hidden",
                            "flex items-center justify-center",
                            "transition-all duration-300"
                          )}
                        >
                          {printer.imageUrl ? (
                            <img
                              src={printer.imageUrl}
                              alt={printer.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-contain p-1"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.classList.remove("hidden");
                              }}
                            />
                          ) : null}
                          <PrinterIcon
                            className={cn(
                              "h-5 w-5 md:h-6 md:w-6 text-muted-foreground",
                              printer.imageUrl ? "hidden" : ""
                            )}
                          />
                        </div>
                        
                        {/* Success checkmark overlay */}
                        {recentlyAdded.has(printer.id) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-green-500/90 rounded-lg animate-fade-in">
                            <Check className="h-5 w-5 md:h-6 md:w-6 text-white" />
                          </div>
                        )}
                        
                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removePrinter(printer.id);
                          }}
                          className={cn(
                            "absolute -top-1.5 -right-1.5",
                            "w-5 h-5 rounded-full",
                            "bg-destructive hover:bg-destructive/80",
                            "flex items-center justify-center",
                            "transition-all duration-200",
                            "opacity-70 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100",
                            "shadow-md"
                          )}
                          aria-label={`Remove ${printer.name} from comparison`}
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-card border-border">
                      <p className="font-medium text-foreground text-sm">{printer.name}</p>
                      {printer.brand && (
                        <p className="text-xs text-muted-foreground">{printer.brand}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ))}
                
                {/* Overflow indicator */}
                {overflowCount > 0 && (
                  <div
                    className={cn(
                      "w-11 h-11 md:w-14 md:h-14",
                      "rounded-lg border-2 border-dashed border-primary/30",
                      "bg-primary/5",
                      "flex items-center justify-center",
                      "flex-shrink-0"
                    )}
                  >
                    <span className="text-xs md:text-sm font-semibold text-primary">
                      +{overflowCount}
                    </span>
                  </div>
                )}
              </div>
            </TooltipProvider>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {/* Clear button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAll}
                className="h-9 w-9 md:h-10 md:w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label="Clear all printers from comparison"
              >
                <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              
              {/* Compare button */}
              <Button
                onClick={handleCompare}
                disabled={isNavigating || count < 2}
                className={cn(
                  "h-10 md:h-11 px-4 md:px-6",
                  "bg-primary hover:bg-primary/90",
                  "text-primary-foreground font-bold text-sm",
                  "rounded-lg",
                  "transition-all duration-200",
                  count >= 2 && !isNavigating && "shadow-[0_0_20px_-5px] shadow-primary/50",
                  (isNavigating || count < 2) && "opacity-60 cursor-not-allowed"
                )}
                aria-label={isNavigating ? "Loading comparison page" : `Compare ${count} selected printers`}
              >
                {isNavigating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Loading...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Compare {count}</span>
                    <span className="sm:hidden">Compare</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
