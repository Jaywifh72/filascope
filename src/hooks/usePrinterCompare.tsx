import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { toast } from "sonner";

export interface PrinterCompareItem {
  id: string;
  name: string;
  imageUrl: string | null;
  brand: string | null;
}

interface PrinterCompareContextType {
  selectedPrinters: PrinterCompareItem[];
  addPrinter: (printer: PrinterCompareItem) => void;
  removePrinter: (id: string) => void;
  clearAll: () => void;
  isSelected: (id: string) => boolean;
  isMaxReached: boolean;
  count: number;
  maxPrinters: number;
  recentlyAdded: Set<string>;
}

const STORAGE_KEY = "filascope_printer_compare";
const MAX_PRINTERS = 5;

const PrinterCompareContext = createContext<PrinterCompareContextType | undefined>(undefined);

export function PrinterCompareProvider({ children }: { children: ReactNode }) {
  const [selectedPrinters, setSelectedPrinters] = useState<PrinterCompareItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Failed to parse printer compare data from localStorage:", e);
    }
    return [];
  });

  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedPrinters));
    } catch (e) {
      console.error("Failed to save printer compare data to localStorage:", e);
    }
  }, [selectedPrinters]);

  const addPrinter = useCallback((printer: PrinterCompareItem) => {
    setSelectedPrinters((prev) => {
      if (prev.length >= MAX_PRINTERS) {
        toast.warning("Maximum 5 printers can be compared at once");
        return prev;
      }
      if (prev.some((p) => p.id === printer.id)) {
        return prev;
      }
      
      // Track recently added for animation
      setRecentlyAdded((prevSet) => new Set(prevSet).add(printer.id));
      
      // Clear any existing timeout for this printer
      const existingTimeout = timeoutsRef.current.get(printer.id);
      if (existingTimeout) clearTimeout(existingTimeout);
      
      // Remove from recentlyAdded after animation
      const timeout = setTimeout(() => {
        setRecentlyAdded((prevSet) => {
          const newSet = new Set(prevSet);
          newSet.delete(printer.id);
          return newSet;
        });
        timeoutsRef.current.delete(printer.id);
      }, 1500);
      timeoutsRef.current.set(printer.id, timeout);
      
      toast.success(`${printer.name} added to comparison`);
      return [...prev, printer];
    });
  }, []);

  const removePrinter = useCallback((id: string) => {
    setSelectedPrinters((prev) => {
      const printer = prev.find((p) => p.id === id);
      if (printer) {
        toast.info(`${printer.name} removed from comparison`);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedPrinters([]);
    toast.info("Comparison cleared");
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedPrinters.some((p) => p.id === id),
    [selectedPrinters]
  );

  const value: PrinterCompareContextType = {
    selectedPrinters,
    addPrinter,
    removePrinter,
    clearAll,
    isSelected,
    isMaxReached: selectedPrinters.length >= MAX_PRINTERS,
    count: selectedPrinters.length,
    maxPrinters: MAX_PRINTERS,
    recentlyAdded,
  };

  return (
    <PrinterCompareContext.Provider value={value}>
      {children}
    </PrinterCompareContext.Provider>
  );
}

export function usePrinterCompare() {
  const context = useContext(PrinterCompareContext);
  if (context === undefined) {
    throw new Error("usePrinterCompare must be used within a PrinterCompareProvider");
  }
  return context;
}
