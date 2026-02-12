import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { 
  Thermometer, 
  Circle, 
  Zap, 
  Wind, 
  Gauge, 
  Printer,
  ChevronDown,
  Package,
  Atom,
  Layers,
  CheckCircle2,
  Settings2,
  Droplets,
  X,
  Palette,
  Info,
  Eye,
  Plus,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { FeatureHelpIcon } from "@/components/onboarding";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { useNozzleConfig, NOZZLE_SIZES, FLOW_TYPES, NOZZLE_MATERIALS, FLOW_TYPE_LABELS, NOZZLE_MATERIAL_LABELS, type NozzleSize, type FlowType, type NozzleMaterial } from "@/hooks/useNozzleConfig";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { COLOR_FAMILIES } from "@/lib/colorMatchUtils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { isValidHexColor } from "@/lib/utils";

// Material Base options - using category IDs that match MATERIAL_CATEGORIES
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
  { id: "carbon", label: "Carbon" },
  { id: "glass", label: "Glass" },
  { id: "wood", label: "Wood" },
  { id: "metal", label: "Metal" },
];

// Spool size options
const SPOOL_SIZES = [
  { id: "standard", label: "Standard", description: "500g-1kg" },
  { id: "large", label: "Large", description: ">1kg-2kg" },
  { id: "refill", label: "Refill", description: "No spool" },
];

interface TechnicalConsoleSidebarProps {
  selectedMaterials?: string[];
  onMaterialChange?: (material: string, checked: boolean) => void;
  selectedBrands?: string[];
  onBrandChange?: (brand: string, checked: boolean) => void;
  carbonFiber?: boolean;
  onCarbonFiberChange?: (checked: boolean) => void;
  glassFiber?: boolean;
  onGlassFiberChange?: (checked: boolean) => void;
  woodFilled?: boolean;
  onWoodFilledChange?: (checked: boolean) => void;
  spoolSize?: string;
  onSpoolSizeChange?: (size: string) => void;
  onClearAll?: () => void;
  showCostPerPrint?: boolean;
  onShowCostPerPrintChange?: (checked: boolean) => void;
  /** Material category counts from server, keyed by category id (e.g. "pla-family" -> 547) */
  materialCategoryCounts?: Record<string, number>;
}

