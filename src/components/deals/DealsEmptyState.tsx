import { Tag, X, ArrowRight } from "lucide-react";
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

function getMostRestrictiveFilter({
  selectedMaterials,
  selectedBrands,
  minDiscount,
  showLocalOnly,
  allGroupedDeals,
}: Pick<DealsEmptyStateProps, "selectedMaterials" | "selectedBrands" | "minDiscount" | "showLocalOnly" | "allGroupedDeals">) {
  if (showLocalOnly && allGroupedDeals.length > 0) {
    return { filter: "Local Sellers Only", suggestion: "Try including international sellers" };
  }
  if (minDiscount > 40) {
    return { filter: `${minDiscount}%+ discount`, suggestion: "Try lowering the minimum discount" };
  }
  if (selectedMaterials.length === 1) {
    return { filter: selectedMaterials[0], suggestion: `No ${selectedMaterials[0]} deals right now — try another material` };
  }
  if (selectedBrands.length === 1) {
    return { filter: selectedBrands[0], suggestion: `${selectedBrands[0]} has no matching deals today` };
  }
  if (selectedBrands.length > 1 && selectedMaterials.length > 0) {
    return { filter: "Brand + Material combo", suggestion: "Try removing one filter to see more results" };
  }
  return null;
}

const QUICK_MATERIALS = ["PLA", "PETG", "TPU", "ABS"];

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
  // No active deals at all
  if (!hasActiveFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6" role="status" aria-live="polite">
        <div className="w-full max-w-md mx-auto border-2 border-dashed border-border/50 rounded-2xl p-8 text-center"
          style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Tag className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Active Deals</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Check back soon! New deals are added regularly.
          </p>
          <Button asChild size="sm">
            <Link to="/finder" className="gap-2">
              <ArrowRight className="h-3.5 w-3.5" /> Browse All Filaments
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const mostRestrictive = getMostRestrictiveFilter({
    selectedMaterials,
    selectedBrands,
    minDiscount,
    showLocalOnly,
    allGroupedDeals,
  });

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6" role="status" aria-live="polite">
      <div
        className="w-full max-w-md mx-auto border-2 border-dashed border-border/50 rounded-2xl p-8 text-center"
        style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Tag className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No deals match your filters</h3>

        {mostRestrictive && (
          <p className="text-sm text-muted-foreground mb-1">
            Most restrictive filter: <span className="text-amber-400 font-medium">{mostRestrictive.filter}</span>
          </p>
        )}
        {mostRestrictive?.suggestion && (
          <p className="text-xs text-muted-foreground mb-6">{mostRestrictive.suggestion}</p>
        )}
        {!mostRestrictive && (
          <p className="text-sm text-muted-foreground mb-6">Try adjusting your filters to see more deals.</p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <Button onClick={clearAllFilters} variant="default" size="sm" className="gap-2">
            <X className="h-3.5 w-3.5" /> Clear All Filters
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/finder" className="gap-2">
              <ArrowRight className="h-3.5 w-3.5" /> Browse All Filaments
            </Link>
          </Button>
        </div>

        {/* Quick material chips */}
        <div className="border-t border-border/30 pt-4">
          <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">Try these materials:</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {QUICK_MATERIALS.map((mat) => (
              <button
                key={mat}
                aria-label={`Show ${mat} deals`}
                onClick={() => {
                  clearAllFilters();
                  onMaterialChange([mat]);
                }}
                className="px-2.5 py-1 rounded-full text-xs border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                {mat} deals
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
