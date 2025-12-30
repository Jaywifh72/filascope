/**
 * NINJATEK-SPECIFIC DEFAULTS
 * 
 * NinjaTek is a premium TPU filament manufacturer specializing in flexible materials.
 * All products are TPU variants with different Shore hardness grades (75A to 75D).
 * They use WooCommerce (WordPress) so we use Firecrawl HTML scraping.
 * 
 * Product Lines:
 * - NinjaFlex 85A: Original soft TPU, excellent flexibility
 * - Edge 83A: Improved rebound/tear resistance
 * - Chinchilla 75A: Softest, skin-safe for wearables
 * - Cheetah 95A: Fastest printing, semi-flexible
 * - Armadillo 75D: Most rigid, abrasion resistant
 * - Eel 90A: Conductive TPU for electronics
 */

// ============================================================================
// PRINT SETTINGS BY PRODUCT LINE
// ============================================================================

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
  isConductive?: boolean;
  shoreHardness?: string;
  elongation?: number; // percent at break
}

export const NINJATEK_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Soft/Flexible TPU (Shore A)
  'TPU-75A': { 
    nozzleTempMin: 225, nozzleTempMax: 250, 
    bedTempMin: 0, bedTempMax: 50, 
    printSpeedMax: 35,
    shoreHardness: '75A',
    elongation: 660
  },
  'TPU-83A': { 
    nozzleTempMin: 225, nozzleTempMax: 250, 
    bedTempMin: 0, bedTempMax: 50, 
    printSpeedMax: 35,
    shoreHardness: '83A',
    elongation: 600
  },
  'TPU-85A': { 
    nozzleTempMin: 225, nozzleTempMax: 250, 
    bedTempMin: 0, bedTempMax: 50, 
    printSpeedMax: 35,
    shoreHardness: '85A',
    elongation: 660
  },
  // Medium Flex TPU
  'TPU-90A': { 
    nozzleTempMin: 225, nozzleTempMax: 250, 
    bedTempMin: 0, bedTempMax: 50, 
    printSpeedMax: 35,
    shoreHardness: '90A',
    isConductive: true, // Eel is conductive
    elongation: 530
  },
  'TPU-95A': { 
    nozzleTempMin: 225, nozzleTempMax: 250, 
    bedTempMin: 0, bedTempMax: 50, 
    printSpeedMax: 80, // Cheetah prints fast!
    shoreHardness: '95A',
    elongation: 580
  },
  // Rigid TPU (Shore D)
  'TPU-75D': { 
    nozzleTempMin: 225, nozzleTempMax: 250, 
    bedTempMin: 45, bedTempMax: 60, 
    printSpeedMax: 50,
    shoreHardness: '75D',
    elongation: 330
  },
  // Generic TPU fallback
  'TPU': { 
    nozzleTempMin: 225, nozzleTempMax: 250, 
    bedTempMin: 0, bedTempMax: 50, 
    printSpeedMax: 35
  },
};

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export const NINJATEK_MATERIAL_MAPPING: Record<string, string> = {
  // NinjaFlex 85A
  'ninjaflex 85a': 'TPU-85A',
  'ninjaflex': 'TPU-85A',
  'ninja flex': 'TPU-85A',
  
  // Edge 83A
  'edge 83a': 'TPU-83A',
  'edge': 'TPU-83A',
  
  // Chinchilla 75A
  'chinchilla 75a': 'TPU-75A',
  'chinchilla': 'TPU-75A',
  
  // Cheetah 95A
  'cheetah 95a': 'TPU-95A',
  'cheetah': 'TPU-95A',
  
  // Armadillo 75D
  'armadillo 75d': 'TPU-75D',
  'armadillo': 'TPU-75D',
  
  // Eel 90A (Conductive)
  'eel 90a': 'TPU-90A',
  'eel': 'TPU-90A',
  'conductive': 'TPU-90A',
  
  // Generic fallbacks
  'tpu': 'TPU',
  'tpe': 'TPU', // Correct mislabeling
};

export function normalizeNinjatekMaterial(title: string): string {
  if (!title) return 'TPU';
  const t = title.toLowerCase();
  
  // Sort by length (longest first) for accurate matching
  const sorted = Object.entries(NINJATEK_MATERIAL_MAPPING)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, material] of sorted) {
    if (t.includes(pattern)) {
      return material;
    }
  }
  
  return 'TPU';
}

