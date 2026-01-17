import { useState } from "react";
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
  Settings2
} from "lucide-react";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Material Base options
const MATERIAL_BASE_OPTIONS = [
  { id: "pla", label: "PLA" },
  { id: "petg", label: "PETG" },
  { id: "abs", label: "ABS" },
  { id: "asa", label: "ASA" },
  { id: "tpu", label: "TPU" },
  { id: "nylon", label: "Nylon" },
  { id: "pc", label: "PC" },
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

  const [localSpoolSize, setLocalSpoolSize] = useState(spoolSize);
  const [localMaterials, setLocalMaterials] = useState<string[]>(selectedMaterials);
  const [localBrands, setLocalBrands] = useState<string[]>(selectedBrands);
  const [localReinforced, setLocalReinforced] = useState<string[]>([
    ...(carbonFiber ? ["carbon"] : []),
    ...(glassFiber ? ["glass"] : []),
    ...(woodFilled ? ["wood"] : []),
  ]);

  // Printer specs
  const specs = {
    nozzleDia: selectedPrinter?.stock_nozzle_diameter_mm ?? null,
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

  return (
    <aside className="hidden lg:flex flex-col w-72 border-r border-border bg-background/80 backdrop-blur-md sticky top-0 h-screen overflow-y-auto shrink-0">
      {/* ═══════════════════════════════════════════════════════════════
          PRINTER HUB - System Config Header
          ═══════════════════════════════════════════════════════════════ */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-primary/10 border border-primary/20">
            <Printer className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[11px] font-bold text-foreground uppercase tracking-[0.15em]">
              System Config
            </span>
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
              Printer Hub
            </span>
          </div>
        </div>
      </div>

      {/* Printer Selection + Live Specs */}
      <div className="p-4 border-b border-border space-y-4">
        {/* Printer Selector Dropdowns */}
        <div className="space-y-2">
          <Select
            value={selectedBrand || ""}
            onValueChange={(val) => {
              setSelectedBrand(val);
              setSelectedPrinterId("");
            }}
          >
            <SelectTrigger className="w-full h-9 bg-background/50 border-border font-mono text-xs">
              <SelectValue placeholder="Select brand..." />
            </SelectTrigger>
            <SelectContent>
              {brands?.map((brand) => (
                <SelectItem key={brand.id} value={brand.brand} className="font-mono text-xs">
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
              <SelectTrigger className="w-full h-9 bg-background/50 border-border font-mono text-xs">
                <SelectValue placeholder="Select model..." />
              </SelectTrigger>
              <SelectContent>
                {models?.map((model) => (
                  <SelectItem key={model.printer_id} value={model.printer_id} className="font-mono text-xs">
                    {model.model_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Live Specs Header */}
        <div className="flex items-center gap-2 pt-2">
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-[0.2em]">
            Live Specs
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* 2x3 Live Specs Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          <LiveSpecCell 
            label="Nozzle" 
            value={specs.nozzleDia !== null ? `${specs.nozzleDia}mm` : "--"}
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
      </div>

      {/* Spool Configuration Section */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
            Spool Config
          </span>
        </div>

        <Select value={localSpoolSize} onValueChange={handleSpoolSizeChange}>
          <SelectTrigger className="w-full h-9 bg-background/50 border-border font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPOOL_SIZES.map((size) => (
              <SelectItem key={size.id} value={size.id} className="font-mono text-xs">
                <span>{size.label}</span>
                <span className="ml-2 text-muted-foreground">({size.description})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter Clusters Section */}
      <div className="p-4 space-y-5 flex-1">
        {/* Material Base */}
        <FilterCluster 
          title="Material Base"
          icon={Layers}
          options={MATERIAL_BASE_OPTIONS}
          selected={localMaterials}
          onToggle={handleMaterialToggle}
        />

        {/* Verified Brands */}
        <FilterCluster 
          title="Verified Brands"
          icon={CheckCircle2}
          options={VERIFIED_BRANDS}
          selected={localBrands}
          onToggle={handleBrandToggle}
        />

        {/* Reinforced Material */}
        <FilterCluster 
          title="Reinforced Material"
          icon={Atom}
          options={REINFORCED_OPTIONS}
          selected={localReinforced}
          onToggle={handleReinforcedToggle}
        />
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIVE SPEC CELL - Compact monospace readout for raw machine data
   ═══════════════════════════════════════════════════════════════ */
interface LiveSpecCellProps {
  label: string;
  value: string;
  isLoading?: boolean;
}

function LiveSpecCell({ label, value, isLoading }: LiveSpecCellProps) {
  return (
    <div className="flex flex-col items-center justify-center p-1.5 rounded bg-background/30 border border-border/30">
      <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-wider text-center leading-tight">
        {label}
      </span>
      {isLoading ? (
        <div className="h-3.5 w-8 bg-muted/50 rounded animate-pulse mt-0.5" />
      ) : (
        <span 
          className="font-mono text-[10px] font-bold text-foreground tabular-nums"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {value}
        </span>
      )}
    </div>
  );
}

interface FilterClusterProps {
  title: string;
  icon: React.ElementType;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}

function FilterCluster({ title, icon: Icon, options, selected, onToggle }: FilterClusterProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-3 h-3 text-primary" />
        <span className="font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
          {title}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onToggle(option.id)}
            className={cn(
              "px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider rounded-sm border transition-all duration-150",
              selected.includes(option.id)
                ? "bg-primary/20 border-primary/50 text-primary"
                : "bg-background/50 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TechnicalConsoleSidebar;
