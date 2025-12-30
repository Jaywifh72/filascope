/**
 * GIZMO DORKS BRAND-SPECIFIC DEFAULTS
 * 
 * US-based value filament brand on BigCommerce platform.
 * Extensive color catalog with specialty finishes (Color Change, Fluorescent, Glow, Silk).
 * All products are 1kg spools in 1.75mm and 2.85mm (labeled as 3mm) diameters.
 * No TDS documents available - consumer-focused brand.
 */

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export interface MaterialInfo {
  normalized: string;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
  isLowOdor?: boolean;
}

const MATERIAL_PATTERNS: Array<{ pattern: RegExp; info: MaterialInfo }> = [
  // Composites first (more specific)
  { pattern: /carbon\s*fiber|cf\s*abs|\babs[\s-]*cf\b/i, info: { normalized: 'ABS-CF', isAbrasive: true, requiresEnclosure: true } },
  { pattern: /wood\s*(?:fill|pla)|pla.*wood/i, info: { normalized: 'PLA-Wood', isAbrasive: true, requiresEnclosure: false } },
  { pattern: /metal\s*(?:fill)?|bronze|copper|stainless/i, info: { normalized: 'PLA-Metal', isAbrasive: true, requiresEnclosure: false } },
  
  // Engineering grades
  { pattern: /pla\s*pro|pro\s*plus|engineering\s*grade/i, info: { normalized: 'PLA+', isAbrasive: false, requiresEnclosure: false } },
  { pattern: /low\s*odor.*abs|abs.*low\s*odor/i, info: { normalized: 'ABS', isAbrasive: false, requiresEnclosure: true, isLowOdor: true } },
  
  // Support materials
  { pattern: /\bpva\b/i, info: { normalized: 'PVA', isAbrasive: false, requiresEnclosure: false } },
  { pattern: /\bhips\b/i, info: { normalized: 'HIPS', isAbrasive: false, requiresEnclosure: true } },
  
  // Engineering polymers
  { pattern: /polycarbonate|\bpc\b/i, info: { normalized: 'PC', isAbrasive: false, requiresEnclosure: true } },
  { pattern: /nylon|\bpa\b|\bpa6\b|\bpa12\b/i, info: { normalized: 'PA', isAbrasive: false, requiresEnclosure: false } },
  { pattern: /acetal|delrin|\bpom\b/i, info: { normalized: 'POM', isAbrasive: false, requiresEnclosure: false } },
  
  // Standard materials
  { pattern: /\btpu\b|flexible/i, info: { normalized: 'TPU', isAbrasive: false, requiresEnclosure: false } },
  { pattern: /\bpetg\b/i, info: { normalized: 'PETG', isAbrasive: false, requiresEnclosure: false } },
  { pattern: /\babs\b/i, info: { normalized: 'ABS', isAbrasive: false, requiresEnclosure: true } },
  { pattern: /\bpla\b/i, info: { normalized: 'PLA', isAbrasive: false, requiresEnclosure: false } },
];

export function normalizeGizmoDorksMaterial(title: string): MaterialInfo {
  if (!title) return { normalized: 'PLA', isAbrasive: false, requiresEnclosure: false };
  
  for (const { pattern, info } of MATERIAL_PATTERNS) {
    if (pattern.test(title)) {
      return info;
    }
  }
  
  return { normalized: 'PLA', isAbrasive: false, requiresEnclosure: false };
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 
  | 'Standard' 
  | 'Silk' 
  | 'Sparkle' 
  | 'Glow' 
  | 'Translucent' 
  | 'ColorChange' 
  | 'Fluorescent' 
  | 'Rainbow' 
  | 'Wood' 
  | 'Metal';

const FINISH_PATTERNS: Array<{ pattern: RegExp; finish: FinishType }> = [
  { pattern: /\bsilk\b/i, finish: 'Silk' },
  { pattern: /color\s*chang|heat\s*activ|thermochromic/i, finish: 'ColorChange' },
  { pattern: /fluorescent|uv\s*reacti|black\s*light/i, finish: 'Fluorescent' },
  { pattern: /glow\s*(?:in\s*(?:the\s*)?)?dark|\bglow\b|\bgitd\b/i, finish: 'Glow' },
  { pattern: /translucent|transparent|clear/i, finish: 'Translucent' },
  { pattern: /rainbow|gradient|multicolor/i, finish: 'Rainbow' },
  { pattern: /glitter|sparkle/i, finish: 'Sparkle' },
  { pattern: /\bwood\b/i, finish: 'Wood' },
  { pattern: /\bmetal\b|bronze|copper|stainless|steel/i, finish: 'Metal' },
];

export function extractGizmoDocksFinishType(title: string): FinishType {
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
}

export const GIZMODORKS_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 225, bedTempMin: 50, bedTempMax: 60 },
  'PLA+': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 65 },
  'PLA-Wood': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60, isAbrasive: true },
  'PLA-Metal': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60, isAbrasive: true },
  'ABS': { nozzleTempMin: 220, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'ABS-CF': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 85 },
  'TPU': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 30, bedTempMax: 50, printSpeedMax: 40 },
  'PC': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 100, bedTempMax: 120, requiresEnclosure: true },
  'PA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 90 },
  'POM': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 80, bedTempMax: 100 },
  'HIPS': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'PVA': { nozzleTempMin: 180, nozzleTempMax: 210, bedTempMin: 50, bedTempMax: 60 },
};

