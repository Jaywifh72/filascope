// Sunlu brand-specific defaults and enrichment utilities
// Used by sync-sunlu-products edge function

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

interface MaterialPattern {
  pattern: RegExp;
  material: string;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
}

const SUNLU_MATERIAL_PATTERNS: MaterialPattern[] = [
  // High-performance engineering (check first)
  { pattern: /\bpeek\b/i, material: 'PEEK', isAbrasive: true, requiresEnclosure: true },
  { pattern: /\bpa[\-\s]?cf\b|\bnylon[\-\s]?cf\b/i, material: 'PA-CF', isAbrasive: true, requiresEnclosure: true },
  { pattern: /\bpc\b|\bpolycarbonate\b/i, material: 'PC', isAbrasive: false, requiresEnclosure: true },
  { pattern: /\bpp\b|\bpolypropylene\b/i, material: 'PP', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\bpvb\b/i, material: 'PVB', isAbrasive: false, requiresEnclosure: false },
  
  // Nylon/PA variants
  { pattern: /\bpa\b|\bnylon\b/i, material: 'PA', isAbrasive: false, requiresEnclosure: true },
  
  // ABS variants (check specific first)
  { pattern: /\babs[\-\s]?gf\b|\babs[\-\s]?glass/i, material: 'ABS-GF', isAbrasive: true, requiresEnclosure: true },
  { pattern: /\babs[\-\s]?fr\b|\bflame[\-\s]?retardant/i, material: 'ABS-FR', isAbrasive: false, requiresEnclosure: true },
  { pattern: /\be[\-\s]?abs\b|\beasy[\-\s]?abs\b/i, material: 'ABS-Easy', isAbrasive: false, requiresEnclosure: true },
  { pattern: /\babs\b/i, material: 'ABS', isAbrasive: false, requiresEnclosure: true },
  
  // ASA
  { pattern: /\basa\b/i, material: 'ASA', isAbrasive: false, requiresEnclosure: true },
  
  // TPU variants
  { pattern: /\btpu[\-\s]?90a\b/i, material: 'TPU-90A', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\btpu\b|\bflexible\b/i, material: 'TPU', isAbrasive: false, requiresEnclosure: false },
  
  // PETG variants (check specific first)
  { pattern: /\bpetg[\-\s]?cf\b/i, material: 'PETG-CF', isAbrasive: true, requiresEnclosure: false },
  { pattern: /\bpetg[\-\s]?matte\b|\bmatte[\-\s]?petg\b|\bhs[\-\s]?matte[\-\s]?petg\b/i, material: 'PETG-Matte', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\bpetg\b|\bpet[\-\s]?g\b/i, material: 'PETG', isAbrasive: false, requiresEnclosure: false },
  
  // PLA variants (check specific first)
  { pattern: /\bpla[\-\s]?cf\b/i, material: 'PLA-CF', isAbrasive: true, requiresEnclosure: false },
  { pattern: /\bpla[\-\s]?meta\b|\bmeta[\-\s]?pla\b/i, material: 'PLA-Meta', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\bapla\b|\bantistring\b|\banti[\-\s]?string\b/i, material: 'PLA-AntiString', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\bhs[\-\s]?pla\+|\bhspla\+/i, material: 'PLA+', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\bpla\+|\bpla[\-\s]?plus\b|\bpla\+[\-\s]?2\.?0\b/i, material: 'PLA+', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\bsilk[\-\s]?pla\b|\bpla[\-\s]?silk\b/i, material: 'PLA-Silk', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\bmatte[\-\s]?pla\b|\bpla[\-\s]?matte\b|\bhs[\-\s]?matte[\-\s]?pla\b/i, material: 'PLA-Matte', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\bmarble[\-\s]?pla\b|\bpla[\-\s]?marble\b/i, material: 'PLA-Marble', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\bglow\b|\bluminous\b|\bglow[\-\s]?in[\-\s]?dark\b|\bgid\b/i, material: 'PLA-Glow', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\bwood[\-\s]?pla\b|\bpla[\-\s]?wood\b|\bwooden\b/i, material: 'PLA-Wood', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\bpla\b/i, material: 'PLA', isAbrasive: false, requiresEnclosure: false },
];

