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
      // Check for specialty PLA lines
      if (titleLower.includes('premium') || titleLower.includes('mystic')) {
        subLine = 'premium';
        settingsKey = 'pla-premium';
      } else if (titleLower.includes('galaxy')) {
        subLine = 'galaxy';
        settingsKey = 'pla-blend';
      } else if (titleLower.includes('blend') || titleLower.includes('viva la') || 
                 titleLower.includes('royal') || titleLower.includes('oh my') ||
                 titleLower.includes('ms.') || titleLower.includes('silverness')) {
        subLine = 'blend';
        settingsKey = 'pla-blend';
      } else if (titleLower.includes('opal')) {
        subLine = 'opal';
        settingsKey = 'pla';
      } else if (titleLower.includes('noctua')) {
        subLine = 'noctua';
        settingsKey = 'pla';
      } else if (titleLower.includes('marble')) {
        subLine = 'marble';
        settingsKey = 'pla';
      } else if (titleLower.includes('recycled')) {
        subLine = 'recycled';
        settingsKey = 'pla';
      }
      break;
    case 'rPLA':
      settingsKey = 'rpla';
      subLine = 'pigment';
      break;
    case 'PETG':
      settingsKey = 'petg';
      if (titleLower.includes('tungsten')) {
        subLine = 'tungsten';
      } else if (titleLower.includes('magnetite')) {
        subLine = 'magnetite';
      } else if (titleLower.includes('recycled')) {
        subLine = 'recycled';
      } else if (titleLower.includes('matte')) {
        subLine = 'matte';
      } else if (titleLower.includes('shimmering') || titleLower.includes('shimmer')) {
        subLine = 'shimmer';
      }
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
      if (titleLower.includes('carbon') || titleLower.includes(' cf')) {
        subLine = 'carbon';
      } else if (titleLower.includes('space grade')) {
        subLine = 'space-grade';
      } else {
        subLine = 'blend';
      }
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
    case 'PVB':
      settingsKey = 'pla'; // PVB uses similar settings
      subLine = 'smoothable';
      break;
    case 'Woodfill':
      settingsKey = 'pla';
      subLine = 'woodfill';
      break;
    case 'PEI':
      settingsKey = 'pa11-cf'; // High-temp similar settings
      subLine = 'ultem';
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
  // Signature Prusa Colors
  'prusa orange': '#FA6831',
  'prusa galaxy black': '#1C1C1C',
  'prusa pro green': '#228B22',
  
  // Blacks
  'jet black': '#0A0A0A',
  'galaxy black': '#1C1C1C',
  'matte black': '#1C1C1C',
  'carbon fiber black': '#1C1C1C',
  'space grade black': '#1C1C1C',
  'recycled black': '#1C1C1C',
  'black': '#1C1C1C',
  
  // Whites
  'signal white': '#FFFFFF',
  'pristine white': '#FFFFFF',
  'vanilla white': '#F3E5AB',
  'pearl white': '#FAEBD7',
  'white': '#FFFFFF',
  
  // Greys
  'anthracite grey': '#293133',
  'urban grey': '#5A5A5A',
  'gravity grey': '#808080',
  "gentleman's grey": '#808080',
  'marble grey': '#808080',
  'magnetite 40% grey': '#808080',
  'grey': '#808080',
  'gray': '#808080',
  
  // Blues
  'azure blue': '#007FFF',
  'chalky blue': '#0066CC',
  'sky blue': '#0066CC',
  'ultramarine blue': '#4166F5',
  'sapphire blue': '#0066CC',
  'royal blue': '#4169E1',
  'blue': '#0066CC',
  
  // Greens
  'neon green': '#39FF14',
  'jungle green': '#228B22',
  'pistachio green': '#93C572',
  'army green': '#4B5320',
  'simply green': '#4CBB17',
  'opal green': '#7CB9A8',
  'galaxy green': '#228B22',
  'mystic green': '#5E8B65',
  'algae pigment': '#7E9B5E',
  'green': '#228B22',
  
  // Reds
  'lipstick red': '#C41E3A',
  'carmine red': '#960018',
  'galaxy red': '#C41E3A',
  'red': '#C41E3A',
  
  // Oranges
  'orange for ppe': '#FF6B35',
  'orange': '#FA6831',
  
  // Yellows
  'mango yellow': '#FFD700',
  'oh my gold': '#FFD700',
  'pineapple yellow': '#FFD700',
  'corn pigment': '#F5DEB3',
  'risotto pigment': '#DAA520',
  'yellow': '#FFD700',
  
  // Purples/Violets
  'galaxy purple': '#7B68EE',
  'shimmering violet': '#9400D3',
  'purple': '#7B68EE',
  'violet': '#9400D3',
  
  // Pinks
  'ms. pink': '#FF69B4',
  'pink': '#FF69B4',
  
  // Browns
  'viva la bronze': '#CD7F32',
  'mystic brown': '#7B5544',
  'chocolate brown': '#7B3F00',
  'pastel brown': '#8B4513',
  'noctua brown': '#8B4513',
  'wine pigment': '#722F37',
  'brown': '#8B4513',
  
  // Beiges/Naturals
  'natural': '#F5F5DC',
  'noctua beige': '#D4B896',
  'linden light': '#DEB887',
  'beige': '#D4B896',
  
  // Silvers/Metallics
  'galaxy silver': '#C0C0C0',
  'my silverness': '#C0C0C0',
  'tungsten 75%': '#848482',
  'silver': '#C0C0C0',
  
  // Specialty
  'clear': '#FFFFFF',
  'transparent': '#FFFFFF',
  'recycled': '#808080',
};

export function getPrusamentColorHex(colorName: string): string | null {
  const colorLower = colorName.toLowerCase().trim();
  
  // Direct match first
  if (PRUSAMENT_COLOR_MAPPING[colorLower]) {
    return PRUSAMENT_COLOR_MAPPING[colorLower];
  }
  
  // Partial match - check if any key is contained in color name
  for (const [key, hex] of Object.entries(PRUSAMENT_COLOR_MAPPING)) {
    if (colorLower.includes(key) || key.includes(colorLower)) {
      return hex;
    }
  }
  
  // Check for common color words
  if (colorLower.includes('black')) return '#1C1C1C';
  if (colorLower.includes('white')) return '#FFFFFF';
  if (colorLower.includes('grey') || colorLower.includes('gray')) return '#808080';
  if (colorLower.includes('blue')) return '#0066CC';
  if (colorLower.includes('red')) return '#C41E3A';
  if (colorLower.includes('green')) return '#228B22';
  if (colorLower.includes('orange')) return '#FA6831';
  if (colorLower.includes('yellow') || colorLower.includes('gold')) return '#FFD700';
  if (colorLower.includes('purple') || colorLower.includes('violet')) return '#7B68EE';
  if (colorLower.includes('pink')) return '#FF69B4';
  if (colorLower.includes('brown')) return '#8B4513';
  if (colorLower.includes('natural') || colorLower.includes('beige')) return '#F5F5DC';
  if (colorLower.includes('silver')) return '#C0C0C0';
  
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
