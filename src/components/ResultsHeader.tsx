import { X, Printer, Database, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ResultsHeaderProps {
  count: number;
  selectedPrinter?: { model_name: string; printer_brands?: { brand: string } | null } | null;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onExportCSV?: () => void;
  isExporting?: boolean;
  isUpdating?: boolean; // True during region transitions when we're showing stale count
}

const ResultsHeader = ({ 
  count, 
  selectedPrinter, 
  hasActiveFilters, 
  onClearFilters,
  onExportCSV,
  isExporting = false,
  isUpdating = false
}: ResultsHeaderProps) => {
  const printerBrand = selectedPrinter?.printer_brands?.brand || "";
  const printerName = selectedPrinter?.model_name || "";

  // Only show loading skeleton on initial load (count is 0 and no filters)
  // Keep the count visible during region transitions
  const showLoadingSkeleton = count === 0 && !hasActiveFilters && !isUpdating;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left Side: Registry Title + Count */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-primary hidden sm:block" />
            <h2 className="font-mono text-xs sm:text-sm uppercase tracking-[0.06em] sm:tracking-[0.08em] text-foreground">
              <span className="hidden sm:inline text-muted-foreground">Material Registry </span>
              <span className="text-muted-foreground sm:hidden">// </span>
              {showLoadingSkeleton ? (
                <span className="inline-block w-12 h-4 bg-primary/20 rounded animate-pulse align-middle" />
              ) : (
                <>
                  <span className="text-primary font-bold">{count.toLocaleString()}</span>
                  {isUpdating && (
                    <Loader2 className="inline-block w-3 h-3 ml-1.5 text-primary animate-spin align-middle" />
                  )}
                </>
              )}
              <span className="text-muted-foreground font-light ml-1 text-[10px] sm:text-sm">
                {hasActiveFilters ? "Matching" : "Products"}
              </span>
            </h2>
          </div>
          
          {/* Printer Context Subtitle */}
          {selectedPrinter && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Printer className="w-3 h-3" />
              <span>Compatible with {printerBrand} {printerName}</span>
              <Link 
                to="/materials" 
                className="text-primary hover:text-primary/80 transition-colors ml-1"
              >
                Change printer
              </Link>
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Clear filters
            </Button>
          )}

          {/* Export CSV */}
          {onExportCSV && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExportCSV}
              disabled={isExporting}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5" />
              )}
              Export CSV
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsHeader;
