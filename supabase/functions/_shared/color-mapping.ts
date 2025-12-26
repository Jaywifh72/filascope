/**
 * UNIFIED COLOR MAPPING FOR ALL SCRAPERS
 * 
 * This module provides a single source of truth for color name to hex code mappings
 * across all brand scrapers (Elegoo, Bambu Lab, generic, etc.)
 * 
 * Usage:
 * import { getColorHex, COLOR_HEX_MAP } from '../_shared/color-mapping.ts';
 * const hex = getColorHex('Matte Black'); // Returns '1A1A1A'
 */

// ============================================================================
// COMPREHENSIVE COLOR HEX MAPPING
// ============================================================================

/**
 * Master color hex mapping - consolidated from all scrapers
 * Keys are lowercase for case-insensitive matching
 * Values are 6-character hex codes WITHOUT the # prefix
 */
export const COLOR_HEX_MAP: Record<string, string> = {
  // ==================== BASIC COLORS ====================
  'black': '1A1A1A',
  'white': 'FFFFFF',
  'grey': '808080',
  'gray': '808080',
  'red': 'DC2626',
  'blue': '2563EB',
  'green': '16A34A',
  'yellow': 'EAB308',
  'orange': 'EA580C',
  'purple': '9333EA',
  'pink': 'EC4899',
  'brown': '92400E',
  'beige': 'D4C4A8',
  'silver': 'C0C0C0',
  'gold': 'D4AF37',
  'copper': 'B87333',
  'bronze': 'CD7F32',
  'transparent': 'FFFFFF',
  'clear': 'FFFFFF',
  'natural': 'F5F5DC',
  'ivory': 'FFFFF0',
  'cream': 'FFFDD0',
  'tan': 'D2B48C',
  'olive': '808000',
  'teal': '008080',
  'cyan': '00FFFF',
  'magenta': 'FF00FF',
  'lime': '00FF00',
  'mint': '98FF98',
  'coral': 'FF7F50',
  'salmon': 'FA8072',
  'maroon': '800000',
  'burgundy': '800020',
  'navy': '1E3A5F',
  'charcoal': '36454F',
  'midnight': '191970',
  'rose': 'FF007F',
  'lavender': 'E6E6FA',
  'violet': 'EE82EE',
  'indigo': '4B0082',
  'peach': 'FFCBA4',
  'aqua': '00FFFF',
  'turquoise': '40E0D0',
  'khaki': 'C3B091',
  'camel': 'C19A6B',
  'coffee': '6F4E37',
  'chocolate': 'D2691E',
  'skin': 'FFCBA4',
  'flesh': 'FFCBA4',

  // ==================== BLUE VARIANTS ====================
  'navy blue': '000080',
  'sky blue': '87CEEB',
  'royal blue': '4169E1',
  'light blue': 'ADD8E6',
  'dark blue': '00008B',
  'lake blue': '4682B4',
  'peacock blue': '005F69',
  'sapphire blue': '0F52BA',
  'cobalt blue': '0047AB',
  'midnight blue': '191970',
  'ice blue': 'B0E0E6',
  'azure': '489FDF',

  // ==================== GREEN VARIANTS ====================
  'forest green': '228B22',
  'olive green': '6B8E23',
  'light green': '90EE90',
  'dark green': '006400',
  'mint green': '98FF98',
  'grass green': '7CFC00',
  'army green': '4B5320',
  'bambu green': '00AE42',

  // ==================== GREY VARIANTS ====================
  'light grey': 'D3D3D3',
  'light gray': 'D3D3D3',
  'dark grey': 'A9A9A9',
  'dark gray': 'A9A9A9',
  'stone grey': '928E85',
  'stone gray': '928E85',
  'space grey': '4F4F4F',
  'space gray': '4F4F4F',
  'cement grey': '8D918D',
  'cement gray': '8D918D',

  // ==================== RED VARIANTS ====================
  'burgundy red': '800020',
  'wine red': '722F37',
  'scarlet': 'FF2400',
  'crimson': 'DC143C',

  // ==================== YELLOW/ORANGE VARIANTS ====================
  'tangerine': 'FF9966',
  'tangerine yellow': 'FFC72C',
  'mustard': 'FFDB58',
  'lemon': 'FFF44F',

  // ==================== NEON COLORS ====================
  'neon green': '39FF14',
  'neon pink': 'FF6EC7',
  'neon orange': 'FF5F1F',
  'neon yellow': 'CCFF00',
  'hot pink': 'FF69B4',

  // ==================== GLOW COLORS ====================
  'glow green': '39FF14',
  'glow blue': '00BFFF',
  'glow orange': 'FF4500',

  // ==================== MATTE FINISH ====================
  'matte black': '1A1A1A',
  'matte white': 'FAFAFA',
  'matte grey': '808080',
  'matte gray': '808080',
  'matte beige': 'D4C4A8',
  'matte red': 'B91C1C',
  'matte blue': '1D4ED8',
  'matte green': '15803D',

  // ==================== SILK FINISH ====================
  'silk white': 'FFFEF0',
  'silk black': '2D2D2D',
  'silk gold': 'FFD700',
  'silk silver': 'E8E8E8',
  'silk copper': 'DA8A67',
  'silk bronze': 'CD7F32',
  'silk red': 'DC143C',
  'silk blue': '4169E1',
  'silk green': '32CD32',
  'silk purple': '9370DB',
  'silk pink': 'FFB6C1',

  // ==================== TRANSLUCENT/TRANSPARENT ====================
  'translucent': 'FFFFFF',
  'translucent blue': '87CEEB',
  'translucent green': '90EE90',
  'translucent red': 'FF6B6B',
  'translucent orange': 'FFB347',
  'translucent yellow': 'FFFF99',
  'translucent purple': 'DDA0DD',

  // ==================== SPECIAL/MULTI ====================
  'rainbow': 'FF0000',
  'multicolor': 'FF0000',
  'earth brown': '5C4033',
  'lavender purple': 'B57EDC',

  // ==================== WOOD TONES ====================
  'maple': 'C19A6B',
  'walnut': '5D432C',
  'oak': 'B8860B',
  'bamboo': 'D4B896',
};

