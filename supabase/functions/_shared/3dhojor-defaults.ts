/**
 * 3DHOJOR Brand-Specific Defaults
 * 
 * Consumer-focused PLA/PETG/TPU brand with Shopify store.
 * Specializes in Matte, Silk Dual/Tri Color, and Crystal Rainbow filaments.
 * No TDS documentation available.
 */

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

const HOJOR_MATERIAL_PATTERNS: Array<{ pattern: RegExp; material: string }> = [
  // Most specific first - high speed
  { pattern: /pla\s*hs|pla\s*high\s*speed|rapid\s*pla/i, material: 'PLA-HS' },
  // PLA+ must use negative lookahead to NOT match combo products like "Pro / Basic / Lite"
  { pattern: /pla\s*pro(?!\s*\/)|pla\+|pla\s*plus/i, material: 'PLA+' },
  { pattern: /pla[\s-]*lite/i, material: 'PLA' },
  { pattern: /\bpetg\b/i, material: 'PETG' },
  { pattern: /tpu\s*95a?/i, material: 'TPU-95A' },
  { pattern: /\bpla\b/i, material: 'PLA' }, // Catch-all for PLA variants
];

export function normalize3DHOJORMaterial(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  for (const { pattern, material } of HOJOR_MATERIAL_PATTERNS) {
    if (pattern.test(lowerTitle)) {
      return material;
    }
  }
  
  // Default to PLA for this brand
  return 'PLA';
}

// ============================================================================
// PRINT SETTINGS
// ============================================================================

interface PrintSettings {
  nozzle_temp_min_c: number;
  nozzle_temp_max_c: number;
  bed_temp_min_c: number;
  bed_temp_max_c: number;
  high_speed_capable?: boolean;
}

const HOJOR_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
  },
  'PLA+': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
  },
  'PLA-HS': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
    high_speed_capable: true,
  },
  'PETG': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 70,
    bed_temp_max_c: 85,
  },
  'TPU-95A': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 30,
    bed_temp_max_c: 60,
  },
};

