import { SkeletonBox, SkeletonText, SkeletonImage } from "@/components/ui/skeleton-primitives";

/**
 * Full-page skeleton for the brand detail page.
 * Matches the real layout: hero → description → tabs → product grid.
 * Uses staggered animation delays (75ms increments) for a polished loading feel.
 */
export function BrandDetailSkeleton() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <SkeletonBox className="h-4 w-16" />
          <SkeletonBox className="h-4 w-4 rounded-full" />
          <SkeletonBox className="h-4 w-24" />
        </div>

        {/* Hero section skeleton */}
        <div className="flex items-start gap-5 mb-8">
          {/* Brand logo — larger for emphasis */}
          <SkeletonBox className="w-20 h-20 rounded-lg shrink-0" />
          <div className="flex-1 space-y-3">
            {/* Brand name */}
            <SkeletonBox className="h-8 w-64" />
            {/* Subtitle */}
            <SkeletonBox className="h-4 w-32" style={{ animationDelay: '75ms' }} />
            {/* CTA buttons */}
            <div className="flex gap-2 mt-2">
              <SkeletonBox className="h-9 w-32 rounded-md" style={{ animationDelay: '150ms' }} />
              <SkeletonBox className="h-9 w-28 rounded-md" style={{ animationDelay: '225ms' }} />
            </div>
          </div>
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[0, 1, 2, 3].map(i => (
            <SkeletonBox
              key={i}
              className="h-20 rounded-lg"
              style={{ animationDelay: `${i * 75}ms` }}
            />
          ))}
        </div>

        {/* Description paragraph skeleton */}
        <div className="max-w-4xl mx-auto mb-6">
          <SkeletonText lines={3} size="sm" />
        </div>

        {/* Tab navigation skeleton */}
        <div className="flex gap-4 border-b border-border/40 mb-6 pb-2">
          {[0, 1, 2].map(i => (
            <SkeletonBox
              key={i}
              className="h-8 w-24 rounded-md"
              style={{ animationDelay: `${i * 75}ms` }}
            />
          ))}
        </div>

        {/* Brand Highlights skeleton */}
        <div className="mb-8">
          <SkeletonBox className="h-5 w-36 mb-4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => (
              <SkeletonBox
                key={i}
                className="h-28 rounded-xl"
                style={{ animationDelay: `${i * 75}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Popular Products skeleton — staggered cards */}
        <div className="mb-8">
          <SkeletonBox className="h-5 w-40 mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="flex-shrink-0 w-[200px] rounded-lg border border-border/30 overflow-hidden"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <SkeletonImage aspectRatio="1/1" />
                <div className="p-3 space-y-2">
                  <SkeletonBox className="h-4 w-3/4" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                  <SkeletonBox className="h-3 w-1/2" style={{ animationDelay: `${i * 100 + 100}ms` }} />
                  <SkeletonBox className="h-3 w-1/3" style={{ animationDelay: `${i * 100 + 150}ms` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Materials skeleton */}
        <div>
          <SkeletonBox className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <SkeletonBox
                key={i}
                className="h-12 rounded-lg"
                style={{ animationDelay: `${i * 75}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandDetailSkeleton;
