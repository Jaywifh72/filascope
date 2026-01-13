/**
 * Sovol Brand-Specific Defaults
 * 
 * Handles material normalization, finish type detection, print settings,
 * color mapping, and product line ID generation for Sovol filaments.
 */

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

interface MaterialPattern {
  pattern: RegExp;
  material: string;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
}

const SOVOL_MATERIAL_PATTERNS: MaterialPattern[] = [
  // PLA variants (order matters - more specific first)
  { pattern: /\b(pla\s*matte|matte\s*pla)\b/i, material: 'PLA-Matte', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\b(pla\s*silk|silk\s*pla)\b/i, material: 'PLA-Silk', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\b(chameleon\s*pla|pla\s*chameleon)\b/i, material: 'PLA-Chameleon', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\b(glow[\s-]?in[\s-]?dark|gid\s*pla|pla\s*glow)\b/i, material: 'PLA-Glow', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\bpla\b/i, material: 'PLA', isAbrasive: false, requiresEnclosure: false },
  
  // PETG variants
  { pattern: /\b(petg\s*gradient|gradient\s*petg)\b/i, material: 'PETG-Gradient', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\b(petg|pet-g)\b/i, material: 'PETG', isAbrasive: false, requiresEnclosure: false },
  
  // TPU
  { pattern: /\btpu\b/i, material: 'TPU', isAbrasive: false, requiresEnclosure: false },
  
  // ABS
  { pattern: /\babs\b/i, material: 'ABS', isAbrasive: false, requiresEnclosure: true },
];

export function normalizeSovolMaterial(title: string): { material: string | null; isAbrasive: boolean; requiresEnclosure: boolean } {
  const normalizedTitle = title.toLowerCase();
  
  for (const { pattern, material, isAbrasive, requiresEnclosure } of SOVOL_MATERIAL_PATTERNS) {
    if (pattern.test(normalizedTitle)) {
      return { material, isAbrasive, requiresEnclosure };
    }
  }
  
  return { material: null, isAbrasive: false, requiresEnclosure: false };
}

// ============================================================================
// PRINT SETTINGS
// ============================================================================

interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
}

const SOVOL_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 45, bedTempMax: 60 },
  'PLA-Matte': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 45, bedTempMax: 60 },
  'PLA-Silk': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 45, bedTempMax: 60 },
  'PLA-Chameleon': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 45, bedTempMax: 60 },
  'PLA-Glow': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 45, bedTempMax: 60 },
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 80 },
  'PETG-Gradient': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 80 },
  'TPU': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 30, bedTempMax: 50 },
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 95, bedTempMax: 110 },
};

export function getSovolPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  return SOVOL_PRINT_SETTINGS[material] || null;
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

type FinishType = 'Silk' | 'Matte' | 'Shimmer' | 'Glow' | 'Standard';

