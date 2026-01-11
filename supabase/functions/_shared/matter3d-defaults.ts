/**
 * MATTER3D-SPECIFIC DEFAULTS
 * Canadian manufacturer with Bambu-focused product line
 * Unique "Color / Size / Spool" variant structure
 */

// PRINT SETTINGS BY PRODUCT LINE
export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
  dryingTempC?: number;
  dryingTimeHours?: number;
}

export const MATTER3D_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Basics Series PLA
  'PLA': { nozzleTempMin: 200, nozzleTempMax: 225, bedTempMin: 40, bedTempMax: 65, dryingTempC: 45, dryingTimeHours: 4 },
  'PLA-MATTE': { nozzleTempMin: 200, nozzleTempMax: 225, bedTempMin: 40, bedTempMax: 65, dryingTempC: 45, dryingTimeHours: 4 },
  'PLA-SILK': { nozzleTempMin: 200, nozzleTempMax: 225, bedTempMin: 40, bedTempMax: 65, dryingTempC: 45, dryingTimeHours: 4 },
  'PLA-CF': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 70, isAbrasive: true, dryingTempC: 45, dryingTimeHours: 4 },
  
  // Performance PLA (higher HDT)
  'PLA+': { nozzleTempMin: 200, nozzleTempMax: 225, bedTempMin: 40, bedTempMax: 65, dryingTempC: 45, dryingTimeHours: 4 },
  
  // PETG variants
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 60, bedTempMax: 80, dryingTempC: 65, dryingTimeHours: 4 },
  'PETG-MATTE': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 60, bedTempMax: 80, dryingTempC: 65, dryingTimeHours: 4 },
  'PETG-CF': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 85, isAbrasive: true, dryingTempC: 65, dryingTimeHours: 4 },
  
  // ASA
  'ASA': { nozzleTempMin: 235, nozzleTempMax: 255, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, dryingTempC: 80, dryingTimeHours: 4 },
  
  // ABS variants
  'ABS': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true, dryingTempC: 80, dryingTimeHours: 4 },
  'ABS-MATTE': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true, dryingTempC: 80, dryingTimeHours: 4 },
  'ABS-CF': { nozzleTempMin: 245, nozzleTempMax: 265, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true, dryingTempC: 80, dryingTimeHours: 4 },
  
  // Nylon variants
  'PA': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 90, requiresEnclosure: true, dryingTempC: 80, dryingTimeHours: 8 },
  'PA-CF': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 70, bedTempMax: 90, requiresEnclosure: true, isAbrasive: true, dryingTempC: 80, dryingTimeHours: 8 },
  
  // TPU
  'TPU-95A': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 40, dryingTempC: 50, dryingTimeHours: 4 },
};

// MATERIAL NORMALIZATION
export const MATTER3D_MATERIAL_MAPPING: Record<string, string> = {
  'basics series pla': 'PLA',
  'basics pla': 'PLA',
  'pla basics': 'PLA',
  'essentials pla': 'PLA',
  'performance pla': 'PLA+',
  'performance series pla': 'PLA+',
  'pla matte': 'PLA',
  'matte pla': 'PLA',
  'silk pla': 'PLA',
  'pla silk': 'PLA',
  'glitter pla': 'PLA',
  'pla glitter': 'PLA',
  'recycled pla': 'PLA',
  'pla recycled': 'PLA',
  'pla carbon fiber': 'PLA-CF',
  'carbon fiber pla': 'PLA-CF',
  'pla cf': 'PLA-CF',
  
  'performance petg': 'PETG',
  'petg hf': 'PETG',
  'petg high flow': 'PETG',
  'high flow petg': 'PETG',
  'petg matte': 'PETG',
  'matte petg': 'PETG',
  'petg carbon fiber': 'PETG-CF',
  'carbon fiber petg': 'PETG-CF',
  'petg cf': 'PETG-CF',
  
  'performance asa': 'ASA',
  'asa': 'ASA',
  
  'performance abs': 'ABS',
  'abs matte': 'ABS',
  'matte abs': 'ABS',
  'abs carbon fiber': 'ABS-CF',
  'carbon fiber abs': 'ABS-CF',
  'abs cf': 'ABS-CF',
  
  'nylon carbon fiber': 'PA-CF',
  'nylon cf': 'PA-CF',
  'pa carbon fiber': 'PA-CF',
  'pa-cf': 'PA-CF',
  'performance nylon carbon fiber': 'PA-CF',
  'nylon unfilled': 'PA',
  'performance nylon': 'PA',
  'pa unfilled': 'PA',
  
  'tpu 95a': 'TPU-95A',
  'performance tpu': 'TPU-95A',
  'tpu': 'TPU-95A',
};

