import { useState } from "react";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Printer, 
  Thermometer, 
  Gauge, 
  Zap, 
  Wind, 
  Droplets,
  Circle,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

// Spec Grid Item Component
interface SpecItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null;
  unit?: string;
}

const SpecItem = ({ icon, label, value, unit = "" }: SpecItemProps) => (
  <div className="flex flex-col gap-1 p-3 rounded-lg bg-white/[0.02] border border-white/5">
    <div className="flex items-center gap-1.5 text-muted-foreground">
      {icon}
      <span className="text-[9px] uppercase tracking-[0.15em] font-medium">{label}</span>
    </div>
    <span className="font-mono text-sm text-foreground">
      {value !== null && value !== undefined ? `${value}${unit}` : "—"}
    </span>
  </div>
);

// Filter Section Component
interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const FilterSection = ({ title, children, defaultOpen = true }: FilterSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-t border-white/10 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/80">
          {title}
        </span>
        <ChevronDown 
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
            isOpen ? "rotate-180" : ""
          )} 
        />
      </button>
      {isOpen && <div className="space-y-2">{children}</div>}
    </div>
  );
};

// Filter Chip Component
interface FilterChipProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const FilterChip = ({ label, checked, onChange }: FilterChipProps) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <Checkbox 
      checked={checked} 
      onCheckedChange={onChange}
      className="border-white/20 data-[state=checked]:bg-[#00CFE8] data-[state=checked]:border-[#00CFE8]"
    />
    <span className={cn(
      "text-xs transition-colors",
      checked ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
    )}>
      {label}
    </span>
  </label>
);

// Material base types
const MATERIAL_BASES = [
  { id: "pla", label: "PLA" },
  { id: "petg", label: "PETG" },
  { id: "abs", label: "ABS" },
  { id: "asa", label: "ASA" },
  { id: "tpu", label: "TPU" },
  { id: "nylon", label: "Nylon" },
  { id: "pc", label: "PC" },
];

// Reinforced materials
const REINFORCED_MATERIALS = [
  { id: "carbon_fiber", label: "Carbon Fiber" },
  { id: "glass_fiber", label: "Glass Fiber" },
  { id: "wood", label: "Wood Fill" },
  { id: "metal", label: "Metal Fill" },
];

// Spool sizes
const SPOOL_SIZES = [
  { value: "standard", label: "Standard (500g-1kg)" },
  { value: "large", label: "Large (2kg+)" },
  { value: "refill", label: "Refill / Masterbox" },
  { value: "sample", label: "Sample (<500g)" },
];

interface PrintersSidebarProps {
  selectedMaterials: string[];
  onMaterialsChange: (materials: string[]) => void;
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
  selectedReinforced: string[];
  onReinforcedChange: (reinforced: string[]) => void;
  spoolSize: string;
  onSpoolSizeChange: (size: string) => void;
  availableBrands: string[];
}

