import { useMemo } from "react";
import { SearchX, RotateCcw, Grid, Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTypoSuggestion, getSimilarSuggestions } from "@/lib/fuzzySearch";

interface PrintersEmptyStateProps {
  searchQuery?: string;
  activeFiltersCount: number;
  onResetFilters: () => void;
  onSearchBrand?: (brand: string) => void;
  totalPrinters: number;
}

const popularBrands = ["Bambu Lab", "Prusa", "Creality", "QIDI"];

export function PrintersEmptyState({
  searchQuery,
  activeFiltersCount,
  onResetFilters,
  onSearchBrand,
  totalPrinters,
}: PrintersEmptyStateProps) {
  const hasFilters = activeFiltersCount > 0 || searchQuery;

  // Check for typo suggestions
  const typoSuggestion = useMemo(() => {
    if (!searchQuery || searchQuery.length < 3) return null;
    return getTypoSuggestion(searchQuery);
  }, [searchQuery]);

  // Get similar suggestions if typo suggestion not found
  const similarSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 3 || typoSuggestion) return [];
    return getSimilarSuggestions(searchQuery, 3);
  }, [searchQuery, typoSuggestion]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-16 px-6 text-center">
      {/* Icon */}
      <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-8">
        <SearchX className="w-12 h-12 text-muted-foreground" strokeWidth={1.5} />
      </div>

      {/* Headline */}
      <h2 className="text-2xl font-bold mb-3">No Printers Found</h2>

      {/* Description */}
      <p className="text-muted-foreground max-w-md mb-6">
        {searchQuery ? (
          <>
            We couldn't find any printers matching "<span className="text-foreground font-medium">{searchQuery}</span>"
            {activeFiltersCount > 0 && " with your current filters"}.
          </>
        ) : (
          <>We couldn't find any printers matching your current filters.</>
        )}
      </p>

      {/* Typo Suggestion - "Did you mean?" */}
      {typoSuggestion && onSearchBrand && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 max-w-md w-full text-left">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-500">Did you mean?</span>
          </div>
          <button
            onClick={() => onSearchBrand(typoSuggestion)}
            className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            "{typoSuggestion}"
          </button>
        </div>
      )}

      {/* Similar Suggestions */}
      {!typoSuggestion && similarSuggestions.length > 0 && onSearchBrand && (
        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 max-w-md w-full text-left">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Similar searches</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {similarSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSearchBrand(suggestion)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm",
                  "bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50",
                  "text-foreground transition-all duration-150 hover:scale-105"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions Box */}
      {hasFilters && (
        <div className="bg-card/50 border border-border/50 rounded-xl p-6 max-w-md w-full mb-8 text-left">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">
            Try:
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {activeFiltersCount > 1 && (
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                Removing some filters to see more results
              </li>
            )}
            {activeFiltersCount > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                Broadening your budget range
              </li>
            )}
            {searchQuery && !typoSuggestion && (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Checking your search for typos
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Using different search terms (e.g., brand names)
                </li>
              </>
            )}
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              Browsing all {totalPrinters} printers without filters
            </li>
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        {hasFilters && (
          <Button
            variant="outline"
            onClick={onResetFilters}
            className="h-12 px-6 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset All Filters
          </Button>
        )}
        <Button
          onClick={onResetFilters}
          className="h-12 px-6"
        >
          <Grid className="w-4 h-4 mr-2" />
          Browse All Printers
        </Button>
      </div>

      {/* Popular brands quick links */}
      {searchQuery && onSearchBrand && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">Or try searching for popular brands:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {popularBrands.map((brand) => (
              <button
                key={brand}
                onClick={() => onSearchBrand(brand)}
                className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/15 hover:border-primary/50 transition-colors"
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PrintersEmptyState;
