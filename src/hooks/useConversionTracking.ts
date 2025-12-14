import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useModuleAnalytics } from './useModuleAnalytics';

interface ConversionEvent {
  moduleName: string;
  entityId: string;
  entityType: 'filament' | 'printer' | 'accessory' | 'deal';
  conversionType: 'affiliate_click' | 'amazon_click' | 'store_click' | 'purchase';
  estimatedValue?: number;
  metadata?: Record<string, unknown>;
}

// Estimated commission rates by vendor type
const COMMISSION_RATES: Record<string, number> = {
  amazon: 0.04, // 4% Amazon Associates
  store: 0.08,  // 8% average affiliate
  default: 0.05,
};

// Average order values by entity type
const AVERAGE_ORDER_VALUES: Record<string, number> = {
  filament: 25,
  printer: 350,
  accessory: 45,
  deal: 30,
};

export function useConversionTracking() {
  const { user } = useAuth();
  const { trackConversion } = useModuleAnalytics();
  
  const trackAffiliateClick = useCallback((event: Omit<ConversionEvent, 'conversionType'>) => {
    const commissionRate = COMMISSION_RATES.amazon;
    const avgValue = AVERAGE_ORDER_VALUES[event.entityType] || 30;
    const estimatedValue = event.estimatedValue || avgValue * commissionRate;
    
    // Track in module analytics
    trackConversion(event.moduleName, 'affiliate_click', estimatedValue, event.entityId);
    
    // Also record directly to ab_test_conversions if user is in a test
    const sessionId = sessionStorage.getItem('ab_test_session_id');
    if (sessionId) {
      supabase.from('ab_test_conversions').insert({
        test_name: 'sidebar_module_order',
        conversion_type: 'affiliate_click',
        conversion_value: estimatedValue,
        user_id: user?.id,
        session_id: sessionId,
        metadata: {
          module_name: event.moduleName,
          entity_id: event.entityId,
          entity_type: event.entityType,
        },
      }).then(() => {});
    }
  }, [trackConversion, user?.id]);
  
  const trackStoreClick = useCallback((event: Omit<ConversionEvent, 'conversionType'>) => {
    const commissionRate = COMMISSION_RATES.store;
    const avgValue = AVERAGE_ORDER_VALUES[event.entityType] || 30;
    const estimatedValue = event.estimatedValue || avgValue * commissionRate;
    
    trackConversion(event.moduleName, 'store_click', estimatedValue, event.entityId);
  }, [trackConversion]);
  
  const trackDealClick = useCallback((dealId: string, dealValue: number, vendorType: 'amazon' | 'store' = 'store') => {
    const commissionRate = COMMISSION_RATES[vendorType] || COMMISSION_RATES.default;
    const estimatedValue = dealValue * commissionRate;
    
    trackConversion('deals', 'deal_click', estimatedValue, dealId);
  }, [trackConversion]);
  
  // Get attribution params to append to affiliate URLs
  const getAttributionParams = useCallback((moduleName: string, entityId: string) => {
    const sessionId = sessionStorage.getItem('analytics_session_id') || '';
    return new URLSearchParams({
      utm_source: 'filascope',
      utm_medium: 'sidebar',
      utm_campaign: moduleName,
      utm_content: entityId,
      fs_session: sessionId.slice(0, 8),
    }).toString();
  }, []);
  
  return {
    trackAffiliateClick,
    trackStoreClick,
    trackDealClick,
    getAttributionParams,
  };
}
