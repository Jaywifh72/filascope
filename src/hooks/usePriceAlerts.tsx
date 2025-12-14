import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "filascope_price_alerts";

interface PriceAlert {
  targetPrice: number;
  setAt: string;
}

type PriceAlerts = Record<string, PriceAlert>;

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlerts>({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAlerts(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Error loading price alerts:", err);
    }
  }, []);

  // Save to localStorage whenever alerts change
  const saveAlerts = useCallback((newAlerts: PriceAlerts) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAlerts));
      setAlerts(newAlerts);
    } catch (err) {
      console.error("Error saving price alerts:", err);
    }
  }, []);

  const setAlert = useCallback((filamentId: string, targetPrice: number) => {
    const newAlerts = {
      ...alerts,
      [filamentId]: {
        targetPrice,
        setAt: new Date().toISOString(),
      },
    };
    saveAlerts(newAlerts);
  }, [alerts, saveAlerts]);

  const removeAlert = useCallback((filamentId: string) => {
    const newAlerts = { ...alerts };
    delete newAlerts[filamentId];
    saveAlerts(newAlerts);
  }, [alerts, saveAlerts]);

  const hasAlert = useCallback((filamentId: string): boolean => {
    return filamentId in alerts;
  }, [alerts]);

  const getAlert = useCallback((filamentId: string): PriceAlert | null => {
    return alerts[filamentId] || null;
  }, [alerts]);

  return {
    alerts,
    setAlert,
    removeAlert,
    hasAlert,
    getAlert,
  };
}
