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

const ATOMIC_MATERIAL_MAPPING: Record<string, string> = {
  // PLA variants
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
  
  // Atomic Filament branded Carbon Fiber Nylon (Nuclear Nylon)
  'carbon fiber nuclear nylon': 'Nylon-CF',
  'nuclear nylon': 'Nylon-CF',  // Atomic's branded CF Nylon product
  
  // Carbon Fiber composites
  'carbon fiber pla': 'PLA-CF',
  'cf pla': 'PLA-CF',
  'carbon fiber petg': 'PETG-CF',
  'cf petg': 'PETG-CF',
  'carbon fiber abs': 'ABS-CF',
  'cf abs': 'ABS-CF',
  'carbon fiber asa': 'ASA-CF',
  'cf asa': 'ASA-CF',
  'carbon fiber nylon': 'Nylon-CF',
  'cf nylon': 'Nylon-CF',
};

/**
 * Normalize material name for Atomic Filament products
 */
export function normalizeAtomicMaterial(title: string): string | null {
  if (!title) return null;
  
  const titleLower = title.toLowerCase();
  
  // Sort by length (longest first) for most specific match
  const sortedMappings = Object.entries(ATOMIC_MATERIAL_MAPPING)
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
// PRODUCT LINE ID GENERATION (Matches Anycubic/Amolen approach)
// ============================================================================

/**
 * Generate product_line_id for Atomic Filament products
 * Groups products by material + finish type, separating bulk/promotional items
 */
export function generateAtomicProductLineId(title: string, material?: string | null): string {
  const cleanedTitle = cleanAtomicTitle(title).toLowerCase();
  
  // Build product line ID from material + product line
  let baseId = 'atomic-filament';
  
  // Add material
  const normalizedMaterial = normalizeAtomicMaterial(title);
  if (normalizedMaterial) {
    baseId += `__${normalizedMaterial.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  } else if (material) {
    baseId += `__${material.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }
  
  // Add finish type
  const finishType = extractFinishType(title);
  if (finishType !== 'Standard') {
    baseId += `__${finishType.toLowerCase().replace(/\s+/g, '-')}`;
  }
  
  // MeltMiser is a distinct product line
  if (cleanedTitle.includes('meltmiser')) {
    baseId += '__meltmiser';
  }
  
  // Check for PETG PRO (distinct line)
  if (cleanedTitle.includes('petg pro')) {
    baseId = baseId.replace('__petg', '__petg-pro');
  }
  
  // Separate 2.85mm products
  if (is285mmDiameter(title)) {
    baseId += '__2.85mm';
  }
  
  // Bulk/promotional products get isolated
  if (isPromotionalProduct(title)) {
    if (/\d+\s*pack/i.test(title)) {
      const packMatch = title.match(/(\d+)\s*pack/i);
      if (packMatch) {
        baseId += `__${packMatch[1]}pack`;
      }
    } else if (/3\.5\s*kg/i.test(title)) {
      baseId += '__3.5kg';
    } else if (/short\s*spool/i.test(title)) {
      baseId += '__short-spool';
    }
  }
  
  return baseId;
}

// ============================================================================
// ATOMIC-SPECIFIC COLOR MAPPING
// ============================================================================

export const ATOMIC_COLOR_MAPPING: Record<string, string> = {
  // Atomic Filament specialty colors
  'perfect red': 'DC2626',
  'perfect yellow': 'EAB308',
  'perfect blue': '2563EB',
  'perfect green': '16A34A',
  'perfect orange': 'EA580C',
  'perfect purple': '9333EA',
  
  // MeltMiser colors
  'meltmiser black': '1A1A1A',
  'meltmiser white': 'FFFFFF',
  
  // Extreme colors
  'extreme black': '0A0A0A',
  'extreme white': 'FAFAFA',
  
  // Specialty colors
  'crystal clear': 'F5F5F5',
  'neon orange': 'FF5F1F',
  'neon green': '39FF14',
  'neon pink': 'FF6EC7',
  'neon yellow': 'CCFF00',
  
  // Metallic variants
  'metallic silver': 'C0C0C0',
  'metallic silver v2': 'A8A8A8',
  'metallic gold': 'D4AF37',
  'metallic copper': 'B87333',
  'metallic bronze': 'CD7F32',
  
  // UV Reactive
  'uv reactive': 'FF00FF',
  'uv reactive green': '39FF14',
  'uv reactive blue': '00BFFF',
  'uv reactive orange': 'FF4500',
  'uv reactive pink': 'FF1493',
  
  // Carbon fiber
  'carbon fiber': '2D2D2D',
  'cf black': '1A1A1A',
  
  // Standard colors with Atomic naming
  'true black': '0A0A0A',
  'true white': 'FFFFFF',
  'true red': 'FF0000',
  'true blue': '0000FF',
  'true green': '00FF00',
  
  // Translucent variants
  'translucent': 'F0F0F0',
  'translucent blue': '87CEEB',
  'translucent green': '90EE90',
  'translucent red': 'FF6B6B',
  'translucent orange': 'FFB347',
  'translucent yellow': 'FFFF99',
  
  // ===== NEW: Missing specialty colors from Post Sync Check =====
  
  // Illusion/Iridescent series (critical for Color Distinguishability)
  'illusion cherry': 'DC2626',
  'illusion cherry iridescent': 'DC2626',
  'illusion blue': '3B82F6',
  'illusion green': '22C55E',
  'illusion blue iridescent': '3B82F6',
  
  // Mysterious Abyss series
  'mysterious abyss': '1E3A5F',
  'mysterious abyss v2': '1E3A5F',
  'mysterious abyss v2 pearl': '2D4A6A',
  'mysterious abyss pearl': '2D4A6A',
  
  // Indigo Golden Sparkle series
  'indigo golden sparkle': '4B0082',
  'indigo golden sparkle v3': '4B0082',
  'indigo golden sparkle translucent': '5B1092',
  
  // Chameleon/Shade-shifting
  'chameleon coastline': '0EA5E9',
  'shade shifting': '8B5CF6',
  'coastline': '0EA5E9',
  
  // Bug Eyes specialty
  'bug eyes': '22C55E',
  
  // Offshore/Silky series
  'offshore mist': '93C5FD',
  'off shore mist': '93C5FD',
  'silky offshore mist': '93C5FD',
  'silky periwinkle': '8B8BB4',
  'periwinkle': '8B8BB4',
  
  // Bubblegum/Rose gold
  'bubblegum': 'FF69B4',
  'iridescent bubblegum': 'FF69B4',
  'rose gold': 'B76E79',
  'rose gold metallic': 'B76E79',
  'rose gold metallic translucent': 'C87F89',
  
  // Carbon Fiber Extreme series
  'carbon fiber dark cherry': '4A1522',
  'extreme petg': '1F2937',
  'stone gray carbon fiber': '6B7280',
  'stone gray': '6B7280',
  
  // Additional standard colors
  'shamrock': '16A34A',
  'shamrock sparkle': '16A34A',
  'micropolitan bright white': 'FAFAFA',
  'bright white': 'FAFAFA',
  'groovy purple': '9333EA',
  'atomic orange': 'FF6B35',
  'atomic blue': '0066CC',
};

/**
 * Get hex color for Atomic-specific color name
 * Returns null if not found (falls back to generic color mapping)
 */
export function getAtomicColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const colorLower = colorName.toLowerCase().trim();
  return ATOMIC_COLOR_MAPPING[colorLower] || null;
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
  const productLineId = generateAtomicProductLineId(title, material);
  
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
