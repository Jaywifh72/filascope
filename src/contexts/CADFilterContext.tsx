import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

interface CADFilterState {
  price: string[];
  level: string[];
  platform: string[];
}

interface CADSoftware {
  name: string;
  priceType: string;
  skillLevel: string;
  os: string;
  [key: string]: any;
}

interface CADFilterContextType {
  filters: CADFilterState;
  toggleFilter: (category: keyof CADFilterState, value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  filteredCount: number;
  totalCount: number;
  getFilteredData: <T extends CADSoftware>(data: T[]) => T[];
}

const defaultFilters: CADFilterState = {
  price: ['all'],
  level: ['all'],
  platform: ['all']
};

const CADFilterContext = createContext<CADFilterContextType | undefined>(undefined);

// Helper to parse platforms from OS string
const parsePlatforms = (os: string): string[] => {
  const platforms: string[] = [];
  const osLower = os.toLowerCase();
  
  if (osLower.includes('win')) platforms.push('windows');
  if (osLower.includes('mac')) platforms.push('mac');
  if (osLower.includes('lin')) platforms.push('linux');
  if (osLower.includes('browser')) platforms.push('browser');
  if (osLower.includes('ipad') || osLower.includes('android')) platforms.push('mobile');
  
  return platforms;
};

// Helper to normalize price type
const normalizePriceType = (priceType: string): string => {
  const lower = priceType.toLowerCase();
  if (lower === 'free') return 'free';
  if (lower === 'freemium') return 'freemium';
  // subscription, perpetual, paid, one-time all map to 'paid'
  return 'paid';
};

export const CADFilterProvider: React.FC<{ 
  children: React.ReactNode;
  softwareData: CADSoftware[];
}> = ({ children, softwareData }) => {
  const [filters, setFilters] = useState<CADFilterState>(defaultFilters);

  const toggleFilter = useCallback((category: keyof CADFilterState, value: string) => {
    setFilters(prev => {
      const currentValues = prev[category];
      
      // If clicking "all", reset to all
      if (value === 'all') {
        return { ...prev, [category]: ['all'] };
      }
      
      // If "all" is currently selected, replace with the clicked value
      if (currentValues.includes('all')) {
        return { ...prev, [category]: [value] };
      }
      
      // Toggle the value
      let newValues: string[];
      if (currentValues.includes(value)) {
        // Remove the value
        newValues = currentValues.filter(v => v !== value);
        // If no values left, reset to "all"
        if (newValues.length === 0) {
          newValues = ['all'];
        }
      } else {
        // Add the value
        newValues = [...currentValues, value];
      }
      
      return { ...prev, [category]: newValues };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !filters.price.includes('all') || 
           !filters.level.includes('all') || 
           !filters.platform.includes('all');
  }, [filters]);

  const getFilteredData = useCallback(<T extends CADSoftware>(data: T[]): T[] => {
    return data.filter(software => {
      // Price filter
      if (!filters.price.includes('all')) {
        const normalizedPrice = normalizePriceType(software.priceType);
        if (!filters.price.includes(normalizedPrice)) {
          return false;
        }
      }
      
      // Level filter
      if (!filters.level.includes('all')) {
        if (!filters.level.includes(software.skillLevel.toLowerCase())) {
          return false;
        }
      }
      
      // Platform filter (OR logic - software must support at least one selected platform)
      if (!filters.platform.includes('all')) {
        const softwarePlatforms = parsePlatforms(software.os);
        const hasMatchingPlatform = filters.platform.some(platform => 
          softwarePlatforms.includes(platform)
        );
        if (!hasMatchingPlatform) {
          return false;
        }
      }
      
      return true;
    });
  }, [filters]);

  const filteredData = useMemo(() => 
    getFilteredData(softwareData), 
    [getFilteredData, softwareData]
  );

  const filteredCount = filteredData.length;
  const totalCount = softwareData.length;

  return (
    <CADFilterContext.Provider
      value={{
        filters,
        toggleFilter,
        clearFilters,
        hasActiveFilters,
        filteredCount,
        totalCount,
        getFilteredData
      }}
    >
      {children}
    </CADFilterContext.Provider>
  );
};

export const useCADFilters = () => {
  const context = useContext(CADFilterContext);
  if (!context) {
    throw new Error('useCADFilters must be used within CADFilterProvider');
  }
  return context;
};
