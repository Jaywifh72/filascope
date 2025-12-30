/**
 * Fillamentum Brand Defaults
 * Premium Czech filament manufacturer known for exceptional color consistency,
 * unique color names, and engineering materials including CPE, Nylon, and Flexfill lines.
 */

// ============================================================================
// PRODUCT LINE DEFINITIONS
// ============================================================================

export const FILLAMENTUM_PRODUCT_LINES: Record<string, {
  material: string;
  productLine: string;
  isAbrasive: boolean;
  enclosureRequired: boolean;
  highSpeedCapable: boolean;
  tdsUrl: string | null;
}> = {
  // PLA Family
  'pla-extrafill': {
    material: 'PLA',
    productLine: 'Extrafill',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_PLA-Extrafill_26082019.pdf'
  },
  'pla-crystal-clear': {
    material: 'PLA',
    productLine: 'Crystal Clear',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_PLA-Crystal-Clear_26082019.pdf'
  },
  'pla-lightweight': {
    material: 'LW-PLA',
    productLine: 'Extrafill LW',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2021/06/TDS_PLA-Extrafill-LW.pdf'
  },
  
  // ABS/ASA Family
  'abs-extrafill': {
    material: 'ABS',
    productLine: 'Extrafill',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_ABS-Extrafill_26082019.pdf'
  },
  'asa-extrafill': {
    material: 'ASA',
    productLine: 'Extrafill',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_ASA-Extrafill_26082019.pdf'
  },
  'asa-cf10': {
    material: 'ASA-CF',
    productLine: 'CF10 Carbon',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2022/01/TDS_ASA-CF10-Carbon.pdf'
  },
  
  // PETG Family
  'petg': {
    material: 'PETG',
    productLine: 'PETG',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_PETG_26082019.pdf'
  },
  
  // CPE Family (Copolyester)
  'cpe-hg100': {
    material: 'CPE',
    productLine: 'HG100',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_CPE-HG100_26082019.pdf'
  },
  'cpe-cf112': {
    material: 'CPE-CF',
    productLine: 'CF112 Carbon',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/TDS_CPE-CF112-Carbon.pdf'
  },
  
  // Flexfill TPU/TPE/PEBA Family
  'flexfill-tpu-98a': {
    material: 'TPU-98A',
    productLine: 'Flexfill 98A',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Flexfill-TPU-98A_26082019.pdf'
  },
  'flexfill-tpu-92a': {
    material: 'TPU-92A',
    productLine: 'Flexfill 92A',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Flexfill-TPU-92A_26082019.pdf'
  },
  'flexfill-tpe-90a': {
    material: 'TPE-90A',
    productLine: 'Flexfill TPE',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Flexfill-TPE_26082019.pdf'
  },
  'flexfill-peba-90a': {
    material: 'PEBA-90A',
    productLine: 'Flexfill PEBA',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Flexfill-PEBA-90A_26082019.pdf'
  },
  
  // Nylon Family
  'nylon-fx256': {
    material: 'PA',
    productLine: 'FX256',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Nylon-FX256_26082019.pdf'
  },
  'nylon-cf15': {
    material: 'PA-CF',
    productLine: 'CF15 Carbon',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/TDS_Nylon-CF15-Carbon.pdf'
  },
  'nylon-af80': {
    material: 'PA-AF',
    productLine: 'AF80 Aramid',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/TDS_Nylon-AF80-Aramid.pdf'
  },
  
  // Specialty Materials
  'timberfill': {
    material: 'PLA-Wood',
    productLine: 'Timberfill',
    isAbrasive: true,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Timberfill_03012019.pdf'
  },
  'hips-extrafill': {
    material: 'HIPS',
    productLine: 'Extrafill',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_HIPS-Extrafill_26082019.pdf'
  },
  'vinyl-303': {
    material: 'PVC',
    productLine: 'Vinyl 303',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Vinyl-303_26082019.pdf'
  },
  'pp-2320': {
    material: 'PP',
    productLine: 'PP 2320',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2021/03/TDS_PP-2320.pdf'
  },
  'nonoilen': {
    material: 'Bio-PLA',
    productLine: 'NonOilen',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_NonOilen_26082019.pdf'
  },
  
  // Fishy Filaments Collaboration
  'orca': {
    material: 'PA-CF',
    productLine: '0rCA',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2023/07/TDS_Fishy-filament-OrCA_EN_20072023.pdf'
  },
  'porthcurno': {
    material: 'PA',
    productLine: 'Porthcurno',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2023/04/TDS_Fishy-filament-Porthcurno_EN_06042023.pdf'
  }
};

