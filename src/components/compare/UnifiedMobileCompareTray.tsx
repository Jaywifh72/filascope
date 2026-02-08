import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GitCompare, Printer as PrinterIcon, FlaskConical, ArrowRight, Trash2, X, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompare } from "@/hooks/useCompare";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MiniFilamentCard } from "./MiniFilamentCard";
import { toast } from "sonner";

type TrayTab = "filaments" | "printers";

/**
 * Mobile version of the unified comparison tray with tabs for filaments and printers.
 */
export function UnifiedMobileCompareTray() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TrayTab>("filaments");

  const {
    items: filamentItems,
    count: filamentCount,
    removeItem: removeFilament,
    clearAll: clearFilaments,
  } = useCompare();

  const {
    selectedPrinters,
    removePrinter,
    clearAll: clearPrinters,
    count: printerCount,
  } = usePrinterCompare();

  const totalCount = filamentCount + printerCount;

  // Auto-select tab
  useEffect(() => {
    if (filamentCount > 0 && printerCount === 0) setActiveTab("filaments");
    else if (printerCount > 0 && filamentCount === 0) setActiveTab("printers");
  }, [filamentCount, printerCount]);

  // Hide on compare pages
  const isOnComparePage =
    (location.pathname === "/compare" && new URLSearchParams(location.search).has("ids")) ||
    location.pathname === "/printers/compare";

  if (totalCount === 0 || isOnComparePage) return null;

  const canCompare = activeTab === "filaments" ? filamentCount >= 2 : printerCount >= 2;
  const activeCount = activeTab === "filaments" ? filamentCount : printerCount;

  const handleCompare = () => {
    if (!canCompare) {
      toast.info(`Add at least 2 ${activeTab} to compare`);
      return;
    }
    if (activeTab === "filaments") {
      const ids = filamentItems.map(i => i.id).join(",");
      navigate(`/compare?ids=${ids}`);
    } else {
      const ids = selectedPrinters.map(p => p.id).join(",");
      navigate(`/printers/compare?ids=${ids}`);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    if (activeTab === "filaments") clearFilaments();
    else clearPrinters();
  };

  return (
    <>
      {/* Mobile Bottom Bar */}
      <div
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-[70]",
          "bg-card/95 backdrop-blur-xl border-t border-primary/20"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-full min-h-[56px] px-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <GitCompare className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {totalCount}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">
                {filamentCount > 0 && `${filamentCount} filament${filamentCount !== 1 ? "s" : ""}`}
                {filamentCount > 0 && printerCount > 0 && " · "}
                {printerCount > 0 && `${printerCount} printer${printerCount !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={!canCompare}
              onClick={(e) => {
                e.stopPropagation();
                handleCompare();
              }}
              className="min-h-[44px] px-4"
            >
              Compare
            </Button>
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          </div>
        </button>
      </div>

      {/* Full Tray Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl px-0">
          <SheetHeader className="px-4 pb-0 border-b-0">
            <div className="flex items-center justify-between mb-3">
              <SheetTitle className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-primary" />
                Compare Tray
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="min-h-[44px] min-w-[44px]">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("filaments")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors relative",
                  activeTab === "filaments" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <FlaskConical className="w-4 h-4" />
                Filaments
                {filamentCount > 0 && (
                  <span className={cn(
                    "w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center",
                    activeTab === "filaments" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {filamentCount}
                  </span>
                )}
                {activeTab === "filaments" && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />}
              </button>
              <button
                onClick={() => setActiveTab("printers")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors relative",
                  activeTab === "printers" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <PrinterIcon className="w-4 h-4" />
                Printers
                {printerCount > 0 && (
                  <span className={cn(
                    "w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center",
                    activeTab === "printers" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {printerCount}
                  </span>
                )}
                {activeTab === "printers" && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />}
              </button>
            </div>
          </SheetHeader>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {activeTab === "filaments" ? (
              filamentCount > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {filamentItems.map((item, index) => (
                    <MiniFilamentCard key={item.id} item={item} onRemove={removeFilament} cardIndex={index} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">No filaments added to compare yet</p>
              )
            ) : (
              printerCount > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {selectedPrinters.map((printer) => (
                    <div key={printer.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50">
                      <div className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                        {printer.imageUrl ? (
                          <img src={printer.imageUrl} alt={printer.name} className="w-full h-full object-contain p-1 rounded-lg" />
                        ) : (
                          <PrinterIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{printer.name}</p>
                        {printer.brand && <p className="text-xs text-muted-foreground">{printer.brand}</p>}
                      </div>
                      <button
                        onClick={() => removePrinter(printer.id)}
                        className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">No printers added to compare yet</p>
              )
            )}
          </div>

          {/* Bottom Actions */}
          <div className="sticky bottom-0 px-4 py-4 bg-background border-t border-border space-y-3"
               style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleClear} className="flex-1 min-h-[44px] gap-2">
                <Trash2 className="w-4 h-4" />
                Clear {activeTab === "filaments" ? "Filaments" : "Printers"}
              </Button>
            </div>
            <Button
              onClick={handleCompare}
              disabled={!canCompare}
              className="w-full min-h-[48px] text-base font-semibold"
            >
              Compare {activeCount} {activeTab === "filaments" ? "Material" : "Printer"}{activeCount !== 1 ? "s" : ""}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
