/**
 * ATOMIC FILAMENT BRAND-SPECIFIC DEFAULTS
 * 
 * Centralized configuration for Atomic Filament syncing including:
 * - TDS URL patterns for automatic discovery
 * - Default print settings by material type
 * - Finish type extraction logic
 * - Material normalization mapping
 * - Title cleaning patterns
 * - Brand-specific color mapping
 * - Collection-based product discovery whitelist
 */

// ============================================================================
// COLLECTION WHITELIST - Official material collection URLs from spreadsheet
// ============================================================================

export interface AtomicCollectionConfig {
  material: string;
  collectionUrl: string;
  displayMaterial: string;
}

/**
 * Official Atomic Filament collection URLs for product discovery
 * These are the canonical sources for each material type
 */
export const ATOMIC_COLLECTION_WHITELIST: AtomicCollectionConfig[] = [
  { material: 'PLA', collectionUrl: 'https://atomicfilament.com/collections/opaque-pla-filaments-1', displayMaterial: 'PLA' },
  { material: 'PETG', collectionUrl: 'https://atomicfilament.com/collections/petg-3d-printer-filament-us-made-with-free-shipping', displayMaterial: 'PETG' },
  { material: 'ABS', collectionUrl: 'https://atomicfilament.com/collections/abs-3d-filament', displayMaterial: 'ABS' },
  { material: 'ASA', collectionUrl: 'https://atomicfilament.com/collections/asa-free-us-shipping', displayMaterial: 'ASA' },
  { material: 'PLA Silk', collectionUrl: 'https://atomicfilament.com/collections/silky-pla', displayMaterial: 'PLA Silk' },
];

// ============================================================================
// TDS URL PATTERNS - Known Atomic Filament TDS locations
// ============================================================================

export const ATOMIC_TDS_PATTERNS: Record<string, string> = {
  // Standard PLA variants
  'pla': 'https://atomicfilament.com/pages/pla-technical-data-sheet',
  'pla+': 'https://atomicfilament.com/pages/pla-plus-technical-data-sheet',
  'pla plus': 'https://atomicfilament.com/pages/pla-plus-technical-data-sheet',
  
  // PETG variants
  'petg': 'https://atomicfilament.com/pages/petg-technical-data-sheet',
  'petg+': 'https://atomicfilament.com/pages/petg-plus-technical-data-sheet',
  'petg pro': 'https://atomicfilament.com/pages/petg-pro-technical-data-sheet',
  
  // ABS variants
  'abs': 'https://atomicfilament.com/pages/abs-technical-data-sheet',
  'abs+': 'https://atomicfilament.com/pages/abs-plus-technical-data-sheet',
  
  // ASA
  'asa': 'https://atomicfilament.com/pages/asa-technical-data-sheet',
  
  // TPU
  'tpu': 'https://atomicfilament.com/pages/tpu-technical-data-sheet',
  'tpu 95a': 'https://atomicfilament.com/pages/tpu-technical-data-sheet',
  
  // Nylon/PA
  'nylon': 'https://atomicfilament.com/pages/nylon-technical-data-sheet',
  'pa12': 'https://atomicfilament.com/pages/pa12-technical-data-sheet',
  'pa': 'https://atomicfilament.com/pages/nylon-technical-data-sheet',
  
  // Carbon Fiber composites
  'carbon fiber': 'https://atomicfilament.com/pages/carbon-fiber-technical-data-sheet',
  'cf pla': 'https://atomicfilament.com/pages/carbon-fiber-pla-technical-data-sheet',
  'cf petg': 'https://atomicfilament.com/pages/carbon-fiber-petg-technical-data-sheet',
  'cf abs': 'https://atomicfilament.com/pages/carbon-fiber-abs-technical-data-sheet',
  'cf asa': 'https://atomicfilament.com/pages/carbon-fiber-asa-technical-data-sheet',
  'cf nylon': 'https://atomicfilament.com/pages/carbon-fiber-nylon-technical-data-sheet',
  'carbon fiber pla': 'https://atomicfilament.com/pages/carbon-fiber-pla-technical-data-sheet',
  'carbon fiber petg': 'https://atomicfilament.com/pages/carbon-fiber-petg-technical-data-sheet',
  'carbon fiber abs': 'https://atomicfilament.com/pages/carbon-fiber-abs-technical-data-sheet',
  'carbon fiber asa': 'https://atomicfilament.com/pages/carbon-fiber-asa-technical-data-sheet',
  'carbon fiber nylon': 'https://atomicfilament.com/pages/carbon-fiber-nylon-technical-data-sheet',
  
  // MeltMiser line (specialty high-temp)
  'meltmiser': 'https://atomicfilament.com/pages/meltmiser-technical-data-sheet',
};

/**
 * Match product title to known TDS URL pattern
 * Returns the URL and matched pattern if found
 */
