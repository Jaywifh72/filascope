/**
 * Centralized z-index constants for consistent layering across the app.
 * 
 * Layer hierarchy (bottom to top):
 * - Base content: 0-10
 * - Sticky navigation: 20-30
 * - Fixed footer: 30
 * - Navbar: 50
 * - Dropdowns: 60
 * - Compare bar (floating action): 70
 * - Toasts: 100
 * - Modals/Dialogs: 200
 * - Sheets/Drawers: 300
 * - Top-level overlays: 1000+
 */
export const Z_INDEX = {
  /** Tech footer and similar low-priority fixed elements */
  footer: 30,
  /** Sticky table headers, filter bars */
  stickyNav: 40,
  /** Main navbar */
  navbar: 50,
  /** Dropdowns, popovers, select menus */
  dropdown: 60,
  /** Floating action bars (compare bar, mobile bottom bars) */
  compareBar: 70,
  /** Toast notifications */
  toast: 100,
  /** Modal dialogs */
  modal: 200,
  /** Bottom sheets, drawers */
  sheet: 300,
  /** Top-level overlays that must be above everything */
  topOverlay: 1000,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
