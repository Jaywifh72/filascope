import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { trackComparisonAdd } from "@/lib/analytics";
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
  unavailable?: boolean;
}

interface StoredComparison {
  items: CompareItem[];
  savedAt: number; // timestamp
}

type ActionType = 'add' | 'remove' | null;

interface CompareContextType {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  addItemSilent: (item: CompareItem) => void;
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
  // Multi-select mode
  isMultiSelectMode: boolean;
  setMultiSelectMode: (enabled: boolean) => void;
  pendingItems: CompareItem[];
  addToPending: (item: CompareItem) => void;
  removeFromPending: (id: string) => void;
  commitPendingItems: () => void;
  clearPendingItems: () => void;
  isPending: (id: string) => boolean;
  // Swap functionality
  pendingSwapItem: CompareItem | null;
  setPendingSwapItem: (item: CompareItem | null) => void;
  swapItem: (oldId: string, newItem: CompareItem) => void;
  // Restoration state
  isRestoring: boolean;
  restorationDate: Date | null;
  dismissRestoration: () => void;
  startFresh: () => void;
  // Restore from history
  restoreFromIds: (ids: string[], names: string[]) => void;
  // Duplicate pulse
  duplicatePulseId: string | null;
  // Mark item unavailable
  markItemUnavailable: (id: string) => void;
  // Storage warning
  storageWarning: boolean;
  clearOldData: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const STORAGE_KEY = "filascope_compare_items";
const MAX_ITEMS = 6;
const EXPIRY_DAYS = 7;
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

export function CompareProvider({ children }: { children: ReactNode }) {
  // Restoration state
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorationDate, setRestorationDate] = useState<Date | null>(null);
  const hasCheckedStorage = useRef(false);

  const [items, setItems] = useState<CompareItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredComparison = JSON.parse(stored);
        // Check if new format with timestamp
        if (parsed.savedAt && Array.isArray(parsed.items)) {
          const ageInDays = (Date.now() - parsed.savedAt) / (1000 * 60 * 60 * 24);
          if (ageInDays > EXPIRY_DAYS) {
            localStorage.removeItem(STORAGE_KEY);
            return [];
          }
          return parsed.items.slice(0, MAX_ITEMS);
        }
        // Legacy format - just array
        if (Array.isArray(parsed)) {
          return parsed.slice(0, MAX_ITEMS);
        }
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

  // Multi-select mode state
  const [isMultiSelectMode, setMultiSelectMode] = useState(false);
  const [pendingItems, setPendingItems] = useState<CompareItem[]>([]);

  // Swap functionality state
  const [pendingSwapItem, setPendingSwapItem] = useState<CompareItem | null>(null);

  // Duplicate pulse state
  const [duplicatePulseId, setDuplicatePulseId] = useState<string | null>(null);

  // Storage warning state
  const [storageWarning, setStorageWarning] = useState(false);

  // Track if this is the first item being added (for tray entrance animation)
  const isFirstItem = prevCountRef.current === 0 && items.length === 1;

  const triggerGlow = useCallback(() => {
    setIsGlowing(true);
    setTimeout(() => setIsGlowing(false), 600);
  }, []);

