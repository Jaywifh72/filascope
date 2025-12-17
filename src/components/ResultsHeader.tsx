import { X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsHeaderProps {
  count: number;
  selectedPrinter?: { model_name: string; printer_brands?: { brand: string } | null } | null;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const ResultsHeader = ({ 
  count, 
  selectedPrinter, 
  hasActiveFilters, 
  onClearFilters 
}: ResultsHeaderProps) => {
  const printerBrand = selectedPrinter?.printer_brands?.brand || "";
  const printerName = selectedPrinter?.model_name || "";

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* Results Count */}
        <div className="flex flex-col gap-1">
          <p className="text-lg sm:text-xl font-semibold text-foreground">
            <span className="text-primary font-bold">{count.toLocaleString()}</span>
            {" "}filaments found
          </p>
          
          {/* Printer Context */}
          {selectedPrinter && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Compatible with {printerBrand} {printerName}
            </p>
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground self-start sm:self-auto"
          >
            <X className="w-4 h-4 mr-1.5" />
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default ResultsHeader;
