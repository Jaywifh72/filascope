import { useState, useEffect, useCallback } from "react";
import { useTrendingMaterials } from "./useTrendingMaterials";

const VIEWED_TRENDS_KEY = "filascope_viewed_trends";

interface ViewedTrend {
  id: string;
  viewedAt: number;
}

export function useTrendingPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'week' | 'month' | 'all-time'>('week');
  const [viewedTrendIds, setViewedTrendIds] = useState<string[]>([]);
  
  const { activeTrends, predictions, isLoading, error } = useTrendingMaterials();
  
  // Load viewed trends from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEWED_TRENDS_KEY);
      if (stored) {
        const parsed: ViewedTrend[] = JSON.parse(stored);
        // Keep only trends viewed in last 7 days
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recent = parsed.filter(t => t.viewedAt > weekAgo);
        setViewedTrendIds(recent.map(t => t.id));
      }
    } catch (e) {
      console.error("Failed to load viewed trends:", e);
    }
  }, []);
  
  // Calculate new trend count
  const newTrendCount = activeTrends.filter(
    trend => !viewedTrendIds.includes(trend.id)
  ).length;
  
  // Mark trends as viewed when panel opens
  const markTrendsAsViewed = useCallback(() => {
    const now = Date.now();
    const newViewed: ViewedTrend[] = activeTrends.map(trend => ({
      id: trend.id,
      viewedAt: now
    }));
    
    try {
      // Merge with existing, keeping unique
      const stored = localStorage.getItem(VIEWED_TRENDS_KEY);
      const existing: ViewedTrend[] = stored ? JSON.parse(stored) : [];
      const merged = [...newViewed];
      existing.forEach(e => {
        if (!merged.find(m => m.id === e.id)) {
          merged.push(e);
        }
      });
      localStorage.setItem(VIEWED_TRENDS_KEY, JSON.stringify(merged));
      setViewedTrendIds(merged.map(t => t.id));
    } catch (e) {
      console.error("Failed to save viewed trends:", e);
    }
  }, [activeTrends]);
  
  const openPanel = useCallback(() => {
    setIsOpen(true);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    // Mark as viewed after a short delay
    setTimeout(markTrendsAsViewed, 500);
  }, [markTrendsAsViewed]);
  
  const closePanel = useCallback(() => {
    setIsOpen(false);
    // Restore body scroll
    document.body.style.overflow = '';
  }, []);
  
  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closePanel();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, closePanel]);
  
  return {
    isOpen,
    openPanel,
    closePanel,
    selectedTab,
    setSelectedTab,
    activeTrends,
    predictions,
    isLoading,
    error,
    newTrendCount,
    viewedTrendIds
  };
}
