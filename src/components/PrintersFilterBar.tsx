import { forwardRef, useState, useRef, useEffect } from "react";
import { ChevronDown, SlidersHorizontal, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { id: 'all', label: 'ALL' },
  { id: 'fdm', label: 'FDM' },
  { id: 'resin', label: 'RESIN' },
  { id: 'corexy', label: 'COREXY' },
  { id: 'budget', label: 'BUDGET' },
  { id: 'multicolor', label: 'MULTI-MAT' },
];

const sortOptions = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "speed-desc", label: "Speed: Fastest" },
  { value: "volume-desc", label: "Volume: Largest" },
];

const priceRanges = [
  { value: "all", label: "All Prices" },
  { value: "0-500", label: "< $500" },
  { value: "500-1000", label: "$500 - $1K" },
  { value: "1000-2000", label: "$1K - $2K" },
  { value: "2000-3000", label: "$2K - $3K" },
  { value: "3000+", label: "> $3K" },
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      className="relative transition-all duration-300 z-30 bg-white/[0.02] border-y border-white/5"
    >
      <div className="max-w-[1800px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left side - Category tabs (Industrial toggles) */}
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
                  "h-8 px-4 flex items-center gap-1.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.1em] transition-all duration-200 rounded-md border",
                  isActive
                    ? "border-primary/50 bg-primary/10 text-primary font-bold shadow-[0_0_12px_rgba(0,207,232,0.15)]"
                    : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground hover:border-white/10"
                )}
              >
                <span>{category.label}</span>
                <span className={cn(
                  "text-[9px] font-normal",
                  isActive ? "text-primary/70" : "text-muted-foreground/50"
                )}>
                  [{count}]
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
              variant="ghost"
              size="sm"
              onClick={() => toggleDropdown('sort')}
              className={cn(
                "h-8 gap-2 min-w-[130px] justify-between font-mono text-[10px] uppercase tracking-[0.05em] border border-white/10 hover:border-white/20 hover:bg-white/5",
                openDropdown === 'sort' && "border-primary/50 bg-primary/5"
              )}
            >
              <span className="truncate">{getSortLabel()}</span>
              <ChevronDown className={cn(
                "h-3.5 w-3.5 transition-transform shrink-0",
                openDropdown === 'sort' && "rotate-180"
              )} />
            </Button>

            {openDropdown === 'sort' && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-[hsl(220_20%_8%)] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="py-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 font-mono text-[10px] uppercase tracking-[0.05em] transition-colors",
                        sortBy === option.value
                          ? "bg-primary/15 text-primary"
                          : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      <span>{option.label}</span>
                      {sortBy === option.value && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleDropdown('price')}
              className={cn(
                "h-8 gap-2 min-w-[110px] justify-between font-mono text-[10px] uppercase tracking-[0.05em] border hover:bg-white/5",
                openDropdown === 'price' && "border-primary/50 bg-primary/5",
                priceRange !== 'all' 
                  ? "border-primary/40 bg-primary/5 text-primary" 
                  : "border-white/10 hover:border-white/20"
              )}
            >
              <span className="truncate">{getPriceLabel()}</span>
              <ChevronDown className={cn(
                "h-3.5 w-3.5 transition-transform shrink-0",
                openDropdown === 'price' && "rotate-180"
              )} />
            </Button>

            {openDropdown === 'price' && (
              <div className="absolute top-full right-0 mt-2 w-44 bg-[hsl(220_20%_8%)] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="py-1">
                  {priceRanges.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onPriceChange(option.value);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 font-mono text-[10px] uppercase tracking-[0.05em] transition-colors",
                        priceRange === option.value
                          ? "bg-primary/15 text-primary"
                          : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      <span>{option.label}</span>
                      {priceRange === option.value && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Build Volume Dropdown */}
          <div className="relative hidden md:block">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleDropdown('volume')}
              className={cn(
                "h-8 gap-2 min-w-[110px] justify-between font-mono text-[10px] uppercase tracking-[0.05em] border hover:bg-white/5",
                openDropdown === 'volume' && "border-primary/50 bg-primary/5",
                buildVolume !== 'all' 
                  ? "border-primary/40 bg-primary/5 text-primary" 
                  : "border-white/10 hover:border-white/20"
              )}
            >
              <span className="truncate">{getVolumeLabel()}</span>
              <ChevronDown className={cn(
                "h-3.5 w-3.5 transition-transform shrink-0",
                openDropdown === 'volume' && "rotate-180"
              )} />
            </Button>

            {openDropdown === 'volume' && (
              <div className="absolute top-full right-0 mt-2 w-44 bg-[hsl(220_20%_8%)] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="py-1">
                  {buildVolumes.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onBuildVolumeChange(option.value);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 font-mono text-[10px] uppercase tracking-[0.05em] transition-colors",
                        buildVolume === option.value
                          ? "bg-primary/15 text-primary"
                          : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      <span>{option.label}</span>
                      {buildVolume === option.value && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* More Filters - Wireframe button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoreFiltersClick}
            className={cn(
              "relative h-8 gap-2 font-mono text-[10px] uppercase tracking-[0.05em] border transition-all duration-200",
              advancedFilterCount > 0 
                ? "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10" 
                : "border-white/10 hover:border-primary/30 hover:bg-white/5"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Parameters</span>
            {advancedFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 bg-primary rounded-full text-[9px] font-bold text-background flex items-center justify-center">
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
              className="h-8 px-3 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

PrintersFilterBar.displayName = "PrintersFilterBar";

export default PrintersFilterBar;
