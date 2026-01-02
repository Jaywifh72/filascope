/**
 * AMOLEN Brand-Specific Defaults
 * 
 * Consumer-focused PLA/PETG/TPU brand with Shopify store.
 * Specializes in Silk PLA (single, dual, tri-color), Matte PLA, and specialty filaments.
 * 
 * KEY ARCHITECTURE NOTES:
 * 1. Amolen uses "Delivery Option" as variant option1 (US to US vs China shipping) - NOT color
 * 2. Variety/Sample packs are multi-color bundles - should NOT have color extraction
 * 3. Product titles should be used as-is from Shopify, not constructed from variants
 */

// ============================================================================
// STORE INFO
// ============================================================================

export const AMOLEN_STORE_INFO = {
  domain: 'amolen.com',
  baseUrl: 'https://amolen.com',
  productsUrl: 'https://amolen.com/products.json',
  vendor: 'Amolen',
  defaultCurrency: 'USD',
};

// ============================================================================
// DELIVERY OPTIONS (NOT colors!)
// ============================================================================

// Amolen uses variant option1 as delivery option, NOT color
export const AMOLEN_DELIVERY_OPTIONS = [
  'U.S. to U.S.',
  'China to U.S. & Worldwide',
  'US to US',
  'China to US',
  'US to U.S.',
  'China to U.S.',
];

/**
 * Check if a variant option is a delivery/shipping option (not a color)
 */
export function isAmolenDeliveryOption(option: string): boolean {
  if (!option) return false;
  const lower = option.toLowerCase();
  
  // Direct matches
  if (AMOLEN_DELIVERY_OPTIONS.some(d => lower.includes(d.toLowerCase()))) {
    return true;
  }
  
  // Pattern matches
  return (
    lower.includes('u.s.') ||
    lower.includes('china') ||
    lower.includes('worldwide') ||
    lower.includes('delivery') ||
    lower.includes('shipping') ||
    /\bto\b/.test(lower) // "X to Y" pattern
  );
}

// ============================================================================
// VARIETY/SAMPLE PACK DETECTION
// ============================================================================

// Products that are multi-color bundles (should NOT have individual color swatches)
export const AMOLEN_VARIETY_PACK_KEYWORDS = [
  'variety pack',
  'sample pack',
  'all in one',
  'all-in-one',
  'pack 4x',
  'pack 3x',
  '4x200g',
  '3x200g',
  'bundle',
  'combo pack',
  'multicolor pack',
  'collection pack',
  'starter pack',
  'black/white',
  'white/black',
];

/**
 * Check if product is a variety/sample pack (multi-color bundle)
 */
export function isAmolenVarietyPack(title: string): boolean {
  const lower = title.toLowerCase();
  return AMOLEN_VARIETY_PACK_KEYWORDS.some(kw => lower.includes(kw));
}

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

const AMOLEN_MATERIAL_PATTERNS: Array<{ pattern: RegExp; material: string }> = [
  // Engineering materials - must come FIRST (before base materials)
  { pattern: /\bpeba\b/i, material: 'PEBA' },
  { pattern: /carbon\s*fiber|\bcf\b/i, material: 'PLA-CF' },
  { pattern: /\basa\b/i, material: 'ASA' },
  { pattern: /\babs\b/i, material: 'ABS' },
  
  // TPU MUST come BEFORE glow/specialty patterns (prevents cross-material grouping)
  { pattern: /\btpu\b/i, material: 'TPU-95A' },
  
  // PETG MUST come BEFORE transparent patterns
  { pattern: /\bpetg\b/i, material: 'PETG' },
  
  // Most specific first - high speed
  { pattern: /pla\s*hs|high\s*speed\s*pla/i, material: 'PLA-HS' },
  // Silk variations
  { pattern: /silk.*tri|tri.*color.*silk/i, material: 'PLA' },
  { pattern: /silk.*dual|dual.*color.*silk/i, material: 'PLA' },
  { pattern: /\bsilk\b.*pla|\bpla\b.*silk/i, material: 'PLA' },
  // PLA+ must come before generic PLA
  { pattern: /pla\s*pro|pla\+|pla\s*plus/i, material: 'PLA+' },
  { pattern: /marble.*pla|pla.*marble/i, material: 'PLA' },
  { pattern: /matte.*pla|pla.*matte/i, material: 'PLA' },
  { pattern: /wood.*pla|pla.*wood/i, material: 'PLA-Wood' },
  { pattern: /glow.*dark|gitd/i, material: 'PLA' },  // Now safe - TPU already checked
  // UV/Temperature change
  { pattern: /uv.*change|color.*chang/i, material: 'PLA+' },
  { pattern: /temp.*change|thermochromic/i, material: 'PLA+' },
  // Base PLA - last resort
  { pattern: /\bpla\b/i, material: 'PLA' },
];

