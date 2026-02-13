import { Skeleton } from "@/components/ui/skeleton";

export function DealCardSkeleton({ index = 0 }: { index?: number }) {
  const delay = `${index * 100}ms`;
  return (
    <div
      className="rounded-xl border border-border bg-card p-3 flex flex-col gap-2 skeleton-animated"
      style={{ animationDelay: delay }}
    >
      {/* Image area */}
      <Skeleton className="h-[120px] w-full rounded-lg" />
      {/* Brand row + material badge */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-10 rounded" />
      </div>
      {/* Product name - two lines */}
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
      {/* Price */}
      <Skeleton className="h-5 w-32 rounded" />
      {/* Metadata line */}
      <Skeleton className="h-3 w-full rounded" />
      {/* Color swatches */}
      <div className="flex items-center gap-1.5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-5 h-5 rounded-full" />
        ))}
      </div>
      {/* CTA button */}
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}

export function DealCardSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <DealCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}
