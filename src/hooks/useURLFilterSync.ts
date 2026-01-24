import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const LOCAL_STORAGE_KEY = "finder_saved_filters";
const URL_PARAM_KEYS = [
  "q", "materials", "brands", "minPrice", "maxPrice", "sort",
  "matte", "silk", "metallic", "sparkle", "translucent", "glow",
  "carbonFiber", "glassFiber", "woodFilled", "highSpeed", "largeSpools",
  "amsOnly", "brassOnly", "colors", "hex", "colorTolerance"
] as const;

export interface URLFilterState {
  searchTerm: string;
  selectedMaterials: string[];
  selectedBrands: string[];
  priceRange: [number, number];
  sortBy: string;
  // Surface finishes
  matte: boolean;
  silk: boolean;
  metallic: boolean;
  sparkle: boolean;
  translucent: boolean;
  glow: boolean;
  // Reinforced
  carbonFiber: boolean;
  glassFiber: boolean;
  woodFilled: boolean;
  // Performance
  highSpeed: boolean;
  largeSpools: boolean;
  amsOnly: boolean;
  brassOnly: boolean;
  // Color
  selectedColorFamilies: string[];
  hexSearch: string;
  colorTolerance: number;
}

const defaultFilters: URLFilterState = {
  searchTerm: "",
  selectedMaterials: [],
  selectedBrands: [],
  priceRange: [0, 100],
  sortBy: "scoring-desc",
  matte: false,
  silk: false,
  metallic: false,
  sparkle: false,
  translucent: false,
  glow: false,
  carbonFiber: false,
  glassFiber: false,
  woodFilled: false,
  highSpeed: false,
  largeSpools: false,
  amsOnly: false,
  brassOnly: false,
  selectedColorFamilies: [],
  hexSearch: "",
  colorTolerance: 30,
};

/**
 * Parse URL params to filter state
 */
function parseURLParams(searchParams: URLSearchParams): Partial<URLFilterState> {
  const parsed: Partial<URLFilterState> = {};

  const q = searchParams.get("q");
  if (q) parsed.searchTerm = q;

  const materials = searchParams.get("materials");
  if (materials) parsed.selectedMaterials = materials.split(",");

  const brands = searchParams.get("brands");
  if (brands) parsed.selectedBrands = brands.split(",");

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice || maxPrice) {
    parsed.priceRange = [
      minPrice ? parseInt(minPrice, 10) : 0,
      maxPrice ? parseInt(maxPrice, 10) : 100,
    ];
  }

  const sort = searchParams.get("sort");
  if (sort) parsed.sortBy = sort;

  // Boolean filters
  const booleanKeys = [
    "matte", "silk", "metallic", "sparkle", "translucent", "glow",
    "carbonFiber", "glassFiber", "woodFilled", "highSpeed", "largeSpools",
    "amsOnly", "brassOnly"
  ] as const;

  booleanKeys.forEach((key) => {
    const value = searchParams.get(key);
    if (value === "true") {
      (parsed as any)[key] = true;
    }
  });

  const colors = searchParams.get("colors");
  if (colors) parsed.selectedColorFamilies = colors.split(",");

  const hex = searchParams.get("hex");
  if (hex) parsed.hexSearch = hex;

  const colorTolerance = searchParams.get("colorTolerance");
  if (colorTolerance) parsed.colorTolerance = parseInt(colorTolerance, 10);

  return parsed;
}

/**
 * Convert filter state to URL params
 */
function filtersToURLParams(filters: URLFilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.searchTerm) params.set("q", filters.searchTerm);
  if (filters.selectedMaterials.length > 0) {
    params.set("materials", filters.selectedMaterials.join(","));
  }
  if (filters.selectedBrands.length > 0) {
    params.set("brands", filters.selectedBrands.join(","));
  }
  if (filters.priceRange[0] > 0) params.set("minPrice", String(filters.priceRange[0]));
  if (filters.priceRange[1] < 100) params.set("maxPrice", String(filters.priceRange[1]));
  if (filters.sortBy !== "scoring-desc") params.set("sort", filters.sortBy);

  // Boolean filters - only set if true
  const booleanKeys = [
    "matte", "silk", "metallic", "sparkle", "translucent", "glow",
    "carbonFiber", "glassFiber", "woodFilled", "highSpeed", "largeSpools",
    "amsOnly", "brassOnly"
  ] as const;

  booleanKeys.forEach((key) => {
    if (filters[key]) params.set(key, "true");
  });

  if (filters.selectedColorFamilies.length > 0) {
    params.set("colors", filters.selectedColorFamilies.join(","));
  }
  if (filters.hexSearch) params.set("hex", filters.hexSearch);
  if (filters.colorTolerance !== 30) {
    params.set("colorTolerance", String(filters.colorTolerance));
  }

  return params;
}

/**
 * Hook for syncing filter state with URL params and localStorage
 */
export function useURLFilterSync() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Initialize from URL or localStorage
  const [filters, setFilters] = useState<URLFilterState>(() => {
    // First check URL
    const urlFilters = parseURLParams(searchParams);
    if (Object.keys(urlFilters).length > 0) {
      return { ...defaultFilters, ...urlFilters };
    }

    // Then check localStorage
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultFilters, ...parsed };
      }
    } catch (e) {
      console.error("Error reading saved filters:", e);
    }

    return defaultFilters;
  });

  // Sync filters to URL
  const syncToURL = useCallback((newFilters: URLFilterState) => {
    const params = filtersToURLParams(newFilters);
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Save to localStorage
  const saveToLocalStorage = useCallback((newFilters: URLFilterState) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newFilters));
    } catch (e) {
      console.error("Error saving filters:", e);
    }
  }, []);

  // Update filter with URL and storage sync
  const updateFilter = useCallback(<K extends keyof URLFilterState>(
    key: K,
    value: URLFilterState[K]
  ) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      syncToURL(newFilters);
      saveToLocalStorage(newFilters);
      return newFilters;
    });
  }, [syncToURL, saveToLocalStorage]);

  // Batch update multiple filters
  const updateFilters = useCallback((updates: Partial<URLFilterState>) => {
    setFilters((prev) => {
      const newFilters = { ...prev, ...updates };
      syncToURL(newFilters);
      saveToLocalStorage(newFilters);
      return newFilters;
    });
  }, [syncToURL, saveToLocalStorage]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchParams(new URLSearchParams(), { replace: true });
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, [setSearchParams]);

  // Generate shareable URL
  const getShareableURL = useCallback(() => {
    const params = filtersToURLParams(filters);
    const baseURL = window.location.origin + window.location.pathname;
    return params.toString() ? `${baseURL}?${params.toString()}` : baseURL;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm !== "" ||
      filters.selectedMaterials.length > 0 ||
      filters.selectedBrands.length > 0 ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 100 ||
      filters.sortBy !== "scoring-desc" ||
      filters.matte || filters.silk || filters.metallic || filters.sparkle ||
      filters.translucent || filters.glow ||
      filters.carbonFiber || filters.glassFiber || filters.woodFilled ||
      filters.highSpeed || filters.largeSpools ||
      filters.amsOnly || filters.brassOnly ||
      filters.selectedColorFamilies.length > 0 ||
      filters.hexSearch !== ""
    );
  }, [filters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    getShareableURL,
    hasActiveFilters,
  };
}
