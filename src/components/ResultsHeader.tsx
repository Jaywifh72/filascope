import { X, Printer, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface ResultsHeaderProps {
  count: number;
  totalCatalogCount?: number;
  totalVariantCount?: number;
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
  totalVariantCount,
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
    <div id="filament-catalog" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 py-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left Side: Title + Count */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-foreground">
              Browse All Filaments
            </h2>
            {printerShortName && (
              <Badge variant="outline" className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full border-border">
                {printerShortName}
              </Badge>
            )}
          </div>
          
          {/* Subtitle with counts */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-normal flex-wrap">
            {showLoadingSkeleton ? (
              <span className="inline-block w-40 h-4 bg-muted rounded animate-pulse align-middle" />
            ) : (
              <>
                <span>
                  {count.toLocaleString()} products
                  {isUpdating && (
                    <Loader2 className="inline-block w-3 h-3 ml-1.5 text-primary animate-spin align-middle" />
                  )}
                  {totalVariantCount ? ` (${totalVariantCount.toLocaleString()} variants)` : ""}
                </span>
                {selectedPrinter && (
                  <span>
                    · compatible with {printerBrand} {printerName}
                  </span>
                )}
                {totalCatalogCount && totalCatalogCount > count && !selectedPrinter ? (
                  <span className="text-muted-foreground/60">of {totalCatalogCount.toLocaleString()} total</span>
                ) : null}
              </>
            )}
          </div>
          
          {/* Printer change link */}
          {selectedPrinter && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <Printer className="w-3 h-3" />
              <Link 
                to="/materials" 
                className="text-primary text-xs hover:text-primary/80 underline underline-offset-2"
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
