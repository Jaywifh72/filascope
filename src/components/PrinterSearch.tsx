import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, ChevronDown, ArrowRight } from "lucide-react";
import { PrinterDropdown } from "@/components/PrinterDropdown";
import { cn } from "@/lib/utils";
import type { PrinterOption } from "@/types/printer";
import { supabase } from "@/integrations/supabase/client";

interface PrinterSearchProps {
  className?: string;
}

export function PrinterSearch({ className }: PrinterSearchProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterOption | null>(null);

  const { data: printerCount } = useQuery({
    queryKey: ["printer-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("printers")
        .select("*", { count: "exact", head: true })
        .in("status", ["active", "pending"]);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: compatibleFilamentCount } = useQuery({
    queryKey: ["compatible-filament-count", selectedPrinter?.printer_id],
    queryFn: async () => {
      if (!selectedPrinter) return null;
      // For now, we'll count filaments that are PLA/PETG as a base compatible count
      // In a real implementation, this would use the printer's filament_compatibility array
      const { count, error } = await supabase
        .from("filaments")
        .select("*", { count: "exact", head: true })
        .in("material", ["PLA", "PETG", "ABS", "TPU"])
        .eq("published", true);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!selectedPrinter,
  });

  const handleSelectPrinter = (printer: PrinterOption) => {
    setSelectedPrinter(printer);
    // Navigate to printer page after a short delay to show the selection
    setTimeout(() => {
      navigate(`/printer-filaments/${printer.printer_id}`);
    }, 300);
  };

  const handleShowFilaments = () => {
    if (selectedPrinter) {
      navigate(`/printer-filaments/${selectedPrinter.printer_id}`);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="bg-card border border-primary/20 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Find Filaments for Your Printer</h3>
          </div>
          {printerCount && (
            <Badge variant="secondary" className="text-xs">
              {printerCount}+ printers
            </Badge>
          )}
        </div>

        {/* Printer Selection Button */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-lg border",
              "transition-all text-left",
              "hover:border-primary/50 hover:bg-muted/50",
              selectedPrinter
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-muted/30"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Printer className={cn(
                  "w-5 h-5",
                  selectedPrinter ? "text-primary" : "text-muted-foreground/50"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                {selectedPrinter ? (
                  <div>
                    <div className="text-sm font-medium text-foreground truncate">
                      {selectedPrinter.brand} {selectedPrinter.model_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Selected
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Select your printer...
                  </div>
                )}
              </div>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </button>

          {/* Dropdown */}
          <PrinterDropdown
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onSelect={handleSelectPrinter}
            currentPrinterId={selectedPrinter?.printer_id}
          />
        </div>

        {/* Action Button */}
        {selectedPrinter && compatibleFilamentCount !== null && (
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={handleShowFilaments}
              className="flex-1 bg-primary hover:bg-primary/90"
              size="lg"
            >
              Show {compatibleFilamentCount.toLocaleString()} Compatible Filaments
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Helper Text */}
        {!selectedPrinter && (
          <p className="mt-3 text-xs text-muted-foreground">
            Search by brand or model to see compatible filaments
          </p>
        )}
      </div>
    </div>
  );
}
