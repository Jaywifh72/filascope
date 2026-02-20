import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, setUserProperties } from '@/lib/analytics';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useRegion } from '@/contexts/RegionContext';

/**
 * Tracks GA4 page views on every route change.
 * Also sets user properties (region, currency, user_type) on mount.
 * Place inside <BrowserRouter>.
 */
export function GA4RouteTracker() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  const { region, currency } = useRegion();
  const hasSetUserProps = useRef(false);

  // gtag('config', ...) route tracking for native GA4 SPA support
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

  useEffect(() => {
    const url = location.pathname + location.search;
    // Avoid duplicate fire on initial mount vs. route change
    trackPageView(url);
    prevPath.current = location.pathname;
  }, [location.pathname, location.search]);

  return null;
}

