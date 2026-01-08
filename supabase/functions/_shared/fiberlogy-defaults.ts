/**
 * FIBERLOGY-SPECIFIC DEFAULTS
 * 
 * Brand-specific configuration for Fiberlogy filament products.
 * Fiberlogy is a Polish manufacturer using ShopArena platform.
 */

// TDS URL PATTERNS - Map materials to TDS PDF URLs
export const FIBERLOGY_TDS_PATTERNS: Record<string, string> = {
  // Easy series
  'EASY PLA': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_EASY_PLA_TDS.pdf',
  'EASY PETG': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_EASY_PETG_TDS.pdf',
  'EASY ABS': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_EASY_ABS_TDS.pdf',
  
  // Standard series
  'ABS': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_ABS_TDS.pdf',
  'ABS PLUS': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_ABS_PLUS_TDS.pdf',
  'PETG': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_PETG_TDS.pdf',
  'PLA': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_PLA_TDS.pdf',
  
  // Effect series
  'FIBERSILK': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_FIBERSILK_TDS.pdf',
  'FIBERSATIN': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_FIBERSATIN_TDS.pdf',
  'MATTE PLA': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_MATTE_PLA_TDS.pdf',
  
  // Flexible series
  'FIBERFLEX 30D': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_FIBERFLEX_30D_TDS.pdf',
  'FIBERFLEX 40D': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_FIBERFLEX_40D_TDS.pdf',
  'FIBERFLEX CF': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_FIBERFLEX_CF_TDS.pdf',
  
  // Engineering
  'ASA': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_ASA_TDS.pdf',
  'PA12': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_PA12_TDS.pdf',
  'PA12+CF15': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_PA12_CF15_TDS.pdf',
  'ABS+GF': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_ABS_GF_TDS.pdf',
  'PCTG': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_PCTG_TDS.pdf',
  'PP': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_PP_TDS.pdf',
  'CPE': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_CPE_TDS.pdf',
  'CPE HT': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_CPE_HT_TDS.pdf',
  'HIPS': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_HIPS_TDS.pdf',
  'PETG+PTFE': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_PETG_PTFE_TDS.pdf',
  
  // Specialty
  'BVOH': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_BVOH_TDS.pdf',
  'FIBERSMOOTH': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_FIBERSMOOTH_TDS.pdf',
};

export function matchFiberlogyTds(title: string): { url: string; pattern: string } | null {
  if (!title) return null;
  const normalizedTitle = title.toUpperCase();
  const sorted = Object.entries(FIBERLOGY_TDS_PATTERNS).sort((a, b) => b[0].length - a[0].length);
  for (const [pattern, url] of sorted) {
    if (normalizedTitle.includes(pattern)) return { url, pattern };
  }
  return null;
}

// PRINT SETTINGS
export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
}

export const FIBERLOGY_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Easy series - optimized for beginners
  'PLA': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'EASY PLA': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'EASY PLA HS': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 50, bedTempMax: 60, printSpeedMax: 300 },
  'PETG': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 90 },
  'EASY PETG': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 90 },
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 95, bedTempMax: 110, requiresEnclosure: true },
  'EASY ABS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 95, bedTempMax: 110, requiresEnclosure: true },
  'ABS+': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true },
  
  // Effect PLA
  'FIBERSILK': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'FIBERSATIN': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'MATTE PLA': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  
  // Flexible
  'TPU-30D': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 40 },
  'TPU-40D': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 40 },
  'FIBERFLEX 30D': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 40 },
  'FIBERFLEX 40D': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 40 },
  'FIBERFLEX CF': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 40, bedTempMax: 60, isAbrasive: true },
  
  // Engineering
  'ASA': { nozzleTempMin: 235, nozzleTempMax: 255, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'PA12': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 90 },
  'PA12-CF': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 70, bedTempMax: 90, isAbrasive: true },
  'ABS-GF': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'PCTG': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 90 },
  'PP': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 80, bedTempMax: 100 },
  'CPE': { nozzleTempMin: 255, nozzleTempMax: 275, bedTempMin: 80, bedTempMax: 100 },
  'CPE HT': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 80, bedTempMax: 100 },
  'HIPS': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110 },
  'PETG-PTFE': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 90 },
  
  // Specialty
  'BVOH': { nozzleTempMin: 190, nozzleTempMax: 210, bedTempMin: 50, bedTempMax: 60 },
  'PVB': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 70 },
};

