/**
 * ANYCUBIC BRAND-SPECIFIC DEFAULTS
 * 
 * Centralized configuration for Anycubic filament syncing including:
 * - TDS URL patterns for automatic discovery
 * - Default print settings by material type
 * - Finish type extraction logic
 * - Material normalization mapping
 * - Title cleaning patterns
 */

// ============================================================================
// TDS URL PATTERNS - Known Anycubic TDS locations on nice-cdn.com
// ============================================================================

export const ANYCUBIC_TDS_PATTERNS: Record<string, string> = {
  // Standard PLA variants
  'pla basic': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PLA_V3.0.pdf',
  'pla+': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PLA_V3.0.pdf',
  'pla pro': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PLA_V3.0.pdf',
  
  // High Speed PLA
  'high speed pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_High_Speed_PLA.pdf',
  'hs pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_High_Speed_PLA.pdf',
  'high-speed pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_High_Speed_PLA.pdf',
  
  // Specialty PLA
  'silk pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_SILK_PLA.pdf',
  'matte pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_Matte_PLA.pdf',
  'marble pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_Marble_PLA.pdf',
  'glow pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_Glow_PLA.pdf',
  'glow-in-the-dark pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_Glow_PLA.pdf',
  
  // PETG variants
  'petg': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PETG.pdf',
  'petg+': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PETG.pdf',
  'high speed petg': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_High_Speed_PETG.pdf',
  'hs petg': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_High_Speed_PETG.pdf',
  
  // ABS variants
  'abs': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_ABS.pdf',
  'abs+': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_ABS.pdf',
  
  // TPU
  'tpu': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_TPU.pdf',
  'tpu 95a': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_TPU.pdf',
  'flexible tpu': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_TPU.pdf',
  
  // ASA
  'asa': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_ASA.pdf',
};

/**
 * Match product title to known TDS URL pattern
 * Returns the URL and matched pattern if found
 */
export function matchAnycubicTds(title: string): { url: string; pattern: string } | null {
  const titleLower = title.toLowerCase();
  
  // Sort patterns by length (longest first) for most specific match
  const sortedPatterns = Object.entries(ANYCUBIC_TDS_PATTERNS)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, url] of sortedPatterns) {
    if (titleLower.includes(pattern)) {
      return { url, pattern };
    }
  }
  
  return null;
}

// ============================================================================
// PRINT SETTINGS - Default temperatures by material type
// ============================================================================

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
}

export const ANYCUBIC_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Standard PLA
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 25, bedTempMax: 60 },
  'PLA+': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 25, bedTempMax: 60 },
  'PLA Basic': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 25, bedTempMax: 60 },
  'PLA Pro': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 25, bedTempMax: 60 },
  
  // High Speed PLA (higher temps, faster speeds)
  'High Speed PLA': { nozzleTempMin: 210, nozzleTempMax: 250, bedTempMin: 45, bedTempMax: 70, printSpeedMax: 500 },
  'HS PLA': { nozzleTempMin: 210, nozzleTempMax: 250, bedTempMin: 45, bedTempMax: 70, printSpeedMax: 500 },
  
  // Specialty PLA
  'Silk PLA': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 45, bedTempMax: 60 },
  'Matte PLA': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 45, bedTempMax: 60 },
  'Marble PLA': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 45, bedTempMax: 60 },
  'Glow PLA': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 45, bedTempMax: 60, isAbrasive: true },
  
  // PETG
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 90 },
  'PETG+': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 90 },
  'High Speed PETG': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 75, bedTempMax: 90, printSpeedMax: 300 },
  'HS PETG': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 75, bedTempMax: 90, printSpeedMax: 300 },
  
  // ABS
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 80, bedTempMax: 110, requiresEnclosure: true },
  'ABS+': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 80, bedTempMax: 110, requiresEnclosure: true },
  
  // TPU
  'TPU': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 30, bedTempMax: 60 },
  'TPU 95A': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 30, bedTempMax: 60 },
  
  // ASA
  'ASA': { nozzleTempMin: 235, nozzleTempMax: 255, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
};

/**
 * Get print settings for a material type
 * Attempts to match against known materials, with fallbacks
 */
