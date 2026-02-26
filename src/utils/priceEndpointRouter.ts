/**
 * Price Endpoint Router
 * 
 * Routes price extraction requests to the correct Edge Function based on the product URL's domain.
 * AzureFilm stays on dedicated WC function; everything else goes to v2 consolidated router.
 */

export function getPriceEndpoint(url: string): string {
  const lower = url.toLowerCase();

  // WooCommerce stores (existing, deployed, proven)
  if (lower.includes('azurefilm.com')) return 'get-current-price-wc';

  // Everything else → consolidated v2 router
  return 'get-current-price-v2';
}

/**
 * Server-side version for use in Edge Functions (same logic).
 * Exported separately for clarity.
 */
export const getPriceEndpointServer = getPriceEndpoint;
