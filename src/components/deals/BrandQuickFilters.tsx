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

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* All Brands chip */}
      <button
        onClick={() => onBrandChange([])}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
          isAllSelected
            ? "bg-primary/15 text-primary border-primary/30"
            : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
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
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
              isSelected
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <span>{brand}</span>
            <span className="text-muted-foreground">({count})</span>
            {isSelected && <X className="h-3 w-3 ml-0.5" />}
          </button>
        );
      })}
    </div>
  );
}
