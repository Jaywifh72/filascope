// Filter utilities for slicer comparison page

import { SlicerTierInfo, slicerTierData } from './slicerTierData';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

export interface FilterCategory {
  id: string;
  title: string;
  icon: string;
  options: FilterOption[];
}

export interface SlicerFilterState {
  price: string[];
  platform: string[];
  features: string[];
  focus: string[];
}

export const INITIAL_FILTER_STATE: SlicerFilterState = {
  price: [],
  platform: [],
  features: [],
  focus: [],
};

export const SLICER_FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: 'price',
    title: 'PRICE',
    icon: '💰',
    options: [
      { id: 'price-free', label: 'Free', value: 'free' },
      { id: 'price-freemium', label: 'Freemium', value: 'freemium' },
      { id: 'price-paid', label: 'Paid', value: 'paid' },
    ]
  },
  {
    id: 'platform',
    title: 'PLATFORM',
    icon: '🖥️',
    options: [
      { id: 'platform-windows', label: 'Windows', value: 'Windows' },
      { id: 'platform-mac', label: 'Mac', value: 'Mac' },
      { id: 'platform-linux', label: 'Linux', value: 'Linux' },
      { id: 'platform-web', label: 'Web', value: 'Web' },
    ]
  },
  {
    id: 'features',
    title: 'FEATURES',
    icon: '🎨',
    options: [
      { id: 'feature-multi-material', label: 'Multi-Material', value: 'multiMaterial' },
    ]
  },
  {
    id: 'focus',
    title: 'PRINTER TYPE',
    icon: '🖨️',
    options: [
      { id: 'focus-fdm', label: 'FDM', value: 'FDM' },
      { id: 'focus-sla', label: 'SLA/Resin', value: 'SLA' },
    ]
  }
];

// Get all slicers as array
export function getAllSlicers(): SlicerTierInfo[] {
  return Object.values(slicerTierData);
}

// Filter slicers based on current filter state
export function filterSlicers(
  slicers: SlicerTierInfo[],
  filters: SlicerFilterState
): SlicerTierInfo[] {
  return slicers.filter(slicer => {
    // Price filter (OR logic within category)
    if (filters.price.length > 0) {
      if (!filters.price.includes(slicer.priceType)) return false;
    }

    // Platform filter (OR logic - slicer must support at least one selected platform)
    if (filters.platform.length > 0) {
      const hasMatchingPlatform = filters.platform.some(platform => 
        slicer.platforms.includes(platform)
      );
      if (!hasMatchingPlatform) return false;
    }

    // Features filter (AND logic - must have all selected features)
    if (filters.features.length > 0) {
      if (filters.features.includes('multiMaterial') && !slicer.multiMaterial) {
        return false;
      }
    }

    // Focus/Printer type filter (OR logic)
    if (filters.focus.length > 0) {
      // Map slicer data to focus types
      const slicerFocus = getSlicerFocus(slicer.name);
      const hasMatchingFocus = filters.focus.some(focus => {
        if (slicerFocus === 'Both' || slicerFocus === 'All') return true;
        return slicerFocus === focus;
      });
      if (!hasMatchingFocus) return false;
    }

    return true;
  });
}

// Helper to get slicer focus from the comparison data
const slicerFocusMap: Record<string, string> = {
  "UltiMaker Cura": "FDM",
  "PrusaSlicer": "Both",
  "OrcaSlicer": "FDM",
  "Bambu Studio": "FDM",
  "Simplify3D": "FDM",
  "Creality Print": "FDM",
  "ideaMaker": "FDM",
  "SuperSlicer": "FDM",
  "FlashPrint": "FDM",
  "Anycubic Slicer": "FDM",
  "Lychee Slicer": "Both",
  "ChiTuBox": "SLA",
  "VoxelDance Tango": "SLA",
  "Repetier-Host": "FDM",
  "Slic3r": "FDM",
  "KISSlicer": "FDM",
  "MatterControl": "FDM",
  "CraftWare": "FDM",
  "Kiri:Moto": "All",
  "3DPrinterOS": "FDM",
};

function getSlicerFocus(name: string): string {
  return slicerFocusMap[name] || 'FDM';
}

// Calculate count for each filter option based on current filters
export function calculateFilterCounts(
  allSlicers: SlicerTierInfo[],
  currentFilters: SlicerFilterState
): Record<string, Record<string, number>> {
  const counts: Record<string, Record<string, number>> = {};

  SLICER_FILTER_CATEGORIES.forEach(category => {
    counts[category.id] = {};
    
    category.options.forEach(option => {
      // Create temporary filters with this option added
      const tempFilters: SlicerFilterState = {
        ...currentFilters,
        [category.id]: currentFilters[category.id as keyof SlicerFilterState].includes(option.value)
          ? currentFilters[category.id as keyof SlicerFilterState]
          : [...currentFilters[category.id as keyof SlicerFilterState], option.value]
      };

      // If this category already has filters, show count of current + this option
      // Otherwise show count with just this option
      if (currentFilters[category.id as keyof SlicerFilterState].length === 0) {
        // No filters in this category yet - show how many would match if added
        const otherFilters = { ...currentFilters, [category.id]: [option.value] };
        counts[category.id][option.value] = filterSlicers(allSlicers, otherFilters).length;
      } else if (currentFilters[category.id as keyof SlicerFilterState].includes(option.value)) {
        // This option is already selected - show current count
        counts[category.id][option.value] = filterSlicers(allSlicers, currentFilters).length;
      } else {
        // Show count with this option added (OR within category)
        counts[category.id][option.value] = filterSlicers(allSlicers, tempFilters).length;
      }
    });
  });

  return counts;
}

// Get active filters as an array for badge display
export interface ActiveFilter {
  categoryId: string;
  categoryLabel: string;
  optionValue: string;
  optionLabel: string;
}

export function getActiveFiltersArray(filters: SlicerFilterState): ActiveFilter[] {
  const activeFilters: ActiveFilter[] = [];

  SLICER_FILTER_CATEGORIES.forEach(category => {
    const categoryFilters = filters[category.id as keyof SlicerFilterState];
    
    categoryFilters.forEach(value => {
      const option = category.options.find(o => o.value === value);
      if (option) {
        activeFilters.push({
          categoryId: category.id,
          categoryLabel: category.title,
          optionValue: value,
          optionLabel: option.label,
        });
      }
    });
  });

  return activeFilters;
}

// Get total count of active filters
export function getActiveFilterCount(filters: SlicerFilterState): number {
  return Object.values(filters).flat().length;
}
