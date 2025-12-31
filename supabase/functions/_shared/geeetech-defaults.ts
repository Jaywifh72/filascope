/**
 * GEEETECH Brand-Specific Defaults
 * 
 * Budget-friendly Chinese manufacturer with extensive consumer filament catalog.
 * Platform: Custom OpenCart-based PHP store
 * Products: PLA, PETG, TPU, ASA, ABS+, Silk variants, Matte, Luminous, HS-PLA
 * Specialty: Affordable pricing, wide color selection, high-speed PLA
 */

// ============================================================================
// TDS URL Patterns (GEEETECH doesn't publish formal TDS documents)
// ============================================================================

export const GEEETECH_TDS_PATTERNS: Record<string, string> = {};

export function matchGeeetechTds(title: string): { url: string; pattern: string } | null {
  // GEEETECH doesn't publish TDS documents
  return null;
}

// ============================================================================
// Print Settings by Material
// ============================================================================

export interface PrintSettings {
  nozzle_temp_min_c: number;
  nozzle_temp_max_c: number;
  bed_temp_min_c: number;
  bed_temp_max_c: number;
  print_speed_max_mms?: number;
  enclosure_required?: boolean;
}

export const GEEETECH_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': {
    nozzle_temp_min_c: 185,
    nozzle_temp_max_c: 215,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
  },
  'HS-PLA': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    print_speed_max_mms: 300,
  },
  'SILK-PLA': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
  },
  'MATTE-PLA': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
  },
  'LUMINOUS-PLA': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
  },
  'PLA-CF': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
  },
  'PLA-MARBLE': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
  },
  'PLA-WOOD': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
  },
  'PETG': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 240,
    bed_temp_min_c: 70,
    bed_temp_max_c: 80,
  },
  'ABS': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 90,
    bed_temp_max_c: 110,
    enclosure_required: true,
  },
  'ASA': {
    nozzle_temp_min_c: 240,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 90,
    bed_temp_max_c: 110,
    enclosure_required: true,
  },
  'TPU': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 30,
    bed_temp_max_c: 50,
  },
};

export function getGeeetechPrintSettings(material: string | null, title?: string): PrintSettings | null {
  if (!material && !title) return GEEETECH_PRINT_SETTINGS['PLA'];
  
  const titleUpper = (title || '').toUpperCase();
  const materialUpper = (material || '').toUpperCase();
  
  // Check for specific material variants first
  if (titleUpper.includes('HS-PLA') || titleUpper.includes('HIGH SPEED PLA') || titleUpper.includes('HIGH-SPEED PLA')) {
    return GEEETECH_PRINT_SETTINGS['HS-PLA'];
  }
  if (titleUpper.includes('SILK')) {
    return GEEETECH_PRINT_SETTINGS['SILK-PLA'];
  }
  if (titleUpper.includes('MATTE')) {
    return GEEETECH_PRINT_SETTINGS['MATTE-PLA'];
  }
  if (titleUpper.includes('LUMINOUS') || titleUpper.includes('GLOW')) {
    return GEEETECH_PRINT_SETTINGS['LUMINOUS-PLA'];
  }
  if (titleUpper.includes('CARBON FIBER') || titleUpper.includes('CF')) {
    return GEEETECH_PRINT_SETTINGS['PLA-CF'];
  }
  if (titleUpper.includes('MARBLE')) {
    return GEEETECH_PRINT_SETTINGS['PLA-MARBLE'];
  }
  if (titleUpper.includes('WOOD')) {
    return GEEETECH_PRINT_SETTINGS['PLA-WOOD'];
  }
  
  // Check base materials
  if (materialUpper.includes('ASA')) return GEEETECH_PRINT_SETTINGS['ASA'];
  if (materialUpper.includes('ABS')) return GEEETECH_PRINT_SETTINGS['ABS'];
  if (materialUpper.includes('PETG')) return GEEETECH_PRINT_SETTINGS['PETG'];
  if (materialUpper.includes('TPU')) return GEEETECH_PRINT_SETTINGS['TPU'];
  if (materialUpper.includes('PLA')) return GEEETECH_PRINT_SETTINGS['PLA'];
  
  return GEEETECH_PRINT_SETTINGS['PLA'];
}

