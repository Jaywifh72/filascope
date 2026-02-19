/**
 * Google Analytics 4 tracking library for FilaScope.
 *
 * The gtag.js script is loaded directly in index.html (ONE script tag only).
 * This file provides typed wrappers for all custom event tracking.
 * Do NOT call initGA() — it is intentionally removed to prevent double-loading.
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = 'G-Q96R53VCKM';

// ── Helpers ───────────────────────────────────────────────────────────

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

/** Generic event firing — safe to call anywhere. */
export const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  gtag('event', eventName, params);
};

// ── User Properties ───────────────────────────────────────────────────

export function setUserProperties(region: string, currency: string, userType: 'anonymous' | 'registered') {
  gtag('set', 'user_properties', {
    user_region: region,
    user_currency: currency,
    user_type: userType,
  });
}

// ── Page Views ────────────────────────────────────────────────────────

export function trackPageView(url: string) {
  gtag('event', 'page_view', {
    page_path: url,
    page_location: typeof window !== 'undefined' ? window.location.origin + url : url,
    send_to: GA_MEASUREMENT_ID,
  });
}

// ── Affiliate Click (revenue-critical) ────────────────────────────────

export interface AffiliateClickParams {
  brand: string;
  productName: string;
  productId: string;
  affiliateProgram?: string;
  region?: string;
  price?: number;
  currency?: string;
  discountCode?: string;
  linkType?: 'direct' | 'affiliate' | 'amazon';
}

export function trackAffiliateClick(params: AffiliateClickParams) {
  // Custom event for detailed attribution
  gtag('event', 'affiliate_click', {
    brand: params.brand,
    product_name: params.productName,
    product_id: params.productId,
    affiliate_program: params.affiliateProgram,
    region: params.region,
    price: params.price,
    currency: params.currency,
    discount_code: params.discountCode,
    link_type: params.linkType,
    source_page: typeof window !== 'undefined' ? window.location.pathname : undefined,
  });

  // Also fire begin_checkout for e-commerce funnel tracking
  if (params.price != null) {
    gtag('event', 'begin_checkout', {
      currency: params.currency || 'USD',
      value: params.price,
      items: [
        {
          item_id: params.productId,
          item_name: params.productName,
          item_brand: params.brand,
          price: params.price,
          quantity: 1,
        },
      ],
    });
  }
}

// ── Product View ──────────────────────────────────────────────────────

export interface ProductViewParams {
  productId: string;
  productName: string;
  brand: string;
  category?: string;
  price?: number;
  currency?: string;
}

export function trackProductView(params: ProductViewParams) {
  gtag('event', 'view_item', {
    currency: params.currency || 'USD',
    value: params.price,
    items: [
      {
        item_id: params.productId,
        item_name: params.productName,
        item_brand: params.brand,
        item_category: params.category,
        price: params.price,
        quantity: 1,
      },
    ],
  });
}

// ── Comparison ────────────────────────────────────────────────────────

export interface ComparisonParams {
  productCount: number;
  brands: string[];
  category?: string;
}

export function trackComparison(params: ComparisonParams) {
  gtag('event', 'comparison', {
    product_count: params.productCount,
    brands: params.brands.join(','),
    category: params.category,
  });
}

/** Fired when a single item is added to the comparison tray. */
export function trackComparisonAdd(productId: string, productType: string) {
  trackEvent('comparison_add', { product_id: productId, product_type: productType });
}

/** Fired when user navigates to the compare page with 2+ items. */
export function trackComparisonComplete(productCount: number) {
  trackEvent('comparison_complete', { product_count: productCount });
}

// ── Filter Usage ──────────────────────────────────────────────────────

export function trackFilter(filterType: string, filterValue: string, resultsCount: number) {
  gtag('event', 'filter', {
    filter_type: filterType,
    filter_value: filterValue,
    results_count: resultsCount,
  });
}

/** Simplified filter tracking (no results count required). */
export function trackFilterApply(filterType: string, filterValue: string) {
  trackEvent('filter_apply', { filter_type: filterType, filter_value: filterValue });
}

// ── Region/Currency Change ─────────────────────────────────────────────

export function trackRegionChange(fromRegion: string, toRegion: string) {
  trackEvent('region_change', { from_region: fromRegion, to_region: toRegion });
}

// ── HueForge TD Search ───────────────────────────────────────────────

export function trackTDSearch(color: string, tdValue: number | null, resultsCount: number) {
  gtag('event', 'td_search', {
    color,
    td_value: tdValue,
    results_count: resultsCount,
  });
}

// ── Discount Code ─────────────────────────────────────────────────────

export function trackDiscountCode(code: string, brand: string, discountValue?: number) {
  gtag('event', 'discount_code_click', {
    discount_code: code,
    brand,
    discount_value: discountValue,
  });
}

// ── Search ────────────────────────────────────────────────────────────

export function trackSearch(searchTerm: string, resultsCount: number) {
  gtag('event', 'search', {
    search_term: searchTerm,
    results_count: resultsCount,
  });
}

// ── Deals ─────────────────────────────────────────────────────────────

export function trackDealView(productId: string, discount: string) {
  trackEvent('deal_view', { product_id: productId, discount });
}
