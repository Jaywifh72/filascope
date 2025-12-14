import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TrackingEvent {
  module_name: string;
  event_type: 'view' | 'click' | 'scroll_past' | 'time_spent' | 'cta_click' | 'conversion';
  entity_id?: string;
  entity_type?: string;
  duration_ms?: number;
  metadata?: Record<string, unknown>;
}

// Buffer events and batch insert for performance
const eventBuffer: TrackingEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

const flushEvents = async (userId?: string) => {
  if (eventBuffer.length === 0) return;
  
  const events = [...eventBuffer];
  eventBuffer.length = 0;
  
  const sessionId = getSessionId();
  
  try {
    const { error } = await supabase.from('module_engagement_metrics').insert(
      events.map(event => ({
        module_name: event.module_name,
        event_type: event.event_type,
        entity_id: event.entity_id || null,
        entity_type: event.entity_type || null,
        duration_ms: event.duration_ms || null,
        metadata: event.metadata ? JSON.parse(JSON.stringify(event.metadata)) : null,
        user_id: userId || null,
        session_id: sessionId,
      }))
    );
    
    if (error) console.error('Failed to flush analytics events:', error);
  } catch (err) {
    console.error('Analytics flush error:', err);
  }
};

export function useModuleAnalytics() {
  const { user } = useAuth();
  const viewStartTimes = useRef<Map<string, number>>(new Map());
  
  // Flush on unmount or page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushEvents(user?.id);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushEvents(user?.id);
    };
  }, [user?.id]);
  
  const queueEvent = useCallback((event: TrackingEvent) => {
    eventBuffer.push(event);
    
    // Debounce flush - send after 2 seconds of no activity or when buffer is large
    if (flushTimeout) clearTimeout(flushTimeout);
    
    if (eventBuffer.length >= 10) {
      flushEvents(user?.id);
    } else {
      flushTimeout = setTimeout(() => flushEvents(user?.id), 2000);
    }
  }, [user?.id]);
  
  const trackView = useCallback((moduleName: string, entityId?: string, entityType?: string) => {
    viewStartTimes.current.set(moduleName, Date.now());
    queueEvent({
      module_name: moduleName,
      event_type: 'view',
      entity_id: entityId,
      entity_type: entityType,
    });
  }, [queueEvent]);
  
  const trackTimeSpent = useCallback((moduleName: string) => {
    const startTime = viewStartTimes.current.get(moduleName);
    if (startTime) {
      const duration = Date.now() - startTime;
      viewStartTimes.current.delete(moduleName);
      queueEvent({
        module_name: moduleName,
        event_type: 'time_spent',
        duration_ms: duration,
      });
    }
  }, [queueEvent]);
  
  const trackClick = useCallback((moduleName: string, entityId?: string, entityType?: string, metadata?: Record<string, unknown>) => {
    queueEvent({
      module_name: moduleName,
      event_type: 'click',
      entity_id: entityId,
      entity_type: entityType,
      metadata,
    });
  }, [queueEvent]);
  
  const trackCTAClick = useCallback((moduleName: string, ctaType: string, entityId?: string, metadata?: Record<string, unknown>) => {
    queueEvent({
      module_name: moduleName,
      event_type: 'cta_click',
      entity_id: entityId,
      metadata: { cta_type: ctaType, ...metadata },
    });
  }, [queueEvent]);
  
  const trackScrollPast = useCallback((moduleName: string) => {
    // Only track if we started viewing but didn't click
    trackTimeSpent(moduleName);
    queueEvent({
      module_name: moduleName,
      event_type: 'scroll_past',
    });
  }, [queueEvent, trackTimeSpent]);
  
  const trackConversion = useCallback((moduleName: string, conversionType: string, value?: number, entityId?: string) => {
    queueEvent({
      module_name: moduleName,
      event_type: 'conversion',
      entity_id: entityId,
      metadata: { conversion_type: conversionType, conversion_value: value },
    });
  }, [queueEvent]);
  
  return {
    trackView,
    trackTimeSpent,
    trackClick,
    trackCTAClick,
    trackScrollPast,
    trackConversion,
  };
}

// Hook for automatic module tracking with IntersectionObserver
export function useModuleVisibilityTracking(moduleName: string) {
  const { trackView, trackTimeSpent, trackScrollPast } = useModuleAnalytics();
  const hasTrackedView = useRef(false);
  const hasInteracted = useRef(false);
  
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        // Module is 50%+ visible
        if (!hasTrackedView.current) {
          trackView(moduleName);
          hasTrackedView.current = true;
        }
      } else if (hasTrackedView.current && !entry.isIntersecting) {
        // Module left viewport
        if (!hasInteracted.current) {
          trackScrollPast(moduleName);
        } else {
          trackTimeSpent(moduleName);
        }
        hasTrackedView.current = false;
      }
    });
  }, [moduleName, trackView, trackTimeSpent, trackScrollPast]);
  
  const markInteraction = useCallback(() => {
    hasInteracted.current = true;
  }, []);
  
  return { observerCallback, markInteraction };
}
