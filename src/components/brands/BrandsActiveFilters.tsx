import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrandFilters } from "./BrandsSidebar";

interface BrandsActiveFiltersProps {
  filters: BrandFilters;
  onFiltersChange: (filters: BrandFilters) => void;
  className?: string;
}

const BrandsActiveFilters = ({ 
  filters, 
  onFiltersChange,
  className 
}: BrandsActiveFiltersProps) => {
  const activeChips: { label: string; onRemove: () => void }[] = [];

  // Material chips
  filters.materials.forEach(material => {
    activeChips.push({
      label: `Material: ${material}`,
      onRemove: () => onFiltersChange({
        ...filters,
        materials: filters.materials.filter(m => m !== material)
      })
    });
  });

  // Feature chips
  const featureLabels: Record<string, string> = {
    highSpeed: "High Speed",
    rfid: "RFID/NFC",
    cardboard: "Cardboard Spools"
  };
  filters.features.forEach(feature => {
    activeChips.push({
      label: featureLabels[feature] || feature,
      onRemove: () => onFiltersChange({
        ...filters,
        features: filters.features.filter(f => f !== feature)
      })
    });
  });

  // Verification chips
  if (filters.verifiedOnly) {
    activeChips.push({
      label: "Verified Only",
      onRemove: () => onFiltersChange({ ...filters, verifiedOnly: false })
    });
  }
  if (filters.hasLivePricing) {
    activeChips.push({
      label: "Live Pricing",
      onRemove: () => onFiltersChange({ ...filters, hasLivePricing: false })
    });
  }

  // Filament count chip
  if (filters.filamentCountRange) {
    activeChips.push({
      label: `Count: ${filters.filamentCountRange}`,
      onRemove: () => onFiltersChange({ ...filters, filamentCountRange: null })
    });
  }

  if (filters.priceTier) {
    activeChips.push({
      label: `Price: ${filters.priceTier}`,
      onRemove: () => onFiltersChange({ ...filters, priceTier: null })
    });
  }

  if (activeChips.length === 0) return null;

  const clearAll = () => {
    onFiltersChange({
      materials: [],
      features: [],
      verifiedOnly: false,
      hasLivePricing: false,
      filamentCountRange: null,
      priceTier: null,
      sortBy: filters.sortBy // Keep sort
    });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {activeChips.map((chip, index) => (
        <button
          key={index}
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors"
        >
          <span>{chip.label}</span>
          <X className="h-3.5 w-3.5" />
        </button>
      ))}
      <button
        onClick={clearAll}
        className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-2"
      >
        Clear All
      </button>
    </div>
  );
};

export default BrandsActiveFilters;
