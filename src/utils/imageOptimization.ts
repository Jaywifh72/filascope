/**
 * Check if a URL is a Shopify-compatible CDN that supports ?width= resizing.
 * Covers cdn.shopify.com, caz3d.com/cdn/ (Bambu Lab reseller), and store.bbl* (Bambu Lab store).
 */
function isShopifyCdn(url: string): boolean {
  return (
    url.includes('cdn.shopify.com') ||
    url.includes('caz3d.com/cdn/') ||
    /store\.bbl[a-z]*\.[a-z]+.*\/cdn\//i.test(url)
  );
}

/**
 * Optimize external image URLs for appropriate display sizes.
 * Handles Shopify CDN resize parameters, Supabase storage transforms, and other CDN providers.
 */
export function getOptimizedImageUrl(url: string | null | undefined, targetWidth: number): string {
  if (!url) return '';

  // Shopify-compatible CDN optimization
  if (isShopifyCdn(url)) {
    // Skip if already has a width param
    if (/[?&]width=/i.test(url)) return url;
    const cleanUrl = url.replace(/_\d+x\./g, '.');
    const separator = cleanUrl.includes('?') ? '&' : '?';
    return `${cleanUrl}${separator}width=${targetWidth}&format=webp`;
  }

  // Supabase storage image transforms
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