export function getAnycubicPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  
  const materialUpper = material.toUpperCase().trim();
  
  // Direct match first
  for (const [key, settings] of Object.entries(ANYCUBIC_PRINT_SETTINGS)) {
    if (key.toUpperCase() === materialUpper) {
      return settings;
    }
  }
  
  // Partial match - check if material contains any key
  for (const [key, settings] of Object.entries(ANYCUBIC_PRINT_SETTINGS)) {
    if (materialUpper.includes(key.toUpperCase()) || key.toUpperCase().includes(materialUpper)) {
      return settings;
    }
  }
  
  // Fallback based on base material type
  if (materialUpper.includes('PLA')) {
    return ANYCUBIC_PRINT_SETTINGS['PLA'];
  }
  if (materialUpper.includes('PETG')) {
    return ANYCUBIC_PRINT_SETTINGS['PETG'];
  }
  if (materialUpper.includes('ABS')) {
    return ANYCUBIC_PRINT_SETTINGS['ABS'];
  }
  if (materialUpper.includes('TPU') || materialUpper.includes('FLEX')) {
    return ANYCUBIC_PRINT_SETTINGS['TPU'];
  }
  if (materialUpper.includes('ASA')) {
    return ANYCUBIC_PRINT_SETTINGS['ASA'];
  }
  
  return null;
}

// ============================================================================
// FINISH TYPE EXTRACTION
// ============================================================================

export type FinishType = 'Silk' | 'Matte' | 'Glow' | 'Sparkle' | 'Marble' | 'Wood' | 'Carbon Fiber' | 'Standard';

const FINISH_PATTERNS: Array<{ pattern: RegExp; finish: FinishType }> = [
  { pattern: /\bsilk\b/i, finish: 'Silk' },
  { pattern: /\bmatte\b/i, finish: 'Matte' },
  { pattern: /\bglow(?:-in-the-dark)?\b/i, finish: 'Glow' },
  { pattern: /\b(?:sparkle|glitter)\b/i, finish: 'Sparkle' },
  { pattern: /\bmarble\b/i, finish: 'Marble' },
  { pattern: /\bwood\b/i, finish: 'Wood' },
  { pattern: /\b(?:carbon\s*fiber|cf)\b/i, finish: 'Carbon Fiber' },
];

/**
 * Extract finish type from product title
 */
export function extractFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  
  for (const { pattern, finish } of FINISH_PATTERNS) {
    if (pattern.test(title)) {
      return finish;
    }
  }
  
  return 'Standard';
}

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

const ANYCUBIC_MATERIAL_MAPPING: Record<string, string> = {
  // PLA+ variants - most specific first
  'pla basic': 'PLA+',
  'pla basic refill': 'PLA+',
  'pla+ refill': 'PLA+',
  'pla+': 'PLA+',
  'pla pro': 'PLA+',
  'high speed pla': 'PLA+',
  'hs pla': 'PLA+',
  
  // PLA Galaxy and Special are PLA+ products  
  'pla galaxy': 'PLA+',
  'pla special': 'PLA+',
  'pla special filament': 'PLA+',
  
  // Regular PLA specialty finishes
  'silk pla': 'PLA',
  'matte pla': 'PLA',
  'marble pla': 'PLA',
  'glow pla': 'PLA-Glow',
  'glow-in-the-dark pla': 'PLA-Glow',
  
  // PETG variants
  'petg': 'PETG',
  'petg+': 'PETG',
  'high speed petg': 'PETG',
  'hs petg': 'PETG',
  
  // ABS variants
  'abs': 'ABS',
  'abs+': 'ABS',
  
  // TPU variants
  'tpu': 'TPU',
  'tpu 95a': 'TPU',
  'flexible tpu': 'TPU',
  
  // ASA
  'asa': 'ASA',
  
  // PC (Polycarbonate)
  'pc filament': 'PC',
  'polycarbonate': 'PC',
};

/**
 * Normalize material name for Anycubic products
 */
export function normalizeAnycubicMaterial(title: string): string | null {
  if (!title) return null;
  
  const titleLower = title.toLowerCase();
  
  // Sort by length (longest first) for most specific match
  const sortedMappings = Object.entries(ANYCUBIC_MATERIAL_MAPPING)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, material] of sortedMappings) {
    if (titleLower.includes(pattern)) {
      return material;
    }
  }
  
  // Fallback: basic material detection
  if (titleLower.includes('pla')) return 'PLA';
  if (titleLower.includes('petg')) return 'PETG';
  if (titleLower.includes('abs')) return 'ABS';
  if (titleLower.includes('tpu')) return 'TPU';
  if (titleLower.includes('asa')) return 'ASA';
  
  return null;
}

