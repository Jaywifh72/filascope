import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface FilterUsage {
  filter_type: string;
  filter_value: string;
  action: 'apply' | 'remove' | 'clear';
  page: string;
  result_count?: number;
}

interface SearchAnalytics {
  query: string;
  result_count: number;
  has_results: boolean;
  filters_applied?: string[];
  time_to_results_ms?: number;
}

const filterBuffer: FilterUsage[] = [];
const searchBuffer: SearchAnalytics[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

async function flushAnalytics(userId?: string) {
  const sessionId = sessionStorage.getItem('analytics_session_id') || crypto.randomUUID();
  
  // Flush filter events
  if (filterBuffer.length > 0) {
    const filters = [...filterBuffer];
    filterBuffer.length = 0;
    
    try {
      await supabase.from('filter_analytics').insert(
        filters.map(f => ({
          ...f,
          user_id: userId || null,
          session_id: sessionId,
          created_at: new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error('Failed to flush filter analytics:', error);
    }
  }
  
  // Flush search events
  if (searchBuffer.length > 0) {
    const searches = [...searchBuffer];
    searchBuffer.length = 0;
    
    try {
      await supabase.from('search_analytics').insert(
        searches.map(s => ({
          ...s,
          user_id: userId || null,
          session_id: sessionId,
          created_at: new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error('Failed to flush search analytics:', error);
    }
  }
}

export function useFilterAnalytics() {
  const { user } = useAuth();
  const searchStartTime = useRef<number>(0);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushAnalytics(user?.id);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushAnalytics(user?.id);
    };
  }, [user?.id]);
  
  const scheduleFlush = useCallback(() => {
    if (flushTimeout) clearTimeout(flushTimeout);
    flushTimeout = setTimeout(() => flushAnalytics(user?.id), 2000);
  }, [user?.id]);
  
  // Track filter usage
  const trackFilterUsage = useCallback((usage: FilterUsage) => {
    filterBuffer.push(usage);
    
    // Immediate flush if buffer is large
    if (filterBuffer.length >= 10) {
      flushAnalytics(user?.id);
    } else {
      scheduleFlush();
    }
  }, [user?.id, scheduleFlush]);
  
  // Convenience methods for common filter types
  const trackMaterialFilter = useCallback((value: string, action: 'apply' | 'remove') => {
    trackFilterUsage({
      filter_type: 'material',
      filter_value: value,
      action,
      page: window.location.pathname,
    });
  }, [trackFilterUsage]);
  
  const trackBrandFilter = useCallback((value: string, action: 'apply' | 'remove') => {
    trackFilterUsage({
      filter_type: 'brand',
      filter_value: value,
      action,
      page: window.location.pathname,
    });
  }, [trackFilterUsage]);
  
  const trackPriceFilter = useCallback((min: number, max: number) => {
    trackFilterUsage({
      filter_type: 'price_range',
      filter_value: `${min}-${max}`,
      action: 'apply',
      page: window.location.pathname,
    });
  }, [trackFilterUsage]);
  
  const trackColorFilter = useCallback((value: string, action: 'apply' | 'remove') => {
    trackFilterUsage({
      filter_type: 'color',
      filter_value: value,
      action,
      page: window.location.pathname,
    });
  }, [trackFilterUsage]);
  
  const trackSortChange = useCallback((sortBy: string) => {
    trackFilterUsage({
      filter_type: 'sort',
      filter_value: sortBy,
      action: 'apply',
      page: window.location.pathname,
    });
  }, [trackFilterUsage]);
  
  const trackClearAllFilters = useCallback(() => {
    trackFilterUsage({
      filter_type: 'all',
      filter_value: 'cleared',
      action: 'clear',
      page: window.location.pathname,
    });
  }, [trackFilterUsage]);
  
  // Track search queries
  const startSearchTimer = useCallback(() => {
    searchStartTime.current = performance.now();
  }, []);
  
  const trackSearch = useCallback((analytics: Omit<SearchAnalytics, 'time_to_results_ms'>) => {
    const timeToResults = searchStartTime.current > 0 
      ? Math.round(performance.now() - searchStartTime.current)
      : undefined;
    
    searchBuffer.push({
      ...analytics,
      time_to_results_ms: timeToResults,
    });
    
    searchStartTime.current = 0;
    scheduleFlush();
  }, [scheduleFlush]);
  
  // Track compare tray actions
  const trackCompareAction = useCallback((action: 'add' | 'remove' | 'clear' | 'compare', productId?: string, productName?: string) => {
    trackFilterUsage({
      filter_type: 'compare_tray',
      filter_value: action === 'compare' ? 'started_comparison' : productId || action,
      action: action === 'add' ? 'apply' : action === 'compare' ? 'apply' : 'remove',
      page: window.location.pathname,
    });
    
    // Also log to module analytics for detailed tracking
    if (action === 'add' || action === 'remove') {
      supabase.from('module_engagement_metrics').insert({
        module_name: 'compare_tray',
        event_type: action === 'add' ? 'click' : 'conversion',
        entity_id: productId,
        entity_type: 'filament',
        metadata: { action, product_name: productName },
        session_id: sessionStorage.getItem('analytics_session_id'),
      }).then(() => {});
    }
  }, [trackFilterUsage]);
  
  return {
    trackFilterUsage,
    trackMaterialFilter,
    trackBrandFilter,
    trackPriceFilter,
    trackColorFilter,
    trackSortChange,
    trackClearAllFilters,
    startSearchTimer,
    trackSearch,
    trackCompareAction,
  };
}

// Popular filters analysis helper
export function getPopularFilters(): { filterType: string; value: string; count: number }[] {
  // This would typically come from an API, but we can track locally
  try {
    const stored = localStorage.getItem('filter_usage_counts');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return [];
}
