/**
 * Web Vitals reporting
 * Reports CLS, INP, LCP, FCP, TTFB to the existing performance_metrics table.
 * Uses web-vitals library v4+ API (onFID removed, replaced by onINP).
 */
import type { Metric } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getConnectionType(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any;
  return nav.connection?.effectiveType ?? null;
}

interface MetricRow {
  metric_name: string;
  metric_value: number;
  rating: string;
  page_url: string;
  route: string;
  device_type: string;
  connection_type: string | null;
  recorded_at: string;
  session_id?: string;
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;
const queue: MetricRow[] = [];

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    if (queue.length === 0) return;
    const rows = queue.splice(0);
    const sessionId = sessionStorage.getItem('analytics_session_id') ?? crypto.randomUUID();
    const rowsWithSession = rows.map((r) => ({ ...r, session_id: sessionId }));
    await supabase.from('performance_metrics').insert(rowsWithSession);
  }, 3000);
}

function onMetric(metric: Metric) {
  const rating = metric.rating as string;

  if (import.meta.env.DEV) {
    console.log(`[web-vitals] ${metric.name}: ${metric.value.toFixed(2)} (${rating})`);
  }

  queue.push({
    metric_name: metric.name,
    metric_value: metric.value,
    rating,
    page_url: window.location.href,
    route: window.location.pathname,
    device_type: getDeviceType(),
    connection_type: getConnectionType(),
    recorded_at: new Date().toISOString(),
  });

  scheduleFlush();
}

/**
 * Call once at app startup to begin collecting Core Web Vitals.
 * Dynamically imported to avoid adding web-vitals to the main bundle.
 */
export async function reportWebVitals() {
  const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import('web-vitals');
  onCLS(onMetric);
  onINP(onMetric);
  onLCP(onMetric);
  onFCP(onMetric);
  onTTFB(onMetric);
}
