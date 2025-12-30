/**
 * Creality Brand Defaults
 * 
 * Configuration for Creality filament products from store.creality.com
 * Focus on Hyper Series high-speed filaments optimized for K1/K2 printers
 * 
 * Product Lines:
 * - Hyper Series (PLA, PETG, ABS, PC) - High-speed flagship
 * - Hyper RFID - For CFS (Color Filament System)
 * - Ender Fast - Budget high-speed
 * - CR Series - Standard consumer line
 * - HP Series - High-performance engineering
 * - Soleyin Ultra - Budget line
 */

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

interface MaterialPattern {
  pattern: RegExp;
  material: string;
  highSpeedCapable?: boolean;
  isAbrasive?: boolean;
  enclosureRequired?: boolean;
}

const CREALITY_MATERIAL_PATTERNS: MaterialPattern[] = [
  // Carbon Fiber variants (must check first)
  { pattern: /pla[- ]?cf|carbon\s*fiber\s*pla|cf[- ]?pla/i, material: 'PLA-CF', isAbrasive: true },
  { pattern: /petg[- ]?cf|carbon\s*fiber\s*petg/i, material: 'PETG-CF', isAbrasive: true },
  
  // Specialty PLA
  { pattern: /cr[- ]?wood|wood[- ]?pla|pla[- ]?wood/i, material: 'PLA-Wood' },
  { pattern: /silk|silky/i, material: 'PLA' }, // Silk is a finish, not material
  
  // High-speed variants
  { pattern: /hyper.*pla|pla.*hyper|ender\s*fast.*pla/i, material: 'PLA', highSpeedCapable: true },
  { pattern: /hyper.*petg|petg.*hyper/i, material: 'PETG', highSpeedCapable: true },
  { pattern: /hyper.*abs|abs.*hyper/i, material: 'ABS', highSpeedCapable: true, enclosureRequired: true },
  { pattern: /hyper.*pc|pc.*hyper/i, material: 'PC', highSpeedCapable: true, enclosureRequired: true },
  
  // Standard materials
  { pattern: /\bpla\+?\b/i, material: 'PLA' },
  { pattern: /\bpetg\b/i, material: 'PETG' },
  { pattern: /\babs\b/i, material: 'ABS', enclosureRequired: true },
  { pattern: /\basa\b|hp[- ]?asa/i, material: 'ASA', enclosureRequired: true },
  { pattern: /\btpu\b|hp[- ]?tpu/i, material: 'TPU' },
  { pattern: /\bpc\b/i, material: 'PC', enclosureRequired: true },
  { pattern: /\bpvb\b/i, material: 'PVB' },
];

