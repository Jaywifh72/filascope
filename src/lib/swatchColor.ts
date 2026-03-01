/**
 * Shared swatch-color utilities.
 *
 * When a filament's `color_hex` is null / empty, we derive a reasonable
 * fallback from `color_family` so swatches are never invisible.
 */

const COLOR_FAMILY_FALLBACKS: Record<string, string> = {
  white: '#F5F5F0',
  natural: '#F5F5F0',
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
 * Returns the best hex colour for a swatch.
 * Priority: explicit hex → color-family fallback → neutral grey.
 */
export function getSwatchColor(
  hexColor: string | null | undefined,
  colorFamily: string | null | undefined,
): string {
  if (hexColor) return hexColor;
  if (colorFamily) {
    const lower = colorFamily.toLowerCase();
    for (const [key, value] of Object.entries(COLOR_FAMILY_FALLBACKS)) {
      if (lower.includes(key)) return value;
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