// ============================================================================
// COLOR FAMILY DEFINITIONS
// ============================================================================

export const COLOR_FAMILY_MAP: Record<string, string> = {
  // Blacks
  'black': 'Black',
  'matte black': 'Black',
  'silk black': 'Black',
  'charcoal': 'Black',
  'midnight': 'Black',
  
  // Whites
  'white': 'White',
  'matte white': 'White',
  'silk white': 'White',
  'ivory': 'White',
  'cream': 'White',
  
  // Grays
  'grey': 'Gray',
  'gray': 'Gray',
  'silver': 'Gray',
  'light grey': 'Gray',
  'light gray': 'Gray',
  'dark grey': 'Gray',
  'dark gray': 'Gray',
  'stone grey': 'Gray',
  'space grey': 'Gray',
  'cement grey': 'Gray',
  'matte grey': 'Gray',
  'silk silver': 'Gray',
  
  // Reds
  'red': 'Red',
  'matte red': 'Red',
  'silk red': 'Red',
  'burgundy': 'Red',
  'burgundy red': 'Red',
  'wine red': 'Red',
  'maroon': 'Red',
  'scarlet': 'Red',
  'crimson': 'Red',
  
  // Oranges
  'orange': 'Orange',
  'neon orange': 'Orange',
  'glow orange': 'Orange',
  'tangerine': 'Orange',
  'coral': 'Orange',
  'salmon': 'Orange',
  'peach': 'Orange',
  
  // Yellows
  'yellow': 'Yellow',
  'neon yellow': 'Yellow',
  'tangerine yellow': 'Yellow',
  'gold': 'Yellow',
  'silk gold': 'Yellow',
  'lemon': 'Yellow',
  'mustard': 'Yellow',
  
  // Greens
  'green': 'Green',
  'matte green': 'Green',
  'silk green': 'Green',
  'neon green': 'Green',
  'glow green': 'Green',
  'forest green': 'Green',
  'olive green': 'Green',
  'olive': 'Green',
  'mint': 'Green',
  'mint green': 'Green',
  'lime': 'Green',
  'teal': 'Green',
  'grass green': 'Green',
  'army green': 'Green',
  'bambu green': 'Green',
  
  // Blues
  'blue': 'Blue',
  'matte blue': 'Blue',
  'silk blue': 'Blue',
  'glow blue': 'Blue',
  'navy': 'Blue',
  'navy blue': 'Blue',
  'sky blue': 'Blue',
  'royal blue': 'Blue',
  'light blue': 'Blue',
  'dark blue': 'Blue',
  'lake blue': 'Blue',
  'peacock blue': 'Blue',
  'sapphire blue': 'Blue',
  'cobalt blue': 'Blue',
  'midnight blue': 'Blue',
  'ice blue': 'Blue',
  'azure': 'Blue',
  'cyan': 'Blue',
  'aqua': 'Blue',
  'turquoise': 'Blue',
  
  // Purples
  'purple': 'Purple',
  'silk purple': 'Purple',
  'lavender': 'Purple',
  'lavender purple': 'Purple',
  'violet': 'Purple',
  'indigo': 'Purple',
  'magenta': 'Purple',
  'plum': 'Purple',
  
  // Pinks
  'pink': 'Pink',
  'silk pink': 'Pink',
  'neon pink': 'Pink',
  'hot pink': 'Pink',
  'rose': 'Pink',
  'fuchsia': 'Pink',
  
  // Browns
  'brown': 'Brown',
  'tan': 'Brown',
  'beige': 'Brown',
  'matte beige': 'Brown',
  'khaki': 'Brown',
  'camel': 'Brown',
  'coffee': 'Brown',
  'chocolate': 'Brown',
  'earth brown': 'Brown',
  'copper': 'Brown',
  'silk copper': 'Brown',
  'bronze': 'Brown',
  'silk bronze': 'Brown',
  
  // Transparent/Clear
  'transparent': 'Clear',
  'translucent': 'Clear',
  'clear': 'Clear',
  'translucent blue': 'Clear',
  'translucent green': 'Clear',
  'translucent red': 'Clear',
  'translucent orange': 'Clear',
  'translucent yellow': 'Clear',
  'translucent purple': 'Clear',
  
  // Natural
  'natural': 'Natural',
  'skin': 'Natural',
  'flesh': 'Natural',
  
  // Multi
  'rainbow': 'Multi',
  'multicolor': 'Multi',
  
  // Wood
  'maple': 'Wood',
  'walnut': 'Wood',
  'oak': 'Wood',
  'bamboo': 'Wood',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the hex code for a color name (case-insensitive)
 * Returns null if color is not found
 */
export function getColorHex(colorName: string | null | undefined): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct lookup
  if (COLOR_HEX_MAP[normalized]) {
    return COLOR_HEX_MAP[normalized];
  }
  
  // Try removing common prefixes/suffixes
  const cleanedName = normalized
    .replace(/\s*(matte|silk|glossy|metallic|sparkle|galaxy)\s*/g, '')
    .trim();
  
  if (COLOR_HEX_MAP[cleanedName]) {
    return COLOR_HEX_MAP[cleanedName];
  }
  
  // Try partial matching (longest match first)
  const sortedColors = Object.keys(COLOR_HEX_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedColors) {
    if (normalized.includes(key)) {
      return COLOR_HEX_MAP[key];
    }
  }
  
  return null;
}

