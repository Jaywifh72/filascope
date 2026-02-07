import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PopularPrinter {
  printer_id: string;
  brand: string;
  model: string;
  icon?: string;
}

const POPULAR_PRINTERS: PopularPrinter[] = [
  { printer_id: "bambu-lab-a1", brand: "Bambu Lab", model: "A1" },
  { printer_id: "bambu-lab-a1-mini", brand: "Bambu Lab", model: "A1 Mini" },
  { printer_id: "bambu-lab-x1c", brand: "Bambu Lab", model: "X1 Carbon" },
  { printer_id: "bambu-lab-p1s", brand: "Bambu Lab", model: "P1S" },
  { printer_id: "prusa-mk4s", brand: "Prusa Research", model: "MK4S" },
  { printer_id: "creality-ender-3-v3", brand: "Creality", model: "Ender 3 V3" },
  { printer_id: "creality-K1 Max", brand: "Creality", model: "K1 Max" },
  { printer_id: "elegoo-neptune-4-pro", brand: "Elegoo", model: "Neptune 4 Pro" },
];

interface PopularPrinterCardsProps {
  onSelect: (printer: PopularPrinter) => void;
  selectedPrinterId?: string;
}

export function PopularPrinterCards({ onSelect, selectedPrinterId }: PopularPrinterCardsProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Popular Printers — Quick Select
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {POPULAR_PRINTERS.map((printer) => {
          const isSelected = selectedPrinterId === printer.printer_id;
          return (
            <button
              key={printer.printer_id}
              onClick={() => onSelect(printer)}
              className={cn(
                "group relative flex flex-col items-center gap-2 p-4 rounded-xl border text-center",
                "transition-all duration-200 cursor-pointer",
                isSelected
                  ? "bg-primary/10 border-primary/40 shadow-[0_0_16px_rgba(0,207,232,0.15)]"
                  : "bg-card border-border hover:border-primary/30 hover:bg-primary/5 hover:-translate-y-0.5"
              )}
              aria-label={`Select ${printer.brand} ${printer.model}`}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                )}
              >
                <Printer className="w-5 h-5" />
              </div>
              <div className="min-w-0 w-full">
                <p className={cn(
                  "text-xs font-medium truncate",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}>
                  {printer.brand}
                </p>
                <p className={cn(
                  "text-sm font-bold truncate",
                  isSelected ? "text-foreground" : "text-foreground/80"
                )}>
                  {printer.model}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
