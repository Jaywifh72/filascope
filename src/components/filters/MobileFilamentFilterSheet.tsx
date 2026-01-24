import { useState, useMemo } from "react";
import { 
  X, 
  SlidersHorizontal, 
  Check, 
  ChevronDown, 
  Printer,
  Package,
  Atom,
  Layers,
  Settings2
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

// Verified Brands
const VERIFIED_BRANDS = [
  { id: "bambu", label: "Bambu Lab" },
  { id: "prusa", label: "Prusament" },
  { id: "polymaker", label: "Polymaker" },
  { id: "overture", label: "Overture" },
  { id: "esun", label: "eSUN" },
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
}: MobileFilamentFilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("printer");
  
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

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedMaterials.length > 0) count += selectedMaterials.length;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (carbonFiber) count++;
    if (glassFiber) count++;
    if (woodFilled) count++;
    if (spoolSize !== "standard") count++;
    if (selectedPrinterId) count++;
    return count;
  }, [selectedMaterials, selectedBrands, carbonFiber, glassFiber, woodFilled, spoolSize, selectedPrinterId]);

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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="lg:hidden gap-2 h-11 min-w-[44px] px-4 border-primary/30 hover:border-primary bg-gray-800/50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 font-semibold min-w-[20px] text-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent 
        side="bottom" 
        className="h-[85vh] p-0 bg-gray-900/98 border-t border-gray-700 rounded-t-2xl backdrop-blur-xl"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b border-gray-800 bg-gradient-to-b from-white/[0.03] to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <SheetTitle className="text-base font-semibold text-white">
                Filter Materials
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
        <ScrollArea className="h-[calc(85vh-140px)]">
          <div className="divide-y divide-gray-800/50">
            
            {/* Your Printer Section - Condensed */}
            <div className="px-4 py-3">
              <button
                onClick={() => toggleSection('printer')}
                className={cn(
                  "w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors min-h-[44px]",
                  expandedSection === 'printer' && "bg-white/[0.02]"
                )}
                aria-expanded={expandedSection === 'printer'}
                aria-controls="printer-section-content"
              >
                <div className="flex items-center gap-2.5">
                  <Printer className="h-4 w-4 text-primary" aria-hidden="true" />
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
                )} aria-hidden="true" />
              </button>
              {expandedSection === 'printer' && (
                <div id="printer-section-content" className="mt-3 space-y-3 px-1">
                  <Select
                    value={selectedBrand || ""}
                    onValueChange={(val) => {
                      setSelectedBrand(val);
                      setSelectedPrinterId("");
                    }}
                  >
                    <SelectTrigger className="w-full h-11 bg-gray-800 border-gray-700 text-white text-sm" aria-label="Select printer brand">
                      <SelectValue placeholder="Select brand..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 z-[100]">
                      {brands?.map((brand) => (
                        <SelectItem 
                          key={brand.id} 
                          value={brand.brand} 
                          className="text-sm text-white hover:bg-gray-700 min-h-[44px]"
                        >
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
                      <SelectTrigger className="w-full h-11 bg-gray-800 border-gray-700 text-white text-sm" aria-label="Select printer model">
                        <SelectValue placeholder="Select model..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 z-[100]">
                        {models?.map((model) => (
                          <SelectItem 
                            key={model.printer_id} 
                            value={model.printer_id} 
                            className="text-sm text-white hover:bg-gray-700 min-h-[44px]"
                          >
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
              )}
            </div>

            {/* Material Types Section */}
            <div className="px-4 py-3">
              <button
                onClick={() => toggleSection('materials')}
                className={cn(
                  "w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors min-h-[44px]",
                  expandedSection === 'materials' && "bg-white/[0.02]"
                )}
                aria-expanded={expandedSection === 'materials'}
                aria-controls="materials-section-content"
              >
                <div className="flex items-center gap-2">
                  <Atom className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium text-white">Material Types</span>
                  {selectedMaterials.length > 0 && (
                    <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">
                      {selectedMaterials.length}
                    </span>
                  )}
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-500 transition-transform duration-200",
                  expandedSection === 'materials' && "rotate-180"
                )} aria-hidden="true" />
              </button>
              {expandedSection === 'materials' && (
                <div id="materials-section-content" className="mt-3 grid grid-cols-2 gap-2 px-1">
                  {MATERIAL_BASE_OPTIONS.map((material) => (
                    <label
                      key={material.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors min-h-[44px]",
                        selectedMaterials.includes(material.id)
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-gray-800/50 border border-transparent hover:bg-gray-800"
                      )}
                    >
                      <Checkbox
                        checked={selectedMaterials.includes(material.id)}
                        onCheckedChange={(checked) => onMaterialChange(material.id, !!checked)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5"
                      />
                      <span className={cn(
                        "text-sm",
                        selectedMaterials.includes(material.id) ? "text-primary font-medium" : "text-gray-300"
                      )}>{material.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Preferred Brands Section */}
            <div className="px-4 py-3">
              <button
                onClick={() => toggleSection('brands')}
                className={cn(
                  "w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors min-h-[44px]",
                  expandedSection === 'brands' && "bg-white/[0.02]"
                )}
                aria-expanded={expandedSection === 'brands'}
                aria-controls="brands-section-content"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium text-white">Preferred Brands</span>
                  {selectedBrands.length > 0 && (
                    <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">
                      {selectedBrands.length}
                    </span>
                  )}
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-500 transition-transform duration-200",
                  expandedSection === 'brands' && "rotate-180"
                )} aria-hidden="true" />
              </button>
              {expandedSection === 'brands' && (
                <div id="brands-section-content" className="mt-3 space-y-2 px-1">
                  {VERIFIED_BRANDS.map((brand) => (
                    <label
                      key={brand.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors min-h-[44px]",
                        selectedBrands.includes(brand.id)
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-gray-800/50 border border-transparent hover:bg-gray-800"
                      )}
                    >
                      <Checkbox
                        checked={selectedBrands.includes(brand.id)}
                        onCheckedChange={(checked) => onBrandChange(brand.id, !!checked)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5"
                      />
                      <span className={cn(
                        "text-sm",
                        selectedBrands.includes(brand.id) ? "text-primary font-medium" : "text-gray-300"
                      )}>{brand.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Reinforcements Section */}
            <div className="px-4 py-3">
              <button
                onClick={() => toggleSection('reinforced')}
                className={cn(
                  "w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors min-h-[44px]",
                  expandedSection === 'reinforced' && "bg-white/[0.02]"
                )}
                aria-expanded={expandedSection === 'reinforced'}
                aria-controls="reinforced-section-content"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
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
                )} aria-hidden="true" />
              </button>
              {expandedSection === 'reinforced' && (
                <div id="reinforced-section-content" className="mt-3 grid grid-cols-2 gap-2 px-1">
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
              )}
            </div>

            {/* Spool Size Section */}
            <div className="px-4 py-3">
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
              {expandedSection === 'spool' && (
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
              )}
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
            Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
