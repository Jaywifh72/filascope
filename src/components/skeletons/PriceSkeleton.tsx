import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PriceSkeletonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showUnit?: boolean;
}

/**
 * Skeleton for price loading states
 * Matches exact dimensions of price text to prevent layout shift
 */
export function PriceSkeleton({ className, size = "md", showUnit = false }: PriceSkeletonProps) {
  const sizeClasses = {
    sm: "h-4 w-14",
    md: "h-5 w-20",
    lg: "h-7 w-24",
  };

  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      <Skeleton className={cn(sizeClasses[size], "rounded")} />
      {showUnit && <Skeleton className="h-3 w-6 rounded opacity-60" />}
    </span>
  );
}

/**
 * Skeleton for price with discount/sale display
 */
export function SalePriceSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Skeleton className="h-6 w-20 rounded" />
      <Skeleton className="h-4 w-14 rounded opacity-50" />
      <Skeleton className="h-5 w-12 rounded-full" />
    </div>
  );
}

/**
 * Inline price skeleton for buttons
 */
export function ButtonPriceSkeleton({ className }: { className?: string }) {
  return (
    <span className={cn("flex flex-col items-end gap-0.5", className)}>
      <Skeleton className="h-5 w-16 rounded bg-primary-foreground/20" />
    </span>
  );
}

export default PriceSkeleton;
