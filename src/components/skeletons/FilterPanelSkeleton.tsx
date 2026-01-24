import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FilterPanelSkeletonProps {
  className?: string;
  sections?: number;
}

/**
 * Skeleton for filter sidebar/panel sections
 * Matches exact dimensions of HorizontalFilterBar and MobileFilamentFilterSheet
 */
export function FilterPanelSkeleton({ className, sections = 4 }: FilterPanelSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <FilterSectionSkeleton key={sectionIndex} index={sectionIndex} />
      ))}
    </div>
  );
}

interface FilterSectionSkeletonProps {
  index?: number;
}

export function FilterSectionSkeleton({ index = 0 }: FilterSectionSkeletonProps) {
  // Staggered animation delay
  const delay = index * 100;
  
  return (
    <div 
      className="space-y-3"
      style={{ 
        animationDelay: `${delay}ms`,
        animation: `shimmer-fade 0.4s ease-out ${delay}ms both`
      }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      
      {/* Filter options */}
      <div className="space-y-2">
        {Array.from({ length: 4 + (index % 3) }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1 max-w-[120px]" />
            <Skeleton className="h-4 w-8 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Horizontal filter bar skeleton for desktop
 */
export function HorizontalFilterBarSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 bg-card/50 rounded-xl border border-border/50">
      {/* Search skeleton */}
      <Skeleton className="h-10 w-64 rounded-lg" />
      
      {/* Filter dropdowns */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-32 rounded-lg" />
      ))}
      
      {/* Sort dropdown */}
      <Skeleton className="h-10 w-40 rounded-lg ml-auto" />
    </div>
  );
}

/**
 * Mobile filter chips skeleton
 */
export function MobileFilterChipsSkeleton() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <Skeleton className="h-9 w-20 rounded-full flex-shrink-0" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />
      ))}
    </div>
  );
}

export default FilterPanelSkeleton;
