/**
 * Check if a URL is a Shopify-compatible CDN that supports ?width= resizing.
 * Uses universal `/cdn/shop/` path detection to cover all Shopify-hosted stores,
 * plus explicit checks for known CDN domains.
 */
function isShopifyCdn(url: string): boolean {
  return (
    url.includes('cdn.shopify.com') ||
    url.includes('/cdn/shop/') ||
    url.includes('caz3d.com/cdn/') ||
    /store\.bbl[a-z]*\.[a-z]+.*\/cdn\//i.test(url)
  );
}

/**
 * Check if a URL is a Supabase storage render URL that supports width transforms.
 */
function isSupabaseRender(url: string): boolean {
  return url.includes('supabase.co/storage/v1/render/image/');
}

/**
 * Optimize external image URLs for appropriate display sizes.
 * Handles Shopify CDN resize parameters, Supabase storage transforms, and other CDN providers.
 */
export function getOptimizedImageUrl(url: string | null | undefined, targetWidth: number): string {
  if (!url) return '';

  // Shopify-compatible CDN optimization
  if (isShopifyCdn(url)) {
    // Strip any existing width param to allow re-optimization for context
    let cleanUrl = url.replace(/[?&]width=\d+/g, '').replace(/[?&]format=webp/g, '');
    cleanUrl = cleanUrl.replace(/_\d+x\./g, '.');
    // Clean up orphaned ? or trailing &
    cleanUrl = cleanUrl.replace(/\?&/, '?').replace(/\?$/, '').replace(/&$/, '');
    const separator = cleanUrl.includes('?') ? '&' : '?';
    return `${cleanUrl}${separator}width=${targetWidth}&format=webp`;
  }

  // Supabase storage image transforms — replace existing width if present
  if (isSupabaseRender(url)) {
    if (/[?&]width=/i.test(url)) {
      return url.replace(/([?&]width=)\d+/, `$1${targetWidth}`);
    }
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${targetWidth}&resize=contain`;
  }

  // Supabase storage object URLs (non-render)
  if (url.includes('supabase.co/storage') && !/[?&]width=/i.test(url)) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${targetWidth}&resize=contain`;
  }

  return url;
}

/**
 * Generate a srcset string for resizable CDN images at multiple widths.
 * Returns empty string for URLs that don't support server-side resizing.
 */
export function getImageSrcSet(url: string | null | undefined, sizes: number[]): string {
  if (!url) return '';
  if (!isShopifyCdn(url) && !url.includes('supabase.co/storage')) return '';

  return sizes
    .map(size => `${getOptimizedImageUrl(url, size)} ${size}w`)
    .join(', ');
}
