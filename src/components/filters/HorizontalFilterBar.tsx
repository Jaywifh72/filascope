import { useState, useRef, useEffect } from "react";
import { ChevronDown, SlidersHorizontal, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

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
}

type DropdownType = 'material' | 'brand' | 'price' | null;

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
}: HorizontalFilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>(priceRange);
  const [tempSelectedBrands, setTempSelectedBrands] = useState<string[]>(selectedBrands);
  
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

  // Reset temp state when dropdown opens
  useEffect(() => {
    if (openDropdown === 'brand') {
      setTempSelectedBrands(selectedBrands);
      setBrandSearch("");
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

  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  // Sort brands by count (popular first)
  const sortedBrands = [...filteredBrands].sort((a, b) => b.count - a.count);

  const applyBrandFilter = () => {
    onBrandsChange(tempSelectedBrands);
    setOpenDropdown(null);
  };

  const applyPriceFilter = () => {
    onPriceRangeChange(tempPriceRange);
    setOpenDropdown(null);
  };

  const getSelectedMaterialLabel = () => {
    if (selectedMaterial === "All") return "Material Type";
    return selectedMaterial;
  };

  const getSelectedBrandsLabel = () => {
    if (selectedBrands.length === 0) return "Brand";
    if (selectedBrands.length === 1) return selectedBrands[0];
    return `${selectedBrands.length} Brands`;
  };

  const getPriceLabel = () => {
    if (priceRange[0] === 0 && priceRange[1] >= maxPriceLimit) return "Price Range";
    if (priceRange[0] === 0) return `Under $${priceRange[1]}/kg`;
    if (priceRange[1] >= maxPriceLimit) return `Over $${priceRange[0]}/kg`;
    return `$${priceRange[0]}-$${priceRange[1]}/kg`;
  };

  return (
    <div className="bg-card/50 border-b border-border relative" ref={dropdownRef}>
      <div className="max-w-[1800px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left side - Filter dropdowns */}
        <div className="flex items-center gap-2">
          {/* Material Type Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleDropdown('material')}
              className={cn(
                "h-9 gap-2 min-w-[140px] justify-between",
                openDropdown === 'material' && "ring-2 ring-primary/50",
                selectedMaterial !== "All" && "border-primary/50 bg-primary/5"
              )}
            >
              <span className="truncate">{getSelectedMaterialLabel()}</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform shrink-0",
                openDropdown === 'material' && "rotate-180"
              )} />
            </Button>

            {/* Material Dropdown Panel */}
            {openDropdown === 'material' && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <div className="p-2 max-h-[400px] overflow-y-auto">
                  {materialCategories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => {
                        onMaterialChange(category.name);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                        selectedMaterial === category.name
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {selectedMaterial === category.name && (
                          <Check className="h-4 w-4" />
                        )}
                        <span className={selectedMaterial === category.name ? "" : "ml-6"}>
                          {category.name}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        ({category.count.toLocaleString()})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Brand Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleDropdown('brand')}
              className={cn(
                "h-9 gap-2 min-w-[120px] justify-between",
                openDropdown === 'brand' && "ring-2 ring-primary/50",
                selectedBrands.length > 0 && "border-primary/50 bg-primary/5"
              )}
            >
              <span className="truncate">{getSelectedBrandsLabel()}</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform shrink-0",
                openDropdown === 'brand' && "rotate-180"
              )} />
            </Button>

            {/* Brand Dropdown Panel */}
            {openDropdown === 'brand' && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-popover border border-border rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                {/* Search */}
                <div className="p-3 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search brands..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                </div>

                {/* Brand List */}
                <div className="p-2 max-h-[300px] overflow-y-auto">
                  {sortedBrands.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No brands found
                    </p>
                  ) : (
                    sortedBrands.map((brand) => (
                      <label
                        key={brand.name}
                        className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={tempSelectedBrands.includes(brand.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTempSelectedBrands(prev => [...prev, brand.name]);
                              } else {
                                setTempSelectedBrands(prev => prev.filter(b => b !== brand.name));
                              }
                            }}
                          />
                          <span className="text-sm">{brand.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({brand.count})
                        </span>
                      </label>
                    ))
                  )}
                </div>

                {/* Actions */}
                <div className="p-3 border-t border-border flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTempSelectedBrands([])}
                    className="text-muted-foreground"
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={applyBrandFilter}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Price Range Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleDropdown('price')}
              className={cn(
                "h-9 gap-2 min-w-[130px] justify-between",
                openDropdown === 'price' && "ring-2 ring-primary/50",
                (priceRange[0] > 0 || priceRange[1] < maxPriceLimit) && "border-primary/50 bg-primary/5"
              )}
            >
              <span className="truncate">{getPriceLabel()}</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform shrink-0",
                openDropdown === 'price' && "rotate-180"
              )} />
            </Button>

            {/* Price Dropdown Panel */}
            {openDropdown === 'price' && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-popover border border-border rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <div className="p-4 space-y-4">
                  <div className="text-sm font-medium">Price per kg (USD)</div>
                  
                  {/* Slider */}
                  <div className="pt-2">
                    <Slider
                      value={tempPriceRange}
                      onValueChange={(value) => setTempPriceRange(value as [number, number])}
                      max={maxPriceLimit}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <span>${tempPriceRange[0]}</span>
                      <span>${tempPriceRange[1]}{tempPriceRange[1] >= maxPriceLimit ? '+' : ''}</span>
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Quick Presets:</div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setTempPriceRange([0, 15])}
                      >
                        Budget (&lt;$15)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setTempPriceRange([15, 25])}
                      >
                        Mid ($15-25)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setTempPriceRange([25, maxPriceLimit])}
                      >
                        Premium (&gt;$25)
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-3 border-t border-border flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTempPriceRange([0, maxPriceLimit])}
                    className="text-muted-foreground"
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={applyPriceFilter}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* More Filters Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenMoreFilters}
            className={cn(
              "h-9 gap-2",
              moreFiltersCount > 0 && "border-primary/50 bg-primary/5"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>More Filters</span>
            {moreFiltersCount > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
                {moreFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Right side - Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="truecost-asc">True Cost: Low to High</option>
            <option value="truecost-desc">True Cost: High to Low</option>
            <option value="print-desc">Print: High to Low</option>
            <option value="print-asc">Print: Low to High</option>
            <option value="strength-desc">Strength: High to Low</option>
            <option value="strength-asc">Strength: Low to High</option>
            <option value="heat-desc">Heat: High to Low</option>
            <option value="heat-asc">Heat: Low to High</option>
            <option value="score-desc">Score: High to Low</option>
            <option value="score-asc">Score: Low to High</option>
          </select>
        </div>
      </div>
    </div>
  );
}