export function TechnicalConsoleSidebar({
  selectedMaterials = [],
  onMaterialChange,
  selectedBrands = [],
  onBrandChange,
  carbonFiber = false,
  onCarbonFiberChange,
  glassFiber = false,
  onGlassFiberChange,
  woodFilled = false,
  onWoodFilledChange,
  spoolSize = "standard",
  onSpoolSizeChange,
  onClearAll,
  showCostPerPrint = false,
  onShowCostPerPrintChange,
  materialCategoryCounts,
}: TechnicalConsoleSidebarProps) {
  const { 
    selectedPrinter, 
    brands, 
    models, 
    selectedBrand,
    setSelectedBrand,
    selectedPrinterId,
    setSelectedPrinterId,
    printerLoading,
    brandsLoading,
    modelsLoading,
  } = usePrinterSelection();

  // Nozzle configuration
  const nozzleConfig = useNozzleConfig(selectedPrinter?.stock_nozzle_diameter_mm);

  const [localSpoolSize, setLocalSpoolSize] = useState(spoolSize);
  const [localMaterials, setLocalMaterials] = useState<string[]>(selectedMaterials);
  const [localBrands, setLocalBrands] = useState<string[]>(selectedBrands);
  const [localReinforced, setLocalReinforced] = useState<string[]>([
    ...(carbonFiber ? ["carbon"] : []),
    ...(glassFiber ? ["glass"] : []),
    ...(woodFilled ? ["wood"] : []),
  ]);

  // Collapsible section states - all expanded by default
  const [specsOpen, setSpecsOpen] = useState(false);
  const [spoolOpen, setSpoolOpen] = useState(true);
  const [materialsOpen, setMaterialsOpen] = useState(true);
  const [brandsOpen, setBrandsOpen] = useState(true);
  const [reinforcedOpen, setReinforcedOpen] = useState(true);
  const [colorOpen, setColorOpen] = useState(false);
  const [customHexInput, setCustomHexInput] = useState('');

  const navigate = useNavigate();

  // Calculate active filter count — exclude default states and auto-detected printer
  const activeFilterCount = useMemo(() => {
    let count = 0;
    const userMaterials = localMaterials.filter(m => m !== "All");
    if (userMaterials.length > 0) count += userMaterials.length;
    if (localBrands.length > 0) count += localBrands.length;
    if (localReinforced.length > 0) count += localReinforced.length;
    if (localSpoolSize !== "standard") count += 1;
    // Don't count auto-detected printer — only count if user explicitly selected
    return count;
  }, [localMaterials, localBrands, localReinforced, localSpoolSize]);

  // Printer specs
  const specs = {
    nozzleDia: nozzleConfig.size,
    nozzleTemp: selectedPrinter?.max_nozzle_temp_c ?? null,
    bedTemp: selectedPrinter?.bed_max_temp_c ?? null,
    printSpeed: selectedPrinter?.max_print_speed_mms ?? null,
    acceleration: selectedPrinter?.max_acceleration_xy_mmss ?? null,
    flowRate: selectedPrinter?.max_flow_rate_mm3s ?? null,
  };

  const formatAcceleration = (val: number | null) => {
    if (val === null) return "--";
    return val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`;
  };

  const handleMaterialToggle = (id: string) => {
    const newMaterials = localMaterials.includes(id)
      ? localMaterials.filter(m => m !== id)
      : [...localMaterials, id];
    setLocalMaterials(newMaterials);
    if (onMaterialChange) {
      onMaterialChange(id, !localMaterials.includes(id));
    }
  };

  const handleBrandToggle = (id: string) => {
    const newBrands = localBrands.includes(id)
      ? localBrands.filter(b => b !== id)
      : [...localBrands, id];
    setLocalBrands(newBrands);
    if (onBrandChange) {
      onBrandChange(id, !localBrands.includes(id));
    }
  };

  const handleReinforcedToggle = (id: string) => {
    const newReinforced = localReinforced.includes(id)
      ? localReinforced.filter(r => r !== id)
      : [...localReinforced, id];
    setLocalReinforced(newReinforced);

    if (id === "carbon" && onCarbonFiberChange) {
      onCarbonFiberChange(!localReinforced.includes(id));
    }
    if (id === "glass" && onGlassFiberChange) {
      onGlassFiberChange(!localReinforced.includes(id));
    }
    if (id === "wood" && onWoodFilledChange) {
      onWoodFilledChange(!localReinforced.includes(id));
    }
  };

  const handleSpoolSizeChange = (size: string) => {
    setLocalSpoolSize(size);
    if (onSpoolSizeChange) {
      onSpoolSizeChange(size);
    }
  };

  const handleClearAllFilters = () => {
    // Use parent's clear all if provided (includes search term reset)
    if (onClearAll) {
      onClearAll();
      // Also reset local state
      setLocalMaterials([]);
      setLocalBrands([]);
      setLocalReinforced([]);
      setLocalSpoolSize("standard");
      return;
    }
    
    // Fallback: Clear materials
    localMaterials.forEach(m => {
      if (onMaterialChange) onMaterialChange(m, false);
    });
    setLocalMaterials([]);

    // Clear brands
    localBrands.forEach(b => {
      if (onBrandChange) onBrandChange(b, false);
    });
    setLocalBrands([]);

    // Clear reinforced
    localReinforced.forEach(r => {
      if (r === "carbon" && onCarbonFiberChange) onCarbonFiberChange(false);
      if (r === "glass" && onGlassFiberChange) onGlassFiberChange(false);
      if (r === "wood" && onWoodFilledChange) onWoodFilledChange(false);
    });
    setLocalReinforced([]);

    // Reset spool size
    setLocalSpoolSize("standard");
    if (onSpoolSizeChange) onSpoolSizeChange("standard");
  };

  return (
    <aside 
      data-tour="printer-filter"
      className="hidden lg:flex flex-col w-[345px] shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border bg-card"
    >
      {/* Your Printer Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
              <Printer className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                Your Printer
              </span>
              <span className="text-xs text-muted-foreground">
                Personalized Results
              </span>
              <span className="text-xs text-slate-500">
                Only showing filaments your printer can handle
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer transition-colors"
              >
                Clear All
              </button>
            )}
            {/* Filter count badge */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-xs font-medium text-primary">
                  {activeFilterCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printer Selection */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="space-y-2">
          <Select
            value={selectedBrand || ""}
            onValueChange={(val) => {
              setSelectedBrand(val);
              setSelectedPrinterId("");
            }}
          >
            <SelectTrigger className="w-full h-9 bg-muted border-border text-foreground text-sm hover:border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary/50">
              <SelectValue placeholder="Select brand..." />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {brands?.map((brand) => (
                <SelectItem key={brand.id} value={brand.brand} className="text-sm text-popover-foreground hover:bg-accent">
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
              <SelectTrigger className="w-full h-9 bg-muted border-border text-foreground text-sm hover:border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary/50">
                <SelectValue placeholder="Select model..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {models?.map((model) => (
                  <SelectItem key={model.printer_id} value={model.printer_id} className="text-sm text-popover-foreground hover:bg-accent">
                    {model.model_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Print Specs - Collapsible */}
      <Collapsible open={specsOpen} onOpenChange={setSpecsOpen}>
        <div className="border-b border-border">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
            <TooltipProvider>
              <div className="flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Your Printer Capabilities
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs max-w-[220px]">
                    These are your printer's maximum capabilities. Filaments are filtered to those compatible with these specs.
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              specsOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4">
              {/* Nozzle Setup Row */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Droplets className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Nozzle Setup</span>
                  <FeatureHelpIcon feature="nozzle_material" side="right" />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {/* Nozzle Size Dropdown */}
                  <Select
                    value={String(nozzleConfig.size)}
                    onValueChange={(val) => nozzleConfig.setSize(Number(val) as NozzleSize)}
                  >
                    <SelectTrigger className="h-8 bg-muted border-border text-foreground text-xs hover:border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      {NOZZLE_SIZES.map((size) => (
                        <SelectItem key={size} value={String(size)} className="text-xs text-popover-foreground hover:bg-accent">
                          {size}mm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Flow Type Dropdown */}
                  <Select
                    value={nozzleConfig.flowType}
                    onValueChange={(val) => nozzleConfig.setFlowType(val as FlowType)}
                  >
                    <SelectTrigger className="h-8 bg-muted border-border text-foreground text-xs hover:border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      {FLOW_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="text-xs text-popover-foreground hover:bg-accent">
                          {FLOW_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Nozzle Material Dropdown */}
                  <Select
                    value={nozzleConfig.material}
                    onValueChange={(val) => nozzleConfig.setMaterial(val as NozzleMaterial)}
                  >
                    <SelectTrigger className="h-8 bg-muted border-border text-foreground text-xs hover:border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      {NOZZLE_MATERIALS.map((mat) => (
                        <SelectItem key={mat} value={mat} className="text-xs text-popover-foreground hover:bg-accent">
                          {NOZZLE_MATERIAL_LABELS[mat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Nozzle material warning for abrasives */}
                {nozzleConfig.material === "brass" && (
                  <p className="text-[10px] text-amber-400/80 leading-tight">
                    ⚠️ Brass nozzles wear quickly with abrasive filaments
                  </p>
                )}
              </div>

              {/* 2x3 Live Specs Grid - Only show when printer is selected */}
              {selectedPrinter ? (
                <div className="grid grid-cols-3 gap-1.5">
                  <LiveSpecCell 
                    label="Nozzle" 
                    value={`${specs.nozzleDia}mm`}
                    isLoading={printerLoading}
                  />
                  <LiveSpecCell 
                    label="Nozzle Temp" 
                    value={specs.nozzleTemp !== null ? `${specs.nozzleTemp}°C` : "--"}
                    isLoading={printerLoading}
                  />
                  <LiveSpecCell 
                    label="Bed Temp" 
                    value={specs.bedTemp !== null ? `${specs.bedTemp}°C` : "--"}
                    isLoading={printerLoading}
                  />
                  <LiveSpecCell 
                    label="Max Speed" 
                    value={specs.printSpeed !== null ? `${specs.printSpeed}mm/s` : "--"}
                    isLoading={printerLoading}
                  />
                  <LiveSpecCell 
                    label="Accel" 
                    value={formatAcceleration(specs.acceleration) + (specs.acceleration !== null ? "mm/s²" : "")}
                    isLoading={printerLoading}
                  />
                  <LiveSpecCell 
                    label="Flow Rate" 
                    value={specs.flowRate !== null ? `${specs.flowRate}mm³/s` : "--"}
                    isLoading={printerLoading}
                  />
                </div>
              ) : (
                <div className="py-3 px-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Select your printer above to see recommended settings
                  </p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Spool Size - Collapsible */}
      <Collapsible open={spoolOpen} onOpenChange={setSpoolOpen}>
        <div className="border-b border-border">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Spool Size
              </span>
              {localSpoolSize !== "standard" && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              spoolOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-2">
              <Select value={localSpoolSize} onValueChange={handleSpoolSizeChange}>
                <SelectTrigger className="w-full h-9 bg-muted border-border text-foreground text-sm hover:border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {SPOOL_SIZES.map((size) => (
                    <SelectItem key={size.id} value={size.id} className="text-sm text-popover-foreground hover:bg-accent">
                      <span>{size.label}</span>
                      <span className="ml-2 text-muted-foreground">({size.description})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {localSpoolSize === "standard" ? "Showing standard spool sizes (500g–1kg)" :
                 localSpoolSize === "large" ? "Showing large spools (>1kg–2kg)" :
                 "Showing refill packs (no spool)"}
              </p>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Material Types - Collapsible */}
      <CollapsibleFilterSection
        title="Material Types"
        icon={Layers}
        isOpen={materialsOpen}
        onOpenChange={setMaterialsOpen}
        hasActive={localMaterials.filter(m => m !== "All").length > 0}
        activeCount={localMaterials.filter(m => m !== "All").length}
      >
        <div className="flex flex-wrap gap-2">
          {MATERIAL_BASE_OPTIONS.map((option) => {
            const isActive = localMaterials.includes(option.id);
            const count = materialCategoryCounts?.[option.id];
            return (
              <button
                key={option.id}
                onClick={() => handleMaterialToggle(option.id)}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full border transition-colors duration-150",
                  isActive
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 font-semibold"
                    : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {option.label}
                {count != null && count > 0 && (
                  <span className="text-xs text-gray-500">({count})</span>
                )}
                {isActive && <X className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
      </CollapsibleFilterSection>

      {/* Preferred Brands - Collapsible */}
      <CollapsibleFilterSection
        title="Preferred Brands"
        icon={CheckCircle2}
        isOpen={brandsOpen}
        onOpenChange={setBrandsOpen}
        hasActive={localBrands.length > 0}
        activeCount={localBrands.length}
      >
        <div className="flex flex-wrap gap-2">
          {VERIFIED_BRANDS.map((option) => {
            const isActive = localBrands.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => handleBrandToggle(option.id)}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full border transition-colors duration-150",
                  isActive
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 font-semibold"
                    : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {option.label}
                {isActive && <X className="h-3 w-3" />}
              </button>
            );
          })}
          <Link
            to="/brands"
            className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors duration-150"
          >
            <Plus className="h-3 w-3" />
            More brands
          </Link>
        </div>
      </CollapsibleFilterSection>

      {/* Color Search - Collapsible */}
      <CollapsibleFilterSection
        title="Find by Color"
        icon={Palette}
        isOpen={colorOpen}
        onOpenChange={setColorOpen}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {COLOR_FAMILIES.filter(f => !f.hex.includes('gradient')).slice(0, 12).map((family) => (
              <button
                key={family.name}
                onClick={() => navigate(`/colors?hex=${family.hex.replace('#', '')}`)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-muted text-foreground text-xs hover:border-primary/50 hover:bg-primary/5 transition-all"
                title={family.name}
              >
                <span
                  className="w-3 h-3 rounded-full border border-border shrink-0"
                  style={{ backgroundColor: family.hex }}
                />
                {family.name}
              </button>
            ))}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                Custom hex code...
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-3 space-y-2" side="right">
              <label className="text-xs text-muted-foreground">Enter hex code</label>
              <Input
                value={customHexInput}
                onChange={(e) => setCustomHexInput(e.target.value)}
                placeholder="#FF5733"
                className="h-8 text-xs font-mono"
                maxLength={7}
              />
              <button
                onClick={() => {
                  const hex = customHexInput.startsWith('#') ? customHexInput : `#${customHexInput}`;
                  if (isValidHexColor(hex)) {
                    navigate(`/colors?hex=${hex.replace('#', '')}`);
                  }
                }}
                disabled={!isValidHexColor(customHexInput.startsWith('#') ? customHexInput : `#${customHexInput}`)}
                className="w-full text-xs bg-primary/20 text-primary hover:bg-primary/30 py-1.5 rounded-md transition-colors disabled:opacity-50"
              >
                Search Color
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </CollapsibleFilterSection>

      {/* Reinforcements - Collapsible */}
      <CollapsibleFilterSection
        title="Reinforcements"
        icon={Atom}
        isOpen={reinforcedOpen}
        onOpenChange={setReinforcedOpen}
        hasActive={localReinforced.length > 0}
        activeCount={localReinforced.length}
        isLast
      >
        <div className="flex flex-wrap gap-2">
          {REINFORCED_OPTIONS.map((option) => {
            const isActive = localReinforced.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => handleReinforcedToggle(option.id)}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full border transition-colors duration-150",
                  isActive
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 font-semibold"
                    : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {option.label}
                {isActive && <X className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
      </CollapsibleFilterSection>

      {/* Display Options */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Display Options</span>
        </div>
        <TooltipProvider>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <label htmlFor="cost-per-print-toggle" className="text-sm text-muted-foreground cursor-pointer">
                Show cost per print
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs max-w-[200px]">
                  Estimates printing cost based on average material usage per print.
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id="cost-per-print-toggle"
              checked={showCostPerPrint}
              onCheckedChange={(checked) => onShowCostPerPrintChange?.(checked)}
            />
          </div>
        </TooltipProvider>
      </div>

      {/* Quick Match CTA */}
      <QuickMatchSidebarCTA />
    </aside>
  );
}

/* Collapsible Filter Section */
interface CollapsibleFilterSectionProps {
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hasActive?: boolean;
  activeCount?: number;
  isLast?: boolean;
  children: React.ReactNode;
}

function CollapsibleFilterSection({
  title,
  icon: Icon,
  isOpen,
  onOpenChange,
  hasActive,
  activeCount,
  isLast,
  children,
}: CollapsibleFilterSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <div className={cn(!isLast && "border-b border-border")}>
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {title}
            </span>
            {hasActive && activeCount && activeCount > 0 && (
              <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/* Live Spec Cell - Compact readout for machine data */
interface LiveSpecCellProps {
  label: string;
  value: string;
  isLoading?: boolean;
}

function LiveSpecCell({ label, value, isLoading }: LiveSpecCellProps) {
  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-md bg-muted/50 border border-border">
      <span className="text-[10px] text-muted-foreground uppercase text-center leading-tight">
        {label}
      </span>
      {isLoading ? (
        <div className="h-4 w-10 bg-muted rounded animate-pulse mt-0.5" />
      ) : (
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {value}
        </span>
      )}
    </div>
  );
}

export default TechnicalConsoleSidebar;

/* Quick Match CTA for sidebar */
const QUICK_MATCH_DISMISSED_KEY = "filascope_quickmatch_sidebar_dismissed";

function QuickMatchSidebarCTA() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(QUICK_MATCH_DISMISSED_KEY);
    if (!saved) setDismissed(false);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(QUICK_MATCH_DISMISSED_KEY, "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="border-t border-border p-4">
      <div className="relative bg-primary/5 border border-primary/20 rounded-lg p-3">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-foreground pr-5">Need help choosing?</p>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Quick Match finds your perfect filament in 60 seconds
        </p>
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link to="/wizard">Start Quick Match →</Link>
        </Button>
      </div>
    </div>
  );
}