export function normalizeAmolenMaterial(title: string): string {
  for (const { pattern, material } of AMOLEN_MATERIAL_PATTERNS) {
    if (pattern.test(title)) {
      return material;
    }
  }
  return 'PLA';
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

type FinishType = 'Standard' | 'Matte' | 'Silk' | 'Shimmer' | 'Glow' | 'Translucent';

export function extractAmolenFinishType(title: string): FinishType {
  const lower = title.toLowerCase();
  
  if (/\bmatte\b/i.test(lower)) return 'Matte';
  if (/\bsilk\b/i.test(lower)) return 'Silk';
  if (/shimmer|shiny/i.test(lower)) return 'Shimmer';
  if (/glow.*dark|gitd/i.test(lower)) return 'Glow';
  if (/marble|translucent|transparent/i.test(lower)) return 'Translucent';
  
  return 'Standard';
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

const AMOLEN_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
  },
  'PLA+': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
  },
  'PLA-HS': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
    high_speed_capable: true,
  },
  'PLA-Wood': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
  },
  'PLA-CF': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
  },
  'PEBA': {
    nozzle_temp_min_c: 210,
    nozzle_temp_max_c: 240,
    bed_temp_min_c: 40,
    bed_temp_max_c: 60,
  },
  'ASA': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 90,
    bed_temp_max_c: 110,
  },
  'ABS': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 90,
    bed_temp_max_c: 110,
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

