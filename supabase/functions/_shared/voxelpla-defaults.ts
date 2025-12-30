/**
 * VoxelPLA Brand-Specific Defaults
 * 
 * High-speed PLA+ and PETG+ filament brand on Shopify platform.
 * All products are 1.75mm diameter, optimized for fast printing.
 */

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

const VOXELPLA_MATERIAL_PATTERNS: { pattern: RegExp; material: string }[] = [
  { pattern: /pla\+?\s*(hs|pro|plus)/i, material: 'PLA+' },
  { pattern: /pla\s*plus/i, material: 'PLA+' },
  { pattern: /petg\+?\s*(hs|pro|plus)/i, material: 'PETG' },
  { pattern: /petg\s*plus/i, material: 'PETG' },
  { pattern: /galaxy.*petg/i, material: 'PETG' },
  { pattern: /\bpla\b/i, material: 'PLA+' }, // VoxelPLA only sells PLA+
  { pattern: /\bpetg\b/i, material: 'PETG' },
];

// Products to filter out (not filaments)
const VOXELPLA_ACCESSORY_PATTERNS: RegExp[] = [
  /hepa\s*filter/i,
  /carbon\s*filter/i,
  /silica\s*gel/i,
  /desiccant/i,
  /\bbeads?\b/i,
  /dry\s*box/i,
  /storage/i,
  /\bkit\b/i,
];

export function isVoxelPLAAccessory(title: string): boolean {
  return VOXELPLA_ACCESSORY_PATTERNS.some(pattern => pattern.test(title));
}

export function normalizeVoxelPLAMaterial(title: string): string | null {
  if (isVoxelPLAAccessory(title)) {
    return null; // Not a filament
  }
  
  for (const { pattern, material } of VOXELPLA_MATERIAL_PATTERNS) {
    if (pattern.test(title)) {
      return material;
    }
  }
  
  return null;
}

// ============================================================================
// PRINT SETTINGS
// ============================================================================

interface PrintSettings {
  nozzle_temp_min_c: number;
  nozzle_temp_max_c: number;
  bed_temp_min_c: number;
  bed_temp_max_c: number;
  print_speed_max_mms?: number;
  high_speed_capable: boolean;
}

const VOXELPLA_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA+': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
    print_speed_max_mms: 300,
    high_speed_capable: true,
  },
  'PETG': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 60,
    bed_temp_max_c: 80,
    print_speed_max_mms: 250,
    high_speed_capable: true,
  },
};

export function getVoxelPLAPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  return VOXELPLA_PRINT_SETTINGS[material] || null;
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

type FinishType = 'Standard' | 'Shimmer' | 'Translucent' | 'Matte';