export function getFiberlogyPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  const normalized = material.toUpperCase().replace(/-/g, ' ').replace(/\+/g, ' ').trim();
  
  // Direct match
  if (FIBERLOGY_PRINT_SETTINGS[normalized]) {
    return FIBERLOGY_PRINT_SETTINGS[normalized];
  }
  
  // Try without "EASY" prefix
  const withoutEasy = normalized.replace(/^EASY\s+/, '');
  if (FIBERLOGY_PRINT_SETTINGS[withoutEasy]) {
    return FIBERLOGY_PRINT_SETTINGS[withoutEasy];
  }
  
  // Try base material
  for (const [key, settings] of Object.entries(FIBERLOGY_PRINT_SETTINGS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return settings;
    }
  }
  
  return null;
}

// FINISH TYPE EXTRACTION
export type FinishType = 'Silk' | 'Satin' | 'Matte' | 'Smooth' | 'Standard';

const FIBERLOGY_FINISH_PATTERNS: Array<{ pattern: RegExp; finish: FinishType }> = [
  { pattern: /\bfibersilk\b/i, finish: 'Silk' },
  { pattern: /\bsilk\b/i, finish: 'Silk' },
  { pattern: /\bfibersatin\b/i, finish: 'Satin' },
  { pattern: /\bsatin\b/i, finish: 'Satin' },
  { pattern: /\bmatte\b/i, finish: 'Matte' },
  { pattern: /\bfibersmooth\b/i, finish: 'Smooth' },
  { pattern: /\bsmooth\b/i, finish: 'Smooth' },
];

export function extractFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  for (const { pattern, finish } of FIBERLOGY_FINISH_PATTERNS) {
    if (pattern.test(title)) return finish;
  }
  return 'Standard';
}

// MATERIAL NORMALIZATION
export const FIBERLOGY_MATERIAL_MAPPING: Record<string, string> = {
  // Easy series
  'easy pla': 'PLA',
  'easy petg': 'PETG',
  'easy abs': 'ABS',
  'easy pla hs': 'PLA',
  
  // Standard
  'pla': 'PLA',
  'petg': 'PETG',
  'abs': 'ABS',
  'abs plus': 'ABS+',
  'abs+': 'ABS+',
  
  // Effect
  'fibersilk': 'PLA',
  'fibersatin': 'PLA',
  'matte pla': 'PLA',
  'fibersmooth': 'PVB',
  'fiberwood': 'PLA-Wood',
  'wood': 'PLA-Wood',
  
  // Flexible
  'fiberflex 30d': 'TPU-30D',
  'fiberflex 40d': 'TPU-40D',
  'fiberflex cf': 'TPU-CF',
  'mattflex 40d': 'TPU-40D',
  'tpu 30d': 'TPU-30D',
  'tpu 40d': 'TPU-40D',
  
  // Engineering
  'asa': 'ASA',
  'nylon pa12': 'PA12',
  'pa12': 'PA12',
  'pa12+cf15': 'PA12-CF',
  'pa12 cf15': 'PA12-CF',
  'abs+gf': 'ABS-GF',
  'abs gf': 'ABS-GF',
  'pctg': 'PCTG',
  'pp': 'PP',
  'polypropylene': 'PP',
  'cpe': 'CPE',
  'cpe ht': 'CPE-HT',
  'cpe antibac': 'CPE',
  'hips': 'HIPS',
  'petg+ptfe': 'PETG-PTFE',
  'petg ptfe': 'PETG-PTFE',
  
  // Soluble
  'bvoh': 'BVOH',
  'pvb': 'PVB',
};

export function normalizeFiberlogyMaterial(title: string): string | null {
  if (!title) return null;
  const cleaned = title.toLowerCase()
    .replace(/filament/gi, '')
    .replace(/\d+\.?\d*\s*(mm|kg|g)\b/gi, '')
    .replace(/refill/gi, '')
    .replace(/old.?type.?spool/gi, '')
    .trim();
  
  // Try direct mapping
  for (const [pattern, material] of Object.entries(FIBERLOGY_MATERIAL_MAPPING)) {
    if (cleaned.includes(pattern)) {
      return material;
    }
  }
  
  // Fallback patterns
  if (/petg/i.test(cleaned)) return 'PETG';
  if (/pla/i.test(cleaned)) return 'PLA';
  if (/abs/i.test(cleaned)) return 'ABS';
  if (/tpu|flex/i.test(cleaned)) return 'TPU';
  if (/asa/i.test(cleaned)) return 'ASA';
  if (/pa|nylon/i.test(cleaned)) return 'PA';
  
  return null;
}

