import { useState } from "react";
import { X, SlidersHorizontal, Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AdvancedFilters } from "./PrintersLeftSidebar";

interface MobileFilterDrawerProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
  priceRange: string;
  onPriceChange: (range: string) => void;
  buildVolume: string;
  onBuildVolumeChange: (volume: string) => void;
  advancedFilters: AdvancedFilters;
  onAdvancedFiltersChange: (filters: AdvancedFilters) => void;
  availableBrands: string[];
  hasActiveFilters: boolean;
  activeFilterCount: number;
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

const motionOptions = [
  { value: "any", label: "Any" },
  { value: "corexy", label: "CoreXY" },
  { value: "cartesian", label: "Cartesian" },
  { value: "delta", label: "Delta" },
];

const featureOptions = [
  { value: "auto_bed_leveling", label: "Auto Bed Leveling" },
  { value: "heated_bed", label: "Heated Bed" },
  { value: "enclosed", label: "Enclosed" },
  { value: "camera", label: "Camera/AI Detection" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "filament_sensor", label: "Filament Runout" },
  { value: "dual_extruder", label: "Multi-Extruder" },
];

export function MobileFilterDrawer({
  sortBy,
  onSortChange,
  priceRange,
  onPriceChange,
  buildVolume,
  onBuildVolumeChange,
  advancedFilters,
  onAdvancedFiltersChange,
  availableBrands,
  hasActiveFilters,
  activeFilterCount,
  onClearFilters,
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState("");

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const filteredBrands = availableBrands.filter(brand =>
    brand.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const toggleBrand = (brand: string) => {
    const newBrands = advancedFilters.brands.includes(brand)
      ? advancedFilters.brands.filter(b => b !== brand)
      : [...advancedFilters.brands, brand];
    onAdvancedFiltersChange({ ...advancedFilters, brands: newBrands });
  };

  const toggleFeature = (feature: string) => {
    const newFeatures = advancedFilters.features.includes(feature)
      ? advancedFilters.features.filter(f => f !== feature)
      : [...advancedFilters.features, feature];
    onAdvancedFiltersChange({ ...advancedFilters, features: newFeatures });
  };

  return (
    <>
      {/* Trigger Button - Only visible on mobile/tablet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="lg:hidden gap-2 border-primary/30 hover:border-primary min-h-[44px] touch-manipulation"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 font-semibold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>

        {/* Bottom Sheet Modal - Consistent with MobileFilamentFilterSheet */}
        <SheetContent 
          side="bottom" 
          className="h-[85vh] p-0 bg-gray-900/95 border-t border-gray-800 rounded-t-2xl backdrop-blur-xl"
        >
          <SheetHeader className="px-4 py-4 border-b border-gray-800 bg-gradient-to-b from-white/[0.03] to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <SheetTitle className="text-sm font-semibold text-gray-300">
                  Filter Parameters
                </SheetTitle>
              </div>
              <SheetClose className="rounded-full p-1.5 hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation">
                <X className="h-5 w-5" />
              </SheetClose>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(85vh-180px)]">
            <div className="divide-y divide-gray-800/50">
              {/* Sort Section */}
              <div className="px-4 py-3">
                <button
                  onClick={() => toggleSection('sort')}
                  aria-expanded={expandedSection === 'sort'}
                  aria-controls="sort-section-content"
                  className={cn(
                    "w-full flex items-center justify-between py-3 px-3 rounded-lg min-h-[44px] touch-manipulation transition-colors",
                    expandedSection === 'sort' && "bg-white/[0.02]"
                  )}
                >
                  <span className="text-sm font-medium text-white">Sort By</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-gray-500 transition-all duration-200",
                    expandedSection === 'sort' && "rotate-180"
                  )} />
                </button>
                {expandedSection === 'sort' && (
                  <div id="sort-section-content" className="mt-3 space-y-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onSortChange(option.value)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm min-h-[44px] touch-manipulation transition-colors",
                          sortBy === option.value
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                        )}
                      >
                        <span>{option.label}</span>
                        {sortBy === option.value && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Range Section */}
              <div className="px-4 py-3">
                <button
                  onClick={() => toggleSection('price')}
                  aria-expanded={expandedSection === 'price'}
                  aria-controls="price-section-content"
                  className={cn(
                    "w-full flex items-center justify-between py-3 px-3 rounded-lg min-h-[44px] touch-manipulation transition-colors",
                    expandedSection === 'price' && "bg-white/[0.02]"
                  )}
                >
                  <span className="text-sm font-medium text-white">Price Range</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-gray-500 transition-all duration-200",
                    expandedSection === 'price' && "rotate-180"
                  )} />
                </button>
                {expandedSection === 'price' && (
                  <div id="price-section-content" className="mt-3 space-y-1">
                    {priceRanges.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onPriceChange(option.value)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm min-h-[44px] touch-manipulation transition-colors",
                          priceRange === option.value
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                        )}
                      >
                        <span>{option.label}</span>
                        {priceRange === option.value && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Build Volume Section */}
              <div className="px-4 py-3">
                <button
                  onClick={() => toggleSection('volume')}
                  aria-expanded={expandedSection === 'volume'}
                  aria-controls="volume-section-content"
                  className={cn(
                    "w-full flex items-center justify-between py-3 px-3 rounded-lg min-h-[44px] touch-manipulation transition-colors",
                    expandedSection === 'volume' && "bg-white/[0.02]"
                  )}
                >
                  <span className="text-sm font-medium text-white">Build Size</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-gray-500 transition-all duration-200",
                    expandedSection === 'volume' && "rotate-180"
                  )} />
                </button>
                {expandedSection === 'volume' && (
                  <div id="volume-section-content" className="mt-3 space-y-1">
                    {buildVolumes.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onBuildVolumeChange(option.value)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm min-h-[44px] touch-manipulation transition-colors",
                          buildVolume === option.value
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                        )}
                      >
                        <span>{option.label}</span>
                        {buildVolume === option.value && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Brands Section */}
              <div className="px-4 py-3">
                <button
                  onClick={() => toggleSection('brands')}
                  aria-expanded={expandedSection === 'brands'}
                  aria-controls="brands-section-content"
                  className={cn(
                    "w-full flex items-center justify-between py-3 px-3 rounded-lg min-h-[44px] touch-manipulation transition-colors",
                    expandedSection === 'brands' && "bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">Brand</span>
                    {advancedFilters.brands.length > 0 && (
                      <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">
                        {advancedFilters.brands.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-gray-500 transition-all duration-200",
                    expandedSection === 'brands' && "rotate-180"
                  )} />
                </button>
                {expandedSection === 'brands' && (
                  <div id="brands-section-content" className="mt-3 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search brands..."
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        className="pl-9 h-11 bg-white/5 border-gray-800 text-sm min-h-[44px]"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredBrands.map((brand) => (
                        <label
                          key={brand}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer min-h-[44px] touch-manipulation transition-colors",
                            advancedFilters.brands.includes(brand)
                              ? "bg-primary/10"
                              : "hover:bg-gray-800/50"
                          )}
                        >
                          <Checkbox
                            checked={advancedFilters.brands.includes(brand)}
                            onCheckedChange={() => toggleBrand(brand)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className={cn(
                            "text-sm",
                            advancedFilters.brands.includes(brand) ? "text-primary font-medium" : "text-gray-400"
                          )}>{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Motion System Section */}
              <div className="px-4 py-3">
                <button
                  onClick={() => toggleSection('motion')}
                  aria-expanded={expandedSection === 'motion'}
                  aria-controls="motion-section-content"
                  className={cn(
                    "w-full flex items-center justify-between py-3 px-3 rounded-lg min-h-[44px] touch-manipulation transition-colors",
                    expandedSection === 'motion' && "bg-white/[0.02]"
                  )}
                >
                  <span className="text-sm font-medium text-white">Motion System</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-gray-500 transition-all duration-200",
                    expandedSection === 'motion' && "rotate-180"
                  )} />
                </button>
                {expandedSection === 'motion' && (
                  <div id="motion-section-content" className="mt-3 space-y-1">
                    {motionOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onAdvancedFiltersChange({ ...advancedFilters, motionSystem: option.value })}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm min-h-[44px] touch-manipulation transition-colors",
                          advancedFilters.motionSystem === option.value
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                        )}
                      >
                        <span>{option.label}</span>
                        {advancedFilters.motionSystem === option.value && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Features Section */}
              <div className="px-4 py-3">
                <button
                  onClick={() => toggleSection('features')}
                  aria-expanded={expandedSection === 'features'}
                  aria-controls="features-section-content"
                  className={cn(
                    "w-full flex items-center justify-between py-3 px-3 rounded-lg min-h-[44px] touch-manipulation transition-colors",
                    expandedSection === 'features' && "bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">Features</span>
                    {advancedFilters.features.length > 0 && (
                      <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">
                        {advancedFilters.features.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-gray-500 transition-all duration-200",
                    expandedSection === 'features' && "rotate-180"
                  )} />
                </button>
                {expandedSection === 'features' && (
                  <div id="features-section-content" className="mt-3 space-y-1">
                    {featureOptions.map((feature) => (
                      <label
                        key={feature.value}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer min-h-[44px] touch-manipulation transition-colors",
                          advancedFilters.features.includes(feature.value)
                            ? "bg-primary/10"
                            : "hover:bg-gray-800/50"
                        )}
                      >
                        <Checkbox
                          checked={advancedFilters.features.includes(feature.value)}
                          onCheckedChange={() => toggleFeature(feature.value)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span className={cn(
                          "text-sm",
                          advancedFilters.features.includes(feature.value) ? "text-primary font-medium" : "text-gray-400"
                        )}>{feature.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Speed Range Section */}
              <div className="px-4 py-3">
                <button
                  onClick={() => toggleSection('speed')}
                  aria-expanded={expandedSection === 'speed'}
                  aria-controls="speed-section-content"
                  className={cn(
                    "w-full flex items-center justify-between py-3 px-3 rounded-lg min-h-[44px] touch-manipulation transition-colors",
                    expandedSection === 'speed' && "bg-white/[0.02]"
                  )}
                >
                  <span className="text-sm font-medium text-white">Print Speed</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-gray-500 transition-all duration-200",
                    expandedSection === 'speed' && "rotate-180"
                  )} />
                </button>
                {expandedSection === 'speed' && (
                  <div id="speed-section-content" className="mt-4 px-2 space-y-4">
                    <Slider
                      value={[advancedFilters.minSpeed, advancedFilters.maxSpeed]}
                      onValueChange={([min, max]) => onAdvancedFiltersChange({
                        ...advancedFilters,
                        minSpeed: min,
                        maxSpeed: max,
                      })}
                      max={1000}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{advancedFilters.minSpeed} mm/s</span>
                      <span>{advancedFilters.maxSpeed} mm/s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Sticky Footer with Apply/Clear Buttons */}
          <div 
            className="sticky bottom-0 px-4 py-4 bg-gray-900 border-t border-gray-800 space-y-3"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClearFilters}
                disabled={!hasActiveFilters}
                className="flex-1 min-h-[44px] touch-manipulation"
              >
                Clear All
              </Button>
              <SheetClose asChild>
                <Button className="flex-1 min-h-[44px] touch-manipulation">
                  Apply Filters
                </Button>
              </SheetClose>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating Filter Button - Only when filters are active */}
      {hasActiveFilters && !isOpen && (
        <div className="lg:hidden fixed bottom-20 left-4 z-50" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <Button
            onClick={() => setIsOpen(true)}
            size="sm"
            className="rounded-full shadow-lg bg-primary hover:bg-primary/90 gap-2 min-h-[44px] touch-manipulation"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters ({activeFilterCount})
          </Button>
        </div>
      )}
    </>
  );
}