export function normalizeCrealityMaterial(title: string): {
  material: string;
  highSpeedCapable: boolean;
  isAbrasive: boolean;
  enclosureRequired: boolean;
} {
  const normalizedTitle = title.toLowerCase();
  
  for (const { pattern, material, highSpeedCapable, isAbrasive, enclosureRequired } of CREALITY_MATERIAL_PATTERNS) {
    if (pattern.test(normalizedTitle)) {
      // Check for Hyper/Ender Fast keywords for high-speed flag
      const isHighSpeed = highSpeedCapable || /hyper|ender\s*fast/i.test(normalizedTitle);
      
      return {
        material,
        highSpeedCapable: isHighSpeed,
        isAbrasive: isAbrasive || false,
        enclosureRequired: enclosureRequired || false,
      };
    }
  }
  
  return {
    material: 'PLA', // Default
    highSpeedCapable: /hyper|ender\s*fast/i.test(normalizedTitle),
    isAbrasive: false,
    enclosureRequired: false,
  };
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 'Standard' | 'Silk' | 'Matte' | 'Multi' | 'Sparkle' | 'Translucent' | 'Glow';

export function extractCrealityFinishType(title: string): FinishType {
  const t = title.toLowerCase();
  
  if (/silk|silky/i.test(t)) return 'Silk';
  if (/matte/i.test(t)) return 'Matte';
  if (/rainbow|gradient|dual[- ]?color|tri[- ]?color/i.test(t)) return 'Multi';
  if (/stardust|sparkle|glitter|shimmer/i.test(t)) return 'Sparkle';
  if (/translucent|transparent|clear/i.test(t)) return 'Translucent';
  if (/glow|luminous/i.test(t)) return 'Glow';
  
  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateCrealityProductLineId(title: string, material: string): string {
  const t = title.toLowerCase();
  const mat = material.toLowerCase().replace(/[- ]/g, '-');
  
  // Hyper Series variants
  if (/hyper.*rfid.*stardust/i.test(t)) return `creality__${mat}__hyper-rfid-stardust`;
  if (/hyper.*rfid/i.test(t)) return `creality__${mat}__hyper-rfid`;
  if (/hyper.*rainbow/i.test(t)) return `creality__${mat}__hyper-rainbow`;
  if (/hyper/i.test(t)) return `creality__${mat}__hyper`;
  
  // Ender Fast
  if (/ender\s*fast/i.test(t)) return `creality__${mat}__ender-fast`;
  
  // Soleyin Ultra
  if (/soleyin/i.test(t)) return `creality__${mat}__soleyin-ultra`;
  
  // CR Series
  if (/cr[- ]?silk/i.test(t)) return `creality__${mat}__cr-silk`;
  if (/cr[- ]?wood/i.test(t)) return `creality__pla-wood__cr-wood`;
  if (/cr[- ]?/i.test(t)) return `creality__${mat}__cr`;
  
  // HP Series
  if (/hp[- ]?/i.test(t)) return `creality__${mat}__hp`;
  
  // Finish-based lines
  if (/silk/i.test(t)) return `creality__${mat}__silk`;
  if (/matte/i.test(t)) return `creality__${mat}__matte`;
  
  // Default
  return `creality__${mat}__standard`;
}

// ============================================================================
// TDS URL MAPPING
// ============================================================================

const CREALITY_TDS_URLS: Record<string, string> = {
  // Hyper Series
  'hyper-pla': 'https://download.creality.com/download/filament/TDS_Hyper_PLA.pdf',
  'hyper-petg': 'https://download.creality.com/download/filament/TDS_Hyper_PETG.pdf',
  'hyper-abs': 'https://download.creality.com/download/filament/TDS_ABS.pdf',
  'hyper-pc': 'https://download.creality.com/download/filament/TDS_PC.pdf',
  
  // Standard materials
  'pla': 'https://download.creality.com/download/filament/TDS_PLA.pdf',
  'silk-pla': 'https://download.creality.com/download/filament/TDS_Silk_PLA.pdf',
  'petg': 'https://download.creality.com/download/filament/TDS_PETG.pdf',
  'abs': 'https://download.creality.com/download/filament/TDS_ABS.pdf',
  'tpu': 'https://download.creality.com/download/filament/TDS_TPU.pdf',
  'asa': 'https://download.creality.com/download/filament/TDS_ASA.pdf',
  'pc': 'https://download.creality.com/download/filament/TDS_PC.pdf',
  'pla-wood': 'https://download.creality.com/download/filament/TDS_Wood_PLA.pdf',
  'pla-cf': 'https://download.creality.com/download/filament/TDS_Carbon_Fiber_PLA.pdf',
};

export function getCrealityTdsUrl(title: string, material: string): string | null {
  const t = title.toLowerCase();
  const mat = material.toLowerCase();
  
  // Hyper Series specific
  if (/hyper/i.test(t)) {
    if (mat === 'pla') return CREALITY_TDS_URLS['hyper-pla'];
    if (mat === 'petg') return CREALITY_TDS_URLS['hyper-petg'];
    if (mat === 'abs') return CREALITY_TDS_URLS['hyper-abs'];
    if (mat === 'pc') return CREALITY_TDS_URLS['hyper-pc'];
  }
  
  // Silk PLA
  if (/silk/i.test(t) && mat === 'pla') return CREALITY_TDS_URLS['silk-pla'];
  
  // Material-based lookup
  const matKey = mat.replace(' ', '-');
  return CREALITY_TDS_URLS[matKey] || null;
}

// ============================================================================
// PRINT SETTINGS
// ============================================================================

interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
}

const CREALITY_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Hyper Series (high-speed optimized)
  'hyper-pla': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 25, bedTempMax: 60, printSpeedMax: 600 },
  'hyper-petg': { nozzleTempMin: 220, nozzleTempMax: 260, bedTempMin: 60, bedTempMax: 80, printSpeedMax: 300 },
  'hyper-abs': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, printSpeedMax: 300 },
  'hyper-pc': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 90, bedTempMax: 110, printSpeedMax: 200 },
  
  // Standard materials
  'pla': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 40, bedTempMax: 60 },
  'silk-pla': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 40, bedTempMax: 60 },
  'petg': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 60, bedTempMax: 80 },
  'abs': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110 },
  'asa': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 90, bedTempMax: 110 },
  'tpu': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 20, bedTempMax: 50 },
  'pc': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 90, bedTempMax: 110 },
  'pla-wood': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 40, bedTempMax: 60 },
  'pla-cf': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 40, bedTempMax: 60 },
};

