import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export interface BrandCompareItem {
  name: string;
  logoUrl: string | null;
  productCount: number;
  materials: string[];
  avgPricePerKg: number | null;
  rating: number | null;
  hasHighSpeed: boolean;
}

interface BrandCompareContextType {
  selectedBrands: BrandCompareItem[];
  addBrand: (brand: BrandCompareItem) => void;
  removeBrand: (name: string) => void;
  clearAll: () => void;
  isSelected: (name: string) => boolean;
  isMaxReached: boolean;
  count: number;
  maxBrands: number;
  recentlyAdded: Set<string>;
}

const BrandCompareContext = createContext<BrandCompareContextType | undefined>(undefined);

const MAX_BRANDS = 3;
const STORAGE_KEY = 'brand-compare-selection';

export function BrandCompareProvider({ children }: { children: React.ReactNode }) {
  const [selectedBrands, setSelectedBrands] = useState<BrandCompareItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedBrands));
  }, [selectedBrands]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const addBrand = useCallback((brand: BrandCompareItem) => {
    if (selectedBrands.length >= MAX_BRANDS) {
      toast.error(`Maximum of ${MAX_BRANDS} brands can be compared`);
      return;
    }
    
    if (selectedBrands.some(b => b.name === brand.name)) {
      toast.info(`${brand.name} is already in comparison`);
      return;
    }

    setSelectedBrands(prev => [...prev, brand]);
    
    // Add to recently added for animation
    setRecentlyAdded(prev => new Set(prev).add(brand.name));
    
    // Clear the recently added state after animation
    const timeout = setTimeout(() => {
      setRecentlyAdded(prev => {
        const next = new Set(prev);
        next.delete(brand.name);
        return next;
      });
    }, 2000);
    
    timeoutRefs.current.set(brand.name, timeout);
    
    toast.success(`Added ${brand.name} to comparison`, {
      action: {
        label: 'Compare Now',
        onClick: () => {
          window.location.href = '/brands/compare';
        },
      },
    });
  }, [selectedBrands]);

  const removeBrand = useCallback((name: string) => {
    setSelectedBrands(prev => prev.filter(b => b.name !== name));
    
    // Clear any pending timeout
    const timeout = timeoutRefs.current.get(name);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(name);
    }
    
    toast.info(`Removed ${name} from comparison`);
  }, []);

  const clearAll = useCallback(() => {
    setSelectedBrands([]);
    setRecentlyAdded(new Set());
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
    toast.info('Cleared brand comparison');
  }, []);

  const isSelected = useCallback((name: string) => {
    return selectedBrands.some(b => b.name === name);
  }, [selectedBrands]);

  return (
    <BrandCompareContext.Provider
      value={{
        selectedBrands,
        addBrand,
        removeBrand,
        clearAll,
        isSelected,
        isMaxReached: selectedBrands.length >= MAX_BRANDS,
        count: selectedBrands.length,
        maxBrands: MAX_BRANDS,
        recentlyAdded,
      }}
    >
      {children}
    </BrandCompareContext.Provider>
  );
}

export function useBrandCompare() {
  const context = useContext(BrandCompareContext);
  if (context === undefined) {
    throw new Error('useBrandCompare must be used within a BrandCompareProvider');
  }
  return context;
}