// TITLE CLEANING
const FIBERLOGY_TITLE_NOISE: RegExp[] = [
  /\bfiberlogy\b/gi,
  /\bfilament\b/gi,
  /\b1\.75\s*mm\b/gi,
  /\b2\.85\s*mm\b/gi,
  /\b0\.5\s*kg\b/gi,
  /\b0\.75\s*kg\b/gi,
  /\b0\.85\s*kg\b/gi,
  /\b2\.5\s*kg\b/gi,
  /\b850\s*g\b/gi,
  /\bold.?type\s*spool\b/gi,
  /\brefill\b/gi,
  /\bcmyk\s*set\b/gi,
  /\bstarter\s*kit\b/gi,
];

export function cleanFiberlogyTitle(title: string): string {
  if (!title) return '';
  let cleaned = title;
  for (const pattern of FIBERLOGY_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned.replace(/\s+/g, ' ').replace(/^[\s\-–—]+|[\s\-–—]+$/g, '').trim();
}

// VARIANT DETECTION
export function isRefillVariant(title: string): boolean {
  return /\brefill\b/i.test(title);
}

export function isDiameter285(title: string): boolean {
  return /\b2\.85\s*mm\b/i.test(title);
}

export function getWeightVariant(title: string): string | null {
  if (/\b2\.5\s*kg\b/i.test(title)) return '2.5kg';
  if (/\b0\.5\s*kg\b/i.test(title)) return '0.5kg';
  if (/\b0\.75\s*kg\b/i.test(title)) return '0.75kg';
  return null; // Standard 0.85kg
}

export function isCmykSet(title: string): boolean {
  return /\bcmyk/i.test(title);
}

// PRODUCT LINE ID GENERATION
export function generateFiberlogyProductLineId(title: string, material?: string | null): string {
  const mat = material || normalizeFiberlogyMaterial(title) || 'unknown';
  const finish = extractFinishType(title);
  const isRefill = isRefillVariant(title);
  const is285 = isDiameter285(title);
  const weight = getWeightVariant(title);
  const isCmyk = isCmykSet(title);
  
  let suffix = '';
  
  // Determine base product type - order matters for specificity!
  // ABS Plus must be checked BEFORE ABS
  if (/abs\s*plus/i.test(title)) {
    suffix = 'plus';
  } else if (/fiberwood/i.test(title)) {
    suffix = 'standard';
    // Material already set to PLA-Wood by normalizeFiberlogyMaterial
  } else if (/fibersilk/i.test(title)) {
    suffix = 'silk';
  } else if (/fibersatin/i.test(title)) {
    suffix = 'satin';
  } else if (/fibersmooth/i.test(title)) {
    suffix = 'smooth';
  } else if (/mattflex/i.test(title)) {
    suffix = 'matte';
  } else if (/matte/i.test(title)) {
    suffix = 'matte';
  } else if (/easy/i.test(title)) {
    suffix = 'easy';
  } else {
    suffix = 'standard';
  }
  
  // Handle high-speed variants
  if (/\bhs\b/i.test(title) || /high\s*speed/i.test(title)) {
    suffix += '-hs';
  }
  
  // Handle special variants
  if (isCmyk) {
    suffix += '-cmyk';
  }
  if (is285) {
    suffix += '-2.85mm';
  }
  if (weight) {
    suffix += `-${weight}`;
  }
  if (isRefill) {
    suffix += '-refill';
  }
  
  return `fiberlogy__${mat.toLowerCase().replace(/[^a-z0-9]/g, '-')}__${suffix}`;
}

// COLOR MAPPING - Extended for CSV seed
export const FIBERLOGY_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'white': 'FFFFFF',
  'pure white': 'FFFFFF',
  'lithophane white': 'FAFAFA',
  'black': '1A1A1A',
  'graphite': '4A4A4A',
  'gray': '808080',
  'grey': '808080',
  'silver': 'C0C0C0',
  'beige': 'F5DEB3',
  'brown': '8B4513',
  'natural': 'F5E6D3',
  
  // Reds/Oranges
  'red': 'E41E26',
  'ruby red': 'B01D27',
  'burgundy': '722F37',
  'scarlet': 'FF2400',
  'carmine': '960018',
  'orange': 'FF6B00',
  'red orange': 'FF4500',
  'brick': 'A52A2A',
  
  // Blues
  'blue': '0066CC',
  'true blue': '0039A6',
  'navy blue': '000080',
  'spectra blue': '4169E1',
  'light blue': 'ADD8E6',
  'cyan': '00FFFF',
  'steel blue': '4682B4',
  'turquoise': '40E0D0',
  
  // Greens
  'green': '228B22',
  'light green': '90EE90',
  'alien green': '7CFC00',
  'olive green': '808000',
  'irish green': '009A49',
  'army green': '4B5320',
  'sage green': '9DC183',
  'vertigo': '006400',
  
  // Yellows/Golds
  'yellow': 'FFD700',
  'gold': 'FFD700',
  'true gold': 'D4AF37',
  'brass': 'B5A642',
  'khaki': 'C3B091',
  
  // Purples/Pinks
  'purple': '800080',
  'pink': 'FFC0CB',
  'candy': 'FF66B2',
  'magenta': 'FF00FF',
  
  // Special effects
  'inox': 'B4B4B4',
  'onyx': '353839',
  'onyx gold': '4A4A2A',
  'anthracite': '293133',
  'pearl': 'F0EAD6',
  'midnight sky': '191970',
  'aurora': '00CED1',
  
  // Pastels
  'pastel blue': 'AEC6CF',
  'pastel pink': 'FFD1DC',
  'pastel mint': '98FF98',
  'pastel lilac': 'C8A2C8',
  'pastel yellow': 'FDFD96',
  
  // Neons
  'neon green': '39FF14',
  'neon orange': 'FF6600',
  'neon yellow': 'CCFF00',
  
  // Skin tones
  'skin tone 1': 'F5CBA7',
  'skin tone 2': 'D4A574',
  'skin tone 3': '8D5524',
  'skintone #1': 'F5CBA7',
  'skintone #2': 'D4A574',
  'skintone #3': '8D5524',
  
  // Natural/Special
  'granite': '676767',
  'sandstone': 'C2B280',
  'wood': '8B4513',
  'copper': 'B87333',
  'bronze': 'CD7F32',
  
  // Transparent variants (with alpha suffix for visual distinction)
  'pure transparent': 'FEFEFE',
  'transparent': 'FEFEFE',
  'burgundy transparent': '722F37',
  'orange transparent': 'FF6B00',
  'light green transparent': '90EE90',
  'bottle green transparent': '006A4E',
  'navy blue transparent': '000080',
  'blue transparent': '0066CC',
};

