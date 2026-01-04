/**
 * AZUREFILM BRAND-SPECIFIC DEFAULTS
 * 
 * European (Slovenian) manufacturer specializing in eco-friendly refill filaments
 * Platform: WooCommerce with Cloudflare protection
 * Currency: EUR
 * Diameter: 1.75mm only
 * 
 * Key characteristics:
 * - Master Spool / Refill system (spoolless eco-packaging)
 * - "Hyper Speed" PETG and "HS" Matte PLA lines
 * - Specialty effects: Silk Rainbow, Lumos, Neon, Pearl
 * - LumberLay wood-filled line
 * - Engineering materials: PAHT-CF, PET-CF, PC-ABS, PCTG
 */

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export interface MaterialInfo {
  normalized: string;
  category: string;
  isAbrasive?: boolean;
  requiresEnclosure?: boolean;
  isHighSpeed?: boolean;
  isFlexible?: boolean;
  isComposite?: boolean;
}

const MATERIAL_PATTERNS: Array<{ pattern: RegExp; info: MaterialInfo }> = [
  // Composite/Engineering materials first (most specific)
  { pattern: /paht[\s-]*cf|carbon.*paht/i, info: { normalized: 'PAHT-CF', category: 'Engineering', isAbrasive: true, requiresEnclosure: true, isComposite: true } },
  { pattern: /pet[\s-]*cf|carbon.*pet/i, info: { normalized: 'PET-CF', category: 'Engineering', isAbrasive: true, isComposite: true } },
  { pattern: /pc[\s-]*abs/i, info: { normalized: 'PC-ABS', category: 'Engineering', requiresEnclosure: true, isComposite: true } },
  { pattern: /pctg/i, info: { normalized: 'PCTG', category: 'Engineering' } },
  
  // Flexible
  { pattern: /flexible\s*95a|tpu\s*95a|tpu.*flexible/i, info: { normalized: 'TPU-95A', category: 'Flexible', isFlexible: true } },
  { pattern: /tpu/i, info: { normalized: 'TPU-95A', category: 'Flexible', isFlexible: true } },
  
  // Wood-filled
  { pattern: /lumberlay|wood\s*pla|pla.*wood/i, info: { normalized: 'PLA-Wood', category: 'Specialty', isAbrasive: true } },
  
  // High-speed variants
  { pattern: /hyper\s*speed.*petg|petg.*hyper\s*speed|petg\s*hs/i, info: { normalized: 'PETG', category: 'Standard', isHighSpeed: true } },
  { pattern: /matte.*hs|hs.*matte|high\s*speed.*pla/i, info: { normalized: 'PLA', category: 'Standard', isHighSpeed: true } },
  
  // PLA variants
  { pattern: /strongman|pla\s*pro|pro\s*pla/i, info: { normalized: 'PLA+', category: 'Standard' } },
  { pattern: /pla/i, info: { normalized: 'PLA', category: 'Standard' } },
  
  // Standard materials
  { pattern: /petg/i, info: { normalized: 'PETG', category: 'Standard' } },
  { pattern: /asa/i, info: { normalized: 'ASA', category: 'Engineering', requiresEnclosure: true } },
  { pattern: /abs/i, info: { normalized: 'ABS', category: 'Standard', requiresEnclosure: true } },
  { pattern: /pva/i, info: { normalized: 'PVA', category: 'Support' } },
  { pattern: /hips/i, info: { normalized: 'HIPS', category: 'Support' } },
  { pattern: /pc(?![\w-])|polycarbonate/i, info: { normalized: 'PC', category: 'Engineering', requiresEnclosure: true } },
  { pattern: /nylon|pa(?:6|12|66)?(?!\w)/i, info: { normalized: 'PA', category: 'Engineering', requiresEnclosure: true } },
];

