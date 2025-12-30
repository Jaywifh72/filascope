/**
 * Prusament Brand-Specific Defaults
 * 
 * Centralized configuration for Prusament filament sync pipeline.
 * Prusament uses a custom WordPress/WooCommerce store at prusa3d.com.
 */

// ============================================================================
// PRINT SETTINGS BY MATERIAL
// ============================================================================

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  fanMin?: number;
  fanMax?: number;
  printSpeedMax?: number;
  dryingTemp?: number;
  dryingTime?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
}

export const PRUSAMENT_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Standard PLA variants
  'pla': {
    nozzleTempMin: 210,
    nozzleTempMax: 220,
    bedTempMin: 50,
    bedTempMax: 60,
    fanMin: 50,
    fanMax: 100,
    printSpeedMax: 200,
    dryingTemp: 45,
    dryingTime: 4,
  },
  'pla-premium': {
    nozzleTempMin: 210,
    nozzleTempMax: 225,
    bedTempMin: 50,
    bedTempMax: 60,
    fanMin: 50,
    fanMax: 100,
    printSpeedMax: 200,
    dryingTemp: 45,
    dryingTime: 4,
  },
  'pla-blend': {
    nozzleTempMin: 215,
    nozzleTempMax: 230,
    bedTempMin: 50,
    bedTempMax: 60,
    fanMin: 50,
    fanMax: 100,
    printSpeedMax: 150,
    dryingTemp: 45,
    dryingTime: 4,
  },
  'rpla': {
    nozzleTempMin: 210,
    nozzleTempMax: 220,
    bedTempMin: 50,
    bedTempMax: 60,
    fanMin: 50,
    fanMax: 100,
    printSpeedMax: 200,
    dryingTemp: 45,
    dryingTime: 4,
  },
  // PETG variants
  'petg': {
    nozzleTempMin: 230,
    nozzleTempMax: 250,
    bedTempMin: 80,
    bedTempMax: 90,
    fanMin: 20,
    fanMax: 50,
    printSpeedMax: 150,
    dryingTemp: 65,
    dryingTime: 4,
  },
  'petg-cf': {
    nozzleTempMin: 250,
    nozzleTempMax: 270,
    bedTempMin: 80,
    bedTempMax: 90,
    fanMin: 20,
    fanMax: 50,
    printSpeedMax: 100,
    dryingTemp: 65,
    dryingTime: 6,
    isAbrasive: true,
  },
  // Engineering materials
  'asa': {
    nozzleTempMin: 250,
    nozzleTempMax: 260,
    bedTempMin: 100,
    bedTempMax: 110,
    fanMin: 0,
    fanMax: 30,
    printSpeedMax: 100,
    dryingTemp: 65,
    dryingTime: 4,
    requiresEnclosure: true,
  },
  'pc': {
    nozzleTempMin: 265,
    nozzleTempMax: 275,
    bedTempMin: 100,
    bedTempMax: 110,
    fanMin: 0,
    fanMax: 30,
    printSpeedMax: 80,
    dryingTemp: 80,
    dryingTime: 8,
    requiresEnclosure: true,
  },
  'pa11-cf': {
    nozzleTempMin: 260,
    nozzleTempMax: 280,
    bedTempMin: 80,
    bedTempMax: 100,
    fanMin: 0,
    fanMax: 30,
    printSpeedMax: 80,
    dryingTemp: 80,
    dryingTime: 12,
    requiresEnclosure: true,
    isAbrasive: true,
  },
  'pp-cf': {
    nozzleTempMin: 235,
    nozzleTempMax: 250,
    bedTempMin: 85,
    bedTempMax: 100,
    fanMin: 0,
    fanMax: 50,
    printSpeedMax: 80,
    dryingTemp: 60,
    dryingTime: 6,
    isAbrasive: true,
  },
  'pp-gf': {
    nozzleTempMin: 235,
    nozzleTempMax: 250,
    bedTempMin: 85,
    bedTempMax: 100,
    fanMin: 0,
    fanMax: 50,
    printSpeedMax: 80,
    dryingTemp: 60,
    dryingTime: 6,
    isAbrasive: true,
  },
  // Flexible
  'tpu': {
    nozzleTempMin: 220,
    nozzleTempMax: 240,
    bedTempMin: 50,
    bedTempMax: 60,
    fanMin: 20,
    fanMax: 50,
    printSpeedMax: 40,
    dryingTemp: 55,
    dryingTime: 8,
  },
};

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export const PRUSAMENT_MATERIAL_MAPPING: Record<string, string> = {
  // PLA variants
  'pla': 'PLA',
  'prusament pla': 'PLA',
  'premium pla': 'PLA',
  'pla premium': 'PLA',
  'pla blend': 'PLA',
  'rpla': 'rPLA',
  'r-pla': 'rPLA',
  'recycled pla': 'rPLA',
  // PETG
  'petg': 'PETG',
  'prusament petg': 'PETG',
  'petg cf': 'PETG-CF',
  'petg carbon fiber': 'PETG-CF',
  'petg carbon': 'PETG-CF',
  // Engineering
  'asa': 'ASA',
  'prusament asa': 'ASA',
  'pc blend': 'PC',
  'pc': 'PC',
  'polycarbonate': 'PC',
  'pa11 cf': 'PA11-CF',
  'pa11 carbon fiber': 'PA11-CF',
  'pa11': 'PA11-CF',
  'pp cf': 'PP-CF',
  'pp carbon fiber': 'PP-CF',
  'pp gf': 'PP-GF',
  'pp glass fiber': 'PP-GF',
  // Flexible
  'tpu 95a': 'TPU-95A',
  'tpu': 'TPU-95A',
  'prusament tpu': 'TPU-95A',
};

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 
  | 'Standard' 
  | 'Glitter' 
  | 'Metallic' 
  | 'Shimmer' 
  | 'Translucent' 
  | 'Fluorescent' 
  | 'Carbon' 
  | 'Filled';

