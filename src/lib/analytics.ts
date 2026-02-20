/**
 * Google Analytics 4 tracking library for FilaScope.
 *
 * The gtag.js script is loaded directly in index.html (ONE script tag only).
 * This file provides typed wrappers for all custom event tracking.
 * Do NOT call initGA() — it is intentionally removed to prevent double-loading.
 */

/*
 * GA4 AI Referral Traffic Channel Group Configuration
 *
 * Create a Custom Channel Group in GA4 called "AI Referral" with these rules:
 *
 * Source matches regex:
 *   chatgpt\.com|chat\.openai\.com|claude\.ai|perplexity\.ai|you\.com|
 *   bing\.com/chat|copilot\.microsoft\.com|gemini\.google\.com|
 *   deepseek\.com|phind\.com
 *
 * This allows tracking how much traffic comes from AI assistant citations
 * vs organic search. FilaScope's AIReferralTracker component (src/components/)
 * fires an 'ai_referral' GA4 event with 'ai_source' and 'landing_page'
 * parameters for matching referrers — these appear in GA4 under
 * Reports → Engagement → Events → ai_referral.
 *
 * Additionally, monitor these server-log User-Agents for crawl activity:
 *   - GPTBot           (OpenAI)
 *   - ClaudeBot        (Anthropic)
 *   - PerplexityBot    (Perplexity)
 *   - Google-Extended  (Google AI / Gemini)
 *   - Applebot-Extended(Apple Intelligence)
 *   - Bytespider       (ByteDance / TikTok)
 *   - CCBot            (Common Crawl)
 *   - Amazonbot        (Amazon)
 *
 * These bots are handled by the 'prerender' Supabase Edge Function, which
 * returns full HTML snapshots and sets X-Prerender: true response headers.
 *
 * Recommended AI visibility monitoring tools:
 *   - HubSpot AEO Grader        (free — answer engine optimisation score)
 *   - Profound.ai               (AI visibility tracker)
 *   - ScrunchAI                 (brand mention tracker across AI engines)
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

/**
 * Set GA4 user properties. Call on every page load for returning users.
 * Param names match the custom dimensions configured in GA4:
 *   preferred_currency, user_region, user_type
 */
export function setUserProperties(region: string, currency: string, userType: 'new_visitor' | 'returning' | 'anonymous' | 'registered') {
  const isReturning = userType === 'returning' || userType === 'registered';
  gtag('set', 'user_properties', {
    preferred_currency: currency,
    user_region: region,
    user_type: isReturning ? 'returning' : 'new_visitor',
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
  /** Affiliate network — matches GA4 custom dimension "affiliate_program" */
  affiliateProgram?: string;
  region?: string;
  price?: number;
  currency?: string;
  discountCode?: string;
  /** Matches GA4 custom dimension "link_type" */
  linkType?: 'product_page' | 'comparison' | 'deal_card' | 'trending' | 'direct' | 'affiliate' | 'amazon';
}

/**
 * Fire an affiliate_click event with parameter names matching GA4 custom dimensions:
 *   affiliate_program, brand, discount_code, link_type, region
 */
export function trackAffiliateClick(params: AffiliateClickParams) {
  // Normalise affiliate_program to a short network name
  const normalizedProgram = params.affiliateProgram?.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/amazon.*/, 'amazon')
    .replace(/impact.*/, 'impact')
    .replace(/commission_junction|cj.*/, 'cj')
    .replace(/awin.*/, 'awin') || 'direct';

  // Custom event — param names match GA4 configured custom dimensions
  gtag('event', 'affiliate_click', {
    affiliate_program: normalizedProgram,
    brand: params.brand,
    discount_code: params.discountCode || '',
    link_type: params.linkType || 'product_page',
    region: params.region || '',
    // Extra context (not custom dimensions, but useful in Explore)
    product_id: params.productId,
    product_name: params.productName,
    price: params.price,
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

/** Fired when a single item is added to the comparison tray.
 * Params match GA4 custom dimensions: brand, link_type
 */
export function trackComparisonAdd(
  productId: string,
  productType: string,
  productName?: string,
  comparisonCount?: number,
  brand?: string
) {
  trackEvent('comparison_add', {
    brand: brand || '',
    link_type: 'comparison',
    product_id: productId,
    product_name: productName,
    product_type: productType,
    comparison_count: comparisonCount,
  });
}

/** Fired when user navigates to the compare page with 2+ items.
 * Params match GA4 custom dimensions: brand, link_type
 */
export function trackComparisonView(productCount: number, productIds: string[]) {
  trackEvent('comparison_view', {
    brand: 'multiple',
    link_type: 'comparison',
    product_count: productCount,
    product_ids: productIds.join(','),
  });
}

/** @deprecated Use trackComparisonView */
export function trackComparisonComplete(productCount: number) {
  trackEvent('comparison_complete', {
    brand: 'multiple',
    link_type: 'comparison',
    product_count: productCount,
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

/** Full filter_apply event.
 * Param "link_type" matches GA4 custom dimension: filterType:filterValue
 */
export function trackFilterApply(filterType: string, filterValue: string, resultsCount?: number) {
  trackEvent('filter_apply', {
    link_type: `${filterType}:${filterValue}`,
    filter_type: filterType,
    filter_value: filterValue,
    results_count: resultsCount,
  });
}

// ── Region/Currency Change ─────────────────────────────────────────────

/** Fired when user changes region.
 * Param "region" matches GA4 custom dimension.
 */
export function trackRegionChange(fromRegion: string, toRegion: string) {
  trackEvent('region_change', {
    region: toRegion,
    from_region: fromRegion,
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

// ── GA4 Enhanced E-commerce ──────────────────────────────────────────

export interface EcommerceItem {
  item_id: string;       // canonical slug, e.g. "bambu-lab-pla-matte-charcoal"
  item_name: string;
  item_brand: string;
  item_category: string; // material type
  price?: number;
  affiliation?: string;  // store name, for select_item
}

/**
 * GA4 Enhanced E-commerce: view_item
 * Fire on filament detail page load. Uses SEO slug as item_id so
 * GA4's built-in Monetization reports show readable product names.
 */
export function trackEcommerceViewItem(params: {
  slug: string;
  name: string;
  brand: string;
  material: string;
  price?: number;
  currency?: string;
}) {
  gtag('event', 'view_item', {
    currency: params.currency || 'USD',
    value: params.price ?? 0,
    items: [{
      item_id: params.slug,
      item_name: params.name,
      item_brand: params.brand,
      item_category: params.material,
      price: params.price ?? 0,
      quantity: 1,
    }],
  });
}

/**
 * GA4 Enhanced E-commerce: add_to_cart
 * Fire when a filament is added to the compare tray.
 */
export function trackEcommerceAddToCart(params: {
  slug: string;
  name: string;
  brand: string;
  material: string;
}) {
  gtag('event', 'add_to_cart', {
    items: [{
      item_id: params.slug,
      item_name: params.name,
      item_brand: params.brand,
      item_category: params.material,
      quantity: 1,
    }],
  });
}

/**
 * GA4 Enhanced E-commerce: select_item
 * Fire when user clicks an affiliate buy button.
 */
export function trackEcommerceSelectItem(params: {
  slug: string;
  name: string;
  brand: string;
  material: string;
  storeName: string;
  price?: number;
  currency?: string;
}) {
  gtag('event', 'select_item', {
    items: [{
      item_id: params.slug,
      item_name: params.name,
      item_brand: params.brand,
      item_category: params.material,
      affiliation: params.storeName,
      price: params.price ?? 0,
      quantity: 1,
    }],
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
