/**
 * NUMAKERS-SPECIFIC DEFAULTS
 * 
 * Numakers is a US-based filament brand with a focus on vibrant colors.
 * They use Shopify and offer PLA variants (Matte, Silk, Marble, Glow, Wood, CF, Starlight),
 * PETG-HS (high-speed), ASA, and ABS.
 * 
 * Key Features:
 * - Wide color selection with creative names (Thanos Purple, Ryobix Green)
 * - High-speed PETG (PETG-HS)
 * - PLA Starlight (glitter finish)
 * - No TDS PDFs - uses "Cheat Sheets" for slicer settings
 * - 1kg spools standard, some 3kg bulk options
 */

// ============================================================================
// PRINT SETTINGS BY MATERIAL
// ============================================================================

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
  fanMin?: number;
  fanMax?: number;
}

export const NUMAKERS_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // PLA Variants
  'PLA+': {
    nozzleTempMin: 200, nozzleTempMax: 220,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 100,
    fanMin: 100, fanMax: 100
  },
  'PLA': {
    nozzleTempMin: 200, nozzleTempMax: 220,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 100
  },
  'PLA-MATTE': {
    nozzleTempMin: 200, nozzleTempMax: 220,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 80
  },
  'PLA-SILK': {
    nozzleTempMin: 205, nozzleTempMax: 225,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 60 // Slower for best silk finish
  },
  'PLA-MARBLE': {
    nozzleTempMin: 200, nozzleTempMax: 220,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 80
  },
  'PLA-GLOW': {
    nozzleTempMin: 200, nozzleTempMax: 220,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 60,
    isAbrasive: true // Glow particles can wear nozzle
  },
  'PLA-WOOD': {
    nozzleTempMin: 190, nozzleTempMax: 210,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 50,
    isAbrasive: true
  },
  'PLA-STARLIGHT': {
    nozzleTempMin: 200, nozzleTempMax: 220,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 80
  },
  'PLA-CF': {
    nozzleTempMin: 210, nozzleTempMax: 230,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 60,
    isAbrasive: true
  },
  // PETG
  'PETG': {
    nozzleTempMin: 230, nozzleTempMax: 250,
    bedTempMin: 70, bedTempMax: 80,
    printSpeedMax: 60
  },
  'PETG-HS': {
    nozzleTempMin: 230, nozzleTempMax: 250,
    bedTempMin: 70, bedTempMax: 80,
    printSpeedMax: 150 // High-speed variant
  },
  'PETG-TRANSLUCENT': {
    nozzleTempMin: 230, nozzleTempMax: 250,
    bedTempMin: 70, bedTempMax: 80,
    printSpeedMax: 60
  },
  // Engineering
  'ASA': {
    nozzleTempMin: 240, nozzleTempMax: 260,
    bedTempMin: 90, bedTempMax: 110,
    printSpeedMax: 60,
    requiresEnclosure: true
  },
  'ABS': {
    nozzleTempMin: 230, nozzleTempMax: 250,
    bedTempMin: 90, bedTempMax: 110,
    printSpeedMax: 60,
    requiresEnclosure: true
  },
};

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export const NUMAKERS_MATERIAL_MAPPING: Record<string, string> = {
  // PLA variants
  'pla+': 'PLA+',
  'pla plus': 'PLA+',
  'pla+ filament': 'PLA+',
  'pla filament': 'PLA+',
  'pla matte': 'PLA-MATTE',
  'matte pla': 'PLA-MATTE',
  'pla silk': 'PLA-SILK',
  'silk pla': 'PLA-SILK',
  'tri-color silk': 'PLA-SILK',
  'tri-color silk pla': 'PLA-SILK',
  'pla marble': 'PLA-MARBLE',
  'marble pla': 'PLA-MARBLE',
  'pla glow': 'PLA-GLOW',
  'pla glow in the dark': 'PLA-GLOW',
  'glow in the dark': 'PLA-GLOW',
  'pla wood': 'PLA-WOOD',
  'wood pla': 'PLA-WOOD',
  'pla starlight': 'PLA-STARLIGHT',
  'starlight': 'PLA-STARLIGHT',
  'pla-cf': 'PLA-CF',
  'pla cf': 'PLA-CF',
  'carbon fiber pla': 'PLA-CF',
  // PETG variants
  'petg-hs': 'PETG-HS',
  'petg hs': 'PETG-HS',
  'petg-hs filament': 'PETG-HS',
  'petg high speed': 'PETG-HS',
  'petg translucent': 'PETG-TRANSLUCENT',
  'petg': 'PETG',
  // Engineering
  'asa': 'ASA',
  'asa filament': 'ASA',
  'abs': 'ABS',
  'abs filament': 'ABS',
};

