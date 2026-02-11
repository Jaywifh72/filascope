import { Skeleton } from "@/components/ui/skeleton";

interface FilamentCardSkeletonProps {
  index?: number;
}

export function FilamentCardSkeleton({ index = 0 }: FilamentCardSkeletonProps) {
  return (
    <div 
      className="relative rounded-2xl bg-card/60 border border-border/40 min-h-[420px] flex flex-col skeleton-animated overflow-hidden"
      style={{ 
        animationDelay: `${Math.min(index, 12) * 40}ms`,
      }}
    >
      {/* Checkbox placeholder - top right */}
      <div className="absolute top-4 right-4 z-10">
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>

      {/* Element 1: Brand row + Name */}
      <div className="px-6 pt-6 pb-3 border-b border-border/30">
        {/* Brand row with swatches */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-3 w-20" />
          <div className="flex-1" />
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="w-5 h-5 rounded-full" />
            ))}
          </div>
        </div>
        {/* Name - 3 lines */}
        <Skeleton className="h-5 w-full mb-1.5" />
        <Skeleton className="h-5 w-4/5 mb-1.5" />
        <Skeleton className="h-5 w-3/5" />
      </div>

      {/* Element 2: Badge row */}
      <div className="px-6 py-3 flex gap-2">
        <Skeleton className="h-7 w-16 rounded-md" />
        <Skeleton className="h-7 w-20 rounded-md" />
      </div>

      {/* Element 3: Price */}
      <div className="px-6 py-3">
        <div className="flex items-baseline gap-1">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-6" />
        </div>
        <Skeleton className="h-3 w-28 mt-1.5" />
      </div>

      {/* Element 4: Meta row */}
      <div className="px-6 py-2 flex items-center gap-2 flex-grow">
        <Skeleton className="h-5 w-10 rounded-full" />
        <Skeleton className="w-1.5 h-1.5 rounded-full" />
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Element 5: CTA Button */}
      <div className="px-6 py-4">
        <Skeleton className="h-11 w-full rounded-lg" />
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
