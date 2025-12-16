import { Skeleton } from "@/components/ui/skeleton";

interface FilamentCardSkeletonProps {
  index?: number;
}

export function FilamentCardSkeleton({ index = 0 }: FilamentCardSkeletonProps) {
  return (
    <div 
      className="relative rounded-2xl bg-white/[0.03] border border-white/[0.08] min-h-[320px]"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Checkbox placeholder */}
      <div className="absolute top-4 left-4">
        <Skeleton className="w-6 h-6 rounded-md" />
      </div>

      {/* Header Section */}
      <div className="px-6 pt-6 pb-4 border-b border-white/[0.05]">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-2 pl-8">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-3 w-20" />
        </div>
        
        {/* Product Name + Color Swatch */}
        <div className="flex items-start gap-2 pl-8">
          <div className="flex-1">
            <Skeleton className="h-5 w-full mb-1.5" />
            <Skeleton className="h-5 w-3/4" />
          </div>
          <Skeleton className="w-4 h-4 rounded-full flex-shrink-0 mt-1" />
        </div>
      </div>

      {/* Rating Section */}
      <div className="px-6 py-4 flex items-center gap-3">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>

      {/* Price Section */}
      <div className="px-6 py-4 border-b border-white/[0.05]">
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

      {/* CTA Button */}
      <div className="px-6 pb-6">
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function FilamentCardSkeletonGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <FilamentCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

export default FilamentCardSkeleton;