export function matchAtomicTds(title: string): { url: string; pattern: string } | null {
  if (!title) return null;
  
  const titleLower = title.toLowerCase();
  
  // Sort patterns by length (longest first) for most specific match
  const sortedPatterns = Object.entries(ATOMIC_TDS_PATTERNS)
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

export const ATOMIC_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Standard PLA
  'PLA': { nozzleTempMin: 195, nozzleTempMax: 230, bedTempMin: 40, bedTempMax: 60 },
  'PLA+': { nozzleTempMin: 200, nozzleTempMax: 235, bedTempMin: 50, bedTempMax: 70 },
  
  // PETG variants
  'PETG': { nozzleTempMin: 235, nozzleTempMax: 255, bedTempMin: 70, bedTempMax: 85 },
  'PETG+': { nozzleTempMin: 240, nozzleTempMax: 265, bedTempMin: 75, bedTempMax: 90 },
  'PETG PRO': { nozzleTempMin: 235, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 85 },
  
  // ABS variants
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 255, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true },
  'ABS+': { nozzleTempMin: 235, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true },
  
  // ASA
  'ASA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  
  // TPU
  'TPU': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 40, bedTempMax: 60 },
  'TPU 95A': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 40, bedTempMax: 60 },
  
  // Nylon/PA
  'Nylon': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 90, requiresEnclosure: true },
  'PA12': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true },
  
  // Carbon Fiber composites
  'PLA-CF': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 45, bedTempMax: 65, isAbrasive: true },
  'PETG-CF': { nozzleTempMin: 245, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 90, isAbrasive: true },
  'ABS-CF': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'ASA-CF': { nozzleTempMin: 250, nozzleTempMax: 275, bedTempMin: 95, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'Nylon-CF': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 70, bedTempMax: 90, requiresEnclosure: true, isAbrasive: true },
};

/**
 * Get print settings for a material type
 * Attempts to match against known materials, with fallbacks
 */
export function getAtomicPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  
  const materialUpper = material.toUpperCase().trim();
  
  // Direct match first
  for (const [key, settings] of Object.entries(ATOMIC_PRINT_SETTINGS)) {
    if (key.toUpperCase() === materialUpper) {
      return settings;
    }
  }
  
  // Partial match - check if material contains any key
  for (const [key, settings] of Object.entries(ATOMIC_PRINT_SETTINGS)) {
    if (materialUpper.includes(key.toUpperCase()) || key.toUpperCase().includes(materialUpper)) {
      return settings;
    }
  }
  
  // Check for carbon fiber variants
  if (materialUpper.includes('CF') || materialUpper.includes('CARBON')) {
    if (materialUpper.includes('PLA')) return ATOMIC_PRINT_SETTINGS['PLA-CF'];
    if (materialUpper.includes('PETG')) return ATOMIC_PRINT_SETTINGS['PETG-CF'];
    if (materialUpper.includes('ABS')) return ATOMIC_PRINT_SETTINGS['ABS-CF'];
    if (materialUpper.includes('ASA')) return ATOMIC_PRINT_SETTINGS['ASA-CF'];
    if (materialUpper.includes('NYLON') || materialUpper.includes('PA')) return ATOMIC_PRINT_SETTINGS['Nylon-CF'];
  }
  
  // Fallback based on base material type
  if (materialUpper.includes('PLA')) return ATOMIC_PRINT_SETTINGS['PLA'];
  if (materialUpper.includes('PETG')) return ATOMIC_PRINT_SETTINGS['PETG'];
  if (materialUpper.includes('ABS')) return ATOMIC_PRINT_SETTINGS['ABS'];
  if (materialUpper.includes('TPU') || materialUpper.includes('FLEX')) return ATOMIC_PRINT_SETTINGS['TPU'];
  if (materialUpper.includes('ASA')) return ATOMIC_PRINT_SETTINGS['ASA'];
  if (materialUpper.includes('NYLON') || materialUpper.includes('PA')) return ATOMIC_PRINT_SETTINGS['Nylon'];
  
  return null;
}

// ============================================================================
// FINISH TYPE EXTRACTION
// ============================================================================

export type FinishType = 'Silk' | 'Matte' | 'Glow' | 'Sparkle' | 'Metallic' | 'Translucent' | 'UV Reactive' | 'Carbon Fiber' | 'Standard';

const FINISH_PATTERNS: Array<{ pattern: RegExp; finish: FinishType }> = [
  { pattern: /\bsilk\b/i, finish: 'Silk' },
  { pattern: /\bmatte\b/i, finish: 'Matte' },
  { pattern: /\bglow(?:-in-the-dark)?\b/i, finish: 'Glow' },
  { pattern: /\b(?:sparkle|glitter)\b/i, finish: 'Sparkle' },
  { pattern: /\bmetallic\b/i, finish: 'Metallic' },
  { pattern: /\b(?:translucent|transparent|clear)\b/i, finish: 'Translucent' },
  { pattern: /\buv\s*reactive\b/i, finish: 'UV Reactive' },
  { pattern: /\b(?:carbon\s*fiber|cf)\b/i, finish: 'Carbon Fiber' },
];

