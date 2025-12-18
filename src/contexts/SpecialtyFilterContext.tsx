import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { SpecialtyTool } from '@/lib/specialtyData';

export interface SpecialtyFilterState {
  category: string[];
  pricing: string[];
  skillLevel: string[];
  useCase: string[];
}

interface SpecialtyFilterContextType {
  filters: SpecialtyFilterState;
  toggleFilter: (group: keyof SpecialtyFilterState, value: string) => void;
  clearFilters: () => void;
  clearGroup: (group: keyof SpecialtyFilterState) => void;
  isFilterActive: (group: keyof SpecialtyFilterState, value: string) => boolean;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  filteredTools: SpecialtyTool[];
  totalCount: number;
}

const SpecialtyFilterContext = createContext<SpecialtyFilterContextType | undefined>(undefined);

const initialFilterState: SpecialtyFilterState = {
  category: [],
  pricing: [],
  skillLevel: [],
  useCase: []
};

interface SpecialtyFilterProviderProps {
  children: React.ReactNode;
  tools: SpecialtyTool[];
}

export const SpecialtyFilterProvider: React.FC<SpecialtyFilterProviderProps> = ({ 
  children, 
  tools 
}) => {
  const [filters, setFilters] = useState<SpecialtyFilterState>(initialFilterState);

  const toggleFilter = useCallback((group: keyof SpecialtyFilterState, value: string) => {
    setFilters(prev => {
      const currentValues = prev[group];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [group]: newValues };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  const clearGroup = useCallback((group: keyof SpecialtyFilterState) => {
    setFilters(prev => ({
      ...prev,
      [group]: []
    }));
  }, []);

  const isFilterActive = useCallback((group: keyof SpecialtyFilterState, value: string) => {
    return filters[group].includes(value);
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).flat().length;
  }, [filters]);

  const hasActiveFilters = useMemo(() => {
    return activeFilterCount > 0;
  }, [activeFilterCount]);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      // Category filter (OR within group)
      if (filters.category.length > 0) {
        if (!filters.category.includes(tool.category)) return false;
      }
      
      // Pricing filter (OR within group)
      if (filters.pricing.length > 0) {
        if (!filters.pricing.includes(tool.pricingModel)) return false;
      }
      
      // Skill level filter (OR within group, tool can match any selected)
      if (filters.skillLevel.length > 0) {
        const toolSkillLevels = tool.skillLevel || [];
        const hasMatchingSkill = filters.skillLevel.some(
          skill => toolSkillLevels.includes(skill as any)
        );
        if (!hasMatchingSkill) return false;
      }
      
      // Use case filter (OR within group, tool can match any selected)
      if (filters.useCase.length > 0) {
        const toolUseCases = tool.useCase || [];
        const hasMatchingUseCase = filters.useCase.some(
          useCase => toolUseCases.includes(useCase as any)
        );
        if (!hasMatchingUseCase) return false;
      }
      
      return true;
    });
  }, [tools, filters]);

  const value: SpecialtyFilterContextType = {
    filters,
    toggleFilter,
    clearFilters,
    clearGroup,
    isFilterActive,
    activeFilterCount,
    hasActiveFilters,
    filteredTools,
    totalCount: tools.length
  };

  return (
    <SpecialtyFilterContext.Provider value={value}>
      {children}
    </SpecialtyFilterContext.Provider>
  );
};

export const useSpecialtyFilters = () => {
  const context = useContext(SpecialtyFilterContext);
  if (!context) {
    throw new Error('useSpecialtyFilters must be used within SpecialtyFilterProvider');
  }
  return context;
};
