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
  /** Store / retailer name (e.g. "Amazon", "Bambu Lab Store") */
  store?: string;
  /** Material type (e.g. "PLA", "PETG") */
  material?: string;
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
    product_id: params.productId,
    product_name: params.productName,
    brand: params.brand,
    material: params.material,
    store: params.store,
    region: params.region,
    price: params.price,
    currency: params.currency,
    affiliate_program: params.affiliateProgram,
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
          item_category: params.material,
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
export function trackComparisonAdd(
  productId: string,
  productType: string,
  productName?: string,
  comparisonCount?: number
) {
  trackEvent('comparison_add', {
    product_id: productId,
    product_name: productName,
    product_type: productType,
    comparison_count: comparisonCount,
  });
}

/** Fired when user navigates to the compare page with 2+ items. */
export function trackComparisonView(productCount: number, productIds: string[]) {
  trackEvent('comparison_view', {
    product_count: productCount,
    product_ids: productIds.join(','),
  });
}

/** @deprecated Use trackComparisonView */
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

/** Full filter_apply event with page and results count. */
export function trackFilterApply(filterType: string, filterValue: string, resultsCount?: number) {
  trackEvent('filter_apply', {
    filter_type: filterType,
    filter_value: filterValue,
    page: typeof window !== 'undefined' ? window.location.pathname : undefined,
    results_count: resultsCount,
  });
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

export function trackDealView(params: {
  productId: string;
  productName?: string;
  brand?: string;
  discountPercent?: number;
  originalPrice?: number;
  salePrice?: number;
  currency?: string;
}): void;
/** @deprecated Use the object form */
export function trackDealView(productId: string, discount: string): void;
export function trackDealView(
  paramsOrId: string | { productId: string; productName?: string; brand?: string; discountPercent?: number; originalPrice?: number; salePrice?: number; currency?: string },
  discount?: string
) {
  if (typeof paramsOrId === 'string') {
    trackEvent('deal_view', { product_id: paramsOrId, discount });
    return;
  }
  trackEvent('deal_view', {
    product_id: paramsOrId.productId,
    product_name: paramsOrId.productName,
    brand: paramsOrId.brand,
    discount_percent: paramsOrId.discountPercent,
    original_price: paramsOrId.originalPrice,
    sale_price: paramsOrId.salePrice,
    currency: paramsOrId.currency,
  });
}

/** GA4 view_item fired when a deal card becomes visible. */
export function trackDealItemView(params: {
  productId: string;
  productName: string;
  brand: string;
  price?: number;
  currency?: string;
  discountPercent?: number;
  originalPrice?: number;
}) {
  // Also fire the deal_view event with full params
  trackEvent('deal_view', {
    product_id: params.productId,
    product_name: params.productName,
    brand: params.brand,
    discount_percent: params.discountPercent,
    original_price: params.originalPrice,
    sale_price: params.price,
    currency: params.currency || 'USD',
  });

  gtag('event', 'view_item', {
    currency: params.currency || 'USD',
    value: params.price,
    items: [{
      item_id: params.productId,
      item_name: params.productName,
      item_brand: params.brand,
      item_category: 'deal',
      price: params.price,
      discount: params.discountPercent,
      quantity: 1,
    }],
  });
}

// ── Guide Read ────────────────────────────────────────────────────────

/** Fired when a user spends 30+ seconds on a guide page. */
export function trackGuideRead(guideTitle: string, guideSlug: string, readTimeSeconds: number) {
  gtag('event', 'guide_read', {
    guide_title: guideTitle,
    guide_slug: guideSlug,
    read_time_seconds: readTimeSeconds,
  });
}

// ── Quick Match (Wizard) ───────────────────────────────────────────────

/** Fired when user lands on the Wizard/Quick Match page. */
export function trackQuickMatchStart() {
  trackEvent('quick_match_start', {
    source_page: typeof window !== 'undefined' ? window.location.pathname : undefined,
  });
}

/** Fired when WizardResults are shown (quiz completed). */
export function trackWizardComplete(params: {
  topMaterial: string;
  useCase?: string;
  printer?: string;
  priority?: string;
  recommendedCount?: number;
}) {
  gtag('event', 'quick_match_complete', {
    recommended_count: params.recommendedCount,
    recommended_material: params.topMaterial,
    use_case: params.useCase,
    printer: params.printer,
    priority: params.priority,
  });
  // Also fire the legacy event name for backwards compat
  gtag('event', 'wizard_complete', {
    recommended_material: params.topMaterial,
    use_case: params.useCase,
    printer: params.printer,
    priority: params.priority,
  });
}

// ── Outbound Click ────────────────────────────────────────────────────

/** Fired for all external link opens (affiliate + non-affiliate). */
export function trackOutboundClick(destinationUrl: string, label?: string) {
  gtag('event', 'click', {
    event_category: 'outbound',
    event_label: label || destinationUrl,
    link_url: destinationUrl,
    transport_type: 'beacon',
  });
}
