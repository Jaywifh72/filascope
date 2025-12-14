import { useState, useEffect, useCallback } from "react";

interface ComparisonHistoryItem {
  id: string;
  filamentIds: string[];
  filamentNames: string[];
  createdAt: Date;
}

const HISTORY_KEY = "filascope_comparison_history";
const MAX_HISTORY = 5;

export function useComparisonHistory() {
  const [history, setHistory] = useState<ComparisonHistoryItem[]>([]);

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed.map((h: any) => ({
          ...h,
          createdAt: new Date(h.createdAt)
        })));
      }
    } catch (e) {
      console.error("Failed to load comparison history:", e);
    }
  }, []);

  // Save comparison to history
  const saveToHistory = useCallback((filamentIds: string[], filamentNames: string[]) => {
    if (filamentIds.length < 2) return;

    const newItem: ComparisonHistoryItem = {
      id: crypto.randomUUID(),
      filamentIds,
      filamentNames,
      createdAt: new Date()
    };

    setHistory(prev => {
      // Check if same comparison already exists (same IDs)
      const sameComparison = prev.find(
        h => h.filamentIds.sort().join(',') === filamentIds.sort().join(',')
      );
      
      let newHistory: ComparisonHistoryItem[];
      if (sameComparison) {
        // Move to top
        newHistory = [
          { ...sameComparison, createdAt: new Date() },
          ...prev.filter(h => h.id !== sameComparison.id)
        ];
      } else {
        newHistory = [newItem, ...prev].slice(0, MAX_HISTORY);
      }

      // Save to localStorage
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (e) {
        console.error("Failed to save comparison history:", e);
      }

      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  return {
    history,
    saveToHistory,
    clearHistory
  };
}
