/**
 * Filament URL utilities — single source of truth for generating slug-based filament URLs.
 *
 * Uses product_handle (the stored SEO slug) when available, falling back to UUID only
 * when the handle is absent. All internal links that point to /filament/* MUST use
 * getFilamentUrl() or getFilamentHref() so crawlers see slug-based URLs.
 */

export interface FilamentForUrl {
  id: string;
  product_handle?: string | null;
}

/**
 * Returns the SEO-friendly URL path for a filament.
 * If product_handle exists, uses it (e.g. /filament/bambu-lab-pla-basic-black).
 * Otherwise falls back to the UUID.
 */
export function getFilamentUrl(filament: FilamentForUrl): string {
  const slug = filament.product_handle || filament.id;
  return `/filament/${slug}`;
}

/**
 * Returns just the slug portion (without /filament/ prefix).
 */
export function getFilamentSlug(filament: FilamentForUrl): string {
  return filament.product_handle || filament.id;
}

/**
 * Returns the URL from a raw product_handle + id pair.
 * Useful when you don't have a full filament object.
 */
export function getFilamentHref(
  id: string,
  productHandle?: string | null
): string {
  return `/filament/${productHandle || id}`;
}
