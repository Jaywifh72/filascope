/**
 * CC3D Brand Defaults
 * 
 * Chinese filament manufacturer known for Silk PLA and budget-friendly materials.
 * Store: cc3dglobal.com (WooCommerce)
 * Founded: 2015 - "China First Manufacture of Printer Filament"
 * 
 * Key characteristics:
 * - 18 product categories including Silk PLA flagship line
 * - Specialty finishes: Silk, Metal, Ceramic, Marble, Wood, Color Change
 * - 1.75mm diameter only, 1kg spools
 * - No formal TDS documents available
 * - Some products are "Quote Only" (B2B focus)
 */

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export interface MaterialInfo {
  normalized: string;
  baseType: string;
  isComposite: boolean;
  compositeAdditive?: string;
  isAbrasive?: boolean;
  isConductive?: boolean;
  enclosureRequired?: boolean;
}

const MATERIAL_PATTERNS: Array<{ pattern: RegExp; info: MaterialInfo }> = [
  // Carbon Fiber variants (must come before base materials)
  { 
    pattern: /carbon\s*fiber|pla[\s-]*cf|\bcf\b/i, 
    info: { normalized: 'PLA-CF', baseType: 'PLA', isComposite: true, compositeAdditive: 'Carbon Fiber', isAbrasive: true }
  },
  
  // Wood-filled
  { 
    pattern: /wood|wooden/i, 
    info: { normalized: 'PLA-Wood', baseType: 'PLA', isComposite: true, compositeAdditive: 'Wood Fiber', isAbrasive: true }
  },
  
  // Metal-filled
  { 
    pattern: /metal[\s-]*filled|bronze[\s-]*fill|copper[\s-]*fill/i, 
    info: { normalized: 'PLA-Metal', baseType: 'PLA', isComposite: true, compositeAdditive: 'Metal Powder', isAbrasive: true }
  },
  
  // Ceramic-filled
  { 
    pattern: /ceramic/i, 
    info: { normalized: 'PLA-Ceramic', baseType: 'PLA', isComposite: true, compositeAdditive: 'Ceramic Powder', isAbrasive: true }
  },
  
  // Marble-filled
  { 
    pattern: /marble/i, 
    info: { normalized: 'PLA-Marble', baseType: 'PLA', isComposite: true, compositeAdditive: 'Stone Powder', isAbrasive: true }
  },
  
  // Conductive PLA
  { 
    pattern: /conductive/i, 
    info: { normalized: 'PLA', baseType: 'PLA', isComposite: false, isConductive: true }
  },
  
  // Reinforced PLA variants
  { 
    pattern: /pla\s*max|max\s*pla/i, 
    info: { normalized: 'PLA+', baseType: 'PLA', isComposite: false }
  },
  { 
    pattern: /pla\s*tough|tough\s*pla/i, 
    info: { normalized: 'PLA+', baseType: 'PLA', isComposite: false }
  },
  
  // Engineering materials
  { 
    pattern: /polycarbonate|\bpc\b/i, 
    info: { normalized: 'PC', baseType: 'PC', isComposite: false, enclosureRequired: true }
  },
  { 
    pattern: /nylon|\bpa\b/i, 
    info: { normalized: 'PA', baseType: 'PA', isComposite: false }
  },
  { 
    pattern: /polypropylene|\bpp\b/i, 
    info: { normalized: 'PP', baseType: 'PP', isComposite: false }
  },
  
  // Support materials
  { 
    pattern: /\bhips\b/i, 
    info: { normalized: 'HIPS', baseType: 'HIPS', isComposite: false }
  },
  
  // Flexible
  { 
    pattern: /\btpu\b|flexible/i, 
    info: { normalized: 'TPU', baseType: 'TPU', isComposite: false }
  },
  
  // Standard materials
  { 
    pattern: /\babs\b/i, 
    info: { normalized: 'ABS', baseType: 'ABS', isComposite: false, enclosureRequired: true }
  },
  { 
    pattern: /\bpetg\b/i, 
    info: { normalized: 'PETG', baseType: 'PETG', isComposite: false }
  },
  { 
    pattern: /\bpla\b/i, 
    info: { normalized: 'PLA', baseType: 'PLA', isComposite: false }
  },
];

