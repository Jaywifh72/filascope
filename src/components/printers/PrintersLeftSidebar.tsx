import { forwardRef, useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";

export interface AdvancedFilters {
  brands: string[];
  motionSystem: string;
  minSpeed: number;
  maxSpeed: number;
  features: string[];
}

interface PrintersLeftSidebarProps {
  className?: string;
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
  { value: "cartesian", label: "Cartesian" },
  { value: "corexy", label: "CoreXY" },
  { value: "delta", label: "Delta" },
];

const featureOptions = [
  { id: "auto_bed_leveling", label: "Auto Bed Leveling" },
  { id: "heated_bed", label: "Heated Bed" },
  { id: "enclosed", label: "Enclosed" },
  { id: "camera", label: "Camera" },
  { id: "wifi", label: "Wi-Fi / Network" },
  { id: "filament_sensor", label: "Filament Sensor" },
  { id: "dual_extruder", label: "Dual Extruder" },
];

const TOP_BRANDS = ["Bambu Lab", "Creality", "Prusa Research", "FlashForge", "Elegoo", "Snapmaker", "Anycubic", "Raise3D", "UltiMaker"];

type ExpandedSection = 'sort' | 'price' | 'volume' | 'brands' | 'motion' | 'speed' | 'features' | null;

const PrintersLeftSidebar = forwardRef<HTMLDivElement, PrintersLeftSidebarProps>(({
  className,
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
  onClearFilters,
}, ref) => {
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>('brands');
  const [brandSearch, setBrandSearch] = useState("");

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const handleBrandToggle = (brand: string) => {
    const newBrands = advancedFilters.brands.includes(brand)
      ? advancedFilters.brands.filter(b => b !== brand)
      : [...advancedFilters.brands, brand];
    onAdvancedFiltersChange({ ...advancedFilters, brands: newBrands });
  };

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = advancedFilters.features.includes(feature)
      ? advancedFilters.features.filter(f => f !== feature)
      : [...advancedFilters.features, feature];
    onAdvancedFiltersChange({ ...advancedFilters, features: newFeatures });
  };

  const handleMotionChange = (value: string) => {
    onAdvancedFiltersChange({ ...advancedFilters, motionSystem: value });
  };

  const handleSpeedChange = ([min, max]: number[]) => {
    onAdvancedFiltersChange({ ...advancedFilters, minSpeed: min, maxSpeed: max });
  };

  const getSortLabel = () => sortOptions.find(o => o.value === sortBy)?.label || "Sort";
  const getPriceLabel = () => priceRanges.find(o => o.value === priceRange)?.label || "Price";
  const getVolumeLabel = () => buildVolumes.find(o => o.value === buildVolume)?.label || "Size";

  const filteredBrands = availableBrands.filter(brand =>
    brand.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const activeAdvancedCount = 
    advancedFilters.brands.length +
    (advancedFilters.motionSystem !== "any" ? 1 : 0) +
    (advancedFilters.minSpeed > 0 || advancedFilters.maxSpeed < 1000 ? 1 : 0) +
    advancedFilters.features.length;

  return (
    <div
      ref={ref}
      className={cn("w-72 shrink-0 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent", className)}
    >
      <div className="bg-gray-900/60 border-r border-gray-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 bg-gradient-to-b from-white/[0.03] to-transparent">
          <h3 className="text-sm font-semibold text-gray-300">
            Filter Parameters
          </h3>
        </div>

        <div>
          <div className="divide-y divide-gray-800/50">
            {/* Sort Section */}
            <div>
              <button
                onClick={() => toggleSection('sort')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    Sort By
                  </span>
                  <span className="text-xs text-primary truncate max-w-[100px]">
                    {getSortLabel()}
                  </span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-500 transition-transform shrink-0",
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
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                        sortBy === option.value
                          ? "bg-primary/15 text-primary"
                          : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
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
            <div>
              <button
                onClick={() => toggleSection('price')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    Price Range
                  </span>
                  {priceRange !== 'all' && (
                    <span className="bg-cyan-500 text-black text-[10px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center ml-2">
                      1
                    </span>
                  )}
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-500 transition-transform shrink-0",
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
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                        priceRange === option.value
                          ? "bg-primary/15 text-primary"
                          : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
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
            <div>
              <button
                onClick={() => toggleSection('volume')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    Build Size
                  </span>
                  {buildVolume !== 'all' && (
                    <span className="bg-cyan-500 text-black text-[10px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center ml-2">
                      1
                    </span>
                  )}
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-500 transition-transform shrink-0",
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
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                        buildVolume === option.value
                          ? "bg-primary/15 text-primary"
                          : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                      )}
                    >
                      <span>{option.label}</span>
                      {buildVolume === option.value && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Brand Section */}
            <div>
              <button
                onClick={() => toggleSection('brands')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    Brand
                  </span>
                  {advancedFilters.brands.length > 0 && (
                    <span className="bg-cyan-500 text-black text-[10px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center ml-2">
                      {advancedFilters.brands.length}
                    </span>
                  )}
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-500 transition-transform shrink-0",
                  expandedSection === 'brands' && "rotate-180"
                )} />
              </button>
              
              {expandedSection === 'brands' && (
                <div className="px-2 pb-3 space-y-2">
                  {/* Top brand pills */}
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {TOP_BRANDS.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => handleBrandToggle(brand)}
                        className={cn(
                          "text-xs rounded-full px-3 py-1 transition-colors duration-150 border",
                          advancedFilters.brands.includes(brand)
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 font-semibold"
                            : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                  {/* Search + remaining brands */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <Input
                      placeholder="Search brands..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="pl-8 h-8 bg-white/5 border-gray-800 text-sm"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-0.5">
                    {filteredBrands
                      .filter(b => !TOP_BRANDS.includes(b))
                      .map(brand => (
                      <label
                        key={brand}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                          advancedFilters.brands.includes(brand)
                            ? "bg-primary/15 text-primary"
                            : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                        )}
                      >
                        <Checkbox
                          checked={advancedFilters.brands.includes(brand)}
                          onCheckedChange={() => handleBrandToggle(brand)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="text-sm">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Motion System Section */}
            <div>
              <button
                onClick={() => toggleSection('motion')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    Motion System
                  </span>
                  {advancedFilters.motionSystem !== 'any' && (
                    <span className="bg-cyan-500 text-black text-[10px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center ml-2">
                      1
                    </span>
                  )}
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-500 transition-transform shrink-0",
                  expandedSection === 'motion' && "rotate-180"
                )} />
              </button>
              
              {expandedSection === 'motion' && (
                <div className="px-2 pb-3">
                  <RadioGroup
                    value={advancedFilters.motionSystem}
                    onValueChange={handleMotionChange}
                    className="space-y-0.5"
                  >
                    {motionOptions.map(option => (
                      <Label
                        key={option.value}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                          advancedFilters.motionSystem === option.value
                            ? "bg-primary/15 text-primary"
                            : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                        )}
                      >
                        <RadioGroupItem value={option.value} className="h-3.5 w-3.5" />
                        <span className="text-sm">{option.label}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </div>

            {/* Print Speed Section */}
            <div>
              <button
                onClick={() => toggleSection('speed')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    Print Speed
                  </span>
                  {(advancedFilters.minSpeed > 0 || advancedFilters.maxSpeed < 1000) && (
                    <span className="bg-cyan-500 text-black text-[10px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center ml-2">
                      1
                    </span>
                  )}
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-500 transition-transform shrink-0",
                  expandedSection === 'speed' && "rotate-180"
                )} />
              </button>
              
              {expandedSection === 'speed' && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {advancedFilters.minSpeed} mm/s
                    </span>
                    <span className="text-xs text-gray-500">
                      {advancedFilters.maxSpeed} mm/s
                    </span>
                  </div>
                  <Slider
                    value={[advancedFilters.minSpeed, advancedFilters.maxSpeed]}
                    min={0}
                    max={1000}
                    step={50}
                    onValueChange={handleSpeedChange}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Features Section */}
            <div>
              <button
                onClick={() => toggleSection('features')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    Features
                  </span>
                  {advancedFilters.features.length > 0 && (
                    <span className="bg-cyan-500 text-black text-[10px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center ml-2">
                      {advancedFilters.features.length}
                    </span>
                  )}
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-500 transition-transform shrink-0",
                  expandedSection === 'features' && "rotate-180"
                )} />
              </button>
              
              {expandedSection === 'features' && (
                <div className="px-2 pb-3 space-y-0.5">
                  {featureOptions.map(feature => (
                    <label
                      key={feature.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                        advancedFilters.features.includes(feature.id)
                          ? "bg-primary/15 text-primary"
                          : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                      )}
                    >
                      <Checkbox
                        checked={advancedFilters.features.includes(feature.id)}
                        onCheckedChange={() => handleFeatureToggle(feature.id)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-sm">{feature.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clear All Filters Link */}
        {hasActiveFilters && (
          <div className="p-3 border-t border-gray-800 text-center">
            <button
              onClick={onClearFilters}
              className="text-xs text-gray-500 hover:text-cyan-400 font-mono uppercase tracking-wide transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

PrintersLeftSidebar.displayName = "PrintersLeftSidebar";

export default PrintersLeftSidebar;