/**
 * Extract finish type from product title
 * IMPORTANT: "Gun Metal" is a COLOR name, not a metallic finish
 */
export function extractFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  
  // Exclude "gun metal" from metallic detection - it's a color, not a finish
  // Also exclude color names that happen to contain finish-like words
  const titleForFinish = title
    .replace(/\bgun\s*metal\s*(?:gray|grey)?\b/gi, '')  // Gun Metal Gray is a color
    .replace(/\bgun\s*metal\b/gi, '');                   // Gun Metal is a color
  
  for (const { pattern, finish } of FINISH_PATTERNS) {
    if (pattern.test(titleForFinish)) {
      return finish;
    }
  }
  
  return 'Standard';
}

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

const ATOMIC_MATERIAL_MAPPING: Record<string, string> = {
  // CARBON FIBER COMPOSITES - Must come FIRST (longest/most specific patterns)
  // These prevent base materials from matching before CF detection
  'carbon fiber ultra black abs': 'ABS-CF',
  'carbon fiber black abs': 'ABS-CF',
  'carbon fiber extreme black abs': 'ABS-CF',
  'carbon fiber abs': 'ABS-CF',
  'cf abs': 'ABS-CF',
  'carbon fiber black asa': 'ASA-CF',
  'carbon fiber asa': 'ASA-CF',
  'cf asa': 'ASA-CF',
  'carbon fiber extreme black pla': 'PLA-CF',
  'carbon fiber black pla': 'PLA-CF',
  'carbon fiber pla': 'PLA-CF',
  'cf pla': 'PLA-CF',
  'carbon fiber extreme black petg': 'PETG-CF',
  'carbon fiber extreme petg': 'PETG-CF',
  'carbon fiber petg': 'PETG-CF',
  'cf petg': 'PETG-CF',
  'carbon fiber nuclear nylon': 'Nylon-CF',
  'nuclear nylon': 'Nylon-CF',  // Atomic's branded CF Nylon product
  'carbon fiber nylon': 'Nylon-CF',
  'cf nylon': 'Nylon-CF',
  
  // PLA variants with finishes (must come before base 'pla')
  'metallic pla': 'PLA',  // Metallic is a FINISH, not a material variant
  'silky pla': 'PLA',     // Silk is a FINISH, not a material variant
  'translucent pla': 'PLA',  // Translucent is a FINISH
  'sparkle pla': 'PLA',   // Sparkle is a FINISH
  'glow pla': 'PLA',      // Glow is a FINISH
  'matte pla': 'PLA',     // Matte is a FINISH
  
  // Base PLA variants
  'pla': 'PLA',
  'pla+': 'PLA+',
  'pla plus': 'PLA+',
  
  // PETG variants
  'petg': 'PETG',
  'petg+': 'PETG+',
  'petg plus': 'PETG+',
  'petg pro': 'PETG+',
  
  // ABS variants
  'abs': 'ABS',
  'abs+': 'ABS+',
  'abs plus': 'ABS+',
  
  // ASA
  'asa': 'ASA',
  
  // TPU variants
  'tpu': 'TPU',
  'tpu 95a': 'TPU',
  'flexible': 'TPU',
  
  // Nylon/PA variants
  'nylon': 'Nylon',
  'pa12': 'Nylon',
  'pa': 'Nylon',
};

/**
 * Normalize material name for Atomic Filament products
 * PRIORITY: Carbon Fiber composites > Plus variants > Base materials
 */
export function normalizeAtomicMaterial(title: string): string | null {
  if (!title) return null;
  
  const titleLower = title.toLowerCase();
  
  // FIRST: Check for Carbon Fiber composites (highest priority)
  // This must happen BEFORE base material fallbacks
  if (titleLower.includes('carbon fiber') || titleLower.includes(' cf ') || titleLower.startsWith('cf ')) {
    if (titleLower.includes('pla')) return 'PLA-CF';
    if (titleLower.includes('petg')) return 'PETG-CF';
    if (titleLower.includes('abs')) return 'ABS-CF';
    if (titleLower.includes('asa')) return 'ASA-CF';
    if (titleLower.includes('nylon') || titleLower.includes('nuclear')) return 'Nylon-CF';
    return 'PLA-CF'; // Default CF to PLA-CF if base material unclear
  }
  
  // Sort by length (longest first) for most specific match
  const sortedMappings = Object.entries(ATOMIC_MATERIAL_MAPPING)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, material] of sortedMappings) {
    if (titleLower.includes(pattern)) {
      return material;
    }
  }
  
  // Fallback: basic material detection (order matters - plus variants first)
  if (titleLower.includes('pla+') || titleLower.includes('pla plus')) return 'PLA+';
  if (titleLower.includes('petg+') || titleLower.includes('petg plus') || titleLower.includes('petg pro')) return 'PETG+';
  if (titleLower.includes('abs+') || titleLower.includes('abs plus')) return 'ABS+';
  if (titleLower.includes('pla')) return 'PLA';
  if (titleLower.includes('petg')) return 'PETG';
  if (titleLower.includes('abs')) return 'ABS';
  if (titleLower.includes('tpu')) return 'TPU';
  if (titleLower.includes('asa')) return 'ASA';
  if (titleLower.includes('nylon') || titleLower.includes('pa12')) return 'Nylon';
  
  return null;
}