export function normalizeCC3DMaterial(title: string, category?: string): MaterialInfo {
  const searchText = `${title} ${category || ''}`.toLowerCase();
  
  for (const { pattern, info } of MATERIAL_PATTERNS) {
    if (pattern.test(searchText)) {
      return info;
    }
  }
  
  // Default to PLA if nothing matches
  return { normalized: 'PLA', baseType: 'PLA', isComposite: false };
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 
  | 'Standard' | 'Matte' | 'Silk' | 'Gloss' 
  | 'Sparkle' | 'Shimmer' | 'Translucent' 
  | 'Glow' | 'Fluorescent' | 'Metal' 
  | 'Marble' | 'Wood' | 'Ceramic'
  | 'ColorChange' | 'Rainbow' | 'Multi' | 'Gradient';

const FINISH_PATTERNS: Array<{ pattern: RegExp; finish: FinishType }> = [
  { pattern: /color\s*chang|temperature\s*chang|thermochromic/i, finish: 'ColorChange' },
  { pattern: /silk|silky|shiny\s*metallic/i, finish: 'Silk' },
  { pattern: /metal[\s-]*filled|bronze|copper|gold|silver/i, finish: 'Metal' },
  { pattern: /ceramic/i, finish: 'Ceramic' },
  { pattern: /marble/i, finish: 'Marble' },
  { pattern: /wood|wooden/i, finish: 'Wood' },
  { pattern: /transparent|translucent|clear/i, finish: 'Translucent' },
  { pattern: /matte|mat\b/i, finish: 'Matte' },
  { pattern: /glitter|sparkle/i, finish: 'Sparkle' },
  { pattern: /glow|luminous|phosphor/i, finish: 'Glow' },
  { pattern: /neon|fluorescent/i, finish: 'Fluorescent' },
];

export function extractCC3DFinishType(title: string, category?: string): FinishType {
  const searchText = `${title} ${category || ''}`.toLowerCase();
  
  for (const { pattern, finish } of FINISH_PATTERNS) {
    if (pattern.test(searchText)) {
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
  enclosureRequired?: boolean;
  highSpeedCapable?: boolean;
}

export const CC3D_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PLA+': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 60, bedTempMax: 70 },
  'PLA-CF': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'PLA-Wood': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PLA-Metal': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PLA-Ceramic': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PLA-Marble': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 80 },
  'ABS': { nozzleTempMin: 220, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, enclosureRequired: true },
  'HIPS': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110 },
  'TPU': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 30, bedTempMax: 50 },
  'PA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 90 },
  'PC': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 100, bedTempMax: 120, enclosureRequired: true },
  'PP': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 80, bedTempMax: 100 },
};