export function normalizeAzureFilmMaterial(title: string): MaterialInfo {
  if (!title) return { normalized: 'PLA', category: 'Standard' };
  
  for (const { pattern, info } of MATERIAL_PATTERNS) {
    if (pattern.test(title)) {
      return info;
    }
  }
  
  return { normalized: 'PLA', category: 'Standard' };
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 
  | 'Standard' | 'Matte' | 'Silk' | 'Rainbow' | 'Multi' 
  | 'Sparkle' | 'Shimmer' | 'Translucent' | 'Fluorescent' 
  | 'Pastel' | 'Wood' | 'Glow';

const FINISH_PATTERNS: Array<{ pattern: RegExp; finish: FinishType }> = [
  { pattern: /silk\s*rainbow|rainbow\s*silk/i, finish: 'Rainbow' },
  { pattern: /silk\s*multicolor|multicolor|dual\s*color|tri[\s-]*color/i, finish: 'Multi' },
  { pattern: /silk/i, finish: 'Silk' },
  { pattern: /matte/i, finish: 'Matte' },
  { pattern: /glitter|sparkle/i, finish: 'Sparkle' },
  { pattern: /pearl/i, finish: 'Shimmer' },
  { pattern: /lumos|translucent|transparent|clear/i, finish: 'Translucent' },
  { pattern: /neon|fluorescent|uv\s*reactive/i, finish: 'Fluorescent' },
  { pattern: /pastel/i, finish: 'Pastel' },
  { pattern: /wood|lumberlay/i, finish: 'Wood' },
  { pattern: /glow[\s-]*in[\s-]*(?:the[\s-]*)?dark|glow/i, finish: 'Glow' },
];

export function extractAzureFilmFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  
  for (const { pattern, finish } of FINISH_PATTERNS) {
    if (pattern.test(title)) {
      return finish;
    }
  }
  
  return 'Standard';
}

// ============================================================================
// PRINT SETTINGS
// ============================================================================

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
  highSpeedCapable?: boolean;
}

export const AZUREFILM_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PLA+': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'PLA-HS': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60, highSpeedCapable: true },
  'PLA-Wood': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60, isAbrasive: true },
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 85 },
  'PETG-HS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 85, highSpeedCapable: true },
  'PCTG': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 80 },
  'ABS': { nozzleTempMin: 220, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'ASA': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'PC': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 100, bedTempMax: 120, requiresEnclosure: true },
  'PC-ABS': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 100, bedTempMax: 120, requiresEnclosure: true },
  'PA': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 90, requiresEnclosure: true },
  'PAHT-CF': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true, isAbrasive: true },
  'PET-CF': { nozzleTempMin: 250, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 90, isAbrasive: true },
  'TPU-95A': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 30, bedTempMax: 50, printSpeedMax: 40 },
  'PVA': { nozzleTempMin: 180, nozzleTempMax: 210, bedTempMin: 50, bedTempMax: 60 },
  'HIPS': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110 },
};

