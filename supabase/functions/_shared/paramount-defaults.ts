/**
 * Paramount 3D Brand Defaults
 * 
 * US-based industrial filament supplier (est. 1994)
 * Platform: Wix (custom website)
 * Specialties: Themed colors, FlexPLA, Stone textures, Masterspools
 */

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

interface MaterialPattern {
  pattern: RegExp;
  material: string;
  isAbrasive?: boolean;
  requiresEnclosure?: boolean;
}

const PARAMOUNT_MATERIAL_PATTERNS: MaterialPattern[] = [
  { pattern: /\bpa[-\s]?cf\b|\bnylon\s*carbon/i, material: 'PA-CF', isAbrasive: true, requiresEnclosure: true },
  { pattern: /\bpetg[-\s]?cf\b|\bpetg\s*carbon/i, material: 'PETG-CF', isAbrasive: true },
  { pattern: /\babs[-\s]?cf\b|\babs\s*carbon/i, material: 'ABS-CF', isAbrasive: true, requiresEnclosure: true },
  { pattern: /\bflex[-\s]?pla\b|\bflexpla\b/i, material: 'FlexPLA' },
  { pattern: /\bpetg\b/i, material: 'PETG' },
  { pattern: /\babs\b/i, material: 'ABS' },
  { pattern: /\basa\b/i, material: 'ASA' },
  { pattern: /\btpu\b/i, material: 'TPU' },
  { pattern: /\bpva\b/i, material: 'PVA' },
  { pattern: /\bnylon\b|\bpa\b/i, material: 'PA' },
  { pattern: /\bpla\b/i, material: 'PLA' },
];

export function normalizeParamountMaterial(title: string): { material: string; isAbrasive: boolean; requiresEnclosure: boolean } {
  const upperTitle = title.toUpperCase();
  
  for (const { pattern, material, isAbrasive, requiresEnclosure } of PARAMOUNT_MATERIAL_PATTERNS) {
    if (pattern.test(upperTitle)) {
      return { 
        material, 
        isAbrasive: isAbrasive || false,
        requiresEnclosure: requiresEnclosure || false
      };
    }
  }
  
  return { material: 'PLA', isAbrasive: false, requiresEnclosure: false };
}

// ============================================================================
// PRINT SETTINGS
// ============================================================================

interface PrintSettings {
  nozzle_temp_min_c: number;
  nozzle_temp_max_c: number;
  bed_temp_min_c: number;
  bed_temp_max_c: number;
  requiresEnclosure?: boolean;
  requiresHardenedNozzle?: boolean;
}

const PARAMOUNT_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzle_temp_min_c: 190, nozzle_temp_max_c: 220, bed_temp_min_c: 50, bed_temp_max_c: 60 },
  'FlexPLA': { nozzle_temp_min_c: 200, nozzle_temp_max_c: 230, bed_temp_min_c: 50, bed_temp_max_c: 60 },
  'PETG': { nozzle_temp_min_c: 230, nozzle_temp_max_c: 250, bed_temp_min_c: 70, bed_temp_max_c: 85 },
  'PETG-CF': { nozzle_temp_min_c: 230, nozzle_temp_max_c: 260, bed_temp_min_c: 70, bed_temp_max_c: 85, requiresHardenedNozzle: true },
  'ABS': { nozzle_temp_min_c: 230, nozzle_temp_max_c: 260, bed_temp_min_c: 100, bed_temp_max_c: 110, requiresEnclosure: true },
  'ABS-CF': { nozzle_temp_min_c: 240, nozzle_temp_max_c: 270, bed_temp_min_c: 100, bed_temp_max_c: 110, requiresEnclosure: true, requiresHardenedNozzle: true },
  'ASA': { nozzle_temp_min_c: 240, nozzle_temp_max_c: 260, bed_temp_min_c: 90, bed_temp_max_c: 110, requiresEnclosure: true },
  'TPU': { nozzle_temp_min_c: 210, nozzle_temp_max_c: 230, bed_temp_min_c: 30, bed_temp_max_c: 50 },
  'PVA': { nozzle_temp_min_c: 180, nozzle_temp_max_c: 210, bed_temp_min_c: 50, bed_temp_max_c: 60 },
  'PA': { nozzle_temp_min_c: 240, nozzle_temp_max_c: 270, bed_temp_min_c: 70, bed_temp_max_c: 90, requiresEnclosure: true },
  'PA-CF': { nozzle_temp_min_c: 250, nozzle_temp_max_c: 280, bed_temp_min_c: 70, bed_temp_max_c: 100, requiresEnclosure: true, requiresHardenedNozzle: true },
  'Nylon CF': { nozzle_temp_min_c: 250, nozzle_temp_max_c: 280, bed_temp_min_c: 70, bed_temp_max_c: 100, requiresEnclosure: true, requiresHardenedNozzle: true },
};

