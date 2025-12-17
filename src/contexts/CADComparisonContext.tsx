import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { PriceType, SkillLevel } from '@/components/reference/CADBadges';

export interface SelectedCADSoftware {
  id: string;
  name: string;
  logo?: string;
  priceType: PriceType;
  priceValue?: string;
  overallScore: number;
  skillLevel: SkillLevel;
  type: string;
  os: string;
  ease: number;
  precision: number;
  sculpt: number;
  printReady: number;
  parametric: number;
  cloud: string;
  perpetual: string;
  standout: string;
}

interface CADComparisonContextType {
  selectedSoftware: SelectedCADSoftware[];
  addSoftware: (software: SelectedCADSoftware) => void;
  removeSoftware: (id: string) => void;
  clearAll: () => void;
  isInComparison: (id: string) => boolean;
  isComparisonOpen: boolean;
  openComparison: () => void;
  closeComparison: () => void;
  maxSoftware: number;
  canAddMore: boolean;
  canCompare: boolean;
  announcement: string;
  previousFocusRef: React.RefObject<HTMLElement>;
}

const CADComparisonContext = createContext<CADComparisonContextType | null>(null);

export const CADComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSoftware, setSelectedSoftware] = useState<SelectedCADSoftware[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const previousFocusRef = useRef<HTMLElement>(null);
  const maxSoftware = 4;
  const minSoftware = 2;

  const addSoftware = useCallback((software: SelectedCADSoftware) => {
    setSelectedSoftware(prev => {
      if (prev.length >= maxSoftware) {
        toast.error(`Maximum ${maxSoftware} items can be compared at once`);
        return prev;
      }
      
      if (prev.find(s => s.id === software.id)) {
        toast.info(`${software.name} is already in comparison`);
        return prev;
      }
      
      toast.success(`Added ${software.name} to comparison`);
      const newCount = prev.length + 1;
      setAnnouncement(`${software.name} added to comparison. ${newCount} item${newCount !== 1 ? 's' : ''} selected.`);
      return [...prev, software];
    });
  }, [maxSoftware]);

  const removeSoftware = useCallback((id: string) => {
    setSelectedSoftware(prev => {
      const software = prev.find(s => s.id === id);
      if (software) {
        toast.info(`Removed ${software.name} from comparison`);
        const newCount = prev.length - 1;
        setAnnouncement(`${software.name} removed from comparison. ${newCount} item${newCount !== 1 ? 's' : ''} remaining.`);
      }
      return prev.filter(s => s.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedSoftware([]);
    toast.info('Cleared all items from comparison');
    setAnnouncement('Comparison cleared.');
  }, []);

  const isInComparison = useCallback((id: string) => {
    return selectedSoftware.some(s => s.id === id);
  }, [selectedSoftware]);

  const openComparison = useCallback(() => {
    if (selectedSoftware.length >= minSoftware) {
      // Store current focus before opening modal
      previousFocusRef.current = document.activeElement as HTMLElement;
      setIsComparisonOpen(true);
    } else {
      toast.error(`Select at least ${minSoftware} items to compare`);
    }
  }, [selectedSoftware.length]);

  const closeComparison = useCallback(() => {
    setIsComparisonOpen(false);
    // Return focus to the element that opened the modal
    setTimeout(() => {
      previousFocusRef.current?.focus();
    }, 0);
  }, []);

  const canAddMore = selectedSoftware.length < maxSoftware;
  const canCompare = selectedSoftware.length >= minSoftware;

  return (
    <CADComparisonContext.Provider
      value={{
        selectedSoftware,
        addSoftware,
        removeSoftware,
        clearAll,
        isInComparison,
        isComparisonOpen,
        openComparison,
        closeComparison,
        maxSoftware,
        canAddMore,
        canCompare,
        announcement,
        previousFocusRef,
      }}
    >
      {children}
    </CADComparisonContext.Provider>
  );
};

export const useCADComparison = () => {
  const context = useContext(CADComparisonContext);
  if (!context) {
    throw new Error('useCADComparison must be used within CADComparisonProvider');
  }
  return context;
};
