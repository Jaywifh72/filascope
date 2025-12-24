import { useState, useEffect, useCallback } from "react";

const SESSION_STORAGE_KEY = "finderFilters";

export interface FilamentFiltersState {
  searchTerm: string;
  selectedMaterials: string[];
  selectedVariants: Record<string, string[]>;
  brassOnly: boolean;
  foodContact: boolean;
  amsOnly: boolean;
  selectedBrands: string[];
  maxPrice: string;
  sortBy: string;
  highSpeed: boolean;
  matte: boolean;
  carbonFiber: boolean;
  glassFiber: boolean;
  woodFilled: boolean;
  glow: boolean;
  plasticSpool: boolean;
  cardboardSpool: boolean;
  singleSpool: boolean;
  multiPack: boolean;
  largeSpools: boolean;
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
  foodContact: false,
  amsOnly: false,
  selectedBrands: [],
  maxPrice: "",
  sortBy: "truecost-asc",
  highSpeed: false,
  matte: false,
  carbonFiber: false,
  glassFiber: false,
  woodFilled: false,
  glow: false,
  plasticSpool: false,
  cardboardSpool: false,
  singleSpool: false,
  multiPack: false,
  largeSpools: false,
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
    filters.foodContact ||
    filters.amsOnly ||
    filters.selectedBrands.length > 0 ||
    filters.maxPrice !== "" ||
    filters.highSpeed ||
    filters.matte ||
    filters.carbonFiber ||
    filters.glassFiber ||
    filters.woodFilled ||
    filters.glow ||
    filters.plasticSpool ||
    filters.cardboardSpool ||
    filters.singleSpool ||
    filters.multiPack ||
    filters.largeSpools ||
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