// ============================================================================
// PRINT SETTINGS
// ============================================================================

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
}

export const FILLAMENTUM_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 210, bedTempMin: 55, bedTempMax: 60 },
  'LW-PLA': { nozzleTempMin: 200, nozzleTempMax: 250, bedTempMin: 45, bedTempMax: 60 },
  'ABS': { nozzleTempMin: 240, nozzleTempMax: 255, bedTempMin: 100, bedTempMax: 105 },
  'ASA': { nozzleTempMin: 240, nozzleTempMax: 255, bedTempMin: 100, bedTempMax: 105 },
  'ASA-CF': { nozzleTempMin: 245, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 110 },
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 90 },
  'CPE': { nozzleTempMin: 255, nozzleTempMax: 275, bedTempMin: 80, bedTempMax: 100 },
  'CPE-CF': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 85, bedTempMax: 105 },
  'TPU-98A': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 50, bedTempMax: 60 },
  'TPU-92A': { nozzleTempMin: 215, nozzleTempMax: 235, bedTempMin: 50, bedTempMax: 60 },
  'TPE-90A': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 50, bedTempMax: 70 },
  'PEBA-90A': { nozzleTempMin: 245, nozzleTempMax: 265, bedTempMin: 80, bedTempMax: 100 },
  'PA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 80, bedTempMax: 95 },
  'PA-CF': { nozzleTempMin: 250, nozzleTempMax: 270, bedTempMin: 85, bedTempMax: 100 },
  'PA-AF': { nozzleTempMin: 250, nozzleTempMax: 270, bedTempMin: 85, bedTempMax: 100 },
  'PLA-Wood': { nozzleTempMin: 175, nozzleTempMax: 195, bedTempMin: 50, bedTempMax: 70 },
  'HIPS': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 100, bedTempMax: 110 },
  'PVC': { nozzleTempMin: 195, nozzleTempMax: 210, bedTempMin: 75, bedTempMax: 90 },
  'PP': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 85, bedTempMax: 100 },
  'Bio-PLA': { nozzleTempMin: 185, nozzleTempMax: 205, bedTempMin: 50, bedTempMax: 60 }
};

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const FILLAMENTUM_COLOR_MAPPING: Record<string, string> = {
  // Blacks & Grays
  'traffic black': '#1A1A1A',
  'traffic grey': '#6B6B6B',
  'metallic grey': '#A8A8A8',
  'vertigo grey': '#4A4A4A',
  'vertigo starlight': '#303030',
  'vertigo galaxy': '#1F1F3D',
  'concrete grey': '#808080',
  'anthracite grey': '#383838',
  'electric grey': '#5C5C5C',
  'signal black': '#0A0A0A',
  
  // Whites & Naturals
  'traffic white': '#F5F5F5',
  'signal white': '#FFFFFF',
  'natural': '#F0E6D3',
  'ivory white': '#FFFFF0',
  'pearl white': '#F8F6F0',
  
  // Blues
  'cobalt blue': '#0047AB',
  'sky blue': '#87CEEB',
  'iceland blue': '#5BC0EB',
  'gentlemen blue': '#1E3A5F',
  'prussian blue': '#003153',
  'steel blue': '#4682B4',
  'vertigo blue': '#1E3A8A',
  'signal blue': '#0033A0',
  'pearl blue': '#4A90D9',
  'noble blue': '#1A237E',
  'ultramarine blue': '#4169E1',
  'azure blue': '#007FFF',
  
  // Reds & Pinks
  'traffic red': '#CC0000',
  'signal red': '#FF0000',
  'carmine red': '#960018',
  'ruby red': '#9B111E',
  'purple red': '#800020',
  'extrafill red': '#E31E24',
  'terracotta red': '#CB4335',
  'vertigo red': '#8B0000',
  'luminous red': '#FF2400',
  'pink': '#FFC0CB',
  'traffic magenta': '#CC0066',
  
  // Oranges & Yellows
  'traffic yellow': '#FFD700',
  'signal yellow': '#FFE135',
  'melon yellow': '#FEDF00',
  'luminous orange': '#FF6600',
  'traffic orange': '#FF5500',
  'signal orange': '#FF8C00',
  'tangerine orange': '#FF9966',
  
  // Greens
  'luminous green': '#50FF50',
  'pistachio green': '#93C572',
  'signal green': '#00FF00',
  'crystal clear green': '#98FB98',
  'vertigo jade': '#00A86B',
  'jungle green': '#29AB87',
  'leaf green': '#4CBB17',
  'turquoise green': '#00CED1',
  'mint': '#98FF98',
  'concrete green': '#708238',
  
  // Purples & Violets
  'vertigo mystique': '#663399',
  'traffic violet': '#8B008B',
  'signal violet': '#8B00FF',
  'purple rain': '#483D8B',
  'purple': '#800080',
  
  // Browns & Beiges
  'signal brown': '#8B4513',
  'chocolate brown': '#3D2B1F',
  'cinnamon': '#D2691E',
  'leather brown': '#9A7B4F',
  'beige': '#F5DEB3',
  
  // Metallics
  'gold happens': '#FFD700',
  'vertigo gold': '#D4AF37',
  'aluminium': '#A9A9A9',
  'bronze': '#CD7F32',
  'copper': '#B87333',
  
  // Transparents
  'crystal clear': '#FFFFFF00',
  'crystal clear iceland blue': '#87CEEB80',
  'crystal clear aquamarine': '#7FFFD480',
  'crystal clear smaragd green': '#50C87880',
  
  // Timberfill (Wood)
  'light wood tone': '#DEB887',
  'rosewood': '#65000B',
  
  // Special Effects
  'luminous': '#7FFF00'
};

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

