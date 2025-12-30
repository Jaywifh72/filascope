/**
 * Hatchbox Brand-Specific Defaults
 * 
 * Popular consumer filament brand with Shopify store (hatchbox3d.com).
 * Product lines: PLA, ABS, PETG, PLA PRO+, TPU, Reload Series, PLA MAX (USA-made)
 * Both 1.75mm and 2.85mm diameters available.
 */

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

const HATCHBOX_MATERIAL_PATTERNS: { pattern: RegExp; material: string }[] = [
  // PLA variants
  { pattern: /pla\s*pro\+?|pla\+/i, material: 'PLA+' },
  { pattern: /pla\s*max/i, material: 'PLA+' }, // USA-made premium PLA
  { pattern: /reload.*pla|pla.*reload/i, material: 'PLA' }, // Recycled PLA
  { pattern: /\bpla\b/i, material: 'PLA' },
  // Other materials
  { pattern: /\babs\b/i, material: 'ABS' },
  { pattern: /\bpetg\b/i, material: 'PETG' },
  { pattern: /\btpu\b/i, material: 'TPU-95A' },
  // Cleaning filament
  { pattern: /cleaning\s*filament/i, material: 'Cleaning' },
];

// Products to filter out (not filaments)
const HATCHBOX_ACCESSORY_PATTERNS: RegExp[] = [
  /\bresin\b/i,
  /uv\s*resin/i,
  /3d\s*printer\s*resin/i,
  /photopolymer/i,
  /\bink\b/i,
  /dry\s*box/i,
  /storage/i,
  /\bkit\b/i,
  /\bbundle\b.*accessory/i,
];

export function isHatchboxAccessory(title: string): boolean {
  return HATCHBOX_ACCESSORY_PATTERNS.some(pattern => pattern.test(title));
}

export function normalizeHatchboxMaterial(title: string): string | null {
  if (isHatchboxAccessory(title)) {
    return null;
  }
  
  for (const { pattern, material } of HATCHBOX_MATERIAL_PATTERNS) {
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

const HATCHBOX_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': {
    nozzle_temp_min_c: 180,
    nozzle_temp_max_c: 210,
    bed_temp_min_c: 20,
    bed_temp_max_c: 60,
    high_speed_capable: false,
  },
  'PLA+': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    high_speed_capable: false,
  },
  'ABS': {
    nozzle_temp_min_c: 210,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 80,
    bed_temp_max_c: 110,
    high_speed_capable: false,
  },
  'PETG': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 50,
    bed_temp_max_c: 80,
    high_speed_capable: false,
  },
  'TPU-95A': {
    nozzle_temp_min_c: 210,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 20,
    bed_temp_max_c: 60,
    high_speed_capable: false,
  },
  'Cleaning': {
    nozzle_temp_min_c: 150,
    nozzle_temp_max_c: 280,
    bed_temp_min_c: 0,
    bed_temp_max_c: 0,
    high_speed_capable: false,
  },
};

export function getHatchboxPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  return HATCHBOX_PRINT_SETTINGS[material] || null;
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

type FinishType = 'Standard' | 'Matte' | 'Silk' | 'Translucent' | 'Shimmer' | 'Glow';

