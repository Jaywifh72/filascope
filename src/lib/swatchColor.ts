/**
 * Shared swatch-color utilities.
 *
 * When a filament's `color_hex` is null / empty, we derive a reasonable
 * fallback from `color_family` so swatches are never invisible.
 *
 * White/near-white families are given PRIORITY over the hex field because
 * some database records carry incorrect dark hex values for white filaments.
 */

/** White-family overrides — checked BEFORE hex to fix bad data. Longest-first order. */
const WHITE_FAMILY_OVERRIDES: Record<string, string> = {
  'bone white': '#F5F0E6',
  'cold white': '#F0F4FF',
  'jade white': '#F0F5E8',
  'milky white': '#FAFAF5',
  'warm white': '#FFF8F0',
  ivory: '#FFFFF0',
  cream: '#FFFDD0',
  natural: '#F5F0E0',
  white: '#FFFFFF',
};

const WHITE_OVERRIDE_KEYS = Object.keys(WHITE_FAMILY_OVERRIDES).sort(
  (a, b) => b.length - a.length,
);

const COLOR_FAMILY_FALLBACKS: Record<string, string> = {
  white: '#FFFFFF',
  'bone white': '#F5F0E6',
  'cold white': '#F0F4FF',
  'jade white': '#F0F5E8',
  'milky white': '#FAFAF5',
  natural: '#F5F0E0',
  ivory: '#FFFFF0',
  cream: '#FFFDD0',
  black: '#1A1A1A',
  red: '#CC3333',
  blue: '#3366CC',
  green: '#339933',
  yellow: '#CCAA33',
  orange: '#CC6633',
  pink: '#CC6699',
  purple: '#7744AA',
  brown: '#8B5E3C',
  grey: '#808080',
  gray: '#808080',
  silver: '#AAAAAA',
  gold: '#BFA040',
  clear: '#E8E8E8',
  transparent: '#E8E8E8',
  translucent: '#E8E8E8',
};

/**
 * Check if a color family string matches a white/near-white override.
 * Returns the override hex or null.
 */
function resolveWhiteOverride(text: string | null | undefined): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const key of WHITE_OVERRIDE_KEYS) {
    if (lower.includes(key)) return WHITE_FAMILY_OVERRIDES[key];
  }
  return null;
}

/**
 * Returns the best hex colour for a swatch.
 * Priority:
 *  1. White-family override from colorFamily (fixes bad hex data for whites)
 *  2. Explicit hex from database
 *  3. Color-family fallback
 *  4. Neutral grey
 */
export function getSwatchColor(
  hexColor: string | null | undefined,
  colorFamily: string | null | undefined,
): string {
  // 1. White-family override — takes priority over hex
  const whiteOverride = resolveWhiteOverride(colorFamily);
  if (whiteOverride) return whiteOverride;

  // 2. Explicit hex
  if (hexColor) return hexColor;

  // 3. General color-family fallback
  if (colorFamily) {
    const lower = colorFamily.toLowerCase();
    const sortedKeys = Object.keys(COLOR_FAMILY_FALLBACKS).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (lower.includes(key)) return COLOR_FAMILY_FALLBACKS[key];
    }
  }
  return '#808080';
}

/**
 * True when the resolved swatch is a family-based approximation
 * rather than an exact colour hex from the database.
 */
export function isApproximateColor(
  hexColor: string | null | undefined,
): boolean {
  return !hexColor;
}

/**
 * Returns true when a hex colour is dark enough to need a contrast ring
 * on dark backgrounds (luminance < 15%).
 */
export function needsContrastRing(hex: string | null | undefined): boolean {
  if (!hex) return true;
  const c = hex.replace('#', '');
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 38;
}

/**
 * Returns true when a hex colour is light enough to need a contrast border
 * on dark backgrounds (luminance > 85%).
 */
export function needsLightContrastRing(hex: string | null | undefined): boolean {
  if (!hex) return false;
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}