  // Check for restoration on mount
  useEffect(() => {
    if (hasCheckedStorage.current) return;
    hasCheckedStorage.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredComparison = JSON.parse(stored);
        if (parsed.savedAt && parsed.items?.length > 0) {
          setRestorationDate(new Date(parsed.savedAt));
          setIsRestoring(true);
          // Auto-dismiss after 5 seconds
          setTimeout(() => setIsRestoring(false), 5000);
        }
      }
    } catch (e) {
      console.error("Failed to check restoration:", e);
    }
  }, []);

  // Save to storage with error handling
  const saveToStorage = useCallback((data: StoredComparison) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStorageWarning(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        setStorageWarning(true);
        toast.warning("Storage full", {
          description: "Some data may not persist. Clear old data to fix.",
        });
        // Fallback to sessionStorage
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
          console.error("Both localStorage and sessionStorage are full");
        }
      }
    }
  }, []);

  // Clear old data
  const clearOldData = useCallback(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('filascope_') && k !== STORAGE_KEY)
      .forEach(k => localStorage.removeItem(k));
    setStorageWarning(false);
    toast.success("Old data cleared");
  }, []);

  // Auto-save with timestamp - ALWAYS sync to storage, even when empty
  useEffect(() => {
    const saveWithTimestamp = () => {
      if (items.length === 0) {
        // Clear storage when no items
        try {
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(STORAGE_KEY);
        } catch (e) {
          console.error("Failed to clear compare storage:", e);
        }
      } else {
        // Save items with timestamp
        const data: StoredComparison = {
          items,
          savedAt: Date.now()
        };
        saveToStorage(data);
      }
    };

    // Save immediately on change
    saveWithTimestamp();

    // Also save periodically (only if items exist)
    if (items.length > 0) {
      const interval = setInterval(saveWithTimestamp, AUTO_SAVE_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [items, saveToStorage]);

  const dismissRestoration = useCallback(() => {
    setIsRestoring(false);
  }, []);

  const startFresh = useCallback(() => {
    setItems([]);
    setIsRestoring(false);
    localStorage.removeItem(STORAGE_KEY);
    toast.info("Started fresh comparison");
  }, []);

  const restoreFromIds = useCallback((ids: string[], names: string[]) => {
    // Create minimal items from IDs and names
    const restoredItems: CompareItem[] = ids.map((id, index) => ({
      id,
      product_title: names[index] || "Unknown",
      vendor: null,
      material: null,
      color_hex: null,
      variant_price: null,
      net_weight_g: null,
    }));
    setItems(restoredItems.slice(0, MAX_ITEMS));
    setIsExpanded(true);
    toast.success("Comparison restored!");
  }, []);

  const addItem = useCallback((item: CompareItem) => {
    setItems(prev => {
      if (prev.length >= MAX_ITEMS) {
        // Instead of error, trigger swap modal
        setPendingSwapItem(item);
        return prev;
      }
      if (prev.some(i => i.id === item.id)) {
        // Duplicate - show toast and trigger pulse
        toast.info("Already in compare", {
          description: item.product_title,
        });
        setDuplicatePulseId(item.id);
        setTimeout(() => setDuplicatePulseId(null), 600);
        return prev;
      }

      const newCount = prev.length + 1;
      trackComparisonAdd(item.id, 'filament', item.product_title, newCount);
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

  // Mark an item as unavailable
  const markItemUnavailable = useCallback((id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, unavailable: true } : item
    ));
  }, []);

  // Silent add for multi-select mode (no toast, no animation)
  const addItemSilent = useCallback((item: CompareItem) => {
    setItems(prev => {
      if (prev.length >= MAX_ITEMS) return prev;
      if (prev.some(i => i.id === item.id)) return prev;
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

  // Multi-select pending items functions
  const addToPending = useCallback((item: CompareItem) => {
    setPendingItems(prev => {
      if (prev.some(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeFromPending = useCallback((id: string) => {
    setPendingItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const isPending = useCallback((id: string) => {
    return pendingItems.some(i => i.id === id);
  }, [pendingItems]);

  const commitPendingItems = useCallback(() => {
    if (pendingItems.length === 0) return;

    const availableSlots = MAX_ITEMS - items.length;
    const itemsToAdd = pendingItems.slice(0, availableSlots);
    
    if (itemsToAdd.length > 0) {
      setItems(prev => {
        const newItems = [...prev];
        itemsToAdd.forEach(item => {
          if (!newItems.some(i => i.id === item.id)) {
            newItems.push(item);
          }
        });
        return newItems.slice(0, MAX_ITEMS);
      });
      
      toast.success(`${itemsToAdd.length} material${itemsToAdd.length > 1 ? 's' : ''} added to compare`);
      setIsExpanded(true);
      setLastAction('add');
      setTimeout(() => setLastAction(null), 400);
    }
    
    setPendingItems([]);
  }, [pendingItems, items.length]);

  const clearPendingItems = useCallback(() => {
    setPendingItems([]);
  }, []);

  // Swap item function
  const swapItem = useCallback((oldId: string, newItem: CompareItem) => {
    setItems(prev => {
      const index = prev.findIndex(i => i.id === oldId);
      if (index === -1) return prev;
      
      const newItems = [...prev];
      newItems[index] = newItem;
      return newItems;
    });
    
    setPendingSwapItem(null);
    toast.success(`Swapped material`, {
      description: newItem.product_title,
    });
    setLastAction('add');
    setNewItemId(newItem.id);
    setTimeout(() => setNewItemId(null), 500);
    setTimeout(() => setLastAction(null), 400);
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
    addItemSilent,
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
    // Multi-select
    isMultiSelectMode,
    setMultiSelectMode,
    pendingItems,
    addToPending,
    removeFromPending,
    commitPendingItems,
    clearPendingItems,
    isPending,
    // Swap
    pendingSwapItem,
    setPendingSwapItem,
    swapItem,
    // Restoration
    isRestoring,
    restorationDate,
    dismissRestoration,
    startFresh,
    restoreFromIds,
    // Duplicate pulse
    duplicatePulseId,
    // Unavailable
    markItemUnavailable,
    // Storage
    storageWarning,
    clearOldData,
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
