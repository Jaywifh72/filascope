/**
 * Validates finish_type values from the database.
 * Filters out raw DB codes like "TD 2", "9.0", or other non-descriptive values.
 */

const VALID_FINISH_TYPES = new Set([
  'matte', 'glossy', 'silk', 'standard', 'satin', 'textured', 'semi-matte',
  'semi-glossy', 'sparkle', 'glitter', 'marble', 'galaxy', 'rainbow',
  'dual-color', 'tri-color', 'metallic', 'wood', 'stone', 'glow',
  'translucent', 'transparent', 'opaque', 'frosted',
]);

export function isValidFinishType(value: string): boolean {
  const lower = value.toLowerCase().trim();
  if (VALID_FINISH_TYPES.has(lower)) return true;
  // Reject anything that contains digits (codes like "TD 2", "9.0")
  if (/\d/.test(value)) return false;
  // Accept if it's at least 3 chars and purely alphabetical/spaces/hyphens
  return /^[a-zA-Z][a-zA-Z\s-]{2,}$/.test(value);
}