export function getCrealityPrintSettings(title: string, material: string): PrintSettings | null {
  const t = title.toLowerCase();
  const mat = material.toLowerCase().replace(' ', '-');
  
  // Hyper Series specific
  if (/hyper/i.test(t)) {
    const hyperKey = `hyper-${mat}`;
    if (CREALITY_PRINT_SETTINGS[hyperKey]) return CREALITY_PRINT_SETTINGS[hyperKey];
  }
  
  // Silk PLA
  if (/silk/i.test(t) && mat === 'pla') return CREALITY_PRINT_SETTINGS['silk-pla'];
  
  // Material-based lookup
  return CREALITY_PRINT_SETTINGS[mat] || CREALITY_PRINT_SETTINGS['pla'];
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

const CREALITY_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'grey': '#808080',
  'gray': '#808080',
  'red': '#E53935',
  'blue': '#1E88E5',
  'green': '#43A047',
  'yellow': '#FDD835',
  'orange': '#FB8C00',
  'purple': '#8E24AA',
  'pink': '#EC407A',
  'brown': '#795548',
  'skin': '#FFCC99',
  'beige': '#F5DEB3',
  'cream': '#FFFDD0',
  
  // Silk colors
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'copper': '#B87333',
  'bronze': '#CD7F32',
  'rose gold': '#B76E79',
  
  // Translucent
  'transparent': '#FFFFFF',
  'clear': '#FFFFFF',
  'translucent': '#F0F0F0',
  
  // Special
  'rainbow': '#FF0000',
  'stardust': '#4A4A4A',
  'space grey': '#5F5F5F',
  'space gray': '#5F5F5F',
  'midnight blue': '#191970',
  'forest green': '#228B22',
  'wine red': '#722F37',
  'light blue': '#87CEEB',
  'dark blue': '#00008B',
  'light green': '#90EE90',
  'dark green': '#006400',
  'light grey': '#D3D3D3',
  'dark grey': '#404040',
  'light gray': '#D3D3D3',
  'dark gray': '#404040',
  'navy': '#000080',
  'cyan': '#00FFFF',
  'magenta': '#FF00FF',
  'teal': '#008080',
  'olive': '#808000',
  'maroon': '#800000',
  'coral': '#FF7F50',
  'salmon': '#FA8072',
  'turquoise': '#40E0D0',
  'lavender': '#E6E6FA',
  'ivory': '#FFFFF0',
  'charcoal': '#36454F',
  'slate': '#708090',
};