export function getCC3DPrintSettings(material: string): PrintSettings | null {
  return CC3D_PRINT_SETTINGS[material] || CC3D_PRINT_SETTINGS['PLA'];
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateCC3DProductLineId(title: string, material: string, finishType: FinishType): string {
  const vendor = 'cc3d';
  const normalizedMaterial = material.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Determine series based on title and finish
  let series = 'standard';
  
  if (/silk/i.test(title)) {
    series = 'silk';
  } else if (/max/i.test(title)) {
    series = 'max';
  } else if (/tough/i.test(title)) {
    series = 'tough';
  } else if (/metal/i.test(title)) {
    series = 'metal';
  } else if (/ceramic/i.test(title)) {
    series = 'ceramic';
  } else if (/marble/i.test(title)) {
    series = 'marble';
  } else if (/wood|wooden/i.test(title)) {
    series = 'wood';
  } else if (/carbon|cf/i.test(title)) {
    series = 'cf';
  } else if (/conductive/i.test(title)) {
    series = 'conductive';
  } else if (/color\s*chang/i.test(title)) {
    series = 'color-change';
  }
  
  return `${vendor}__${normalizedMaterial}__${series}`;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const CC3D_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'red': '#E53935',
  'blue': '#1E88E5',
  'green': '#43A047',
  'yellow': '#FDD835',
  'orange': '#FB8C00',
  'purple': '#8E24AA',
  'pink': '#EC407A',
  'grey': '#757575',
  'gray': '#757575',
  'brown': '#6D4C41',
  
  // Silk colors
  'silk gold': '#D4AF37',
  'silk silver': '#C0C0C0',
  'silk copper': '#B87333',
  'silk bronze': '#CD7F32',
  'silk antique gold': '#C9AE5D',
  'silk green bronze': '#8B9A6B',
  'silk dark cyan': '#008B8B',
  'silk jade green': '#00A86B',
  'silk blue': '#4169E1',
  'silk black': '#2C2C2C',
  'silk purple': '#9370DB',
  'silk rose gold': '#B76E79',
  'silk champagne': '#F7E7CE',
  'silk rainbow': '#FF69B4',
  
  // Metal colors
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'copper': '#B87333',
  'bronze': '#CD7F32',
  'brass': '#B5A642',
  'iron': '#48494B',
  'aluminum': '#A9A9A9',
  
  // Specialty colors
  'bone white': '#F9F6EE',
  'lava red': '#CF1020',
  'midnight blue': '#191970',
  'sky blue': '#87CEEB',
  'navy': '#000080',
  'forest green': '#228B22',
  'olive': '#808000',
  'cream': '#FFFDD0',
  'ivory': '#FFFFF0',
  'beige': '#F5F5DC',
  'tan': '#D2B48C',
  'chocolate': '#7B3F00',
  'maroon': '#800000',
  'burgundy': '#800020',
  'wine': '#722F37',
  'coral': '#FF7F50',
  'salmon': '#FA8072',
  'peach': '#FFCBA4',
  'mint': '#98FF98',
  'teal': '#008080',
  'cyan': '#00FFFF',
  'turquoise': '#40E0D0',
  'aqua': '#00FFFF',
  'lavender': '#E6E6FA',
  'violet': '#EE82EE',
  'magenta': '#FF00FF',
  'fuchsia': '#FF00FF',
  
  // PETG specific
  'clear': '#F0F0F0',
  'transparent': '#F5F5F5',
  'blue gray': '#6699CC',
  'bright green': '#66FF00',
  
  // Wood colors
  'natural wood': '#DEB887',
  'dark wood': '#654321',
  'light wood': '#F5DEB3',
  
  // Marble colors
  'white marble': '#F5F5F5',
  'black marble': '#2F2F2F',
  
  // Color change pairs
  'blue-white': '#6495ED',
  'purple-pink': '#DA70D6',
  'green-yellow': '#9ACD32',
  'grey-white': '#A9A9A9',
  'gray-white': '#A9A9A9',
};

export function getCC3DColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (CC3D_COLOR_MAPPING[normalized]) {
    return CC3D_COLOR_MAPPING[normalized];
  }
  
  // Try removing common suffixes
  const cleaned = normalized
    .replace(/\s*filament$/i, '')
    .replace(/\s*pla$/i, '')
    .replace(/\s*petg$/i, '')
    .replace(/\s*3d\s*printer?$/i, '')
    .trim();
  
  if (CC3D_COLOR_MAPPING[cleaned]) {
    return CC3D_COLOR_MAPPING[cleaned];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(CC3D_COLOR_MAPPING)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return hex;
    }
  }
  
  // Extract color from compound names
  const words = cleaned.split(/[\s-]+/);
  for (const word of words) {
    if (CC3D_COLOR_MAPPING[word]) {
      return CC3D_COLOR_MAPPING[word];
    }
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanCC3DTitle(title: string): string {
  return title
    .replace(/cc3d/gi, '')
    .replace(/3d\s*print(er|ing)?/gi, '')
    .replace(/filament/gi, '')
    .replace(/1\.75\s*mm/gi, '')
    .replace(/1kg|1000g/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// CATEGORY URL MAPPING
// ============================================================================

export const CC3D_CATEGORY_URLS = [
  'https://cc3dglobal.com/product-category/silk-pla/',
  'https://cc3dglobal.com/product-category/pla-normal/',
  'https://cc3dglobal.com/product-category/pla-max-filament/',
  'https://cc3dglobal.com/product-category/pla-tough/',
  'https://cc3dglobal.com/product-category/pla-metal/',
  'https://cc3dglobal.com/product-category/ceramic/',
  'https://cc3dglobal.com/product-category/marble/',
  'https://cc3dglobal.com/product-category/pla-wooden/',
  'https://cc3dglobal.com/product-category/pla-carbon-fiber/',
  'https://cc3dglobal.com/product-category/conductive-pla/',
  'https://cc3dglobal.com/product-category/color-change-pla/',
  'https://cc3dglobal.com/product-category/petg-filament/',
  'https://cc3dglobal.com/product-category/abs/',
  'https://cc3dglobal.com/product-category/hips/',
  'https://cc3dglobal.com/product-category/tpu/',
  'https://cc3dglobal.com/product-category/pp/',
  'https://cc3dglobal.com/product-category/nylon/',
  'https://cc3dglobal.com/product-category/pc/',
];

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface CC3DEnrichmentResult {
  material: string;
  materialInfo: MaterialInfo;
  finishType: FinishType;
  productLineId: string;
  printSettings: PrintSettings | null;
  colorHex: string | null;
  cleanedTitle: string;
  diameterMm: number;
  spoolWeightGrams: number;
  isAbrasive: boolean;
  isConductive: boolean;
  enclosureRequired: boolean;
  tdsUrl: string | null;
}

export function enrichCC3DProduct(
  title: string, 
  colorName?: string | null,
  category?: string | null
): CC3DEnrichmentResult {
  const materialInfo = normalizeCC3DMaterial(title, category || undefined);
  const finishType = extractCC3DFinishType(title, category || undefined);
  const productLineId = generateCC3DProductLineId(title, materialInfo.normalized, finishType);
  const printSettings = getCC3DPrintSettings(materialInfo.normalized);
  const colorHex = colorName ? getCC3DColorHex(colorName) : null;
  const cleanedTitle = cleanCC3DTitle(title);
  
  return {
    material: materialInfo.normalized,
    materialInfo,
    finishType,
    productLineId,
    printSettings,
    colorHex,
    cleanedTitle,
    diameterMm: 1.75,
    spoolWeightGrams: 1000,
    isAbrasive: materialInfo.isAbrasive || false,
    isConductive: materialInfo.isConductive || false,
    enclosureRequired: materialInfo.enclosureRequired || printSettings?.enclosureRequired || false,
    tdsUrl: null, // CC3D doesn't provide TDS documents
  };
}

// ============================================================================
// STORE INFO
// ============================================================================

export const CC3D_STORE_INFO = {
  vendorName: 'CC3D',
  platformType: 'woocommerce',
  baseUrl: 'https://cc3dglobal.com',
  productsUrl: 'https://cc3dglobal.com/shop/',
  defaultCurrency: 'USD',
  defaultDiameter: 1.75,
  defaultWeight: 1000,
  countryOfOrigin: 'China',
  founded: 2015,
  notes: 'Chinese OEM manufacturer, "China First Manufacture of Printer Filament". Known for Silk PLA. Some products are Quote Only (B2B). No formal TDS documents available.',
};
