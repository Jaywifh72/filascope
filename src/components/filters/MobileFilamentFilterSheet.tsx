import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  X, 
  SlidersHorizontal, 
  Check, 
  ChevronDown, 
  Printer,
  Package,
  Atom,
  Layers,
  Settings2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { useNozzleConfig, NOZZLE_SIZES, NOZZLE_MATERIALS, NOZZLE_MATERIAL_LABELS, type NozzleSize, type NozzleMaterial } from "@/hooks/useNozzleConfig";
import { MATERIAL_CATEGORIES } from "@/lib/materialHierarchy";

// Material Base options
const MATERIAL_BASE_OPTIONS = [
  { id: "pla-family", label: "PLA" },
  { id: "petg-family", label: "PETG" },
  { id: "abs-family", label: "ABS" },
  { id: "asa-family", label: "ASA" },
  { id: "flexible", label: "TPU/Flex" },
  { id: "nylon-family", label: "Nylon/PA" },
  { id: "polycarbonate", label: "PC" },
  { id: "copolyester", label: "Copolyester" },
  { id: "high-performance", label: "High Perf" },
  { id: "bio-materials", label: "Bio-Based" },
];

// Quick materials (top 5)
const QUICK_MATERIALS = MATERIAL_BASE_OPTIONS.slice(0, 5);
const REMAINING_MATERIALS = MATERIAL_BASE_OPTIONS.slice(5);

// Verified Brands — id must match display_name used in brandNameMap
const VERIFIED_BRANDS = [
  { id: "Bambu Lab", label: "Bambu Lab" },
  { id: "Prusament", label: "Prusament" },
  { id: "Polymaker", label: "Polymaker" },
  { id: "Overture", label: "Overture" },
  { id: "eSun", label: "eSUN" },
];

// Reinforced Material options
const REINFORCED_OPTIONS = [
  { id: "carbon", label: "Carbon Fiber" },
  { id: "glass", label: "Glass Fiber" },
  { id: "wood", label: "Wood Filled" },
  { id: "metal", label: "Metal Filled" },
];

// Spool size options
const SPOOL_SIZES = [
  { id: "standard", label: "Standard (500g-1kg)" },
  { id: "large", label: "Large (>1kg-2kg)" },
  { id: "refill", label: "Refill (No spool)" },
];

