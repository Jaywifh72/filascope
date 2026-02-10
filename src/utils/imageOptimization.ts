/**
 * Optimize external image URLs for appropriate display sizes.
 * Handles Shopify CDN resize parameters and other CDN providers.
 */
export function getOptimizedImageUrl(url: string | null | undefined, targetWidth: number): string {
  if (!url) return '';

  // Shopify CDN optimization - use width query param (more reliable than filename suffix)
  if (url.includes('cdn.shopify.com')) {
    // Remove existing size suffixes like _200x, _800x from filename
    const cleanUrl = url.replace(/_\d+x\./g, '.');
    const separator = cleanUrl.includes('?') ? '&' : '?';
    return `${cleanUrl}${separator}width=${targetWidth}&format=webp`;
  }

  return url;
}
