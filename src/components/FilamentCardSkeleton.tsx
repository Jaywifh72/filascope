import { Skeleton } from "@/components/ui/skeleton";

interface FilamentCardSkeletonProps {
  index?: number;
}

/**
 * Skeleton placeholder matching LabReadoutCard layout exactly.
 * Sections: Header (brand), Image, Body (name, badges, price, temp), Footer (rating, CTA)
 */
export function FilamentCardSkeleton({ index = 0 }: FilamentCardSkeletonProps) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-border bg-card/80 skeleton-animated"
      style={{
        animationDelay: `${Math.min(index, 12) * 40}ms`,
      }}
    >
      {/* Header — brand logo area (h-[72px]) */}
      <div className="relative bg-muted/60 px-4 pt-4 pb-4 h-[72px] flex items-center justify-center">
        <Skeleton className="h-8 w-24 rounded" />
        {/* Compare button placeholder */}
        <div className="absolute top-3 right-3">
          <Skeleton className="w-5 h-5 rounded-full" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
      </div>

      {/* Image area (h-32) */}
      <div className="relative h-32 bg-muted/30 border-b border-border/50 flex items-center justify-center">
        <Skeleton className="w-20 h-20 rounded-xl" />
        {/* Color swatch overlay */}
        <Skeleton className="absolute bottom-2 right-2 w-6 h-6 rounded-full" />
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-3">
        {/* Product name */}
        <Skeleton className="h-5 w-3/4 rounded" />

        {/* Material badge + Price row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-12 rounded" />
            <Skeleton className="h-5 w-14 rounded" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-6 w-20 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>

        {/* Nozzle temp */}
        <div className="space-y-1">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
      </div>

      {/* Footer — rating + CTA */}
      <div className="px-4 py-3 border-t border-border/30 space-y-3">
        {/* Star rating */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-4 h-4 rounded" />
          ))}
          <Skeleton className="ml-1.5 h-4 w-8 rounded" />
        </div>

        {/* Community rating */}
        <Skeleton className="h-3.5 w-28 rounded" />

        {/* CTA button */}
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function FilamentCardSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <FilamentCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

export default FilamentCardSkeleton;
