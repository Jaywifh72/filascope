/**
 * NINJATEK-SPECIFIC DEFAULTS
 * 
 * NinjaTek is a premium TPU filament manufacturer (Fenner Precision Polymers) 
 * specializing in flexible materials with various Shore hardness grades (75A to 75D).
 * They also resell ColorFabb filaments on their store.
 * 
 * Platform: WooCommerce (WordPress) - requires Firecrawl HTML scraping
 * Currency: USD
 * Region: US-based (Pennsylvania)
 * 
 * NinjaTek Product Lines:
 * - NinjaFlex 85A: Original soft TPU, excellent flexibility (11 colors)
 * - Edge 83A: Improved rebound/tear resistance (2 colors)
 * - Chinchilla 75A: Softest, skin-safe for wearables (4 colors)
 * - Cheetah 95A: Fastest printing, semi-flexible (11 colors)
 * - Armadillo 75D: Most rigid, abrasion resistant (9 colors)
 * - Eel 90A: Conductive TPU for electronics (1 color - black)
 * 
 * ColorFabb Lines (sold via NinjaTek, tracked separately):
 * - colorFabb ASA, PA, PLA, Co-Polyester, Specials
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
  // ColorFabb materials (sold via NinjaTek)
  'ASA': {
    nozzleTempMin: 240, nozzleTempMax: 260,
    bedTempMin: 90, bedTempMax: 110,
    printSpeedMax: 50
  },
  'PA': {
    nozzleTempMin: 240, nozzleTempMax: 260,
    bedTempMin: 70, bedTempMax: 90,
    printSpeedMax: 50,
    requiresEnclosure: true
  },
  'PLA': {
    nozzleTempMin: 195, nozzleTempMax: 220,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 60
  },
  'PETG': {
    nozzleTempMin: 220, nozzleTempMax: 250,
    bedTempMin: 70, bedTempMax: 80,
    printSpeedMax: 50
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
  
  // ColorFabb materials
  'colorfabb asa': 'ASA',
  'colorfabb pa': 'PA',
  'colorfabb pla': 'PLA',
  'colorfabb co-polyester': 'PETG',
  'colorfabb co-polyesters': 'PETG',
  'colorfabb specials': 'PLA', // Metal-fill PLAs
  
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

export type NinjatekProductLine = 
  | 'ninjaflex' | 'edge' | 'chinchilla' | 'cheetah' | 'armadillo' | 'eel'
  | 'colorfabb-asa' | 'colorfabb-pa' | 'colorfabb-pla' | 'colorfabb-co-polyesters' | 'colorfabb-specials';

export function extractProductLine(title: string): NinjatekProductLine | null {
  if (!title) return null;
  const t = title.toLowerCase();
  
  // ColorFabb products first (more specific)
  if (t.includes('colorfabb') || t.includes('color fabb')) {
    if (t.includes('asa')) return 'colorfabb-asa';
    if (t.includes('pa') || t.includes('nylon')) return 'colorfabb-pa';
    if (t.includes('pla')) return 'colorfabb-pla';
    if (t.includes('co-polyester') || t.includes('copolyester')) return 'colorfabb-co-polyesters';
    if (t.includes('special')) return 'colorfabb-specials';
  }
  
  // NinjaTek TPU products
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

export type FinishType = 'Translucent' | 'Glow' | 'Standard' | 'Metallic';

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
  
  // Metallic (ColorFabb fills)
  if (t.includes('fill') && (t.includes('bronze') || t.includes('copper') || t.includes('steel') || t.includes('gold'))) {
    return 'Metallic';
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
  /3D\s*Printer\s*Filament[s]?/gi,
  /3D\s*Printing\s*Filament[s]?/gi,
  /Flexible\s*Filament/gi,
  /Please\s*Note:.*discontinued.*inventory\./gi, // Armadillo discontinuation notice
  /\(\d+[AD]\)/gi, // Shore hardness like (85A) or (75D)
  /^\s*-+\s*/,
  /\s*-+\s*$/,
];