export function getGizmoDorksPrintSettings(material: string): PrintSettings | null {
  return GIZMODORKS_PRINT_SETTINGS[material] || null;
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateGizmoDocksProductLineId(title: string, material: string): string {
  const finish = extractGizmoDocksFinishType(title);
  
  // Determine product series from title
  let series = 'standard';
  
  if (/pro\s*plus|engineering/i.test(title)) {
    series = 'pro-plus';
  } else if (/low\s*odor/i.test(title)) {
    series = 'low-odor';
  }
  
  // Build product line ID
  const materialSlug = material.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const finishSlug = finish.toLowerCase();
  
  if (finish === 'Standard' && series === 'standard') {
    return `gizmodorks__${materialSlug}__standard`;
  } else if (series !== 'standard') {
    return `gizmodorks__${materialSlug}__${series}`;
  } else {
    return `gizmodorks__${materialSlug}__${finishSlug}`;
  }
}

// ============================================================================
// COLOR MAPPING (~60+ colors)
// ============================================================================

export const GIZMODORKS_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'black': '1A1A1A',
  'white': 'FFFFFF',
  'red': 'CC0000',
  'blue': '0066CC',
  'green': '228B22',
  'yellow': 'FFD700',
  'orange': 'FF6600',
  'purple': '8B008B',
  'pink': 'FF69B4',
  'grey': '808080',
  'gray': '808080',
  'brown': '8B4513',
  'beige': 'F5DEB3',
  'gold': 'FFD700',
  'silver': 'C0C0C0',
  'violet': 'EE82EE',
  
  // Extended standard
  'dark blue': '00008B',
  'dark brown': '654321',
  'dark grey': '4A4A4A',
  'dark gray': '4A4A4A',
  'dark green': '006400',
  'dark purple': '4B0082',
  'dark red': '8B0000',
  'light blue': '87CEEB',
  'light green': '90EE90',
  'light grey': 'D3D3D3',
  'light gray': 'D3D3D3',
  'light pink': 'FFB6C1',
  'light yellow': 'FFFFE0',
  'grass green': '7CFC00',
  'lime green': '32CD32',
  'navy blue': '000080',
  'sky blue': '87CEEB',
  'hot pink': 'FF1493',
  'pink rose': 'FF007F',
  'red lava': 'CF1020',
  
  // Translucent colors
  'translucent': 'F0F0F0',
  'translucent blue': '87CEEB',
  'translucent green': '98FB98',
  'translucent orange': 'FFB347',
  'translucent pink': 'FFB6C1',
  'translucent purple': 'DDA0DD',
  'translucent red': 'FF6B6B',
  'translucent yellow': 'FFFACD',
  'clear': 'F5F5F5',
  'natural': 'F5F5DC',
  
  // Color change (thermochromic) - show warm state color
  'blue white': '4169E1',
  'blue-white': '4169E1',
  'green yellow': '9ACD32',
  'green-yellow': '9ACD32',
  'grey white': 'A9A9A9',
  'gray white': 'A9A9A9',
  'grey-white': 'A9A9A9',
  'gray-white': 'A9A9A9',
  'purple pink': 'DA70D6',
  'purple-pink': 'DA70D6',
  
  // Fluorescent / UV reactive
  'fluorescent blue': '00BFFF',
  'fluorescent green': '39FF14',
  'fluorescent orange': 'FF5F1F',
  'fluorescent pink': 'FF1493',
  'fluorescent red': 'FF3131',
  'fluorescent yellow': 'CCFF00',
  
  // Glow in the dark
  'glow green': '39FF14',
  'glow blue': '00FFFF',
  'glow': '39FF14',
  
  // Silk colors
  'silk white': 'FFFAFA',
  'silk black': '2C2C2C',
  'silk red': 'DC143C',
  'silk blue': '4169E1',
  'silk green': '3CB371',
  'silk gold': 'FFD700',
  'silk silver': 'C0C0C0',
  'silk purple': '9370DB',
  'silk pink': 'FF69B4',
  'silk orange': 'FF8C00',
  
  // Rainbow / Gradient
  'rainbow': 'FF6B6B',
  'multicolor': 'FF6B6B',
  
  // Metal fills
  'bronze': 'CD7F32',
  'copper': 'B87333',
  'stainless steel': 'C0C0C0',
  'stainless': 'C0C0C0',
  
  // Wood tones
  'wood': 'DEB887',
  'wood brown': 'A0522D',
  'wood light': 'DEB887',
  'wood dark': '8B4513',
  
  // Sparkle/Glitter
  'glitter black': '2C2C2C',
  'glitter blue': '4682B4',
  'glitter gold': 'FFD700',
  'glitter green': '228B22',
  'glitter pink': 'FF69B4',
  'glitter purple': '9370DB',
  'glitter red': 'DC143C',
  'glitter silver': 'C0C0C0',
  'sparkle': 'C0C0C0',
};

