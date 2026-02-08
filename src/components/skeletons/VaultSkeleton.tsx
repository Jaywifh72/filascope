import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for the Vault page loading state — matches new sidebar + hero layout
 */
export function VaultSkeleton() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Hero Bar Skeleton */}
      <div className="rounded-xl bg-card/50 border border-border/50 p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/40">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Sidebar + Content */}
      <div className="flex gap-6">
        {/* Sidebar Skeleton — hidden on mobile */}
        <div className="hidden md:block shrink-0 w-52 rounded-xl bg-card/30 border border-border/40 p-2 space-y-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-10 w-full rounded-lg"
              style={{ animationDelay: `${i * 40}ms` }}
            />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Greeting */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-card/50 border border-border/50 p-4 flex flex-col items-center gap-2 skeleton-animated"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>

          {/* Activity Feed */}
          <div className="rounded-xl bg-card/50 border border-border/50 p-5 space-y-4">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 skeleton-animated"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-16 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VaultSkeleton;
