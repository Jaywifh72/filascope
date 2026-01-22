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
            className="lg:hidden gap-2 border-primary/30 hover:border-primary"
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

        <SheetContent side="left" className="w-[320px] sm:w-[380px] p-0 bg-background border-r border-border/50">
          <SheetHeader className="px-4 py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base font-semibold text-white">
                Filter Parameters
              </SheetTitle>
              <SheetClose className="rounded-full p-1.5 hover:bg-white/10 transition-colors">
                <X className="h-5 w-5" />
              </SheetClose>
            </div>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearFilters}
                className="w-full mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Clear All Filters
              </Button>
            )}
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="divide-y divide-border/30">
              {/* Sort Section */}
              <div className="p-4">
                <button
                  onClick={() => toggleSection('sort')}
                  className="w-full flex items-center justify-between py-2"
                >
                  <span className="text-sm font-medium text-white">Sort By</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSection === 'sort' && "rotate-180"
                  )} />
                </button>
                {expandedSection === 'sort' && (
                  <div className="mt-2 space-y-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onSortChange(option.value)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                          sortBy === option.value
                            ? "bg-primary/15 text-primary"
                            : "text-foreground/70 hover:bg-white/5"
                        )}
                      >
                        <span>{option.label}</span>
                        {sortBy === option.value && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Range Section */}
              <div className="p-4">
                <button
                  onClick={() => toggleSection('price')}
                  className="w-full flex items-center justify-between py-2"
                >
                  <span className="text-sm font-medium text-white">Price Range</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSection === 'price' && "rotate-180"
                  )} />
                </button>
                {expandedSection === 'price' && (
                  <div className="mt-2 space-y-1">
                    {priceRanges.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onPriceChange(option.value)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                          priceRange === option.value
                            ? "bg-primary/15 text-primary"
                            : "text-foreground/70 hover:bg-white/5"
                        )}
                      >
                        <span>{option.label}</span>
                        {priceRange === option.value && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Build Volume Section */}
              <div className="p-4">
                <button
                  onClick={() => toggleSection('volume')}
                  className="w-full flex items-center justify-between py-2"
                >
                  <span className="text-sm font-medium text-white">Build Size</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSection === 'volume' && "rotate-180"
                  )} />
                </button>
                {expandedSection === 'volume' && (
                  <div className="mt-2 space-y-1">
                    {buildVolumes.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onBuildVolumeChange(option.value)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                          buildVolume === option.value
                            ? "bg-primary/15 text-primary"
                            : "text-foreground/70 hover:bg-white/5"
                        )}
                      >
                        <span>{option.label}</span>
                        {buildVolume === option.value && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Brands Section */}
              <div className="p-4">
                <button
                  onClick={() => toggleSection('brands')}
                  className="w-full flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">Brand</span>
                    {advancedFilters.brands.length > 0 && (
                      <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">
                        {advancedFilters.brands.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSection === 'brands' && "rotate-180"
                  )} />
                </button>
                {expandedSection === 'brands' && (
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search brands..."
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        className="pl-9 h-10 bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredBrands.map((brand) => (
                        <label
                          key={brand}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer"
                        >
                          <Checkbox
                            checked={advancedFilters.brands.includes(brand)}
                            onCheckedChange={() => toggleBrand(brand)}
                          />
                          <span className="text-sm text-foreground/80">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Motion System Section */}
              <div className="p-4">
                <button
                  onClick={() => toggleSection('motion')}
                  className="w-full flex items-center justify-between py-2"
                >
                  <span className="text-sm font-medium text-white">Motion System</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSection === 'motion' && "rotate-180"
                  )} />
                </button>
                {expandedSection === 'motion' && (
                  <div className="mt-2 space-y-1">
                    {motionOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onAdvancedFiltersChange({ ...advancedFilters, motionSystem: option.value })}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                          advancedFilters.motionSystem === option.value
                            ? "bg-primary/15 text-primary"
                            : "text-foreground/70 hover:bg-white/5"
                        )}
                      >
                        <span>{option.label}</span>
                        {advancedFilters.motionSystem === option.value && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Features Section */}
              <div className="p-4">
                <button
                  onClick={() => toggleSection('features')}
                  className="w-full flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">Features</span>
                    {advancedFilters.features.length > 0 && (
                      <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">
                        {advancedFilters.features.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSection === 'features' && "rotate-180"
                  )} />
                </button>
                {expandedSection === 'features' && (
                  <div className="mt-2 space-y-1">
                    {featureOptions.map((feature) => (
                      <label
                        key={feature.value}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer"
                      >
                        <Checkbox
                          checked={advancedFilters.features.includes(feature.value)}
                          onCheckedChange={() => toggleFeature(feature.value)}
                        />
                        <span className="text-sm text-foreground/80">{feature.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Speed Range Section */}
              <div className="p-4">
                <button
                  onClick={() => toggleSection('speed')}
                  className="w-full flex items-center justify-between py-2"
                >
                  <span className="text-sm font-medium text-white">Print Speed</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSection === 'speed' && "rotate-180"
                  )} />
                </button>
                {expandedSection === 'speed' && (
                  <div className="mt-4 px-2 space-y-4">
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
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{advancedFilters.minSpeed} mm/s</span>
                      <span>{advancedFilters.maxSpeed} mm/s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Apply Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-background">
            <Button 
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating Filter Button - Only when filters are active */}
      {hasActiveFilters && !isOpen && (
        <div className="lg:hidden fixed bottom-20 left-4 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            size="sm"
            className="rounded-full shadow-lg bg-primary hover:bg-primary/90 gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters ({activeFilterCount})
          </Button>
        </div>
      )}
    </>
  );
}