// ============================================================================
// TITLE CLEANING - Atomic Filament-specific noise removal
// ============================================================================

export const PROMOTIONAL_PATTERNS = [
  /short\s*spool(?:s)?\s*(?:\d+%?\s*)?(?:min(?:imum)?)?/gi,
  /\d+\s*pack/gi,
  /\d+\.\d+\s*kg/gi,
  /3\.5kg/gi,
  /2\.85\s*mm\s*[-–]\s*/gi,
  /bulk\s*(?:sale|deal)?/gi,
  /sale/gi,
];

const ATOMIC_TITLE_NOISE = [
  // Promotional text
  ...PROMOTIONAL_PATTERNS,
  
  // Size/weight prefixes that should be cleaned
  /^\d+\.\d+\s*kg\s*/gi,
  /^3\.5kg\s*/gi,
  /^\d+\s*pack\s*/gi,
  
  // Diameter prefix
  /^2\.85\s*mm\s*[-–]?\s*/gi,
  /\b2\.85\s*mm\b/gi,
  /\b1\.75\s*mm\b/gi,
  
  // Generic descriptors
  /\b3d\s*printer?\s*filament\b/gi,
  /\bfdm\s*filament\b/gi,
  /\bfilament\b/gi,
  
  // Redundant brand mentions
  /\batomic\s*filament\s*/gi,
  /\batomic\s*/gi,
];

/**
 * Clean Atomic Filament product title of noise and promotional text
 */