export function normalizeNumakersMaterial(title: string): string {
  if (!title) return 'PLA+';
  const t = title.toLowerCase();
  
  // Sort by length (longest first) for accurate matching
  const sorted = Object.entries(NUMAKERS_MATERIAL_MAPPING)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, material] of sorted) {
    if (t.includes(pattern)) {
      return material;
    }
  }
  
  // Fallback detection
  if (t.includes('petg')) return 'PETG';
  if (t.includes('asa')) return 'ASA';
  if (t.includes('abs')) return 'ABS';
  if (t.includes('pla')) return 'PLA+';
  
  return 'PLA+';
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 'Matte' | 'Silk' | 'Marble' | 'Glow' | 'Wood' | 'Starlight' | 'Carbon' | 'Translucent' | 'Standard';

export function extractFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  const t = title.toLowerCase();
  
  if (t.includes('matte')) return 'Matte';
  if (t.includes('silk')) return 'Silk';
  if (t.includes('marble')) return 'Marble';
  if (t.includes('glow')) return 'Glow';
  if (t.includes('wood')) return 'Wood';
  if (t.includes('starlight')) return 'Starlight';
  if (t.includes('cf') || t.includes('carbon')) return 'Carbon';
  if (t.includes('translucent')) return 'Translucent';
  
  return 'Standard';
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

const NUMAKERS_TITLE_NOISE = [
  /\s*-?\s*1\.75\s*mm/gi,
  /\s*-?\s*1\s*kg/gi,
  /\s*-?\s*3\s*kg/gi,
  /\s*-?\s*1000\s*g/gi,
  /\s*-?\s*3000\s*g/gi,
  /3D\s*Printing\s*Filament/gi,
  /3D\s*Printer\s*Filament/gi,
  /Filament$/gi,
  /Numakers\s*/gi,
  /\s*\|\s*Explore.*$/gi,
  /^\s*-+\s*/,
  /\s*-+\s*$/,
];

