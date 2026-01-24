/**
 * Unified UX Analytics Hook
 * Combines all analytics capabilities for easy consumption
 */

import { useCallback } from 'react';
import { useModuleAnalytics } from './useModuleAnalytics';
import { useUserActivity } from './useUserActivity';
import { useConversionTracking } from './useConversionTracking';
import { useFunnelAnalytics } from './useFunnelAnalytics';
import { useFilterAnalytics } from './useFilterAnalytics';
import { useWebVitals } from './useWebVitals';

// Re-export individual hooks for granular usage
export { useModuleAnalytics } from './useModuleAnalytics';
export { useUserActivity } from './useUserActivity';
export { useConversionTracking } from './useConversionTracking';
export { useFunnelAnalytics, useAutoFunnelTracking } from './useFunnelAnalytics';
export { useFilterAnalytics } from './useFilterAnalytics';
export { useWebVitals, usePageLoadTracking } from './useWebVitals';

interface ProductViewEvent {
  productId: string;
  productName: string;
  material?: string;
  brand?: string;
  price?: number;
}

interface ExternalLinkClickEvent {
  productId: string;
  retailer: string;
  linkType: 'buy_now' | 'amazon' | 'store' | 'affiliate';
  price?: number;
  position?: string;
}

interface SearchEvent {
  query: string;
  resultCount: number;
  hasResults: boolean;
  filters?: string[];
}

export function useUXAnalytics() {
  const moduleAnalytics = useModuleAnalytics();
  const userActivity = useUserActivity();
  const conversionTracking = useConversionTracking();
  const funnelAnalytics = useFunnelAnalytics();
  const filterAnalytics = useFilterAnalytics();
  
  // Initialize Core Web Vitals tracking
  useWebVitals();
  
  // Track product view with full context
  const trackProductView = useCallback((event: ProductViewEvent) => {
    // Module analytics
    moduleAnalytics.trackView('product_detail', event.productId, 'filament');
    
    // User activity
    userActivity.trackView('filament', event.productId, event.productName);
    
    // Funnel tracking
    funnelAnalytics.trackProductDetailView(event.productId, event.material, event.brand);
    
    // Update material interest
    if (event.material) {
      userActivity.updateMaterialInterest(event.material);
    }
  }, [moduleAnalytics, userActivity, funnelAnalytics]);
  
  // Track external link clicks (buy now buttons)
  const trackExternalLinkClick = useCallback((event: ExternalLinkClickEvent) => {
    // Conversion tracking
    conversionTracking.trackAffiliateClick({
      moduleName: event.position || 'product_detail',
      entityId: event.productId,
      entityType: 'filament',
      estimatedValue: event.price,
    });
    
    // Module analytics
    moduleAnalytics.trackCTAClick(
      event.position || 'product_detail',
      event.linkType,
      event.productId,
      { retailer: event.retailer, price: event.price }
    );
    
    // Funnel tracking
    funnelAnalytics.trackExternalClick(event.productId, event.retailer, event.price);
    
    // User activity
    userActivity.trackClick('filament', event.productId, event.retailer);
  }, [conversionTracking, moduleAnalytics, funnelAnalytics, userActivity]);
  
  // Track search with full context
  const trackSearch = useCallback((event: SearchEvent) => {
    // User activity
    userActivity.trackSearch(event.query);
    
    // Filter analytics
    filterAnalytics.trackSearch({
      query: event.query,
      result_count: event.resultCount,
      has_results: event.hasResults,
      filters_applied: event.filters,
    });
    
    // Funnel tracking
    if (event.hasResults) {
      funnelAnalytics.trackSearchResults(event.query, event.resultCount);
    } else {
      funnelAnalytics.trackSearchInitiated(event.query);
    }
  }, [userActivity, filterAnalytics, funnelAnalytics]);
  
  // Track compare tray actions
  const trackCompareAction = useCallback((
    action: 'add' | 'remove' | 'clear' | 'compare',
    productId?: string,
    productName?: string
  ) => {
    filterAnalytics.trackCompareAction(action, productId, productName);
    
    if (action === 'add' && productId) {
      funnelAnalytics.trackAddToCompare(productId, productName);
    }
  }, [filterAnalytics, funnelAnalytics]);
  
  // Track filter changes
  const trackFilterChange = useCallback((
    filterType: string,
    value: string,
    action: 'apply' | 'remove'
  ) => {
    filterAnalytics.trackFilterUsage({
      filter_type: filterType,
      filter_value: value,
      action,
      page: window.location.pathname,
    });
    
    funnelAnalytics.trackFilterApplied(filterType, value);
  }, [filterAnalytics, funnelAnalytics]);
  
  return {
    // Unified tracking methods
    trackProductView,
    trackExternalLinkClick,
    trackSearch,
    trackCompareAction,
    trackFilterChange,
    
    // Access to underlying analytics for advanced usage
    moduleAnalytics,
    userActivity,
    conversionTracking,
    funnelAnalytics,
    filterAnalytics,
    
    // Utility getters
    getFunnelProgress: funnelAnalytics.getFunnelProgress,
    getAttributionParams: conversionTracking.getAttributionParams,
  };
}
