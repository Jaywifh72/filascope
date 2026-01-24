import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, SlidersHorizontal, Check, Search, Loader2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// Material color mapping for visual swatches
const MATERIAL_COLORS: Record<string, string> = {
  'All': '#6b7280',
  'PLA Family': '#22c55e',
  'PETG Family': '#3b82f6',
  'ABS Family': '#71717a',
  'ASA Family': '#f97316',
  'Flexible/TPU': '#06b6d4',
  'Nylon/PA Family': '#eab308',
  'Polycarbonate': '#6366f1',
  'High Performance': '#a855f7',
  'Copolyester': '#14b8a6',
  'PET Family': '#0ea5e9',
  'Polypropylene': '#78716c',
  'Support Materials': '#ec4899',
  'Specialty': '#f43f5e'
};

// Letter groupings for alphabetical sections
const LETTER_GROUPS = [{
  label: 'A-D',
  letters: ['A', 'B', 'C', 'D']
}, {
  label: 'E-H',
  letters: ['E', 'F', 'G', 'H']
}, {
  label: 'I-L',
  letters: ['I', 'J', 'K', 'L']
}, {
  label: 'M-P',
  letters: ['M', 'N', 'O', 'P']
}, {
  label: 'Q-T',
  letters: ['Q', 'R', 'S', 'T']
}, {
  label: 'U-Z',
  letters: ['U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
}];

interface MaterialCategory {
  name: string;
  count: number;
}

interface Brand {
  name: string;
  count: number;
}

interface HorizontalFilterBarProps {
  // Material filter
  materialCategories: MaterialCategory[];
  selectedMaterial: string;
  onMaterialChange: (material: string) => void;

  // Brand filter
  brands: Brand[];
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;

  // Price filter
  priceRange: [number, number];
  maxPriceLimit: number;
  onPriceRangeChange: (range: [number, number]) => void;

  // More filters trigger
  onOpenMoreFilters: () => void;
  moreFiltersCount: number;

  // Sort
  sortBy: string;
  onSortChange: (sort: string) => void;

  // Sticky state
  isSticky?: boolean;
  filterBarRef?: React.RefObject<HTMLDivElement>;
}

type DropdownType = 'material' | 'brand' | 'price' | null;

// Shared filter button styles with enhanced active states
const filterButtonBase = "h-9 px-3 py-2 gap-2 min-w-[120px] justify-between text-sm rounded-lg border transition-all duration-200";
const filterButtonDefault = "bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:scale-[1.01]";
const filterButtonActive = "border-primary bg-primary/20 text-primary shadow-[0_0_8px_rgba(20,184,166,0.15)] animate-filter-activate";
const filterButtonOpen = "ring-2 ring-primary/50";

// Count badge component for active filter indicators
const FilterCountBadge = ({ count }: { count: number }) => (
  <span className="bg-primary text-primary-foreground rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs font-semibold tabular-nums shadow-sm">
    {count}
  </span>
);

export function HorizontalFilterBar({
  materialCategories,
  selectedMaterial,
  onMaterialChange,
  brands,
  selectedBrands,
  onBrandsChange,
  priceRange,
  maxPriceLimit,
  onPriceRangeChange,
  onOpenMoreFilters,
  moreFiltersCount,
  sortBy,
  onSortChange,
  isSticky = false,
  filterBarRef
}: HorizontalFilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>(priceRange);
  const [tempSelectedBrands, setTempSelectedBrands] = useState<string[]>(selectedBrands);
  const [isApplying, setIsApplying] = useState<'brand' | 'price' | null>(null);
  const [showSuccess, setShowSuccess] = useState<'brand' | 'price' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const brandSearchRef = useRef<HTMLInputElement>(null);

  // Check if filters are active
  const isMaterialActive = selectedMaterial !== "All";
  const isBrandActive = selectedBrands.length > 0;
  const isPriceActive = priceRange[0] > 0 || priceRange[1] < maxPriceLimit;

  // Calculate total active filter count
  const totalActiveFilters = useMemo(() => {
    let count = 0;
    if (isMaterialActive) count++;
    if (isBrandActive) count += selectedBrands.length;
    if (isPriceActive) count++;
    count += moreFiltersCount;
    return count;
  }, [isMaterialActive, isBrandActive, isPriceActive, selectedBrands.length, moreFiltersCount]);

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

  // Reset temp state when dropdown opens
  useEffect(() => {
    if (openDropdown === 'brand') {
      setTempSelectedBrands(selectedBrands);
      setBrandSearch("");
      // Focus search input after a short delay
      setTimeout(() => brandSearchRef.current?.focus(), 50);
    }
    if (openDropdown === 'price') {
      setTempPriceRange(priceRange);
    }
  }, [openDropdown, selectedBrands, priceRange]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleDropdown = (dropdown: DropdownType) => {
    setOpenDropdown(prev => prev === dropdown ? null : dropdown);
  };

  // Filter brands by search
  const filteredBrands = brands.filter(brand => brand.name.toLowerCase().includes(brandSearch.toLowerCase()));

  const applyBrandFilter = () => {
    setIsApplying('brand');
    // Brief loading state
    setTimeout(() => {
      onBrandsChange(tempSelectedBrands);
      setIsApplying(null);
      setShowSuccess('brand');
      // Hide success after animation
      setTimeout(() => {
        setShowSuccess(null);
        setOpenDropdown(null);
      }, 400);
    }, 150);
  };

  const applyPriceFilter = () => {
    setIsApplying('price');
    // Brief loading state
    setTimeout(() => {
      onPriceRangeChange(tempPriceRange);
      setIsApplying(null);
      setShowSuccess('price');
      // Hide success after animation
      setTimeout(() => {
        setShowSuccess(null);
        setOpenDropdown(null);
      }, 400);
    }, 150);
  };

  const handleClearAllFilters = () => {
    onMaterialChange("All");
    onBrandsChange([]);
    onPriceRangeChange([0, maxPriceLimit]);
    // Note: More filters clearing would need to be handled by parent
  };

  const getSelectedMaterialLabel = () => {
    return "Material";
  };

  const getSelectedBrandsLabel = () => {
    return "Brand";
  };

  const getPriceLabel = () => {
    return "Price";
  };
  
  // Get display value for active filters
  const getMaterialDisplayValue = () => {
    if (selectedMaterial === "All") return null;
    return selectedMaterial;
  };
  
  const getBrandDisplayValue = () => {
    if (selectedBrands.length === 0) return null;
    if (selectedBrands.length === 1) return selectedBrands[0];
    return null; // Will show count badge instead
  };
  
  const getPriceDisplayValue = () => {
    if (priceRange[0] === 0 && priceRange[1] >= maxPriceLimit) return null;
    if (priceRange[0] === 0) return `<$${priceRange[1]}`;
    if (priceRange[1] >= maxPriceLimit) return `>$${priceRange[0]}`;
    return `$${priceRange[0]}-${priceRange[1]}`;
  };

  // Brand row component for reuse
  const BrandRow = ({
    brand
  }: {
    brand: Brand;
  }) => {
    const isSelected = tempSelectedBrands.includes(brand.name);
    return (
      <label className={cn(
        "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors",
        isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted border border-transparent"
      )}>
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={checked => {
              if (checked) {
                setTempSelectedBrands(prev => [...prev, brand.name]);
              } else {
                setTempSelectedBrands(prev => prev.filter(b => b !== brand.name));
              }
            }} 
          />
          <span className="text-sm">{brand.name}</span>
          {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {brand.count.toLocaleString()}
        </span>
      </label>
    );
  };

  return (
    <div 
      ref={node => {
        // Handle both refs
        (dropdownRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (filterBarRef && 'current' in filterBarRef) {
          (filterBarRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }} 
      className={cn(
        "relative transition-all duration-300 z-30",
        isSticky 
          ? "fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-primary/20 shadow-lg shadow-black/20" 
          : "bg-card/50 border-b border-border"
      )}
    >
      <div className="max-w-[1800px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left side - Filter dropdowns */}
        <div className="flex items-center gap-2">
          {/* Material Type Dropdown */}
          <div className="relative">
            <button 
              onClick={() => toggleDropdown('material')} 
              className={cn(
                filterButtonBase, 
                isMaterialActive ? filterButtonActive : filterButtonDefault,
                openDropdown === 'material' && filterButtonOpen, 
                "flex items-center min-w-[140px]"
              )}
            >
              <span className="truncate flex-1 text-left">
                {getSelectedMaterialLabel()}
                {getMaterialDisplayValue() && (
                  <span className="ml-1 font-medium">({getMaterialDisplayValue()})</span>
                )}
              </span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform shrink-0",
                openDropdown === 'material' ? "rotate-180 text-primary" : isMaterialActive ? "text-primary" : "text-gray-500"
              )} />
            </button>

            {/* Material Dropdown Panel */}
            {openDropdown === 'material' && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <div className="p-2 max-h-[400px] overflow-y-auto">
                  {materialCategories.map(category => (
                    <button 
                      key={category.name} 
                      onClick={() => {
                        onMaterialChange(category.name);
                        setOpenDropdown(null);
                      }} 
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors group",
                        selectedMaterial === category.name 
                          ? "bg-primary/10 text-primary" 
                          : "text-gray-300 hover:bg-gray-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {/* Color swatch */}
                        <span 
                          className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/20" 
                          style={{ backgroundColor: MATERIAL_COLORS[category.name] || '#6b7280' }} 
                        />
                        {/* Checkmark for selected */}
                        {selectedMaterial === category.name 
                          ? <Check className="h-4 w-4 text-primary shrink-0" /> 
                          : <span className="w-4" />
                        }
                        <span>{category.name}</span>
                      </div>
                      <span className="text-gray-500 text-xs tabular-nums">
                        {category.count.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Brand Dropdown */}
          <div className="relative">
            <button 
              onClick={() => toggleDropdown('brand')} 
              className={cn(
                filterButtonBase, 
                isBrandActive ? filterButtonActive : filterButtonDefault,
                openDropdown === 'brand' && filterButtonOpen, 
                "flex items-center"
              )}
            >
              <span className="truncate flex-1 text-left">
                {getSelectedBrandsLabel()}
                {getBrandDisplayValue() && (
                  <span className="ml-1 font-medium">({getBrandDisplayValue()})</span>
                )}
              </span>
              {/* Show count badge for multiple selections */}
              {selectedBrands.length > 1 && <FilterCountBadge count={selectedBrands.length} />}
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform shrink-0",
                openDropdown === 'brand' ? "rotate-180 text-primary" : isBrandActive ? "text-primary" : "text-gray-500"
              )} />
            </button>

            {/* Brand Dropdown Panel */}
            {openDropdown === 'brand' && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                {/* Search */}
                <div className="p-3 border-b border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input 
                      ref={brandSearchRef} 
                      placeholder="Search brands..." 
                      value={brandSearch} 
                      onChange={e => setBrandSearch(e.target.value)} 
                      className="pl-9 h-9 bg-gray-900 border-gray-600 text-white placeholder:text-gray-500" 
                    />
                  </div>
                </div>

                {/* Brand List */}
                <div className="max-h-[350px] overflow-y-auto">
                  {filteredBrands.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No brands found
                    </p>
                  ) : (
                    <div className="p-2">
                      {[...filteredBrands].sort((a, b) => {
                        const aStartsWithNumber = /^\d/.test(a.name);
                        const bStartsWithNumber = /^\d/.test(b.name);

                        // Numbers first
                        if (aStartsWithNumber && !bStartsWithNumber) return -1;
                        if (!aStartsWithNumber && bStartsWithNumber) return 1;

                        // Then alphabetically
                        return a.name.localeCompare(b.name);
                      }).map(brand => <BrandRow key={brand.name} brand={brand} />)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-3 border-t border-gray-700 flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setTempSelectedBrands([])} 
                    className="text-gray-400 hover:text-white"
                  >
                    Clear
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={applyBrandFilter} 
                    disabled={isApplying === 'brand'} 
                    className="min-w-[70px] bg-primary hover:bg-primary/90"
                  >
                    {isApplying === 'brand' 
                      ? <Loader2 className="h-4 w-4 filter-spinner" /> 
                      : showSuccess === 'brand' 
                        ? <CheckCircle className="h-4 w-4 text-green-400 success-check" /> 
                        : "Apply"
                    }
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Price Range Dropdown */}
          <div className="relative">
            <button 
              onClick={() => toggleDropdown('price')} 
              className={cn(
                filterButtonBase, 
                isPriceActive ? filterButtonActive : filterButtonDefault,
                openDropdown === 'price' && filterButtonOpen, 
                "flex items-center min-w-[130px]"
              )}
            >
              <span className="truncate flex-1 text-left">
                {getPriceLabel()}
                {getPriceDisplayValue() && (
                  <span className="ml-1 font-medium">({getPriceDisplayValue()})</span>
                )}
              </span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform shrink-0",
                openDropdown === 'price' ? "rotate-180 text-primary" : isPriceActive ? "text-primary" : "text-gray-500"
              )} />
            </button>

            {/* Price Dropdown Panel */}
            {openDropdown === 'price' && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <div className="p-4 space-y-4">
                  <div className="text-sm font-medium text-white">Price per kg (USD)</div>
                  
                  {/* Slider */}
                  <div className="pt-2">
                    <Slider 
                      value={tempPriceRange} 
                      onValueChange={value => setTempPriceRange(value as [number, number])} 
                      max={maxPriceLimit} 
                      min={0} 
                      step={5} 
                      className="w-full" 
                    />
                    <div className="flex justify-between mt-2 text-sm text-gray-400">
                      <span>${tempPriceRange[0]}</span>
                      <span>${tempPriceRange[1]}{tempPriceRange[1] >= maxPriceLimit ? '+' : ''}</span>
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">Quick Presets:</div>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        className="h-7 px-3 text-xs rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors" 
                        onClick={() => setTempPriceRange([0, 15])}
                      >
                        Budget (&lt;$15)
                      </button>
                      <button 
                        className="h-7 px-3 text-xs rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors" 
                        onClick={() => setTempPriceRange([15, 25])}
                      >
                        Mid ($15-25)
                      </button>
                      <button 
                        className="h-7 px-3 text-xs rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors" 
                        onClick={() => setTempPriceRange([25, maxPriceLimit])}
                      >
                        Premium (&gt;$25)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-3 border-t border-gray-700 flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setTempPriceRange([0, maxPriceLimit])} 
                    className="text-gray-400 hover:text-white"
                  >
                    Clear
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={applyPriceFilter} 
                    disabled={isApplying === 'price'} 
                    className="min-w-[70px] bg-primary hover:bg-primary/90"
                  >
                    {isApplying === 'price' 
                      ? <Loader2 className="h-4 w-4 filter-spinner" /> 
                      : showSuccess === 'price' 
                        ? <CheckCircle className="h-4 w-4 text-green-400 success-check" /> 
                        : "Apply"
                    }
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* More Filters Button */}
          <button 
            onClick={onOpenMoreFilters} 
            className={cn(
              filterButtonBase, 
              moreFiltersCount > 0 ? filterButtonActive : filterButtonDefault, 
              "flex items-center min-w-[140px]"
            )}
          >
            <SlidersHorizontal className={cn("h-4 w-4 shrink-0", moreFiltersCount > 0 && "text-primary")} />
            <span className="flex-1 text-left">More Filters</span>
            {moreFiltersCount > 0 && <FilterCountBadge count={moreFiltersCount} />}
            <ChevronDown className={cn("h-4 w-4 shrink-0", moreFiltersCount > 0 ? "text-primary" : "text-gray-500")} />
          </button>

          {/* Clear All Link - Only show when filters are active */}
          {totalActiveFilters > 0 && (
            <button
              onClick={handleClearAllFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-primary transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Right side - Sort (placeholder for future) */}
        <div className="flex items-center gap-2">
          {/* Active filter count badge */}
          {totalActiveFilters > 0 && (
            <span className="text-xs text-gray-500">
              {totalActiveFilters} {totalActiveFilters === 1 ? 'filter' : 'filters'} active
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