// ============================================================================
// Finish Type Extraction
// ============================================================================

export type FinishType = 'Silk' | 'Matte' | 'Glow' | 'Metallic' | 'Transparent' | 'Gradient' | 'Multi' | 'Standard';

export function extractGeeetechFinishType(title: string): FinishType {
  const titleUpper = title.toUpperCase();
  
  // Multi-color finishes
  if (titleUpper.includes('DUAL') || titleUpper.includes('TRI-COLOR') || titleUpper.includes('TRICOLOR') || titleUpper.includes('RAINBOW')) {
    return 'Multi';
  }
  
  // Silk finish
  if (titleUpper.includes('SILK')) {
    return 'Silk';
  }
  
  // Matte finish
  if (titleUpper.includes('MATTE')) {
    return 'Matte';
  }
  
  // Glow/Luminous finish
  if (titleUpper.includes('LUMINOUS') || titleUpper.includes('GLOW') || titleUpper.includes('GLOW-IN-DARK') || titleUpper.includes('GLOW IN THE DARK')) {
    return 'Glow';
  }
  
  // Metallic finish
  if (titleUpper.includes('METALLIC') || titleUpper.includes('METAL')) {
    return 'Metallic';
  }
  
  // Transparent finish
  if (titleUpper.includes('TRANSPARENT') || titleUpper.includes('CLEAR') || titleUpper.includes('TRANSLUCENT')) {
    return 'Transparent';
  }
  
  // Gradient finish
  if (titleUpper.includes('GRADIENT')) {
    return 'Gradient';
  }
  
  return 'Standard';
}

// ============================================================================
// Material Normalization
// ============================================================================

export interface MaterialInfo {
  material: string;
  high_speed_capable?: boolean;
  enclosure_required?: boolean;
  is_nozzle_abrasive?: boolean;
}

export function normalizeGeeetechMaterial(title: string, scrapedMaterial?: string): MaterialInfo {
  const titleUpper = title.toUpperCase();
  
  // High-Speed PLA
  if (titleUpper.includes('HS-PLA') || titleUpper.includes('HIGH SPEED PLA') || titleUpper.includes('HIGH-SPEED PLA') || titleUpper.includes('HSPLA')) {
    return { material: 'PLA', high_speed_capable: true };
  }
  
  // Carbon Fiber PLA
  if (titleUpper.includes('CARBON FIBER') || titleUpper.includes('CF PLA') || titleUpper.includes('PLA CF')) {
    return { material: 'PLA-CF', is_nozzle_abrasive: true };
  }
  
  // Marble PLA
  if (titleUpper.includes('MARBLE') || titleUpper.includes('LIKE MARBLE')) {
    return { material: 'PLA-Marble' };
  }
  
  // Wood PLA
  if (titleUpper.includes('WOOD') || titleUpper.includes('LIKE WOOD')) {
    return { material: 'PLA-Wood' };
  }
  
  // ASA
  if (titleUpper.includes('ASA')) {
    return { material: 'ASA', enclosure_required: true };
  }
  
  // ABS+ / ABS
  if (titleUpper.includes('ABS+') || titleUpper.includes('ABS PLUS') || titleUpper.includes('ABS')) {
    return { material: 'ABS', enclosure_required: true };
  }
  
  // TPU
  if (titleUpper.includes('TPU')) {
    return { material: 'TPU-95A' };
  }
  
  // PETG
  if (titleUpper.includes('PETG')) {
    return { material: 'PETG' };
  }
  
  // Default to PLA (including Silk, Matte, Luminous variants)
  if (titleUpper.includes('PLA')) {
    return { material: 'PLA' };
  }
  
  // Fallback to scraped material or PLA
  return { material: scrapedMaterial || 'PLA' };
}

// ============================================================================
// Product Line ID Generation
// ============================================================================