export function extractSovolFinishType(title: string, material?: string | null): FinishType {
  const lowerTitle = title.toLowerCase();
  
  // Check for silk variants (Rainbow, Dual, Tri, Single, etc.)
  if (/\b(silk|rainbow|dual[-\s]?color|tri[-\s]?color|single[-\s]?color)\b/i.test(lowerTitle)) {
    return 'Silk';
  }
  
  // Check for matte
  if (/\bmatte\b/i.test(lowerTitle)) {
    return 'Matte';
  }
  
  // Check for chameleon/gradient (shimmer effect)
  if (/\b(chameleon|gradient)\b/i.test(lowerTitle)) {
    return 'Shimmer';
  }
  
  // Check for glow-in-dark
  if (/\b(glow[\s-]?in[\s-]?dark|gid|phosphorescent)\b/i.test(lowerTitle)) {
    return 'Glow';
  }
  
  // Check material-based finish
  if (material) {
    if (material.includes('Silk')) return 'Silk';
    if (material.includes('Matte')) return 'Matte';
    if (material.includes('Chameleon') || material.includes('Gradient')) return 'Shimmer';
    if (material.includes('Glow')) return 'Glow';
  }
  
  return 'Standard';
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanSovolTitle(title: string): string {
  return title
    // Remove brand prefix
    .replace(/^sovol\s+/i, '')
    // Remove weight suffixes
    .replace(/\s*[\(\[]?\s*\d+(\.\d+)?\s*kg\s*[\)\]]?\s*/gi, ' ')
    .replace(/\s*\d+(\.\d+)?\s*kg\b/gi, '')
    // Remove diameter references
    .replace(/\s*1\.75\s*mm\s*/gi, ' ')
    // Remove generic suffixes
    .replace(/\s*(3d\s*)?(printing\s*)?filaments?\s*$/i, '')
    .replace(/\s*fdm\s*(printing\s*)?filament\s*$/i, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

type SilkVariant = 'rainbow' | 'dual' | 'tri' | 'single' | 'standard';

function detectSilkVariant(title: string): SilkVariant {
  const lowerTitle = title.toLowerCase();
  
  if (/\brainbow\b/i.test(lowerTitle)) return 'rainbow';
  if (/\b(dual[-\s]?color|dual)\b/i.test(lowerTitle)) return 'dual';
  if (/\b(tri[-\s]?color|tri)\b/i.test(lowerTitle)) return 'tri';
  if (/\b(single[-\s]?color|single)\b/i.test(lowerTitle)) return 'single';
  
  return 'standard';
}

export function generateSovolProductLineId(title: string, material?: string | null): string {
  const lowerTitle = title.toLowerCase();
  const normalizedMaterial = material?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'unknown';
  
  // Check for bundle/blind box
  if (/\b(blind\s*box|bundle|pack|set)\b/i.test(lowerTitle)) {
    return 'sovol__bundle__mixed';
  }
  
  // Handle silk variants specially
  if (normalizedMaterial.includes('silk') || /\bsilk\b/i.test(lowerTitle)) {
    const silkVariant = detectSilkVariant(title);
    return `sovol__pla-silk__${silkVariant}`;
  }
  
  // Map material to product line
  const materialSlug = normalizedMaterial
    .replace(/^pla-/, 'pla-')
    .replace(/^petg-/, 'petg-');
  
  return `sovol__${materialSlug}__standard`;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

// Standard solid colors
const SOVOL_COLOR_MAPPING: Record<string, string> = {
  // Basic colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'grey': '#808080',
  'gray': '#808080',
  'red': '#DC2626',
  'blue': '#2563EB',
  'green': '#16A34A',
  'yellow': '#FACC15',
  'orange': '#EA580C',
  'purple': '#9333EA',
  'pink': '#EC4899',
  'cyan': '#06B6D4',
  'brown': '#92400E',
  'beige': '#D4A574',
  'cream': '#FFFDD0',
  'natural': '#F5E6D3',
  'transparent': '#E5E5E5',
  'clear': '#E8E8E8',
  
  // Extended colors
  'navy': '#1E3A5F',
  'sky blue': '#87CEEB',
  'light blue': '#ADD8E6',
  'dark blue': '#00008B',
  'lime': '#32CD32',
  'forest green': '#228B22',
  'dark green': '#006400',
  'mint': '#98FB98',
  'olive': '#808000',
  'teal': '#008080',
  'magenta': '#FF00FF',
  'violet': '#8B00FF',
  'lavender': '#E6E6FA',
  'coral': '#FF7F50',
  'salmon': '#FA8072',
  'burgundy': '#800020',
  'maroon': '#800000',
  'wine': '#722F37',
  'rose': '#FF007F',
  'peach': '#FFCBA4',
  'gold': '#FFD700',
  'bronze': '#CD7F32',
  'copper': '#B87333',
  'silver': '#C0C0C0',
  
  // Gradient PETG colors
  'gradient blue': '#4F46E5',
  'gradient green': '#10B981',
  'gradient purple': '#8B5CF6',
  'gradient pink': '#EC4899',
  'gradient orange': '#F97316',
  'blue purple': '#6366F1',
  'green blue': '#14B8A6',
  'pink purple': '#A855F7',
  'yellow orange': '#FB923C',
  'red orange': '#EF4444',
  
  // Glow colors
  'glow green': '#39FF14',
  'glow blue': '#00FFFF',
  'glow yellow': '#FFFF00',
  'glow orange': '#FF6600',
  'glow pink': '#FF69B4',
  
  // Chameleon colors (base color)
  'chameleon': '#4B0082',
  'chameleon blue': '#1E90FF',
  'chameleon green': '#00FA9A',
  'chameleon purple': '#9400D3',
  'chameleon red': '#FF4500',
};

// Silk PLA specific colors
const SOVOL_SILK_COLORS: Record<string, string> = {
  // Single metallic colors
  'golden': '#FFD700',
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'copper': '#B87333',
  'bronze': '#CD7F32',
  'rose gold': '#B76E79',
  'champagne': '#F7E7CE',
  'red gold': '#CD5C5C',
  
  // Rainbow variants
  'rainbow': '#FF69B4',
  'rainbow-r': '#FF0000',
  'rainbow forest': '#228B22',
  'rainbow-forest': '#228B22',
  'rainbow universe': '#191970',
  'rainbow-universe': '#191970',
  'rainbow candy': '#FF69B4',
  'rainbow-candy': '#FF69B4',
  'pink rainbow': '#FF69B4',
  
  // Tri-color variants
  'tri-green purple copper': '#00CED1',
  'green purple copper': '#00CED1',
  'tri-gold silver copper': '#FFD700',
  'gold silver copper': '#FFD700',
  'tri-blue yellow fuchsia': '#4169E1',
  'blue yellow fuchsia': '#4169E1',
  'dark red green blue': '#8B0000',
  'gold green rose': '#BDB76B',
  'blue green orange': '#20B2AA',
  
  // Dual-color variants
  'dual-blue red': '#6A5ACD',
  'blue red': '#6A5ACD',
  'dual-blue orange': '#1E90FF',
  'blue orange': '#1E90FF',
  'dual-gold red': '#DAA520',
  'gold red': '#DAA520',
  'dual-silver gold': '#D4AF37',
  'silver gold': '#D4AF37',
  'dual-purple pink': '#9370DB',
  'purple pink': '#9370DB',
  'dual-green gold': '#9ACD32',
  'green gold': '#9ACD32',
};

export function getSovolColorHex(colorName: string, finishType?: FinishType): string | null {
  if (!colorName) return null;
  
  // Strip multi-pack identifiers: "White*10" → "White"
  let cleanedColor = colorName.replace(/\*\d+$/, '').trim();
  
  const normalizedColor = cleanedColor.toLowerCase().trim();
  
  // Check silk colors first for silk finish types
  if (finishType === 'Silk') {
    const silkHex = SOVOL_SILK_COLORS[normalizedColor];
    if (silkHex) return silkHex;
  }
  
  // Check silk colors mapping
  const silkMatch = SOVOL_SILK_COLORS[normalizedColor];
  if (silkMatch) return silkMatch;
  
  // Check standard color mapping
  const standardMatch = SOVOL_COLOR_MAPPING[normalizedColor];
  if (standardMatch) return standardMatch;
  
  // Try partial matching for compound colors
  for (const [key, hex] of Object.entries(SOVOL_COLOR_MAPPING)) {
    if (normalizedColor.includes(key) || key.includes(normalizedColor)) {
      return hex;
    }
  }
  
  for (const [key, hex] of Object.entries(SOVOL_SILK_COLORS)) {
    if (normalizedColor.includes(key) || key.includes(normalizedColor)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface SovolEnrichmentResult {
  material: string | null;
  finishType: FinishType;
  printSettings: PrintSettings | null;
  productLineId: string;
  colorHex: string | null;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
  cleanedTitle: string;
}

export function enrichSovolProduct(
  title: string,
  colorName?: string,
  existingMaterial?: string | null
): SovolEnrichmentResult {
  // Normalize material
  const { material, isAbrasive, requiresEnclosure } = normalizeSovolMaterial(title);
  const finalMaterial = existingMaterial || material;
  
  // Get finish type
  const finishType = extractSovolFinishType(title, finalMaterial);
  
  // Get print settings
  const printSettings = getSovolPrintSettings(finalMaterial);
  
  // Generate product line ID
  const productLineId = generateSovolProductLineId(title, finalMaterial);
  
  // Get color hex
  const colorHex = colorName ? getSovolColorHex(colorName, finishType) : null;
  
  // Clean title
  const cleanedTitle = cleanSovolTitle(title);
  
  return {
    material: finalMaterial,
    finishType,
    printSettings,
    productLineId,
    colorHex,
    isAbrasive,
    requiresEnclosure,
    cleanedTitle,
  };
}

// ============================================================================
// VARIANT PARSING
// ============================================================================

export interface ParsedVariant {
  color: string | null;
  shipFrom: string | null;
  weight: number | null;
}

export function parseSovolVariant(variantTitle: string): ParsedVariant {
  const parts = variantTitle.split('/').map(p => p.trim());
  
  let color: string | null = null;
  let shipFrom: string | null = null;
  let weight: number | null = null;
  
  for (const part of parts) {
    const lowerPart = part.toLowerCase();
    
    // Check for ship from location
    if (/\b(us|eu|ca|uk|au)\b/i.test(lowerPart) || /\b(united\s*states|europe|canada|australia)\b/i.test(lowerPart)) {
      if (/\bus\b|united\s*states/i.test(lowerPart)) shipFrom = 'US';
      else if (/\beu\b|europe/i.test(lowerPart)) shipFrom = 'EU';
      else if (/\bca\b|canada/i.test(lowerPart)) shipFrom = 'CA';
      else if (/\buk\b/i.test(lowerPart)) shipFrom = 'UK';
      else if (/\bau\b|australia/i.test(lowerPart)) shipFrom = 'AU';
      continue;
    }
    
    // Check for weight
    const weightMatch = lowerPart.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (weightMatch) {
      weight = parseFloat(weightMatch[1]) * 1000; // Convert to grams
      continue;
    }
    
    // Assume remaining is color - normalize multi-pack format
    if (!color && part.length > 0) {
      // Remove quantity multipliers: "White*10" → "White"
      color = part.replace(/\*\d+$/, '').trim();
    }
  }
  
  return { color, shipFrom, weight };
}

// ============================================================================
// PRODUCT FILTERING
// ============================================================================

export function isSovolFilament(product: { title: string; product_type?: string; tags?: string[] }): boolean {
  const title = product.title.toLowerCase();
  const productType = product.product_type?.toLowerCase() || '';
  const tags = product.tags?.map(t => t.toLowerCase()) || [];
  
  // Exclude non-filament products
  const excludePatterns = [
    /\b(printer|sv\d+|klipper|pad|screen|extruder|hotend|nozzle|bed|plate|enclosure)\b/i,
    /\b(upgrade|kit|accessory|part|spare|replacement)\b/i,
    /\b(dryer|dry\s*box|storage)\b/i,
    /\b(resin|lcd|msla|dlp)\b/i,
  ];
  
  for (const pattern of excludePatterns) {
    if (pattern.test(title)) return false;
  }
  
  // Include filament products
  const includePatterns = [
    /\bfilament\b/i,
    /\b(pla|petg|abs|tpu)\b/i,
    /\b(silk|matte|glow|chameleon|gradient)\b/i,
  ];
  
  for (const pattern of includePatterns) {
    if (pattern.test(title)) return true;
  }
  
  // Check product type
  if (productType.includes('filament')) return true;
  
  // Check tags
  if (tags.some(t => t.includes('filament'))) return true;
  
  return false;
}
