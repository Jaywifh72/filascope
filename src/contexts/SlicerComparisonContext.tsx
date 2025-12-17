import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { SlicerTierInfo, PriceType } from '@/lib/slicerTierData';

export interface SelectedSlicer {
  id: string;
  name: string;
  logo?: string;
  brand: string;
  priceType: PriceType;
  priceValue?: string;
  overallScore: number;
  platforms: string[];
  multiMaterial: boolean;
  topFeatures: string[];
}

interface SlicerComparisonContextType {
  selectedSlicers: SelectedSlicer[];
  addSlicer: (slicer: SelectedSlicer) => void;
  removeSlicer: (id: string) => void;
  clearAll: () => void;
  isInComparison: (id: string) => boolean;
  isComparisonOpen: boolean;
  openComparison: () => void;
  closeComparison: () => void;
  maxSlicers: number;
}

const SlicerComparisonContext = createContext<SlicerComparisonContextType | null>(null);

export const SlicerComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSlicers, setSelectedSlicers] = useState<SelectedSlicer[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const maxSlicers = 4;

  const addSlicer = useCallback((slicer: SelectedSlicer) => {
    setSelectedSlicers(prev => {
      if (prev.length >= maxSlicers) {
        toast.error(`Maximum ${maxSlicers} slicers can be compared at once`);
        return prev;
      }
      
      if (prev.find(s => s.id === slicer.id)) {
        toast.info(`${slicer.name} is already in comparison`);
        return prev;
      }
      
      toast.success(`Added ${slicer.name} to comparison`);
      return [...prev, slicer];
    });
  }, [maxSlicers]);

  const removeSlicer = useCallback((id: string) => {
    setSelectedSlicers(prev => {
      const slicer = prev.find(s => s.id === id);
      if (slicer) {
        toast.info(`Removed ${slicer.name} from comparison`);
      }
      return prev.filter(s => s.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedSlicers([]);
    toast.info('Cleared all slicers from comparison');
  }, []);

  const isInComparison = useCallback((id: string) => {
    return selectedSlicers.some(s => s.id === id);
  }, [selectedSlicers]);

  const openComparison = useCallback(() => {
    if (selectedSlicers.length >= 2) {
      setIsComparisonOpen(true);
    } else {
      toast.error('Select at least 2 slicers to compare');
    }
  }, [selectedSlicers.length]);

  const closeComparison = useCallback(() => {
    setIsComparisonOpen(false);
  }, []);

  return (
    <SlicerComparisonContext.Provider
      value={{
        selectedSlicers,
        addSlicer,
        removeSlicer,
        clearAll,
        isInComparison,
        isComparisonOpen,
        openComparison,
        closeComparison,
        maxSlicers,
      }}
    >
      {children}
    </SlicerComparisonContext.Provider>
  );
};

export const useSlicerComparison = () => {
  const context = useContext(SlicerComparisonContext);
  if (!context) {
    throw new Error('useSlicerComparison must be used within SlicerComparisonProvider');
  }
  return context;
};

// Helper to convert SlicerTierInfo to SelectedSlicer
export const slicerTierInfoToSelectedSlicer = (slicer: SlicerTierInfo, logo?: string): SelectedSlicer => ({
  id: slicer.name.toLowerCase().replace(/\s+/g, '-'),
  name: slicer.name,
  logo,
  brand: slicer.brand,
  priceType: slicer.priceType,
  priceValue: slicer.priceValue,
  overallScore: slicer.overallScore,
  platforms: slicer.platforms,
  multiMaterial: slicer.multiMaterial,
  topFeatures: slicer.topFeatures,
});
