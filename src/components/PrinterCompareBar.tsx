import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import { CheckSquare, X, ArrowRight, Printer as PrinterIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PrinterCompareBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPrinters, removePrinter, clearAll, count } = usePrinterCompare();
  const [isNavigating, setIsNavigating] = useState(false);

  // Hide on compare page
  if (location.pathname === "/printers/compare") {
    return null;
  }

  // Hide when no printers selected
  if (count === 0) {
    return null;
  }

  const handleCompare = () => {
    setIsNavigating(true);
    const ids = selectedPrinters.map((p) => p.id).join(",");
    setTimeout(() => {
      navigate(`/printers/compare?ids=${ids}`);
    }, 150);
  };

  // Show max 4 thumbnails, with "+X more" indicator if needed
  const visiblePrinters = selectedPrinters.slice(0, 4);
  const overflowCount = selectedPrinters.length - 4;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "md:left-1/2 md:-translate-x-1/2 md:max-w-[1200px] md:bottom-4",
        "bg-[hsl(0_0%_10%/0.95)] backdrop-blur-lg",
        "border-t-2 border-[hsl(180_100%_41%/0.4)]",
        "md:rounded-t-2xl md:border md:border-[hsl(180_100%_41%/0.4)]",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.5)]",
        "animate-in slide-in-from-bottom duration-400"
      )}
      role="region"
      aria-label={`Printer comparison bar with ${count} printers selected`}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:px-8 md:py-5">
        {/* Left: Selection Counter */}
        <div className="flex items-center gap-3">
          <CheckSquare className="h-5 w-5 text-[hsl(180_100%_41%)]" />
          <div>
            <span className="text-sm md:text-base font-semibold text-white">
              {count} printer{count !== 1 ? "s" : ""} selected
            </span>
            {count >= 4 && (
              <span className="block text-xs text-muted-foreground">Maximum reached</span>
            )}
          </div>
        </div>

        {/* Center: Printer Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full md:max-w-none pb-2 md:pb-0">
          {visiblePrinters.map((printer) => (
            <div
              key={printer.id}
              className="relative flex-shrink-0 group"
            >
              <div
                className={cn(
                  "w-[50px] h-[50px] md:w-[60px] md:h-[60px]",
                  "rounded-lg border-2 border-[hsl(180_100%_41%/0.5)]",
                  "bg-[hsl(0_0%_10%)] overflow-hidden",
                  "flex items-center justify-center"
                )}
              >
                {printer.imageUrl ? (
                  <img
                    src={printer.imageUrl}
                    alt={printer.name}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <PrinterIcon
                  className={cn(
                    "h-6 w-6 text-muted-foreground",
                    printer.imageUrl ? "hidden" : ""
                  )}
                />
              </div>
              {/* Remove button */}
              <button
                onClick={() => removePrinter(printer.id)}
                className={cn(
                  "absolute -top-2 -right-2",
                  "w-5 h-5 rounded-full",
                  "bg-destructive hover:bg-destructive/80",
                  "flex items-center justify-center",
                  "transition-colors duration-200",
                  "opacity-0 group-hover:opacity-100 md:opacity-100"
                )}
                aria-label={`Remove ${printer.name} from comparison`}
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
          {overflowCount > 0 && (
            <div
              className={cn(
                "w-[50px] h-[50px] md:w-[60px] md:h-[60px]",
                "rounded-lg border-2 border-[hsl(180_100%_41%/0.3)]",
                "bg-[hsl(0_0%_10%)]",
                "flex items-center justify-center"
              )}
            >
              <span className="text-sm font-medium text-[hsl(180_100%_41%)]">
                +{overflowCount}
              </span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-muted-foreground hover:text-white"
          >
            Clear
          </Button>
          <Button
            onClick={handleCompare}
            disabled={isNavigating}
            className={cn(
              "h-11 md:h-12 px-6 md:px-8",
              "bg-gradient-to-r from-[hsl(180_100%_41%)] to-[hsl(180_100%_33%)]",
              "text-black font-bold text-sm md:text-base",
              "rounded-lg",
              "hover:scale-105 hover:brightness-110",
              "active:scale-98",
              "transition-all duration-200",
              !isNavigating && "animate-pulse-subtle",
              isNavigating && "opacity-80 cursor-not-allowed"
            )}
            aria-label={isNavigating ? "Loading comparison page" : `Compare ${count} selected printers`}
          >
            {isNavigating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span className="hidden md:inline">Compare Now</span>
                <span className="md:hidden">Compare</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
