import { Printer, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";

interface PrinterContextBarProps {
  compatibleCount: number;
  onChangePrinter: () => void;
}

export function PrinterContextBar({ compatibleCount, onChangePrinter }: PrinterContextBarProps) {
  const { selectedPrinter, selectedBrand } = usePrinterSelection();

  const hasPrinter = selectedPrinter && selectedBrand;
  const printerName = hasPrinter 
    ? `${selectedPrinter.brand?.brand || selectedBrand} ${selectedPrinter.model_name}`
    : null;

  return (
    <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-[1800px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
        {hasPrinter ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-primary">
                <Printer className="h-5 w-5" />
                <span className="font-medium">Your Printer:</span>
              </div>
              <span className="font-semibold text-foreground">{printerName}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onChangePrinter}
                className="text-muted-foreground hover:text-foreground h-7 px-2"
              >
                Change
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <span className="text-primary font-semibold">{compatibleCount.toLocaleString()}</span> compatible materials
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Printer className="h-5 w-5" />
                <span className="font-medium">No printer selected</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onChangePrinter}
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              Select Your Printer
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
