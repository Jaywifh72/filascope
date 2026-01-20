import { forwardRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCount {
  all: number;
  fdm: number;
  resin: number;
  corexy: number;
  budget: number;
  multicolor: number;
}

interface PrintersFilterBarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts: CategoryCount;
  sortBy: string;
  onSortChange: (sort: string) => void;
  priceRange: string;
  onPriceChange: (range: string) => void;
  buildVolume: string;
  onBuildVolumeChange: (volume: string) => void;
  onMoreFiltersClick: () => void;
  advancedFilterCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const categories = [
  { id: 'all', label: 'All' },
  { id: 'fdm', label: 'FDM' },
  { id: 'resin', label: 'Resin' },
  { id: 'corexy', label: 'CoreXY' },
  { id: 'budget', label: 'Budget' },
  { id: 'multicolor', label: 'Multi-Color' },
];

const PrintersFilterBar = forwardRef<HTMLDivElement, PrintersFilterBarProps>(({
  activeCategory,
  onCategoryChange,
  categoryCounts,
  sortBy,
  onSortChange,
  priceRange,
  onPriceChange,
  buildVolume,
  onBuildVolumeChange,
  onMoreFiltersClick,
  advancedFilterCount,
  hasActiveFilters,
  onClearFilters,
}, ref) => {
  return (
    <div
      ref={ref}
      className="w-full bg-transparent"
    >
      {/* Category Tabs */}
      <div 
        className="flex overflow-x-auto scrollbar-hide bg-primary/[0.08] border-b-2 border-primary/30"
        role="tablist"
        aria-label="Printer categories"
      >
        {categories.map((category) => {
          const count = categoryCounts[category.id as keyof CategoryCount];
          const isActive = activeCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "h-14 px-6 flex items-center gap-2 whitespace-nowrap font-semibold text-[15px] transition-all duration-200 border-b-[3px]",
                isActive
                  ? "bg-primary/15 text-primary border-primary font-bold"
                  : "text-muted-foreground border-transparent hover:bg-white/5 hover:text-foreground hover:border-primary/30"
              )}
            >
              <span>{category.label}</span>
              <span className={cn("text-sm", isActive ? "opacity-90" : "opacity-70")}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 lg:px-10 py-4 bg-white/[0.02] border-b border-white/[0.08]">
        {/* Left Controls */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-6">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sort:</label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-[180px] h-10 bg-white/5 border-white/10 hover:bg-white/8 hover:border-primary/30 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="speed-desc">Speed: Fastest</SelectItem>
                <SelectItem value="volume-desc">Build Volume: Largest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Price:</label>
            <Select value={priceRange} onValueChange={onPriceChange}>
              <SelectTrigger className="w-[160px] h-10 bg-white/5 border-white/10 hover:bg-white/8 hover:border-primary/30 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="0-500">Under $500</SelectItem>
                <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                <SelectItem value="1000-2000">$1,000 - $2,000</SelectItem>
                <SelectItem value="2000-3000">$2,000 - $3,000</SelectItem>
                <SelectItem value="3000+">Over $3,000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Build Volume Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Build:</label>
            <Select value={buildVolume} onValueChange={onBuildVolumeChange}>
              <SelectTrigger className="w-[170px] h-10 bg-white/5 border-white/10 hover:bg-white/8 hover:border-primary/30 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="small">Small (&lt;200mm)</SelectItem>
                <SelectItem value="medium">Medium (200-300mm)</SelectItem>
                <SelectItem value="large">Large (300mm+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-10 px-4 text-destructive hover:text-destructive hover:bg-destructive/10 border border-destructive/30"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onMoreFiltersClick}
            className="relative h-10 px-4 bg-transparent border-white/15 hover:bg-white/5 hover:border-primary/30"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            More Filters
            {advancedFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1.5 bg-destructive rounded-full text-[11px] font-bold text-destructive-foreground flex items-center justify-center border-2 border-background">
                {advancedFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

PrintersFilterBar.displayName = "PrintersFilterBar";

export default PrintersFilterBar;
