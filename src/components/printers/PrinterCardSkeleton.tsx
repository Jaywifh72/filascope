import { Skeleton } from "@/components/ui/skeleton";

interface PrinterCardSkeletonProps {
  index?: number;
}

export function PrinterCardSkeleton({ index = 0 }: PrinterCardSkeletonProps) {
  return (
    <div 
      className="relative rounded-2xl bg-card/50 border border-border/50 overflow-hidden skeleton-animated"
      style={{ 
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Header with badge and checkbox */}
      <div className="flex items-center justify-between p-3 bg-muted/30">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-7 w-7 rounded-md" />
      </div>

      {/* Image area */}
      <div className="relative h-[180px] flex items-center justify-center bg-muted/20 p-4">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>

      {/* Content area */}
      <div className="p-4 space-y-3">
        {/* Brand */}
        <Skeleton className="h-3 w-20" />
        
        {/* Product name */}
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>

        {/* Price */}
        <Skeleton className="h-7 w-24" />

        {/* Specs */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>

        {/* Button */}
        <Skeleton className="h-10 w-full rounded-lg mt-3" />
      </div>
    </div>
  );
}

export function PrinterCardSkeletonGrid({ count = 24 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <PrinterCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

export default PrinterCardSkeleton;
