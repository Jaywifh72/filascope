import { Skeleton } from '@/components/ui/skeleton';

export function BrandSectionSkeleton() {
  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

export function ProductTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-9 gap-4 px-4 py-3 bg-muted/50 rounded-t-lg">
        <Skeleton className="h-4 w-24 col-span-2" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-9 gap-4 px-4 py-3 border-b border-border">
          <Skeleton className="h-4 w-full col-span-2" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function InventoryTabSkeleton() {
  return (
    <div className="mt-4 space-y-4">
      <Skeleton className="h-5 w-64" />
      <BrandSectionSkeleton />
      <BrandSectionSkeleton />
      <BrandSectionSkeleton />
    </div>
  );
}

export function SyncStatusSkeleton() {
  return (
    <div className="mt-4 space-y-6">
      {/* Current Sync Status */}
      <div className="border border-border rounded-lg p-4">
        <Skeleton className="h-6 w-40 mb-3" />
        <Skeleton className="h-8 w-full" />
      </div>
      
      {/* Brand Health Grid */}
      <div className="border border-border rounded-lg p-4">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
      
      {/* Recent Sync Runs */}
      <div className="border border-border rounded-lg p-4">
        <Skeleton className="h-6 w-36 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
