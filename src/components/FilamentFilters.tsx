import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SlidersHorizontal, X, Zap, Sparkles, Atom, Sun, Package, Recycle, ChevronDown, ChevronRight, Layers, Scale } from "lucide-react";
import { MATERIAL_CATEGORIES, getMaterialsInCategory } from "@/lib/materialHierarchy";

interface FilterPreset {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  filters: {
    materials?: string[];
    materialCategories?: string[];
    highSpeed?: boolean;
    matte?: boolean;
    carbonFiber?: boolean;
    glassFiber?: boolean;
    woodFilled?: boolean;
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
  
  // Material category filters
  selectedCategories?: string[];
  onCategoryChange?: (categoryId: string, checked: boolean) => void;
  
  // Special properties
  highSpeed: boolean;
  onHighSpeedChange: (checked: boolean) => void;
  matte: boolean;
  onMatteChange: (checked: boolean) => void;
  carbonFiber: boolean;
  onCarbonFiberChange: (checked: boolean) => void;
  glassFiber: boolean;
  onGlassFiberChange: (checked: boolean) => void;
  woodFilled: boolean;
  onWoodFilledChange: (checked: boolean) => void;
  glow: boolean;
  onGlowChange: (checked: boolean) => void;
  
  // Spool type
  plasticSpool: boolean;
  onPlasticSpoolChange: (checked: boolean) => void;
  cardboardSpool: boolean;
  onCardboardSpoolChange: (checked: boolean) => void;
  
  // Pack quantity
  singleSpool: boolean;
  onSingleSpoolChange: (checked: boolean) => void;
  multiPack: boolean;
  onMultiPackChange: (checked: boolean) => void;
  
