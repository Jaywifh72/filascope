import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface AdvancedFilters {
  brands: string[];
  motionSystem: string;
  minSpeed: number;
  maxSpeed: number;
  features: string[];
}

interface PrintersAdvancedFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AdvancedFilters;
  onApply: (filters: AdvancedFilters) => void;
  availableBrands: string[];
}

const defaultFilters: AdvancedFilters = {
  brands: [],
  motionSystem: "any",
  minSpeed: 0,
  maxSpeed: 1000,
  features: [],
};

const featureOptions = [
  { id: "auto_bed_leveling", label: "Auto Bed Leveling" },
  { id: "heated_bed", label: "Heated Bed" },
  { id: "enclosed", label: "Enclosed" },
  { id: "camera", label: "Camera" },
  { id: "wifi", label: "Wi-Fi / Network" },
  { id: "filament_sensor", label: "Filament Sensor" },
  { id: "dual_extruder", label: "Dual Extruder" },
];

const motionOptions = [
  { value: "any", label: "Any" },
  { value: "cartesian", label: "Cartesian" },
  { value: "corexy", label: "CoreXY" },
  { value: "delta", label: "Delta" },
];

export default function PrintersAdvancedFiltersModal({
  open,
  onOpenChange,
  filters,
  onApply,
  availableBrands,
}: PrintersAdvancedFiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);
  const [brandSearch, setBrandSearch] = useState("");

  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  const handleBrandToggle = (brand: string) => {
    setLocalFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand]
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setLocalFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleClearAll = () => {
    setLocalFilters(defaultFilters);
  };

  const handleApply = () => {
    onApply(localFilters);
    onOpenChange(false);
  };

  const filteredBrands = availableBrands.filter(brand =>
    brand.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const activeFilterCount = 
    localFilters.brands.length +
    (localFilters.motionSystem !== "any" ? 1 : 0) +
    (localFilters.minSpeed > 0 || localFilters.maxSpeed < 1000 ? 1 : 0) +
    localFilters.features.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border flex flex-col">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="text-xl font-bold">
            Advanced Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary/15 text-primary text-sm rounded-full">
                {activeFilterCount} active
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-8 py-6">
            {/* Brand Filter */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                Brand
              </h3>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search brands..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                {filteredBrands.map(brand => (
                  <label
                    key={brand}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={localFilters.brands.includes(brand)}
                      onCheckedChange={() => handleBrandToggle(brand)}
                    />
                    <span className="text-sm">{brand}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Motion System */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                Motion System
              </h3>
              <RadioGroup
                value={localFilters.motionSystem}
                onValueChange={(value) => setLocalFilters(prev => ({ ...prev, motionSystem: value }))}
                className="grid grid-cols-2 gap-2"
              >
                {motionOptions.map(option => (
                  <Label
                    key={option.value}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      localFilters.motionSystem === option.value
                        ? "bg-primary/15 border-primary/50 text-primary"
                        : "border-white/10 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <RadioGroupItem value={option.value} />
                    <span className="text-sm">{option.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </section>

            {/* Max Speed Slider */}
            <section>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Print Speed
                </h3>
                <span className="text-sm text-muted-foreground">
                  {localFilters.minSpeed} - {localFilters.maxSpeed} mm/s
                </span>
              </div>
              <Slider
                value={[localFilters.minSpeed, localFilters.maxSpeed]}
                min={0}
                max={1000}
                step={50}
                onValueChange={([min, max]) => setLocalFilters(prev => ({ ...prev, minSpeed: min, maxSpeed: max }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0 mm/s</span>
                <span>1000 mm/s</span>
              </div>
            </section>

            {/* Features */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                Features
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {featureOptions.map(feature => (
                  <label
                    key={feature.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      localFilters.features.includes(feature.id)
                        ? "bg-primary/15 border-primary/50"
                        : "border-white/10 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <Checkbox
                      checked={localFilters.features.includes(feature.id)}
                      onCheckedChange={() => handleFeatureToggle(feature.id)}
                    />
                    <span className="text-sm">{feature.label}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>

        <SheetFooter className="border-t border-border pt-4 gap-3">
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="flex-1"
          >
            Clear All
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