export function normalizeMatter3dMaterial(title: string): string | null {
  if (!title) return null;
  const t = title.toLowerCase();
  
  // Check mapping first
  for (const [pattern, material] of Object.entries(MATTER3D_MATERIAL_MAPPING)) {
    if (t.includes(pattern)) return material;
  }
  
  // Carbon fiber detection (order matters - check CF first)
  if (/carbon\s*fiber|cf/i.test(t)) {
    if (/petg/i.test(t)) return 'PETG-CF';
    if (/abs/i.test(t)) return 'ABS-CF';
    if (/nylon|pa/i.test(t)) return 'PA-CF';
    if (/pla/i.test(t)) return 'PLA-CF';
  }
  
  // Standard materials
  if (/petg/i.test(t)) return 'PETG';
  if (/pla/i.test(t)) return 'PLA';
  if (/asa/i.test(t)) return 'ASA';
  if (/abs/i.test(t)) return 'ABS';
  if (/nylon|pa(?![a-z])/i.test(t)) return 'PA';
  if (/tpu/i.test(t)) return 'TPU-95A';
  
  return null;
}

// FINISH TYPE DETECTION
export type FinishType = 'Matte' | 'Silk' | 'Carbon' | 'Recycled' | 'Standard';

export function extractFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  const t = title.toLowerCase();
  
  if (/\bmatte\b/i.test(t)) return 'Matte';
  if (/\bsilk\b|\bglitter\b|\bmetallic/i.test(t)) return 'Silk';
  if (/carbon\s*fiber|\bcf\b/i.test(t)) return 'Carbon';
  if (/\brecycled\b/i.test(t)) return 'Recycled';
  
  return 'Standard';
}

// HIGH FLOW / HIGH SPEED DETECTION
export function isHighFlowVariant(title: string): boolean {
  if (!title) return false;
  return /\bhf\b|high\s*flow/i.test(title);
}

// TITLE CLEANING
export const MATTER3D_TITLE_NOISE: RegExp[] = [
  /bambu\s*ams\s*compatible/gi,
  /bambu\s*compatible/gi,
  /ams\s*compatible/gi,
  /matter3d\s*inc\.?/gi,
  /matter3d/gi,
  /1\s*kg/gi,
  /5\s*kg/gi,
  /3\s*kg/gi,
  /\d+\s*kg/gi,
  /1\.75\s*mm/gi,
  /2\.85\s*mm/gi,
  /holiday\s*sale/gi,
  /sale/gi,
  /new!/gi,
  /\(cardboard\s*spool\)/gi,
  /\(plastic\s*spool\)/gi,
  /cardboard\s*spool/gi,
  /plastic\s*spool/gi,
  /3d\s*printing\s*filament/gi,
  /3d\s*printer\s*filament/gi,
  /filament/gi,
];

