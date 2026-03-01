import { SkeletonBox, SkeletonText } from "@/components/ui/skeleton-primitives";

export function GuideCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="rounded-xl border border-border bg-card/50 p-5 flex flex-col gap-3 skeleton-animated"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Category badge */}
      <SkeletonBox className="h-5 w-20 rounded-full" />

      {/* Title */}
      <SkeletonText lines={2} size="lg" />

      {/* Description */}
      <SkeletonText lines={2} size="md" />

      {/* Footer */}
      <div className="flex items-center gap-4 mt-auto pt-2">
        <SkeletonBox className="h-4 w-20" />
        <SkeletonBox className="h-4 w-24" />
      </div>
    </div>
  );
}

export function GuideCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <GuideCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}