export function getAzureFilmPrintSettings(material: string, isHighSpeed?: boolean): PrintSettings | null {
  if (!material) return null;
  
  const key = isHighSpeed ? `${material}-HS` : material;
  return AZUREFILM_PRINT_SETTINGS[key] || AZUREFILM_PRINT_SETTINGS[material] || null;
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateAzureFilmProductLineId(title: string, material: string): string {
  // Fix: Normalize material to remove invalid characters and trailing dashes
  const mat = material.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const finish = extractAzureFilmFinishType(title);
  
  // Detect product line variants
  let lineVariant = '';
  
  if (/strongman/i.test(title)) lineVariant = 'strongman';
  else if (/original/i.test(title)) lineVariant = 'original';
  else if (/prime/i.test(title)) lineVariant = 'prime';
  else if (/plus/i.test(title)) lineVariant = 'plus';
  else if (/hyper\s*speed|hs\b/i.test(title)) lineVariant = 'hyper-speed';
  else if (/cmyk|lithophane/i.test(title)) lineVariant = 'cmyk';
  else if (/lumberlay/i.test(title)) lineVariant = 'lumberlay';
  else if (/skin/i.test(title)) lineVariant = 'skin';
  
  let lineId = `azurefilm__${mat}`;
  
  if (lineVariant) {
    lineId += `__${lineVariant}`;
  } else if (finish !== 'Standard') {
    lineId += `__${finish.toLowerCase()}`;
  } else {
    lineId += '__standard';
  }
  
  return lineId;
}

// ============================================================================
// TDS URL MAPPING
// ============================================================================

export const AZUREFILM_TDS_URLS: Record<string, string> = {
  'PLA': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PLA_TDS.pdf',
  'PLA+': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PLA_Pro_TDS.pdf',
  'PLA-SILK': 'https://azurefilm.com/wp-content/uploads/AzureFilm_Silk_PLA_TDS.pdf',
  'PLA-MATTE': 'https://azurefilm.com/wp-content/uploads/AzureFilm_Matte_PLA_TDS.pdf',
  'PLA-Wood': 'https://azurefilm.com/wp-content/uploads/AzureFilm_Wood_PLA_TDS.pdf',
  'PETG': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PETG_TDS.pdf',
  'ABS': 'https://azurefilm.com/wp-content/uploads/AzureFilm_ABS_TDS.pdf',
  'ASA': 'https://azurefilm.com/wp-content/uploads/AzureFilm_ASA_TDS.pdf',
  'TPU-95A': 'https://azurefilm.com/wp-content/uploads/AzureFilm_TPU_TDS.pdf',
  'PC': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PC_TDS.pdf',
  'PA': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PA_TDS.pdf',
  'PAHT-CF': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PAHT_CF_TDS.pdf',
};

export function getAzureFilmTdsUrl(material: string, finishType: FinishType): string | null {
  if (!material) return null;
  
  // Check for finish-specific TDS first
  if (material === 'PLA' && finishType === 'Silk') {
    return AZUREFILM_TDS_URLS['PLA-SILK'];
  }
  if (material === 'PLA' && finishType === 'Matte') {
    return AZUREFILM_TDS_URLS['PLA-MATTE'];
  }
  
  return AZUREFILM_TDS_URLS[material] || null;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const AZUREFILM_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'black': '1A1A1A',
  'white': 'FFFFFF',
  'red': 'E31C25',
  'blue': '1E88E5',
  'green': '2E7D32',
  'yellow': 'FFD600',
  'orange': 'FF6D00',
  'purple': '7B1FA2',
  'pink': 'EC407A',
  'grey': '757575',
  'gray': '757575',
  'brown': '5D4037',
  'beige': 'D7CCC8',
  'natural': 'F5F5DC',
  
  // Missing standard colors
  'nature': 'F5F5DC',      // Same as natural
  'natur': 'F5F5DC',       // German spelling
  'marble': 'E0E0E0',      // Grey-white marble effect
  'sage': '9DC183',        // Sage green/grey
  'off-white': 'FAF9F6',   // Slightly cream white
  
  // Distinct grey shades (CRITICAL: prevent duplicate hex)
  'dark grey': '424242',   // Much darker than standard grey
  'light grey': 'BDBDBD',  // Much lighter than standard grey  
  'shark grey': '546E7A',  // Blue-grey tone, distinct from grey
  
  // Glitter/Effect variants (CRITICAL: distinct from solid colors)
  'glitter black': '282828', // Slightly lighter than solid black (1A1A1A)
  'glitter silver': 'B8B8B8', // Distinct from solid silver
  'glitter gold': 'CFB53B',   // Distinct from solid gold
  'glitter blue': '2979FF',   // Distinct from standard blue
  'glitter green': '00C853',  // Distinct from standard green
  'glitter red': 'FF1744',    // Distinct from standard red
  
  // Metallic
  'gold': 'D4AF37',
  'gold 18k': 'C5A028',
  'gold 24k': 'FFD700',
  'silver': 'C0C0C0',
  'bronze': 'CD7F32',
  'copper': 'B87333',
  
  // Blues
  'dark blue': '0D47A1',
  'light blue': '03A9F4',
  'sky blue': '87CEEB',
  'navy': '1A237E',
  'ocean blue': '006994',
  'royal blue': '4169E1',
  
  // Greens
  'dark green': '1B5E20',
  'light green': '8BC34A',
  'lime': 'CDDC39',
  'mint': '98FF98',
  'olive': '808000',
  'forest green': '228B22',
  'grass green': '43A047',  // Distinct from standard green (2E7D32)
  
  // Reds/Pinks
  'dark red': 'B71C1C',
  'light red': 'EF5350',
  'wine': '722F37',
  'magenta': 'E91E63',
  'rose': 'FF007F',
  'coral': 'FF7F50',
  'tiger orange': 'E65100', // Darker/different from orange (FF6D00)
  
  // Neon colors
  'neon green': '39FF14',
  'neon yellow': 'DFFF00',
  'neon orange': 'FF5F1F',
  'neon pink': 'FF6EC7',
  'neon blue': '1B03A3',
  
  // Pastel colors
  'pastel pink': 'FFD1DC',
  'pastel blue': 'AEC6CF',
  'pastel green': '77DD77',
  'pastel yellow': 'FDFD96',
  'pastel purple': 'B39EB5',
  'pastel orange': 'FFB347',
  
  // Skin tones
  'light skin': 'FFDBAC',
  'medium skin': 'C68642',
  'dark skin': '8D5524',
  'skin 1': 'FFDBAC',
  'skin 2': 'E0AC69',
  'skin 3': 'C68642',
  'skin 4': '8D5524',
  
  // LumberLay wood colors (EXPANDED)
  'green poplar': '6B8E23',
  'white wood': 'DEB887',
  'cherry': '9B111E',
  'walnut': '5C4033',
  'oak': 'C19A6B',
  'olive wood': '808000',
  'bamboo': 'E3DEB3',
  'pine': 'C9A65F',          // Light pine wood
  'cork': 'D4A76A',          // Cork color
  'black ebony': '3C2415',   // Dark ebony wood
  'grey oak': '8B8378',      // Grey-toned oak (distinct from standard oak)
  
  // Translucent/Lumos - use distinct hex values for each
  'transparent': 'E3F2FD',   // Very light blue tint to differentiate from white
  'translucent': 'ECEFF1',   // Very light grey tint
  'clear': 'F5F5F5',         // Slightly off-white
  'litho white': 'FAFAFA',   // Ghost white for lithophane (distinct from pure white)
  
  // Special effects
  'rainbow': 'FF69B4',
  'sunset': 'FF6347',
  'galaxy': '483D8B',
  
  // Additional variants
  'cream': 'FFFDD0',
  'ivory': 'FFFFF0',
  'charcoal': '36454F',
  'slate': '708090',
  'turquoise': '40E0D0',
  'teal': '008080',
  'cyan': '00FFFF',
  'violet': 'EE82EE',
  'lavender': 'E6E6FA',
  'plum': 'DDA0DD',
  'maroon': '800000',
  'burgundy': '800020',
  'peach': 'FFCBA4',
  'pearly peach': 'FFDAB9', // Distinct from standard peach
  'apricot': 'FBCEB1',
  'mustard': 'FFDB58',
  'khaki': 'C3B091',
  'rose gold': 'B76E79',     // Distinct metallic rose
};

export function getAzureFilmColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  // CRITICAL: Normalize ALL whitespace (including internal double spaces from title extraction)
  const normalized = colorName.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Direct match first (highest priority)
  if (AZUREFILM_COLOR_MAPPING[normalized]) {
    return AZUREFILM_COLOR_MAPPING[normalized];
  }
  
  // Prioritized partial match - LONGEST KEYS FIRST
  // This ensures "dark grey" matches before "grey", "glitter black" before "black"
  const sortedKeys = Object.keys(AZUREFILM_COLOR_MAPPING)
    .sort((a, b) => b.length - a.length);
    
  for (const key of sortedKeys) {
    if (normalized.includes(key)) {
      return AZUREFILM_COLOR_MAPPING[key];
    }
  }
  
  // Word-based match as fallback
  const words = normalized.split(/[\s-]+/);
  for (const word of words) {
    if (word.length > 2 && AZUREFILM_COLOR_MAPPING[word]) {
      return AZUREFILM_COLOR_MAPPING[word];
    }
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanAzureFilmTitle(title: string): string {
  if (!title) return '';
  
  return title
    .replace(/azurefilm/gi, '')
    .replace(/3d\s*filament/gi, '')
    .replace(/filament/gi, '')
    .replace(/1\.75\s*mm/gi, '')
    .replace(/\d+\s*g\b/gi, '')
    .replace(/\d+g\b/gi, '')
    .replace(/refill/gi, '')
    .replace(/master\s*spool/gi, '')
    .replace(/–/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// NON-FILAMENT FILTER
// ============================================================================

const NON_FILAMENT_PATTERNS = [
  // Printer bed accessories
  /blue\s*tape/i,
  /kapton.*tape/i,
  /adhesive\s*tape/i,
  /pei\s*plate/i,
  /magnetic\s*platform/i,
  /glass\s*plate/i,
  /build\s*plate/i,
  /nozzle/i,
  /hotend/i,
  /extruder/i,
  /drill/i,
  /tool/i,
  /master\s*spool\s*only/i,
  /gift\s*card/i,
  /gift\b/i,
  /voucher/i,
  /3d\s*printer(?!\s*filament)/i,
  /scanner/i,
  /cleaning/i,
  /upgrade/i,
  /spare\s*part/i,
  /accessory/i,
  /drybox/i,
  /dry\s*box/i,
  
  // Unset placeholder products
  /^unset\s/i,
  /\bunset\b/i,
  
  // Bundle/Pack products (not individual spools)
  /super\s*pack/i,           // "SUPER PACK PLA MIX"
  /\b\d+[\s-]*pack\b/i,      // "10-pack", "3-pack", "4-pack"
  /multi[\s-]*pack/i,        // "multi-pack"
  /\+\s*(?:\d+x\s*)?master\s*spool/i, // Bundle with master spool
  
  // Magnets and other accessories
  /neodymium\s*magnet/i,
  /round\s*magnet/i,
  /\bmagnet\b/i,
];

export function isAzureFilmNonFilament(title: string): boolean {
  if (!title) return true;
  
  for (const pattern of NON_FILAMENT_PATTERNS) {
    if (pattern.test(title)) {
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// WEIGHT EXTRACTION
// ============================================================================

export function extractAzureFilmWeight(title: string, variant?: string): number {
  const text = `${title} ${variant || ''}`;
  
  // Check for pack counts FIRST (N-pack = N x 1kg spools)
  const packMatch = text.match(/(\d+)[\s-]*pack/i);
  if (packMatch) {
    const packCount = parseInt(packMatch[1], 10);
    return packCount * 1000; // Each spool is 1kg
  }
  
  // Check for "Sample" keyword - samples are typically 50g
  if (/\bsample\b/i.test(text)) {
    // Check if there's an explicit weight mentioned
    const explicitWeight = text.match(/(\d+)\s*g\b/i);
    if (explicitWeight) {
      return parseInt(explicitWeight[1], 10);
    }
    return 50; // Default sample weight
  }
  
  // Check for specific weights
  if (/50\s*g\b/i.test(text)) return 50;
  if (/100\s*g\b/i.test(text)) return 100;
  if (/250\s*g/i.test(text)) return 250;
  if (/500\s*g/i.test(text)) return 500;
  if (/750\s*g/i.test(text)) return 750;
  if (/2\s*kg|2000\s*g/i.test(text)) return 2000;
  if (/3\s*kg|3000\s*g/i.test(text)) return 3000;
  
  // Default to 1kg
  return 1000;
}

// ============================================================================
// REFILL DETECTION
// ============================================================================

export function isAzureFilmRefill(title: string): boolean {
  return /refill|spoolless|eco[\s-]*pack/i.test(title);
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface AzureFilmEnrichmentResult {
  material: string;
  materialCategory: string;
  finishType: FinishType;
  productLineId: string;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  tdsUrl: string | null;
  colorHex: string | null;
  cleanedTitle: string;
  spoolWeightGrams: number;
  diameterNominalMm: number;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
  highSpeedCapable: boolean;
  isFlexible: boolean;
  isRefill: boolean;
  isNonFilament: boolean;
}

export function enrichAzureFilmProduct(
  title: string,
  colorName?: string | null,
  variant?: string | null
): AzureFilmEnrichmentResult {
  // Check if non-filament first
  if (isAzureFilmNonFilament(title)) {
    return {
      material: 'Other',
      materialCategory: 'Accessory',
      finishType: 'Standard',
      productLineId: 'azurefilm__accessory',
      nozzleTempMin: null,
      nozzleTempMax: null,
      bedTempMin: null,
      bedTempMax: null,
      tdsUrl: null,
      colorHex: null,
      cleanedTitle: cleanAzureFilmTitle(title),
      spoolWeightGrams: 0,
      diameterNominalMm: 0,
      isAbrasive: false,
      requiresEnclosure: false,
      highSpeedCapable: false,
      isFlexible: false,
      isRefill: false,
      isNonFilament: true,
    };
  }
  
  const materialInfo = normalizeAzureFilmMaterial(title);
  const finishType = extractAzureFilmFinishType(title);
  const isHighSpeed = /hyper\s*speed|hs\b/i.test(title);
  const settings = getAzureFilmPrintSettings(materialInfo.normalized, isHighSpeed);
  const tdsUrl = getAzureFilmTdsUrl(materialInfo.normalized, finishType);
  const colorHex = colorName ? getAzureFilmColorHex(colorName) : null;
  const spoolWeight = extractAzureFilmWeight(title, variant || undefined);
  const isRefill = isAzureFilmRefill(title);
  
  return {
    material: materialInfo.normalized,
    materialCategory: materialInfo.category,
    finishType,
    productLineId: generateAzureFilmProductLineId(title, materialInfo.normalized),
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    tdsUrl,
    colorHex,
    cleanedTitle: cleanAzureFilmTitle(title),
    spoolWeightGrams: spoolWeight,
    diameterNominalMm: 1.75, // AzureFilm is 1.75mm only
    isAbrasive: materialInfo.isAbrasive || settings?.isAbrasive || false,
    requiresEnclosure: materialInfo.requiresEnclosure || settings?.requiresEnclosure || false,
    highSpeedCapable: materialInfo.isHighSpeed || settings?.highSpeedCapable || false,
    isFlexible: materialInfo.isFlexible || false,
    isRefill,
    isNonFilament: false,
  };
}

// ============================================================================
// STORE INFO
// ============================================================================

export const AZUREFILM_STORE_INFO = {
  vendor: 'AzureFilm',
  platform: 'woocommerce',
  baseUrl: 'https://azurefilm.com',
  productsUrl: 'https://azurefilm.com/3d-filaments/all-filaments/',
  currency: 'EUR',
  region: 'EU',
  defaultDiameter: 1.75,
  requiresCurrencyConversion: true,
  cloudflareProtected: true,
  firecrawlWaitTime: 3000,
  notes: 'Slovenian eco-friendly brand with Master Spool refill system',
};

// ============================================================================
// CATEGORY WHITELIST (For focused sync)
// ============================================================================

export interface AzureFilmCategoryConfig {
  material: string;
  categoryUrl: string;
  displayMaterial: string;
}

export const AZUREFILM_CATEGORY_WHITELIST: AzureFilmCategoryConfig[] = [
  { material: 'ABS', categoryUrl: 'https://azurefilm.com/product-category/3d-filaments/abs-filaments/', displayMaterial: 'ABS' },
  { material: 'ASA', categoryUrl: 'https://azurefilm.com/product-category/3d-filaments/asa-filaments/', displayMaterial: 'ASA' },
  { material: 'Carbon Fiber', categoryUrl: 'https://azurefilm.com/product-category/3d-filaments/carbon-fiber-filaments/', displayMaterial: 'Carbon Fiber' },
  { material: 'PCTG', categoryUrl: 'https://azurefilm.com/product-category/3d-filaments/pctg-filaments/', displayMaterial: 'PCTG' },
  { material: 'PETG', categoryUrl: 'https://azurefilm.com/product-category/3d-filaments/petg-filaments/', displayMaterial: 'PETG' },
  { material: 'PLA', categoryUrl: 'https://azurefilm.com/product-category/3d-filaments/pla-filaments/', displayMaterial: 'PLA' },
  { material: 'LumberLay', categoryUrl: 'https://azurefilm.com/product-category/3d-filaments/lumberlay-filaments/', displayMaterial: 'LumberLay (Wood)' },
  { material: 'Support', categoryUrl: 'https://azurefilm.com/product-category/3d-filaments/support-filaments/', displayMaterial: 'Support' },
];

// ============================================================================
// COLOR EXTRACTION FROM TITLE
// ============================================================================

export function extractColorFromAzureFilmTitle(title: string): string | null {
  if (!title) return null;
  
  // Common patterns in AzureFilm titles:
  // "PLA Original filament Black" -> "Black"
  // "PETG filament Sky Blue" -> "Sky Blue"
  // "PLA Silk filament Gold" -> "Gold"
  
  // Remove common prefixes
  let cleaned = title
    .replace(/azurefilm/gi, '')
    .replace(/filament/gi, '')
    .replace(/1\.75\s*mm/gi, '')
    .replace(/\d+\s*g\b/gi, '')
    .replace(/refill/gi, '')
    .replace(/master\s*spool/gi, '')
    .trim();
  
  // SPECIAL CASE: Handle "Glitter filament [Color]" pattern FIRST
  // Title: "ABS PLUS Glitter filament Black" → should return "Glitter Black", not "Black"
  const glitterFilamentMatch = cleaned.match(/\b(glitter)\s+filament\s+(black|silver|gold|blue|green|red|white)$/i);
  if (glitterFilamentMatch) {
    return `${glitterFilamentMatch[1]} ${glitterFilamentMatch[2]}`;
  }
  
  // Try to extract color from the end of the title (most common pattern)
  // CRITICAL: Effect/compound patterns MUST come first to capture "Glitter Black" before "Black"
  const colorPatterns = [
    // EFFECT + COLOR patterns (MUST be first - prioritized matching)
    /\b(glitter\s+(?:black|silver|gold|blue|green|red|white))$/i,
    /\b(tiger\s+(?:orange|black))$/i,
    /\b(shark\s+(?:grey|gray))$/i,
    /\b(litho\s+white)$/i,
    /\b(grass\s+green)$/i,
    /\b(lipstick\s+red)$/i,
    /\b(off[\s-]?white)$/i,
    
    // LumberLay two-word wood colors
    /\b(grey\s+oak|black\s+ebony|white\s+wood|green\s+poplar|olive\s+wood)$/i,
    
    // Two-word colors (existing)
    /\b(light\s+(?:blue|green|red|pink|grey|gray)|dark\s+(?:blue|green|red|brown|grey|gray)|sky\s+blue|ocean\s+blue|royal\s+blue|forest\s+green|mint\s+green|neon\s+(?:green|yellow|orange|pink|blue)|pastel\s+(?:pink|blue|green|yellow|purple|orange)|(?:green|white|olive)\s+(?:poplar|wood)|gold\s+(?:18k|24k))$/i,
    
    // Single word colors at end (LAST - fallback)
    /\b(black|white|red|blue|green|yellow|orange|purple|pink|grey|gray|brown|gold|silver|bronze|copper|natural|transparent|translucent|clear|cream|ivory|charcoal|turquoise|teal|cyan|violet|lavender|magenta|coral|navy|beige|maroon|burgundy|cherry|walnut|oak|bamboo|rainbow|sunset|galaxy)$/i,
  ];
  
  for (const pattern of colorPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // Fallback: check if last word is a known color
  const words = cleaned.split(/\s+/);
  const lastWord = words[words.length - 1]?.toLowerCase();
  if (lastWord && AZUREFILM_COLOR_MAPPING[lastWord]) {
    return words[words.length - 1];
  }
  
  // Check last two words
  if (words.length >= 2) {
    const lastTwo = `${words[words.length - 2]} ${words[words.length - 1]}`.toLowerCase();
    if (AZUREFILM_COLOR_MAPPING[lastTwo]) {
      return `${words[words.length - 2]} ${words[words.length - 1]}`;
    }
  }
  
  return null;
}

// ============================================================================
// SAFE DELETE THRESHOLD
// ============================================================================

export const AZUREFILM_SAFE_DELETE_THRESHOLD = 50; // Minimum products required before clean slate delete
