/**
 * Centralized data counts used across the site.
 * Update these when the database grows — every page will reflect the change.
 */
export const SITE_COUNTS = {
  FILAMENT_PRODUCTS: '5,414+',    // Unique base filament SKUs (from sitemap 2026-04-05)
  FILAMENT_VARIANTS: '24,000+',    // Total color/size variants
  BRANDS: '49+',
  PRINTERS: '167+',            // Printer database count (2026-04-05)
  STORES: '15+',
  TD_FILAMENTS: '537+',
  GUIDES: '50+',
} as const;
