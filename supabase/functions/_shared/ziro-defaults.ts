/**
 * Ziro Brand-Specific Defaults
 * 
 * Ziro (ZIRO 3D) is a Chinese manufacturer specializing in multi-color gradient
 * filaments and specialty PLA effects. Their Shopify store ziro3d.com features
 * 20+ PLA collections including Gradient, Twinkling, Diamond, and Mystical series.
 * 
 * Key characteristics:
 * - Shopify platform with full JSON API
 * - Specialty focus on gradient and multi-color effects
 * - Materials: PLA (various), PLA-CF, TPU-95A
 * - Unique finishes: Gradient, Twinkling, Firefly, Diamond, Mystical
 * - No formal TDS documents available
 * - 1.75mm diameter only
 */

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

interface MaterialPattern {
  pattern: RegExp;
  material: string;
  isAbrasive?: boolean;
  requiresEnclosure?: boolean;
  highSpeedCapable?: boolean;
}

const ZIRO_MATERIAL_PATTERNS: MaterialPattern[] = [
  // Carbon Fiber
  { pattern: /carbon\s*fiber|cf[\s-]*pla|pla[\s-]*cf/i, material: 'PLA-CF', isAbrasive: true },
  
  // High Speed PLA
  { pattern: /high\s*speed|fast\s*pla|hs[\s-]*pla/i, material: 'PLA-HS', highSpeedCapable: true },
  
  // TPU
  { pattern: /tpu|shore\s*95a|flex(?:ible)?/i, material: 'TPU-95A' },
  
  // Default PLA (must be last)
  { pattern: /pla/i, material: 'PLA' },
];

export function normalizeZiroMaterial(title: string): {
  material: string;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
  highSpeedCapable: boolean;
} {
  const titleLower = title.toLowerCase();
  
  for (const { pattern, material, isAbrasive, requiresEnclosure, highSpeedCapable } of ZIRO_MATERIAL_PATTERNS) {
    if (pattern.test(titleLower)) {
      return {
        material,
        isAbrasive: isAbrasive || false,
        requiresEnclosure: requiresEnclosure || false,
        highSpeedCapable: highSpeedCapable || false,
      };
    }
  }
  
  // Default to PLA
  return {
    material: 'PLA',
    isAbrasive: false,
    requiresEnclosure: false,
    highSpeedCapable: false,
  };
}

// ============================================================================
// PRINT SETTINGS
// ============================================================================

interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  requiresEnclosure?: boolean;
  highSpeedCapable?: boolean;
}

const ZIRO_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 45, bedTempMax: 60 },
  'PLA-HS': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 45, bedTempMax: 60, highSpeedCapable: true },
  'PLA-CF': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 65 },
  'TPU-95A': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 30, bedTempMax: 50 },
};

