import { Skeleton } from "@/components/ui/skeleton";

interface FilamentCardSkeletonProps {
  index?: number;
}

export function FilamentCardSkeleton({ index = 0 }: FilamentCardSkeletonProps) {
  return (
    <div 
      className="relative rounded-2xl bg-card/60 border border-border/40 min-h-[420px] skeleton-animated overflow-hidden"
      style={{ 
        // Cap animation delay to first 12 cards
        animationDelay: `${Math.min(index, 12) * 40}ms`,
      }}
    >
      {/* Checkbox placeholder - top right */}
      <div className="absolute top-4 right-4">
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>

      {/* Header Section */}
      <div className="px-6 pt-6 pb-4 border-b border-border/50">
        {/* Brand - centered */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-3 w-20" />
        </div>
        
        {/* Color swatches - centered */}
        <div className="flex items-center justify-center gap-1 mb-2">
          <Skeleton className="w-3.5 h-3.5 rounded-full" />
          <Skeleton className="w-3.5 h-3.5 rounded-full" />
          <Skeleton className="w-3.5 h-3.5 rounded-full" />
        </div>
        
        {/* Product Name - centered */}
        <div className="text-center">
          <Skeleton className="h-5 w-full mb-1.5 mx-auto" />
          <Skeleton className="h-5 w-3/4 mx-auto" />
        </div>
      </div>

      {/* Rating Section */}
      <div className="px-6 py-4 flex items-center gap-3">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>

      {/* Price Section */}
      <div className="px-6 py-4 border-b border-border/50">
        <div className="flex items-baseline gap-1">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-8" />
        </div>
        <Skeleton className="h-6 w-28 rounded-md mt-2" />
      </div>

      {/* Key Specs Section */}
      <div className="px-6 py-4 flex gap-2">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Availability Section */}
      <div className="px-6 py-3 border-b border-border/50">
        <Skeleton className="h-7 w-24 rounded-md" />
      </div>

      {/* CTA Button */}
      <div className="px-6 pt-5 pb-6">
        <Skeleton className="h-12 w-full rounded-lg" />
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