export function cleanNumakersTitle(title: string): string {
  if (!title) return '';
  let cleaned = title;
  
  for (const pattern of NUMAKERS_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  
  return cleaned.replace(/\s+/g, ' ').trim();
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateNumakersProductLineId(title: string, material?: string | null): string {
  const mat = material || normalizeNumakersMaterial(title);
  const finish = extractFinishType(title);
  
  // Check for tri-color
  const t = title.toLowerCase();
  if (t.includes('tri-color') || t.includes('tri color') || t.includes('tricolor')) {
    return `numakers__pla-silk__tricolor`;
  }
  
  // Base material grouping
  const baseMat = mat.toLowerCase().replace(/-/g, '_');
  
  if (finish !== 'Standard') {
    return `numakers__${baseMat}`;
  }
  
  return `numakers__${baseMat}`;
}

// ============================================================================
// CHEAT SHEET URLS (instead of TDS)
// ============================================================================

export const NUMAKERS_CHEAT_SHEETS: Record<string, { cura: string; prusa: string; bambu?: string }> = {
  'PLA+': {
    cura: 'https://numakers.com/blogs/news/pla-plus-cura-settings',
    prusa: 'https://numakers.com/blogs/news/pla-plus-prusaslicer',
    bambu: 'https://numakers.com/blogs/news/pla-plus-bambu-studio'
  },
  'PLA-CF': {
    cura: 'https://numakers.com/blogs/news/pla-cf-cura',
    prusa: 'https://numakers.com/blogs/news/pla-cf-prusaslicer',
    bambu: 'https://numakers.com/blogs/news/pla-cf-bambu-studio'
  },
  'PETG': {
    cura: 'https://numakers.com/blogs/news/petg-cura',
    prusa: 'https://numakers.com/blogs/news/petg-prusaslicer'
  },
  'PETG-HS': {
    cura: 'https://numakers.com/blogs/news/petg-cura',
    prusa: 'https://numakers.com/blogs/news/petg-prusaslicer'
  },
  'ASA': {
    cura: 'https://numakers.com/blogs/news/asa-cura',
    prusa: 'https://numakers.com/blogs/news/asa-prusaslicer',
    bambu: 'https://numakers.com/blogs/news/asa-bambu-studio'
  },
  'PLA-SILK': {
    cura: 'https://numakers.com/blogs/news/pla-silk-cura',
    prusa: 'https://numakers.com/blogs/news/pla-silk-prusaslicer'
  },
  'ABS': {
    cura: 'https://numakers.com/blogs/news/abs-filament-cura',
    prusa: 'https://numakers.com/blogs/news/abs-filament-prusaslicer'
  },
};

export function getNumakersCheatSheet(material: string): string | null {
  const sheets = NUMAKERS_CHEAT_SHEETS[material];
  if (sheets) {
    // Return Cura as primary link (most common slicer)
    return sheets.cura;
  }
  return null;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const NUMAKERS_COLOR_MAPPING: Record<string, string> = {
  // Blacks & Whites
  'pitch black': '1A1A1A',
  'black': '1A1A1A',
  'pure white': 'FFFFFF',
  'white': 'FFFFFF',
  'cool white': 'F5F5F5',
  'ivory': 'FFFFF0',
  
  // Grays
  'light gray': 'D3D3D3',
  'light grey': 'D3D3D3',
  'dark gray': '4A4A4A',
  'dark grey': '4A4A4A',
  'midnight gray': '2F2F2F',
  'midnight grey': '2F2F2F',
  'simply silver': 'C0C0C0',
  'silver': 'C0C0C0',
  
  // Reds & Pinks
  'nuclear red': 'FF2400',
  'red': 'FF0000',
  'imperial red': 'ED2939',
  'atomic pink': 'FF6EC7',
  'pink': 'FFC0CB',
  'magenta': 'FF00FF',
  
  // Oranges
  'outrageous orange': 'FF6600',
  'orange': 'FFA500',
  'fluorescent orange': 'FF5F1F',
  
  // Yellows
  'lemon yellow': 'FFF44F',
  'yellow': 'FFFF00',
  'bahama yellow': 'FFD700',
  'fluorescent yellow': 'CCFF00',
  
  // Greens
  'grass green': '7CFC00',
  'green': '00FF00',
  'army green': '4B5320',
  'forest green': '228B22',
  'fluorescent green': '39FF14',
  'ryobix green': '9ACD32', // Ryobi tool green
  
  // Blues
  'royal blue': '4169E1',
  'blue': '0000FF',
  'light blue': 'ADD8E6',
  'teal blue': '008080',
  'lagoon blue': '009DC4',
  
  // Purples
  'mauve purple': 'E0B0FF',
  'purple': '800080',
  'thanos purple': '663399', // Marvel reference
  'lavender violet': 'B57EDC',
  
  // Browns & Tans
  'beige brown': 'D2B48C',
  'biege brown': 'D2B48C', // Common typo
  'chocolate brown': 'D2691E',
  'rust copper': 'B87333',
  'military khaki': 'BDB76B',
  'khaki': 'BDB76B',
  
  // Skin Tones
  'apricot skin': 'FBCEB1',
  
  // Transparent/Clear
  'transparent': 'E8E8E8',
  'clear': 'E8E8E8',
};

export function getNumakersColorHex(colorName: string): string | null {
  if (!colorName) return null;
  const normalized = colorName.toLowerCase().trim();
  return NUMAKERS_COLOR_MAPPING[normalized] || null;
}

// ============================================================================
// COLOR EXTRACTION FROM TITLE
// ============================================================================

export function extractColorFromTitle(title: string): string | null {
  if (!title) return null;
  const t = title.toLowerCase();
  
  // Try to match known colors (longest first)
  const sortedColors = Object.keys(NUMAKERS_COLOR_MAPPING)
    .sort((a, b) => b.length - a.length);
  
  for (const color of sortedColors) {
    if (t.includes(color)) {
      return color.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  
  return null;
}

// ============================================================================
// WEIGHT EXTRACTION
// ============================================================================

export function extractWeightKg(title: string): number {
  if (!title) return 1.0;
  const t = title.toLowerCase();
  
  if (t.includes('3kg') || t.includes('3 kg') || t.includes('3000g')) return 3.0;
  if (t.includes('500g') || t.includes('0.5kg')) return 0.5;
  
  return 1.0; // Default
}

// ============================================================================
// SHOPIFY PRODUCT FILTER
// ============================================================================

export function isFilamentProduct(product: { title?: string; product_type?: string; tags?: string[] }): boolean {
  const title = product.title?.toLowerCase() || '';
  const productType = product.product_type?.toLowerCase() || '';
  
  // Exclude non-filament products
  if (title.includes('tee') || title.includes('t-shirt') || title.includes('shirt')) return false;
  if (title.includes('build plate')) return false;
  if (title.includes('nubox') && title.includes('subscription')) return false;
  if (title.includes('hueforge') && title.includes('pack')) return false;
  if (productType.includes('apparel') || productType.includes('merchandise')) return false;
  
  // Must contain filament-related terms
  if (title.includes('filament')) return true;
  if (title.includes('pla') || title.includes('petg') || title.includes('abs') || title.includes('asa')) return true;
  
  return false;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface NumakersEnrichmentResult {
  material: string;
  finishType: FinishType;
  productLineId: string;
  cheatSheetUrl: string | null;
  colorHex: string | null;
  colorName: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  printSpeedMax: number | null;
  requiresEnclosure: boolean;
  isAbrasive: boolean;
  weightKg: number;
}

export function enrichNumakersProduct(title: string, existingMaterial?: string | null): NumakersEnrichmentResult {
  const material = existingMaterial || normalizeNumakersMaterial(title);
  const settings = NUMAKERS_PRINT_SETTINGS[material] || NUMAKERS_PRINT_SETTINGS['PLA+'];
  const colorName = extractColorFromTitle(title);
  
  return {
    material,
    finishType: extractFinishType(title),
    productLineId: generateNumakersProductLineId(title, material),
    cheatSheetUrl: getNumakersCheatSheet(material),
    colorHex: colorName ? getNumakersColorHex(colorName) : null,
    colorName,
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    printSpeedMax: settings?.printSpeedMax || null,
    requiresEnclosure: settings?.requiresEnclosure || false,
    isAbrasive: settings?.isAbrasive || false,
    weightKg: extractWeightKg(title),
  };
}
