import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Cpu, Settings2, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
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
        "flex items-center justify-between gap-3 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 border",
        checked 
          ? "border-primary/40 bg-primary/10" 
          : "border-transparent hover:bg-white/5",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/80">
        {label}
      </span>
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
    <div className="border-b border-white/5 pb-4 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 group"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/90">
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>
      {isOpen && <div className="mt-2 space-y-1">{children}</div>}
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
    <div className="space-y-3">
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
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
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
              "flex-1 text-center font-mono text-[9px] uppercase tracking-wider",
              selectedRange === range.id ? "text-primary" : "text-muted-foreground"
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
    <aside className="w-72 shrink-0 sticky top-24 self-start">
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">
              Hardware Parameters
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Quick Toggle: Hide Discontinued */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/5">
            <IndustrialToggle
              checked={hideDiscontinued}
              onChange={onHideDiscontinuedChange}
              label="Hide Discontinued"
            />
          </div>

          {/* Budget Allocation */}
          <SidebarSection title="Budget Allocation" icon={DollarSign}>
            <BudgetHistogram
              selectedRange={priceRange}
              onRangeChange={onPriceRangeChange}
              printerCounts={priceCounts}
            />
          </SidebarSection>

          {/* Kinematics */}
          <SidebarSection title="Motion Kinematics" icon={Cpu}>
            {kinematicsOptions.map((option) => (
              <IndustrialToggle
                key={option.id}
                checked={selectedKinematics.includes(option.id)}
                onChange={() => toggleKinematics(option.id)}
                label={option.label}
              />
            ))}
          </SidebarSection>

          {/* Build Volume */}
          <SidebarSection title="Build Volume" icon={Settings2} defaultOpen={false}>
            {buildVolumeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onBuildVolumeChange(selectedBuildVolume === option.id ? "all" : option.id)}
                className={cn(
                  "w-full text-left py-2 px-3 rounded-lg transition-all duration-200 border font-mono text-[11px] uppercase tracking-[0.1em]",
                  selectedBuildVolume === option.id
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-transparent text-foreground/70 hover:bg-white/5"
                )}
              >
                {option.label}
              </button>
            ))}
          </SidebarSection>

          {/* Enclosure */}
          <SidebarSection title="Enclosure Type" icon={Settings2} defaultOpen={false}>
            {enclosureOptions.map((option) => (
              <IndustrialToggle
                key={option.id}
                checked={selectedEnclosure.includes(option.id)}
                onChange={() => toggleEnclosure(option.id)}
                label={option.label}
              />
            ))}
          </SidebarSection>

          {/* Brand Ecosystem */}
          <SidebarSection title="Brand Ecosystem" icon={Settings2} defaultOpen={false}>
            <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 space-y-0.5 pr-1">
              {sortedBrands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => toggleBrand(brand)}
                  className={cn(
                    "w-full text-left py-1.5 px-3 rounded-md transition-all duration-200 font-mono text-[10px] uppercase tracking-[0.05em]",
                    selectedBrands.includes(brand)
                      ? "bg-primary/15 text-primary border-l-2 border-primary"
                      : "text-foreground/60 hover:bg-white/5 hover:text-foreground/80"
                  )}
                >
                  {brand}
                </button>
              ))}
            </div>
          </SidebarSection>
        </div>
      </div>
    </aside>
  );
}
