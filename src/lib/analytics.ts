/**
 * Google Analytics 4 tracking library for FilaScope.
 *
 * Measurement ID placeholder: G-PLACEHOLDER
 * Replace with your real GA4 Measurement ID before going live.
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = 'G-Q96R53VCKM';

let initialized = false;

// ── Initialisation ────────────────────────────────────────────────────

/** Inject the GA4 <script> tags and initialise gtag. Call once on app mount. */
export function initGA() {
  if (initialized || typeof window === 'undefined') return;

  // Don't initialise if the measurement ID is missing
  if (!GA_MEASUREMENT_ID) {
    console.warn('[GA4] Measurement ID is not set – skipping initialisation.');
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // we send page views manually on route change
  });

  initialized = true;
}

// ── Helpers ───────────────────────────────────────────────────────────

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

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
    page_location: window.location.origin + url,
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

// ── Filter Usage ──────────────────────────────────────────────────────

export function trackFilter(filterType: string, filterValue: string, resultsCount: number) {
  gtag('event', 'filter', {
    filter_type: filterType,
    filter_value: filterValue,
    results_count: resultsCount,
  });
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
