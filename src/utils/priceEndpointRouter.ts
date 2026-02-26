/**
 * Price Endpoint Router
 * 
 * Routes price extraction requests to the correct Edge Function based on the product URL's domain.
 * This replaces the inline `url.includes('azurefilm.com') ? 'get-current-price-wc' : 'get-current-price'`
 * pattern used across the frontend.
 */

export function getPriceEndpoint(url: string): string {
  const lower = url.toLowerCase();

  // WooCommerce stores (existing, deployed)
  if (lower.includes('azurefilm.com')) return 'get-current-price-wc';

  // Direct HTML/JSON-LD stores (custom storefronts)
  if (lower.includes('store.creality.com') || lower.includes('creality.com/ca/') ||
      lower.includes('creality.com/uk/') || lower.includes('creality.com/eu/') ||
      lower.includes('creality.com/au/') || lower.includes('creality.com/jp/'))
    return 'get-current-price-direct';
  if (lower.includes('extrudr.com')) return 'get-current-price-direct';
  if (lower.includes('treedfilaments.com')) return 'get-current-price-direct';
  if (lower.includes('prusa3d.com')) return 'get-current-price-direct';
  if (lower.includes('geeetech.com')) return 'get-current-price-direct';

  // Shopify stores (default for most brands)
  return 'get-current-price-shopify';
}

/**
 * Server-side version for use in Edge Functions (same logic).
 * Exported separately for clarity.
 */
export const getPriceEndpointServer = getPriceEndpoint;
