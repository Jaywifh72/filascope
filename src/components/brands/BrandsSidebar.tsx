import { useState } from "react";
import { ChevronDown, Check, Building2, Zap, Radio, Leaf, BadgeCheck, DollarSign, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

export interface BrandFilters {
  materials: string[];
  features: string[];
  verifiedOnly: boolean;
  hasLivePricing: boolean;
  filamentCountRange: string | null;
  sortBy: string;
}

interface BrandsSidebarProps {
  filters: BrandFilters;
  onFiltersChange: (filters: BrandFilters) => void;
  materialCounts: Record<string, number>;
  className?: string;
}

const MATERIAL_OPTIONS = [
  { id: "PLA", label: "PLA" },
  { id: "PETG", label: "PETG" },
  { id: "ABS", label: "ABS" },
  { id: "ASA", label: "ASA" },
  { id: "TPU", label: "TPU" },
  { id: "Nylon", label: "Nylon" },
  { id: "PC", label: "PC" },
  { id: "Other", label: "Other" },
];

const FEATURE_OPTIONS = [
  { id: "highSpeed", label: "High Speed Compatible", icon: Zap },
  { id: "rfid", label: "RFID/NFC Enabled", icon: Radio },
  { id: "cardboard", label: "Cardboard Spools", icon: Leaf },
];

const FILAMENT_COUNT_OPTIONS = [
  { id: "1-50", label: "1-50 Filaments" },
  { id: "51-200", label: "51-200 Filaments" },
  { id: "200+", label: "200+ Filaments" },
];

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "count-desc", label: "Most Filaments" },
  { value: "count-asc", label: "Fewest Filaments" },
];

const BrandsSidebar = ({ 
  filters, 
  onFiltersChange, 
  materialCounts,
  className 
}: BrandsSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    materials: true,
    features: true,
    verification: true,
    filamentCount: false,
    sort: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleMaterial = (materialId: string) => {
    const newMaterials = filters.materials.includes(materialId)
      ? filters.materials.filter(m => m !== materialId)
      : [...filters.materials, materialId];
    onFiltersChange({ ...filters, materials: newMaterials });
  };

  const toggleFeature = (featureId: string) => {
    const newFeatures = filters.features.includes(featureId)
      ? filters.features.filter(f => f !== featureId)
      : [...filters.features, featureId];
    onFiltersChange({ ...filters, features: newFeatures });
  };

  return (
    <div className={cn("w-72 shrink-0 sticky top-20 self-start hidden lg:block", className)}>
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 bg-gradient-to-b from-white/[0.03] to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-white">
              Filter Brands
            </span>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(100vh-180px)]">
          <div className="divide-y divide-gray-800/50">
            {/* Sort Section */}
            <div>
              <button
                onClick={() => toggleSection('sort')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-medium text-white">Sort By</span>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 text-gray-500 transition-transform duration-200",
                    expandedSections.sort && "rotate-180"
                  )} 
                />
              </button>
              {expandedSections.sort && (
                <div className="px-3 pb-3 space-y-1">
                  {SORT_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => onFiltersChange({ ...filters, sortBy: option.value })}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                        filters.sortBy === option.value
                          ? "bg-primary/15 text-primary"
                          : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                      )}
                    >
                      <span>{option.label}</span>
                      {filters.sortBy === option.value && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Material Types Section */}
            <div>
              <button
                onClick={() => toggleSection('materials')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-medium text-white">Material Types</span>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 text-gray-500 transition-transform duration-200",
                    expandedSections.materials && "rotate-180"
                  )} 
                />
              </button>
              {expandedSections.materials && (
                <div className="px-3 pb-3 space-y-1">
                  {MATERIAL_OPTIONS.map(material => (
                    <button
                      key={material.id}
                      onClick={() => toggleMaterial(material.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors",
                        filters.materials.includes(material.id)
                          ? "bg-primary/15 text-primary"
                          : "hover:bg-gray-800/50 hover:text-white"
                      )}
                    >
                      <span className={cn("text-sm", filters.materials.includes(material.id) ? "" : "text-gray-300")}>{material.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 font-mono">
                          ({materialCounts[material.id] || 0})
                        </span>
                        {filters.materials.includes(material.id) && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Features Section */}
            <div>
              <button
                onClick={() => toggleSection('features')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-medium text-white">Features</span>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 text-gray-500 transition-transform duration-200",
                    expandedSections.features && "rotate-180"
                  )} 
                />
              </button>
              {expandedSections.features && (
                <div className="px-3 pb-3 space-y-1">
                  {FEATURE_OPTIONS.map(feature => {
                    const Icon = feature.icon;
                    return (
                      <button
                        key={feature.id}
                        onClick={() => toggleFeature(feature.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                          filters.features.includes(feature.id)
                            ? "bg-primary/15 text-primary"
                            : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{feature.label}</span>
                        {filters.features.includes(feature.id) && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Verification Section */}
            <div>
              <button
                onClick={() => toggleSection('verification')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-medium text-white">Verification</span>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 text-gray-500 transition-transform duration-200",
                    expandedSections.verification && "rotate-180"
                  )} 
                />
              </button>
              {expandedSections.verification && (
                <div className="px-4 pb-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-gray-300">Verified Only</span>
                    </div>
                    <Switch
                      checked={filters.verifiedOnly}
                      onCheckedChange={(checked) => 
                        onFiltersChange({ ...filters, verifiedOnly: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-sm text-gray-300">Live Pricing</span>
                    </div>
                    <Switch
                      checked={filters.hasLivePricing}
                      onCheckedChange={(checked) => 
                        onFiltersChange({ ...filters, hasLivePricing: checked })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Filament Count Section */}
            <div>
              <button
                onClick={() => toggleSection('filamentCount')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-medium text-white">Filament Count</span>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 text-gray-500 transition-transform duration-200",
                    expandedSections.filamentCount && "rotate-180"
                  )} 
                />
              </button>
              {expandedSections.filamentCount && (
                <div className="px-3 pb-3 space-y-1">
                  {FILAMENT_COUNT_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => onFiltersChange({ 
                        ...filters, 
                        filamentCountRange: filters.filamentCountRange === option.id ? null : option.id 
                      })}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                        filters.filamentCountRange === option.id
                          ? "bg-primary/15 text-primary"
                          : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                      )}
                    >
                      <span>{option.label}</span>
                      {filters.filamentCountRange === option.id && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default BrandsSidebar;
