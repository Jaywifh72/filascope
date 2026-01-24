import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for the Vault page loading state
 */
export function VaultSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-10 w-40 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="grid w-full grid-cols-4 gap-2 p-1 bg-muted/50 rounded-lg">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>

        {/* Collection tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>

        {/* Items list */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <WishlistItemSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WishlistItemSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div 
      className="rounded-xl bg-card/50 border border-border/50 p-4 skeleton-animated"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex gap-4">
        <Skeleton className="w-4 h-4 rounded shrink-0 mt-1" />
        <Skeleton className="w-20 h-20 rounded shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export default VaultSkeleton;