// ============================================================================
// PRODUCT LINE EXTRACTION
// ============================================================================

export type ProductLine = 'ninjaflex' | 'edge' | 'chinchilla' | 'cheetah' | 'armadillo' | 'eel';

export function extractProductLine(title: string): ProductLine | null {
  if (!title) return null;
  const t = title.toLowerCase();
  
  if (t.includes('ninjaflex') || t.includes('ninja flex')) return 'ninjaflex';
  if (t.includes('chinchilla')) return 'chinchilla';
  if (t.includes('cheetah')) return 'cheetah';
  if (t.includes('armadillo')) return 'armadillo';
  if (t.includes('edge')) return 'edge';
  if (t.includes('eel')) return 'eel';
  
  return null;
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 'Translucent' | 'Glow' | 'Standard';

export function extractFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  const t = title.toLowerCase();
  
  // Translucent colors
  if (t.includes('water') || t.includes('translucent') || t.includes('clear')) {
    return 'Translucent';
  }
  
  // Glow in the dark
  if (t.includes('neon') && t.includes('glow')) {
    return 'Glow';
  }
  if (t.includes('glow')) {
    return 'Glow';
  }
  
  // Standard - TPU naturally has matte finish
  return 'Standard';
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

const NINJATEK_TITLE_NOISE = [
  /\s*-?\s*1\.75\s*mm/gi,
  /\s*-?\s*2\.85\s*mm/gi,
  /\s*-?\s*3\s*mm/gi,
  /\s*-?\s*0\.5\s*kg/gi,
  /\s*-?\s*1\s*kg/gi,
  /\s*-?\s*2\s*kg/gi,
  /\s*-?\s*500\s*g/gi,
  /\s*-?\s*1000\s*g/gi,
  /\s*-?\s*2000\s*g/gi,
  /TPU\s*NinjaTek/gi,
  /TPE\s*NinjaTek/gi,
  /NinjaTek\s*TPU/gi,
  /NinjaTek\s*TPE/gi,
  /3D\s*Printer\s*Filament/gi,
  /Flexible\s*Filament/gi,
  /^\s*-+\s*/,
  /\s*-+\s*$/,
];

export function cleanNinjatekTitle(title: string): string {
  if (!title) return '';
  let cleaned = title;
  
  for (const pattern of NINJATEK_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  
  return cleaned.replace(/\s+/g, ' ').trim();
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateNinjatekProductLineId(title: string, material?: string | null): string {
  const productLine = extractProductLine(title);
  const mat = material || normalizeNinjatekMaterial(title);
  
  if (productLine) {
    // Use product line for grouping
    return `ninjatek__${mat.toLowerCase()}__${productLine}`;
  }
  
  // Fallback to material-only grouping
  return `ninjatek__${mat.toLowerCase()}`;
}

// ============================================================================
// TDS URL MAPPING
// ============================================================================

export const NINJATEK_TDS_URLS: Record<string, string> = {
  'ninjaflex': 'https://ninjatek.com/wp-content/uploads/NinjaFlex-TDS.pdf',
  'edge': 'https://ninjatek.com/wp-content/uploads/Edge-TDS.pdf',
  'cheetah': 'https://ninjatek.com/wp-content/uploads/Cheetah-TDS.pdf',
  'armadillo': 'https://ninjatek.com/wp-content/uploads/Armadillo-TDS.pdf',
  'chinchilla': 'https://ninjatek.com/wp-content/uploads/Chinchilla-TDS.pdf',
  'eel': 'https://ninjatek.com/wp-content/uploads/Eel-TDS.pdf',
};

export function getNinjatekTdsUrl(title: string): string | null {
  const productLine = extractProductLine(title);
  if (productLine && NINJATEK_TDS_URLS[productLine]) {
    return NINJATEK_TDS_URLS[productLine];
  }
  return null;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const NINJATEK_COLOR_MAPPING: Record<string, string> = {
  // Core Colors (shared across product lines)
  'midnight': '1A1A1A',
  'midnight black': '1A1A1A',
  'black': '1A1A1A',
  'snow': 'F8F8F8',
  'snow white': 'F8F8F8',
  'white': 'F8F8F8',
  'steel': '71797E',
  'steel gray': '71797E',
  'steel grey': '71797E',
  'gray': '71797E',
  'grey': '71797E',
  
  // Vibrant Colors
  'fire': 'FF2E00',
  'fire red': 'FF2E00',
  'red': 'FF2E00',
  'lava': 'FF7A00',
  'lava orange': 'FF7A00',
  'orange': 'FF7A00',
  'sun': 'FFD700',
  'sun yellow': 'FFD700',
  'yellow': 'FFD700',
  'grass': '228B22',
  'grass green': '228B22',
  'green': '228B22',
  'sapphire': '0F52BA',
  'sapphire blue': '0F52BA',
  'blue': '0F52BA',
  'flamingo': 'FC8EAC',
  'flamingo pink': 'FC8EAC',
  'pink': 'FC8EAC',
  
  // Special Colors
  'neon': '39FF14',
  'neon glow': '39FF14',
  'glow': '39FF14',
  'water': 'E0F7FA',
  'water translucent': 'E0F7FA',
  'translucent': 'E0F7FA',
  'clear': 'E0F7FA',
  
  // Chinchilla-specific colors
  'sky': '87CEEB',
  'sky blue': '87CEEB',
  'silver': 'C0C0C0',
  
  // Armadillo/Cheetah colors
  'carbon': '2F2F2F',
  'carbon black': '2F2F2F',
  'bone': 'E3DAC9',
  
  // Eel (single color - conductive black)
  'eel black': '1A1A1A',
};

export function getNinjatekColorHex(colorName: string): string | null {
  if (!colorName) return null;
  const normalized = colorName.toLowerCase().trim();
  return NINJATEK_COLOR_MAPPING[normalized] || null;
}

// ============================================================================
// COLOR EXTRACTION FROM TITLE
// ============================================================================

export function extractColorFromTitle(title: string): string | null {
  if (!title) return null;
  const t = title.toLowerCase();
  
  // Try to match known colors
  const sortedColors = Object.keys(NINJATEK_COLOR_MAPPING)
    .sort((a, b) => b.length - a.length);
  
  for (const color of sortedColors) {
    if (t.includes(color)) {
      return color.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  
  return null;
}

// ============================================================================
// WEIGHT AND DIAMETER EXTRACTION
// ============================================================================

export function extractWeightKg(title: string): number {
  if (!title) return 1.0;
  const t = title.toLowerCase();
  
  // Match weight patterns
  const kgMatch = t.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) {
    return parseFloat(kgMatch[1]);
  }
  
  const gMatch = t.match(/(\d+)\s*g(?:ram)?/i);
  if (gMatch) {
    const grams = parseInt(gMatch[1], 10);
    if (grams === 500) return 0.5;
    if (grams === 1000) return 1.0;
    if (grams === 2000) return 2.0;
    return grams / 1000;
  }
  
  return 1.0; // Default
}

export function extractDiameterMm(title: string): number {
  if (!title) return 1.75;
  const t = title.toLowerCase();
  
  if (t.includes('2.85') || t.includes('3mm') || t.includes('3 mm')) {
    return 2.85;
  }
  
  return 1.75; // Default
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface NinjatekEnrichmentResult {
  material: string;
  productLine: ProductLine | null;
  finishType: FinishType;
  productLineId: string;
  tdsUrl: string | null;
  colorHex: string | null;
  colorName: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  printSpeedMax: number | null;
  isConductive: boolean;
  shoreHardness: string | null;
  weightKg: number;
  diameterMm: number;
}

export function enrichNinjatekProduct(title: string, existingMaterial?: string | null): NinjatekEnrichmentResult {
  const material = existingMaterial || normalizeNinjatekMaterial(title);
  const productLine = extractProductLine(title);
  const settings = NINJATEK_PRINT_SETTINGS[material] || NINJATEK_PRINT_SETTINGS['TPU'];
  const colorName = extractColorFromTitle(title);
  
  return {
    material,
    productLine,
    finishType: extractFinishType(title),
    productLineId: generateNinjatekProductLineId(title, material),
    tdsUrl: getNinjatekTdsUrl(title),
    colorHex: colorName ? getNinjatekColorHex(colorName) : null,
    colorName,
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    printSpeedMax: settings?.printSpeedMax || null,
    isConductive: settings?.isConductive || false,
    shoreHardness: settings?.shoreHardness || null,
    weightKg: extractWeightKg(title),
    diameterMm: extractDiameterMm(title),
  };
}
