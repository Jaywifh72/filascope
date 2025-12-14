import { useState, useRef, useEffect } from "react";
import { ChevronDown, SlidersHorizontal, Check, Search } from "lucide-react";
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
  'Specialty': '#f43f5e',
};

// Top 10 popular brands
const TOP_BRANDS = [
  'Bambu Lab', 'Prusament', 'eSun', 'Overture', 'Hatchbox',
  'Polymaker', 'Sunlu', 'Inland', 'ColorFabb', 'Fillamentum'
];

// Letter groupings for alphabetical sections
const LETTER_GROUPS = [
  { label: 'A-D', letters: ['A', 'B', 'C', 'D'] },
  { label: 'E-H', letters: ['E', 'F', 'G', 'H'] },
  { label: 'I-L', letters: ['I', 'J', 'K', 'L'] },
  { label: 'M-P', letters: ['M', 'N', 'O', 'P'] },
  { label: 'Q-T', letters: ['Q', 'R', 'S', 'T'] },
  { label: 'U-Z', letters: ['U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] },
];

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
  const brandSearchRef = useRef<HTMLInputElement>(null);

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
  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  // Get popular brands (intersection of TOP_BRANDS and available brands)
  const popularBrands = TOP_BRANDS
    .map(name => brands.find(b => b.name === name))
    .filter((b): b is Brand => b !== undefined)
    .filter(b => !brandSearch || b.name.toLowerCase().includes(brandSearch.toLowerCase()));

  // Get other brands (not in popular list), grouped alphabetically
  const otherBrands = filteredBrands.filter(b => !TOP_BRANDS.includes(b.name));

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

  // Brand row component for reuse
  const BrandRow = ({ brand }: { brand: Brand }) => {
    const isSelected = tempSelectedBrands.includes(brand.name);
    return (
      <label
        className={cn(
          "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors",
          isSelected
            ? "bg-primary/10 border border-primary/30"
            : "hover:bg-muted border border-transparent"
        )}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => {
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
              <div className="absolute top-full left-0 mt-2 w-72 bg-popover border border-border rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <div className="p-2 max-h-[400px] overflow-y-auto">
                  {materialCategories.map((category) => (
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
                          : "hover:bg-muted/80"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {/* Color swatch */}
                        <span 
                          className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/20"
                          style={{ backgroundColor: MATERIAL_COLORS[category.name] || '#6b7280' }}
                        />
                        {/* Checkmark for selected */}
                        {selectedMaterial === category.name ? (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <span className="w-4" />
                        )}
                        <span>{category.name}</span>
                      </div>
                      <span className="text-muted-foreground text-xs tabular-nums">
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
              <div className="absolute top-full left-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                {/* Search */}
                <div className="p-3 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={brandSearchRef}
                      placeholder="Search brands..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                </div>

                {/* Brand List */}
                <div className="max-h-[350px] overflow-y-auto">
                  {filteredBrands.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No brands found
                    </p>
                  ) : (
                    <>
                      {/* Top 10 Popular Section */}
                      {popularBrands.length > 0 && !brandSearch && (
                        <div className="p-2 border-b border-border">
                          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Top 10 Popular
                          </div>
                          {popularBrands.map((brand) => (
                            <BrandRow key={brand.name} brand={brand} />
                          ))}
                        </div>
                      )}

                      {/* All Brands - Alphabetical Groups */}
                      <div className="p-2">
                        {!brandSearch && (
                          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            All Brands
                          </div>
                        )}
                        {brandSearch ? (
                          // When searching, show flat list
                          filteredBrands.map((brand) => (
                            <BrandRow key={brand.name} brand={brand} />
                          ))
                        ) : (
                          // When not searching, show alphabetical groups
                          LETTER_GROUPS.map(group => {
                            const groupBrands = otherBrands.filter(b => 
                              group.letters.includes(b.name.charAt(0).toUpperCase())
                            );
                            if (groupBrands.length === 0) return null;
                            return (
                              <div key={group.label}>
                                <div className="px-3 py-1 text-xs text-muted-foreground/70 sticky top-0 bg-popover border-b border-border/50 mb-1">
                                  {group.label}
                                </div>
                                {groupBrands.map((brand) => (
                                  <BrandRow key={brand.name} brand={brand} />
                                ))}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
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