export function getParamountPrintSettings(material: string): PrintSettings | null {
  return PARAMOUNT_PRINT_SETTINGS[material] || PARAMOUNT_PRINT_SETTINGS['PLA'];
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 'Standard' | 'Matte' | 'Stone' | 'Shimmer' | 'Translucent' | 'Glow';

export function extractParamountFinishType(title: string): FinishType {
  const lowerTitle = title.toLowerCase();
  
  // Stone/Textured finishes
  if (/geode|stone|sandstone|medusa|marble|granite|concrete/i.test(lowerTitle)) {
    return 'Stone';
  }
  
  // Shimmer/Color-shift finishes
  if (/chameleon|ultraviolet|aztec|color.?shift|duo.?color|pearl|metallic|chrome/i.test(lowerTitle)) {
    return 'Shimmer';
  }
  
  // Matte finish
  if (/\bmatte\b/i.test(lowerTitle)) {
    return 'Matte';
  }
  
  // Translucent/Clear
  if (/\bclear\b|\btransparent\b|\btranslucent\b/i.test(lowerTitle)) {
    return 'Translucent';
  }
  
  // Glow in the dark
  if (/glow|phosphor|luminous/i.test(lowerTitle)) {
    return 'Glow';
  }
  
  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateParamountProductLineId(title: string, material: string): string {
  const finishType = extractParamountFinishType(title);
  const lowerTitle = title.toLowerCase();
  
  // Normalize material for ID
  const materialSlug = material.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Determine product line based on material and finish
  let lineSlug = 'standard';
  
  if (/master\s*spool|refill/i.test(lowerTitle)) {
    lineSlug = 'masterspool';
  } else if (finishType === 'Stone') {
    lineSlug = 'stone';
  } else if (finishType === 'Shimmer') {
    lineSlug = 'shimmer';
  } else if (finishType === 'Matte') {
    lineSlug = 'matte';
  } else if (finishType === 'Translucent') {
    lineSlug = 'translucent';
  } else if (finishType === 'Glow') {
    lineSlug = 'glow';
  } else if (material.includes('-CF')) {
    lineSlug = 'composite';
  } else if (material === 'PVA') {
    lineSlug = 'support';
  } else if (material === 'ASA') {
    lineSlug = 'outdoor';
  }
  
  return `paramount__${materialSlug}__${lineSlug}`;
}

// ============================================================================
// TDS URL MAPPING
// ============================================================================

export const PARAMOUNT_TDS_URLS: Record<string, string> = {
  'PLA': 'https://www.paramount-3d.com/_files/ugd/429b50_48795680e0144291a14d603c1f028c37.pdf',
  'FlexPLA': 'https://www.paramount-3d.com/_files/ugd/429b50_48795680e0144291a14d603c1f028c37.pdf',
  'PETG': 'https://www.paramount-3d.com/_files/ugd/429b50_62fa09144aa94532b33d6e0b5a9221af.pdf',
  'PETG-CF': 'https://www.paramount-3d.com/_files/ugd/429b50_62fa09144aa94532b33d6e0b5a9221af.pdf',
  'ABS': 'https://www.paramount-3d.com/_files/ugd/429b50_631d75abe6724297927a7308674e579f.pdf',
  'ABS-CF': 'https://www.paramount-3d.com/_files/ugd/429b50_631d75abe6724297927a7308674e579f.pdf',
};

export function getParamountTdsUrl(material: string): string | null {
  return PARAMOUNT_TDS_URLS[material] || null;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const PARAMOUNT_COLOR_MAPPING: Record<string, string> = {
  // Pop Culture / Themed
  'autobot blue': '#1E90FF',
  'decepticon purple': '#800080',
  'simpson yellow': '#FFD700',
  'kermit green': '#00A651',
  'minion yellow': '#FED600',
  'hulk green': '#228B22',
  'deadpool red': '#FF0000',
  'thanos purple': '#5A2D82',
  'tardis blue': '#003B6F',
  'portal orange': '#FF6600',
  'portal blue': '#00A0FF',
  
  // Automotive
  'british racing green': '#004225',
  'enzo red': '#CC0000',
  'mclaren orange': '#FF8000',
  'ferrari red': '#FF2800',
  'lamborghini yellow': '#DDB321',
  'porsche silver': '#C0C0C0',
  'mustang blue': '#0066B3',
  'corvette yellow': '#F5D033',
  
  // Military
  'military green': '#4B5320',
  'military khaki': '#C3B091',
  'military mbt brown': '#4A3728',
  'military od green': '#3D4127',
  'military tan': '#D2B48C',
  'military desert': '#EDC9AF',
  'military gray': '#7A7A7A',
  'military navy': '#000080',
  
  // Stone / Texture
  'geode black': '#1A1A1A',
  'karnak sandstone': '#C2B280',
  'medusa stone gray': '#7D7D7D',
  'marble white': '#F5F5F5',
  'granite gray': '#676767',
  'concrete gray': '#8C8C8C',
  'slate gray': '#708090',
  
  // Skin Tones (for figurines)
  'fair complexion': '#FFE0BD',
  'dark complexion': '#8D5524',
  'ivory': '#FFFFF0',
  'universal beige': '#E5BE8C',
  'light skin': '#FFDAB9',
  'medium skin': '#D2A679',
  'tan skin': '#C68642',
  
  // Color-Shift / Special
  'chameleon': '#9966CC',
  'ultraviolet': '#7F00FF',
  'aztec gold': '#C9B037',
  'duo color': '#FF69B4',
  
  // Standard Colors
  'black': '#000000',
  'white': '#FFFFFF',
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#00FF00',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'purple': '#800080',
  'pink': '#FFC0CB',
  'gray': '#808080',
  'grey': '#808080',
  'brown': '#8B4513',
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'bronze': '#CD7F32',
  'copper': '#B87333',
  'navy': '#000080',
  'teal': '#008080',
  'cyan': '#00FFFF',
  'magenta': '#FF00FF',
  'lime': '#32CD32',
  'olive': '#808000',
  'maroon': '#800000',
  'beige': '#F5F5DC',
  'coral': '#FF7F50',
  'salmon': '#FA8072',
  'crimson': '#DC143C',
  'sky blue': '#87CEEB',
  'royal blue': '#4169E1',
  'forest green': '#228B22',
  'mint green': '#98FF98',
  'lavender': '#E6E6FA',
  'violet': '#EE82EE',
  'indigo': '#4B0082',
  'cream': '#FFFDD0',
  'charcoal': '#36454F',
  
  // Translucent
  'clear': '#FFFFFF',
  'transparent': '#FFFFFF',
  'translucent clear': '#FFFFFF',
  'natural': '#F5F5DC',
};

export function getParamountColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (PARAMOUNT_COLOR_MAPPING[normalized]) {
    return PARAMOUNT_COLOR_MAPPING[normalized];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(PARAMOUNT_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface ParamountEnrichmentResult {
  material: string;
  finish_type: FinishType;
  product_line_id: string;
  print_settings: PrintSettings | null;
  color_hex: string | null;
  tds_url: string | null;
  is_nozzle_abrasive: boolean;
  requires_enclosure: boolean;
}

export function enrichParamountProduct(
  title: string,
  existingMaterial?: string | null,
  colorName?: string | null
): ParamountEnrichmentResult {
  // Normalize material
  const { material, isAbrasive, requiresEnclosure } = normalizeParamountMaterial(title);
  const finalMaterial = existingMaterial || material;
  
  // Get finish type
  const finish_type = extractParamountFinishType(title);
  
  // Generate product line ID
  const product_line_id = generateParamountProductLineId(title, finalMaterial);
  
  // Get print settings
  const print_settings = getParamountPrintSettings(finalMaterial);
  
  // Get color hex
  const color_hex = colorName ? getParamountColorHex(colorName) : null;
  
  // Get TDS URL
  const tds_url = getParamountTdsUrl(finalMaterial);
  
  return {
    material: finalMaterial,
    finish_type,
    product_line_id,
    print_settings,
    color_hex,
    tds_url,
    is_nozzle_abrasive: isAbrasive,
    requires_enclosure: requiresEnclosure,
  };
}

// ============================================================================
// STORE INFO
// ============================================================================

export const PARAMOUNT_STORE_INFO = {
  vendor: 'Paramount 3D',
  platform_type: 'wix',
  base_url: 'https://www.paramount-3d.com',
  products_url: 'https://www.paramount-3d.com/filaments',
  default_diameter: 1.75,
  default_weight: 1000,
  default_currency: 'USD',
  supported_regions: ['US'],
};
