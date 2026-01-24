import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type FunnelStep = 
  | 'homepage_view'
  | 'product_listing_view'
  | 'filter_applied'
  | 'product_detail_view'
  | 'add_to_compare'
  | 'compare_view'
  | 'external_click'
  | 'search_initiated'
  | 'search_results_view';

interface FunnelEvent {
  step: FunnelStep;
  funnel_type: 'discovery' | 'comparison' | 'purchase';
  previous_step?: FunnelStep;
  entity_id?: string;
  entity_type?: string;
  metadata?: Record<string, unknown>;
}

const FUNNEL_SESSION_KEY = 'filascope_funnel_session';
const FUNNEL_STEPS_KEY = 'filascope_funnel_steps';

function getFunnelSessionId(): string {
  let sessionId = sessionStorage.getItem(FUNNEL_SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(FUNNEL_SESSION_KEY, sessionId);
  }
  return sessionId;
}

function getRecentSteps(): FunnelStep[] {
  try {
    const stored = sessionStorage.getItem(FUNNEL_STEPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addStep(step: FunnelStep) {
  const steps = getRecentSteps();
  steps.push(step);
  if (steps.length > 20) steps.shift();
  sessionStorage.setItem(FUNNEL_STEPS_KEY, JSON.stringify(steps));
}

export function useFunnelAnalytics() {
  const { user } = useAuth();
  const lastStep = useRef<FunnelStep | null>(null);
  
  const trackFunnelStep = useCallback(async (event: FunnelEvent) => {
    const sessionId = getFunnelSessionId();
    const previousStep = lastStep.current || event.previous_step;
    
    lastStep.current = event.step;
    addStep(event.step);
    
    try {
      await supabase.from('funnel_events').insert({
        session_id: sessionId,
        user_id: user?.id || null,
        funnel_type: event.funnel_type,
        step_name: event.step,
        previous_step: previousStep || null,
        step_order: getRecentSteps().length,
        entity_id: event.entity_id || null,
        entity_type: event.entity_type || null,
        page_url: window.location.href,
        referrer: document.referrer || null,
        metadata: event.metadata || {},
      });
    } catch (error) {
      console.error('Failed to track funnel step:', error);
    }
  }, [user?.id]);
  
  const trackHomepageView = useCallback(() => {
    trackFunnelStep({ step: 'homepage_view', funnel_type: 'discovery' });
  }, [trackFunnelStep]);
  
  const trackProductListingView = useCallback((material?: string) => {
    trackFunnelStep({ step: 'product_listing_view', funnel_type: 'discovery', metadata: { material } });
  }, [trackFunnelStep]);
  
  const trackFilterApplied = useCallback((filterType: string, filterValue: string) => {
    trackFunnelStep({ step: 'filter_applied', funnel_type: 'discovery', metadata: { filter_type: filterType, filter_value: filterValue } });
  }, [trackFunnelStep]);
  
  const trackProductDetailView = useCallback((productId: string, material?: string, brand?: string) => {
    trackFunnelStep({ step: 'product_detail_view', funnel_type: 'purchase', entity_id: productId, entity_type: 'filament', metadata: { material, brand } });
  }, [trackFunnelStep]);
  
  const trackAddToCompare = useCallback((productId: string, productName?: string) => {
    trackFunnelStep({ step: 'add_to_compare', funnel_type: 'comparison', entity_id: productId, metadata: { product_name: productName } });
  }, [trackFunnelStep]);
  
  const trackCompareView = useCallback((productCount: number) => {
    trackFunnelStep({ step: 'compare_view', funnel_type: 'comparison', metadata: { product_count: productCount } });
  }, [trackFunnelStep]);
  
  const trackExternalClick = useCallback((productId: string, retailer: string, price?: number) => {
    trackFunnelStep({ step: 'external_click', funnel_type: 'purchase', entity_id: productId, metadata: { retailer, price } });
  }, [trackFunnelStep]);
  
  const trackSearchInitiated = useCallback((query: string) => {
    trackFunnelStep({ step: 'search_initiated', funnel_type: 'discovery', metadata: { query } });
  }, [trackFunnelStep]);
  
  const trackSearchResults = useCallback((query: string, resultCount: number) => {
    trackFunnelStep({ step: 'search_results_view', funnel_type: 'discovery', metadata: { query, result_count: resultCount } });
  }, [trackFunnelStep]);
  
  const getFunnelProgress = useCallback(() => {
    const steps = getRecentSteps();
    const purchaseFunnelOrder: FunnelStep[] = ['homepage_view', 'product_listing_view', 'product_detail_view', 'external_click'];
    
    let maxProgress = 0;
    steps.forEach(step => {
      const idx = purchaseFunnelOrder.indexOf(step);
      if (idx > maxProgress) maxProgress = idx;
    });
    
    return { currentStep: maxProgress, totalSteps: purchaseFunnelOrder.length, percentage: Math.round((maxProgress / (purchaseFunnelOrder.length - 1)) * 100) };
  }, []);
  
  return {
    trackFunnelStep, trackHomepageView, trackProductListingView, trackFilterApplied,
    trackProductDetailView, trackAddToCompare, trackCompareView, trackExternalClick,
    trackSearchInitiated, trackSearchResults, getFunnelProgress, sessionId: getFunnelSessionId(),
  };
}

export function useAutoFunnelTracking() {
  const location = useLocation();
  const { trackHomepageView, trackProductListingView, trackCompareView } = useFunnelAnalytics();
  const lastPath = useRef<string>('');
  
  useEffect(() => {
    if (location.pathname === lastPath.current) return;
    lastPath.current = location.pathname;
    
    if (location.pathname === '/') trackHomepageView();
    else if (location.pathname === '/finder' || location.pathname.startsWith('/filaments')) {
      const params = new URLSearchParams(location.search);
      trackProductListingView(params.get('material') || undefined);
    } else if (location.pathname === '/compare') {
      const params = new URLSearchParams(location.search);
      trackCompareView((params.get('ids')?.split(',') || []).length);
    }
  }, [location, trackHomepageView, trackProductListingView, trackCompareView]);
}
