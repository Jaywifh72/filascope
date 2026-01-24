import { useState, useEffect, useCallback } from "react";

const SESSION_STORAGE_KEY = "finderFilters";

export interface FilamentFiltersState {
  searchTerm: string;
  selectedMaterials: string[];
  selectedVariants: Record<string, string[]>;
  brassOnly: boolean;
  amsOnly: boolean;
  selectedBrands: string[];
  maxPrice: string;
  sortBy: string;
  // Surface Finish
  matte: boolean;
  silk: boolean;
  metallic: boolean;
  sparkle: boolean;
  translucent: boolean;
  glow: boolean;
  // Reinforced Materials
  carbonFiber: boolean;
  glassFiber: boolean;
  woodFilled: boolean;
  // Performance
  highSpeed: boolean;
  // Spool Size
  largeSpools: boolean;
  // Color
  priceRange: [number, number];
  selectedColorFamilies: string[];
  hexSearch: string;
  colorTolerance: number;
}

const defaultFilters: FilamentFiltersState = {
  searchTerm: "",
  selectedMaterials: ["All"],
  selectedVariants: {},
  brassOnly: false,
  amsOnly: false,
  selectedBrands: [],
  maxPrice: "",
  sortBy: "scoring-desc",
  // Surface Finish
  matte: false,
  silk: false,
  metallic: false,
  sparkle: false,
  translucent: false,
  glow: false,
  // Reinforced Materials
  carbonFiber: false,
  glassFiber: false,
  woodFilled: false,
  // Performance
  highSpeed: false,
  // Spool Size
  largeSpools: false,
  // Color
  priceRange: [0, 100],
  selectedColorFamilies: [],
  hexSearch: "",
  colorTolerance: 30,
};

function getStoredFilters(): FilamentFiltersState | null {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as FilamentFiltersState;
    }
  } catch (e) {
    console.error("Error reading session filters:", e);
  }
  return null;
}

function storeFilters(filters: FilamentFiltersState): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(filters));
  } catch (e) {
    console.error("Error storing session filters:", e);
  }
}

export function useSessionFilters(urlHexSearch?: string | null, urlColorTolerance?: number | null) {
  // Initialize from sessionStorage or defaults, with URL params taking priority for color
  const [filters, setFilters] = useState<FilamentFiltersState>(() => {
    const stored = getStoredFilters();
    const base = stored || defaultFilters;
    
    // URL params override stored values for color search
    return {
      ...base,
      hexSearch: urlHexSearch || base.hexSearch,
      colorTolerance: urlColorTolerance ?? base.colorTolerance,
    };
  });

  // Persist to sessionStorage whenever filters change
  useEffect(() => {
    storeFilters(filters);
  }, [filters]);

  // Helper to update a single filter
  const updateFilter = useCallback(<K extends keyof FilamentFiltersState>(
    key: K,
    value: FilamentFiltersState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // Check if any filters are active (non-default)
  const hasActiveFilters = 
    filters.searchTerm !== "" ||
    !(filters.selectedMaterials.length === 1 && filters.selectedMaterials[0] === "All") ||
    Object.keys(filters.selectedVariants).length > 0 ||
    filters.brassOnly ||
    filters.amsOnly ||
    filters.selectedBrands.length > 0 ||
    filters.maxPrice !== "" ||
    // Surface Finish
    filters.matte ||
    filters.silk ||
    filters.metallic ||
    filters.sparkle ||
    filters.translucent ||
    filters.glow ||
    // Reinforced Materials
    filters.carbonFiber ||
    filters.glassFiber ||
    filters.woodFilled ||
    // Performance
    filters.highSpeed ||
    // Spool Size
    filters.largeSpools ||
    // Color
    filters.priceRange[0] !== 0 ||
    filters.priceRange[1] !== 100 ||
    filters.selectedColorFamilies.length > 0 ||
    filters.hexSearch !== "";

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  };
}
