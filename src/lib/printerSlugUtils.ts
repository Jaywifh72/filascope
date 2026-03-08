/**
 * Printer Slug Utilities
 * 
 * Utilities for generating and handling SEO-friendly printer slugs.
 * Mirrors the pattern used in filament slug handling.
 */

/**
 * UUID regex pattern for detecting if a string is a UUID
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID
 */
export function isUuid(str: string): boolean {
  return UUID_REGEX.test(str);
}

/**
 * Generate a SEO-friendly slug from brand and model name
 * 
 * Examples:
 * - ("Bambu Lab", "A1 Mini") -> "bambu-lab-a1-mini"
 * - ("Prusa Research", "MINI+") -> "prusa-research-mini"
 * - ("Creality", "Ender-3 V2 Neo") -> "creality-ender-3-v2-neo"
 */
export function generatePrinterSlug(
  brand: string | null | undefined,
  modelName: string | null | undefined
): string {
  const combined = `${brand || ''}-${modelName || ''}`;
  
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-')          // Collapse multiple hyphens
    .replace(/^-|-$/g, '');       // Trim leading/trailing hyphens
}

/**
 * Get the SEO-friendly URL path for a printer
 * 
 * If printer has a printer_id (slug), use that.
 * Otherwise fall back to UUID.
 */
export function getPrinterUrl(printer: { 
  printer_id?: string | null; 
  id: string;
}): string {
  const slug = printer.printer_id || printer.id;
  return `/printers/${slug}`;
}

/**
 * Get just the slug portion for a printer (without /printers/ prefix)
 */
export function getPrinterSlug(printer: { 
  printer_id?: string | null; 
  id: string;
}): string {
  return printer.printer_id || printer.id;
}

/**
 * Normalize a slug by converting underscores to hyphens
 * and cleaning up formatting
 */
export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/_/g, '-')           // Convert underscores to hyphens
    .replace(/\s+/g, '-')        // Convert spaces to hyphens
    .replace(/[^a-z0-9-]/g, '')   // Remove non-alphanumeric except hyphens
    .replace(/-+/g, '-')          // Collapse multiple hyphens
    .replace(/^-|-$/g, '');       // Trim leading/trailing hyphens
}

/**
 * Calculate similarity between two strings using token-based matching
 * Returns a score between 0 and 1
 */
export function calculateSlugSimilarity(slug1: string, slug2: string): number {
  const tokens1 = new Set(slug1.toLowerCase().split('-').filter(Boolean));
  const tokens2 = new Set(slug2.toLowerCase().split('-').filter(Boolean));
  
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  
  // Jaccard similarity: intersection / union
  const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return intersection.size / union.size;
}