// ============================================================================
// TITLE CLEANING - Anycubic-specific noise removal
// ============================================================================

export const PROMOTIONAL_PATTERNS = [
  /christmas\s*(?:bulk\s*)?sale/gi,
  /buy\s*\d+[,\s]*get\s*\d+\s*(?:free|special)/gi,
  /bulk\s*(?:sale|deal)/gi,
  /special\s*offer/gi,
  /limited\s*(?:time\s*)?(?:offer|deal)/gi,
  /hot\s*deal/gi,
  /best\s*seller/gi,
  /flash\s*(?:sale|deal)/gi,
  /\d+-\d+kg\s*deals?/gi,
  /multi.?pack/gi,
  /bundle\s*deal/gi,
  /mixed\s*color\s*deals?/gi,
  /christmas\s*box/gi,
];

// Products that are NOT filaments - should be excluded from sync
export const ANYCUBIC_NON_FILAMENT_SLUGS = [
  'filament-prize-claim',
  'filament-prize',
  'prize-claim',
  'filament-hub',
  'products-filament-hub',
  'spring-steel',
  'spring-steel-magnetic',
  'magnetic-platform',
  'wash-cure',
  'accessories',
  'nozzle',
  'hotend',
  'extruder',
  'buildplate',
  'build-plate',
  'cleaning-filament', // maintenance product, not regular filament
  '10th-anniversary-gift', // promotional gift
  '10th-anniversary',
  'gift-card',
  'voucher',
];

const ANYCUBIC_TITLE_NOISE = [
  // Promotional text
  ...PROMOTIONAL_PATTERNS,
  
  // Filament Hub prefix
  /^filament\s*hub\s*[-–:]?\s*/gi,
  
  // Redundant brand mentions
  /\banycubic\s*/gi,
  
  // Generic descriptors
  /\b3d\s*printer?\s*filament\b/gi,
  /\bfdm\s*filament\b/gi,
  /\bfit\s*(?:for\s*)?(?:most\s*)?(?:fdm\s*)?(?:3d\s*)?printers?\b/gi,
  
  // Diameter and weight (these are extracted elsewhere)
  /\b1\.75\s*mm\b/gi,
  /\b\d+(?:\.\d+)?\s*kg\b/gi,
  /\b\d+(?:\.\d+)?\s*g\b/gi,
];

/**
 * Clean Anycubic product title of noise and promotional text
 */
export function cleanAnycubicTitle(title: string): string {
  if (!title) return '';
  
  let cleaned = title;
  
  // Apply noise patterns
  for (const pattern of ANYCUBIC_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  
  // Clean up whitespace and punctuation
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/^\s*[-–,]\s*/, '')
    .replace(/\s*[-–,]\s*$/, '')
    .trim();
  
  return cleaned;
}

/**
 * Check if product is a promotional variant (should get separate product_line_id)
 */
export function isPromotionalProduct(title: string): boolean {
  return PROMOTIONAL_PATTERNS.some(pattern => pattern.test(title));
}

// ============================================================================
// PRODUCT LINE ID GENERATION (Matches Amolen approach)
// ============================================================================

const ANYCUBIC_PRODUCT_LINES = [
  // High speed variants (most specific first)
  'High Speed', 'High-Speed', 'HS',
  
  // Finish types
  'Silk', 'Matte', 'Marble', 'Sparkle', 'Glow in the Dark', 'Glow-in-the-Dark', 'Glow',
  
  // Composite
  'Carbon Fiber', 'CF',
  
  // Base types
  'Basic', 'Standard', 'Plus', 'Pro',
];

/**
 * Check if a product handle/URL is a non-filament product
 */
export function isNonFilamentProduct(handle: string): boolean {
  const handleLower = handle.toLowerCase();
  return ANYCUBIC_NON_FILAMENT_SLUGS.some(slug => handleLower.includes(slug));
}

/**
 * Strip promotional text from title BEFORE generating product_line_id
 * This ensures promotional products group with their regular counterparts
 */
