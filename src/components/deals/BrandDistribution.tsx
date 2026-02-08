import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupedDeal } from "@/lib/groupDealsByProduct";

interface BrandDistributionProps {
  groupedDeals: GroupedDeal[];
  className?: string;
}

/**
 * Shows brand distribution breakdown and warns if one brand dominates.
 */
export function BrandDistribution({ groupedDeals, className }: BrandDistributionProps) {
  if (groupedDeals.length === 0) return null;

  // Count deals per brand
  const brandCounts = new Map<string, number>();
  for (const group of groupedDeals) {
    const brand = group.representativeDeal.vendor || "Unknown";
    brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
  }

  // Sort by count descending
  const sorted = [...brandCounts.entries()].sort((a, b) => b[1] - a[1]);
  const totalDeals = groupedDeals.length;
  const topBrand = sorted[0];
  const topBrandPercent = topBrand ? Math.round((topBrand[1] / totalDeals) * 100) : 0;
  const isDominated = topBrandPercent > 80;

  // Show top 4 brands inline, rest as "+N more"
  const displayBrands = sorted.slice(0, 4);
  const remainingCount = sorted.length - displayBrands.length;

  return (
    <div className={cn("text-center", className)}>
      {/* Brand breakdown */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <span>From {sorted.length} {sorted.length === 1 ? "brand" : "brands"}:</span>
        {displayBrands.map(([brand, count], i) => (
          <span key={brand}>
            <span className="text-foreground font-medium">{brand}</span>
            <span className="text-muted-foreground"> ({count})</span>
            {i < displayBrands.length - 1 && <span className="text-muted-foreground">, </span>}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="text-muted-foreground">+{remainingCount} more</span>
        )}
      </div>

      {/* Dominance warning */}
      {isDominated && topBrand && (
        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
          <Info className="h-3 w-3 shrink-0" />
          <span>Most deals currently from {topBrand[0]}. We're adding more brands.</span>
        </div>
      )}
    </div>
  );
}
