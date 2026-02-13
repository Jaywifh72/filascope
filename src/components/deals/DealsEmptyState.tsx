import { SearchX, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { GroupedDeal } from "@/lib/groupDealsByProduct";

interface DealsEmptyStateProps {
  selectedMaterials: string[];
  selectedBrands: string[];
  minDiscount: number;
  showLocalOnly: boolean;
  allGroupedDeals: GroupedDeal[];
  clearAllFilters: () => void;
  onMaterialChange: (materials: string[]) => void;
  hasActiveFilters: boolean;
}

function getDiagnosticMessage({
  selectedMaterials,
  selectedBrands,
  minDiscount,
  showLocalOnly,
}: Pick<DealsEmptyStateProps, "selectedMaterials" | "selectedBrands" | "minDiscount" | "showLocalOnly">) {
  if (showLocalOnly) {
    return "No local deals match your filters. Try including international sellers.";
  }
  if (selectedBrands.length > 0 && selectedMaterials.length > 0) {
    return `No ${selectedMaterials.join(", ")} deals found from ${selectedBrands.join(", ")}. Try broadening your search.`;
  }
  if (minDiscount > 0) {
    return `No deals with ${minDiscount}%+ discount. Try lowering the minimum discount.`;
  }
  if (selectedBrands.length > 0) {
    return `No deals found from ${selectedBrands.join(", ")}. Try selecting different brands.`;
  }
  if (selectedMaterials.length > 0) {
    return `No ${selectedMaterials.join(", ")} deals found. Try other materials.`;
  }
  return "No deals match your current filters.";
}

export function DealsEmptyState({
  selectedMaterials,
  selectedBrands,
  minDiscount,
  showLocalOnly,
  allGroupedDeals,
  clearAllFilters,
  onMaterialChange,
  hasActiveFilters,
}: DealsEmptyStateProps) {
  // Derive suggestion chips: materials that have deals in unfiltered data
  const materialSuggestions = (() => {
    const counts = new Map<string, number>();
    for (const group of allGroupedDeals) {
      const mat = group.representativeDeal.material;
      if (mat) counts.set(mat, (counts.get(mat) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mat]) => mat);
  })();

  // No active deals at all
  if (!hasActiveFilters) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <SearchX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">No Active Deals</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Check back soon! New deals are added regularly.
        </p>
        <Button asChild>
          <Link to="/finder">Browse All Filaments</Link>
        </Button>
      </div>
    );
  }

  const Icon = showLocalOnly ? Globe : SearchX;

  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-foreground mb-2">No deals match your filters</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {getDiagnosticMessage({ selectedMaterials, selectedBrands, minDiscount, showLocalOnly })}
      </p>

      <div className="flex flex-col items-center gap-3">
        <Button variant="default" onClick={clearAllFilters}>
          Clear All Filters
        </Button>
        <button
          onClick={clearAllFilters}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Browse All Deals
        </button>
      </div>

      {/* Suggestion chips */}
      {materialSuggestions.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-muted-foreground mb-2">Popular categories with deals:</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {materialSuggestions.map((mat) => (
              <button
                key={mat}
                onClick={() => {
                  onMaterialChange([mat]);
                }}
                className="rounded-full border border-border text-xs px-3 py-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
              >
                {mat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