export function getZiroPrintSettings(material: string): PrintSettings {
  return ZIRO_PRINT_SETTINGS[material] || ZIRO_PRINT_SETTINGS['PLA'];
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 
  | 'Standard' | 'Silk' | 'Matte' | 'Gradient' | 'Multi' 
  | 'Sparkle' | 'Glow' | 'Fluorescent' | 'Translucent' 
  | 'Stone' | 'Shimmer';

export function extractZiroFinishType(title: string): FinishType {
  const titleLower = title.toLowerCase();
  
  // Gradient variations (check first - more specific)
  if (/gradient.*silk|silk.*gradient/i.test(titleLower)) return 'Gradient';
  if (/gradient.*matte|matte.*gradient/i.test(titleLower)) return 'Gradient';
  if (/gradient.*twinkling|twinkling.*gradient/i.test(titleLower)) return 'Gradient';
  if (/gradient.*translucent|translucent.*gradient/i.test(titleLower)) return 'Gradient';
  if (/gradient|fast\s*gradient/i.test(titleLower)) return 'Gradient';
  if (/crystal|season\s*series/i.test(titleLower)) return 'Gradient';
  
  // Multi-color
  if (/tri[\s-]?color|triple[\s-]?color|3[\s-]?color/i.test(titleLower)) return 'Multi';
  if (/dual[\s-]?color|double[\s-]?color|2[\s-]?color/i.test(titleLower)) return 'Multi';
  
  // Sparkle effects
  if (/firefly|twinkling|diamond|mystical|glitter/i.test(titleLower)) return 'Sparkle';
  
  // Basic finishes
  if (/silk|satin|pearlescent/i.test(titleLower)) return 'Silk';
  if (/matte|matt\b/i.test(titleLower)) return 'Matte';
  if (/glow|luminous|phosphorescent/i.test(titleLower)) return 'Glow';
  if (/fluorescent|neon|uv\s*reactive/i.test(titleLower)) return 'Fluorescent';
  if (/translucent|transparent|clear/i.test(titleLower)) return 'Translucent';
  if (/stone|marble|granite/i.test(titleLower)) return 'Stone';
  if (/metal|metallic|chrome/i.test(titleLower)) return 'Shimmer';
  
  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateZiroProductLineId(title: string, material: string): string {
  const titleLower = title.toLowerCase();
  const materialSlug = material.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Gradient series
  if (/fast\s*gradient\s*silk/i.test(titleLower)) return `ziro__${materialSlug}__gradient-silk`;
  if (/fast\s*gradient\s*matte/i.test(titleLower)) return `ziro__${materialSlug}__gradient-matte`;
  if (/gradient\s*twinkling|twinkling\s*gradient/i.test(titleLower)) return `ziro__${materialSlug}__gradient-twinkling`;
  if (/gradient\s*translucent|translucent\s*gradient/i.test(titleLower)) return `ziro__${materialSlug}__gradient-translucent`;
  if (/crystal\s*series/i.test(titleLower)) return `ziro__${materialSlug}__crystal`;
  if (/season\s*series/i.test(titleLower)) return `ziro__${materialSlug}__season`;
  
  // Tri-color series
  if (/tri[\s-]?color\s*silk/i.test(titleLower)) return `ziro__${materialSlug}__tricolor-silk`;
  if (/tri[\s-]?color\s*matte/i.test(titleLower)) return `ziro__${materialSlug}__tricolor-matte`;
  if (/tri[\s-]?color/i.test(titleLower)) return `ziro__${materialSlug}__tricolor`;
  
  // Special effect series
  if (/firefly/i.test(titleLower)) return `ziro__${materialSlug}__firefly`;
  if (/diamond/i.test(titleLower)) return `ziro__${materialSlug}__diamond`;
  if (/mystical/i.test(titleLower)) return `ziro__${materialSlug}__mystical`;
  if (/twinkling/i.test(titleLower)) return `ziro__${materialSlug}__twinkling`;
  
  // Basic finishes
  if (/silk/i.test(titleLower)) return `ziro__${materialSlug}__silk`;
  if (/matte/i.test(titleLower)) return `ziro__${materialSlug}__matte`;
  if (/glow/i.test(titleLower)) return `ziro__${materialSlug}__glow`;
  if (/fluorescent/i.test(titleLower)) return `ziro__${materialSlug}__fluorescent`;
  if (/translucent/i.test(titleLower)) return `ziro__${materialSlug}__translucent`;
  if (/stone|marble/i.test(titleLower)) return `ziro__${materialSlug}__stone`;
  if (/metal/i.test(titleLower)) return `ziro__${materialSlug}__metal`;
  if (/high\s*speed/i.test(titleLower)) return `ziro__${materialSlug}__high-speed`;
  
  // TPU series
  if (/flex/i.test(titleLower) && /tpu/i.test(titleLower)) return `ziro__tpu-95a__flex`;
  if (/tpu/i.test(titleLower)) return `ziro__tpu-95a__standard`;
  
  // Carbon fiber
  if (/carbon\s*fiber|cf/i.test(titleLower)) return `ziro__pla-cf__composite`;
  
  // Default
  return `ziro__${materialSlug}__standard`;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

const ZIRO_COLOR_MAPPING: Record<string, string> = {
  // Standard Colors
  'white': '#FFFFFF',
  'black': '#1A1A1A',
  'red': '#E53935',
  'blue': '#1E88E5',
  'green': '#43A047',
  'yellow': '#FDD835',
  'orange': '#FB8C00',
  'purple': '#8E24AA',
  'pink': '#EC407A',
  'grey': '#757575',
  'gray': '#757575',
  'brown': '#795548',
  'beige': '#D7CCC8',
  'cream': '#FFFDD0',
  'ivory': '#FFFFF0',
  
  // Gradient Series - Pastel
  'pastel spectrum': '#FFB6C1',
  'pastel rainbow': '#E6E6FA',
  'pastel dream': '#F0E6FA',
  'pastel sky': '#87CEEB',
  
  // Gradient Series - Earth
  'earth tone': '#8B7355',
  'earth blend': '#9C7A5C',
  'desert sand': '#C2B280',
  'forest blend': '#228B22',
  
  // Gradient Series - Vibrant
  'rainbow blaze': '#FF4500',
  'rainbow': '#FF0000',
  'sunset blend': '#FF6B35',
  'sunrise': '#FF7F50',
  'ocean wave': '#006994',
  'ocean blend': '#0077B6',
  'aurora': '#7FFF00',
  'galaxy': '#4B0082',
  'nebula': '#9932CC',
  'cosmic': '#2E0854',
  
  // Gemstone Series
  'amethyst': '#9966CC',
  'opal': '#A8C3BC',
  'emerald': '#50C878',
  'ruby': '#E0115F',
  'sapphire': '#0F52BA',
  'topaz': '#FFC87C',
  'jade': '#00A86B',
  'turquoise': '#40E0D0',
  'aquamarine': '#7FFFD4',
  'citrine': '#E4D00A',
  'garnet': '#733635',
  'peridot': '#E6E200',
  
  // Season Series
  'spring': '#98FB98',
  'spring blossom': '#FFB7C5',
  'summer': '#FFD700',
  'summer sunset': '#FF6347',
  'autumn': '#D2691E',
  'autumn leaves': '#CD853F',
  'winter': '#B0E0E6',
  'winter frost': '#F0F8FF',
  
  // Crystal Series
  'crystal clear': '#F5F5F5',
  'crystal blue': '#A7D8DE',
  'crystal pink': '#FFD1DC',
  'crystal green': '#90EE90',
  
  // Firefly Series
  'deepsea blue': '#003366',
  'obsidian gold': '#CFB53B',
  'flame red': '#E25822',
  'fairy green': '#76EE00',
  'midnight purple': '#4B0082',
  'starlight silver': '#C0C0C0',
  
  // Twinkling/Diamond Series
  'diamond white': '#F0F0F0',
  'diamond black': '#2C2C2C',
  'diamond gold': '#FFD700',
  'diamond silver': '#C0C0C0',
  'diamond rose': '#FF007F',
  'diamond blue': '#0000CD',
  
  // Mystical Series
  'mystical purple': '#9370DB',
  'mystical blue': '#4169E1',
  'mystical green': '#00CED1',
  'mystical rose': '#DB7093',
  
  // Stone/Marble Series
  'marble': '#F5F5F5',
  'marble white': '#FAFAFA',
  'marble grey': '#B0B0B0',
  'straw': '#E4D5A7',
  'blue and white': '#6495ED',
  
  // Metal Series
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'bronze': '#CD7F32',
  'copper': '#B87333',
  'rose gold': '#B76E79',
  'champagne': '#F7E7CE',
  
  // Silk Colors
  'silk white': '#FAFAFA',
  'silk black': '#2B2B2B',
  'silk red': '#DC143C',
  'silk blue': '#4169E1',
  'silk green': '#2E8B57',
  'silk gold': '#FFD700',
  'silk silver': '#C0C0C0',
  'silk purple': '#9932CC',
  'silk pink': '#FF69B4',
  'silk orange': '#FF8C00',
  
  // Matte Colors
  'matte white': '#F5F5F5',
  'matte black': '#1C1C1C',
  'matte red': '#B22222',
  'matte blue': '#4682B4',
  'matte green': '#3CB371',
  'matte grey': '#696969',
  
  // Glow Colors
  'glow green': '#39FF14',
  'glow blue': '#00BFFF',
  'glow orange': '#FF4500',
  'glow pink': '#FF1493',
  'glow yellow': '#FFFF00',
  
  // Fluorescent Colors
  'neon green': '#39FF14',
  'neon pink': '#FF6EC7',
  'neon orange': '#FF5F1F',
  'neon yellow': '#DFFF00',
  'neon blue': '#4D4DFF',
  
  // Translucent Colors
  'clear': '#F8F8F8',
  'translucent': '#F0F0F0',
  'translucent blue': '#ADD8E6',
  'translucent green': '#98FB98',
  'translucent red': '#FFB6C1',
  'translucent yellow': '#FFFACD',
  
  // TPU Flex Series (Gemstone-inspired)
  'flex candy': '#FF69B4',
  'flex amethyst': '#9966CC',
  'flex opal': '#A8C3BC',
  'flex nightsky': '#191970',
  'flex rainbow': '#FF0000',
  'flex lime': '#32CD32',
  'flex fuchsia': '#FF00FF',
  
  // High Speed Colors
  'hs white': '#FFFFFF',
  'hs black': '#1A1A1A',
  'hs grey': '#808080',
};

export function getZiroColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalizedColor = colorName.toLowerCase().trim();
  
  // Direct match
  if (ZIRO_COLOR_MAPPING[normalizedColor]) {
    return ZIRO_COLOR_MAPPING[normalizedColor];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(ZIRO_COLOR_MAPPING)) {
    if (normalizedColor.includes(key) || key.includes(normalizedColor)) {
      return hex;
    }
  }
  
  // Extract color from compound names
  const colorWords = normalizedColor.split(/[\s-]+/);
  for (const word of colorWords) {
    if (ZIRO_COLOR_MAPPING[word]) {
      return ZIRO_COLOR_MAPPING[word];
    }
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanZiroTitle(title: string): string {
  return title
    .replace(/ziro\s*/gi, '')
    .replace(/3d\s*filament/gi, '')
    .replace(/filament/gi, '')
    .replace(/1\.75\s*mm/gi, '')
    .replace(/2\.85\s*mm/gi, '')
    .replace(/\d+\s*g\b/gi, '')
    .replace(/\d+\s*kg\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface ZiroEnrichmentResult {
  material: string;
  finishType: FinishType;
  productLineId: string;
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  colorHex: string | null;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
  highSpeedCapable: boolean;
  tdsUrl: null; // Ziro doesn't publish TDS
  cleanedTitle: string;
}

export function enrichZiroProduct(
  title: string,
  existingMaterial?: string | null,
  colorName?: string | null
): ZiroEnrichmentResult {
  // Normalize material
  const { material, isAbrasive, requiresEnclosure, highSpeedCapable } = normalizeZiroMaterial(title);
  const finalMaterial = existingMaterial || material;
  
  // Get print settings
  const printSettings = getZiroPrintSettings(finalMaterial);
  
  // Extract finish type
  const finishType = extractZiroFinishType(title);
  
  // Generate product line ID
  const productLineId = generateZiroProductLineId(title, finalMaterial);
  
  // Get color hex
  const colorHex = colorName ? getZiroColorHex(colorName) : null;
  
  // Clean title
  const cleanedTitle = cleanZiroTitle(title);
  
  return {
    material: finalMaterial,
    finishType,
    productLineId,
    nozzleTempMin: printSettings.nozzleTempMin,
    nozzleTempMax: printSettings.nozzleTempMax,
    bedTempMin: printSettings.bedTempMin,
    bedTempMax: printSettings.bedTempMax,
    colorHex,
    isAbrasive,
    requiresEnclosure,
    highSpeedCapable: highSpeedCapable || printSettings.highSpeedCapable || false,
    tdsUrl: null, // Ziro doesn't have TDS documents
    cleanedTitle,
  };
}

// ============================================================================
// STORE INFORMATION
// ============================================================================

export const ZIRO_STORE_INFO = {
  vendorName: 'Ziro',
  platformType: 'shopify',
  baseUrl: 'https://ziro3d.com',
  productsUrl: 'https://ziro3d.com/products.json',
  defaultDiameter: 1.75,
  defaultCurrency: 'USD',
  hasApi: true,
  hasTds: false,
  notes: 'Shopify platform with full JSON API. Specializes in multi-color gradient filaments and specialty PLA effects. No formal TDS documents available.',
};
