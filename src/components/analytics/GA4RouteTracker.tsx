import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';
import { usePageTracking } from '@/hooks/usePageTracking';

/**
 * Tracks GA4 page views on every route change.
 * Place inside <BrowserRouter>.
 */
export function GA4RouteTracker() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  // gtag('config', ...) route tracking for native GA4 SPA support
  usePageTracking();

  useEffect(() => {
    const url = location.pathname + location.search;
    // Avoid duplicate fire on initial mount vs. route change
    trackPageView(url);
    prevPath.current = location.pathname;
  }, [location.pathname, location.search]);

  return null;
}

