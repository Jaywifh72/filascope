/**
 * STANDARDIZED COLOR EXTRACTION UTILITY
 * 
 * Provides consistent color extraction logic across all brand sync functions.
 * This utility ensures:
 * 1. Colors are correctly extracted from Shopify variant titles (e.g., "Black / 1kg")
 * 2. Colors are properly mapped to hex codes using brand-specific + shared mappings
 * 3. Product line IDs do NOT include color names (for proper grouping)
 */

import { getColorHex, getColorFamily } from './color-mapping.ts';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ColorExtractionResult {
  colorName: string;
  colorHex: string | null;
  colorFamily: string | null;
}

export interface VariantInfo {
  title?: string;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
}

// ============================================================================
// WEIGHT/SIZE PATTERNS TO SKIP
// ============================================================================

const WEIGHT_SIZE_PATTERNS = [
  /^\d+\s*(g|kg|lb|lbs|oz)\b/i,           // "1000g", "1kg", etc.
  /^(1\.75|2\.85|3\.0)\s*mm\b/i,          // Diameter
  /^\d+(\.\d+)?\s*(mm|m|meters?)\b/i,     // Length/size
  /^(small|medium|large|xl|xxl)\b/i,     // Size names
  /^default\s*title$/i,                   // Shopify default
  /^[\d.,]+$/,                            // Pure numbers
];

/**
 * Check if a string is likely a weight/size value rather than a color
 */
function isWeightOrSize(value: string): boolean {
  const trimmed = value.trim();
  return WEIGHT_SIZE_PATTERNS.some(pattern => pattern.test(trimmed));
}

// ============================================================================
// COLOR EXTRACTION FROM VARIANT TITLE
// ============================================================================

/**
 * Extract color name from a Shopify variant title.
 * Handles common formats:
 * - "Color / Weight" (e.g., "Black / 1kg")
 * - "Color - Weight" (e.g., "Black - 1000g")
 * - "Weight / Color" (e.g., "1kg / Black")
 * - Plain color name
 */
export function extractColorFromVariantTitle(variantTitle: string): string | null {
  if (!variantTitle || variantTitle === 'Default Title') {
    return null;
  }

  // Try "/" separator first (most common in Shopify)
  if (variantTitle.includes('/')) {
    const parts = variantTitle.split('/').map(p => p.trim());
    for (const part of parts) {
      if (part && !isWeightOrSize(part)) {
        return part;
      }
    }
  }

  // Try " - " separator
  if (variantTitle.includes(' - ')) {
    const parts = variantTitle.split(' - ').map(p => p.trim());
    for (const part of parts) {
      if (part && !isWeightOrSize(part)) {
        return part;
      }
    }
  }

  // If no separator, check if the whole title is a color (not weight/size)
  if (!isWeightOrSize(variantTitle)) {
    return variantTitle.trim();
  }

  return null;
}

/**
 * Extract color from Shopify variant options (option1, option2, option3)
 */
