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
    <aside className="hidden lg:flex flex-col w-72 shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border-r border-gray-800 bg-gray-900/60">
      {/* System Config Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
            <Printer className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-300">
              System Config
            </span>
            <span className="text-xs text-gray-500">
              Printer Hub
            </span>
          </div>
        </div>
      </div>

      {/* Printer Selection + Live Specs */}
      <div className="p-4 border-b border-gray-800 space-y-4">
        {/* Printer Selector Dropdowns */}
        <div className="space-y-2">
          <Select
            value={selectedBrand || ""}
            onValueChange={(val) => {
              setSelectedBrand(val);
              setSelectedPrinterId("");
            }}
          >
            <SelectTrigger className="w-full h-9 bg-gray-800 border-gray-700 text-white text-sm hover:border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary/50">
              <SelectValue placeholder="Select brand..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {brands?.map((brand) => (
                <SelectItem key={brand.id} value={brand.brand} className="text-sm text-white hover:bg-gray-700">
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
              <SelectTrigger className="w-full h-9 bg-gray-800 border-gray-700 text-white text-sm hover:border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary/50">
                <SelectValue placeholder="Select model..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {models?.map((model) => (
                  <SelectItem key={model.printer_id} value={model.printer_id} className="text-sm text-white hover:bg-gray-700">
                    {model.model_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Live Specs Header */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-800/50">
          <Settings2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-semibold text-gray-300">
            Live Specs
          </span>
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
      <div className="p-4 border-b border-gray-800 space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-semibold text-gray-300">
            Spool Config
          </span>
        </div>

        <Select value={localSpoolSize} onValueChange={handleSpoolSizeChange}>
          <SelectTrigger className="w-full h-9 bg-gray-800 border-gray-700 text-white text-sm hover:border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {SPOOL_SIZES.map((size) => (
              <SelectItem key={size.id} value={size.id} className="text-sm text-white hover:bg-gray-700">
                <span>{size.label}</span>
                <span className="ml-2 text-gray-400">({size.description})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter Clusters Section */}
      <div className="p-4 space-y-1 flex-1 divide-y divide-gray-800/50">
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

/* Live Spec Cell - Compact readout for machine data */
interface LiveSpecCellProps {
  label: string;
  value: string;
  isLoading?: boolean;
}

function LiveSpecCell({ label, value, isLoading }: LiveSpecCellProps) {
  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-md bg-gray-800/50 border border-gray-700">
      <span className="text-[10px] text-gray-500 uppercase text-center leading-tight">
        {label}
      </span>
      {isLoading ? (
        <div className="h-4 w-10 bg-gray-700 rounded animate-pulse mt-0.5" />
      ) : (
        <span className="text-sm font-semibold text-white tabular-nums">
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
    <div className="py-4 first:pt-0 last:pb-0 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <span className="text-sm font-medium text-white">
          {title}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onToggle(option.id)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md border transition-all duration-150",
              selected.includes(option.id)
                ? "bg-primary/20 border-primary text-primary"
                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600"
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
