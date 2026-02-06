/**
 * SEO Slug Utilities for FilaScope
 * Generates SEO-friendly URLs for filament products
 */

/**
 * Normalize a string for URL usage
 */
function normalizeForUrl(str: string | null | undefined): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .trim()
    // Replace special characters with spaces
    .replace(/[™®©]/g, '')
    // Replace multiple spaces/dashes with single dash
    .replace(/[\s_]+/g, '-')
    // Remove non-alphanumeric except dashes
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive dashes
    .replace(/-+/g, '-')
    // Remove leading/trailing dashes
    .replace(/^-|-$/g, '');
}

/**
 * Extract color from product title
 */
function extractColorFromTitle(title: string, vendor?: string | null): string {
  if (!title) return '';
  
  // Remove vendor prefix if present
  let cleanTitle = title;
  if (vendor) {
    const vendorLower = vendor.toLowerCase();
    const titleLower = title.toLowerCase();
    if (titleLower.startsWith(vendorLower)) {
      cleanTitle = title.substring(vendor.length).trim();
    }
  }
  
  // Common color patterns to extract
  const colorPatterns = [
    // Direct color words
    /\b(black|white|gray|grey|red|blue|green|yellow|orange|purple|pink|brown|silver|gold|bronze|copper|clear|transparent|natural|ivory|cream|beige)\b/i,
    // Compound colors
    /\b(matte black|matte white|gloss black|gloss white|metallic silver|metallic gold)\b/i,
    // Specialty colors
    /\b(midnight|galaxy|cosmic|ocean|forest|coral|lavender|teal|cyan|magenta|maroon|navy|olive|salmon|tan|turquoise|violet)\b/i,
  ];
  
  for (const pattern of colorPatterns) {
    const match = cleanTitle.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  // Try to extract from common title formats like "PLA - Color Name"
  const dashSplit = cleanTitle.split(/[-–—]/);
  if (dashSplit.length > 1) {
    const potentialColor = dashSplit[dashSplit.length - 1].trim();
    if (potentialColor.length < 30 && potentialColor.length > 2) {
      return potentialColor;
    }
  }
  
  return '';
}

/**
 * Generate an SEO-friendly slug from filament data
 * Format: {brand}-{material}-{color}
 */
export function generateFilamentSlug(
  vendor: string | null | undefined,
  material: string | null | undefined,
  productTitle: string | null | undefined,
  colorFamily?: string | null
): string {
  const brand = normalizeForUrl(vendor);
  const mat = normalizeForUrl(material);
  
  // Try to get color from color_family first, then extract from title
  let color = normalizeForUrl(colorFamily);
  if (!color && productTitle) {
    color = normalizeForUrl(extractColorFromTitle(productTitle, vendor));
  }
  
  // Build slug components
  const parts: string[] = [];
  
  if (brand) parts.push(brand);
  if (mat) parts.push(mat);
  if (color) parts.push(color);
  
  // Ensure we have a valid slug
  if (parts.length === 0) {
    return normalizeForUrl(productTitle) || 'filament';
  }
  
  return parts.join('-');
}

/**
 * Generate a unique slug with optional suffix for duplicates
 */
export function generateUniqueSlug(
  baseSlug: string,
  existingSlugs: Set<string>,
  suffix?: string
): string {
  let slug = baseSlug;
  
  if (suffix) {
    slug = `${baseSlug}-${normalizeForUrl(suffix)}`;
  }
  
  // If still duplicate, add numeric suffix
  if (existingSlugs.has(slug)) {
    let counter = 2;
    while (existingSlugs.has(`${slug}-${counter}`)) {
      counter++;
    }
    slug = `${slug}-${counter}`;
  }
  
  return slug;
}

/**
 * Parse a slug back into components for database lookup
 */
export function parseFilamentSlug(slug: string): {
  brand?: string;
  material?: string;
  color?: string;
} {
  const parts = slug.split('-');
  
  // Common materials to identify
  const materials = new Set([
    'pla', 'petg', 'abs', 'asa', 'tpu', 'pa', 'pc', 'pva', 'hips',
    'nylon', 'carbon', 'wood', 'metal', 'silk', 'matte', 'glow'
  ]);
  
  let brand: string | undefined;
  let material: string | undefined;
  let colorParts: string[] = [];
  
  let foundMaterial = false;
  
  for (const part of parts) {
    if (!foundMaterial) {
      if (materials.has(part.toLowerCase())) {
        material = part;
        foundMaterial = true;
      } else if (!brand) {
        brand = part;
      } else {
        // Multi-word brand (e.g., "bambu-lab")
        brand = `${brand}-${part}`;
      }
    } else {
      colorParts.push(part);
    }
  }
  
  return {
    brand,
    material,
    color: colorParts.length > 0 ? colorParts.join('-') : undefined,
  };
}

/**
 * Calculate slug similarity score using token overlap
 * Returns a score between 0 and 1 (1 = perfect match)
 */
export function calculateSlugSimilarity(slug1: string, slug2: string): number {
  if (!slug1 || !slug2) return 0;
  if (slug1 === slug2) return 1;
  
  const tokens1 = new Set(slug1.toLowerCase().split('-').filter(t => t.length > 0));
  const tokens2 = new Set(slug2.toLowerCase().split('-').filter(t => t.length > 0));
  
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  
  // Count matching tokens
  let matches = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) {
      matches++;
    }
  }
  
  // Jaccard similarity: intersection / union
  const union = new Set([...tokens1, ...tokens2]);
  return matches / union.size;
}

