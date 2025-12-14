import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
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

type ActionType = 'add' | 'remove' | null;

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
  // Fly animation support
  trayElement: HTMLElement | null;
  setTrayElement: (el: HTMLElement | null) => void;
  isGlowing: boolean;
  triggerGlow: () => void;
  // Action tracking for animations
  lastAction: ActionType;
  // Drag and drop reordering
  reorderItems: (fromIndex: number, toIndex: number) => void;
  // New item tracking for bounce animation
  newItemId: string | null;
  // First item tracking for tray entrance
  isFirstItem: boolean;
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
  const [trayElement, setTrayElement] = useState<HTMLElement | null>(null);
  const [isGlowing, setIsGlowing] = useState(false);
  const [lastAction, setLastAction] = useState<ActionType>(null);
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const prevCountRef = useRef(items.length);

  // Track if this is the first item being added (for tray entrance animation)
  const isFirstItem = prevCountRef.current === 0 && items.length === 1;

  const triggerGlow = useCallback(() => {
    setIsGlowing(true);
    setTimeout(() => setIsGlowing(false), 600);
  }, []);

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
      setLastAction('add');
      setNewItemId(item.id);
      
      // Clear new item ID after animation
      setTimeout(() => setNewItemId(null), 500);
      // Clear action after animation
      setTimeout(() => setLastAction(null), 400);
      
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
      setLastAction('remove');
      setTimeout(() => setLastAction(null), 400);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setLastAction('remove');
    setTimeout(() => setLastAction(null), 400);
    toast.info("Cleared all items from comparison");
  }, []);

  const reorderItems = useCallback((fromIndex: number, toIndex: number) => {
    setItems(prev => {
      const newItems = [...prev];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      return newItems;
    });
  }, []);

  // Update prev count ref
  useEffect(() => {
    prevCountRef.current = items.length;
  }, [items.length]);

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
    trayElement,
    setTrayElement,
    isGlowing,
    triggerGlow,
    lastAction,
    reorderItems,
    newItemId,
    isFirstItem,
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