export function PrintersSidebar({
  selectedMaterials,
  onMaterialsChange,
  selectedBrands,
  onBrandsChange,
  selectedReinforced,
  onReinforcedChange,
  spoolSize,
  onSpoolSizeChange,
  availableBrands,
}: PrintersSidebarProps) {
  const { 
    selectedPrinter, 
    selectedBrand,
    setSelectedBrand,
    setSelectedPrinterId,
    brands,
    models,
    brandsLoading,
    modelsLoading,
  } = usePrinterSelection();

  const toggleMaterial = (materialId: string) => {
    if (selectedMaterials.includes(materialId)) {
      onMaterialsChange(selectedMaterials.filter(m => m !== materialId));
    } else {
      onMaterialsChange([...selectedMaterials, materialId]);
    }
  };

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter(b => b !== brand));
    } else {
      onBrandsChange([...selectedBrands, brand]);
    }
  };

  const toggleReinforced = (reinforcedId: string) => {
    if (selectedReinforced.includes(reinforcedId)) {
      onReinforcedChange(selectedReinforced.filter(r => r !== reinforcedId));
    } else {
      onReinforcedChange([...selectedReinforced, reinforcedId]);
    }
  };

  // Get printer specs
  const printerSpecs = {
    nozzle: selectedPrinter?.stock_nozzle_diameter_mm || null,
    nozzleTemp: selectedPrinter?.max_nozzle_temp_c || null,
    bedTemp: selectedPrinter?.bed_max_temp_c || null,
    maxSpeed: selectedPrinter?.max_print_speed_mms || null,
    accel: selectedPrinter?.max_acceleration_xy_mmss || null,
    flowRate: selectedPrinter?.max_flow_rate_mm3s || null,
  };

  return (
    <aside className="w-[280px] shrink-0 hidden xl:block">
      <div 
        className="sticky top-24 space-y-6 p-5 rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* System Config Panel */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#00CFE8] animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#00CFE8]">
              System Config
            </span>
          </div>
          
          {/* Printer Selector */}
          <div className="space-y-3 mb-4">
            <Select
              value={selectedBrand || ""}
              onValueChange={(value) => {
                setSelectedBrand(value);
                setSelectedPrinterId("");
              }}
              disabled={brandsLoading}
            >
              <SelectTrigger className="h-10 bg-white/5 border-white/10 text-sm">
                <Printer className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select Brand" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0C10] border-white/10 z-50">
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.brand}>
                    {brand.brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedBrand && (
              <Select
                value={selectedPrinter?.id || ""}
                onValueChange={setSelectedPrinterId}
                disabled={modelsLoading}
              >
                <SelectTrigger className="h-10 bg-white/5 border-white/10 text-sm">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0C10] border-white/10 z-50 max-h-[300px]">
                  {models?.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.model_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Printer Specs Grid - 2x3 */}
          <div className="grid grid-cols-2 gap-2">
            <SpecItem
              icon={<Circle className="w-3 h-3" />}
              label="Nozzle"
              value={printerSpecs.nozzle}
              unit="mm"
            />
            <SpecItem
              icon={<Thermometer className="w-3 h-3" />}
              label="Nozzle Temp"
              value={printerSpecs.nozzleTemp}
              unit="°C"
            />
            <SpecItem
              icon={<Thermometer className="w-3 h-3" />}
              label="Bed Temp"
              value={printerSpecs.bedTemp}
              unit="°C"
            />
            <SpecItem
              icon={<Gauge className="w-3 h-3" />}
              label="Max Speed"
              value={printerSpecs.maxSpeed}
              unit="mm/s"
            />
            <SpecItem
              icon={<Zap className="w-3 h-3" />}
              label="Accel"
              value={printerSpecs.accel}
              unit="mm/s²"
            />
            <SpecItem
              icon={<Droplets className="w-3 h-3" />}
              label="Flow Rate"
              value={printerSpecs.flowRate}
              unit="mm³/s"
            />
          </div>
        </div>

        {/* Material Base Filters */}
        <FilterSection title="Material Base">
          <div className="grid grid-cols-2 gap-2">
            {MATERIAL_BASES.map((material) => (
              <FilterChip
                key={material.id}
                label={material.label}
                checked={selectedMaterials.includes(material.id)}
                onChange={() => toggleMaterial(material.id)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Verified Brands */}
        <FilterSection title="Verified Brands" defaultOpen={false}>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {availableBrands.slice(0, 15).map((brand) => (
              <FilterChip
                key={brand}
                label={brand}
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Reinforced Materials */}
        <FilterSection title="Reinforced Material">
          <div className="space-y-2">
            {REINFORCED_MATERIALS.map((material) => (
              <FilterChip
                key={material.id}
                label={material.label}
                checked={selectedReinforced.includes(material.id)}
                onChange={() => toggleReinforced(material.id)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Spool Capacity */}
        <FilterSection title="Spool Capacity">
          <Select value={spoolSize} onValueChange={onSpoolSizeChange}>
            <SelectTrigger className="h-10 bg-white/5 border-white/10 text-sm">
              <SelectValue placeholder="Any Size" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A0C10] border-white/10 z-50">
              <SelectItem value="any">Any Size</SelectItem>
              {SPOOL_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterSection>
      </div>
    </aside>
  );
}