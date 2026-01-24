import { Link } from "react-router-dom";
import { Beaker, Search, Sparkles, ArrowRight, X, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilamentsEmptyStateProps {
  searchTerm?: string;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  className?: string;
}

const popularSearches = [
  { label: "PLA", query: "PLA" },
  { label: "PETG", query: "PETG" },
  { label: "Carbon Fiber", query: "carbon fiber" },
  { label: "Silk", query: "silk" },
  { label: "High Speed", query: "high speed" },
];

const suggestedMaterials = [
  { name: "Bambu Lab PLA Basic", reason: "Best seller" },
  { name: "Polymaker PolyLite PETG", reason: "Great value" },
  { name: "Prusament ASA", reason: "Premium quality" },
];

export function FilamentsEmptyState({
  searchTerm,
  hasActiveFilters,
  onClearFilters,
  className,
}: FilamentsEmptyStateProps) {
  const isSearchEmpty = searchTerm && searchTerm.trim().length > 0;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4",
      "animate-in fade-in-0 duration-300",
      className
    )}>
      {/* Illustration */}
      <div className="relative mb-8">
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-primary/15 rounded-full blur-3xl scale-150 opacity-50" />
        
        {/* Main icon container */}
        <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-8 transition-transform duration-300 hover:scale-105">
          {isSearchEmpty ? (
            <Search className="w-16 h-16 text-muted-foreground" strokeWidth={1.5} />
          ) : (
            <Beaker className="w-16 h-16 text-muted-foreground" strokeWidth={1.5} />
          )}
          
          {/* Decorative elements */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/60 rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary/40 rounded-full" />
          
          {/* X indicator for no results */}
          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Message */}
      <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
        {isSearchEmpty 
          ? `No results for "${searchTerm}"`
          : "No filaments match your filters"
        }
      </h2>
      
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {isSearchEmpty 
          ? "Try adjusting your search terms or browse our catalog."
          : "Try removing some filters or explore our popular materials."
        }
      </p>

      {/* Primary Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        {hasActiveFilters && (
          <Button 
            onClick={onClearFilters} 
            variant="default"
            size="lg"
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Clear All Filters
          </Button>
        )}
        
        <Button 
          asChild
          variant={hasActiveFilters ? "outline" : "default"}
          size="lg"
          className="gap-2"
        >
          <Link to="/wizard">
            <Target className="w-4 h-4" />
            Try Quick Match
          </Link>
        </Button>
      </div>

      {/* Popular Searches */}
      <div className="w-full max-w-lg mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Popular Searches
          </h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((search) => (
            <Link
              key={search.label}
              to={`/?search=${encodeURIComponent(search.query)}`}
              className={cn(
                "px-4 py-2 rounded-lg",
                "bg-gray-800/60 hover:bg-gray-800 border border-gray-700 hover:border-primary/50",
                "text-sm text-foreground",
                "transition-all duration-150 hover:scale-105"
              )}
            >
              {search.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Browse All CTA */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-2">
          Or explore our full catalog of <span className="text-primary font-medium">10,000+</span> filaments
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          Browse All Materials
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
