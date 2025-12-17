import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { platforms, PlatformData, PriceFilter, BestForFilter, PrinterFilter, FileTypeFilter } from '@/lib/platformData';

type FilterValue = 'all' | PriceFilter | BestForFilter | PrinterFilter | FileTypeFilter;

interface FilterState {
  price: ('all' | PriceFilter)[];
  bestFor: ('all' | BestForFilter)[];
  printer: ('all' | PrinterFilter)[];
  fileTypes: ('all' | FileTypeFilter)[];
}

interface FilterContextType {
  filters: FilterState;
  toggleFilter: (category: keyof FilterState, value: FilterValue) => void;
  clearFilters: () => void;
  clearCategory: (category: keyof FilterState) => void;
  hasActiveFilters: boolean;
  filteredPlatforms: PlatformData[];
  filteredCount: number;
  totalCount: number;
}

const defaultFilters: FilterState = {
  price: ['all'],
  bestFor: ['all'],
  printer: ['all'],
  fileTypes: ['all']
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const toggleFilter = useCallback((category: keyof FilterState, value: FilterValue) => {
    setFilters(prev => {
      const currentValues = prev[category];
      
      // If clicking "all", reset to just "all"
      if (value === 'all') {
        return { ...prev, [category]: ['all'] };
      }
      
      // Remove "all" if it's present and adding a specific filter
      let newValues = currentValues.filter(v => v !== 'all');
      
      // Toggle the specific value
      if (newValues.includes(value as any)) {
        newValues = newValues.filter(v => v !== value);
      } else {
        newValues = [...newValues, value as any];
      }
      
      // If no specific values, revert to "all"
      if (newValues.length === 0) {
        newValues = ['all'] as any;
      }
      
      return { ...prev, [category]: newValues };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const clearCategory = useCallback((category: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [category]: ['all'] }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      !filters.price.includes('all') ||
      !filters.bestFor.includes('all') ||
      !filters.printer.includes('all') ||
      !filters.fileTypes.includes('all')
    );
  }, [filters]);

  const filteredPlatforms = useMemo(() => {
    return platforms.filter(platform => {
      // Price filter (OR within category)
      const priceMatch = filters.price.includes('all') || 
        filters.price.includes(platform.priceFilter as any);
      
      // Best For filter (OR within category)
      const bestForMatch = filters.bestFor.includes('all') ||
        filters.bestFor.some(f => f !== 'all' && platform.bestForFilters.includes(f as BestForFilter));
      
      // Printer filter (OR within category)
      const printerMatch = filters.printer.includes('all') ||
        filters.printer.includes(platform.printerOptimization as any);
      
      // File Types filter (OR within category)
      const fileTypeMatch = filters.fileTypes.includes('all') ||
        filters.fileTypes.some(f => f !== 'all' && platform.fileTypeFilters.includes(f as FileTypeFilter));
      
      // AND between categories
      return priceMatch && bestForMatch && printerMatch && fileTypeMatch;
    });
  }, [filters]);

  const value = {
    filters,
    toggleFilter,
    clearFilters,
    clearCategory,
    hasActiveFilters,
    filteredPlatforms,
    filteredCount: filteredPlatforms.length,
    totalCount: platforms.length
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider');
  }
  return context;
};