function stripPromotionalFromTitle(title: string): string {
  return title
    .replace(/\s*-?\s*buy\s+\d+[,\s]*get\s+\d+(\s+free)?/gi, '')
    .replace(/\s*-?\s*flash\s+(deal|sale)/gi, '')
    .replace(/\s*-?\s*christmas\s+(box|sale|deal|bulk)/gi, '')
    .replace(/\s*-?\s*b2g1/gi, '')
    .replace(/\s*-?\s*promo(tion)?/gi, '')
    .replace(/\s*-?\s*special\s+offer/gi, '')
    .replace(/\s*-?\s*limited\s+(time\s+)?offer/gi, '')
    .replace(/\s*-?\s*bulk\s+(sale|deal)/gi, '')
    .replace(/\s*-?\s*mixed\s+color\s*deals?/gi, '')
    .trim();
}

/**
 * Generate product_line_id for Anycubic products (matches Amolen approach)
 * PRIORITY: Use DB material field if available (more reliable than title parsing)
 * 
 * CRITICAL: Promotional products now group with regular products!
 * "PLA Silk - Buy 2, Get 1 Free" -> anycubic__pla__silk (same as regular PLA Silk)
 */
export function generateAnycubicProductLineId(title: string, material?: string | null): string {
  // CRITICAL: Strip promotional text FIRST, before any other processing
  // This ensures promotional variants group correctly with regular products
  const strippedTitle = stripPromotionalFromTitle(title);
  const cleanedTitle = cleanAnycubicTitle(strippedTitle).toLowerCase();
  
  // Build product line ID from material + product line
  let baseId = 'anycubic';
  
  // PRIORITY 1: Use the DB material field if provided (it's more reliable than title parsing)
  // This ensures PLA+ products with titles like "PLA Galaxy" get correct IDs
  if (material) {
    const materialSlug = material.toLowerCase()
      .replace(/\+/g, 'plus')
      .replace(/-/g, '') // PLA-Glow -> PLAGlow -> plaglow
      .replace(/[^a-z0-9]/g, '');
    baseId += `__${materialSlug}`;
  } else {
    // PRIORITY 2: Fall back to title parsing only when DB material is not available
    // Use stripped title to avoid detecting promo text as material
    const normalizedMaterial = normalizeAnycubicMaterial(strippedTitle);
    if (normalizedMaterial) {
      // Convert + to 'plus' so PLA+ becomes 'plaplus' and PLA stays 'pla'
      const materialSlug = normalizedMaterial.toLowerCase()
        .replace(/\+/g, 'plus')
        .replace(/-/g, '')
        .replace(/[^a-z0-9]/g, '');
      baseId += `__${materialSlug}`;
    } else {
      // If we can't detect a material, return unclassified for review
      return 'anycubic__unclassified__needs_review';
    }
  }
  
  // Add finish type (use stripped title to avoid promo text)
  const finishType = extractFinishType(strippedTitle);
  if (finishType !== 'Standard') {
    baseId += `__${finishType.toLowerCase().replace(/\s+/g, '')}`;
  } else {
    baseId += '__standard';
  }
  
  // Check for high speed
  if (cleanedTitle.includes('high speed') || cleanedTitle.includes('high-speed') || /\bhs\s/i.test(cleanedTitle)) {
    if (!baseId.includes('highspeed') && !baseId.includes('hs')) {
      baseId += '_hs';
    }
  }
  
  return baseId;
}

// ============================================================================
// ANYCUBIC-SPECIFIC COLOR MAPPING
// ============================================================================

