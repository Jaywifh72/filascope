import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageLoadingSkeletonProps {
  className?: string;
  variant?: "default" | "minimal" | "cards";
}

/**
 * Full page loading skeleton for Suspense fallbacks
 * Provides visual structure while routes are loading
 */
export function PageLoadingSkeleton({ className, variant = "default" }: PageLoadingSkeletonProps) {
  if (variant === "minimal") {
    return (
      <div 
        className={cn("flex items-center justify-center min-h-screen", className)}
        role="status"
        aria-live="polite"
        aria-label="Loading page content"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div 
        className={cn("min-h-screen p-6", className)}
        role="status"
        aria-live="polite"
        aria-label="Loading page content"
      >
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        
        {/* Filter bar skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div 
      className={cn("flex items-center justify-center min-h-screen bg-background", className)}
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Animated spinner with glow */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-primary/10" />
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <div className="absolute inset-2 rounded-full bg-primary/5 animate-pulse" />
        </div>
        
        {/* Loading text skeleton */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32 opacity-50" />
        </div>
      </div>
    </div>
  );
}

/**
 * Simple card skeleton for grid loading states
 */
function CardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div 
      className="rounded-2xl bg-card/50 border border-border/50 overflow-hidden skeleton-animated"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image area */}
      <Skeleton className="h-48 w-full rounded-none" />
      
      {/* Content area */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default PageLoadingSkeleton;
