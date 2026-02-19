import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = 'G-Q96R53VCKM';

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: location.pathname + location.search,
    });
  }, [location.pathname, location.search]);
}