export function extractVoxelPLAFinishType(title: string): FinishType {
  const lowerTitle = title.toLowerCase();
  
  // Galaxy line = Shimmer finish
  if (lowerTitle.includes('galaxy')) {
    return 'Shimmer';
  }
  
  // Clear/Transparent variants
  if (lowerTitle.includes('clear') || 
      lowerTitle.includes('transparent') || 
      lowerTitle.includes('ice') ||
      lowerTitle.includes('crystal')) {
    return 'Translucent';
  }
  
  // Matte variants
  if (lowerTitle.includes('matte')) {
    return 'Matte';
  }
  
  // Default for high-speed formulation
  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateVoxelPLAProductLineId(title: string, material?: string | null): string {
  const normalizedMaterial = material || normalizeVoxelPLAMaterial(title);
  const lowerTitle = title.toLowerCase();
  
  // Determine product line suffix
  let lineSuffix = 'hs-pro'; // Default high-speed pro line
  
  if (lowerTitle.includes('galaxy')) {
    lineSuffix = 'galaxy';
  }
  
  // Build product line ID
  const materialSlug = normalizedMaterial?.toLowerCase().replace(/[+]/g, '-plus') || 'unknown';
  
  return `voxelpla__${materialSlug}__${lineSuffix}`;
}

// ============================================================================
// TDS URL PATTERNS
// ============================================================================

const VOXELPLA_TDS_URLS: Record<string, string> = {
  'PLA+': 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf',
  'PETG': 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf',
};

export function getVoxelPLATdsUrl(material: string | null): string | null {
  if (!material) return null;
  return VOXELPLA_TDS_URLS[material] || null;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

const VOXELPLA_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'black': '#1A1A1A',
  'voxel black': '#1A1A1A',
  'white': '#FFFFFF',
  'cool white': '#F5F5F5',
  'pearl white': '#F0EAD6',
  
  // Reds/Oranges
  'red': '#DC2626',
  'fire engine red': '#DC2626',
  'fire red': '#DC2626',
  'orange': '#EA580C',
  'fire orange': '#FF6B35',
  
  // Blues
  'blue': '#2563EB',
  'royal blue': '#4169E1',
  'voxel royal blue': '#4169E1',
  'sky blue': '#87CEEB',
  'light blue': '#87CEEB',
  'navy': '#000080',
  'midnight blue': '#191970',
  
  // Greens
  'green': '#16A34A',
  'forest green': '#228B22',
  'army green': '#4B5320',
  'olive': '#808000',
  
  // Purples/Pinks
  'purple': '#7C3AED',
  'dark purple': '#4B0082',
  'magenta': '#FF00FF',
  'pink': '#EC4899',
  
  // Yellows
  'yellow': '#FACC15',
  'gold': '#FFD700',
  
  // Neutrals
  'grey': '#808080',
  'gray': '#808080',
  'silver': '#C0C0C0',
  'beige': '#F5F5DC',
  
  // Translucent
  'clear': '#E8E8E8',
  'ice clear': '#E8E8E8',
  'crystal clear': '#F0F0F0',
  'transparent': '#E8E8E8',
  'natural': '#F5E6D3',
  
  // Galaxy (Shimmer) line
  'galaxy aurora green': '#00FF7F',
  'aurora green': '#00FF7F',
  'galaxy emerald gold': '#50C878',
  'emerald gold': '#50C878',
  'galaxy gioiello purple': '#9932CC',
  'gioiello purple': '#9932CC',
  'galaxy midnight blue': '#191970',
  'galaxy purple': '#8B008B',
  'galaxy gold': '#FFD700',
  'galaxy silver': '#C0C0C0',
  'galaxy black': '#2D2D2D',
  'galaxy copper': '#B87333',
  'galaxy bronze': '#CD7F32',
};

export function getVoxelPLAColorHex(colorName: string): string | null {
  const normalizedName = colorName.toLowerCase().trim();
  
  // Direct match
  if (VOXELPLA_COLOR_MAPPING[normalizedName]) {
    return VOXELPLA_COLOR_MAPPING[normalizedName];
  }
  
  // Partial match - find color that contains the search term
  for (const [key, hex] of Object.entries(VOXELPLA_COLOR_MAPPING)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanVoxelPLATitle(title: string): string {
  return title
    // Remove diameter specifications
    .replace(/\s*\(?1\.75\s*mm\)?\s*/gi, ' ')
    // Remove weight specifications
    .replace(/\s*\(?1\s*kg\)?\s*/gi, ' ')
    .replace(/\s*\(?1000\s*g\)?\s*/gi, ' ')
    .replace(/\s*\(?750\s*g\)?\s*/gi, ' ')
    .replace(/\s*\(?500\s*g\)?\s*/gi, ' ')
    // Remove "Filament" suffix
    .replace(/\s*filament\s*/gi, ' ')
    // Remove "3D Printer" text
    .replace(/\s*3d\s*printer\s*/gi, ' ')
    // Remove parentheses artifacts
    .replace(/\(\s*\)/g, '')
    // Remove "VoxelPLA" brand prefix if present
    .replace(/^voxelpla\s*/i, '')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// COLOR EXTRACTION FROM TITLE
// ============================================================================

export function extractVoxelPLAColorFromTitle(title: string): string | null {
  const cleanTitle = cleanVoxelPLATitle(title).toLowerCase();
  
  // Galaxy colors (check first for specificity)
  const galaxyMatch = cleanTitle.match(/galaxy\s+(\w+(?:\s+\w+)?)/i);
  if (galaxyMatch) {
    return galaxyMatch[0]; // Return full "Galaxy X" name
  }
  
  // Try to match known colors
  for (const colorKey of Object.keys(VOXELPLA_COLOR_MAPPING)) {
    if (cleanTitle.includes(colorKey)) {
      return colorKey;
    }
  }
  
  // Extract color from typical patterns like "PLA+ HS Pro - Fire Orange"
  const dashMatch = cleanTitle.match(/[-–]\s*(.+)$/);
  if (dashMatch) {
    const potentialColor = dashMatch[1].trim();
    // Verify it's a color, not a size/variant
    if (!potentialColor.match(/\d+\s*(g|kg|mm)/i)) {
      return potentialColor;
    }
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface VoxelPLAEnrichmentResult {
  material: string | null;
  finish_type: FinishType;
  product_line_id: string;
  tds_url: string | null;
  print_settings: PrintSettings | null;
  color_hex: string | null;
  color_name: string | null;
  clean_title: string;
  is_accessory: boolean;
  high_speed_capable: boolean;
  diameter_nominal_mm: number;
}

export function enrichVoxelPLAProduct(
  title: string,
  colorName?: string | null,
  existingMaterial?: string | null
): VoxelPLAEnrichmentResult {
  // Check if it's an accessory (not a filament)
  const isAccessory = isVoxelPLAAccessory(title);
  
  if (isAccessory) {
    return {
      material: null,
      finish_type: 'Standard',
      product_line_id: 'voxelpla__accessory',
      tds_url: null,
      print_settings: null,
      color_hex: null,
      color_name: null,
      clean_title: cleanVoxelPLATitle(title),
      is_accessory: true,
      high_speed_capable: false,
      diameter_nominal_mm: 1.75,
    };
  }
  
  const material = existingMaterial || normalizeVoxelPLAMaterial(title);
  const finishType = extractVoxelPLAFinishType(title);
  const productLineId = generateVoxelPLAProductLineId(title, material);
  const tdsUrl = getVoxelPLATdsUrl(material);
  const printSettings = getVoxelPLAPrintSettings(material);
  
  // Determine color
  const extractedColor = colorName || extractVoxelPLAColorFromTitle(title);
  const colorHex = extractedColor ? getVoxelPLAColorHex(extractedColor) : null;
  
  return {
    material,
    finish_type: finishType,
    product_line_id: productLineId,
    tds_url: tdsUrl,
    print_settings: printSettings,
    color_hex: colorHex,
    color_name: extractedColor,
    clean_title: cleanVoxelPLATitle(title),
    is_accessory: false,
    high_speed_capable: printSettings?.high_speed_capable ?? true,
    diameter_nominal_mm: 1.75, // VoxelPLA only sells 1.75mm
  };
}

// ============================================================================
// PRODUCT URL GENERATION
// ============================================================================

export function getVoxelPLAProductUrl(handle: string): string {
  return `https://voxelpla.com/products/${handle}`;
}

// ============================================================================
// SHOPIFY STORE INFO
// ============================================================================

export const VOXELPLA_STORE_INFO = {
  baseUrl: 'https://voxelpla.com',
  productsJsonUrl: 'https://voxelpla.com/products.json',
  vendor: 'VoxelPLA',
  defaultDiameter: 1.75,
  defaultWeight: 1000, // 1kg
  defaultCurrency: 'USD',
  platform: 'shopify',
};