export function cleanMatter3dTitle(title: string): string {
  if (!title) return '';
  let cleaned = title;
  
  for (const pattern of MATTER3D_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  return cleaned.replace(/\s+/g, ' ').replace(/\s*-\s*-\s*/g, ' - ').trim();
}

// VARIANT DETECTION FUNCTIONS
export function isMatteVariant(title: string): boolean {
  return /\bmatte\b/i.test(title);
}

export function isSilkVariant(title: string): boolean {
  return /\bsilk\b|\bglitter\b|\bmetallic/i.test(title);
}

export function isCarbonFiberVariant(title: string): boolean {
  return /carbon\s*fiber|\bcf\b/i.test(title);
}

export function isRecycledVariant(title: string): boolean {
  return /\brecycled\b/i.test(title);
}

export function isBulkVariant(title: string): boolean {
  return /5\s*kg|bulk|3\s*kg/i.test(title);
}

export function isEssentialsVariant(title: string): boolean {
  return /\bessentials?\b/i.test(title);
}

export function isPerformanceVariant(title: string): boolean {
  return /\bperformance\b/i.test(title);
}

export function isBasicsVariant(title: string): boolean {
  return /\bbasics?\b/i.test(title);
}

// EXTRACT WEIGHT FROM TITLE
export function extractWeightKg(title: string): number {
  if (!title) return 1;
  
  const match = title.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (match) {
    return parseFloat(match[1]);
  }
  
  return 1; // Default 1kg
}

// SPOOL TYPE DETECTION
export function extractSpoolType(variantTitle: string): 'cardboard' | 'plastic' | null {
  if (!variantTitle) return null;
  const t = variantTitle.toLowerCase();
  
  if (/cardboard/i.test(t)) return 'cardboard';
  if (/plastic/i.test(t)) return 'plastic';
  
  return null;
}

// PRODUCT LINE ID GENERATION
// Consolidate ALL weight variants (500g, 1kg, 5kg) into single product lines
// NO weight suffixes - weights are merged together
export function generateMatter3dProductLineId(title: string, material?: string | null): string {
  const mat = material || normalizeMatter3dMaterial(title) || 'unknown';
  const matLower = mat.toLowerCase().replace(/-/g, '_');
  const finish = extractFinishType(title);
  const isEssentials = isEssentialsVariant(title);
  const isPerformance = isPerformanceVariant(title);
  const isBasics = isBasicsVariant(title);
  const isRecycled = isRecycledVariant(title);
  const isHF = isHighFlowVariant(title);
  
  // Build product line ID
  let lineId = `matter3d__${matLower}`;
  
  // Add series suffix (mutually exclusive)
  if (isEssentials) {
    lineId += '__essentials';
  } else if (isPerformance) {
    lineId += '__performance';
  } else if (isBasics) {
    lineId += '__basics';
  } else {
    lineId += '__standard';
  }
  
  // Add finish suffix
  if (finish === 'Matte') {
    lineId += '-matte';
  } else if (finish === 'Silk') {
    lineId += '-silk';
  } else if (finish === 'Carbon') {
    lineId += '-cf';
  } else if (isRecycled) {
    lineId += '-recycled';
  }
  
  // Add high-flow suffix
  if (isHF) {
    lineId += '-hf';
  }
  
  // NO WEIGHT SUFFIXES - all weights (500g, 1kg, 5kg) merge into same product line
  // This consolidates all weight variants together for proper grouping
  
  return lineId;
}

// COLOR MAPPING - Comprehensive with unique hex codes to prevent duplicates
export const MATTER3D_COLOR_MAPPING: Record<string, string> = {
  // Whites
  'white': 'FFFFFF',
  'snow white': 'FFFAFA',
  'egg shell white': 'F0EAD6',
  'eggshell white': 'F0EAD6',
  'bone white': 'F9F6EE',
  'cream': 'FFFDD0',
  
  // Matte Whites
  'matte white': 'F5F5F5',
  
  // Blacks
  'black': '000000',
  'jet black': '0A0A0A',
  
  // Matte Blacks
  'matte black': '1A1A1A',
  
  // Greys/Grays
  'grey': '808080',
  'gray': '808080',
  'light grey': 'C0C0C0',
  'light gray': 'C0C0C0',
  'slate grey': '708090',
  'slate gray': '708090',
  'steel wool': 'B0B0B0',
  'gunmetal grey': '2C3539',
  'gunmetal gray': '2C3539',
  'charcoal': '36454F',
  'silver': 'C0C0C0',
  'dark grey': '4A4A4A',
  'dark gray': '4A4A4A',
  
  // Matte Greys
  'matte grey': '6B6B6B',
  'matte gray': '6B6B6B',
  'matte charcoal': '3A3A3A',
  'matte gunmetal grey': '2A3439',
  'matte gunmetal gray': '2A3439',
  
  // Blues
  'blue': '0066CC',
  'fighter jet blue': '1E3A5F',
  'ocean blue': '006994',
  'cayman blue': '00C5CD',
  'sky blue': '87CEEB',
  'industrial blue': '4B6587',
  'navy': '000080',
  'navy blue': '000080',
  'light blue': 'ADD8E6',
  'royal blue': '4169E1',
  'electric blue': '7DF9FF',
  'cobalt blue': '0047AB',
  'dark blue': '00008B',
  'ice blue': 'B0E0E6',
  'teal blue': '367588',
  
  // Matte Blues
  'matte blue': '1E3A5F',
  'matte navy': '1A1A40',
  'matte navy blue': '1A1A40',
  'matte sky blue': '6B8BA4',
  
  // Greens
  'green': '00AA00',
  'grass green': '7CFC00',
  'evergreen': '05472A',
  'dark green': '013220',
  'dark/forest green': '228B22',
  'forest green': '228B22',
  'neon green': '39FF14',
  'lime green': '32CD32',
  'lime': '00FF00',
  'olive': '808000',
  'mint green': '98FB98',
  'teal': '008080',
  'sage green': '9DC183',
  'hunter green': '355E3B',
  
  // Matte Greens
  'matte green': '228B22',
  'matte forest green': '1E5631',
  'matte olive': '6B6B00',
  
  // Reds
  'red': 'CC0000',
  'wine red': '722F37',
  'clay red': 'B66A50',
  'brick red': 'CB4154',
  'burgundy': '800020',
  'maroon': '800000',
  'crimson': 'DC143C',
  'dark red': '8B0000',
  'rust red': 'B7410E',
  'fire red': 'FF4500',
  
  // Matte Reds
  'matte red': 'B22222',
  'matte wine red': '5A2129',
  'matte burgundy': '641C34',
  
  // Pinks - UNIQUE hex values to prevent duplicates
  'pink': 'FFC0CB',
  'light pink': 'FFB6C1',
  'bubblegum pink': 'FF69B4',
  'fuchsia': 'FF00FF',        // Pure magenta/fuchsia
  'magenta': 'FF0099',        // Slightly redder (unique from fuchsia)
  'fuchsia/magenta': 'FF00CC', // Blend for combined variants (unique)
  'hot pink': 'FF69B4',
  'salmon': 'FA8072',
  'rose': 'FF007F',
  'coral pink': 'F88379',
  
  // Matte Pinks
  'matte pink': 'FFB6C1',
  'matte rose': 'B76E79',
  
  // Oranges
  'orange': 'FF8C00',
  'safety orange': 'FF6700',
  'burnt orange': 'CC5500',
  'coral': 'FF7F50',
  'peach': 'FFCBA4',
  'tangerine': 'FF9966',
  'fire orange': 'FF4D00',
  
  // Matte Oranges
  'matte orange': 'CC5500',
  'matte burnt orange': 'B54E00',
  
  // Yellows
  'yellow': 'FFD700',
  'sunshine yellow': 'FFFD37',
  'caterpillar yellow': 'FEDF00',
  'gold': 'FFD700',
  'mustard': 'FFDB58',
  'lemon': 'FFF44F',
  'lemon yellow': 'FFF44F',
  'banana yellow': 'FFE135',
  
  // Matte Yellows
  'matte yellow': 'F0C420',
  'matte gold': 'CFB53B',
  
  // Browns
  'brown': '8B4513',
  'chocolate brown': '3D1C02',
  'mocha brown': '967969',
  'sandstone': 'C2B280',
  'khaki': 'C3B091',
  'desert tan': 'C19A6B',
  'wood': 'DEB887',
  'natural': 'DEB887',
  'beige': 'F5F5DC',
  'tan': 'D2B48C',
  'coffee': '6F4E37',
  
  // Matte Browns
  'matte brown': '6B4423',
  
  // Purples
  'purple': '800080',
  'royal purple': '7851A9',
  'grape drink purple': '6F2DA8',
  'lavender': 'E6E6FA',
  'violet': 'EE82EE',
  'dark purple': '301934',
  'plum': 'DDA0DD',
  
  // Matte Purples
  'matte purple': '5C2D73',
  'matte violet': '8B668B',
  'matte lavender': 'B0A4C8',
  
  // Aquas/Teals
  'aqua': '00FFFF',
  'turquoise': '40E0D0',
  'cyan': '00FFFF',
  'seafoam': '93E9BE',
  
  // Matte Aquas
  'matte teal': '006666',
  'matte turquoise': '2E8B8B',
  
  // Transparency
  'transparent': 'FFFFFF',
  'transparent / natural': 'DEB887',
  'transparent/natural': 'DEB887',
  'clear': 'FFFFFF',
  'natural clear': 'F5F5DC',
  'translucent': 'FFFFFF',
  
  // Additional specialty colors with slashes
  'clay/brick red': 'CB4154',
  
  // Carbon Fiber colors (typically black/grey)
  'carbon': '2F2F2F',
  'carbon black': '1C1C1C',
  'carbon fiber': '2F2F2F',
  
  // Silk/Metallic specialty colors (from logs with missing hex)
  'silk purple': '8E4585',
  'metallic (silk) blue': '4A90D9',
  'metallic (silk) orange': 'CD7F32',
  'metallic blue': '4A90D9',
  'metallic orange': 'CD7F32',
  'silk blue': '4A90D9',
  'silk orange': 'CD7F32',
  'silk red': 'B22222',
  'silk green': '228B22',
  'silk gold': 'CFB53B',
  'silk silver': 'C0C0C0',
  'silk copper': 'B87333',
  
  // Additional matte colors
  'matte natural': 'DEB887',
  'matte sand': 'C2B280',
  'matte beige': 'F5F5DC',
  
  // Essentials/Performance specialty colors
  'deep black': '0F0F0F',
  'pure white': 'FEFEFE',
  'signal red': 'E52B50',
  'ocean teal': '0077BE',
  'forest': '228B22',
  'midnight': '191970',
  'arctic white': 'F0F8FF',
  'jet': '0A0A0A',
  'slate': '708090',
  'graphite': '383838',
  'onyx': '0F0F0F',
  'pearl': 'FDEEF4',
  'ivory': 'FFFFF0',
  'storm grey': '717D7E',
  'storm gray': '717D7E',
};

export function getMatter3dColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (MATTER3D_COLOR_MAPPING[normalized]) {
    return MATTER3D_COLOR_MAPPING[normalized];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(MATTER3D_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

// FILAMENT PRODUCT FILTER
export function isFilamentProduct(title: string, productType?: string): boolean {
  if (!title) return false;
  const t = title.toLowerCase();
  
  // Include filament products
  const filamentKeywords = ['pla', 'petg', 'abs', 'asa', 'tpu', 'nylon', 'pa-cf', 'filament'];
  const isFilament = filamentKeywords.some(kw => t.includes(kw));
  
  // Exclude accessories
  const excludeKeywords = ['nozzle', 'bed', 'plate', 'hotend', 'extruder', 'profile', 'dryer', 'accessory', 'tool'];
  const isExcluded = excludeKeywords.some(kw => t.includes(kw));
  
  return isFilament && !isExcluded;
}

// PARSE VARIANT TITLE (Color / Size / Spool pattern)
export function parseVariantTitle(variantTitle: string): { color: string | null; size: string | null; spool: string | null } {
  if (!variantTitle) return { color: null, size: null, spool: null };
  
  const parts = variantTitle.split('/').map(p => p.trim());
  
  // Typical pattern: "Color / Size / Spool Type"
  if (parts.length >= 3) {
    return {
      color: parts[0] || null,
      size: parts[1] || null,
      spool: parts[2] || null,
    };
  } else if (parts.length === 2) {
    // Could be "Color / Size" or "Size / Spool"
    const first = parts[0].toLowerCase();
    if (/kg|1\.75|2\.85/i.test(first)) {
      return { color: null, size: parts[0], spool: parts[1] };
    }
    return { color: parts[0], size: parts[1], spool: null };
  } else if (parts.length === 1) {
    return { color: parts[0], size: null, spool: null };
  }
  
  return { color: null, size: null, spool: null };
}

// TDS URL - Matter3D has generic downloads page
export const MATTER3D_TDS_URL = 'https://matter3d.com/pages/downloads';

export function getMatter3dTdsUrl(material: string | null): string | null {
  if (!material) return null;
  
  // Matter3D has TDS for their main materials
  const materialsWithTds = ['PLA', 'PLA+', 'PETG', 'ASA', 'ABS', 'PA', 'PA-CF', 'TPU-95A'];
  
  if (materialsWithTds.some(m => material.toUpperCase().includes(m))) {
    return MATTER3D_TDS_URL;
  }
  
  return null;
}

// MAIN ENRICHMENT FUNCTION
export interface Matter3dEnrichmentResult {
  material: string | null;
  finishType: FinishType;
  productLineId: string;
  colorHex: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  requiresEnclosure: boolean;
  isAbrasive: boolean;
  highSpeedCapable: boolean;
  tdsUrl: string | null;
  netWeightG: number | null;
  dryingTempC: number | null;
  dryingTimeHours: number | null;
}

export function enrichMatter3dProduct(
  title: string,
  variantTitle: string,
  existingMaterial?: string | null,
  existingColorHex?: string | null
): Matter3dEnrichmentResult {
  const material = existingMaterial || normalizeMatter3dMaterial(title);
  const finishType = extractFinishType(title);
  const productLineId = generateMatter3dProductLineId(title, material);
  
  // Parse variant for color
  const parsed = parseVariantTitle(variantTitle);
  const colorHex = existingColorHex || getMatter3dColorHex(parsed.color || '');
  
  // Get print settings
  let settingsKey = material || 'PLA';
  if (finishType === 'Matte' && material) {
    settingsKey = `${material}-MATTE`;
  } else if (finishType === 'Carbon' && material) {
    settingsKey = `${material}-CF`;
  }
  
  const settings = MATTER3D_PRINT_SETTINGS[settingsKey] || MATTER3D_PRINT_SETTINGS[material || 'PLA'];
  
  // Calculate weight
  const weightKg = extractWeightKg(title);
  
  return {
    material,
    finishType,
    productLineId,
    colorHex,
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    requiresEnclosure: settings?.requiresEnclosure || false,
    isAbrasive: settings?.isAbrasive || isCarbonFiberVariant(title),
    highSpeedCapable: isHighFlowVariant(title),
    tdsUrl: getMatter3dTdsUrl(material),
    netWeightG: Math.round(weightKg * 1000),
    dryingTempC: settings?.dryingTempC || null,
    dryingTimeHours: settings?.dryingTimeHours || null,
  };
}
