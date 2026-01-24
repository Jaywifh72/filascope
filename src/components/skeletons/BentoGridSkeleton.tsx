import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for the BentoGrid featured content section
 * Matches exact layout and dimensions of the real content
 */
export function BentoGridSkeleton() {
  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-4 p-6 max-w-[1800px] mx-auto">
      {/* Featured Filament - 2x2 Large Block */}
      <div className="col-span-2 row-span-2 rounded-xl bg-card/50 border border-border/50 overflow-hidden">
        <div className="h-full flex flex-col">
          <Skeleton className="flex-1 min-h-[200px] rounded-none" />
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-48" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Price Drops - 1x2 Tall Block */}
      <div className="col-span-1 row-span-2 rounded-xl bg-card/50 border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-3 w-28 mt-1" />
        </div>
        <div className="p-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <PriceDropItemSkeleton key={i} index={i} />
          ))}
        </div>
      </div>

      {/* New Arrival - 1x1 Small Block */}
      <div className="col-span-1 row-span-1 rounded-xl bg-card/50 border border-border/50 overflow-hidden">
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>

      {/* Community Alert - 1x1 Small Block */}
      <div className="col-span-1 row-span-1 rounded-xl bg-card/50 border border-border/50 overflow-hidden">
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="p-3 space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function PriceDropItemSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div 
      className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2.5 w-20" />
      </div>
      <Skeleton className="h-3 w-10 shrink-0" />
    </div>
  );
}

export default BentoGridSkeleton;
