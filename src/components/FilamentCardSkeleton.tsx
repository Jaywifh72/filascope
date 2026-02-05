import { Skeleton } from "@/components/ui/skeleton";

interface FilamentCardSkeletonProps {
  index?: number;
}

export function FilamentCardSkeleton({ index = 0 }: FilamentCardSkeletonProps) {
  return (
    <div 
      className="relative rounded-2xl bg-card/60 border border-border/40 min-h-[380px] skeleton-animated overflow-hidden"
      style={{ 
        // Cap animation delay to first 12 cards
        animationDelay: `${Math.min(index, 12) * 40}ms`,
      }}
    >
      {/* Checkbox placeholder - top right */}
      <div className="absolute top-4 right-4 z-10">
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>

      {/* Header Section - Brand logo area */}
      <div className="h-[72px] px-4 pt-4 pb-4 border-b border-border/30 bg-card/40">
        <div className="flex items-center justify-center h-full">
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Product Image Section */}
      <div className="relative h-32 border-b border-border/30 flex items-center justify-center bg-muted/10">
        <Skeleton className="w-20 h-20 rounded-lg" />
        {/* Color swatch placeholder */}
        <div className="absolute bottom-2 right-2">
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
      </div>

      {/* Body Section */}
      <div className="px-4 py-4 bg-card/20">
        {/* Product Name */}
        <Skeleton className="h-5 w-4/5 mb-3" />
        
        {/* Material Badge + Price Row */}
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-12 rounded" />
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        
        {/* Temp specs */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Footer Section - Rating + CTA */}
      <div className="px-4 py-3 border-t border-border/20">
        {/* Star rating */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-4 h-4 rounded" />
          ))}
          <Skeleton className="h-4 w-8 ml-1.5" />
        </div>
        {/* CTA Button */}
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function FilamentCardSkeletonGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <FilamentCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

export default FilamentCardSkeleton;