export function get3DHOJORPrintSettings(material: string): PrintSettings | null {
  return HOJOR_PRINT_SETTINGS[material] || HOJOR_PRINT_SETTINGS['PLA'];
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

type FinishType = 'Standard' | 'Matte' | 'Silk' | 'Translucent';

export function extract3DHOJORFinishType(title: string): FinishType {
  const lowerTitle = title.toLowerCase();
  
  if (/\bmatte\b/i.test(lowerTitle)) {
    return 'Matte';
  }
  
  if (/\bsilk\b/i.test(lowerTitle)) {
    return 'Silk';
  }
  
  if (/crystal|rainbow|clear|transparent/i.test(lowerTitle)) {
    return 'Translucent';
  }
  
  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generate3DHOJORProductLineId(title: string, material: string): string {
  const lowerTitle = title.toLowerCase();
  const materialSlug = material.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Silk variants - ORDER MATTERS (most specific first)
  if (/silk.*rainbow|rainbow.*silk/i.test(lowerTitle)) {
    return `3dhojor__pla__silk-rainbow`;
  }
  if (/silk.*tri|tri.*color.*silk/i.test(lowerTitle)) {
    return `3dhojor__pla__silk-tri`;
  }
  if (/silk.*dual|dual.*color.*silk/i.test(lowerTitle)) {
    return `3dhojor__pla__silk-dual`;
  }
  if (/\bsilk\b/i.test(lowerTitle)) {
    return `3dhojor__pla__silk`;
  }
  
  // Crystal Rainbow (non-silk)
  if (/crystal.*rainbow|transparent.*rainbow/i.test(lowerTitle)) {
    return `3dhojor__pla__crystal-rainbow`;
  }
  
  // Matte variants
  if (/matte.*dual|dual.*matte/i.test(lowerTitle)) {
    return `3dhojor__pla__matte-dual`;
  }
  if (/\bmatte\b/i.test(lowerTitle)) {
    return `3dhojor__pla__matte`;
  }
  
  // Wood-like PLA - must come before generic PLA check
  if (/wood[-\s]?like|wood\s*pla/i.test(lowerTitle)) {
    return `3dhojor__pla__wood`;
  }
  
  // Rapid PLA (High-Speed) - detect by title, not just material
  if (/rapid\s*pla|pla\s*hs|high\s*speed/i.test(lowerTitle)) {
    return `3dhojor__pla-hs__rapid`;
  }
  
  // PLA variants
  if (/pla[\s-]*lite/i.test(lowerTitle)) {
    return `3dhojor__pla__lite`;
  }
  if (/pla\s*pro|pla\+|pla\s*plus/i.test(lowerTitle)) {
    return `3dhojor__pla-plus__pro`;
  }
  
  // Basic material types
  if (material === 'PETG') {
    return `3dhojor__petg__standard`;
  }
  if (material === 'TPU-95A') {
    return `3dhojor__tpu-95a__standard`;
  }
  if (material === 'PLA-HS') {
    return `3dhojor__pla-hs__rapid`;
  }
  
  // Default basic PLA
  return `3dhojor__pla__basic`;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

const HOJOR_COLOR_MAPPING: Record<string, string> = {
  // Basic colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'cold white': '#F8F8FF',
  'milky white': '#FFFAF0',
  'bone white': '#F9F6EE',
  'warm white': '#FAF0E6',
  'matte milky white': '#FAF8F5',
  'matte cold white': '#F0F0F5',
  'grey': '#808080',
  'gray': '#808080',
  'light gray': '#C0C0C0',
  'light grey': '#C0C0C0',
  'silver': '#C0C0C0',
  
  // Bright colors
  'red': '#DC2626',
  'fire engine red': '#DC2626',
  'blue': '#2563EB',
  'light blue': '#87CEEB',
  'sky blue': '#87CEEB',
  'pink': '#EC4899',
  'orange': '#F97316',
  'purple': '#7C3AED',
  'green': '#22C55E',
  'yellow': '#EAB308',
  'brown': '#92400E',
  
  // Matte pastels
  'peach pink': '#FFDAB9',
  'mint green': '#98FB98',
  'tangerine': '#FF9966',
  'almond yellow': '#FFEBCD',
  'light khaki': '#F0E68C',
  'morandi purple': '#9B8AA5',
  'lake blue': '#6495ED',
  'rose gold': '#B76E79',
  'sage': '#9CAF88',
  'dusty rose': '#D4A5A5',
  'lavender': '#E6E6FA',
  'cream': '#FFFDD0',
  'beige': '#F5F5DC',
  'stone': '#928E85',
  'slate': '#708090',
  
  // Silk colors (shimmer effect)
  'silk black': '#1A1A1A',
  'silk white': '#F8F8FF',
  'silk red': '#DC143C',
  'silk blue': '#4169E1',
  'silk green': '#3CB371',
  'silk gold': '#FFD700',
  'silk silver': '#C0C0C0',
  'silk copper': '#B87333',
  'silk purple': '#9932CC',
  'silk pink': '#FF69B4',
  'silk orange': '#FF8C00',
  
  // Dual color combinations (use primary color hex)
  'black red': '#8B0000',
  'red black': '#8B0000',
  'gold silver': '#DAA520',
  'silver gold': '#DAA520',
  'blue green': '#2E8B57',
  'green blue': '#2E8B57',
  'purple pink': '#9370DB',
  'pink purple': '#9370DB',
  'red gold': '#CD5C5C',
  'gold red': '#CD5C5C',
  'blue purple': '#6A5ACD',
  'purple blue': '#6A5ACD',
  'orange yellow': '#FFA500',
  'yellow orange': '#FFA500',
  'cyan magenta': '#00CED1',
  'magenta cyan': '#00CED1',
  
  // Tri color combinations
  'gold silver copper': '#D4AF37',
  'red gold black': '#8B0000',
  'blue purple pink': '#7B68EE',
  'rainbow': '#FF6B6B',
  
  // Crystal Rainbow variants
  'wheat field': '#F5DEB3',
  'prairie': '#9ACD32',
  'glacier': '#B0E0E6',
  'galaxy': '#4B0082',
  'nebulae': '#663399',
  'late autumn': '#CD853F',
  'maple leaf': '#8B4513',
  'flame': '#FF4500',
  'aurora': '#00FF7F',
  'sunset': '#FF7F50',
  'ocean': '#006994',
  
  // TPU colors
  'transparent': '#E8E8E8',
  'clear': '#F0F0F0',
  'transparent red': '#FF6B6B',
  'transparent blue': '#6B9FFF',
  'transparent green': '#6BFF6B',
  
  // Additional colors
  'army green': '#4B5320',
  'forest green': '#228B22',
  'navy': '#000080',
  'navy blue': '#000080',
  'teal': '#008080',
  'magenta': '#FF00FF',
  'cyan': '#00FFFF',
  'lime': '#32CD32',
  'coral': '#FF7F50',
  'turquoise': '#40E0D0',
  'maroon': '#800000',
  'olive': '#808000',
  'tan': '#D2B48C',
  'chocolate': '#D2691E',
  'wine': '#722F37',
  'burgundy': '#800020',
  'rust': '#B7410E',
  'peach': '#FFCBA4',
  'apricot': '#FBCEB1',
  'mint': '#98FF98',
  
  // Missing colors from Post Sync Check
  'very peri': '#6667AB',
  'veri peri': '#6667AB',
  'silk bronze': '#CD7F32',
  'bronze': '#CD7F32',
  'natural': '#F5F5DC',
  'petg natural': '#E8E8E8',
};

export function get3DHOJORColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (HOJOR_COLOR_MAPPING[normalized]) {
    return HOJOR_COLOR_MAPPING[normalized];
  }
  
  // Partial match - check if color name contains any mapping key
  for (const [key, hex] of Object.entries(HOJOR_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// COLOR EXTRACTION FROM TITLE
// ============================================================================

export function extract3DHOJORColorFromTitle(title: string): string | null {
  // Remove common prefixes/suffixes
  let cleanTitle = title
    .replace(/3d\s*hojor/gi, '')
    .replace(/pla\+?|petg|tpu\s*95a?/gi, '')
    .replace(/matte|silk|crystal|rainbow/gi, '')
    .replace(/dual\s*color|tri\s*color/gi, '')
    .replace(/filament/gi, '')
    .replace(/1\.75\s*mm/gi, '')
    .replace(/\d+\s*(g|kg)/gi, '')
    .replace(/\d+\s*pack/gi, '')
    .trim();
  
  // Try to match remaining text as color
  if (cleanTitle.length > 0 && cleanTitle.length < 50) {
    return cleanTitle.trim();
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function clean3DHOJORTitle(title: string): string {
  return title
    .replace(/3D\s*HoJor\s*/gi, '')
    .replace(/\b1\.75\s*mm\b/gi, '')
    .replace(/\b1\s*KG\b/gi, '')
    .replace(/\b1000\s*g\b/gi, '')
    .replace(/\bFilament\b/gi, '')
    .replace(/\bfor\s+3D\s+Printer\b/gi, '')
    .replace(/\bCompatible\s+with.*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// VARIANT REGION EXTRACTION
// ============================================================================

export function extract3DHOJORRegion(variantTitle: string): string | null {
  const match = variantTitle.match(/^(US|CA|DE|EU|UK)\s*\//i);
  if (match) {
    return match[1].toUpperCase();
  }
  return null;
}

export function extract3DHOJORColorFromVariant(variantTitle: string): string | null {
  // Variant format: "Region / Size / Color" or "Size / Color"
  const parts = variantTitle.split('/').map(p => p.trim());
  
  // Last part is usually the color
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    
    // Filter out non-color values
    if (
      /^\d+\s*(g|kg)$/i.test(lastPart) ||           // Size like "1KG"
      /^(US|CA|DE|EU|UK)$/i.test(lastPart) ||       // Region
      /^\d+\s*\*\s*\d+/i.test(lastPart) ||          // Multi-pack like "2*1KG"
      /^(default|title|option)/i.test(lastPart)     // Default Shopify values
    ) {
      // Try the second-to-last part
      if (parts.length >= 3) {
        const secondLast = parts[parts.length - 2];
        if (!/^\d+/.test(secondLast) && !/^(US|CA|DE|EU|UK)$/i.test(secondLast)) {
          return secondLast;
        }
      }
      return null;
    }
    return lastPart;
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface HOJOREnrichmentResult {
  material: string;
  finish_type: FinishType;
  product_line_id: string;
  print_settings: PrintSettings | null;
  color_hex: string | null;
  cleaned_title: string;
  high_speed_capable: boolean;
  diameter_nominal_mm: number;
}

export function enrich3DHOJORProduct(
  title: string,
  colorName?: string | null,
  existingMaterial?: string | null
): HOJOREnrichmentResult {
  const material = existingMaterial || normalize3DHOJORMaterial(title);
  const finishType = extract3DHOJORFinishType(title);
  const productLineId = generate3DHOJORProductLineId(title, material);
  const printSettings = get3DHOJORPrintSettings(material);
  
  // Get color hex
  let colorHex: string | null = null;
  if (colorName) {
    colorHex = get3DHOJORColorHex(colorName);
  }
  if (!colorHex) {
    const extractedColor = extract3DHOJORColorFromTitle(title);
    if (extractedColor) {
      colorHex = get3DHOJORColorHex(extractedColor);
    }
  }
  
  const cleanedTitle = clean3DHOJORTitle(title);
  const highSpeedCapable = printSettings?.high_speed_capable || false;
  
  return {
    material,
    finish_type: finishType,
    product_line_id: productLineId,
    print_settings: printSettings,
    color_hex: colorHex,
    cleaned_title: cleanedTitle,
    high_speed_capable: highSpeedCapable,
    diameter_nominal_mm: 1.75,
  };
}

// ============================================================================
// STORE INFO
// ============================================================================

export const HOJOR_STORE_INFO = {
  baseUrl: 'https://3dhojor.com',
  productsUrl: 'https://3dhojor.com/products.json',
  vendor: '3DHOJOR',
  defaultDiameter: 1.75,
  defaultWeight: 1000,
  currency: 'USD',
};

export function get3DHOJORProductUrl(handle: string): string {
  return `${HOJOR_STORE_INFO.baseUrl}/products/${handle}`;
}