export function normalizeSunluMaterial(title: string): { material: string | null; isAbrasive: boolean; requiresEnclosure: boolean } {
  const normalizedTitle = title.toLowerCase();
  
  for (const { pattern, material, isAbrasive, requiresEnclosure } of SUNLU_MATERIAL_PATTERNS) {
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
}

const SUNLU_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'PLA+': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'PLA-Meta': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'PLA-Matte': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PLA-Silk': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'PLA-Marble': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PLA-Glow': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PLA-Wood': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PLA-CF': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'PLA-AntiString': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 80 },
  'PETG-Matte': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 80 },
  'PETG-CF': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 75, bedTempMax: 85 },
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 95, bedTempMax: 105 },
  'ABS-Easy': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 80, bedTempMax: 100 },
  'ABS-FR': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 95, bedTempMax: 105 },
  'ABS-GF': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 95, bedTempMax: 110 },
  'ASA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 105 },
  'TPU': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 40, bedTempMax: 60 },
  'TPU-90A': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 40, bedTempMax: 60 },
  'PA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 80, bedTempMax: 90 },
  'PA-CF': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 80, bedTempMax: 90 },
  'PC': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 100, bedTempMax: 110 },
  'PP': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 80, bedTempMax: 90 },
  'PVB': { nozzleTempMin: 190, nozzleTempMax: 210, bedTempMin: 50, bedTempMax: 60 },
  'PEEK': { nozzleTempMin: 380, nozzleTempMax: 420, bedTempMin: 120, bedTempMax: 150 },
};

export function getSunluPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  return SUNLU_PRINT_SETTINGS[material] || null;
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

type FinishType = 'Silk' | 'Matte' | 'Marble' | 'Glow' | 'Wood' | 'Metallic' | 'Glossy' | 'Gradient' | 'Standard';

