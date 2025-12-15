import { useCallback, useMemo } from "react";
import { analyzeSearchContext, SEARCH_INTENT_MAP } from "@/lib/personalizationEngine";

const SEARCH_HISTORY_KEY = "filascope_search_history";
const MAX_SEARCHES = 10;

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export function useSearchContext() {
  // Get recent searches from localStorage
  const recentSearches = useMemo(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (!stored) return [];
      
      const items: SearchHistoryItem[] = JSON.parse(stored);
      
      // Filter to last 24 hours
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return items
        .filter((item) => item.timestamp > oneDayAgo)
        .map((item) => item.query);
    } catch {
      return [];
    }
  }, []);

  // Track a new search
  const trackSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      const items: SearchHistoryItem[] = stored ? JSON.parse(stored) : [];

      // Add new search
      items.unshift({
        query: query.trim().toLowerCase(),
        timestamp: Date.now(),
      });

      // Keep only recent searches
      const trimmed = items.slice(0, MAX_SEARCHES);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(trimmed));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Analyze current search context
  const searchAnalysis = useMemo(() => {
    return analyzeSearchContext(recentSearches);
  }, [recentSearches]);

  // Get detected intents as readable strings
  const detectedIntents = useMemo(() => {
    return searchAnalysis.matchedIntents.map((intent) => intent.context);
  }, [searchAnalysis]);

  // Check if a material gets a boost from search context
  const getMaterialBoost = useCallback(
    (material: string | null): number => {
      if (!material) return 0;
      const baseMaterial = material.split(/[\s-]/)[0].toUpperCase();
      return searchAnalysis.materialBoosts[baseMaterial] || 0;
    },
    [searchAnalysis]
  );

  // Check if search matches any intent keywords
  const matchesSearchIntent = useCallback(
    (material: string | null): boolean => {
      if (!material) return false;
      const baseMaterial = material.split(/[\s-]/)[0].toUpperCase();
      
      for (const intent of searchAnalysis.matchedIntents) {
        if (intent.boostMaterials.includes(baseMaterial)) {
          return true;
        }
      }
      return false;
    },
    [searchAnalysis]
  );

  // Get a description of why a material matches
  const getSearchMatchReason = useCallback(
    (material: string | null): string | null => {
      if (!material) return null;
      const baseMaterial = material.split(/[\s-]/)[0].toUpperCase();
      
      for (const intent of searchAnalysis.matchedIntents) {
        if (intent.boostMaterials.includes(baseMaterial)) {
          return `Matches your "${intent.context.replace("_", " ")}" search`;
        }
      }
      return null;
    },
    [searchAnalysis]
  );

  return {
    recentSearches,
    trackSearch,
    detectedIntents,
    materialBoosts: searchAnalysis.materialBoosts,
    getMaterialBoost,
    matchesSearchIntent,
    getSearchMatchReason,
  };
}
