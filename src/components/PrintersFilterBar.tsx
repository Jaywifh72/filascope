import { forwardRef, useState, useRef, useEffect } from "react";
import { ChevronDown, SlidersHorizontal, Check, Search, Loader2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

const sortOptions = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "speed-desc", label: "Speed: Fastest" },
  { value: "volume-desc", label: "Build Volume: Largest" },
];

const priceRanges = [
  { value: "all", label: "All Prices" },
  { value: "0-500", label: "Under $500" },
  { value: "500-1000", label: "$500 - $1,000" },
  { value: "1000-2000", label: "$1,000 - $2,000" },
  { value: "2000-3000", label: "$2,000 - $3,000" },
  { value: "3000+", label: "Over $3,000" },
];

const buildVolumes = [
  { value: "all", label: "All Sizes" },
  { value: "small", label: "Small (<200mm)" },
  { value: "medium", label: "Medium (200-300mm)" },
  { value: "large", label: "Large (300mm+)" },
];

type DropdownType = 'sort' | 'price' | 'volume' | null;

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
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleDropdown = (dropdown: DropdownType) => {
    setOpenDropdown(prev => prev === dropdown ? null : dropdown);
  };

  const getSortLabel = () => sortOptions.find(o => o.value === sortBy)?.label || "Sort";
  const getPriceLabel = () => priceRanges.find(o => o.value === priceRange)?.label || "Price";
  const getVolumeLabel = () => buildVolumes.find(o => o.value === buildVolume)?.label || "Build";

  return (
    <div
      ref={(node) => {
        (dropdownRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (ref && typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className="relative transition-all duration-300 z-30 bg-card/50 border-b border-border"
    >
      <div className="max-w-[1800px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left side - Category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
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
                  "h-9 px-4 flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-all duration-200 rounded-lg",
                  isActive
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <span>{category.label}</span>
                <span className={cn("text-xs", isActive ? "opacity-90" : "opacity-60")}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Right side - Dropdowns & Actions */}
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleDropdown('sort')}
              className={cn(
                "h-9 gap-2 min-w-[140px] justify-between",
                openDropdown === 'sort' && "ring-2 ring-primary/50"
              )}
            >
              <span className="truncate">{getSortLabel()}</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform shrink-0",
                openDropdown === 'sort' && "rotate-180"
              )} />
            </Button>

            {openDropdown === 'sort' && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg z-50">
                <div className="p-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                        sortBy === option.value
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/80"
                      )}
                    >
                      <span>{option.label}</span>
                      {sortBy === option.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleDropdown('price')}
              className={cn(
                "h-9 gap-2 min-w-[130px] justify-between",
                openDropdown === 'price' && "ring-2 ring-primary/50",
                priceRange !== 'all' && "border-primary/50 bg-primary/5"
              )}
            >
              <span className="truncate">{getPriceLabel()}</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform shrink-0",
                openDropdown === 'price' && "rotate-180"
              )} />
            </Button>

            {openDropdown === 'price' && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-popover border border-border rounded-lg shadow-lg z-50">
                <div className="p-2">
                  {priceRanges.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onPriceChange(option.value);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                        priceRange === option.value
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/80"
                      )}
                    >
                      <span>{option.label}</span>
                      {priceRange === option.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Build Volume Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleDropdown('volume')}
              className={cn(
                "h-9 gap-2 min-w-[130px] justify-between",
                openDropdown === 'volume' && "ring-2 ring-primary/50",
                buildVolume !== 'all' && "border-primary/50 bg-primary/5"
              )}
            >
              <span className="truncate">{getVolumeLabel()}</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform shrink-0",
                openDropdown === 'volume' && "rotate-180"
              )} />
            </Button>

            {openDropdown === 'volume' && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg z-50">
                <div className="p-2">
                  {buildVolumes.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onBuildVolumeChange(option.value);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                        buildVolume === option.value
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/80"
                      )}
                    >
                      <span>{option.label}</span>
                      {buildVolume === option.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* More Filters */}
          <Button
            variant="outline"
            size="sm"
            onClick={onMoreFiltersClick}
            className={cn(
              "relative h-9 gap-2",
              advancedFilterCount > 0 && "border-primary/50 bg-primary/5"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">More Filters</span>
            {advancedFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1.5 bg-primary rounded-full text-[11px] font-bold text-primary-foreground flex items-center justify-center">
                {advancedFilterCount}
              </span>
            )}
          </Button>

          {/* Clear All */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-9 px-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

PrintersFilterBar.displayName = "PrintersFilterBar";

export default PrintersFilterBar;