  // Large spools (>1kg)
  largeSpools: boolean;
  onLargeSpoolsChange: (checked: boolean) => void;
  
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


// Show top categories prominently, rest in expandable section
const PRIMARY_CATEGORIES = ["pla-family", "petg-family", "abs-family", "asa-family", "flexible", "nylon-family", "polycarbonate"];
const SECONDARY_CATEGORIES = MATERIAL_CATEGORIES.filter(c => !PRIMARY_CATEGORIES.includes(c.id)).map(c => c.id);

const FilterContent = ({
  selectedMaterials,
  onMaterialChange,
  selectedCategories = [],
  onCategoryChange,
  highSpeed,
  onHighSpeedChange,
  matte,
  onMatteChange,
  carbonFiber,
  onCarbonFiberChange,
  glassFiber,
  onGlassFiberChange,
  woodFilled,
  onWoodFilledChange,
  glow,
  onGlowChange,
  plasticSpool,
  onPlasticSpoolChange,
  cardboardSpool,
  onCardboardSpoolChange,
  singleSpool,
  onSingleSpoolChange,
  multiPack,
  onMultiPackChange,
  largeSpools,
  onLargeSpoolsChange,
  priceRange,
  onPriceRangeChange,
  maxPriceLimit,
  filterCounts,
  onReset,
  activeFilterCount,
  onApplyPreset,
}: FilamentFiltersProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [fullyExpandedCategories, setFullyExpandedCategories] = useState<string[]>([]);

  const handlePresetClick = (preset: FilterPreset) => {
    if (onApplyPreset) {
      onApplyPreset(preset);
    }
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (onCategoryChange) {
      onCategoryChange(categoryId, checked);
    } else {
      // Fallback: toggle all materials in the category
      const materials = getMaterialsInCategory(categoryId);
      materials.forEach(material => {
        onMaterialChange(material, checked);
      });
    }
  };

  const isCategorySelected = (categoryId: string): boolean => {
    if (selectedCategories.includes(categoryId)) return true;
    // Check if any materials from this category are selected
    const materials = getMaterialsInCategory(categoryId);
    return materials.some(m => selectedMaterials.includes(m));
  };

  const isCategoryPartiallySelected = (categoryId: string): boolean => {
    const materials = getMaterialsInCategory(categoryId);
    const selectedCount = materials.filter(m => selectedMaterials.includes(m)).length;
    return selectedCount > 0 && selectedCount < materials.length;
  };

  const getCategoryCount = (categoryId: string): number => {
    if (!filterCounts) return 0;
    const materials = getMaterialsInCategory(categoryId);
    return materials.reduce((sum, m) => sum + (filterCounts[`material_${m}`] || 0), 0);
  };

  const renderCategoryItem = (categoryId: string) => {
    const category = MATERIAL_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return null;

    const isExpanded = expandedCategories.includes(categoryId);
    const isSelected = isCategorySelected(categoryId);
    const isPartial = isCategoryPartiallySelected(categoryId);
    const count = getCategoryCount(categoryId);

    return (
      <Collapsible key={categoryId} open={isExpanded} onOpenChange={() => toggleCategoryExpanded(categoryId)}>
        <div className="rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all">
          <div className="flex items-center gap-2 py-1.5 px-2">
            <Checkbox
              checked={isSelected && !isPartial}
              ref={(el) => {
                if (el && isPartial) {
                  (el as HTMLButtonElement).dataset.state = 'indeterminate';
                }
              }}
              onCheckedChange={(checked) => handleCategoryToggle(categoryId, checked as boolean)}
              className="border-muted-foreground/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 data-[state=indeterminate]:bg-cyan-500/50 data-[state=indeterminate]:border-cyan-500/50 h-3.5 w-3.5"
            />
            <CollapsibleTrigger asChild>
              <button className="flex-1 flex items-center gap-1.5 text-left group cursor-pointer">
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                )}
                <span className="text-xs font-medium text-foreground group-hover:text-cyan-400 transition-colors">
                  {category.name}
                </span>
              </button>
            </CollapsibleTrigger>
            {count > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-muted/50">
                {count}
              </Badge>
            )}
          </div>
          <CollapsibleContent>
            <div className="pl-7 pb-2 space-y-0.5">
              <p className="text-[10px] text-muted-foreground mb-1.5 pr-2">{category.description}</p>
              {(fullyExpandedCategories.includes(categoryId) ? category.materials : category.materials.slice(0, 8)).map((material) => (
                <label
                  key={material}
                  className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted/30 cursor-pointer group"
                >
                  <Checkbox
                    checked={selectedMaterials.includes(material)}
                    onCheckedChange={(checked) => onMaterialChange(material, checked as boolean)}
                    className="border-muted-foreground/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 h-3 w-3"
                  />
                  <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                    {material}
                  </span>
                  {filterCounts && filterCounts[`material_${material}`] > 0 && (
                    <span className="text-[10px] text-slate-500 font-mono ml-auto">
                      ({filterCounts[`material_${material}`]})
                    </span>
                  )}
                </label>
              ))}
              {category.materials.length > 8 && !fullyExpandedCategories.includes(categoryId) && (
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-[10px] text-muted-foreground">
                    +{category.materials.length - 8} more
                  </span>
                  <button
                    onClick={() => setFullyExpandedCategories(prev => [...prev, categoryId])}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    View all
                  </button>
                </div>
              )}
              {category.materials.length > 8 && fullyExpandedCategories.includes(categoryId) && (
                <button
                  onClick={() => setFullyExpandedCategories(prev => prev.filter(id => id !== categoryId))}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors pl-2"
                >
                  Show less
                </button>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
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

      {/* Material Categories */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Layers className="w-3 h-3" />
          Material Family
        </h4>
        <div className="space-y-1">
          {PRIMARY_CATEGORIES.map(renderCategoryItem)}
          
          {/* More Categories */}
          <Collapsible open={showMoreCategories} onOpenChange={setShowMoreCategories}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md bg-background/30 hover:bg-background/50 transition-all cursor-pointer group text-left">
                {showMoreCategories ? (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  {showMoreCategories ? 'Show Less' : `More Categories (${SECONDARY_CATEGORIES.length})`}
                </span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {SECONDARY_CATEGORIES.map(renderCategoryItem)}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Special Properties */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Special Properties
        </h4>
        <div className="grid grid-cols-2 gap-1">
          <label className="flex items-center gap-1.5 py-1 px-1.5 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <Switch
              checked={highSpeed}
              onCheckedChange={onHighSpeedChange}
              className="data-[state=checked]:bg-cyan-500 scale-[0.6]"
            />
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-foreground group-hover:text-cyan-400 transition-colors">High Speed</span>
          </label>
          
          <label className="flex items-center gap-1.5 py-1 px-1.5 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <Switch
              checked={matte}
              onCheckedChange={onMatteChange}
              className="data-[state=checked]:bg-cyan-500 scale-[0.6]"
            />
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-muted to-muted-foreground/50" />
            <span className="text-[10px] text-foreground group-hover:text-cyan-400 transition-colors">Matte</span>
          </label>
          
          <label className="flex items-center gap-1.5 py-1 px-1.5 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <Switch
              checked={carbonFiber}
              onCheckedChange={onCarbonFiberChange}
              className="data-[state=checked]:bg-cyan-500 scale-[0.6]"
            />
            <Atom className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-foreground group-hover:text-cyan-400 transition-colors">Carbon</span>
          </label>
          
          <label className="flex items-center gap-1.5 py-1 px-1.5 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <Switch
              checked={glassFiber}
              onCheckedChange={onGlassFiberChange}
              className="data-[state=checked]:bg-cyan-500 scale-[0.6]"
            />
            <Layers className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] text-foreground group-hover:text-cyan-400 transition-colors">Glass</span>
          </label>
          
          <label className="flex items-center gap-1.5 py-1 px-1.5 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <Switch
              checked={woodFilled}
              onCheckedChange={onWoodFilledChange}
              className="data-[state=checked]:bg-cyan-500 scale-[0.6]"
            />
            <span className="text-xs">🪵</span>
            <span className="text-[10px] text-foreground group-hover:text-cyan-400 transition-colors">Wood</span>
          </label>
          
          <label className="flex items-center gap-1.5 py-1 px-1.5 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <Switch
              checked={glow}
              onCheckedChange={onGlowChange}
              className="data-[state=checked]:bg-cyan-500 scale-[0.6]"
            />
            <Sun className="w-3 h-3 text-green-400" />
            <span className="text-[10px] text-foreground group-hover:text-cyan-400 transition-colors">Glow</span>
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

      {/* Pack Quantity */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          📦 Pack Size
        </h4>
        <div className="space-y-0.5">
          <label className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <Checkbox
              checked={singleSpool}
              onCheckedChange={(checked) => onSingleSpoolChange(checked as boolean)}
              className="border-muted-foreground/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 h-3.5 w-3.5"
            />
            <span className="text-xs text-foreground group-hover:text-cyan-400 transition-colors">Single Spool</span>
            {filterCounts && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-muted/50 ml-auto">
                {filterCounts['pack_single'] || 0}
              </Badge>
            )}
          </label>
          
          <label className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <Checkbox
              checked={multiPack}
              onCheckedChange={(checked) => onMultiPackChange(checked as boolean)}
              className="border-muted-foreground/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 h-3.5 w-3.5"
            />
            <span className="text-xs text-foreground group-hover:text-cyan-400 transition-colors">Multi-Pack (2+)</span>
            {filterCounts && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-muted/50 ml-auto">
                {filterCounts['pack_multi'] || 0}
              </Badge>
            )}
          </label>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Spool Weight */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Scale className="w-3 h-3" />
          Spool Weight
        </h4>
        <div className="space-y-0.5">
          <label className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-background/50 hover:bg-background/80 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer group">
            <Checkbox
              checked={largeSpools}
              onCheckedChange={(checked) => onLargeSpoolsChange(checked as boolean)}
              className="border-muted-foreground/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 h-3.5 w-3.5"
            />
            <span className="text-xs text-foreground group-hover:text-cyan-400 transition-colors">Include Large Spools (&gt;1kg)</span>
            {filterCounts && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-muted/50 ml-auto">
                {filterCounts['large_spools'] || 0}
              </Badge>
            )}
          </label>
          <p className="text-[10px] text-muted-foreground pl-7">By default, only 1kg and smaller spools are shown</p>
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
