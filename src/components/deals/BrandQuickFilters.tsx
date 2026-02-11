import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupedDeal } from "@/lib/groupDealsByProduct";

interface BrandQuickFiltersProps {
  groupedDeals: GroupedDeal[];
  selectedBrands: string[];
  onBrandChange: (brands: string[]) => void;
  className?: string;
}

/**
 * Quick-filter chips for brands, shown below the main filter row.
 * Sorted by deal count descending.
 */
export function BrandQuickFilters({
  groupedDeals,
  selectedBrands,
  onBrandChange,
  className,
}: BrandQuickFiltersProps) {
  // Count deals per brand from the unfiltered grouped deals
  const brandCounts = new Map<string, number>();
  for (const group of groupedDeals) {
    const brand = group.representativeDeal.vendor || "Unknown";
    brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
  }

  const sorted = [...brandCounts.entries()].sort((a, b) => b[1] - a[1]);

  if (sorted.length <= 1) return null;

  const isAllSelected = selectedBrands.length === 0;

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandChange(selectedBrands.filter((b) => b !== brand));
    } else {
      onBrandChange([...selectedBrands, brand]);
    }
  };

  const activePill = "bg-primary text-primary-foreground font-semibold border-primary shadow-sm shadow-primary/20";
  const inactivePill = "bg-transparent text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground transition-colors";

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pr-8">
        {/* All Brands chip */}
        <button
          onClick={() => onBrandChange([])}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border whitespace-nowrap transition-all",
            isAllSelected ? activePill : inactivePill
          )}
        >
          All Brands
        </button>

        {/* Individual brand chips */}
        {sorted.map(([brand, count]) => {
          const isSelected = selectedBrands.includes(brand);
          return (
            <button
              key={brand}
              onClick={() => toggleBrand(brand)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border whitespace-nowrap transition-all",
                isSelected ? activePill : inactivePill
              )}
            >
              <span>{brand}</span>
              <span className="text-xs opacity-70">({count})</span>
              {isSelected && <X className="h-3 w-3 ml-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Right fade scroll indicator */}
      <div className="absolute top-0 right-0 h-full w-8 pointer-events-none bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
