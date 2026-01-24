import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CompareTrayItemSkeletonProps {
  index?: number;
  className?: string;
}

/**
 * Skeleton for individual items in the compare tray
 * Matches MiniFilamentCard dimensions exactly
 */
export function CompareTrayItemSkeleton({ index = 0, className }: CompareTrayItemSkeletonProps) {
  const delay = index * 50;
  
  return (
    <div 
      className={cn(
        "relative rounded-xl bg-card/50 border border-border/50 p-3 min-w-[160px] w-[160px]",
        className
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animation: `shimmer-fade 0.3s ease-out ${delay}ms both`
      }}
    >
      {/* Remove button placeholder */}
      <Skeleton className="absolute -top-2 -right-2 h-5 w-5 rounded-full" />
      
      {/* Image */}
      <Skeleton className="h-20 w-full rounded-lg mb-2" />
      
      {/* Brand */}
      <Skeleton className="h-3 w-16 mb-1" />
      
      {/* Product name */}
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      
      {/* Price */}
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

/**
 * Skeleton for the entire compare tray loading state
 */
export function CompareTrayLoadingSkeleton({ itemCount = 4 }: { itemCount?: number }) {
  return (
    <div className="flex items-center gap-3 p-4">
      {/* Tray header */}
      <div className="flex items-center gap-2 pr-4 border-r border-border/50">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      
      {/* Item slots */}
      <div className="flex gap-3 overflow-x-auto">
        {Array.from({ length: itemCount }).map((_, i) => (
          <CompareTrayItemSkeleton key={i} index={i} />
        ))}
      </div>
      
      {/* Compare button placeholder */}
      <div className="ml-auto pl-4 border-l border-border/50">
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for comparison data loading in the compare page
 */
export function ComparisonDataSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      
      {/* Product cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 bg-card/30 rounded-xl border border-border/30 space-y-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
      
      {/* Comparison table */}
      <div className="bg-card/30 rounded-xl border border-border/30 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-5 gap-4 p-4 bg-muted/30 border-b border-border/30">
          <Skeleton className="h-5 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
        
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, row) => (
          <div key={row} className="grid grid-cols-5 gap-4 p-4 border-b border-border/20">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 4 }).map((_, col) => (
              <Skeleton key={col} className="h-4 w-20" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompareTrayItemSkeleton;