export const ANYCUBIC_COLOR_MAPPING: Record<string, string> = {
  // Anycubic-specific color names
  'lake blue': '4682B4',
  'interstellar violet': 'EE82EE',
  'jade white': 'E8F5E9',
  'vibrant orange': 'FF6600',
  'pale violet': 'DDA0DD',
  'peacock blue': '005F69',
  'cream yellow': 'FFFDD0',
  'cheese yellow': 'FFC000',
  'koala grey': 'A5A5A5',
  'koala gray': 'A5A5A5',
  'matcha green': '8DB600',
  'matcha': '8DB600',
  'phantom blue': '4169E1',
  'haze blue': '6699CC',
  'stone grey': '928E85',
  'stone gray': '928E85',
  'army green': '4B5320',
  'wine red': '722F37',
  'tangerine yellow': 'FFC72C',
  'peach fuzz': 'FFBE98',
  'carrot orange': 'ED9121',
  'space grey': '4F4F4F',
  'space gray': '4F4F4F',
  'cement grey': '8D918D',
  'cement gray': '8D918D',
  
  // Colors from Post Sync Check (interstellar violet already at line 478)
  'tropical turquoise': '48D1CC',
  'spring leaf': '6DBE45',
  'peach pink': 'FFDAB9',
  
  // Missing PETG colors
  'texture grey': '8B8B8B',
  'texture gray': '8B8B8B',
  'texture silver': 'C0C0C0',
  'dark grey': '404040',
  'dark gray': '404040',
  'grey': '808080',
  'gray': '808080',
  'cream': 'FFFDD0',
  'beige': 'F5F5DC',
  'peanut brown': 'B5651D',
  'forest green': '228B22',
  'lime green': '32CD32',
  
  // Missing PLA+ colors
  'cyan': '00FFFF',
  'brown': '8B4513',
  
  // Galaxy colors
  'galaxy green': '2E8B57',
  'galaxy blue': '1E3A5F',
  'galaxy purple': '4B0082',
  'galaxy box': '4B0082',
  
  // Metal colors
  'metal copper': 'B87333',
  'copper': 'B87333',
  'metal champaign': 'D4AF37',
  'metal champagne': 'D4AF37',
  'champaign': 'D4AF37',
  'champagne': 'D4AF37',
  
// PLA Silk colors from Post Sync Check
  'rainbow': 'FF0000',
  'silk rainbow': 'FF0000',
  'white': 'FFFFFF',
  'silk white': 'FFFFFF',
  'metal blue': '4682B4',
  'silk metal blue': '4682B4',
  'silver': 'C0C0C0',
  'silk silver': 'C0C0C0',
  'gold': 'D4AF37',
  'silk gold': 'D4AF37',
  'bronze': 'CD7F32',
  'silk bronze': 'CD7F32',
  'rose gold': 'B76E79',
  'silk rose gold': 'B76E79',
  'pink': 'FFC0CB',
  'silk pink': 'FFC0CB',
  'purple': '9333EA',
  'silk purple': '9333EA',
  'black': '1A1A1A',
  'silk black': '1A1A1A',
  'blue': '2563EB',
  'silk blue': '2563EB',
  'red': 'DC2626',
  'silk red': 'DC2626',
  'green': '16A34A',
  'silk green': '16A34A',
  
  // Missing colors from Post Sync Check
  'magenta': 'FF00FF',
  
  // Common color aliases Anycubic uses
  'transparent': 'FFFFFF',
  'clear': 'FFFFFF',
  'natural': 'F5F5DC',
  
  // Translucent variants (complete set from Post Sync Check)
  'translucent orange': 'FF6600',
  'translucent olive': '808000',
  'translucent grey': '8B8B8B',
  'translucent gray': '808080',
  'translucent brown': '8B4513',
  'translucent purple': '9333EA',
  'translucent blue': '2563EB',
  'translucent green': '16A34A',
  'translucent pink': 'FFC0CB',
  'translucent red': 'DC2626',
  'translucent yellow': 'FFC72C',
  'translucent white': 'FFFFFF',
  'translucent clear': 'FFFFFF',
  'translucent': 'FFFFFF',
  'olive': '808000',
  'olive green': '808000',
  'orange': 'FF6600',
  
  // No-space variants (for robust matching)
  'texturesilver': 'C0C0C0',
  'texturegrey': '8B8B8B',
  'texturegray': '8B8B8B',
  'darkgrey': '404040',
  'darkgray': '404040',
  'metalcopper': 'B87333',
  'metalchampagne': 'D4AF37',
  'rosegold': 'B76E79',
  'metalblue': '4682B4',
  'silkrainbow': 'FF0000',
  'silksilver': 'C0C0C0',
  'silkcopper': 'B87333',
  'silkpink': 'FFC0CB',
  'silkpurple': '9333EA',
  'translucentorange': 'FF6600',
  'translucentolive': '808000',
  'translucentgrey': '8B8B8B',
  'translucentgray': '808080',
  'translucentbrown': '8B4513',
  'translucentpurple': '9333EA',
  'translucentblue': '2563EB',
  'translucentgreen': '16A34A',
  'translucentpink': 'FFC0CB',
  'springleaf': '00A86B',
};

/**
 * Get hex color for Anycubic-specific color name
 * Returns null if not found (falls back to generic color mapping)
 * 
 * ENHANCED: Handles whitespace variations by:
 * 1. Direct lookup with normalized spacing
 * 2. No-space variant lookup (e.g., "texture grey" -> "texturegrey")
 * 3. Partial matching for compound colors
 */
