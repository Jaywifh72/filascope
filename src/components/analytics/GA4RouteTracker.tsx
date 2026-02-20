import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { setUserProperties } from '@/lib/analytics';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useRegion } from '@/contexts/RegionContext';

/**
 * Handles GA4 tracking for the SPA:
 * - page_view on every client-side route change (via usePageTracking)
 * - user_properties set once per session on mount
 * Place inside <BrowserRouter>.
 */
export function GA4RouteTracker() {
  const location = useLocation();
  const { region, currency } = useRegion();
  const hasSetUserProps = useRef(false);

  // Fires gtag('config', ...) with page_path + page_title on every route change
  usePageTracking();

  // Set user properties once per session on mount
  useEffect(() => {
    if (hasSetUserProps.current) return;
    hasSetUserProps.current = true;

    // Determine if returning visitor via localStorage
    const visitKey = 'filascope_visited';
    const isReturning = !!localStorage.getItem(visitKey);
    try { localStorage.setItem(visitKey, '1'); } catch { /* ignore */ }

    setUserProperties(region, currency, isReturning ? 'returning' : 'new_visitor');
  // Run once on mount — intentionally not re-running on region/currency changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