export function getGizmoDocksColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (GIZMODORKS_COLOR_MAPPING[normalized]) {
    return GIZMODORKS_COLOR_MAPPING[normalized];
  }
  
  // Try partial matches
  for (const [key, hex] of Object.entries(GIZMODORKS_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  // Try individual words
  const words = normalized.split(/[\s\-_]+/);
  for (const word of words) {
    if (GIZMODORKS_COLOR_MAPPING[word]) {
      return GIZMODORKS_COLOR_MAPPING[word];
    }
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanGizmoDocksTitle(title: string): string {
  if (!title) return '';
  
  return title
    .replace(/gizmo\s*dorks?/gi, '')
    .replace(/3d\s*printer/gi, '')
    .replace(/filament/gi, '')
    .replace(/1\.75\s*mm/gi, '')
    .replace(/3\s*mm/gi, '')
    .replace(/2\.85\s*mm/gi, '')
    .replace(/1\s*kg/gi, '')
    .replace(/1000\s*g/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface GizmoDocksEnrichmentResult {
  material: string;
  finishType: FinishType;
  productLineId: string;
  colorHex: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  printSpeedMax: number | null;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
  cleanedTitle: string;
  tdsUrl: null; // No TDS available for Gizmo Dorks
}

export function enrichGizmoDocksProduct(
  title: string,
  colorName?: string | null
): GizmoDocksEnrichmentResult {
  const materialInfo = normalizeGizmoDorksMaterial(title);
  const finishType = extractGizmoDocksFinishType(title);
  const printSettings = getGizmoDorksPrintSettings(materialInfo.normalized);
  const productLineId = generateGizmoDocksProductLineId(title, materialInfo.normalized);
  const colorHex = colorName ? getGizmoDocksColorHex(colorName) : null;
  const cleanedTitle = cleanGizmoDocksTitle(title);
  
  return {
    material: materialInfo.normalized,
    finishType,
    productLineId,
    colorHex,
    nozzleTempMin: printSettings?.nozzleTempMin || null,
    nozzleTempMax: printSettings?.nozzleTempMax || null,
    bedTempMin: printSettings?.bedTempMin || null,
    bedTempMax: printSettings?.bedTempMax || null,
    printSpeedMax: printSettings?.printSpeedMax || null,
    isAbrasive: materialInfo.isAbrasive || printSettings?.isAbrasive || false,
    requiresEnclosure: materialInfo.requiresEnclosure || printSettings?.requiresEnclosure || false,
    cleanedTitle,
    tdsUrl: null, // Gizmo Dorks does not provide TDS documents
  };
}

// ============================================================================
// STORE INFO
// ============================================================================

export const GIZMODORKS_STORE_INFO = {
  vendor: 'Gizmo Dorks',
  platform: 'bigcommerce',
  baseUrl: 'https://gizmodorks.com',
  productsUrl: 'https://gizmodorks.com/3d-printer-filament-1kg/',
  defaultCurrency: 'USD',
  defaultWeight: 1000, // 1kg spools
  diameters: [1.75, 2.85], // 2.85mm labeled as "3mm" on site
  notes: 'US-based value brand. No TDS available. Extensive color catalog with specialty finishes.',
};
