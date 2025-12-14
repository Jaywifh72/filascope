import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { toast } from "sonner";

export interface CompareItem {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  color_hex: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  featured_image?: string | null;
}

interface CompareContextType {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  isInCompare: (id: string) => boolean;
  isFull: boolean;
  count: number;
  maxItems: number;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const STORAGE_KEY = "filascope_compare_items";
const MAX_ITEMS = 4;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
      }
    } catch (e) {
      console.error("Failed to parse compare items from localStorage:", e);
    }
    return [];
  });
  
  const [isExpanded, setIsExpanded] = useState(true);

  // Sync to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save compare items to localStorage:", e);
    }
  }, [items]);

  const addItem = useCallback((item: CompareItem) => {
    setItems(prev => {
      if (prev.length >= MAX_ITEMS) {
        toast.error("Compare tray is full", {
          description: "Remove an item first to add a new one",
        });
        return prev;
      }
      if (prev.some(i => i.id === item.id)) {
        return prev;
      }
      
      toast.success(`Added to comparison`, {
        description: item.product_title,
      });
      
      // Expand tray when item is added
      setIsExpanded(true);
      
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) {
        toast.info("Removed from comparison", {
          description: item.product_title,
        });
      }
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    toast.info("Cleared all items from comparison");
  }, []);

  const isInCompare = useCallback((id: string) => {
    return items.some(i => i.id === id);
  }, [items]);

  const value: CompareContextType = {
    items,
    addItem,
    removeItem,
    clearAll,
    isInCompare,
    isFull: items.length >= MAX_ITEMS,
    count: items.length,
    maxItems: MAX_ITEMS,
    isExpanded,
    setIsExpanded,
  };

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
