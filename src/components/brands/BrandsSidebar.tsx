import { useState } from "react";
import { ChevronDown, Check, Building2, Zap, Radio, Leaf, BadgeCheck, DollarSign, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

export interface BrandFilters {
  materials: string[];
  features: string[];
  verifiedOnly: boolean;
  hasLivePricing: boolean;
  filamentCountRange: string | null;
  priceTier: string | null;
  sortBy: string;
}

export const DEFAULT_BRAND_FILTERS: BrandFilters = {
  materials: [],
  features: [],
  verifiedOnly: false,
  hasLivePricing: false,
  filamentCountRange: null,
  priceTier: null,
  sortBy: "count-desc",
};

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

function SectionHeader({ 
  label, 
  section, 
  isOpen, 
  onToggle, 
  activeCount 
}: { 
  label: string; 
  section: string; 
  isOpen: boolean; 
  onToggle: () => void; 
  activeCount?: number;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
    >
      <span className="text-sm font-medium text-white flex items-center gap-2">
        {label}
        {!isOpen && activeCount && activeCount > 0 ? (
          <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0 rounded-full font-medium">
            {activeCount}
          </span>
        ) : null}
      </span>
      <ChevronDown 
        className={cn(
          "h-4 w-4 text-gray-500 transition-transform duration-200",
          isOpen && "rotate-180"
        )} 
      />
    </button>
  );
}

const BrandsSidebar = ({ 
  filters, 
  onFiltersChange, 
  materialCounts,
  className 
}: BrandsSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    materials: true,
    features: false,
    verification: false,
    priceTier: false,
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

  // Count active filters per section
  const sortActive = filters.sortBy !== DEFAULT_BRAND_FILTERS.sortBy ? 1 : 0;
  const priceTierActive = filters.priceTier ? 1 : 0;
  const materialsActive = filters.materials.length;
  const featuresActive = filters.features.length;
  const verificationActive = (filters.verifiedOnly ? 1 : 0) + (filters.hasLivePricing ? 1 : 0);
  const filamentCountActive = filters.filamentCountRange ? 1 : 0;

  const hasActiveFilters = sortActive + priceTierActive + materialsActive + featuresActive + verificationActive + filamentCountActive > 0;

  return (
    <div className={cn("w-72 shrink-0 sticky top-20 self-start hidden lg:block", className)}>
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm max-h-[calc(100vh-5rem)]">
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
              <SectionHeader 
                label="Sort By" 
                section="sort" 
                isOpen={expandedSections.sort} 
                onToggle={() => toggleSection('sort')} 
                activeCount={sortActive}
              />
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

            {/* Price Tier Section */}
            <div>
              <SectionHeader 
                label="Price Tier" 
                section="priceTier" 
                isOpen={expandedSections.priceTier} 
                onToggle={() => toggleSection('priceTier')} 
                activeCount={priceTierActive}
              />
              {expandedSections.priceTier && (
                <div className="px-3 pb-3 space-y-1">
                  {[
                    { id: "$", label: "Budget", dollarSign: "$", desc: "Under $20/kg" },
                    { id: "$$", label: "Mid-Range", dollarSign: "$$", desc: "$20–35/kg" },
                    { id: "$$$", label: "Premium", dollarSign: "$$$", desc: "Over $35/kg" },
                  ].map(tier => (
                    <button
                      key={tier.id}
                      onClick={() => onFiltersChange({ 
                        ...filters, 
                        priceTier: filters.priceTier === tier.id ? null : tier.id 
                      })}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                        filters.priceTier === tier.id
                          ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"
                          : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-amber-500/60 font-mono font-bold">{tier.dollarSign}</span>
                        <span>{tier.label}</span>
                      </span>
                      <span className="text-[10px] text-gray-600 font-mono">{tier.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Material Types Section */}
            <div>
              <SectionHeader 
                label="Material Types" 
                section="materials" 
                isOpen={expandedSections.materials} 
                onToggle={() => toggleSection('materials')} 
                activeCount={materialsActive}
              />
              {expandedSections.materials && (
                <div className="px-3 pb-3 space-y-1">
                  {MATERIAL_OPTIONS.map(material => {
                    const count = materialCounts[material.id] || 0;
                    const isZero = count === 0;
                    return (
                      <button
                        key={material.id}
                        onClick={() => !isZero ? toggleMaterial(material.id) : undefined}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors",
                          filters.materials.includes(material.id)
                            ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"
                            : "hover:bg-gray-800/50 hover:text-white",
                          isZero && !filters.materials.includes(material.id)
                            && "opacity-30 pointer-events-none"
                        )}
                      >
                        <span className={cn("text-sm flex items-center", filters.materials.includes(material.id) ? "" : isZero ? "text-gray-600" : "text-gray-300")}>
                          {filters.materials.includes(material.id) && <Check className="h-3 w-3 mr-1" />}
                          {material.label}
                        </span>
                        <span className={cn("text-xs font-mono", isZero ? "text-gray-700" : "text-gray-600")}>
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Features Section */}
            <div>
              <SectionHeader 
                label="Features" 
                section="features" 
                isOpen={expandedSections.features} 
                onToggle={() => toggleSection('features')} 
                activeCount={featuresActive}
              />
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
              <SectionHeader 
                label="Verification" 
                section="verification" 
                isOpen={expandedSections.verification} 
                onToggle={() => toggleSection('verification')} 
                activeCount={verificationActive}
              />
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
              <SectionHeader 
                label="Filament Count" 
                section="filamentCount" 
                isOpen={expandedSections.filamentCount} 
                onToggle={() => toggleSection('filamentCount')} 
                activeCount={filamentCountActive}
              />
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

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <div className="px-3 pb-3 pt-1">
              <button
                onClick={() => onFiltersChange(DEFAULT_BRAND_FILTERS)}
                className="w-full py-2 text-xs text-primary hover:text-primary/80 border border-dashed border-gray-700 rounded-lg hover:border-primary/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="h-3 w-3" />
                Clear all filters
              </button>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default BrandsSidebar;