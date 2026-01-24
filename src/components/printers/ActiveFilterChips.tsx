import { X } from "lucide-react";

interface AdvancedFilters {
  brands: string[];
  motionSystem: string;
  minSpeed: number;
  maxSpeed: number;
  features: string[];
}

interface ActiveFilterChipsProps {
  activeCategory: string;
  priceRange: string;
  buildVolume: string;
  advancedFilters: AdvancedFilters;
  activeQuickFilters: string[];
  searchTerm: string;
  onRemoveCategory: () => void;
  onRemovePriceRange: () => void;
  onRemoveBuildVolume: () => void;
  onRemoveBrand: (brand: string) => void;
  onRemoveMotionSystem: () => void;
  onRemoveSpeedFilter: () => void;
  onRemoveFeature: (feature: string) => void;
  onRemoveQuickFilter: (filter: string) => void;
  onRemoveSearch: () => void;
  onClearAll: () => void;
}

const priceRangeLabels: Record<string, string> = {
  "0-500": "Under $500",
  "500-1000": "$500 - $1,000",
  "1000-2000": "$1,000 - $2,000",
  "2000-3000": "$2,000 - $3,000",
  "3000+": "Over $3,000",
};

const buildVolumeLabels: Record<string, string> = {
  "small": "Small (<200mm)",
  "medium": "Medium (200-300mm)",
  "large": "Large (300mm+)",
};

const motionSystemLabels: Record<string, string> = {
  "cartesian": "Cartesian",
  "corexy": "CoreXY",
  "delta": "Delta",
};

const featureLabels: Record<string, string> = {
  "auto_bed_leveling": "Auto Bed Leveling",
  "heated_bed": "Heated Bed",
  "enclosed": "Enclosed",
  "camera": "Camera",
  "wifi": "Wi-Fi / Network",
  "filament_sensor": "Filament Sensor",
  "dual_extruder": "Dual Extruder",
};

const quickFilterLabels: Record<string, string> = {
  "multicolor": "Multi-Color",
  "resin": "Resin",
  "budget": "Budget",
  "enclosed": "Enclosed",
  "large": "Large Format",
  "fast": "High Speed",
};

const categoryLabels: Record<string, string> = {
  "fdm": "FDM",
  "resin": "Resin",
  "corexy": "CoreXY",
  "budget": "Budget",
  "multicolor": "Multi-Color",
};

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

function FilterChip({ label, value, onRemove }: FilterChipProps) {
  return (
    <div className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 border border-primary rounded-full text-sm animate-filter-activate shadow-[0_0_8px_rgba(20,184,166,0.15)]">
      <span className="text-primary/80">{label}:</span>
      <span className="text-primary font-medium">{value}</span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="ml-0.5 p-0.5 rounded-full hover:bg-destructive/20 transition-colors opacity-60 group-hover:opacity-100"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3 text-primary hover:text-destructive" />
      </button>
    </div>
  );
}

export default function ActiveFilterChips({
  activeCategory,
  priceRange,
  buildVolume,
  advancedFilters,
  activeQuickFilters,
  searchTerm,
  onRemoveCategory,
  onRemovePriceRange,
  onRemoveBuildVolume,
  onRemoveBrand,
  onRemoveMotionSystem,
  onRemoveSpeedFilter,
  onRemoveFeature,
  onRemoveQuickFilter,
  onRemoveSearch,
  onClearAll,
}: ActiveFilterChipsProps) {
  const chips: React.ReactNode[] = [];

  // Search term
  if (searchTerm) {
    chips.push(
      <FilterChip
        key="search"
        label="Search"
        value={`"${searchTerm}"`}
        onRemove={onRemoveSearch}
      />
    );
  }

  // Category filter
  if (activeCategory !== "all" && categoryLabels[activeCategory]) {
    chips.push(
      <FilterChip
        key="category"
        label="Category"
        value={categoryLabels[activeCategory]}
        onRemove={onRemoveCategory}
      />
    );
  }

  // Price range
  if (priceRange !== "all" && priceRangeLabels[priceRange]) {
    chips.push(
      <FilterChip
        key="price"
        label="Price"
        value={priceRangeLabels[priceRange]}
        onRemove={onRemovePriceRange}
      />
    );
  }

  // Build volume
  if (buildVolume !== "all" && buildVolumeLabels[buildVolume]) {
    chips.push(
      <FilterChip
        key="volume"
        label="Build Size"
        value={buildVolumeLabels[buildVolume]}
        onRemove={onRemoveBuildVolume}
      />
    );
  }

  // Brands
  advancedFilters.brands.forEach((brand) => {
    chips.push(
      <FilterChip
        key={`brand-${brand}`}
        label="Brand"
        value={brand}
        onRemove={() => onRemoveBrand(brand)}
      />
    );
  });

  // Motion system
  if (advancedFilters.motionSystem !== "any" && motionSystemLabels[advancedFilters.motionSystem]) {
    chips.push(
      <FilterChip
        key="motion"
        label="Motion"
        value={motionSystemLabels[advancedFilters.motionSystem]}
        onRemove={onRemoveMotionSystem}
      />
    );
  }

  // Speed filter
  if (advancedFilters.minSpeed > 0 || advancedFilters.maxSpeed < 1000) {
    const speedLabel = advancedFilters.minSpeed > 0 && advancedFilters.maxSpeed < 1000
      ? `${advancedFilters.minSpeed} - ${advancedFilters.maxSpeed} mm/s`
      : advancedFilters.minSpeed > 0
      ? `${advancedFilters.minSpeed}+ mm/s`
      : `Under ${advancedFilters.maxSpeed} mm/s`;
    
    chips.push(
      <FilterChip
        key="speed"
        label="Speed"
        value={speedLabel}
        onRemove={onRemoveSpeedFilter}
      />
    );
  }

  // Features
  advancedFilters.features.forEach((feature) => {
    chips.push(
      <FilterChip
        key={`feature-${feature}`}
        label="Feature"
        value={featureLabels[feature] || feature}
        onRemove={() => onRemoveFeature(feature)}
      />
    );
  });

  // Quick filters (that aren't already shown as category)
  activeQuickFilters.forEach((filter) => {
    // Skip if already shown as category
    if (activeCategory === filter) return;
    
    chips.push(
      <FilterChip
        key={`quick-${filter}`}
        label="Filter"
        value={quickFilterLabels[filter] || filter}
        onRemove={() => onRemoveQuickFilter(filter)}
      />
    );
  });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips}
      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors ml-2"
        >
          Clear All
        </button>
      )}
    </div>
  );
}