export function extractPrusamentFinishType(title: string, material?: string | null): FinishType {
  const titleLower = title.toLowerCase();
  const materialLower = (material || '').toLowerCase();
  
  // Carbon fiber / glass fiber
  if (titleLower.includes('carbon fiber') || titleLower.includes(' cf') || 
      materialLower.includes('cf') || materialLower.includes('carbon')) {
    return 'Carbon';
  }
  if (titleLower.includes('glass fiber') || titleLower.includes(' gf') || 
      materialLower.includes('gf')) {
    return 'Filled';
  }
  
  // Galaxy colors have glitter
  if (titleLower.includes('galaxy')) {
    return 'Glitter';
  }
  
  // Blend / Viva La / Royal are metallic
  if (titleLower.includes('blend') || titleLower.includes('viva la') || 
      titleLower.includes('royal') || titleLower.includes('bronze')) {
    return 'Metallic';
  }
  
  // Mystic is shimmer
  if (titleLower.includes('mystic')) {
    return 'Shimmer';
  }
  
  // Opal is translucent
  if (titleLower.includes('opal') || titleLower.includes('clear') || 
      titleLower.includes('transparent') || titleLower.includes('natural')) {
    return 'Translucent';
  }
  
  // Neon is fluorescent
  if (titleLower.includes('neon') || titleLower.includes('fluorescent')) {
    return 'Fluorescent';
  }
  
  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export interface ProductLineResult {
  productLineId: string;
  settingsKey: string;
}

export function generatePrusamentProductLineId(
  title: string, 
  material?: string | null
): ProductLineResult {
  const titleLower = title.toLowerCase();
  const materialNorm = normalizePrusamentMaterial(title, material);
  
  // Determine base material key for settings
  let settingsKey = 'pla';
  let subLine = 'standard';
  
  switch (materialNorm) {
    case 'PLA':
      settingsKey = 'pla';
      if (titleLower.includes('premium') || titleLower.includes('mystic')) {
        subLine = 'premium';
        settingsKey = 'pla-premium';
      } else if (titleLower.includes('blend') || titleLower.includes('viva la') || 
                 titleLower.includes('royal') || titleLower.includes('galaxy')) {
        subLine = 'blend';
        settingsKey = 'pla-blend';
      }
      break;
    case 'rPLA':
      settingsKey = 'rpla';
      subLine = 'recycled';
      break;
    case 'PETG':
      settingsKey = 'petg';
      break;
    case 'PETG-CF':
      settingsKey = 'petg-cf';
      subLine = 'carbon';
      break;
    case 'ASA':
      settingsKey = 'asa';
      break;
    case 'PC':
      settingsKey = 'pc';
      subLine = 'blend';
      break;
    case 'PA11-CF':
      settingsKey = 'pa11-cf';
      subLine = 'carbon';
      break;
    case 'PP-CF':
      settingsKey = 'pp-cf';
      subLine = 'carbon';
      break;
    case 'PP-GF':
      settingsKey = 'pp-gf';
      subLine = 'glass';
      break;
    case 'TPU-95A':
      settingsKey = 'tpu';
      break;
  }
  
  const materialSlug = materialNorm.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const productLineId = `prusament__${materialSlug}__${subLine}`;
  
  return { productLineId, settingsKey };
}

// ============================================================================
// MATERIAL NORMALIZATION FUNCTION
// ============================================================================

export function normalizePrusamentMaterial(title: string, existingMaterial?: string | null): string {
  const titleLower = title.toLowerCase();
  
  // Check title patterns first (more specific)
  if (titleLower.includes('pa11') || titleLower.includes('pa 11')) {
    return 'PA11-CF';
  }
  if (titleLower.includes('pp') && titleLower.includes('cf')) {
    return 'PP-CF';
  }
  if (titleLower.includes('pp') && titleLower.includes('gf')) {
    return 'PP-GF';
  }
  if (titleLower.includes('petg') && (titleLower.includes('cf') || titleLower.includes('carbon'))) {
    return 'PETG-CF';
  }
  if (titleLower.includes('pc blend') || titleLower.includes('polycarbonate')) {
    return 'PC';
  }
  if (titleLower.includes('rpla') || titleLower.includes('r-pla') || titleLower.includes('recycled')) {
    return 'rPLA';
  }
  if (titleLower.includes('tpu')) {
    return 'TPU-95A';
  }
  if (titleLower.includes('asa')) {
    return 'ASA';
  }
  if (titleLower.includes('petg')) {
    return 'PETG';
  }
  if (titleLower.includes('pla')) {
    return 'PLA';
  }
  
  // Fall back to existing material if provided
  if (existingMaterial) {
    const materialLower = existingMaterial.toLowerCase().trim();
    return PRUSAMENT_MATERIAL_MAPPING[materialLower] || existingMaterial;
  }
  
  return 'PLA'; // Default
}

// ============================================================================
// TDS URL MAPPING
// ============================================================================

export const PRUSAMENT_TDS_URLS: Record<string, string> = {
  'pla': 'https://prusament.com/media/datasheet/Prusament_PLA_TDS_EN.pdf',
  'pla-premium': 'https://prusament.com/media/datasheet/Prusament_PLA_TDS_EN.pdf',
  'pla-blend': 'https://prusament.com/media/datasheet/Prusament_PLA_TDS_EN.pdf',
  'rpla': 'https://prusament.com/media/datasheet/Prusament_rPLA_TDS_EN.pdf',
  'petg': 'https://prusament.com/media/datasheet/Prusament_PETG_TDS_EN.pdf',
  'petg-cf': 'https://prusament.com/media/datasheet/Prusament_PETG_CF_TDS_EN.pdf',
  'asa': 'https://prusament.com/media/datasheet/Prusament_ASA_TDS_EN.pdf',
  'pc': 'https://prusament.com/media/datasheet/Prusament_PC_Blend_TDS_EN.pdf',
  'pa11-cf': 'https://prusament.com/media/datasheet/Prusament_PA11CF_TDS_EN.pdf',
  'pp-cf': 'https://prusament.com/media/datasheet/Prusament_PPCF_TDS_EN.pdf',
  'pp-gf': 'https://prusament.com/media/datasheet/Prusament_PPGF_TDS_EN.pdf',
  'tpu': 'https://prusament.com/media/datasheet/Prusament_TPU_TDS_EN.pdf',
};

export function getPrusamentTdsUrl(settingsKey: string): string {
  return PRUSAMENT_TDS_URLS[settingsKey] || PRUSAMENT_TDS_URLS['pla'];
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const PRUSAMENT_COLOR_MAPPING: Record<string, string> = {
  // Blacks
  'jet black': '#1A1A1A',
  'galaxy black': '#0D0D0D',
  'black': '#1A1A1A',
  // Whites
  'signal white': '#F5F5F5',
  'white': '#FFFFFF',
  // Oranges (Prusa signature)
  'prusa orange': '#FA6900',
  'orange': '#FA6900',
  // Greens
  'prusa pro green': '#00C853',
  'neon green': '#39FF14',
  'mystic green': '#2E7D32',
  'opal green': '#4DB6AC',
  'army green': '#4B5320',
  'green': '#2E7D32',
  // Blues
  'royal blue': '#1E3A8A',
  'sapphire blue': '#0D47A1',
  'azure blue': '#007FFF',
  'gentleman blue': '#1C3A6E',
  'blue': '#0D47A1',
  // Reds
  'lipstick red': '#C62828',
  'carmine red': '#960018',
  'red': '#C62828',
  // Purples
  'galaxy purple': '#453A72',
  'purple': '#6A1B9A',
  // Browns/Bronze
  'viva la bronze': '#CD7F32',
  'mystic brown': '#6D4C41',
  'brown': '#6D4C41',
  // Yellows
  'pineapple yellow': '#FFD54F',
  'yellow': '#FFEB3B',
  // Grays
  'silver': '#C0C0C0',
  'anthracite grey': '#383838',
  'grey': '#808080',
  'gray': '#808080',
  // Naturals/Clear
  'natural': '#DFDFD3',
  'clear': '#E8E8E8',
  'transparent': '#E8E8E8',
  // Pink
  'ms. pink': '#F48FB1',
  'pink': '#E91E63',
  // Others
  'vanilla white': '#FFF8E7',
  'urban grey': '#6B6B6B',
};

export function getPrusamentColorHex(colorName: string): string | null {
  const colorLower = colorName.toLowerCase().trim();
  
  // Direct match
  if (PRUSAMENT_COLOR_MAPPING[colorLower]) {
    return PRUSAMENT_COLOR_MAPPING[colorLower];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(PRUSAMENT_COLOR_MAPPING)) {
    if (colorLower.includes(key) || key.includes(colorLower)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export const PRUSAMENT_TITLE_NOISE: RegExp[] = [
  /\s*\(?\d+\s*g\)?/gi,      // Weight: 500g, (800g), 1000g
  /\s*\(?\d+\s*kg\)?/gi,     // Weight: 1kg, (2kg)
  /\s*\(NFC\)/gi,            // NFC variant
  /\s*NFC$/gi,               // NFC suffix
  /\s*Refill$/gi,            // Refill variant
  /\s*-\s*Refill/gi,         // - Refill
  /\s*Bundle$/gi,            // Bundle
  /\s*Pack$/gi,              // Pack
  /Prusament\s*/gi,          // Prusament prefix
  /\s+/g,                    // Multiple spaces -> single space
];

export function cleanPrusamentTitle(title: string): string {
  let cleaned = title;
  for (const pattern of PRUSAMENT_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  return cleaned.trim().replace(/\s+/g, ' ');
}

// ============================================================================
// PRODUCT FILTERING
// ============================================================================

export const PRUSAMENT_EXCLUDED_TYPES: string[] = [
  'accessory',
  'nozzle',
  'bed',
  'tool',
  'kit',
  'spare',
  'part',
  'upgrade',
  'printer',
  'enclosure',
  'dryer',
];

export function isPrusamentFilamentProduct(title: string, productType?: string): boolean {
  const titleLower = title.toLowerCase();
  const typeLower = (productType || '').toLowerCase();
  
  // Exclude non-filament products
  for (const excluded of PRUSAMENT_EXCLUDED_TYPES) {
    if (titleLower.includes(excluded) || typeLower.includes(excluded)) {
      return false;
    }
  }
  
  // Must contain filament-related keywords
  const filamentKeywords = ['pla', 'petg', 'asa', 'tpu', 'pc blend', 'pa11', 'pp cf', 'pp gf', 'filament'];
  return filamentKeywords.some(kw => titleLower.includes(kw));
}

// ============================================================================
// WEIGHT & DIAMETER EXTRACTION
// ============================================================================

export function extractPrusamentWeight(title: string): number | null {
  const titleLower = title.toLowerCase();
  
  // Match patterns like "1kg", "500g", "2 kg"
  const kgMatch = titleLower.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kgMatch) {
    return parseFloat(kgMatch[1]) * 1000;
  }
  
  const gMatch = titleLower.match(/(\d+)\s*g(?:ram)?/);
  if (gMatch) {
    return parseInt(gMatch[1], 10);
  }
  
  // Default Prusament spool is 1kg
  return 1000;
}

export function extractPrusamentDiameter(title: string): number {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('2.85') || titleLower.includes('3mm') || titleLower.includes('3.0')) {
    return 2.85;
  }
  
  // Prusament is 1.75mm by default
  return 1.75;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface PrusamentEnrichmentResult {
  material: string;
  finishType: FinishType;
  productLineId: string;
  settingsKey: string;
  printSettings: PrintSettings;
  colorHex: string | null;
  tdsUrl: string;
  cleanTitle: string;
  weight: number | null;
  diameter: number;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
  isRefill: boolean;
  isNfc: boolean;
}

export function enrichPrusamentProduct(
  title: string,
  existingMaterial?: string | null,
  existingColorHex?: string | null
): PrusamentEnrichmentResult {
  const material = normalizePrusamentMaterial(title, existingMaterial);
  const finishType = extractPrusamentFinishType(title, material);
  const { productLineId, settingsKey } = generatePrusamentProductLineId(title, material);
  const printSettings = PRUSAMENT_PRINT_SETTINGS[settingsKey] || PRUSAMENT_PRINT_SETTINGS['pla'];
  const cleanTitle = cleanPrusamentTitle(title);
  const weight = extractPrusamentWeight(title);
  const diameter = extractPrusamentDiameter(title);
  
  // Try to get color hex from title if not provided
  let colorHex = existingColorHex || null;
  if (!colorHex) {
    colorHex = getPrusamentColorHex(cleanTitle);
  }
  
  const tdsUrl = getPrusamentTdsUrl(settingsKey);
  const isAbrasive = printSettings.isAbrasive || false;
  const requiresEnclosure = printSettings.requiresEnclosure || false;
  const isRefill = title.toLowerCase().includes('refill');
  const isNfc = title.toLowerCase().includes('nfc');
  
  return {
    material,
    finishType,
    productLineId,
    settingsKey,
    printSettings,
    colorHex,
    tdsUrl,
    cleanTitle,
    weight,
    diameter,
    isAbrasive,
    requiresEnclosure,
    isRefill,
    isNfc,
  };
}
