/**
 * Convert a brand name to a URL-friendly slug.
 * e.g., "Spectrum Filaments" → "spectrum-filaments"
 *       "3D JAKE" → "3d-jake"
 *       "eSUN" → "esun"
 */
export function toBrandSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-')         // Spaces → hyphens
    .replace(/-+/g, '-')          // Collapse multiple hyphens
    .replace(/^-|-$/g, '');       // Trim leading/trailing hyphens
}

/**
 * Check if a URL parameter looks like an encoded brand name (has spaces, uppercase, etc.)
 * vs a proper slug (lowercase, hyphenated).
 */
export function isEncodedBrandName(param: string): boolean {
  const decoded = decodeURIComponent(param);
  // If decoding changes it, or it has uppercase, or spaces — it's an old format
  return decoded !== param || /[A-Z]/.test(param) || /\s/.test(decoded);
}
