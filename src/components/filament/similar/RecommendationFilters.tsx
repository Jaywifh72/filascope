import { Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type FilterType = 
  | "all" 
  | "budget" 
  | "premium" 
  | "same_brand" 
  | "different_brand" 
  | "easy_print" 
  | "high_strength";

interface RecommendationFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  currentVendor?: string | null;
}

const FILTER_OPTIONS: { value: FilterType; label: string; description: string }[] = [
  { value: "all", label: "All Recommendations", description: "Show all similar materials" },
  { value: "budget", label: "Budget Options", description: "Most affordable alternatives" },
  { value: "premium", label: "Premium Options", description: "Highest quality materials" },
  { value: "same_brand", label: "Same Brand", description: "Other options from this brand" },
  { value: "different_brand", label: "Different Brands", description: "Explore other manufacturers" },
  { value: "easy_print", label: "Easy to Print", description: "Beginner-friendly materials" },
  { value: "high_strength", label: "High Strength", description: "For functional parts" },
];

export function RecommendationFilters({
  activeFilter,
  onFilterChange,
  currentVendor,
}: RecommendationFiltersProps) {
  const activeOption = FILTER_OPTIONS.find((o) => o.value === activeFilter);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        <span>Show:</span>
      </div>

      <Select
        value={activeFilter}
        onValueChange={(value) => onFilterChange(value as FilterType)}
      >
        <SelectTrigger className="h-8 w-[180px] text-xs bg-muted/30 border-border/50">
          <SelectValue placeholder="All Recommendations" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {FILTER_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-xs"
            >
              <div className="flex flex-col">
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activeFilter !== "all" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange("all")}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Reset
        </Button>
      )}

      {activeFilter !== "all" && activeOption && (
        <Badge
          variant="outline"
          className="text-[10px] border-primary/30 bg-primary/5 text-primary"
        >
          {activeOption.label}
        </Badge>
      )}
    </div>
  );
}

// Filter application helper
import type { EnhancedSimilarFilament } from "@/hooks/useEnhancedSimilarFilaments";

export function applyRecommendationFilter(
  recommendations: EnhancedSimilarFilament[],
  filter: FilterType,
  currentVendor?: string | null
): EnhancedSimilarFilament[] {
  switch (filter) {
    case "all":
      return recommendations;

    case "budget":
      return [...recommendations].sort((a, b) => 
        (a.pricePerKg || 999) - (b.pricePerKg || 999)
      ).slice(0, 6);

    case "premium":
      return [...recommendations].sort((a, b) => 
        (b.value_score || 0) - (a.value_score || 0)
      ).slice(0, 6);

    case "same_brand":
      if (!currentVendor) return recommendations;
      return recommendations.filter(
        (r) => r.vendor?.toLowerCase() === currentVendor.toLowerCase()
      );

    case "different_brand":
      if (!currentVendor) return recommendations;
      return recommendations.filter(
        (r) => r.vendor?.toLowerCase() !== currentVendor.toLowerCase()
      );

    case "easy_print":
      return [...recommendations].sort((a, b) => 
        (b.ease_of_printing_score || 0) - (a.ease_of_printing_score || 0)
      ).slice(0, 6);

    case "high_strength":
      return [...recommendations].sort((a, b) => 
        (b.strength_index || 0) - (a.strength_index || 0)
      ).slice(0, 6);

    default:
      return recommendations;
  }
}