interface MaterialPattern {
  patterns: RegExp[];
  material: string;
  isAbrasive: boolean;
  enclosureRequired: boolean;
}

const MATERIAL_PATTERNS: MaterialPattern[] = [
  // Carbon Fiber variants (must check before base materials)
  { patterns: [/asa[- ]?cf/i, /cf10/i], material: 'ASA-CF', isAbrasive: true, enclosureRequired: true },
  { patterns: [/cpe[- ]?cf/i, /cf112/i], material: 'CPE-CF', isAbrasive: true, enclosureRequired: true },
  { patterns: [/nylon[- ]?cf/i, /cf15/i, /pa[- ]?cf/i], material: 'PA-CF', isAbrasive: true, enclosureRequired: true },
  
  // Aramid Fiber
  { patterns: [/af80/i, /aramid/i, /pa[- ]?af/i], material: 'PA-AF', isAbrasive: true, enclosureRequired: true },
  
  // TPU/TPE/PEBA with Shore grades
  { patterns: [/tpu[- ]?98a/i, /flexfill[- ]?98/i], material: 'TPU-98A', isAbrasive: false, enclosureRequired: false },
  { patterns: [/tpu[- ]?92a/i, /flexfill[- ]?92/i], material: 'TPU-92A', isAbrasive: false, enclosureRequired: false },
  { patterns: [/tpe[- ]?90a/i, /flexfill[- ]?tpe/i], material: 'TPE-90A', isAbrasive: false, enclosureRequired: false },
  { patterns: [/peba[- ]?90a/i, /flexfill[- ]?peba/i], material: 'PEBA-90A', isAbrasive: false, enclosureRequired: true },
  
  // Specialty materials
  { patterns: [/vinyl[- ]?303/i, /pvc/i], material: 'PVC', isAbrasive: false, enclosureRequired: true },
  { patterns: [/nonoilen/i, /bio[- ]?pla/i], material: 'Bio-PLA', isAbrasive: false, enclosureRequired: false },
  { patterns: [/timberfill/i, /wood/i], material: 'PLA-Wood', isAbrasive: true, enclosureRequired: false },
  { patterns: [/pp[- ]?2320/i, /polypropylene/i], material: 'PP', isAbrasive: false, enclosureRequired: false },
  { patterns: [/lw[- ]?pla/i, /lightweight/i], material: 'LW-PLA', isAbrasive: false, enclosureRequired: false },
  
  // Engineering plastics
  { patterns: [/cpe[- ]?hg100/i, /cpe(?![- ]?cf)/i], material: 'CPE', isAbrasive: false, enclosureRequired: true },
  { patterns: [/hips/i], material: 'HIPS', isAbrasive: false, enclosureRequired: true },
  { patterns: [/nylon[- ]?fx256/i, /(?<!cf|af)nylon(?![- ]?cf|[- ]?af)/i, /pa(?![- ]?cf|[- ]?af)/i], material: 'PA', isAbrasive: false, enclosureRequired: true },
  
  // Standard materials
  { patterns: [/\basa(?![- ]?cf)/i], material: 'ASA', isAbrasive: false, enclosureRequired: true },
  { patterns: [/\babs(?![- ]?cf)/i], material: 'ABS', isAbrasive: false, enclosureRequired: true },
  { patterns: [/petg/i], material: 'PETG', isAbrasive: false, enclosureRequired: false },
  { patterns: [/pla(?![- ]?wood|[- ]?cf)/i, /extrafill/i], material: 'PLA', isAbrasive: false, enclosureRequired: false }
];

