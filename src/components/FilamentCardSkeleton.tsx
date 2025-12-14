import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function FilamentCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
      {/* Header: Brand + Material Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>

      {/* Title */}
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-3/4 mb-3" />

      {/* Color swatch */}
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-6 h-6 rounded" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Score */}
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-5 h-5 rounded-full" />
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-4 w-8" />
      </div>

      <Skeleton className="h-3 w-48 mb-4" />

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-8" />
      </div>

      {/* Properties */}
      <div className="flex gap-1.5 mb-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>

      {/* Additional props */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>

      {/* CTA */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 flex-1 rounded-md" />
      </div>
    </div>
  );
}

export function FilamentCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <FilamentCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default FilamentCardSkeleton;