/**
 * Get the color family for a color name (case-insensitive)
 * Returns null if color family cannot be determined
 */
export function getColorFamily(colorName: string | null | undefined): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct lookup
  if (COLOR_FAMILY_MAP[normalized]) {
    return COLOR_FAMILY_MAP[normalized];
  }
  
  // Try partial matching (longest match first)
  const sortedColors = Object.keys(COLOR_FAMILY_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedColors) {
    if (normalized.includes(key)) {
      return COLOR_FAMILY_MAP[key];
    }
  }
  
  return null;
}

/**
 * Extract color name and hex from a product title
 * Looks for color patterns in the title and returns both the extracted name and hex
 */
export function extractColorFromTitle(title: string): { colorName: string | null; colorHex: string | null; colorFamily: string | null } {
  if (!title) {
    return { colorName: null, colorHex: null, colorFamily: null };
  }
  
  const titleLower = title.toLowerCase();
  
  // Pattern 1: "Product - Color" format (common for many brands)
  const dashMatch = title.match(/\s-\s([^-]+)$/);
  if (dashMatch) {
    const colorPart = dashMatch[1].trim().toLowerCase();
    // Clean out weight/size specs from color part
    const cleanColor = colorPart.replace(/\d+(?:\.\d+)?(?:kg|g|mm)/gi, '').trim();
    
    const hex = getColorHex(cleanColor);
    const family = getColorFamily(cleanColor);
    
    return { colorName: cleanColor, colorHex: hex, colorFamily: family };
  }
  
  // Pattern 2: Check for color words anywhere in title (longest first)
  const sortedColors = Object.keys(COLOR_HEX_MAP).sort((a, b) => b.length - a.length);
  for (const colorName of sortedColors) {
    if (titleLower.includes(colorName)) {
      return { 
        colorName, 
        colorHex: COLOR_HEX_MAP[colorName], 
        colorFamily: getColorFamily(colorName) 
      };
    }
  }
  
  return { colorName: null, colorHex: null, colorFamily: null };
}

/**
 * Normalize grey/gray variants for consistent matching
 */
export function normalizeColorName(colorName: string): string {
  return colorName.toLowerCase().trim().replace(/gray/gi, 'grey');
}

/**
 * Get color variants (aliases) for matching across regions
 * e.g., "grey" and "gray" are equivalent
 */
export function getColorVariants(colorName: string): string[] {
  const normalized = colorName.toLowerCase().trim();
  
  const aliases: Record<string, string[]> = {
    'grey': ['gray', 'grey'],
    'gray': ['gray', 'grey'],
    'light grey': ['light gray', 'light grey'],
    'light gray': ['light gray', 'light grey'],
    'dark grey': ['dark gray', 'dark grey'],
    'dark gray': ['dark gray', 'dark grey'],
    'space grey': ['space gray', 'space grey'],
    'space gray': ['space gray', 'space grey'],
    'cement grey': ['cement gray', 'cement grey'],
    'cement gray': ['cement gray', 'cement grey'],
    'matte grey': ['matte gray', 'matte grey'],
    'matte gray': ['matte gray', 'matte grey'],
    'stone grey': ['stone gray', 'stone grey'],
    'stone gray': ['stone gray', 'stone grey'],
  };
  
  return aliases[normalized] || [normalized];
}
