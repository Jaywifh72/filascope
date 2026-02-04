import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";

export interface PrinterActivityStats {
  views_24h: number;
  views_7d: number;
  comparisons_7d: number;
  buy_clicks_7d: number;
  total_views: number;
}

// Generate or retrieve session ID for anonymous tracking
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('printer_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('printer_session_id', sessionId);
  }
  return sessionId;
}

// Track a printer event
export function useTrackPrinterEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      printerId, 
      eventType 
    }: { 
      printerId: string; 
      eventType: 'view' | 'comparison' | 'click_buy' | 'add_favorite';
    }) => {
      const sessionId = getSessionId();
      
      const { error } = await supabase
        .from('printer_analytics')
        .insert({
          printer_id: printerId,
          event_type: eventType,
          session_id: sessionId,
        });
      
      if (error) {
        console.error('Error tracking printer event:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate the activity stats query to refresh the UI
      queryClient.invalidateQueries({ 
        queryKey: ['printer-activity', variables.printerId] 
      });
    },
  });
}

// Track page view automatically (with deduplication)
export function useTrackPrinterView(printerId: string | undefined) {
  const { mutate: trackEvent } = useTrackPrinterEvent();
  const hasTracked = useRef(false);
  
  useEffect(() => {
    if (printerId && !hasTracked.current) {
      hasTracked.current = true;
      trackEvent({ printerId, eventType: 'view' });
    }
  }, [printerId, trackEvent]);
}

// Fetch activity stats for a printer
export function usePrinterActivityStats(printerId: string | undefined) {
  return useQuery({
    queryKey: ['printer-activity', printerId],
    queryFn: async (): Promise<PrinterActivityStats> => {
      if (!printerId) {
        return { views_24h: 0, views_7d: 0, comparisons_7d: 0, buy_clicks_7d: 0, total_views: 0 };
      }
      
      const { data, error } = await supabase
        .rpc('get_printer_activity_stats', { p_printer_id: printerId });
      
      if (error) {
        console.error('Error fetching printer activity:', error);
        return { views_24h: 0, views_7d: 0, comparisons_7d: 0, buy_clicks_7d: 0, total_views: 0 };
      }
      
      return data as unknown as PrinterActivityStats;
    },
    enabled: !!printerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
  });
}

// Get brand trust signals
export function useBrandTrustSignals(brandId: string | undefined) {
  return useQuery({
    queryKey: ['brand-trust-signals', brandId],
    queryFn: async () => {
      if (!brandId) return null;
      
      const { data, error } = await supabase
        .from('printer_brands')
        .select('free_shipping_threshold, return_policy_days, warranty_years, has_expert_support')
        .eq('id', brandId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching brand trust signals:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!brandId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Generate trust signals array from brand data
export function generateTrustSignals(brandData: {
  free_shipping_threshold: number | null;
  return_policy_days: number | null;
  warranty_years: number | null;
  has_expert_support: boolean | null;
} | null): string[] {
  const signals: string[] = [];
  
  if (brandData?.free_shipping_threshold) {
    signals.push(`Free shipping on orders over ${brandData.free_shipping_threshold}`);
  }
  
  if (brandData?.return_policy_days) {
    signals.push(`${brandData.return_policy_days}-day return policy`);
  }
  
  if (brandData?.warranty_years) {
    signals.push(`${brandData.warranty_years}-year manufacturer warranty`);
  }
  
  if (brandData?.has_expert_support) {
    signals.push('Expert customer support');
  }
  
  // Default signals if no brand data
  if (signals.length === 0) {
    return [
      'Free shipping available',
      '30-day return policy',
      '1-year manufacturer warranty',
      'Expert customer support'
    ];
  }
  
  return signals;
}