export function getAmolenPrintSettings(material: string): PrintSettings | null {
  return AMOLEN_PRINT_SETTINGS[material] || AMOLEN_PRINT_SETTINGS['PLA'];
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateAmolenProductLineId(title: string, material: string): string {
  const lower = title.toLowerCase();
  const materialSlug = material.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // === STEP 1: CHECK MATERIAL FIRST (prevents cross-material grouping) ===
  
  // PEBA is always separate
  if (/\bpeba\b/i.test(lower)) return `amolen__peba__standard`;
  
  // TPU must be checked EARLY - before crystal/transparent check
  if (material === 'TPU-95A' || /\btpu\b/i.test(lower)) {
    if (isAmolenVarietyPack(title)) return `amolen__tpu-95a__variety-pack`;
    if (/glow.*dark|gitd/i.test(lower)) return `amolen__tpu-95a__glow`;  // TPU Glow separate
    if (/rainbow/i.test(lower)) return `amolen__tpu-95a__rainbow`;  // TPU Rainbow separate
    if (/transparent|translucent|clear/i.test(lower)) return `amolen__tpu-95a__transparent`;
    return `amolen__tpu-95a__standard`;
  }
  
  // PETG must be checked EARLY - before transparent check
  if (material === 'PETG' || /\bpetg\b/i.test(lower)) {
    if (isAmolenVarietyPack(title)) return `amolen__petg__variety-pack`;
    if (/rainbow/i.test(lower)) return `amolen__petg__rainbow`;  // PETG Rainbow separate
    if (/transparent|translucent/i.test(lower)) return `amolen__petg__transparent`;
    if (/carbon\s*fiber|\bcf\b/i.test(lower)) return `amolen__petg-cf__standard`;
    return `amolen__petg__standard`;
  }
  
  // Carbon Fiber (check before variety pack to handle CF packs)
  if (/carbon\s*fiber|\bcf\b/i.test(lower)) {
    if (isAmolenVarietyPack(title)) return `amolen__pla-cf__variety-pack`;
    return `amolen__pla-cf__standard`;
  }
  
  // === STEP 2: VARIETY PACKS ===
  if (isAmolenVarietyPack(title)) {
    if (/silk.*quad|quad.*silk/i.test(lower)) return `amolen__pla__silk-quad-variety`;
    if (/silk/i.test(lower)) return `amolen__pla__silk-variety-pack`;
    if (/glow/i.test(lower)) return `amolen__pla__glow-variety-pack`;
    if (/all.*in.*one|sample.*pack/i.test(lower)) return `amolen__pla__all-in-one-sample`;
    return `amolen__${materialSlug}__variety-pack`;
  }
  
  // === STEP 3: PLA+ HIGH-SPEED (must be separate from PLA high-speed) ===
  if (/high\s*speed|\bhs\b/i.test(lower)) {
    // Dual Color High Speed is separate from regular High Speed
    if (/dual.*color|dual-color/i.test(lower)) return `amolen__pla__high-speed-dual`;
    if (material === 'PLA+' || /pla\s*plus|pla\+/i.test(lower)) {
      return `amolen__pla-plus__high-speed`;
    }
    return `amolen__pla__high-speed`;
  }
  
  // === STEP 4: SILK VARIANTS ===
  if (/\bsilk\b/i.test(lower)) {
    // S-Series (distinct product line)
    if (/s-series|s\s+series/i.test(lower)) {
      if (/glow/i.test(lower)) return `amolen__pla__silk-s-glow`;
      return `amolen__pla__silk-s-series`;
    }
    // Basic Glow (different from regular basic)
    if (/glow/i.test(lower)) return `amolen__pla__silk-basic-glow`;
    // Color combinations
    if (/tri|triple/i.test(lower)) return `amolen__pla__silk-tri`;
    if (/dual/i.test(lower)) return `amolen__pla__silk-dual`;
    if (/rainbow/i.test(lower)) return `amolen__pla__silk-rainbow`;
    if (/galaxy/i.test(lower)) return `amolen__pla__silk-galaxy`;
    // Regular silk basic
    return `amolen__pla__silk-basic`;
  }
  
  // === STEP 5: MATTE VARIANTS ===
  if (/\bmatte\b/i.test(lower)) {
    if (/dual/i.test(lower)) return `amolen__pla__matte-dual`;
    if (/rainbow/i.test(lower)) return `amolen__pla__matte-rainbow`;
    return `amolen__pla__matte-basic`;
  }
  
  // === STEP 6: SPECIAL FINISHES (PLA only at this point) ===
  // Crystal/Transparent - now safe since TPU/PETG already handled above
  if (/crystal|transparent|translucent/i.test(lower)) return `amolen__pla__crystal`;
  
  // Marble
  if (/marble/i.test(lower)) return `amolen__pla__marble`;
  // Wood
  if (/wood/i.test(lower)) return `amolen__pla__wood`;
  
  // Glow (non-silk)
  if (/glow.*dark|gitd/i.test(lower)) {
    if (/s-series/i.test(lower)) return `amolen__pla__glow-s-series`;
    return `amolen__pla__glow-in-dark`;
  }
  
  // Color change
  if (/uv.*change/i.test(lower)) return `amolen__pla-plus__uv-color-change`;
  if (/temp.*change|thermochromic/i.test(lower)) return `amolen__pla-plus__temp-change`;
  
  // Galaxy/Sparkle/Shimmer
  if (/\bgalaxy\b/i.test(lower)) return `amolen__pla__galaxy`;
  if (/shimmer|shiny/i.test(lower)) return `amolen__pla__shimmer`;
  if (/sparkle|glitter/i.test(lower)) return `amolen__pla__sparkle`;
  
  // Dual color (basic, not silk)
  if (/\bdual\b/i.test(lower) && !/silk|matte/i.test(lower)) return `amolen__pla__dual`;
  
  // === STEP 7: BASE MATERIALS ===
  if (material === 'PLA+') return `amolen__pla-plus__standard`;
  if (material === 'PEBA') return `amolen__peba__standard`;
  if (material === 'ASA') return `amolen__asa__standard`;
  if (material === 'ABS') return `amolen__abs__standard`;
  if (material === 'PLA-CF') return `amolen__pla-cf__standard`;
  
  // === DEFAULT PLA ===
  return `amolen__pla__standard`;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanAmolenTitle(title: string): string {
  return title
    .replace(/AMOLEN\s*/gi, '')
    .replace(/Amolen\s*/gi, '')
    .replace(/\b1\.75\s*mm\b/gi, '')
    .replace(/\b1\s*KG\b/gi, '')
    .replace(/\b1000\s*g\b/gi, '')
    .replace(/\b2\.2\s*lb\b/gi, '')
    .replace(/\bFilament\b/gi, '')
    .replace(/\bfor\s+3D\s+Print(er|ing)?\b/gi, '')
    .replace(/U\.S\.\s*to\s*U\.S\.?/gi, '')
    .replace(/China\s*to\s*U\.S\..*$/gi, '')
    // More aggressive artifact removal
    .replace(/\s*,\s*\/\s*-\s*/g, ' - ')   // ", / -" -> " - "
    .replace(/\s*\/\s*-\s*/g, ' - ')        // "/ -" -> " - "
    .replace(/\s*,\s*-\s*/g, ' - ')         // ", -" -> " - "
    .replace(/\s*-\s*,\s*/g, ' - ')         // "- ," -> " - "
    .replace(/\s*,\s*\/\s*/g, ' ')          // ", /" -> space
    .replace(/\s*\/\s*,\s*/g, ' ')          // "/ ," -> space
    .replace(/\s+,\s+/g, ' ')               // " , " -> space
    .replace(/,\s*$/g, '')                  // Remove trailing comma
    .replace(/\s+-\s*$/g, '')               // Remove trailing dash
    .replace(/^\s*-\s+/g, '')               // Remove leading dash
    .replace(/\s*-\s+-\s*/g, ' - ')         // "- -" -> single dash
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// COLOR EXTRACTION
// ============================================================================

// Invalid color names to filter out
const AMOLEN_INVALID_COLORS = [
  'default title',
  'default',
  'none',
  'n/a',
];

/**
 * Extract color from Amolen variant, skipping delivery options
 * Amolen variant format is typically: "Delivery Option / Color"
 */
export function extractAmolenColorFromVariant(
  option1: string | null,
  option2: string | null,
  option3: string | null,
  productTitle: string
): string | null {
  // For variety packs, don't extract color
  if (isAmolenVarietyPack(productTitle)) {
    return null;
  }
  
  // Check each option, skip delivery options
  for (const opt of [option1, option2, option3]) {
    if (opt && !isAmolenDeliveryOption(opt)) {
      const normalized = opt.trim().toLowerCase();
      // Skip invalid color names
      if (AMOLEN_INVALID_COLORS.includes(normalized)) continue;
      // Filter out size/weight values
      if (!/^\d+\s*(g|kg|lb)/i.test(opt)) {
        return opt.trim();
      }
    }
  }
  
  return null;
}

// ============================================================================
// COLOR HEX MAPPING
// ============================================================================

const AMOLEN_COLOR_HEX_MAP: Record<string, string> = {
  // Basic colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'grey': '#808080',
  'gray': '#808080',
  'red': '#DC2626',
  'blue': '#2563EB',
  'green': '#22C55E',
  'yellow': '#EAB308',
  'orange': '#F97316',
  'purple': '#7C3AED',
  'pink': '#EC4899',
  'brown': '#92400E',
  
  // PEBA colors (new)
  'peba blue': '#4169E1',
  'peba white': '#FFFFFF',
  'peba black': '#1A1A1A',
  
  // Carbon Fiber (new)
  'carbon fiber brown': '#8B4513',
  'carbon fiber black': '#2D2D2D',
  
  // High Speed colors (new)
  'paper white': '#FAFAFA',
  'quartz white': '#F8F8F8',
  'porcelain white': '#F5F5F5',
  'chestnut brown': '#954535',
  'carrot orange': '#ED9121',
  'real gold': '#FFD700',
  
  // Crystal/Transparent (new)
  'blue white': '#B0C4DE',
  'crystal blue': '#ADD8E6',
  'crystal clear': '#E8E8E8',
  'red white': '#FFB6C1',
  'blue pink white': '#DDA0DD',
  
  // Silk colors
  'silk gold': '#FFD700',
  'silk silver': '#C0C0C0',
  'silk copper': '#B87333',
  'silk bronze': '#CD7F32',
  'silk red': '#DC143C',
  'silk blue': '#4169E1',
  'silk green': '#3CB371',
  'silk purple': '#9932CC',
  'silk pink': '#FF69B4',
  'silk white': '#FFFAFA',
  'silk coffee gold': '#8B6914',
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'copper': '#B87333',
  'bronze': '#CD7F32',
  'champagne': '#F7E7CE',
  'rose gold': '#B76E79',
  
  // Dual/Tri colors (use blend hex)
  'gold silver': '#DAA520',
  'blue green': '#2E8B57',
  'pink purple': '#9370DB',
  'red gold': '#CD5C5C',
  'red black': '#8B0000',
  'rainbow': '#FF6B6B',
  'brown white': '#D2B48C',
  
  // Matte colors
  'matte black': '#2D2D2D',
  'matte white': '#F5F5F5',
  'matte grey': '#6B7280',
  'matte gray': '#6B7280',
  
  // Specialty colors
  'marble': '#E8E8E8',
  'wood': '#DEB887',
  'coffee': '#6F4E37',
  'natural': '#F5F5DC',
  'transparent': '#E8E8E8',
  'clear': '#F0F0F0',
  
  // Glow colors
  'glow green': '#39FF14',
  'glow blue': '#00BFFF',
  'glow orange': '#FF6600',
  
  // Additional common colors
  'navy': '#000080',
  'teal': '#008080',
  'coral': '#FF7F50',
  'lavender': '#E6E6FA',
  'mint': '#98FF98',
  'peach': '#FFCBA4',
  'cream': '#FFFDD0',
  'beige': '#F5F5DC',
  'army green': '#4B5320',
  'forest green': '#228B22',
  'sky blue': '#87CEEB',
  'light blue': '#ADD8E6',
  'dark blue': '#00008B',
  'light green': '#90EE90',
  'dark green': '#006400',
  'light pink': '#FFB6C1',
  'hot pink': '#FF69B4',
  'magenta': '#FF00FF',
  'cyan': '#00FFFF',
  'lime': '#32CD32',
  'olive': '#808000',
  'burgundy': '#800020',
  'wine': '#722F37',
  'tan': '#D2B48C',
  'chocolate': '#D2691E',
  
  // Glow-in-dark additional colors
  'aurora glow': '#7FFF00',
  'galaxy glow': '#9370DB',
  
  // Marble/Fossil colors
  'fossil gradient': '#D2B48C',
  'sedimentary rock': '#8B8378',
  'marble white': '#F0F0F0',
  
  // Matte additional colors
  'terracotta': '#E2725B',
  'terracotta red': '#CD5C5C',
  
  // Galaxy/Shimmer colors
  'galaxy fuchsia': '#FF00FF',
  'galaxy-shiny polarized multicolor': '#DA70D6',
  'polarized multicolor': '#DA70D6',
  'shiny polarized': '#C0C0C0',
  
  // Silk S-Series gradient names
  'amber sea': '#FFBF00',
  'berry pop': '#8E4585',
  'nebula ribbon': '#5D3FD3',
  'twilight': '#4B0082',
  'silk gradient aged brass': '#B5651D',
  'aged brass': '#B5651D',
  
  // Additional silk gradients
  'copper rose': '#B87333',
  'midnight blue': '#191970',
  'ocean breeze': '#4682B4',
  'sunset gold': '#DAA520',
  
  // TPU Glow colors
  'tpu glow green': '#39FF14',
  'tpu glow blue': '#00BFFF',
  'tpu glow orange': '#FF6600',
  
  // PETG Rainbow
  'multicolor rainbow': '#FF6B6B',
  'petg rainbow': '#FF6B6B',
  
  // TPU Rainbow combinations
  'blue green orange translucent rainbow': '#2E8B57',
  'pink blue green orange transparent rainbow': '#DA70D6',
  'purple pink orange green rainbow': '#9932CC',
  'red green purple orange translucent rainbow': '#CD5C5C',
  'yellow green orange transparent rainbow': '#FFD700',
};

export function getAmolenColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (AMOLEN_COLOR_HEX_MAP[normalized]) {
    return AMOLEN_COLOR_HEX_MAP[normalized];
  }
  
  // Partial match - prioritize longer matches
  const sortedEntries = Object.entries(AMOLEN_COLOR_HEX_MAP)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [key, hex] of sortedEntries) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface AmolenEnrichmentResult {
  material: string;
  finish_type: FinishType;
  product_line_id: string;
  print_settings: PrintSettings | null;
  color_hex: string | null;
  cleaned_title: string;
  high_speed_capable: boolean;
  is_variety_pack: boolean;
  diameter_nominal_mm: number;
}

export function enrichAmolenProduct(
  title: string,
  colorName?: string | null,
  existingMaterial?: string | null
): AmolenEnrichmentResult {
  const material = existingMaterial || normalizeAmolenMaterial(title);
  const finishType = extractAmolenFinishType(title);
  const productLineId = generateAmolenProductLineId(title, material);
  const printSettings = getAmolenPrintSettings(material);
  const isVarietyPack = isAmolenVarietyPack(title);
  
  // Get color hex (skip for variety packs)
  let colorHex: string | null = null;
  if (!isVarietyPack && colorName) {
    colorHex = getAmolenColorHex(colorName);
  }
  
  const cleanedTitle = cleanAmolenTitle(title);
  const isHighSpeed = material === 'PLA-HS' || printSettings?.high_speed_capable || false;
  
  return {
    material,
    finish_type: finishType,
    product_line_id: productLineId,
    print_settings: printSettings,
    color_hex: colorHex,
    cleaned_title: cleanedTitle,
    high_speed_capable: isHighSpeed,
    is_variety_pack: isVarietyPack,
    diameter_nominal_mm: 1.75,
  };
}

// ============================================================================
// PRODUCT URL GENERATION
// ============================================================================

export function getAmolenProductUrl(handle: string, variantId?: number): string {
  const baseUrl = `${AMOLEN_STORE_INFO.baseUrl}/products/${handle}`;
  return variantId ? `${baseUrl}?variant=${variantId}` : baseUrl;
}
