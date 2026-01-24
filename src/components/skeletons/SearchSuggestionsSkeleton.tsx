import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SearchSuggestionsSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Skeleton for search suggestions dropdown
 * Matches SearchInputWithHistory dropdown exactly
 */
export function SearchSuggestionsSkeleton({ count = 5, className }: SearchSuggestionsSkeletonProps) {
  return (
    <div className={cn(
      "absolute top-full left-0 right-0 mt-2 z-50",
      "bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-xl",
      "animate-in fade-in-0 slide-in-from-top-2 duration-200",
      "p-2",
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <SearchSuggestionItemSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

interface SearchSuggestionItemSkeletonProps {
  index?: number;
}

export function SearchSuggestionItemSkeleton({ index = 0 }: SearchSuggestionItemSkeletonProps) {
  const delay = index * 30;
  
  return (
    <div 
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
      style={{ 
        animationDelay: `${delay}ms`,
        animation: `shimmer-fade 0.2s ease-out ${delay}ms both`
      }}
    >
      {/* Icon */}
      <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
      
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      
      {/* Type badge */}
      <Skeleton className="h-5 w-14 rounded flex-shrink-0" />
    </div>
  );
}

/**
 * Recent searches skeleton
 */
export function RecentSearchesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="p-2">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
      
      {/* Recent items */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
          <Skeleton className="h-4 flex-1 max-w-[200px]" />
        </div>
      ))}
    </div>
  );
}

/**
 * Full search dropdown skeleton with loading state
 */
export function SearchDropdownSkeleton() {
  return (
    <div className={cn(
      "absolute top-full left-0 right-0 mt-2 z-50",
      "bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-xl",
      "max-h-[400px] overflow-hidden"
    )}>
      {/* Loading indicator at top */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Searching...</span>
      </div>
      
      {/* Suggestion skeletons */}
      <SearchSuggestionsSkeleton count={4} className="relative border-0 shadow-none" />
    </div>
  );
}

export default SearchSuggestionsSkeleton;
