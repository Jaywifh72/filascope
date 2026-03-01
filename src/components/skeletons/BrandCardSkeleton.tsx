import { SkeletonBox, SkeletonCircle } from "@/components/ui/skeleton-primitives";

export function BrandCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="min-h-[260px] rounded-xl border border-border overflow-hidden bg-card flex flex-col skeleton-animated"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Color accent bar */}
      <SkeletonBox className="h-1 w-full rounded-none" />

      {/* Logo area */}
      <div className="h-[88px] bg-gray-800/60 flex items-center justify-center relative">
        <SkeletonBox className="h-10 w-24 rounded-lg" />
        {/* Price tier badge */}
        <SkeletonBox className="absolute top-2 left-2 h-5 w-8 rounded" />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Brand name */}
        <SkeletonBox className="h-6 w-2/3" />

        {/* Stats row */}
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-4 w-16" />
        </div>

        {/* Material badges */}
        <div className="flex flex-wrap gap-1.5">
          {[16, 14, 18].map((w, i) => (
            <SkeletonBox key={i} className="h-5 rounded-full" style={{ width: `${w * 4}px` }} />
          ))}
        </div>

        {/* Color dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCircle key={i} size={12} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-border p-3">
        <SkeletonBox className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function BrandCardSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <BrandCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}