export function extractHatchboxFinishType(title: string): FinishType {
  const lowerTitle = title.toLowerCase();
  
  // Silk variants
  if (lowerTitle.includes('silk')) {
    return 'Silk';
  }
  
  // Matte variants
  if (lowerTitle.includes('matte')) {
    return 'Matte';
  }
  
  // Glow in the dark
  if (lowerTitle.includes('glow') || lowerTitle.includes('gitd')) {
    return 'Glow';
  }
  
  // Translucent/Clear
  if (lowerTitle.includes('transparent') || 
      lowerTitle.includes('translucent') ||
      lowerTitle.includes('clear')) {
    return 'Translucent';
  }
  
  // Metallic/Shimmer
  if (lowerTitle.includes('metallic') || 
      lowerTitle.includes('sparkle') ||
      lowerTitle.includes('glitter')) {
    return 'Shimmer';
  }
  
  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateHatchboxProductLineId(title: string, material?: string | null): string {
  const normalizedMaterial = material || normalizeHatchboxMaterial(title);
  const lowerTitle = title.toLowerCase();
  
  // Determine product line suffix
  let lineSuffix = 'standard';
  
  if (lowerTitle.includes('pro+') || lowerTitle.includes('pro +')) {
    lineSuffix = 'pro-plus';
  } else if (lowerTitle.includes('pla max')) {
    lineSuffix = 'max';
  } else if (lowerTitle.includes('reload')) {
    lineSuffix = 'reload';
  } else if (lowerTitle.includes('silk')) {
    lineSuffix = 'silk';
  } else if (lowerTitle.includes('matte')) {
    lineSuffix = 'matte';
  } else if (lowerTitle.includes('glow') || lowerTitle.includes('gitd')) {
    lineSuffix = 'glow';
  }
  
  // Build product line ID
  const materialSlug = normalizedMaterial?.toLowerCase()
    .replace(/[+]/g, '-plus')
    .replace(/-95a/g, '') || 'unknown';
  
  return `hatchbox__${materialSlug}__${lineSuffix}`;
}

// ============================================================================
// TDS URL PATTERNS (Safety Data Sheets)
// ============================================================================

const HATCHBOX_TDS_URLS: Record<string, string> = {
  'PLA': 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/HATCHBOX_PLA_3D_Printer_Filament_SDS.pdf?1561',
  'PLA+': 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/HATCHBOX_PLA_3D_Printer_Filament_SDS.pdf?1561',
  'ABS': 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/HATCHBOX_ABS_3D_Printer_Filament_SDS.pdf?1561',
  'PETG': 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/HATCHBOX_PETG_3D_Printer_Filament_SDS.pdf?1561',
  'TPU-95A': 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/HATCHBOX_TPU_3D_Printer_Filament_SDS.pdf?1561',
};

export function getHatchboxTdsUrl(material: string | null): string | null {
  if (!material) return null;
  return HATCHBOX_TDS_URLS[material] || null;
}

// ============================================================================
// DIAMETER EXTRACTION
// ============================================================================

export function extractHatchboxDiameter(title: string, sku?: string | null): number {
  const lowerTitle = title.toLowerCase();
  
  // Check for 2.85mm/3mm
  if (lowerTitle.includes('2.85') || lowerTitle.includes('3mm') || lowerTitle.includes('285')) {
    return 2.85;
  }
  
  // Check SKU for diameter hint
  if (sku) {
    const lowerSku = sku.toLowerCase();
    if (lowerSku.includes('285') || lowerSku.includes('3mm')) {
      return 2.85;
    }
  }
  
  // Default to 1.75mm
  return 1.75;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

const HATCHBOX_COLOR_MAPPING: Record<string, string> = {
  // Whites/Neutrals
  'white': '#FFFFFF',
  'true white': '#FFFFFF',
  'cold white': '#F5F5F5',
  'warm white': '#FFFAF0',
  'natural': '#F5E6D3',
  'beige': '#F5F5DC',
  'cream': '#FFFDD0',
  'ivory': '#FFFFF0',
  
  // Blacks/Grays
  'black': '#1A1A1A',
  'true black': '#000000',
  'gray': '#808080',
  'grey': '#808080',
  'dark gray': '#404040',
  'dark grey': '#404040',
  'light gray': '#C0C0C0',
  'light grey': '#C0C0C0',
  'silver': '#C0C0C0',
  'charcoal': '#36454F',
  
  // Reds
  'red': '#DC2626',
  'true red': '#FF0000',
  'dark red': '#8B0000',
  'maroon': '#800000',
  'burgundy': '#722F37',
  'wine': '#722F37',
  'crimson': '#DC143C',
  'scarlet': '#FF2400',
  
  // Oranges
  'orange': '#FF6600',
  'true orange': '#FF6600',
  'neon orange': '#FF5F1F',
  'burnt orange': '#CC5500',
  'tangerine': '#FF9966',
  'peach': '#FFCBA4',
  
  // Yellows
  'yellow': '#FFCC00',
  'true yellow': '#FFFF00',
  'gold': '#FFD700',
  'lemon': '#FFF44F',
  'mustard': '#FFDB58',
  'amber': '#FFBF00',
  
  // Greens
  'green': '#228B22',
  'true green': '#008000',
  'dark green': '#006400',
  'forest green': '#228B22',
  'light green': '#90EE90',
  'lime': '#32CD32',
  'lime green': '#32CD32',
  'neon green': '#39FF14',
  'olive': '#808000',
  'army green': '#4B5320',
  'teal': '#008080',
  'mint': '#98FF98',
  'seafoam': '#71EEB8',
  
  // Blues
  'blue': '#0066CC',
  'true blue': '#0000FF',
  'dark blue': '#00008B',
  'navy': '#000080',
  'navy blue': '#000080',
  'light blue': '#ADD8E6',
  'sky blue': '#87CEEB',
  'royal blue': '#4169E1',
  'cobalt': '#0047AB',
  'cyan': '#00FFFF',
  'turquoise': '#40E0D0',
  'aqua': '#00FFFF',
  'baby blue': '#89CFF0',
  'ocean blue': '#4F94CD',
  
  // Purples
  'purple': '#800080',
  'true purple': '#800080',
  'dark purple': '#301934',
  'violet': '#8B00FF',
  'lavender': '#E6E6FA',
  'magenta': '#FF00FF',
  'plum': '#DDA0DD',
  'grape': '#6F2DA8',
  'indigo': '#4B0082',
  'lilac': '#C8A2C8',
  
  // Pinks
  'pink': '#FFC0CB',
  'hot pink': '#FF69B4',
  'neon pink': '#FF6EC7',
  'light pink': '#FFB6C1',
  'rose': '#FF007F',
  'salmon': '#FA8072',
  'coral': '#FF7F50',
  'fuchsia': '#FF00FF',
  
  // Browns
  'brown': '#8B4513',
  'dark brown': '#654321',
  'chocolate': '#7B3F00',
  'tan': '#D2B48C',
  'wood': '#DEB887',
  'bronze': '#CD7F32',
  'copper': '#B87333',
  'coffee': '#6F4E37',
  
  // Translucent
  'clear': '#E8E8E8',
  'transparent': '#E8E8E8',
  'translucent': '#E8E8E8',
  'transparent blue': '#87CEEB',
  'transparent green': '#90EE90',
  'transparent red': '#FF6B6B',
  'transparent yellow': '#FFFF99',
  
  // Glow colors
  'glow green': '#00FF00',
  'glow blue': '#00FFFF',
  
  // Silk colors
  'silk gold': '#FFD700',
  'silk silver': '#C0C0C0',
  'silk copper': '#B87333',
  'silk bronze': '#CD7F32',
  'silk rose': '#FF007F',
  'silk purple': '#9966CC',
  'silk blue': '#4169E1',
  'silk green': '#50C878',
  'silk red': '#DC143C',
};

export function getHatchboxColorHex(colorName: string): string | null {
  const normalizedName = colorName.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, ' ');
  
  // Direct match
  if (HATCHBOX_COLOR_MAPPING[normalizedName]) {
    return HATCHBOX_COLOR_MAPPING[normalizedName];
  }
  
  // Partial match - find color that contains the search term
  for (const [key, hex] of Object.entries(HATCHBOX_COLOR_MAPPING)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanHatchboxTitle(title: string): string {
  return title
    // Remove brand prefix
    .replace(/^hatchbox\s*/i, '')
    // Remove diameter specifications
    .replace(/\s*\(?1\.75\s*mm?\)?\s*/gi, ' ')
    .replace(/\s*\(?2\.85\s*mm?\)?\s*/gi, ' ')
    .replace(/\s*\(?3\s*mm?\)?\s*/gi, ' ')
    // Remove weight specifications
    .replace(/\s*\(?1\s*kg\)?\s*/gi, ' ')
    .replace(/\s*\(?1000\s*g\)?\s*/gi, ' ')
    .replace(/\s*[\-–]\s*1\s*kg\s*/gi, ' ')
    .replace(/\s*[\-–]\s*\d+\.?\d*\s*(lbs?|oz)\s*/gi, ' ')
    // Remove "Filament" suffix
    .replace(/\s*3d\s*(printer\s*)?filament\s*/gi, ' ')
    .replace(/\s*filament\s*/gi, ' ')
    // Remove parentheses artifacts
    .replace(/\(\s*\)/g, '')
    // Clean up dashes before colors
    .replace(/\s*[\-–]\s*(?=[A-Z])/g, ' ')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// COLOR EXTRACTION FROM TITLE/VARIANT
// ============================================================================

export function extractHatchboxColorFromTitle(title: string, variantTitle?: string | null): string | null {
  // First try variant title (usually contains just the color)
  if (variantTitle && variantTitle !== 'Default Title') {
    const cleanVariant = variantTitle.toLowerCase().trim();
    // Check if it's a valid color
    if (getHatchboxColorHex(cleanVariant)) {
      return cleanVariant;
    }
    // Return variant if it's not a size/weight
    if (!cleanVariant.match(/\d+\s*(g|kg|mm|lbs?)/i)) {
      return cleanVariant;
    }
  }
  
  const cleanTitle = cleanHatchboxTitle(title).toLowerCase();
  
  // Try to match known colors
  for (const colorKey of Object.keys(HATCHBOX_COLOR_MAPPING)) {
    if (cleanTitle.includes(colorKey)) {
      return colorKey;
    }
  }
  
  // Extract color from typical patterns like "PLA - Orange" or "PLA True Orange"
  const dashMatch = cleanTitle.match(/(?:pla|abs|petg|tpu)[\s\-–]+(.+)$/i);
  if (dashMatch) {
    const potentialColor = dashMatch[1].trim();
    // Verify it's not a product variant indicator
    if (!potentialColor.match(/\d+\s*(g|kg|mm)/i) && potentialColor.length > 2) {
      return potentialColor;
    }
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface HatchboxEnrichmentResult {
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

export function enrichHatchboxProduct(
  title: string,
  variantTitle?: string | null,
  sku?: string | null,
  existingMaterial?: string | null
): HatchboxEnrichmentResult {
  // Check if it's an accessory (not a filament)
  const isAccessory = isHatchboxAccessory(title);
  
  if (isAccessory) {
    return {
      material: null,
      finish_type: 'Standard',
      product_line_id: 'hatchbox__accessory',
      tds_url: null,
      print_settings: null,
      color_hex: null,
      color_name: null,
      clean_title: cleanHatchboxTitle(title),
      is_accessory: true,
      high_speed_capable: false,
      diameter_nominal_mm: 1.75,
    };
  }
  
  const material = existingMaterial || normalizeHatchboxMaterial(title);
  const finishType = extractHatchboxFinishType(title);
  const productLineId = generateHatchboxProductLineId(title, material);
  const tdsUrl = getHatchboxTdsUrl(material);
  const printSettings = getHatchboxPrintSettings(material);
  const diameter = extractHatchboxDiameter(title, sku);
  
  // Determine color
  const extractedColor = extractHatchboxColorFromTitle(title, variantTitle);
  const colorHex = extractedColor ? getHatchboxColorHex(extractedColor) : null;
  
  return {
    material,
    finish_type: finishType,
    product_line_id: productLineId,
    tds_url: tdsUrl,
    print_settings: printSettings,
    color_hex: colorHex,
    color_name: extractedColor,
    clean_title: cleanHatchboxTitle(title),
    is_accessory: false,
    high_speed_capable: printSettings?.high_speed_capable ?? false,
    diameter_nominal_mm: diameter,
  };
}

// ============================================================================
// PRODUCT URL GENERATION
// ============================================================================

export function getHatchboxProductUrl(handle: string): string {
  return `https://www.hatchbox3d.com/products/${handle}`;
}

// ============================================================================
// SHOPIFY STORE INFO
// ============================================================================

export const HATCHBOX_STORE_INFO = {
  baseUrl: 'https://www.hatchbox3d.com',
  productsJsonUrl: 'https://www.hatchbox3d.com/products.json',
  vendor: 'Hatchbox',
  defaultDiameter: 1.75,
  defaultWeight: 1000, // 1kg
  defaultCurrency: 'USD',
  platform: 'shopify',
};