export function generateGeeetechProductLineId(title: string, material?: string | null): string {
  const titleUpper = title.toUpperCase();
  const materialInfo = normalizeGeeetechMaterial(title, material || undefined);
  const baseMaterial = materialInfo.material.toLowerCase().replace(/-/g, '_');
  
  // High-Speed PLA
  if (titleUpper.includes('HS-PLA') || titleUpper.includes('HIGH SPEED PLA') || titleUpper.includes('HIGH-SPEED PLA')) {
    return 'geeetech__pla__hs_pla';
  }
  
  // Silk variants
  if (titleUpper.includes('SILK')) {
    if (titleUpper.includes('RAINBOW')) {
      return 'geeetech__pla__silk_rainbow';
    }
    if (titleUpper.includes('TRI') || titleUpper.includes('TRICOLOR')) {
      return 'geeetech__pla__silk_tri';
    }
    if (titleUpper.includes('DUAL')) {
      return 'geeetech__pla__silk_dual';
    }
    return 'geeetech__pla__silk';
  }
  
  // Matte PLA
  if (titleUpper.includes('MATTE') && (titleUpper.includes('PLA') || baseMaterial === 'pla')) {
    return 'geeetech__pla__matte';
  }
  
  // Luminous/Glow PLA
  if (titleUpper.includes('LUMINOUS') || titleUpper.includes('GLOW')) {
    return 'geeetech__pla__luminous';
  }
  
  // Carbon Fiber
  if (titleUpper.includes('CARBON FIBER') || titleUpper.includes('CF')) {
    return 'geeetech__pla_cf__standard';
  }
  
  // Marble
  if (titleUpper.includes('MARBLE')) {
    return 'geeetech__pla_marble__standard';
  }
  
  // Wood
  if (titleUpper.includes('WOOD')) {
    return 'geeetech__pla_wood__standard';
  }
  
  // Metallic PETG
  if (baseMaterial === 'petg' && titleUpper.includes('METALLIC')) {
    return 'geeetech__petg__metallic';
  }
  
  // Standard materials
  switch (baseMaterial) {
    case 'pla':
      return 'geeetech__pla__standard';
    case 'petg':
      return 'geeetech__petg__standard';
    case 'abs':
      return 'geeetech__abs__plus';
    case 'asa':
      return 'geeetech__asa__standard';
    case 'tpu_95a':
    case 'tpu':
      return 'geeetech__tpu__standard';
    case 'pla_cf':
      return 'geeetech__pla_cf__standard';
    case 'pla_marble':
      return 'geeetech__pla_marble__standard';
    case 'pla_wood':
      return 'geeetech__pla_wood__standard';
    default:
      return `geeetech__${baseMaterial}__standard`;
  }
}

// ============================================================================
// Color Mapping
// ============================================================================

export const GEEETECH_COLOR_MAPPING: Record<string, string> = {
  // Basic colors
  'black': '#000000',
  'white': '#FFFFFF',
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#00FF00',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'purple': '#800080',
  'pink': '#FFC0CB',
  'grey': '#808080',
  'gray': '#808080',
  'brown': '#8B4513',
  'silver': '#C0C0C0',
  'gold': '#FFD700',
  
  // Specific colors
  'apple green': '#7CFC00',
  'water blue': '#87CEEB',
  'sky blue': '#87CEEB',
  'light blue': '#ADD8E6',
  'dark blue': '#00008B',
  'navy blue': '#000080',
  'royal blue': '#4169E1',
  'cobalt blue': '#0047AB',
  'light green': '#90EE90',
  'dark green': '#006400',
  'army green': '#4B5320',
  'olive green': '#808000',
  'jade green': '#00A86B',
  'mint green': '#98FB98',
  'grass green': '#7CFC00',
  'bone white': '#F9F6EE',
  'ivory': '#FFFFF0',
  'cream': '#FFFDD0',
  'beige': '#F5F5DC',
  'skin': '#FFDBAC',
  'flesh': '#FFDBAC',
  'coffee': '#6F4E37',
  'chocolate': '#7B3F00',
  'brick red': '#CB4154',
  'wine red': '#722F37',
  'dark red': '#8B0000',
  'light pink': '#FFB6C1',
  'hot pink': '#FF69B4',
  'magenta': '#FF00FF',
  'violet': '#8B00FF',
  'lavender': '#E6E6FA',
  'dark grey': '#A9A9A9',
  'dark gray': '#A9A9A9',
  'light grey': '#D3D3D3',
  'light gray': '#D3D3D3',
  'charcoal': '#36454F',
  
  // Transparent/Clear
  'transparent': '#E0E0E0',
  'clear': '#E8E8E8',
  'translucent': '#E0E0E0',
  'natural': '#F5F5DC',
  
  // Metallic/Silk colors
  'silk gold': '#FFD700',
  'silk silver': '#C0C0C0',
  'silk copper': '#B87333',
  'silk bronze': '#CD7F32',
  'silk rose gold': '#B76E79',
  'silk champagne': '#F7E7CE',
  
  // Gradient/Multi colors (use first color)
  'rainbow': '#FF0000',
  'dual color': '#808080',
  'tri color': '#808080',
  'multicolor': '#808080',
};

