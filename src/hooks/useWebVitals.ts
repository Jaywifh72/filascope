import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WebVitalsMetric {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Thresholds based on Google's Core Web Vitals
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(name: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function getDeviceType(): string {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getConnectionType(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any;
  return nav.connection?.effectiveType || null;
}

interface MetricEntry {
  metric_name: string;
  metric_value: number;
  rating: string;
  page_url: string;
  route: string;
  device_type: string;
  connection_type: string | null;
  recorded_at: string;
}

const metricsBuffer: MetricEntry[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

async function flushMetrics() {
  if (metricsBuffer.length === 0) return;
  
  const metrics = [...metricsBuffer];
  metricsBuffer.length = 0;
  
  try {
    const sessionId = sessionStorage.getItem('analytics_session_id') || crypto.randomUUID();
    
    await supabase.from('performance_metrics').insert(
      metrics.map(m => ({
        ...m,
        session_id: sessionId,
      }))
    );
  } catch (error) {
    console.error('Failed to flush performance metrics:', error);
  }
}

export function useWebVitals() {
  const hasReported = useRef<Set<string>>(new Set());
  
  const reportMetric = useCallback((metric: WebVitalsMetric) => {
    if (hasReported.current.has(metric.name)) return;
    hasReported.current.add(metric.name);
    
    const entry: MetricEntry = {
      metric_name: metric.name,
      metric_value: metric.value,
      rating: metric.rating,
      page_url: window.location.href,
      route: window.location.pathname,
      device_type: getDeviceType(),
      connection_type: getConnectionType(),
      recorded_at: new Date().toISOString(),
    };
    
    metricsBuffer.push(entry);
    
    if (flushTimeout) clearTimeout(flushTimeout);
    flushTimeout = setTimeout(flushMetrics, 3000);
    
    if (import.meta.env.DEV) {
      console.log(`[WebVitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
    }
  }, []);
  
  useEffect(() => {
    // LCP Observer
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        const value = lastEntry.startTime;
        reportMetric({ name: 'LCP', value, rating: getRating('LCP', value) });
      }
    });
    
    // FCP Observer
    const fcpObserver = new PerformanceObserver((list) => {
      const fcpEntry = list.getEntries().find(e => e.name === 'first-contentful-paint');
      if (fcpEntry) {
        const value = fcpEntry.startTime;
        reportMetric({ name: 'FCP', value, rating: getRating('FCP', value) });
      }
    });
    
    // CLS Observer
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = entry as any;
        if (!e.hadRecentInput && e.value) {
          clsValue += e.value;
        }
      }
    });
    
    // FID Observer
    const fidObserver = new PerformanceObserver((list) => {
      const firstEntry = list.getEntries()[0];
      if (firstEntry) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = firstEntry as any;
        const value = e.processingStart - e.startTime;
        reportMetric({ name: 'FID', value, rating: getRating('FID', value) });
      }
    });
    
    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      fcpObserver.observe({ type: 'paint', buffered: true });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {
      console.warn('Some performance observers not supported');
    }
    
    // TTFB
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry) {
      const ttfb = navEntry.responseStart - navEntry.requestStart;
      reportMetric({ name: 'TTFB', value: ttfb, rating: getRating('TTFB', ttfb) });
    }
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && clsValue > 0) {
        reportMetric({ name: 'CLS', value: clsValue, rating: getRating('CLS', clsValue) });
        flushMetrics();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      lcpObserver.disconnect();
      fcpObserver.disconnect();
      clsObserver.disconnect();
      fidObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushMetrics();
    };
  }, [reportMetric]);
}

export function usePageLoadTracking(routeName: string) {
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    const loadTime = performance.now() - startTime.current;
    const sessionId = sessionStorage.getItem('analytics_session_id');
    
    if (sessionId) {
      supabase.from('performance_metrics').insert({
        metric_name: 'page_load',
        metric_value: loadTime,
        rating: loadTime < 1000 ? 'good' : loadTime < 3000 ? 'needs-improvement' : 'poor',
        page_url: window.location.href,
        route: routeName,
        device_type: getDeviceType(),
        connection_type: getConnectionType(),
        session_id: sessionId,
        recorded_at: new Date().toISOString(),
      }).then(() => {});
    }
  }, [routeName]);
}
