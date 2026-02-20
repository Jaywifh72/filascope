import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = 'G-Q96R53VCKM';

/**
 * Fires a GA4 page_view on every SPA route change via gtag('config', ...).
 * Uses setTimeout(0) so document.title is read AFTER React's SEO components
 * (useDocumentHead, Helmet, etc.) have updated it for the new route.
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;

    // Defer by one tick so <title> is updated by React render before we read it
    const timer = setTimeout(() => {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);
}