export function getGeeetechColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Exact match
  if (GEEETECH_COLOR_MAPPING[normalized]) {
    return GEEETECH_COLOR_MAPPING[normalized];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(GEEETECH_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// Title Cleaning
// ============================================================================

export function cleanGeeetechTitle(title: string): string {
  return title
    .replace(/3D Printer Filament/gi, '')
    .replace(/1\.75mm/gi, '')
    .replace(/1kg\/roll/gi, '')
    .replace(/1kg/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// Color Extraction from Title
// ============================================================================

export function extractColorFromTitle(title: string): string | null {
  // Common patterns: "GEEETECH PLA Filament Black" or "Black PLA"
  const colorPatterns = Object.keys(GEEETECH_COLOR_MAPPING);
  const titleLower = title.toLowerCase();
  
  for (const color of colorPatterns) {
    if (titleLower.includes(color)) {
      return color.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  
  return null;
}

// ============================================================================
// Main Enrichment Function
// ============================================================================

export interface GeeetechEnrichmentResult {
  material: string;
  finish_type: FinishType;
  product_line_id: string;
  color_hex: string | null;
  color_name: string | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  print_speed_max_mms: number | null;
  enclosure_required: boolean;
  high_speed_capable: boolean;
  is_nozzle_abrasive: boolean;
  tds_url: string | null;
  cleaned_title: string;
}

export function enrichGeeetechProduct(
  title: string,
  scrapedMaterial?: string,
  scrapedColor?: string,
  existingHex?: string
): GeeetechEnrichmentResult {
  const materialInfo = normalizeGeeetechMaterial(title, scrapedMaterial);
  const finishType = extractGeeetechFinishType(title);
  const productLineId = generateGeeetechProductLineId(title, materialInfo.material);
  const printSettings = getGeeetechPrintSettings(materialInfo.material, title);
  
  // Get color
  const colorName = scrapedColor || extractColorFromTitle(title);
  const colorHex = existingHex || (colorName ? getGeeetechColorHex(colorName) : null);
  
  return {
    material: materialInfo.material,
    finish_type: finishType,
    product_line_id: productLineId,
    color_hex: colorHex,
    color_name: colorName,
    nozzle_temp_min_c: printSettings?.nozzle_temp_min_c || null,
    nozzle_temp_max_c: printSettings?.nozzle_temp_max_c || null,
    bed_temp_min_c: printSettings?.bed_temp_min_c || null,
    bed_temp_max_c: printSettings?.bed_temp_max_c || null,
    print_speed_max_mms: printSettings?.print_speed_max_mms || null,
    enclosure_required: materialInfo.enclosure_required || printSettings?.enclosure_required || false,
    high_speed_capable: materialInfo.high_speed_capable || false,
    is_nozzle_abrasive: materialInfo.is_nozzle_abrasive || false,
    tds_url: null, // GEEETECH doesn't publish TDS documents
    cleaned_title: cleanGeeetechTitle(title),
  };
}