export function normalizeFillamentumMaterial(title: string): {
  material: string;
  isAbrasive: boolean;
  enclosureRequired: boolean;
} {
  const normalizedTitle = title.toLowerCase();
  
  for (const pattern of MATERIAL_PATTERNS) {
    if (pattern.patterns.some(p => p.test(normalizedTitle))) {
      return {
        material: pattern.material,
        isAbrasive: pattern.isAbrasive,
        enclosureRequired: pattern.enclosureRequired
      };
    }
  }
  
  // Default to PLA for unmatched Extrafill products
  if (normalizedTitle.includes('extrafill')) {
    return { material: 'PLA', isAbrasive: false, enclosureRequired: false };
  }
  
  return { material: 'Other', isAbrasive: false, enclosureRequired: false };
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 'metallic' | 'transparent' | 'translucent' | 'glow' | 'pearl' | 'matte' | 'standard';

export function extractFillamentumFinishType(title: string, colorName: string): FinishType {
  const combined = `${title} ${colorName}`.toLowerCase();
  
  if (/metallic|aluminium|gold happens|bronze|copper/i.test(combined)) return 'metallic';
  if (/crystal[- ]?clear|transparent/i.test(combined)) return 'transparent';
  if (/translucent/i.test(combined)) return 'translucent';
  if (/luminous|glow/i.test(combined)) return 'glow';
  if (/vertigo.*starlight|pearl|galaxy/i.test(combined)) return 'pearl';
  
  // Extrafill standard finish is matte
  if (/extrafill/i.test(title)) return 'matte';
  
  return 'standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateFillamentumProductLineId(title: string, material: string): string {
  const normalizedTitle = title.toLowerCase();
  
  // Match against known product lines
  for (const [slug, config] of Object.entries(FILLAMENTUM_PRODUCT_LINES)) {
    const linePattern = new RegExp(slug.replace(/-/g, '[- ]?'), 'i');
    if (linePattern.test(normalizedTitle) || 
        (normalizedTitle.includes(config.productLine.toLowerCase()) && material === config.material)) {
      return `fillamentum__${material.toLowerCase().replace(/-/g, '-')}__${slug}`;
    }
  }
  
  // Fallback: generate from material
  const cleanTitle = normalizedTitle
    .replace(/fillamentum/gi, '')
    .replace(/made in usa/gi, '')
    .replace(/[""]/g, '')
    .trim();
  
  const productLine = cleanTitle.split(/\s+/).slice(0, 2).join('-').replace(/[^a-z0-9-]/g, '');
  return `fillamentum__${material.toLowerCase()}__${productLine || 'standard'}`;
}

// ============================================================================
// COLOR EXTRACTION
// ============================================================================

export function extractFillamentumColor(title: string): string | null {
  // Fillamentum uses quoted color names: PLA Extrafill "Traffic Black"
  const quotedMatch = title.match(/["""]([^"""]+)["""]/);
  if (quotedMatch) {
    return quotedMatch[1].trim();
  }
  
  // Fallback: extract after material name
  const afterMaterial = title.replace(/^.*?(pla|abs|asa|petg|cpe|nylon|flexfill|tpu|tpe|peba|timberfill|hips|vinyl|nonoilen|pp)/i, '').trim();
  if (afterMaterial && afterMaterial.length > 0) {
    // Remove common suffixes
    return afterMaterial
      .replace(/\|.*$/g, '')
      .replace(/made in usa/gi, '')
      .replace(/\d+\.?\d*\s*mm/gi, '')
      .replace(/\d+\s*(g|kg)/gi, '')
      .trim() || null;
  }
  
  return null;
}

export function getFillamentumColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (FILLAMENTUM_COLOR_MAPPING[normalized]) {
    return FILLAMENTUM_COLOR_MAPPING[normalized];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(FILLAMENTUM_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanFillamentumTitle(title: string): string {
  return title
    .replace(/\s*\|\s*Made in USA/gi, '')
    .replace(/\s*\|\s*\d+\.?\d*\s*mm/gi, '')
    .replace(/\s*\|\s*\d+\s*(g|kg)/gi, '')
    .replace(/fillamentum\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface FillamentumEnrichmentResult {
  material: string;
  finishType: FinishType;
  productLineId: string;
  tdsUrl: string | null;
  printSettings: PrintSettings | null;
  colorHex: string | null;
  isAbrasive: boolean;
  enclosureRequired: boolean;
  cleanedTitle: string;
}

export function enrichFillamentumProduct(
  title: string,
  colorName?: string | null,
  existingMaterial?: string | null
): FillamentumEnrichmentResult {
  // Normalize material
  const materialInfo = normalizeFillamentumMaterial(title);
  const material = existingMaterial && existingMaterial !== 'Other' 
    ? existingMaterial 
    : materialInfo.material;
  
  // Extract color if not provided
  const extractedColor = colorName || extractFillamentumColor(title);
  
  // Detect finish type
  const finishType = extractFillamentumFinishType(title, extractedColor || '');
  
  // Generate product line ID
  const productLineId = generateFillamentumProductLineId(title, material);
  
  // Find TDS URL from product line config
  let tdsUrl: string | null = null;
  for (const [slug, config] of Object.entries(FILLAMENTUM_PRODUCT_LINES)) {
    if (productLineId.includes(slug) || config.material === material) {
      tdsUrl = config.tdsUrl;
      break;
    }
  }
  
  // Get print settings
  const printSettings = FILLAMENTUM_PRINT_SETTINGS[material] || null;
  
  // Get color hex
  const colorHex = extractedColor ? getFillamentumColorHex(extractedColor) : null;
  
  // Clean title
  const cleanedTitle = cleanFillamentumTitle(title);
  
  return {
    material,
    finishType,
    productLineId,
    tdsUrl,
    printSettings,
    colorHex,
    isAbrasive: materialInfo.isAbrasive,
    enclosureRequired: materialInfo.enclosureRequired,
    cleanedTitle
  };
}

// ============================================================================
// STORE CONFIGURATION
// ============================================================================

export const FILLAMENTUM_STORE_INFO = {
  vendor: 'Fillamentum',
  baseUrlEU: 'https://shop.fillamentum.com',
  baseUrlUSA: 'https://fillamentumusa.com',
  defaultDiameter: 1.75,
  defaultWeight: 750, // Fillamentum uses 750g as standard
  spoolMaterial: 'Plastic',
  currency: 'USD'
};

// ============================================================================
// COLLECTION SLUGS FOR DISCOVERY
// ============================================================================

export const FILLAMENTUM_COLLECTION_SLUGS = [
  'pla-extrafill-filament',
  'pla-crystal-clear-filament',
  'abs-extrafill-filament',
  'asa-extrafill',
  'petg',
  'cpe-filament',
  'flexfill',
  'nylon-fx256',
  'nylon-cf15-carbon',
  'nylon-af80-aramid',
  'timberfill',
  'hips-extrafill-filament',
  'vinyl-303',
  'nonoilen',
  'fishy-filaments-by-fillamentum',
  'pla-extrafill-lw'
];
