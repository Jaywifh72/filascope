import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Cpu, SlidersHorizontal, ChevronDown, DollarSign, Box, Layers, Tag, Check, Gauge, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Industrial Toggle Switch Component
function IndustrialToggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label 
      className={cn(
        "flex items-center justify-between gap-3 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200",
        checked 
          ? "bg-primary/10" 
          : "hover:bg-white/5",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-2">
        {checked && <Check className="h-3.5 w-3.5 text-primary" />}
        <span className={cn(
          "text-sm transition-colors",
          checked ? "text-primary font-medium" : "text-gray-400"
        )}>
          {label}
        </span>
      </div>
      <Switch 
        checked={checked} 
        onCheckedChange={onChange}
        disabled={disabled}
        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-white/10"
      />
    </label>
  );
}

// Collapsible Section Component
function SidebarSection({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-gray-800/50 first:border-t-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between py-3 px-1 group transition-colors",
          isOpen && "bg-white/[0.02]"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-white">
            {title}
          </span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-all duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-200",
        isOpen ? "pb-3 opacity-100" : "h-0 opacity-0"
      )}>
        <div className="space-y-0.5">{children}</div>
      </div>
    </div>
  );
}

// Budget Allocation Histogram
function BudgetHistogram({
  selectedRange,
  onRangeChange,
  printerCounts,
}: {
  selectedRange: string;
  onRangeChange: (range: string) => void;
  printerCounts: Record<string, number>;
}) {
  const ranges = [
    { id: "0-500", label: "<$500", max: 500 },
    { id: "500-1000", label: "$500-1K", max: 1000 },
    { id: "1000-2000", label: "$1K-2K", max: 2000 },
    { id: "2000-3000", label: "$2K-3K", max: 3000 },
    { id: "3000+", label: "$3K+", max: Infinity },
  ];

  const maxCount = Math.max(...Object.values(printerCounts), 1);

  return (
    <div className="space-y-3 px-1">
      <div className="flex gap-1 h-16 items-end">
        {ranges.map((range) => {
          const count = printerCounts[range.id] || 0;
          const height = Math.max((count / maxCount) * 100, 8);
          const isSelected = selectedRange === range.id;

          return (
            <button
              key={range.id}
              onClick={() => onRangeChange(isSelected ? "all" : range.id)}
              className={cn(
                "flex-1 rounded-t transition-all duration-200 relative group",
                isSelected
                  ? "bg-primary shadow-[0_0_12px_rgba(0,207,232,0.4)]"
                  : "bg-white/10 hover:bg-white/20"
              )}
              style={{ height: `${height}%` }}
              title={`${count} printers`}
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-1">
        {ranges.map((range) => (
          <span
            key={range.id}
            className={cn(
              "flex-1 text-center text-[10px]",
              selectedRange === range.id ? "text-primary" : "text-gray-500"
            )}
          >
            {range.label}
          </span>
        ))}
      </div>
    </div>
  );
}

interface PrintersSidebarProps {
  // Kinematics
  selectedKinematics: string[];
  onKinematicsChange: (kinematics: string[]) => void;
  // Build Volume
  selectedBuildVolume: string;
  onBuildVolumeChange: (volume: string) => void;
  // Enclosure
  selectedEnclosure: string[];
  onEnclosureChange: (enclosure: string[]) => void;
  // Brands
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
  // Price
  priceRange: string;
  onPriceRangeChange: (range: string) => void;
  // Quick toggles
  hideDiscontinued: boolean;
  onHideDiscontinuedChange: (hide: boolean) => void;
  // Price counts for histogram
  priceCounts: Record<string, number>;
}

export default function PrintersSidebar({
  selectedKinematics,
  onKinematicsChange,
  selectedBuildVolume,
  onBuildVolumeChange,
  selectedEnclosure,
  onEnclosureChange,
  selectedBrands,
  onBrandsChange,
  priceRange,
  onPriceRangeChange,
  hideDiscontinued,
  onHideDiscontinuedChange,
  priceCounts,
}: PrintersSidebarProps) {
  // Fetch brands from database
  const { data: brands = [] } = useQuery({
    queryKey: ["printer-brands-sidebar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_brands")
        .select("brand")
        .order("brand");
      if (error) throw error;
      return data.map((b) => b.brand);
    },
  });

  // Sort brands with numbers first
  const sortedBrands = [...brands].sort((a, b) => {
    const aStartsWithNum = /^\d/.test(a);
    const bStartsWithNum = /^\d/.test(b);
    if (aStartsWithNum && !bStartsWithNum) return -1;
    if (!aStartsWithNum && bStartsWithNum) return 1;
    return a.localeCompare(b);
  });

  const kinematicsOptions = [
    { id: "corexy", label: "CoreXY" },
    { id: "cartesian", label: "Cartesian" },
    { id: "delta", label: "Delta" },
    { id: "idex", label: "IDEX" },
    { id: "toolchanger", label: "Toolchanger" },
  ];

  const buildVolumeOptions = [
    { id: "small", label: "Small (<200mm)" },
    { id: "medium", label: "Medium (200-300mm)" },
    { id: "large", label: "Large Format (300mm+)" },
  ];

  const enclosureOptions = [
    { id: "open", label: "Open Frame" },
    { id: "passive", label: "Passive Enclosure" },
    { id: "heated", label: "Active Heated" },
  ];

  const toggleKinematics = (id: string) => {
    if (selectedKinematics.includes(id)) {
      onKinematicsChange(selectedKinematics.filter((k) => k !== id));
    } else {
      onKinematicsChange([...selectedKinematics, id]);
    }
  };

  const toggleEnclosure = (id: string) => {
    if (selectedEnclosure.includes(id)) {
      onEnclosureChange(selectedEnclosure.filter((e) => e !== id));
    } else {
      onEnclosureChange([...selectedEnclosure, id]);
    }
  };

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter((b) => b !== brand));
    } else {
      onBrandsChange([...selectedBrands, brand]);
    }
  };

  return (
    <aside className="w-72 shrink-0 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
      <div className="bg-gray-900/60 border-r border-gray-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 bg-gradient-to-b from-white/[0.03] to-transparent">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-gray-300">
              Filter Parameters
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          {/* Quick Filters */}
          <div className="py-3 border-b border-gray-800/50">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Quick Filters</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Under $300", isActive: priceRange === "0-300", onClick: () => onPriceRangeChange(priceRange === "0-300" ? "all" : "0-300") },
                { label: "Enclosed", isActive: selectedEnclosure.includes("passive") || selectedEnclosure.includes("heated"), onClick: () => {
                  const hasEnclosed = selectedEnclosure.includes("passive") || selectedEnclosure.includes("heated");
                  if (hasEnclosed) {
                    onEnclosureChange(selectedEnclosure.filter(e => e !== "passive" && e !== "heated"));
                  } else {
                    onEnclosureChange([...selectedEnclosure, "passive", "heated"]);
                  }
                }},
                { label: "Multi-Material", isActive: selectedKinematics.includes("toolchanger") || selectedKinematics.includes("idex"), onClick: () => {
                  const hasMulti = selectedKinematics.includes("toolchanger") || selectedKinematics.includes("idex");
                  if (hasMulti) {
                    onKinematicsChange(selectedKinematics.filter(k => k !== "toolchanger" && k !== "idex"));
                  } else {
                    onKinematicsChange([...selectedKinematics, "toolchanger", "idex"]);
                  }
                }},
                { label: "Large Format", isActive: selectedBuildVolume === "large", onClick: () => onBuildVolumeChange(selectedBuildVolume === "large" ? "all" : "large") },
              ].map((filter) => (
                <button
                  key={filter.label}
                  onClick={filter.onClick}
                  className={cn(
                    "text-xs rounded-full px-3 py-1 transition-colors duration-150 border",
                    filter.isActive
                      ? "bg-cyan-500/15 border-cyan-500 text-cyan-400"
                      : "border-border/50 text-muted-foreground hover:border-cyan-500/50 hover:text-cyan-400"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Toggle: Hide Discontinued */}
          <div className="py-3 border-b border-gray-800/50">
            <IndustrialToggle
              checked={hideDiscontinued}
              onChange={onHideDiscontinuedChange}
              label="Hide Discontinued"
            />
          </div>

          {/* Price Range */}
          <SidebarSection title="Price Range" icon={DollarSign}>
            <BudgetHistogram
              selectedRange={priceRange}
              onRangeChange={onPriceRangeChange}
              printerCounts={priceCounts}
            />
          </SidebarSection>

          {/* Motion System */}
          <SidebarSection title="Motion System" icon={Cpu}>
            {kinematicsOptions.map((option) => (
              <IndustrialToggle
                key={option.id}
                checked={selectedKinematics.includes(option.id)}
                onChange={() => toggleKinematics(option.id)}
                label={option.label}
              />
            ))}
          </SidebarSection>

          {/* Build Size */}
          <SidebarSection title="Build Size" icon={Box} defaultOpen={false}>
            {buildVolumeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onBuildVolumeChange(selectedBuildVolume === option.id ? "all" : option.id)}
                className={cn(
                  "w-full flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 text-sm",
                  selectedBuildVolume === option.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                )}
              >
                <span>{option.label}</span>
                {selectedBuildVolume === option.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </SidebarSection>

          {/* Enclosure Type */}
          <SidebarSection title="Enclosure Type" icon={Layers} defaultOpen={false}>
            {enclosureOptions.map((option) => (
              <IndustrialToggle
                key={option.id}
                checked={selectedEnclosure.includes(option.id)}
                onChange={() => toggleEnclosure(option.id)}
                label={option.label}
              />
            ))}
          </SidebarSection>

          {/* Brand */}
          <SidebarSection title="Brand" icon={Tag} defaultOpen={true}>
            {/* Top brand pills */}
            <div className="flex flex-wrap gap-1.5 mb-2 px-1">
              {["Bambu Lab", "Creality", "Prusa Research", "FlashForge", "Elegoo", "Snapmaker", "Anycubic", "Raise3D", "UltiMaker"].map((brand) => (
                <button
                  key={brand}
                  onClick={() => toggleBrand(brand)}
                  className={cn(
                    "text-xs rounded-full px-3 py-1 transition-colors duration-150 border",
                    selectedBrands.includes(brand)
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 font-semibold"
                      : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {brand}
                </button>
              ))}
            </div>
            {/* All brands list */}
            <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 space-y-0.5 pr-1">
              {sortedBrands
                .filter(b => !["Bambu Lab", "Creality", "Prusa Research", "FlashForge", "Elegoo", "Snapmaker", "Anycubic", "Raise3D", "UltiMaker"].includes(b))
                .map((brand) => (
                <button
                  key={brand}
                  onClick={() => toggleBrand(brand)}
                  className={cn(
                    "w-full flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 text-sm",
                    selectedBrands.includes(brand)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                  )}
                >
                  <span>{brand}</span>
                  {selectedBrands.includes(brand) && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </SidebarSection>
        </div>
      </div>
    </aside>
  );
}