// Sort options for mobile pills
const MOBILE_SORT_OPTIONS = [
  { value: "scoring-desc", label: "Score" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
  { value: "alpha-asc", label: "A-Z" },
];

function getSortLabel(sortBy: string): string {
  const opt = MOBILE_SORT_OPTIONS.find(o => o.value === sortBy);
  return opt?.label || "Sort";
}

interface MobileFilamentFilterSheetProps {
  selectedMaterials: string[];
  onMaterialChange: (material: string, checked: boolean) => void;
  selectedBrands: string[];
  onBrandChange: (brand: string, checked: boolean) => void;
  carbonFiber: boolean;
  onCarbonFiberChange: (checked: boolean) => void;
  glassFiber: boolean;
  onGlassFiberChange: (checked: boolean) => void;
  woodFilled: boolean;
  onWoodFilledChange: (checked: boolean) => void;
  spoolSize: string;
  onSpoolSizeChange: (size: string) => void;
  onClearAll: () => void;
  // New props
  sortBy?: string;
  onSortChange?: (value: string) => void;
  resultCount?: number;
}

export function MobileFilamentFilterSheet({
  selectedMaterials,
  onMaterialChange,
  selectedBrands,
  onBrandChange,
  carbonFiber,
  onCarbonFiberChange,
  glassFiber,
  onGlassFiberChange,
  woodFilled,
  onWoodFilledChange,
  spoolSize,
  onSpoolSizeChange,
  onClearAll,
  sortBy = "scoring-desc",
  onSortChange,
  resultCount,
}: MobileFilamentFilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isCountFlashing, setIsCountFlashing] = useState(false);
  const prevCountRef = useRef(resultCount);
  
  const { 
    selectedPrinter, 
    brands, 
    models, 
    selectedBrand,
    setSelectedBrand,
    selectedPrinterId,
    setSelectedPrinterId,
  } = usePrinterSelection();

  const nozzleConfig = useNozzleConfig(selectedPrinter?.stock_nozzle_diameter_mm);

  // Flash result count on change
  useEffect(() => {
    if (prevCountRef.current !== resultCount && prevCountRef.current !== undefined) {
      setIsCountFlashing(true);
      const timer = setTimeout(() => setIsCountFlashing(false), 400);
      prevCountRef.current = resultCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = resultCount;
  }, [resultCount]);

  // Check if a material category is active
  const isCategoryActive = useCallback((categoryId: string) => {
    const category = MATERIAL_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return selectedMaterials.includes(categoryId);
    return category.materials.some(m => selectedMaterials.includes(m));
  }, [selectedMaterials]);

  const activeCategoryCount = useMemo(() => {
    return MATERIAL_BASE_OPTIONS.filter(opt => isCategoryActive(opt.id)).length;
  }, [isCategoryActive]);

  // Auto-expand first section with active filters when sheet opens
  useEffect(() => {
    if (isOpen) {
      if (activeCategoryCount > 0) setExpandedSection('materials');
      else if (selectedBrands.length > 0) setExpandedSection('brands');
      else if (carbonFiber || glassFiber || woodFilled) setExpandedSection('reinforced');
      else if (spoolSize !== 'standard') setExpandedSection('spool');
      else setExpandedSection(null);
    }
  }, [isOpen, activeCategoryCount, selectedBrands.length, carbonFiber, glassFiber, woodFilled, spoolSize]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += activeCategoryCount;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (carbonFiber) count++;
    if (glassFiber) count++;
    if (woodFilled) count++;
    if (spoolSize !== "standard") count++;
    return count;
  }, [activeCategoryCount, selectedBrands, carbonFiber, glassFiber, woodFilled, spoolSize]);

  const localReinforced = [
    ...(carbonFiber ? ["carbon"] : []),
    ...(glassFiber ? ["glass"] : []),
    ...(woodFilled ? ["wood"] : []),
  ];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleReinforcedToggle = (id: string, checked: boolean) => {
    if (id === "carbon") onCarbonFiberChange(checked);
    if (id === "glass") onGlassFiberChange(checked);
    if (id === "wood") onWoodFilledChange(checked);
  };

  const handleApply = () => {
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      try { navigator.vibrate?.(10); } catch {}
    }
    setIsOpen(open);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button 
          data-mobile-filter-trigger
          variant="outline"
          className={cn(
            "lg:hidden gap-2 h-11 min-w-[44px] px-4 bg-gray-800/50",
            activeFilterCount > 0
              ? "border-primary/50 hover:border-primary"
              : "border-primary/30 hover:border-primary"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 font-semibold min-w-[20px] text-center">
              {activeFilterCount}
            </span>
          )}
          {onSortChange && (
            <span className="text-xs text-muted-foreground">· {getSortLabel(sortBy)}</span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent 
        side="bottom" 
        className="h-[85vh] p-0 bg-gray-900/98 border-t border-gray-700 rounded-t-2xl backdrop-blur-xl"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-gray-800 bg-gradient-to-b from-white/[0.03] to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <SheetTitle className="text-base font-semibold text-white">
                Filter & Sort
              </SheetTitle>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2.5 hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close filter panel"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <ScrollArea className="h-[calc(85vh-160px)]">
          <div className="space-y-0">

            {/* ===== SORT BY (top of sheet) ===== */}
            {onSortChange && (
              <div className="px-4 py-4 border-b border-gray-800/50">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">Sort By</div>
                <div className="flex gap-2.5 flex-wrap">
                  {MOBILE_SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onSortChange(opt.value);
                        try { navigator.vibrate?.(10); } catch {}
                      }}
                      className={cn(
                        "h-11 px-4 rounded-full text-sm font-medium transition-colors min-w-[44px]",
                        sortBy === opt.value
                          ? "bg-primary/15 text-primary border border-primary/40"
                          : "bg-gray-800/60 text-gray-300 border border-transparent hover:bg-gray-800"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ===== PRINTER COMPATIBILITY QUICK FILTER ===== */}
            {selectedPrinter && (
              <div className="px-4 py-3">
                <button
                  onClick={() => {
                    // Apply PLA + PETG as quick compatible materials
                    onMaterialChange("pla-family", true);
                    onMaterialChange("petg-family", true);
                    try { navigator.vibrate?.(10); } catch {}
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/15 transition-colors"
                >
                  <Printer className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-primary">Quick filter for your {selectedPrinter.model_name}</div>
                    <div className="text-xs text-muted-foreground">Show compatible filaments</div>
                  </div>
                  <Sparkles className="h-4 w-4 text-primary/60 ml-auto flex-shrink-0" />
                </button>
              </div>
            )}

            {/* ===== TOP TIER: QUICK MATERIALS ===== */}
            <div className="px-4 py-4 border-b border-gray-800/50">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">Materials</div>
              <div className="flex gap-2.5 flex-wrap">
                {QUICK_MATERIALS.map((material) => (
                  <button
                    key={material.id}
                    onClick={() => {
                      onMaterialChange(material.id, !isCategoryActive(material.id));
                      try { navigator.vibrate?.(10); } catch {}
                    }}
                    className={cn(
                      "h-11 px-4 rounded-full text-sm font-medium transition-colors min-w-[44px]",
                      isCategoryActive(material.id)
                        ? "bg-primary/15 text-primary border border-primary/40"
                        : "bg-gray-800/60 text-gray-300 border border-transparent hover:bg-gray-800"
                    )}
                  >
                    {material.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ===== TOP TIER: QUICK BRANDS ===== */}
            <div className="px-4 py-4 border-b border-gray-800/50">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">Brands</div>
              <div className="flex gap-2.5 flex-wrap">
                {VERIFIED_BRANDS.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => {
                      onBrandChange(brand.id, !selectedBrands.includes(brand.id));
                      try { navigator.vibrate?.(10); } catch {}
                    }}
                    className={cn(
                      "h-11 px-4 rounded-full text-sm font-medium transition-colors min-w-[44px]",
                      selectedBrands.includes(brand.id)
                        ? "bg-primary/15 text-primary border border-primary/40"
                        : "bg-gray-800/60 text-gray-300 border border-transparent hover:bg-gray-800"
                    )}
                  >
                    {brand.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ===== BOTTOM TIER: ADVANCED FILTERS ===== */}
            <div className="px-4 py-3">
              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors min-h-[44px] hover:bg-white/[0.02]"
              >
                <span className="text-sm font-medium text-white">Advanced Filters</span>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-500 transition-transform duration-200",
                  advancedOpen && "rotate-180"
                )} />
              </button>

              <div className={cn(
                "grid transition-all duration-200 ease-out",
                advancedOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}>
                <div className="overflow-hidden">
                  <div className="divide-y divide-gray-800/50 pt-2">

                    {/* Your Printer Section */}
                    <div className="py-3">
                      <button
                        onClick={() => toggleSection('printer')}
                        className={cn(
                          "w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors min-h-[44px]",
                          expandedSection === 'printer' && "bg-white/[0.02]"
                        )}
                        aria-expanded={expandedSection === 'printer'}
                      >
                        <div className="flex items-center gap-2.5">
                          <Printer className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-white">Your Printer</span>
                          {selectedPrinter && (
                            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              {selectedPrinter.model_name}
                            </span>
                          )}
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 text-gray-500 transition-transform duration-200",
                          expandedSection === 'printer' && "rotate-180"
                        )} />
                      </button>
                      <div className={cn(
                        "grid transition-all duration-200 ease-out",
                        expandedSection === 'printer' ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      )}>
                        <div className="overflow-hidden">
                          <div className="mt-3 space-y-3 px-1">
                            <Select
                              value={selectedBrand || ""}
                              onValueChange={(val) => {
                                setSelectedBrand(val);
                                setSelectedPrinterId("");
                              }}
                            >
                              <SelectTrigger className="w-full h-11 bg-gray-800 border-gray-700 text-white text-sm">
                                <SelectValue placeholder="Select brand..." />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700 z-[100]">
                                {brands?.map((brand) => (
                                  <SelectItem key={brand.id} value={brand.brand} className="text-sm text-white hover:bg-gray-700 min-h-[44px]">
                                    {brand.brand}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {selectedBrand && (
                              <Select
                                value={selectedPrinterId || ""}
                                onValueChange={setSelectedPrinterId}
                              >
                                <SelectTrigger className="w-full h-11 bg-gray-800 border-gray-700 text-white text-sm">
                                  <SelectValue placeholder="Select model..." />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 z-[100]">
                                  {models?.map((model) => (
                                    <SelectItem key={model.printer_id} value={model.printer_id} className="text-sm text-white hover:bg-gray-700 min-h-[44px]">
                                      {model.model_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}

                            {selectedPrinter && (
                              <div className="grid grid-cols-3 gap-2 pt-2">
                                <div className="text-center p-2 rounded-lg bg-gray-800/50">
                                  <div className="text-xs text-gray-500">Nozzle</div>
                                  <div className="text-sm font-medium text-white">{nozzleConfig.size}mm</div>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-gray-800/50">
                                  <div className="text-xs text-gray-500">Max Temp</div>
                                  <div className="text-sm font-medium text-white">{selectedPrinter.max_nozzle_temp_c || '--'}°C</div>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-gray-800/50">
                                  <div className="text-xs text-gray-500">Speed</div>
                                  <div className="text-sm font-medium text-white">{selectedPrinter.max_print_speed_mms || '--'}mm/s</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Remaining Materials */}
                    {REMAINING_MATERIALS.length > 0 && (
                      <div className="py-3">
                        <button
                          onClick={() => toggleSection('materials')}
                          className={cn(
                            "w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors min-h-[44px]",
                            expandedSection === 'materials' && "bg-white/[0.02]"
                          )}
                          aria-expanded={expandedSection === 'materials'}
                        >
                          <div className="flex items-center gap-2">
                            <Atom className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-white">More Materials</span>
                          </div>
                          <ChevronDown className={cn(
                            "h-4 w-4 text-gray-500 transition-transform duration-200",
                            expandedSection === 'materials' && "rotate-180"
                          )} />
                        </button>
                        <div className={cn(
                          "grid transition-all duration-200 ease-out",
                          expandedSection === 'materials' ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        )}>
                          <div className="overflow-hidden">
                            <div className="mt-3 grid grid-cols-2 gap-2.5 px-1">
                              {REMAINING_MATERIALS.map((material) => (
                                <label
                                  key={material.id}
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors min-h-[44px]",
                                    isCategoryActive(material.id)
                                      ? "bg-primary/10 border border-primary/30"
                                      : "bg-gray-800/50 border border-transparent hover:bg-gray-800"
                                  )}
                                >
                                  <Checkbox
                                    checked={isCategoryActive(material.id)}
                                    onCheckedChange={(checked) => onMaterialChange(material.id, !!checked)}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5"
                                  />
                                  <span className={cn(
                                    "text-sm",
                                    isCategoryActive(material.id) ? "text-primary font-medium" : "text-gray-300"
                                  )}>{material.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reinforcements Section */}
                    <div className="py-3">
                      <button
                        onClick={() => toggleSection('reinforced')}
                        className={cn(
                          "w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors min-h-[44px]",
                          expandedSection === 'reinforced' && "bg-white/[0.02]"
                        )}
                        aria-expanded={expandedSection === 'reinforced'}
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-white">Reinforcements</span>
                          {localReinforced.length > 0 && (
                            <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">
                              {localReinforced.length}
                            </span>
                          )}
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 text-gray-500 transition-transform duration-200",
                          expandedSection === 'reinforced' && "rotate-180"
                        )} />
                      </button>
                      <div className={cn(
                        "grid transition-all duration-200 ease-out",
                        expandedSection === 'reinforced' ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      )}>
                        <div className="overflow-hidden">
                          <div className="mt-3 grid grid-cols-2 gap-2.5 px-1">
                            {REINFORCED_OPTIONS.map((option) => (
                              <label
                                key={option.id}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors min-h-[44px]",
                                  localReinforced.includes(option.id)
                                    ? "bg-primary/10 border border-primary/30"
                                    : "bg-gray-800/50 border border-transparent hover:bg-gray-800"
                                )}
                              >
                                <Checkbox
                                  checked={localReinforced.includes(option.id)}
                                  onCheckedChange={(checked) => handleReinforcedToggle(option.id, !!checked)}
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5"
                                />
                                <span className={cn(
                                  "text-sm",
                                  localReinforced.includes(option.id) ? "text-primary font-medium" : "text-gray-300"
                                )}>{option.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Spool Size Section */}
                    <div className="py-3">
                      <button
                        onClick={() => toggleSection('spool')}
                        className={cn(
                          "w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors min-h-[44px]",
                          expandedSection === 'spool' && "bg-white/[0.02]"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Settings2 className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-white">Spool Size</span>
                          {spoolSize !== "standard" && (
                            <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">
                              1
                            </span>
                          )}
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 text-gray-500 transition-transform duration-200",
                          expandedSection === 'spool' && "rotate-180"
                        )} />
                      </button>
                      <div className={cn(
                        "grid transition-all duration-200 ease-out",
                        expandedSection === 'spool' ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      )}>
                        <div className="overflow-hidden">
                          <div className="mt-3 space-y-2 px-1">
                            {SPOOL_SIZES.map((size) => (
                              <button
                                key={size.id}
                                onClick={() => onSpoolSizeChange(size.id)}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors min-h-[44px]",
                                  spoolSize === size.id
                                    ? "bg-primary/10 text-primary font-medium border border-primary/30"
                                    : "text-gray-300 bg-gray-800/50 hover:bg-gray-800"
                                )}
                              >
                                <span>{size.label}</span>
                                {spoolSize === size.id && <Check className="h-4 w-4 text-primary" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* Sticky Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-900/98 backdrop-blur-sm flex gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {activeFilterCount > 0 && (
            <Button 
              variant="outline" 
              onClick={onClearAll}
              className="flex-1 h-12 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              Clear All
            </Button>
          )}
          <Button 
            onClick={handleApply}
            className="flex-1 h-12"
          >
            {resultCount !== undefined ? (
              <span className={cn(isCountFlashing && "filter-count-flash")}>
                Show {resultCount.toLocaleString()} results
              </span>
            ) : (
              <>Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
