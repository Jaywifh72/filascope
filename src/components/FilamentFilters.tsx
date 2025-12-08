import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { SlidersHorizontal, X, Zap, Sparkles, Atom, Sun, Package, Recycle } from "lucide-react";

interface FilamentFiltersProps {
  // Material filters
  selectedMaterials: string[];
  onMaterialChange: (material: string, checked: boolean) => void;
  
  // Special properties
  highSpeed: boolean;
  onHighSpeedChange: (checked: boolean) => void;
  matte: boolean;
  onMatteChange: (checked: boolean) => void;
  carbonFiber: boolean;
  onCarbonFiberChange: (checked: boolean) => void;
  glow: boolean;
  onGlowChange: (checked: boolean) => void;
  
  // Spool type
  plasticSpool: boolean;
  onPlasticSpoolChange: (checked: boolean) => void;
  cardboardSpool: boolean;
  onCardboardSpoolChange: (checked: boolean) => void;
  
  // Price range
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  maxPriceLimit: number;
  
  // Counts for display
  filterCounts?: Record<string, number>;
  
  // Reset
  onReset: () => void;
  activeFilterCount: number;
}

const CORE_MATERIALS = ["PLA", "PETG", "ABS", "ASA", "TPU"];

const FilterContent = ({
  selectedMaterials,
  onMaterialChange,
  highSpeed,
  onHighSpeedChange,
  matte,
  onMatteChange,
  carbonFiber,
  onCarbonFiberChange,
  glow,
  onGlowChange,
  plasticSpool,
  onPlasticSpoolChange,
  cardboardSpool,
  onCardboardSpoolChange,
  priceRange,
  onPriceRangeChange,
  maxPriceLimit,
  filterCounts,
  onReset,
  activeFilterCount,
}: FilamentFiltersProps) => {
  return (
    <div className="space-y-6">
      {/* Header with Reset */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Filters</h3>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            Reset ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Material Type */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Atom className="w-3.5 h-3.5" />
          Material
        </h4>
        <div className="space-y-2">
          {CORE_MATERIALS.map((material) => (
            <label
              key={material}
              className="flex items-center gap-3 p-2 rounded-lg bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group"
            >
              <Checkbox
                checked={selectedMaterials.includes(material)}
                onCheckedChange={(checked) => onMaterialChange(material, checked as boolean)}
                className="border-muted-foreground/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
              />
              <span className="flex-1 text-sm text-foreground group-hover:text-cyan-400 transition-colors">
                {material}
              </span>
              {filterCounts && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-muted/50">
                  {filterCounts[`material_${material}`] || 0}
                </Badge>
              )}
            </label>
          ))}
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Special Properties */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          Special Properties
        </h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-foreground group-hover:text-cyan-400 transition-colors">High Speed</span>
            </div>
            <Switch
              checked={highSpeed}
              onCheckedChange={onHighSpeedChange}
              className="data-[state=checked]:bg-cyan-500"
            />
          </label>
          
          <label className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-muted to-muted-foreground/50" />
              <span className="text-sm text-foreground group-hover:text-cyan-400 transition-colors">Matte Finish</span>
            </div>
            <Switch
              checked={matte}
              onCheckedChange={onMatteChange}
              className="data-[state=checked]:bg-cyan-500"
            />
          </label>
          
          <label className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-2">
              <Atom className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-foreground group-hover:text-cyan-400 transition-colors">Carbon Fiber</span>
            </div>
            <Switch
              checked={carbonFiber}
              onCheckedChange={onCarbonFiberChange}
              className="data-[state=checked]:bg-cyan-500"
            />
          </label>
          
          <label className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-green-400" />
              <span className="text-sm text-foreground group-hover:text-cyan-400 transition-colors">Glow in Dark</span>
            </div>
            <Switch
              checked={glow}
              onCheckedChange={onGlowChange}
              className="data-[state=checked]:bg-cyan-500"
            />
          </label>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Spool Type */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Package className="w-3.5 h-3.5" />
          Spool Type
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-2 rounded-lg bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <Checkbox
              checked={plasticSpool}
              onCheckedChange={(checked) => onPlasticSpoolChange(checked as boolean)}
              className="border-muted-foreground/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
            />
            <Package className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-foreground group-hover:text-cyan-400 transition-colors">Plastic Spool</span>
          </label>
          
          <label className="flex items-center gap-3 p-2 rounded-lg bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <Checkbox
              checked={cardboardSpool}
              onCheckedChange={(checked) => onCardboardSpoolChange(checked as boolean)}
              className="border-muted-foreground/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
            />
            <Recycle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-foreground group-hover:text-cyan-400 transition-colors">Cardboard Spool</span>
          </label>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Price Range */}
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <span className="font-mono text-[#ff6b00]">$</span>
          Price Range ($/kg)
        </h4>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => onPriceRangeChange(value as [number, number])}
            min={0}
            max={maxPriceLimit}
            step={1}
            className="w-full"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="px-3 py-1.5 rounded-md bg-background border border-border text-sm font-mono text-[#ff6b00]">
              ${priceRange[0]}
            </div>
            <span className="text-xs text-muted-foreground">to</span>
            <div className="px-3 py-1.5 rounded-md bg-background border border-border text-sm font-mono text-[#ff6b00]">
              ${priceRange[1]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FilamentFilters = (props: FilamentFiltersProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 border-r border-border bg-card/50 backdrop-blur-sm p-6 sticky top-0 h-screen overflow-y-auto shrink-0">
        <FilterContent {...props} />
      </aside>

      {/* Mobile Drawer Trigger */}
      <div className="lg:hidden fixed bottom-6 left-6 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="rounded-full shadow-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white border-0 h-14 w-14 p-0"
            >
              <SlidersHorizontal className="w-6 h-6" />
              {props.activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {props.activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] bg-card/95 backdrop-blur-md border-r border-border p-6 overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-lg font-semibold text-foreground">Filter Filaments</SheetTitle>
            </SheetHeader>
            <FilterContent {...props} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default FilamentFilters;
