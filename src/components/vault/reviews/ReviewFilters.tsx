import { Star, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ReviewSortOption, ReviewProductFilter, ReviewRatingFilter } from "@/hooks/useVaultReviews";

interface ReviewFiltersProps {
  sortBy: ReviewSortOption;
  onSortChange: (sort: ReviewSortOption) => void;
  productFilter: ReviewProductFilter;
  onProductFilterChange: (filter: ReviewProductFilter) => void;
  ratingFilter: ReviewRatingFilter;
  onRatingFilterChange: (rating: ReviewRatingFilter) => void;
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
}

export function ReviewFilters({
  sortBy,
  onSortChange,
  productFilter,
  onProductFilterChange,
  ratingFilter,
  onRatingFilterChange,
  viewMode,
  onViewModeChange,
}: ReviewFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Product Type Filter */}
      <Select value={productFilter} onValueChange={(v) => onProductFilterChange(v as ReviewProductFilter)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Products</SelectItem>
          <SelectItem value="filament">Filaments</SelectItem>
          <SelectItem value="printer">Printers</SelectItem>
        </SelectContent>
      </Select>

      {/* Rating Filter */}
      <Select
        value={ratingFilter.toString()}
        onValueChange={(v) => onRatingFilterChange(parseInt(v) as ReviewRatingFilter)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">All Ratings</SelectItem>
          {[5, 4, 3, 2, 1].map((r) => (
            <SelectItem key={r} value={r.toString()}>
              <span className="flex items-center gap-1">
                {r} <Star className="w-3 h-3 fill-primary text-primary" />
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={sortBy} onValueChange={(v) => onSortChange(v as ReviewSortOption)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="helpful">Most Helpful</SelectItem>
          <SelectItem value="highest">Highest Rated</SelectItem>
          <SelectItem value="lowest">Lowest Rated</SelectItem>
        </SelectContent>
      </Select>

      {/* View Toggle */}
      <div className="ml-auto flex items-center gap-1 border border-border rounded-lg p-0.5">
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 w-7 p-0", viewMode === "list" && "bg-muted")}
          onClick={() => onViewModeChange("list")}
        >
          <List className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 w-7 p-0", viewMode === "grid" && "bg-muted")}
          onClick={() => onViewModeChange("grid")}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
