import { X, Printer, Database, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface ResultsHeaderProps {
  count: number;
  totalCatalogCount?: number;
  selectedPrinter?: { model_name: string; printer_brands?: { brand: string } | null } | null;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onExportCSV?: () => void;
  isExporting?: boolean;
  isUpdating?: boolean;
}

const ResultsHeader = ({ 
  count, 
  totalCatalogCount,
  selectedPrinter, 
  hasActiveFilters, 
  onClearFilters,
  onExportCSV,
  isExporting = false,
  isUpdating = false
}: ResultsHeaderProps) => {
  const printerBrand = selectedPrinter?.printer_brands?.brand || "";
  const printerName = selectedPrinter?.model_name || "";
  const printerShortName = printerName ? `${printerBrand} ${printerName}`.trim() : "";

  const showLoadingSkeleton = count === 0 && !hasActiveFilters && !isUpdating;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 py-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left Side: Registry Title + Count */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Database className="w-5 h-5 text-primary hidden sm:block" />
            <h2 className="text-lg font-bold text-foreground">
              Material Registry
            </h2>
            <span className="text-muted-foreground">—</span>
            {showLoadingSkeleton ? (
              <span className="inline-block w-16 h-5 bg-primary/20 rounded animate-pulse align-middle" />
            ) : (
              <>
                <span className="text-cyan-400 font-bold">
                  {count.toLocaleString()}
                  {isUpdating && (
                    <Loader2 className="inline-block w-3 h-3 ml-1.5 text-primary animate-spin align-middle" />
                  )}
                </span>
                <span className="text-muted-foreground text-sm font-normal">
                  {selectedPrinter ? "compatible" : hasActiveFilters ? "matching" : "products"}
                  {totalCatalogCount && totalCatalogCount > count ? (
                    <> of {totalCatalogCount.toLocaleString()} total</>
                  ) : null}
                </span>
              </>
            )}
            {printerShortName && (
              <Badge variant="outline" className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full border-border">
                {printerShortName}
              </Badge>
            )}
          </div>
          
          {/* Printer Context Subtitle */}
          {selectedPrinter && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Printer className="w-3 h-3" />
              <span>Compatible with {printerBrand} {printerName}</span>
              <span className="mx-1">·</span>
              <Link 
                to="/materials" 
                className="text-cyan-400 text-xs hover:text-cyan-300 underline underline-offset-2"
              >
                Change printer
              </Link>
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
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