export function cleanAtomicTitle(title: string): string {
  if (!title) return '';
  
  let cleaned = title;
  
  // Apply noise patterns
  for (const pattern of ATOMIC_TITLE_NOISE) {
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
 * Check if product is a promotional/bulk variant (should get separate product_line_id)
 */
export function isPromotionalProduct(title: string): boolean {
  const titleLower = title.toLowerCase();
  return (
    /\d+\s*pack/i.test(title) ||
    /3\.5\s*kg/i.test(title) ||
    /short\s*spool/i.test(title) ||
    titleLower.includes('bulk')
  );
}

/**
 * Check if product is 2.85mm diameter (should be separated from 1.75mm)
 */
export function is285mmDiameter(title: string): boolean {
  return /2\.85\s*mm/i.test(title);
}

// ============================================================================
// PRODUCT LINE ID GENERATION - SIMPLIFIED (Collection-based only)
// ============================================================================

/**
 * Generate product_line_id for Atomic Filament products
 * 
 * SIMPLIFIED: Only 5 possible values based on collection:
 * - atomic-filament__pla
 * - atomic-filament__petg
 * - atomic-filament__abs
 * - atomic-filament__asa
 * - atomic-filament__pla-silk
 * 
 * @param collectionMaterial - The material from the collection whitelist
 */
export function generateAtomicProductLineId(collectionMaterial: string): string {
  const materialSlug = collectionMaterial.toLowerCase().replace(/\s+/g, '-');
  return `atomic-filament__${materialSlug}`;
}

// ============================================================================
// ATOMIC-SPECIFIC COLOR MAPPING - EXPANDED WITH UNIQUE HEX CODES
// ============================================================================

export const ATOMIC_COLOR_MAPPING: Record<string, string> = {
  // ==========================================================================
  // COMPOUND TRANSLUCENT COLORS (must match BEFORE generic 'translucent')
  // These prevent translucent sapphire, pink, midnight etc from all getting #F0F0F0
  // ==========================================================================
  
  // === TRANSLUCENT SMOKE BLACK (prevent falling back to #F0F0F0) ===
  'translucent smoke black': '505050',
  'translucent smoke black pla': '525252',
  'translucent smoke black pla ams compatible': '545454',
  'translucent smoke black petg': '565656',
  'translucent smoke black petg pro': '585858',
  'translucent smoke black petg pro ams compatible': '5A5A5A',
  'smoke black translucent': '5C5C5C',
  
  // === AQUA TRANSLUCENT (prevent falling back to #F0F0F0) ===
  'aqua translucent': '00C8D0',
  'aqua translucent petg': '00CAD2',
  'aqua translucent petg pro': '00CCD4',
  'aqua translucent petg pro ams compatible': '00CED6',
  'translucent aqua': '00D0D8',
  
  // === EXTREME TRANSLUCENT FLUORESCENT NEON GREEN (prevent #F0F0F0) ===
  'extreme translucent fluorescent neon green': '33FF11',
  'extreme translucent fluorescent neon green petg': '35FF13',
  'extreme translucent fluorescent neon green petg uv reactive': '37FF15',
  'extreme translucent fluorescent neon green petg uv reactive ams compatible': '39FF17',
  'fluorescent translucent neon green': '3BFF19',
  'extreme translucent fluorescent neon green petg pro': '3DFF1B',
  
  'translucent sapphire blue': '1E40AF',
  'translucent sapphire blue pla': '1E42B0',
  'translucent sapphire blue pla ams compatible': '1E44B2',
  'translucent sapphire blue petg': '1F45B4',
  'translucent sapphire blue petg pro': '2047B6',
  'translucent sapphire blue petg pro ams compatible': '2149B8',
  
  'translucent midnight blue': '1E3A8A',
  'translucent midnight blue pla': '1F3C8C',
  'translucent midnight blue pla ams compatible': '203E8E',
  
  'translucent neon hot pink': 'FF1493',
  'translucent neon hot pink pla': 'FF1696',
  'translucent neon hot pink petg': 'FF1899',
  'translucent neon hot pink petg pro': 'FF1A9C',
  'translucent neon hot pink petg pro ams compatible': 'FF1C9F',
  'fluorescent translucent neon hot pink': 'FF0E8A',
  'fluorescent translucent neon hot pink pla': 'FF108D',
  'fluorescent translucent neon hot pink pla uv reactive': 'FF1290',
  'fluorescent translucent neon hot pink pla uv reactive ams compatible': 'FF1493',
  
  'emerald green translucent': '10B981',
  'emerald green translucent petg': '12BC84',
  'emerald green translucent petg pro': '14BF87',
  'emerald green translucent petg pro ams compatible': '16C28A',
  
  // ==========================================================================
  // COMPOUND CARBON FIBER COLORS (must match BEFORE generic 'carbon fiber')
  // These prevent dark cherry CF, dark blue CF, smoke blue CF from all getting #252525
  // ==========================================================================
  'dark cherry carbon fiber extreme': '6B2139',
  'dark cherry carbon fiber extreme petg': '6D233B',
  'dark cherry carbon fiber extreme petg pro': '6F253D',
  'dark cherry carbon fiber extreme petg pro ams compatible': '71273F',
  
  'dark blue carbon fiber extreme': '1E3A5F',
  'dark blue carbon fiber extreme petg': '203C61',
  'dark blue carbon fiber extreme petg pro': '223E63',
  'dark blue carbon fiber extreme petg pro ams compatible': '244065',
  
  'smoke blue carbon fiber extreme': '475569',
  'smoke blue carbon fiber extreme petg': '49576B',
  'smoke blue carbon fiber extreme petg pro': '4B596D',
  'smoke blue carbon fiber extreme petg pro ams compatible': '4D5B6F',
  
  // ==========================================================================
  // NEON YELLOW VARIANTS (prevent duplicate #CCFF00)
  // ==========================================================================
  'translucent neon yellow': 'D4FF00',
  'translucent neon yellow petg': 'D6FF02',
  'translucent neon yellow petg pro': 'D8FF04',
  'translucent neon yellow petg pro uv reactive': 'DAFF06',
  'translucent neon yellow petg pro uv reactive ams compatible': 'DCFF08',
  
  'neon yellow uv reactive opaque': 'CAFF00',
  'neon yellow uv reactive opaque petg': 'CBFF02',
  'neon yellow uv reactive opaque petg pro': 'CCFF04',
  'neon yellow uv reactive opaque petg pro ams compatible': 'CDFF06',
  
  // ==========================================================================
  // BLACK ABS VARIANTS (prevent duplicate #1A1A1A)
  // ==========================================================================
  'flame retardant sabic fr15u black': '0F0F0F',
  'flame retardant sabic fr15u black abs': '101010',
  'flame retardant sabic fr15u black abs filament': '111111',
  'flame retardant sabic fr15u black abs filament ams compatible': '121212',
  'flame retardant black': '131313',
  'flame retardant black abs': '141414',
  
  // === PERFECT SERIES ===
  'perfect red': 'DC2626',
  'perfect yellow': 'EAB308',
  'perfect blue': '2563EB',
  'perfect green': '16A34A',
  'perfect orange': 'EA580C',
  'perfect purple': 'A333EA',
  
  // === WHITE SPECTRUM (prevent all falling back to #FFFFFF) ===
  'bright white': 'FAFAFA',
  'micropolitan bright white': 'F8F8F8',
  'meltmiser white': 'F5F5F5',
  'ultra impact modified white': 'F2F2F2',
  'ultra impact modified white v2': 'EFEFEF',
  'extreme white': 'FCFCFC',
  'true white': 'FFFFFF',
  
  // === BLACK SPECTRUM (prevent all falling back to #1A1A1A) ===
  'extreme black': '0A0A0A',
  'extreme jet black': '050505',
  'true black': '0D0D0D',
  'meltmiser black': '181818',
  'extreme impact modified black': '151515',
  'deep black': '080808',
  'deep black opaque': '0B0B0B',
  'jet black': '070707',
  'black': '1A1A1A',
  'black pla': '1A1A1A',
  'black pla filament': '191919',
  'black pla filament ams compatible': '181818',
  'black hi-flow pro': '1C1C1C',
  'black hi-flow pro pla': '1B1B1B',
  'black hi-flow pro pla ams compatible': '1D1D1D',
  'black hi-flow pro petg': '1E1E1E',
  'black hi-flow pro abs': '1F1F1F',
  'black abs filament': '202020',
  'black abs filament ams compatible': '212121',
  
  // === GRAY SPECTRUM ===
  'gray': '808080',
  'light gray': 'C8C8C8',
  'light gray v2': 'CACACA',
  'light gray hi-flow pro': 'CDCDCD',
  'starlight gray': 'BFBFBF',
  'gun metal gray': '4A5258',
  'gun metal gray v2': '525B62',
  'extreme impact gun metal gray': '5A636B',
  'extreme impact gun metal gray v2': '5C6870',
  'cool gray': '898989',
  'cool gray asa': '8C8C8C',
  'stone gray': '6B7280',
  'stone gray carbon fiber': '6D7482',
  
  // === SILVER/METALLIC GRAYS ===
  'metallic silver': 'C0C0C0',
  'metallic silver v2': 'ACACAC',
  'silver': 'B8B8B8',
  'metallic gold': 'D4AF37',
  'metallic copper': 'B87333',
  'metallic bronze': 'CD7F32',
  
  // === PURPLE SPECTRUM ===
  'groovy purple': '8629C6',
  'groovy purple shade-shifting': '7C25B8',
  'shade shifting groovy purple': '7C25B8',
  'galactic purple': '6B21A8',
  'galactic purple translucent': '6D23AB',
  
  // === GREEN SPECTRUM ===
  'neon green': '39FF14',
  'neon green uv reactive': '32FF10',
  'neon green uv reactive v2': '35FF16',
  'silky extreme bright neon green': '38FF18',
  'silky extreme bright neon green uv reactive': '3AFF1A',
  'pearlescent translucent neon green': '36FF12',
  'translucent neon green': '30FF0E',
  'minty green': '22C088',
  'minty green sparkle': '25C48C',
  'pine green': '1A7050',
  'reprap green': '00A050',
  'shamrock': '15A045',
  'shamrock sparkle': '18A448',
  'army green': '4B5320',
  'army green asa': '4D5522',
  'true green': '00FF00',
  'bug eyes': '22C55E',
  
  // === BLUE SPECTRUM ===
  'too good to be blue': '2566ED',
  'too good to be blue sparkle': '2769F0',
  'navy blue': '001080',
  'royal blue': '4060E1',
  'royal blue asa': '4264E4',
  'atomic blue': '0066CC',
  'translucent blue': '87CEEB',
  'true blue': '0000FF',
  'illusion blue': '3B82F6',
  'illusion blue iridescent': '3D85F9',
  
  // === MYSTERIOUS ABYSS SERIES ===
  'mysterious abyss': '1E3A60',
  'mysterious abyss v2': '203D65',
  'mysterious abyss v2 pearl': '2D4A70',
  'mysterious abyss pearl': '2B4870',
  
  // === RED SPECTRUM ===
  'true red': 'FF0000',
  'illusion cherry': 'D03060',
  'illusion cherry iridescent': 'D53365',
  'dark cherry red': 'C82850',
  'gemstone ruby red': 'E01150',
  'golden blood diamond': 'B82040',
  'carbon fiber dark cherry': '4A1522',
  
  // === ORANGE SPECTRUM ===
  'atomic orange': 'FF6B35',
  'neon orange': 'FF5F1F',
  'translucent orange': 'FFB347',
  'translucent bright orange': 'FF9040',
  'uv reactive orange': 'FF4500',
  
  // === YELLOW SPECTRUM ===
  'neon yellow': 'CCFF00',
  'translucent yellow': 'FFFF99',
  
  // === PINK SPECTRUM ===
  'neon pink': 'FF6EC7',
  'bubblegum': 'FF69B4',
  'iridescent bubblegum': 'FF6DB8',
  'uv reactive pink': 'FF1493',
  'translucent flamingo sunset': 'FF6080',
  
  // === ROSE GOLD SERIES ===
  'rose gold': 'B76E79',
  'rose gold metallic': 'B97080',
  'rose gold metallic translucent': 'C08090',
  
  // === INDIGO GOLDEN SPARKLE SERIES ===
  'indigo golden sparkle': '4B0082',
  'indigo golden sparkle v3': '4D0085',
  'indigo golden sparkle translucent': '5020A0',
  'indigo golden sparkle v3 translucent': '5222A3',
  
  // === TROPICAL/IRIDESCENT SERIES ===
  'tropical sea': '30C0D0',
  'tropical sea iridescent': '32C4D4',
  'tropical sea iridescent translucent': '35C8D8',
  
  // === OFFSHORE/PERIWINKLE SERIES ===
  'offshore mist': '93C5FD',
  'off shore mist': '93C5FD',
  'silky offshore mist': '95C8FF',
  'periwinkle': '8B8BB4',
  'silky periwinkle': '8D8DB8',
  
  // === CHAMELEON/SHADE-SHIFTING ===
  'chameleon coastline': '0EA5E9',
  'shade shifting': '8B5CF6',
  'coastline': '0EA5E9',
  
  // === PEARLESCENT SERIES ===
  'pearlescent blue': '87CEEB',
  'candy apple golden pearl': 'C8A060',
  
  // === TRANSLUCENT SPECTRUM (generic - matched AFTER compound colors) ===
  'crystal clear': 'F5F5F5',
  'translucent': 'F0F0F0',
  'translucent green': '90EE90',
  'translucent red': 'FF6B6B',
  'starry night translucent': 'E8E8F0',
  'starry night translucent v3': 'EAEAF3',
  'amethyst violet gemstone translucent': '9080C0',
  'aqua gemstone translucent': '70D0E0',
  'emerald green gemstone translucent': '40C878',
  
  // === MARBLE SERIES ===
  'black marble': 'D8D8D8',
  'marble': 'E8E4E0',
  
  // === CARBON FIBER (generic - matched AFTER compound CF colors) ===
  'carbon fiber': '2D2D2D',
  'carbon fiber extreme': '252525',
  'carbon fiber extreme black': '232323',
  'cf black': '282828',
  
  // === UV REACTIVE ===
  'uv reactive': 'FF00FF',
  'uv reactive green': '39FF14',
  'uv reactive blue': '00BFFF',
  
  // === GEMSTONE SERIES ===
  'gemstone': 'E01150',
  'amethyst': '9966CC',
  'aqua': '00FFFF',
  'emerald': '50C878',
  'ruby': 'E01150',
};

/**
 * Generate a deterministic unique hex color from a color name
 * Used as fallback when no explicit mapping exists to prevent duplicates
 */
function generateDeterministicHex(colorName: string): string {
  let hash = 0;
  for (let i = 0; i < colorName.length; i++) {
    const char = colorName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Ensure positive values and good distribution
  const r = Math.abs((hash & 0xFF0000) >> 16);
  const g = Math.abs((hash & 0x00FF00) >> 8);
  const b = Math.abs(hash & 0x0000FF);
  
  return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

/**
 * Get hex color for Atomic-specific color name
 * Uses deterministic fallback if no mapping found (prevents duplicates)
 * 
 * MATCH ORDER (most specific first):
 * 1. Exact match on full color name
 * 2. Exact match on normalized color name (spaces/dashes normalized)
 * 3. Partial match - ONLY if the mapping KEY is contained in the color name
 *    (sorted by key length, longest first to prevent generic patterns like
 *    'translucent' from matching before 'translucent sapphire blue')
 * 4. Deterministic hex generation as fallback
 */
export function getAtomicColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const colorLower = colorName.toLowerCase().trim();
  
  // 1. Try exact match first (highest priority)
  if (ATOMIC_COLOR_MAPPING[colorLower]) {
    return ATOMIC_COLOR_MAPPING[colorLower];
  }
  
  // 2. Normalize and try exact match again
  const normalized = colorLower
    .replace(/\s+/g, ' ')
    .replace(/[-–—]/g, ' ')
    .trim();
  
  if (normalized !== colorLower && ATOMIC_COLOR_MAPPING[normalized]) {
    return ATOMIC_COLOR_MAPPING[normalized];
  }
  
  // 3. Partial matches - sort by key length (longest first = most specific)
  // IMPORTANT: Only match if the KEY is contained in the color name
  // This prevents short keys like 'translucent' from matching before
  // longer compound names like 'translucent sapphire blue'
  const sortedKeys = Object.keys(ATOMIC_COLOR_MAPPING).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (colorLower.includes(key)) {
      return ATOMIC_COLOR_MAPPING[key];
    }
  }
  
  // 4. Generate deterministic hex as fallback (prevents duplicate #FFFFFF/#1A1A1A)
  return generateDeterministicHex(colorLower);
}

// ============================================================================
// ACCESSORY/NON-FILAMENT DETECTION
// ============================================================================

/**
 * Patterns for detecting non-filament products (apparel, samples, accessories)
 */
const ATOMIC_ACCESSORY_PATTERNS: RegExp[] = [
  // Apparel
  /\bshirt\b/i,
  /\bt-shirt\b/i,
  /\bhoodie\b/i,
  /\bbeanie\b/i,
  /\bhat\b/i,
  /\bcap\b/i,
  /\bbackpack\b/i,
  /\bbag\b/i,
  // Accessories
  /\bspool\s*holder\b/i,
  /\bnozzle\b/i,
  /\bsheet\b/i,
  /\btools?\b/i,
  /\bams\s*compatible\s*spool--empty\b/i,
  /\bempty\s*spool\b/i,
  /\bspool--empty\b/i,
  // Samples and kits
  /\bsample\s*coil\s*pack\b/i,
  /\bsample\s*pack\b/i,
  /\bsample\s*coils?\b/i,
  /\bdiy\s*assembly\s*kit\b/i,
  // Small weights (sample coils are typically 50g)
  /\b50g\b/i,
  /\b100g\b/i,
];

/**
 * Check if a product is an accessory, apparel, or sample (non-filament)
 */
export function isAtomicAccessory(title: string): boolean {
  if (!title) return false;
  return ATOMIC_ACCESSORY_PATTERNS.some(pattern => pattern.test(title));
}

// Minimum weight threshold for filaments (exclude sample coils)
export const ATOMIC_MIN_WEIGHT_GRAMS = 300;

// ============================================================================
// ENHANCED NON-FILAMENT DETECTION (for sync pre-filtering)
// ============================================================================

/**
 * ATOMIC-SPECIFIC EXCLUSION PATTERNS
 * Products matching these patterns should be excluded from the filament catalog
 */
export const ATOMIC_EXCLUDED_PRODUCT_PATTERNS: string[] = [
  'brand shirt',
  'shirt -',
  't-shirt',
  'tee shirt',
  'empty spool',
  'spool--empty',
  'ams compatible spool--empty',
  'sample coil pack',
  'short spool',
  '10 pack',
  '10-pack',
  '70% min',  // Short spools
  // Non-filament products (gift cards, etc.)
  'gift card',
  'gift',
];

/**
 * Check if a product should be excluded from Atomic Filament sync
 * (non-filament products like shirts, accessories, sample packs, bulk bundles)
 */
export function isAtomicNonFilamentProduct(title: string): boolean {
  if (!title) return false;
  const titleLower = title.toLowerCase();
  
  // Check pattern-based exclusions
  if (ATOMIC_EXCLUDED_PRODUCT_PATTERNS.some(pattern => titleLower.includes(pattern))) {
    return true;
  }
  
  // Also use the accessory detection
  return isAtomicAccessory(title);
}

/**
 * Check if a product is a sample coil (should be excluded)
 * Separate from accessory detection for clarity
 */
export function isAtomicSampleProduct(title: string): boolean {
  if (!title) return false;
  const titleLower = title.toLowerCase();
  
  return (
    titleLower.includes('sample coil') ||
    titleLower.includes('sample pack') ||
    /coil\s*pack/i.test(title)
  );
}

// ============================================================================
// MAIN POST-PROCESSING FUNCTION
// ============================================================================

export interface AtomicEnrichmentResult {
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
  requiresEnclosure: boolean;
  cleanedTitle: string;
  productLineId: string;
  is285mm: boolean;
  isPromotional: boolean;
}

/**
 * Apply all Atomic Filament-specific enrichments to a product
 */
export function enrichAtomicProduct(
  title: string,
  existingMaterial: string | null = null,
  existingTds: string | null = null,
  existingNozzleMin: number | null = null,
  existingNozzleMax: number | null = null,
  existingBedMin: number | null = null,
  existingBedMax: number | null = null
): AtomicEnrichmentResult {
  // Extract/normalize values
  const finishType = extractFinishType(title);
  const material = existingMaterial || normalizeAtomicMaterial(title);
  const cleanedTitle = cleanAtomicTitle(title);
  // Use the material for product_line_id (simplified approach)
  const productLineId = generateAtomicProductLineId(material || 'pla');
  
  // Get TDS URL if not already present
  let tdsUrl = existingTds;
  let tdsSource: string | null = null;
  if (!tdsUrl) {
    const tdsMatch = matchAtomicTds(title);
    if (tdsMatch) {
      tdsUrl = tdsMatch.url;
      tdsSource = `known_pattern:${tdsMatch.pattern}`;
    }
  }
  
  // Get print settings if not already present
  const printSettings = getAtomicPrintSettings(material);
  
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
    highSpeedCapable: false, // Atomic doesn't have high-speed filaments
    isAbrasive: printSettings?.isAbrasive ?? false,
    requiresEnclosure: printSettings?.requiresEnclosure ?? false,
    cleanedTitle,
    productLineId,
    is285mm: is285mmDiameter(title),
    isPromotional: isPromotionalProduct(title),
  };
}