export function getAnycubicColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  // Normalize: lowercase, trim, collapse multiple spaces
  const colorLower = colorName.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Direct lookup first (most common case)
  if (ANYCUBIC_COLOR_MAPPING[colorLower]) {
    return ANYCUBIC_COLOR_MAPPING[colorLower];
  }
  
  // Try no-space variant (e.g., "texture grey" -> "texturegrey")
  const noSpaces = colorLower.replace(/\s+/g, '');
  if (ANYCUBIC_COLOR_MAPPING[noSpaces]) {
    return ANYCUBIC_COLOR_MAPPING[noSpaces];
  }
  
  // Try matching without prefixes (e.g., "silk " prefix)
  const withoutSilk = colorLower.replace(/^silk\s+/i, '');
  if (withoutSilk !== colorLower && ANYCUBIC_COLOR_MAPPING[withoutSilk]) {
    return ANYCUBIC_COLOR_MAPPING[withoutSilk];
  }
  
  // Try matching without "translucent" prefix and look up the base color
  const withoutTranslucent = colorLower.replace(/^translucent\s+/i, '');
  if (withoutTranslucent !== colorLower && ANYCUBIC_COLOR_MAPPING[withoutTranslucent]) {
    return ANYCUBIC_COLOR_MAPPING[withoutTranslucent];
  }
  
  // Try matching without "texture" prefix
  const withoutTexture = colorLower.replace(/^texture\s+/i, '');
  if (withoutTexture !== colorLower && ANYCUBIC_COLOR_MAPPING[withoutTexture]) {
    return ANYCUBIC_COLOR_MAPPING[withoutTexture];
  }
  
  // Try partial matching by checking if any key is contained in the color name
  // Sort by length (longest first) for most specific match
  const sortedKeys = Object.keys(ANYCUBIC_COLOR_MAPPING).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (colorLower.includes(key) || key.includes(colorLower)) {
      return ANYCUBIC_COLOR_MAPPING[key];
    }
  }
  
  return null;
}

// ============================================================================
// MAIN POST-PROCESSING FUNCTION
// ============================================================================

export interface AnycubicEnrichmentResult {
  tdsUrl: string | null;
  tdsSource: string | null;
  finishType: FinishType;
  material: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  printSpeedMax: number | null;
  highSpeedCapable: boolean;
  isAbrasive: boolean;
  cleanedTitle: string;
}

/**
 * Apply all Anycubic-specific enrichments to a product
 */
export function enrichAnycubicProduct(
  title: string,
  existingMaterial: string | null = null,
  existingTds: string | null = null,
  existingNozzleMin: number | null = null,
  existingNozzleMax: number | null = null,
  existingBedMin: number | null = null,
  existingBedMax: number | null = null
): AnycubicEnrichmentResult {
  // Extract/normalize values
  const finishType = extractFinishType(title);
  const material = existingMaterial || normalizeAnycubicMaterial(title);
  const cleanedTitle = cleanAnycubicTitle(title);
  
  // Get TDS URL if not already present
  let tdsUrl = existingTds;
  let tdsSource: string | null = null;
  if (!tdsUrl) {
    const tdsMatch = matchAnycubicTds(title);
    if (tdsMatch) {
      tdsUrl = tdsMatch.url;
      tdsSource = `known_pattern:${tdsMatch.pattern}`;
    }
  }
  
  // Get print settings if not already present
  const printSettings = getAnycubicPrintSettings(material);
  
  return {
    tdsUrl,
    tdsSource,
    finishType,
    material,
    nozzleTempMin: existingNozzleMin ?? printSettings?.nozzleTempMin ?? null,
    nozzleTempMax: existingNozzleMax ?? printSettings?.nozzleTempMax ?? null,
    bedTempMin: existingBedMin ?? printSettings?.bedTempMin ?? null,
    bedTempMax: existingBedMax ?? printSettings?.bedTempMax ?? null,
    printSpeedMax: printSettings?.printSpeedMax ?? null,
    highSpeedCapable: title.toLowerCase().includes('high speed') || title.toLowerCase().includes('hs '),
    isAbrasive: printSettings?.isAbrasive ?? false,
    cleanedTitle,
  };
}