/**
 * Extract primary color word from a compound color phrase
 * e.g., "basic-black" -> "black", "matte-white" -> "white"
 */
export function extractPrimaryColor(colorPhrase: string | undefined): string | undefined {
  if (!colorPhrase) return undefined;
  
  // Common color modifiers to strip
  const modifiers = new Set([
    'basic', 'matte', 'gloss', 'glossy', 'silk', 'silky', 'metallic',
    'sparkle', 'sparkly', 'pearl', 'pearlescent', 'translucent', 'transparent',
    'opaque', 'bright', 'dark', 'light', 'deep', 'pale', 'vivid', 'neon',
    'pastel', 'satin', 'marble', 'galaxy', 'rainbow', 'gradient'
  ]);
  
  const parts = colorPhrase.toLowerCase().split('-').filter(p => p.length > 0);
  
  // Return the last non-modifier word, or the last word if all are modifiers
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!modifiers.has(parts[i])) {
      return parts[i];
    }
  }
  
  return parts[parts.length - 1];
}

/**
 * Generate canonical URL for a filament
 */
export function getCanonicalFilamentUrl(slug: string): string {
  return `https://filascope.com/filament/${slug}`;
}

/**
 * Check if a string looks like a UUID
 */
export function isUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Generate HueForge-specific SEO title
 */
export function generateHueForgeSeoTitle(
  vendor: string | null | undefined,
  material: string | null | undefined,
  colorFamily: string | null | undefined,
  transmissionDistance: number | null | undefined
): string {
  const parts: string[] = [];
  
  if (vendor) parts.push(vendor);
  if (material) parts.push(material);
  if (colorFamily) parts.push(colorFamily);
  
  const baseName = parts.join(' ') || 'Filament';
  
  if (transmissionDistance) {
    return `${baseName} - TD ${transmissionDistance} HueForge Compatible | FilaScope`;
  }
  
  return `${baseName} | FilaScope`;
}

/**
 * Generate SEO-optimized meta description for filaments
 */
export function generateFilamentMetaDescription(
  vendor: string | null | undefined,
  material: string | null | undefined,
  transmissionDistance: number | null | undefined,
  nozzleTempMin: number | null | undefined,
  nozzleTempMax: number | null | undefined,
  pricePerKg: number | null | undefined
): string {
  const parts: string[] = [];
  
  // Opening with key info
  if (vendor && material) {
    if (transmissionDistance) {
      parts.push(`${vendor} ${material} with TD ${transmissionDistance} for HueForge lithophanes.`);
    } else {
      parts.push(`${vendor} ${material} filament specs and pricing.`);
    }
  }
  
  // Temperature info
  if (nozzleTempMin && nozzleTempMax) {
    parts.push(`Nozzle: ${nozzleTempMin}-${nozzleTempMax}°C.`);
  }
  
  // Price info
  if (pricePerKg) {
    parts.push(`From $${pricePerKg.toFixed(2)}/kg.`);
  }
  
  // CTA
  parts.push('Compare specs & find the best price at FilaScope.');
  
  const description = parts.join(' ');
  
  // Ensure max 160 chars
  if (description.length > 160) {
    return description.substring(0, 157) + '...';
  }
  
  return description;
}