export function getCrealityColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (CREALITY_COLOR_MAPPING[normalized]) {
    return CREALITY_COLOR_MAPPING[normalized];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(CREALITY_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanCrealityTitle(title: string): string {
  return title
    .replace(/creality\s*/gi, '')
    .replace(/3d\s*print(ing|er)?\s*filament/gi, '')
    .replace(/filament/gi, '')
    .replace(/1\.75\s*mm/gi, '')
    .replace(/2\.85\s*mm/gi, '')
    .replace(/\d+\s*(kg|g)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// COLOR EXTRACTION FROM TITLE
// ============================================================================

export function extractCrealityColorFromTitle(title: string): string | null {
  const t = title.toLowerCase();
  
  // Common color patterns
  const colorPatterns = [
    'black', 'white', 'grey', 'gray', 'red', 'blue', 'green', 'yellow', 'orange',
    'purple', 'pink', 'brown', 'skin', 'beige', 'cream', 'gold', 'silver', 'copper',
    'bronze', 'rose gold', 'rainbow', 'stardust', 'space grey', 'space gray',
    'midnight blue', 'forest green', 'wine red', 'light blue', 'dark blue',
    'light green', 'dark green', 'light grey', 'dark grey', 'navy', 'cyan',
    'magenta', 'teal', 'olive', 'maroon', 'coral', 'salmon', 'turquoise',
    'lavender', 'ivory', 'charcoal', 'slate', 'transparent', 'clear'
  ];
  
  for (const color of colorPatterns) {
    if (t.includes(color)) {
      return color.charAt(0).toUpperCase() + color.slice(1);
    }
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface CrealityEnrichmentResult {
  material: string;
  finishType: FinishType;
  productLineId: string;
  tdsUrl: string | null;
  printSettings: PrintSettings | null;
  colorHex: string | null;
  colorName: string | null;
  cleanedTitle: string;
  highSpeedCapable: boolean;
  isAbrasive: boolean;
  enclosureRequired: boolean;
  diameterMm: number;
  spoolWeightGrams: number;
}

export function enrichCrealityProduct(
  title: string,
  colorName?: string | null,
  existingMaterial?: string | null
): CrealityEnrichmentResult {
  // Normalize material
  const { material, highSpeedCapable, isAbrasive, enclosureRequired } = normalizeCrealityMaterial(title);
  const finalMaterial = existingMaterial || material;
  
  // Extract finish type
  const finishType = extractCrealityFinishType(title);
  
  // Generate product line ID
  const productLineId = generateCrealityProductLineId(title, finalMaterial);
  
  // Get TDS URL
  const tdsUrl = getCrealityTdsUrl(title, finalMaterial);
  
  // Get print settings
  const printSettings = getCrealityPrintSettings(title, finalMaterial);
  
  // Determine color
  const extractedColor = colorName || extractCrealityColorFromTitle(title);
  const colorHex = extractedColor ? getCrealityColorHex(extractedColor) : null;
  
  // Clean title
  const cleanedTitle = cleanCrealityTitle(title);
  
  // Parse weight from title (default 1000g)
  let spoolWeightGrams = 1000;
  const weightMatch = title.match(/(\d+)\s*(kg|g)/i);
  if (weightMatch) {
    const value = parseInt(weightMatch[1], 10);
    const unit = weightMatch[2].toLowerCase();
    spoolWeightGrams = unit === 'kg' ? value * 1000 : value;
  }
  
  return {
    material: finalMaterial,
    finishType,
    productLineId,
    tdsUrl,
    printSettings,
    colorHex,
    colorName: extractedColor,
    cleanedTitle,
    highSpeedCapable,
    isAbrasive,
    enclosureRequired,
    diameterMm: 1.75, // Creality only makes 1.75mm
    spoolWeightGrams,
  };
}

// ============================================================================
// STORE INFO
// ============================================================================

export const CREALITY_STORE_INFO = {
  baseUrl: 'https://store.creality.com',
  collectionsUrl: 'https://store.creality.com/collections/filament',
  vendor: 'Creality',
  platformType: 'shopify', // JSON API blocked, but underlying is Shopify
  defaultDiameter: 1.75,
  defaultWeight: 1000,
  defaultCurrency: 'USD',
};
