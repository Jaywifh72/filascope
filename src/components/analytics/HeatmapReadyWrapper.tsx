import React, { ReactNode, useEffect } from 'react';

interface HeatmapReadyWrapperProps {
  children: ReactNode;
}

export function HeatmapReadyWrapper({ children }: HeatmapReadyWrapperProps) {
  useEffect(() => {
    addHeatmapIdentifiers();
    const observer = new MutationObserver(() => addHeatmapIdentifiers());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  
  return <>{children}</>;
}

function addHeatmapIdentifiers() {
  const selectors = [
    { selector: 'button:not([data-hj-allow]):not([data-hj-suppress])', attr: 'data-hj-allow' },
    { selector: 'a:not([data-hj-allow]):not([data-hj-suppress])', attr: 'data-hj-allow' },
    { selector: 'input[type="email"]:not([data-hj-suppress])', attr: 'data-hj-suppress' },
    { selector: 'input[type="password"]:not([data-hj-suppress])', attr: 'data-hj-suppress' },
  ];
  
  selectors.forEach(({ selector, attr }) => {
    document.querySelectorAll(selector).forEach(el => el.setAttribute(attr, ''));
  });
}

export const ANALYTICS_IDS = {
  HEADER_NAV: 'header-navigation',
  MAIN_SEARCH: 'main-search-input',
  PRODUCT_GRID: 'product-grid',
  PRODUCT_CARD: 'product-card',
  FILTER_PANEL: 'filter-panel',
  BUY_NOW_BUTTON: 'buy-now-button',
  ADD_TO_COMPARE: 'add-to-compare-button',
  COMPARE_TRAY: 'compare-tray',
  COMPARE_BUTTON: 'start-compare-button',
  DEAL_CARD: 'deal-card',
} as const;

export function useAnalyticsId(baseId: string) {
  return {
    id: baseId,
    withIndex: (index: number) => `${baseId}-${index}`,
    withVariant: (variant: string) => `${baseId}-${variant}`,
  };
}

export function initializeFullStory(orgId: string) {
  if (typeof window === 'undefined') return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any)._fs_initialized) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any)._fs_initialized = true;
  
  const script = document.createElement('script');
  script.innerHTML = `window['_fs_org']='${orgId}';`;
  document.head.appendChild(script);
}

export function initializeHotjar(siteId: number) {
  if (typeof window === 'undefined') return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any)._hj_initialized) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any)._hj_initialized = true;
  
  const script = document.createElement('script');
  script.innerHTML = `(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${siteId},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`;
  document.head.appendChild(script);
}