export function cleanNinjatekTitle(title: string): string {
  if (!title) return '';
  let cleaned = title;
  
  for (const pattern of NINJATEK_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  
  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove trailing dashes from title
  cleaned = cleaned.replace(/\s*-+\s*$/, '').trim();
  
  return cleaned;
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateNinjatekProductLineId(title: string, material?: string | null): string {
  const productLine = extractProductLine(title);
  const mat = material || normalizeNinjatekMaterial(title);
  
  if (productLine) {
    // Use product line for grouping - no color suffixes
    return `ninjatek__${mat.toLowerCase().replace(/-/g, '_')}__${productLine}`;
  }
  
  // Fallback to material-only grouping
  return `ninjatek__${mat.toLowerCase().replace(/-/g, '_')}`;
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
  // ColorFabb TDS URLs would be different - they're hosted on ColorFabb's site
};

export function getNinjatekTdsUrl(title: string): string | null {
  const productLine = extractProductLine(title);
  if (productLine && NINJATEK_TDS_URLS[productLine]) {
    return NINJATEK_TDS_URLS[productLine];
  }
  return null;
}

// ============================================================================
// COLOR MAPPING - Comprehensive for all NinjaTek + ColorFabb colors
// ============================================================================

export const NINJATEK_COLOR_MAPPING: Record<string, string> = {
  // === NinjaTek Core Colors (shared across product lines) ===
  'midnight black': '1A1A1A',
  'midnight': '1A1A1A',
  'black': '1A1A1A',
  
  'snow white': 'F8F8F8',
  'snow': 'F8F8F8',
  'white': 'F8F8F8',
  
  'steel gray': '71797E',
  'steel grey': '71797E',
  'steel': '71797E',
  'gray': '71797E',
  'grey': '71797E',
  
  // === Vibrant Colors ===
  'fire red': 'FF2E00',
  'fire': 'FF2E00',
  'red': 'FF2E00',
  
  'lava orange': 'FF7A00',
  'lava': 'FF7A00',
  'orange': 'FF7A00',
  
  'sun yellow': 'FFD700',
  'sun': 'FFD700',
  'yellow': 'FFD700',
  
  'grass green': '228B22',
  'grass': '228B22',
  'green': '228B22',
  
  'sapphire blue': '0F52BA',
  'sapphire': '0F52BA',
  'blue': '0F52BA',
  
  'flamingo pink': 'FC8EAC',
  'flamingo': 'FC8EAC',
  'pink': 'FC8EAC',
  
  // === Special Colors ===
  'neon glow': '39FF14',
  'neon': '39FF14',
  'glow': '39FF14',
  
  'water translucent': 'E0F7FA',
  'water': 'E0F7FA',
  'translucent': 'E0F7FA',
  'clear': 'E0F7FA',
  
  // === Chinchilla-specific colors ===
  'sky blue': '87CEEB',
  'sky': '87CEEB',
  
  'silver': 'C0C0C0',
  
  // === Armadillo/Cheetah colors ===
  'carbon black': '2F2F2F',
  'carbon': '2F2F2F',
  
  'bone': 'E3DAC9',
  
  // === ColorFabb Colors ===
  'natural': 'DEB887',
  'dutch orange': 'FF6600',
  'gray silver': 'A8A9AD',
  'grey silver': 'A8A9AD',
  'leaf green': '4CBB17',
  'shining silver': 'C0C0C0',
  'signal yellow': 'FFE135',
  
  // ColorFabb Co-Polyester colors
  'carbon gray': '3C3C3C',
  'carbon grey': '3C3C3C',
  'dark blue': '00008B',
  'dark gray': '404040',
  'dark grey': '404040',
  'dark green': '006400',
  'gold metalic': 'D4AF37',  // Note: typo in source CSV
  'gold metallic': 'D4AF37',
  'gray metalic': '8B8B83',
  'grey metalic': '8B8B83',
  'gray metallic': '8B8B83',
  'grey metallic': '8B8B83',
  'light blue': 'ADD8E6',
  'light green': '90EE90',
  
  // ColorFabb Specials
  'bronzefill': 'CD7F32',
  'copperfill': 'B87333',
  'glowfill': '98FF98',
  'steelfill': '71797E',
  'woodfill': '8B4513',
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
  
  // Try to match known colors - longest first for precision
  const sortedColors = Object.keys(NINJATEK_COLOR_MAPPING)
    .sort((a, b) => b.length - a.length);
  
  for (const color of sortedColors) {
    if (t.includes(color)) {
      // Title case the color
      return color.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  
  return null;
}

// ============================================================================
// WEIGHT AND DIAMETER EXTRACTION
// ============================================================================

export function extractWeightKg(title: string): number {
  if (!title) return 0.5; // NinjaTek default is 0.5kg
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
  
  return 0.5; // Default for NinjaTek
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
// VARIANT FILTERING FOR NINJATEK
// ============================================================================

export interface NinjatekFilterResult {
  include: boolean;
  reason?: string;
}

export function shouldIncludeNinjatekVariant(
  colorOrVariant: string,
  diameterMm: number = 1.75,
  weightKg: number = 0.5
): NinjatekFilterResult {
  const v = colorOrVariant.toLowerCase();
  
  // EXCLUDE: 2.85mm/3mm diameter variants (per requirements)
  if (diameterMm >= 2.85 || v.includes('3mm') || v.includes('2.85')) {
    return { include: false, reason: 'excluded_285mm_diameter' };
  }
  
  // EXCLUDE: Bulk products (>5.5kg)
  if (weightKg > 5.5) {
    return { include: false, reason: 'excluded_bulk_weight' };
  }
  
  // EXCLUDE: Sample products (<300g = 0.3kg)
  if (weightKg < 0.3) {
    return { include: false, reason: 'excluded_sample_size' };
  }
  
  // EXCLUDE: Non-color entries (like "1.75mm" or "3mm" in color field)
  if (/^\d+\.?\d*\s*(mm|kg|g)$/i.test(v)) {
    return { include: false, reason: 'excluded_dimension_as_color' };
  }
  
  return { include: true };
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface NinjatekEnrichmentResult {
  material: string;
  productLine: NinjatekProductLine | null;
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

export function enrichNinjatekProduct(
  title: string, 
  color?: string | null,
  existingMaterial?: string | null
): NinjatekEnrichmentResult {
  const material = existingMaterial || normalizeNinjatekMaterial(title);
  const productLine = extractProductLine(title);
  const settings = NINJATEK_PRINT_SETTINGS[material] || NINJATEK_PRINT_SETTINGS['TPU'];
  
  // Use provided color or extract from title
  const colorName = color || extractColorFromTitle(title);
  const colorHex = colorName ? getNinjatekColorHex(colorName) : null;
  
  return {
    material,
    productLine,
    finishType: extractFinishType(colorName || title),
    productLineId: generateNinjatekProductLineId(title, material),
    tdsUrl: getNinjatekTdsUrl(title),
    colorHex: colorHex ? `#${colorHex}` : null,
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

// ============================================================================
// CSV SEED DATA STRUCTURE
// ============================================================================

export interface NinjatekSeedRow {
  material: string;
  filamentName: string;
  filamentUrl: string;
  filamentColor: string;
  productImage: string;
  hexCode: string;
}

export function parseNinjatekCsvRow(row: string[]): NinjatekSeedRow | null {
  if (row.length < 4) return null;
  
  const [material, filamentName, filamentUrl, filamentColor, productImage, hexCode] = row;
  
  // Skip header row
  if (material === 'Material') return null;
  
  return {
    material: material?.trim() || '',
    filamentName: filamentName?.trim() || '',
    filamentUrl: filamentUrl?.trim() || '',
    filamentColor: filamentColor?.trim() || '',
    productImage: productImage?.trim() || '',
    hexCode: hexCode?.trim() || 'N/A',
  };
}

// ============================================================================
// EXPECTED PRODUCT LINE COUNT
// ============================================================================

// Based on CSV analysis:
// NinjaTek TPU: NinjaFlex (11 colors), Edge (2), Chinchilla (4), Eel (2 - but 1 is 3mm), Cheetah (11), Armadillo (9)
// ColorFabb: ASA (2), PA (2 - but diameter options), PLA (12), Co-Polyester (14), Specials (7)
// After filtering 2.85mm/3mm: ~10 product lines expected for NinjaTek-only
export const NINJATEK_EXPECTED_PRODUCT_LINES = 10; // 6 NinjaTek + 4 ColorFabb after 3mm filtering

// Products per line (for validation)
export const NINJATEK_EXPECTED_COLORS: Record<string, number> = {
  'ninjaflex': 11, // Fire Red, Flamingo Pink, Grass Green, Lava Orange, Midnight Black, Neon Glow, Sapphire Blue, Snow White, Steel Gray, Sun Yellow, Water Translucent
  'edge': 2,       // Midnight Black, Snow White
  'chinchilla': 4, // Midnight Black, Sky Blue, Snow White, Steel Gray
  'cheetah': 11,   // Same colors as NinjaFlex
  'armadillo': 9,  // Fire Red, Grass Green, Lava Orange, Midnight Black, Sapphire Blue, Snow White, Steel Gray, Sun Yellow, Water Translucent
  'eel': 1,        // Only 1.75mm has 1 color (after filtering 3mm)
  'colorfabb-asa': 2,
  'colorfabb-pla': 12,
  'colorfabb-co-polyesters': 14,
  'colorfabb-specials': 7,
};
