import { Link } from "react-router-dom";
import { Beaker, Search, Sparkles, ArrowRight, X, Target, Lightbulb, Filter, Tag, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { getTypoSuggestion, getSimilarSuggestions } from "@/lib/fuzzySearch";

interface FilamentsEmptyStateProps {
  searchTerm?: string;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onSearchChange?: (value: string) => void;
  className?: string;
  // Smart suggestion props
  detectedBrands?: string[];
  detectedMaterials?: string[];
  onBrandFilter?: (brand: string) => void;
  onMaterialFilter?: (material: string) => void;
  // Active filter context for diagnostic messages
  selectedMaterials?: string[];
  selectedBrands?: string[];
}

const popularSearches = [
  { label: "PLA", query: "PLA" },
  { label: "PETG", query: "PETG" },
  { label: "Carbon Fiber", query: "carbon fiber" },
  { label: "Silk", query: "silk" },
  { label: "High Speed", query: "high speed" },
];

const quickCategories = [
  { label: "All PLA", action: "material", value: "PLA" },
  { label: "Best Deals", action: "popular", value: "deals" },
  { label: "Best for HueForge", action: "hueforge", value: "td" },
  { label: "High Speed", action: "popular", value: "highspeed" },
];

export function FilamentsEmptyState({
  searchTerm,
  hasActiveFilters,
  onClearFilters,
  onSearchChange,
  className,
  detectedBrands = [],
  detectedMaterials = [],
  onBrandFilter,
  onMaterialFilter,
  selectedMaterials = [],
  selectedBrands = [],
}: FilamentsEmptyStateProps) {
  const isSearchEmpty = searchTerm && searchTerm.trim().length > 0;

  // Check for typo suggestions
  const typoSuggestion = useMemo(() => {
    if (!searchTerm || searchTerm.length < 3) return null;
    return getTypoSuggestion(searchTerm);
  }, [searchTerm]);

  // Get similar suggestions if typo suggestion not found
  const similarSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 3 || typoSuggestion) return [];
    return getSimilarSuggestions(searchTerm, 3);
  }, [searchTerm, typoSuggestion]);

  // Check if we have detected brands or materials for smart suggestions
  const hasSmartSuggestions = detectedBrands.length > 0 || detectedMaterials.length > 0;

  // Diagnostic subtext based on most restrictive filter
  const diagnosticMessage = useMemo(() => {
    if (isSearchEmpty) return "Try adjusting your search terms or browse our catalog.";

    const activeMaterials = selectedMaterials.filter(m => m !== "All");
    if (activeMaterials.length === 1) {
      return `Try broadening your material selection — ${activeMaterials[0]} has fewer options with your current filters.`;
    }
    if (selectedBrands.length === 1) {
      return `Try adding more brands or removing the ${selectedBrands[0]} filter.`;
    }
    if (selectedBrands.length > 1) {
      return "Try adding more brands or removing the brand filter.";
    }
    if (activeMaterials.length > 1) {
      return "Try selecting fewer materials or removing other active filters.";
    }
    return "Try removing some filters or broadening your search criteria.";
  }, [isSearchEmpty, selectedMaterials, selectedBrands]);

  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange?.(suggestion);
  };

  const handleQuickCategory = (cat: typeof quickCategories[0]) => {
    if (cat.action === "material" && onMaterialFilter) {
      onClearFilters();
      onMaterialFilter(cat.value);
    } else {
      // For popular/hueforge, clear filters and set search
      onClearFilters();
      if (cat.value === "highspeed" && onSearchChange) {
        onSearchChange("high speed");
      }
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4",
      "animate-in fade-in-0 duration-200",
      className
    )}>
      {/* Dashed border container */}
      <div className="max-w-md w-full mx-auto rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
        {/* Icon */}
        <div className="mb-4">
          <SearchX className="w-12 h-12 text-muted-foreground mx-auto animate-pulse" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {isSearchEmpty
            ? `No results for "${searchTerm}"`
            : "No filaments match your filters"
          }
        </h2>

        {/* Diagnostic subtext */}
        <p className="text-sm text-muted-foreground mb-6">
          {diagnosticMessage}
        </p>

        {/* Typo Suggestion - "Did you mean?" */}
        {typoSuggestion && onSearchChange && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-500">Did you mean?</span>
            </div>
            <button
              onClick={() => handleSuggestionClick(typoSuggestion)}
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
            >
              "{typoSuggestion}"
            </button>
          </div>
        )}

        {/* Similar Suggestions */}
        {!typoSuggestion && similarSuggestions.length > 0 && onSearchChange && (
          <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Similar searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {similarSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
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

        {/* Smart Suggestions - Based on detected brands/materials */}
        {hasSmartSuggestions && !typoSuggestion && (
          <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Try filtering instead</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              We found related terms in your search. Try using filters:
            </p>
            <div className="flex flex-wrap gap-2">
              {detectedMaterials.map((material) => (
                <Button
                  key={material}
                  variant="outline"
                  size="sm"
                  onClick={() => onMaterialFilter?.(material)}
                  className="gap-1.5 border-primary/30 hover:border-primary/50 hover:bg-primary/10"
                >
                  <Tag className="w-3 h-3" />
                  Browse all {material}
                </Button>
              ))}
              {detectedBrands.map((brand) => (
                <Button
                  key={brand}
                  variant="outline"
                  size="sm"
                  onClick={() => onBrandFilter?.(brand)}
                  className="gap-1.5 border-primary/30 hover:border-primary/50 hover:bg-primary/10"
                >
                  <Tag className="w-3 h-3" />
                  View {brand} filaments
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 mb-0">
          {hasActiveFilters && (
            <Button
              onClick={onClearFilters}
              variant="default"
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Clear All Filters
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            className="gap-2 border-border"
          >
            <Link to="/wizard">
              <Target className="w-4 h-4" />
              Browse Popular
            </Link>
          </Button>
        </div>

        {/* Quick category chips */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">Or try these popular categories:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {quickCategories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => handleQuickCategory(cat)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full cursor-pointer transition-colors",
                  "bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
