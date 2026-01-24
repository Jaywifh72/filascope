import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProductDetailSkeletonProps {
  className?: string;
  variant?: "filament" | "printer";
}

/**
 * Full page skeleton for product detail pages
 * Matches FilamentDetail and PrinterDetail layout exactly
 */
export function ProductDetailSkeleton({ className, variant = "filament" }: ProductDetailSkeletonProps) {
  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-background via-background to-accent/5", className)}>
      {/* Back navigation */}
      <div className="px-6 pt-6">
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Hero Section */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Image Gallery */}
            <div className="lg:col-span-5">
              <ProductImageSkeleton />
            </div>
            
            {/* Right: Product Info */}
            <div className="lg:col-span-7 space-y-6">
              <ProductInfoSkeleton variant={variant} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs Section */}
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <ProductTabsSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * Product image gallery skeleton
 */
export function ProductImageSkeleton() {
  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted/20 border border-border/50">
        <Skeleton className="absolute inset-0" />
        {/* Zoom hint */}
        <Skeleton className="absolute bottom-4 right-4 h-8 w-24 rounded-full" />
      </div>
      
      {/* Thumbnail strip */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              "w-16 h-16 rounded-lg flex-shrink-0",
              i === 0 && "ring-2 ring-primary"
            )} 
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Product info section skeleton (title, specs, price)
 */
interface ProductInfoSkeletonProps {
  variant?: "filament" | "printer";
}

export function ProductInfoSkeleton({ variant = "filament" }: ProductInfoSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb / Brand */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-8 w-3/4 max-w-sm" />
      </div>
      
      {/* Rating */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-5 rounded" />
          ))}
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Quick specs badges */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: variant === "filament" ? 3 : 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      
      {/* Price section */}
      <PriceSkeleton />
      
      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-12 flex-1 rounded-lg" />
        <Skeleton className="h-12 w-12 rounded-lg" />
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Price panel skeleton
 */
export function PriceSkeleton() {
  return (
    <div className="p-4 bg-card/50 rounded-xl border border-border/50 space-y-3">
      <div className="flex items-baseline gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  );
}

/**
 * Product tabs skeleton
 */
export function ProductTabsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tab headers */}
      <div className="flex gap-1 border-b border-border/50 overflow-x-auto">
        {["Overview", "Specifications", "Compatibility", "Pricing", "Community"].map((tab, i) => (
          <Skeleton 
            key={tab} 
            className={cn(
              "h-10 px-4 rounded-t-lg flex-shrink-0",
              i === 0 ? "w-24 bg-primary/20" : "w-28"
            )} 
          />
        ))}
      </div>
      
      {/* Tab content placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 bg-card/30 rounded-xl border border-border/30 space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductDetailSkeleton;