export function extractColorFromVariantOptions(
  option1?: string | null,
  option2?: string | null,
  option3?: string | null
): string | null {
  const options = [option1, option2, option3].filter(Boolean);
  
  for (const opt of options) {
    if (opt && !isWeightOrSize(opt)) {
      return opt.trim();
    }
  }
  
  return null;
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract color information from a variant using multiple strategies.
 * 
 * @param variant - Shopify variant with title and options
 * @param productTitle - Product title (fallback for color extraction)
 * @param brandColorMap - Optional brand-specific color->hex mapping
 * @returns ColorExtractionResult with colorName, colorHex, and colorFamily
 */
export function extractColorFromVariant(
  variant: VariantInfo,
  productTitle: string,
  brandColorMap?: Record<string, string>
): ColorExtractionResult {
  let colorName: string | null = null;

  // Strategy 1: Extract from variant title (most reliable)
  if (variant.title) {
    colorName = extractColorFromVariantTitle(variant.title);
  }

  // Strategy 2: Extract from variant options
  if (!colorName) {
    colorName = extractColorFromVariantOptions(
      variant.option1,
      variant.option2,
      variant.option3
    );
  }

  // Strategy 3: Try to extract from product title (last resort)
  if (!colorName) {
    colorName = extractColorFromProductTitle(productTitle);
  }

  // Default if nothing found
  if (!colorName) {
    colorName = 'Unknown';
  }

  // Get hex code
  const colorHex = getColorHexWithFallback(colorName, brandColorMap);
  
  // Get color family
  const colorFamily = colorHex ? getColorFamily(colorHex) : null;

  return {
    colorName,
    colorHex,
    colorFamily,
  };
}

/**
 * Try to extract a color name from the end of a product title.
 * Many products follow patterns like "PLA Matte - Black" or "PETG Pro Red"
 */
function extractColorFromProductTitle(title: string): string | null {
  // Common color names to look for at end of title
  const colorKeywords = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
    'pink', 'brown', 'grey', 'gray', 'silver', 'gold', 'bronze', 'copper',
    'natural', 'clear', 'transparent', 'translucent'
  ];

  const titleLower = title.toLowerCase();
  
  // Check if title ends with a color name
  for (const color of colorKeywords) {
    if (titleLower.endsWith(color) || titleLower.endsWith(` ${color}`)) {
      // Extract the actual casing from title
      const regex = new RegExp(`(${color})\\s*$`, 'i');
      const match = title.match(regex);
      if (match) {
        return match[1];
      }
    }
  }

  return null;
}

// ============================================================================
// COLOR HEX LOOKUP
// ============================================================================

/**
 * Get hex code for a color name, trying brand-specific map first,
 * then falling back to shared color-mapping.ts
 */
export function getColorHexWithFallback(
  colorName: string,
  brandColorMap?: Record<string, string>
): string | null {
  const normalizedName = colorName.toLowerCase().trim();

  // Try brand-specific map first
  if (brandColorMap) {
    const brandHex = brandColorMap[normalizedName];
    if (brandHex) {
      // Ensure hex has # prefix
      return brandHex.startsWith('#') ? brandHex : `#${brandHex}`;
    }
    
    // Try partial match in brand map
    for (const [key, hex] of Object.entries(brandColorMap)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return hex.startsWith('#') ? hex : `#${hex}`;
      }
    }
  }

  // Fall back to shared color mapping
  const sharedHex = getColorHex(normalizedName);
  if (sharedHex) {
    return sharedHex.startsWith('#') ? sharedHex : `#${sharedHex}`;
  }

  return null;
}

// ============================================================================
// PRODUCT LINE ID HELPERS
// ============================================================================

/**
 * Common color terms that should be removed from product line IDs
 * to ensure variants of different colors group together
 */
const COLOR_TERMS_TO_STRIP = [
  // Basic colors
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
  'pink', 'brown', 'grey', 'gray', 'silver', 'gold', 'bronze', 'copper',
  'natural', 'clear', 'transparent', 'translucent', 'ivory', 'cream',
  'beige', 'tan', 'olive', 'teal', 'cyan', 'magenta', 'lime', 'mint',
  'coral', 'salmon', 'maroon', 'burgundy', 'navy', 'charcoal', 'midnight',
  'rose', 'lavender', 'violet', 'indigo', 'peach', 'aqua', 'turquoise',
  // Compound colors
  'sky blue', 'royal blue', 'light blue', 'dark blue', 'forest green',
  'army green', 'olive green', 'light green', 'dark green', 'light grey',
  'dark grey', 'light gray', 'dark gray', 'wine red', 'hot pink',
  'neon green', 'neon pink', 'neon orange', 'glow green', 'glow blue',
  // Special
  'matte black', 'matte white', 'silk gold', 'silk silver', 'rose gold',
];

/**
 * Remove color names from a string for use in product line ID generation.
 * This ensures all color variants of a product share the same product_line_id.
 */
export function stripColorsFromText(text: string): string {
  let result = text.toLowerCase();
  
  // Sort by length (longest first) to handle compound colors first
  const sortedColors = [...COLOR_TERMS_TO_STRIP].sort((a, b) => b.length - a.length);
  
  for (const color of sortedColors) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${color}\\b`, 'gi');
    result = result.replace(regex, '');
  }
  
  // Clean up whitespace
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Generate a clean slug from text, suitable for product line IDs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
