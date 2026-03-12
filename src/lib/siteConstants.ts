/**
 * Centralized data counts used across the site.
 * Update these when the database grows — every page will reflect the change.
 */
export const SITE_COUNTS = {
  FILAMENT_PRODUCTS: '1,080+',    // Unique base filament SKUs
  FILAMENT_VARIANTS: '8,200+',    // Total color/size variants
  BRANDS: '48+',
  PRINTERS: '119+',
  STORES: '15+',
  TD_FILAMENTS: '500+',
  GUIDES: '50+',
} as const;
