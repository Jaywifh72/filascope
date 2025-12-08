import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { SlidersHorizontal, X, Zap, Sparkles, Atom, Sun, Package, Recycle, Wallet, Rocket, Leaf } from "lucide-react";

interface FilterPreset {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  filters: {
    materials?: string[];
    highSpeed?: boolean;
    matte?: boolean;
    carbonFiber?: boolean;
    glow?: boolean;
    plasticSpool?: boolean;
    cardboardSpool?: boolean;
    priceRange?: [number, number];
  };
}

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
  
  // Preset application
  onApplyPreset?: (preset: FilterPreset) => void;
}

const CORE_MATERIALS = ["PLA", "PETG", "ABS", "ASA", "TPU"];

const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "budget",
    name: "Budget Friendly",
    icon: <Wallet className="w-4 h-4 text-emerald-400" />,
    description: "Affordable PLA & PETG under $25/kg",
    filters: {
      materials: ["PLA", "PETG"],
      priceRange: [0, 25],
    },
  },
  {
    id: "performance",
    name: "High Performance",
    icon: <Rocket className="w-4 h-4 text-orange-400" />,
    description: "High-speed, engineering-grade filaments",
    filters: {
      materials: ["ABS", "ASA", "PETG"],
      highSpeed: true,
      carbonFiber: true,
    },
  },
  {
    id: "eco",
    name: "Eco-Friendly",
    icon: <Leaf className="w-4 h-4 text-green-400" />,
    description: "Sustainable materials with cardboard spools",
    filters: {
      materials: ["PLA"],
      cardboardSpool: true,
      plasticSpool: false,
    },
  },
];

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
  onApplyPreset,
}: FilamentFiltersProps) => {
  const handlePresetClick = (preset: FilterPreset) => {
    if (onApplyPreset) {
      onApplyPreset(preset);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Reset */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Filters</h3>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
          >
            <X className="w-3 h-3 mr-1" />
            Reset ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Filter Presets */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Quick Presets
        </h4>
        <div className="space-y-1">
          {FILTER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className="w-full flex items-center gap-2 p-2 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer group text-left"
            >
              <div className="shrink-0 w-6 h-6 rounded bg-muted/50 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                {preset.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-medium text-foreground group-hover:text-cyan-400 transition-colors">
                  {preset.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Material Type */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Atom className="w-3 h-3" />
          Material
        </h4>
        <div className="space-y-0.5">
          {CORE_MATERIALS.map((material) => (
            <label
              key={material}
              className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group"
            >
              <Checkbox
                checked={selectedMaterials.includes(material)}
                onCheckedChange={(checked) => onMaterialChange(material, checked as boolean)}
                className="border-muted-foreground/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 h-3.5 w-3.5"
              />
              <span className="flex-1 text-xs text-foreground group-hover:text-cyan-400 transition-colors">
                {material}
              </span>
              {filterCounts && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-muted/50">
                  {filterCounts[`material_${material}`] || 0}
                </Badge>
              )}
            </label>
          ))}
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Special Properties */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Special Properties
        </h4>
        <div className="space-y-0.5">
          <label className="flex items-center justify-between py-1.5 px-2 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-foreground group-hover:text-cyan-400 transition-colors">High Speed</span>
            </div>
            <Switch
              checked={highSpeed}
              onCheckedChange={onHighSpeedChange}
              className="data-[state=checked]:bg-cyan-500 scale-75"
            />
          </label>
          
          <label className="flex items-center justify-between py-1.5 px-2 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-muted to-muted-foreground/50" />
              <span className="text-xs text-foreground group-hover:text-cyan-400 transition-colors">Matte Finish</span>
            </div>
            <Switch
              checked={matte}
              onCheckedChange={onMatteChange}
              className="data-[state=checked]:bg-cyan-500 scale-75"
            />
          </label>
          
          <label className="flex items-center justify-between py-1.5 px-2 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-1.5">
              <Atom className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-foreground group-hover:text-cyan-400 transition-colors">Carbon Fiber</span>
            </div>
            <Switch
              checked={carbonFiber}
              onCheckedChange={onCarbonFiberChange}
              className="data-[state=checked]:bg-cyan-500 scale-75"
            />
          </label>
          
          <label className="flex items-center justify-between py-1.5 px-2 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-foreground group-hover:text-cyan-400 transition-colors">Glow in Dark</span>
            </div>
            <Switch
              checked={glow}
              onCheckedChange={onGlowChange}
              className="data-[state=checked]:bg-cyan-500 scale-75"
            />
          </label>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Spool Type */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Package className="w-3 h-3" />
          Spool Type
        </h4>
        <div className="space-y-0.5">
          <label className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <Checkbox
              checked={plasticSpool}
              onCheckedChange={(checked) => onPlasticSpoolChange(checked as boolean)}
              className="border-muted-foreground/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 h-3.5 w-3.5"
            />
            <Package className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-foreground group-hover:text-cyan-400 transition-colors">Plastic Spool</span>
          </label>
          
          <label className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <Checkbox
              checked={cardboardSpool}
              onCheckedChange={(checked) => onCardboardSpoolChange(checked as boolean)}
              className="border-muted-foreground/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 h-3.5 w-3.5"
            />
            <Recycle className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-foreground group-hover:text-cyan-400 transition-colors">Cardboard Spool</span>
          </label>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Price Range */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <span className="font-mono text-[#ff6b00]">$</span>
          Price Range ($/kg)
        </h4>
        <div className="px-1">
          <Slider
            value={priceRange}
            onValueChange={(value) => onPriceRangeChange(value as [number, number])}
            min={0}
            max={maxPriceLimit}
            step={1}
            className="w-full"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="px-2 py-1 rounded bg-background border border-border text-xs font-mono text-[#ff6b00]">
              ${priceRange[0]}
            </div>
            <span className="text-[10px] text-muted-foreground">to</span>
            <div className="px-2 py-1 rounded bg-background border border-border text-xs font-mono text-[#ff6b00]">
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
