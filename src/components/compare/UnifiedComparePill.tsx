import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitCompare, ChevronRight, X, FlaskConical, Printer as PrinterIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompare } from "@/hooks/useCompare";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";
import { Button } from "@/components/ui/button";
import { MiniFilamentCard } from "./MiniFilamentCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type TrayTab = "filaments" | "printers";

/**
 * Minimal floating pill shown on non-filament pages when items are in compare.
 * Now supports both filament and printer items.
 */
export function UnifiedComparePill() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TrayTab>("filaments");

  const { items: filamentItems, count: filamentCount, removeItem: removeFilament, clearAll: clearFilaments } = useCompare();
  const { selectedPrinters, removePrinter, clearAll: clearPrinters, count: printerCount } = usePrinterCompare();

  const totalCount = filamentCount + printerCount;

  if (totalCount === 0) return null;

  const canCompare = activeTab === "filaments" ? filamentCount >= 2 : printerCount >= 2;

  const handleCompare = () => {
    if (activeTab === "filaments") {
      const ids = filamentItems.map((i) => i.id).join(",");
      navigate(`/compare?ids=${ids}`);
    } else {
      const ids = selectedPrinters.map((p) => p.id).join(",");
      navigate(`/printers/compare?ids=${ids}`);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Pill */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-[60]",
          "flex items-center gap-2 px-4 py-2.5 rounded-full",
          "bg-card/95 backdrop-blur-md",
          "border border-primary/30 shadow-lg shadow-black/20",
          "hover:border-primary/50 hover:shadow-primary/10",
          "transition-all duration-200",
          "lg:bottom-6 lg:right-6"
        )}
        aria-label={`${totalCount} items in compare tray`}
      >
        <GitCompare className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {filamentCount > 0 && `${filamentCount} filament${filamentCount !== 1 ? "s" : ""}`}
          {filamentCount > 0 && printerCount > 0 && " · "}
          {printerCount > 0 && `${printerCount} printer${printerCount !== 1 ? "s" : ""}`}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {/* Expanded Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-2xl px-0">
          <SheetHeader className="px-4 pb-0 border-b-0">
            <div className="flex items-center justify-between mb-3">
              <SheetTitle className="flex items-center gap-2 text-base">
                <GitCompare className="w-4 h-4 text-primary" />
                Compare Tray
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="min-h-[44px] min-w-[44px]">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            {(filamentCount > 0 || printerCount > 0) && (
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab("filaments")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium relative",
                    activeTab === "filaments" ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Filaments ({filamentCount})
                  {activeTab === "filaments" && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />}
                </button>
                <button
                  onClick={() => setActiveTab("printers")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium relative",
                    activeTab === "printers" ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <PrinterIcon className="w-3.5 h-3.5" />
                  Printers ({printerCount})
                  {activeTab === "printers" && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />}
                </button>
              </div>
            )}
          </SheetHeader>

          <div className="overflow-y-auto px-4 py-3">
            {activeTab === "filaments" ? (
              filamentCount > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filamentItems.map((item, index) => (
                    <MiniFilamentCard key={item.id} item={item} onRemove={removeFilament} cardIndex={index} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No filaments selected</p>
              )
            ) : (
              printerCount > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedPrinters.map((printer) => (
                    <div key={printer.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50">
                      <div className="w-10 h-10 rounded bg-muted/30 flex items-center justify-center flex-shrink-0">
                        {printer.imageUrl ? (
                          <img src={getOptimizedImageUrl(printer.imageUrl, 96)} alt={printer.name} className="w-full h-full object-contain p-0.5 rounded" />
                        ) : (
                          <PrinterIcon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{printer.name}</p>
                        {printer.brand && <p className="text-xs text-muted-foreground">{printer.brand}</p>}
                      </div>
                      <button onClick={() => removePrinter(printer.id)} className="p-1 hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No printers selected</p>
              )
            )}
          </div>

          <div className="px-4 py-3 border-t border-border flex items-center gap-2"
               style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === "filaments") clearFilaments();
                else clearPrinters();
              }}
              className="min-h-[44px]"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button onClick={handleCompare} disabled={!canCompare} className="flex-1 min-h-[44px] font-semibold">
              Compare {activeTab === "filaments" ? `${filamentCount} Material${filamentCount !== 1 ? "s" : ""}` : `${printerCount} Printer${printerCount !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