export function extractSunluFinishType(title: string, material?: string | null): FinishType {
  const lower = title.toLowerCase();
  
  // Check title patterns
  if (/\bsilk\b|\bshiny\b/i.test(lower)) return 'Silk';
  if (/\bmatte\b|\bmatt\b/i.test(lower)) return 'Matte';
  if (/\bmarble\b|\bstone\b/i.test(lower)) return 'Marble';
  if (/\bglow\b|\bluminous\b|\bgid\b/i.test(lower)) return 'Glow';
  if (/\bwood\b|\bwooden\b/i.test(lower)) return 'Wood';
  if (/\bmetallic\b|\bmetal\b/i.test(lower)) return 'Metallic';
  if (/\bglossy\b|\bgloss\b/i.test(lower)) return 'Glossy';
  if (/\brainbow\b|\bmulticolor\b|\bgradient\b/i.test(lower)) return 'Gradient';
  
  // Check material-based finish
  if (material) {
    if (material.includes('Silk')) return 'Silk';
    if (material.includes('Matte')) return 'Matte';
    if (material.includes('Marble')) return 'Marble';
    if (material.includes('Glow')) return 'Glow';
    if (material.includes('Wood')) return 'Wood';
  }
  
  return 'Standard';
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanSunluTitle(title: string): string {
  let cleaned = title;
  
  // Remove SUNLU prefix
  cleaned = cleaned.replace(/^sunlu\s+/i, '');
  
  // Remove MOQ prefixes
  cleaned = cleaned.replace(/\[moq[:\s]*\d+\s*(?:kg|sets?)?\]\s*/gi, '');
  
  // Remove weight suffixes
  cleaned = cleaned.replace(/\s*[\(\[\-]\s*\d+(?:\.?\d*)?\s*(?:g|kg|gram|kilo)\s*[\)\]]/gi, '');
  cleaned = cleaned.replace(/\s+\d+(?:\.?\d*)?\s*(?:g|kg)\s*$/i, '');
  
  // Remove diameter references
  cleaned = cleaned.replace(/\s*1\.75\s*mm\s*/gi, ' ');
  
  // Remove common suffixes
  cleaned = cleaned.replace(/\s*3d\s*(?:printer\s*)?filament\s*/gi, ' ');
  cleaned = cleaned.replace(/\s*3d\s*printing\s*filament\s*/gi, ' ');
  cleaned = cleaned.replace(/\s*filament\s*$/i, '');
  
  // Remove promotional text
  cleaned = cleaned.replace(/\s*p\.?s\.?:?\s*.*/gi, '');
  cleaned = cleaned.replace(/\s*for\s*new\s*refill\s*spool\s*/gi, ' ');
  
  // Normalize HS_PLA notation
  cleaned = cleaned.replace(/\(hs_pla\)/gi, 'High Speed PLA');
  
  // Clean up whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

type HighSpeedVariant = 'standard' | 'high-speed';

function detectHighSpeedVariant(title: string): HighSpeedVariant {
  if (/\bhs[\-_]|\bhigh[\-\s]?speed\b|\bmeta\b/i.test(title)) {
    return 'high-speed';
  }
  return 'standard';
}

export function generateSunluProductLineId(title: string, material?: string | null): string {
  const lowerTitle = title.toLowerCase();
  const hsVariant = detectHighSpeedVariant(title);
  
  // Check for bundles/sample packs
  if (/\bbundle\b|\bsample\b|\bstarter\b|\bvariety\b|\bpack\b/i.test(lowerTitle)) {
    return 'sunlu__bundle__mixed';
  }
  
  // Determine base material
  let baseMaterial = material?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'unknown';
  
  // Generate product line ID
  return `sunlu__${baseMaterial}__${hsVariant}`;
}

// ============================================================================
// TDS URL
// ============================================================================

export const SUNLU_TDS_URL = 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/SUNLU_Filament_Guide.pdf';
export const SUNLU_TDS_PAGE = 'https://store.sunlu.com/pages/filament-guide';

// ============================================================================
// COLOR MAPPING
// ============================================================================

const SUNLU_COLOR_MAPPING: Record<string, string> = {
  // Basic colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'grey': '#808080',
  'gray': '#808080',
  'silver': '#C0C0C0',
  'red': '#DC2626',
  'blue': '#2563EB',
  'green': '#16A34A',
  'yellow': '#FACC15',
  'orange': '#EA580C',
  'purple': '#9333EA',
  'pink': '#EC4899',
  'cyan': '#06B6D4',
  'brown': '#92400E',
  'beige': '#D4C4A8',
  'cream': '#FFFDD0',
  'ivory': '#FFFFF0',
  'gold': '#FFD700',
  'copper': '#B87333',
  'bronze': '#CD7F32',
  'navy': '#1E3A5F',
  'teal': '#0D9488',
  'olive': '#808000',
  'maroon': '#800000',
  'magenta': '#FF00FF',
  'violet': '#8B5CF6',
  'lavender': '#E6E6FA',
  'mint': '#98FF98',
  'coral': '#FF7F50',
  'salmon': '#FA8072',
  'peach': '#FFCBA4',
  'turquoise': '#40E0D0',
  'lime': '#32CD32',
  'chartreuse': '#7FFF00',
  'khaki': '#C3B091',
  'tan': '#D2B48C',
  
  // Light variants
  'light blue': '#87CEEB',
  'light green': '#90EE90',
  'light pink': '#FFB6C1',
  'light grey': '#D3D3D3',
  'light gray': '#D3D3D3',
  'light purple': '#DDA0DD',
  
  // Dark variants
  'dark blue': '#00008B',
  'dark green': '#006400',
  'dark red': '#8B0000',
  'dark grey': '#404040',
  'dark gray': '#404040',
  'dark brown': '#654321',
  
  // Natural/clear
  'natural': '#F5F5DC',
  'clear': '#E8E8E8',
  'transparent': '#E8E8E8',
  'translucent': '#E8E8E8',
  
  // Wood colors
  'wood': '#DEB887',
  'walnut': '#5D432C',
  'oak': '#C4A35A',
  'bamboo': '#E3D4AD',
  'cherry': '#DE3163',
  'mahogany': '#C04000',
  
  // Special colors
  'skin': '#FFDBAC',
  'flesh': '#FFDBAC',
  'nude': '#E3BC9A',
  'army green': '#4B5320',
  'forest green': '#228B22',
  'sky blue': '#87CEEB',
  'ocean blue': '#006994',
  'royal blue': '#4169E1',
  'cobalt': '#0047AB',
  'sapphire': '#0F52BA',
  'ruby': '#E0115F',
  'emerald': '#50C878',
  'rose': '#FF007F',
  'rose gold': '#B76E79',
  'champagne': '#F7E7CE',
  'wine': '#722F37',
  'burgundy': '#800020',
  'chocolate': '#7B3F00',
  'coffee': '#6F4E37',
  'caramel': '#FFD59A',
  'honey': '#EB9605',
  'lemon': '#FFF44F',
  'grass': '#7CFC00',
  'jade': '#00A86B',
  'aqua': '#00FFFF',
  'azure': '#007FFF',
  'indigo': '#4B0082',
  'plum': '#8E4585',
  'grape': '#6F2DA8',
  'lilac': '#C8A2C8',
  'orchid': '#DA70D6',
  'fuchsia': '#FF00FF',
  'hot pink': '#FF69B4',
  'neon green': '#39FF14',
  'neon pink': '#FF6EC7',
  'neon orange': '#FF5F1F',
  'neon yellow': '#DFFF00',
  
  // Glow colors
  'glow green': '#39FF14',
  'glow blue': '#00BFFF',
  'glow yellow': '#FFFF00',
  'glow orange': '#FF4500',
  'glow pink': '#FF69B4',
  'glow white': '#F0F0F0',
};

const SUNLU_SILK_COLORS: Record<string, string> = {
  // Silk single colors
  'silk gold': '#FFD700',
  'silk silver': '#C0C0C0',
  'silk copper': '#B87333',
  'silk bronze': '#CD7F32',
  'silk red': '#B22222',
  'silk blue': '#4169E1',
  'silk green': '#228B22',
  'silk purple': '#8B008B',
  'silk pink': '#FF69B4',
  'silk orange': '#FF8C00',
  'silk white': '#F8F8FF',
  'silk black': '#2F2F2F',
  'silk rose gold': '#B76E79',
  'silk champagne': '#F7E7CE',
  
  // Silk dual colors
  'silk red gold': '#CD5C5C',
  'silk blue gold': '#4682B4',
  'silk green gold': '#6B8E23',
  'silk purple gold': '#9370DB',
  'silk pink gold': '#DDA0DD',
  'silk red blue': '#8B0000',
  'silk blue green': '#20B2AA',
  'silk red green': '#8B4513',
  
  // Silk rainbow
  'silk rainbow': '#FF69B4',
  'rainbow': '#FF69B4',
};

export function getSunluColorHex(colorName: string, finishType?: FinishType): string | null {
  if (!colorName) return null;
  
  const normalizedColor = colorName.toLowerCase().trim();
  
  // Check silk colors first if finish is Silk
  if (finishType === 'Silk') {
    const silkKey = `silk ${normalizedColor}`;
    if (SUNLU_SILK_COLORS[silkKey]) {
      return SUNLU_SILK_COLORS[silkKey];
    }
  }
  
  // Check silk color mapping
  if (SUNLU_SILK_COLORS[normalizedColor]) {
    return SUNLU_SILK_COLORS[normalizedColor];
  }
  
  // Check standard colors
  if (SUNLU_COLOR_MAPPING[normalizedColor]) {
    return SUNLU_COLOR_MAPPING[normalizedColor];
  }
  
  // Try partial matching
  for (const [key, hex] of Object.entries(SUNLU_COLOR_MAPPING)) {
    if (normalizedColor.includes(key) || key.includes(normalizedColor)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface SunluEnrichmentResult {
  material: string | null;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
  finishType: FinishType;
  productLineId: string;
  printSettings: PrintSettings | null;
  colorHex: string | null;
  cleanedTitle: string;
  tdsUrl: string;
}

export function enrichSunluProduct(
  title: string,
  colorName?: string,
  existingMaterial?: string | null
): SunluEnrichmentResult {
  // Normalize material
  const { material, isAbrasive, requiresEnclosure } = normalizeSunluMaterial(title);
  const finalMaterial = material || existingMaterial || null;
  
  // Extract finish type
  const finishType = extractSunluFinishType(title, finalMaterial);
  
  // Generate product line ID
  const productLineId = generateSunluProductLineId(title, finalMaterial);
  
  // Get print settings
  const printSettings = getSunluPrintSettings(finalMaterial);
  
  // Get color hex
  const colorHex = getSunluColorHex(colorName || '', finishType);
  
  // Clean title
  const cleanedTitle = cleanSunluTitle(title);
  
  return {
    material: finalMaterial,
    isAbrasive,
    requiresEnclosure,
    finishType,
    productLineId,
    printSettings,
    colorHex,
    cleanedTitle,
    tdsUrl: SUNLU_TDS_URL,
  };
}

// ============================================================================
// VARIANT PARSING
// ============================================================================

export interface ParsedVariant {
  color: string | null;
  shipFrom: string | null;
  weight: number | null;
  size: string | null;
}

export function parseSunluVariant(variantTitle: string): ParsedVariant {
  const parts = variantTitle.split('/').map(p => p.trim());
  
  let color: string | null = null;
  let shipFrom: string | null = null;
  let weight: number | null = null;
  let size: string | null = null;
  
  for (const part of parts) {
    const lowerPart = part.toLowerCase();
    
    // Check for ship from location
    if (/\bus\b|\busa\b|\bunited states\b/i.test(lowerPart)) {
      shipFrom = 'US';
      continue;
    }
    if (/\beu\b|\beurope\b/i.test(lowerPart)) {
      shipFrom = 'EU';
      continue;
    }
    if (/\bca\b|\bcanada\b/i.test(lowerPart)) {
      shipFrom = 'CA';
      continue;
    }
    if (/\bau\b|\baustralia\b/i.test(lowerPart)) {
      shipFrom = 'AU';
      continue;
    }
    if (/\buk\b|\bunited kingdom\b/i.test(lowerPart)) {
      shipFrom = 'UK';
      continue;
    }
    
    // Check for weight/size
    const weightMatch = lowerPart.match(/(\d+(?:\.\d+)?)\s*(?:kg|g)/i);
    if (weightMatch) {
      const value = parseFloat(weightMatch[1]);
      weight = lowerPart.includes('g') && !lowerPart.includes('kg') ? value : value * 1000;
      size = part;
      continue;
    }
    
    // Check for size variants
    if (/large\s*spool|small\s*spool|refill/i.test(lowerPart)) {
      size = part;
      continue;
    }
    
    // Assume remaining is color
    if (!color && part.length > 0) {
      color = part;
    }
  }
  
  return { color, shipFrom, weight, size };
}

// ============================================================================
// PRODUCT FILTERING
// ============================================================================

export function isSunluFilament(product: { title: string; product_type?: string; tags?: string[] }): boolean {
  const title = product.title.toLowerCase();
  const productType = (product.product_type || '').toLowerCase();
  const tags = (product.tags || []).map(t => t.toLowerCase());
  
  // Exclude non-filament products
  const exclusions = [
    'dryer', 'dry box', 'drybox',
    'printer', '3d printer',
    'nozzle', 'hotend', 'hot end',
    'spool holder', 'spool rack',
    'enclosure', 'tent',
    'bed', 'plate', 'sheet',
    'tool', 'scraper', 'spatula',
    'glue', 'adhesive',
    'cleaner', 'cleaning',
    'upgrade', 'kit',
    'cable', 'wire',
    'screen', 'display',
    'motor', 'stepper',
    'bearing', 'wheel',
    'belt', 'pulley',
    'power supply', 'psu',
    'sd card', 'usb',
    'thermistor', 'heater',
    'fan', 'blower',
    'sensor',
    'light', 'led',
    'camera',
    'empty spool',
  ];
  
  for (const exclusion of exclusions) {
    if (title.includes(exclusion)) {
      return false;
    }
  }
  
  // Check for filament indicators
  const filamentIndicators = [
    'pla', 'petg', 'abs', 'asa', 'tpu', 'pa', 'nylon',
    'pc', 'pp', 'pvb', 'peek', 'filament',
    '1.75mm', '2.85mm', '1kg', '2kg', '5kg',
  ];
  
  for (const indicator of filamentIndicators) {
    if (title.includes(indicator)) {
      return true;
    }
  }
  
  // Check product type
  if (productType.includes('filament')) {
    return true;
  }
  
  // Check tags
  for (const tag of tags) {
    if (tag.includes('filament')) {
      return true;
    }
  }
  
  return false;
}
