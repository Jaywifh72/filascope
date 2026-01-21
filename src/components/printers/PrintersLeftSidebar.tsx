import { forwardRef, useState } from "react";
import { ChevronDown, SlidersHorizontal, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrintersLeftSidebarProps {
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

type ExpandedSection = 'sort' | 'price' | 'volume' | null;

const PrintersLeftSidebar = forwardRef<HTMLDivElement, PrintersLeftSidebarProps>(({
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
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>('sort');

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const getSortLabel = () => sortOptions.find(o => o.value === sortBy)?.label || "Sort";
  const getPriceLabel = () => priceRanges.find(o => o.value === priceRange)?.label || "Price";
  const getVolumeLabel = () => buildVolumes.find(o => o.value === buildVolume)?.label || "Size";

  return (
    <div
      ref={ref}
      className="w-72 shrink-0 sticky top-20 self-start hidden lg:block"
    >
      <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Filter Parameters
          </h3>
        </div>

        {/* Sort Section */}
        <div className="border-b border-white/5">
          <button
            onClick={() => toggleSection('sort')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground">
                Sort By
              </span>
              <span className="font-mono text-[10px] text-primary">
                {getSortLabel()}
              </span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expandedSection === 'sort' && "rotate-180"
            )} />
          </button>
          
          {expandedSection === 'sort' && (
            <div className="px-2 pb-3 space-y-0.5">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md font-mono text-[10px] uppercase tracking-[0.05em] transition-colors",
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
          )}
        </div>

        {/* Price Range Section */}
        <div className="border-b border-white/5">
          <button
            onClick={() => toggleSection('price')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground">
                Price Range
              </span>
              {priceRange !== 'all' && (
                <span className="font-mono text-[10px] text-primary">
                  {getPriceLabel()}
                </span>
              )}
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expandedSection === 'price' && "rotate-180"
            )} />
          </button>
          
          {expandedSection === 'price' && (
            <div className="px-2 pb-3 space-y-0.5">
              {priceRanges.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onPriceChange(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md font-mono text-[10px] uppercase tracking-[0.05em] transition-colors",
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
          )}
        </div>

        {/* Build Volume Section */}
        <div className="border-b border-white/5">
          <button
            onClick={() => toggleSection('volume')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground">
                Build Size
              </span>
              {buildVolume !== 'all' && (
                <span className="font-mono text-[10px] text-primary">
                  {getVolumeLabel()}
                </span>
              )}
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expandedSection === 'volume' && "rotate-180"
            )} />
          </button>
          
          {expandedSection === 'volume' && (
            <div className="px-2 pb-3 space-y-0.5">
              {buildVolumes.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onBuildVolumeChange(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md font-mono text-[10px] uppercase tracking-[0.05em] transition-colors",
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
          )}
        </div>

        {/* Advanced Filters Button */}
        <div className="p-3">
          <Button
            variant="ghost"
            onClick={onMoreFiltersClick}
            className={cn(
              "relative w-full h-10 gap-2 font-mono text-[10px] uppercase tracking-[0.1em] border transition-all duration-200 justify-start",
              advancedFilterCount > 0 
                ? "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10" 
                : "border-white/10 hover:border-primary/30 hover:bg-white/5"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Advanced Parameters</span>
            {advancedFilterCount > 0 && (
              <span className="absolute top-1 right-2 min-w-5 h-5 px-1.5 bg-primary rounded-full text-[10px] font-bold text-background flex items-center justify-center">
                {advancedFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <div className="px-3 pb-3">
            <Button
              variant="ghost"
              onClick={onClearFilters}
              className="w-full h-9 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-white/5 hover:border-destructive/20"
            >
              <X className="w-3.5 h-3.5 mr-2" />
              Reset All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

PrintersLeftSidebar.displayName = "PrintersLeftSidebar";

export default PrintersLeftSidebar;