export function getFiberlogyColorHex(colorName: string): string | null {
  if (!colorName) return null;
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (FIBERLOGY_COLOR_MAPPING[normalized]) {
    return FIBERLOGY_COLOR_MAPPING[normalized];
  }
  
  // Partial match
  for (const [name, hex] of Object.entries(FIBERLOGY_COLOR_MAPPING)) {
    if (normalized.includes(name) || name.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

// MAIN ENRICHMENT
export interface FiberlogyEnrichmentResult {
  tdsUrl: string | null;
  finishType: FinishType;
  material: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  productLineId: string;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
}

export function enrichFiberlogyProduct(
  title: string,
  existingMaterial?: string | null,
  existingTdsUrl?: string | null
): FiberlogyEnrichmentResult {
  const material = existingMaterial || normalizeFiberlogyMaterial(title);
  const settings = getFiberlogyPrintSettings(material);
  const tds = existingTdsUrl ? null : matchFiberlogyTds(title);
  
  return {
    tdsUrl: existingTdsUrl || tds?.url || null,
    finishType: extractFinishType(title),
    material,
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    productLineId: generateFiberlogyProductLineId(title, material),
    isAbrasive: settings?.isAbrasive || false,
    requiresEnclosure: settings?.requiresEnclosure || false,
  };
}
