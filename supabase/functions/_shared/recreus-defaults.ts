/**
 * RECREUS BRAND-SPECIFIC DEFAULTS
 * 
 * Recreus is a Spanish TPU specialist known for flexible filaments
 * with various Shore hardness ratings (60A-95A).
 */

// ============================================================================
// MATERIAL NORMALIZATION (Shore Hardness-Based)
// ============================================================================

const RECREUS_MATERIAL_PATTERNS: Array<{ pattern: RegExp; material: string }> = [
  // TPU variants by Shore hardness
  { pattern: /filaflex\s*60\s*a/i, material: 'TPU-60A' },
  { pattern: /filaflex\s*70\s*a/i, material: 'TPU-70A' },
  { pattern: /filaflex\s*82\s*a/i, material: 'TPU-82A' },
  { pattern: /filaflex\s*95\s*a/i, material: 'TPU-95A' },
  { pattern: /foamy|foam/i, material: 'TPU-FOAM' },
  { pattern: /sebs/i, material: 'TPU-SEBS' },
  { pattern: /conductive\s*filaflex/i, material: 'TPU-Conductive' },
  { pattern: /purifier/i, material: 'TPU-Purifier' },
  { pattern: /balena/i, material: 'TPU-Bio' },
  { pattern: /reciflex/i, material: 'rTPU' },
  // Generic TPU fallback
  { pattern: /filaflex/i, material: 'TPU' },
  // Other materials
  { pattern: /pet-?g\s*cf|petg\s*cf/i, material: 'PETG-CF' },
  { pattern: /pet-?g|petg/i, material: 'PETG' },
  { pattern: /pp-?3d|pp3d/i, material: 'PP' },
  { pattern: /\bpla\b/i, material: 'PLA' },
];

export function normalizeRecreousMaterial(title: string): string | null {
  if (!title) return null;
  for (const { pattern, material } of RECREUS_MATERIAL_PATTERNS) {
    if (pattern.test(title)) return material;
  }
  return null;
}

// ============================================================================
// PRINT SETTINGS BY MATERIAL
// ============================================================================

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
  isConductive?: boolean;
}

export const RECREUS_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'TPU-60A': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 50, bedTempMax: 60, printSpeedMax: 30 },
  'TPU-70A': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 50, bedTempMax: 60, printSpeedMax: 30 },
  'TPU-82A': { nozzleTempMin: 240, nozzleTempMax: 250, bedTempMin: 50, bedTempMax: 60, printSpeedMax: 35 },
  'TPU-95A': { nozzleTempMin: 240, nozzleTempMax: 250, bedTempMin: 50, bedTempMax: 55, printSpeedMax: 40 },
  'TPU-FOAM': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 50, bedTempMax: 55, printSpeedMax: 30 },
  'TPU-SEBS': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 50, bedTempMax: 60, printSpeedMax: 30 },
  'TPU-Conductive': { nozzleTempMin: 240, nozzleTempMax: 250, bedTempMin: 50, bedTempMax: 60, printSpeedMax: 30, isConductive: true },
  'TPU-Purifier': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 50, bedTempMax: 60, printSpeedMax: 30 },
  'TPU-Bio': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 50, printSpeedMax: 30 },
  'rTPU': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 50, bedTempMax: 60, printSpeedMax: 35 },
  'TPU': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 50, bedTempMax: 60, printSpeedMax: 35 },
  'PETG': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 70, bedTempMax: 80 },
  'PETG-CF': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 80, bedTempMax: 90, isAbrasive: true },
  'PLA': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PP': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 80, bedTempMax: 90 },
};

export function getRecreousPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  return RECREUS_PRINT_SETTINGS[material] || null;
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 'Translucent' | 'Fluorescent' | 'Metallic' | 'Standard';

export function extractRecreousFinishType(title: string, color?: string): FinishType {
  const text = `${title} ${color || ''}`.toLowerCase();
  
  if (/transparent|trans\b|clear/i.test(text)) return 'Translucent';
  if (/fluor|fluorescent|fluoride|neon/i.test(text)) return 'Fluorescent';
  if (/metallic|metal\b/i.test(text)) return 'Metallic';
  
  return 'Standard';
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanRecreousTitle(title: string): string {
  if (!title) return '';
  
  return title
    // Remove weight suffixes
    .replace(/\s*-?\s*\d+\s*(gr?|kg|gram|grams?)\b/gi, '')
    // Remove diameter suffixes
    .replace(/\s*-?\s*(1\.75|2\.85|2\.20|1,75|2,85|2,20)\s*mm?\b/gi, '')
    // Remove "- Recreus" suffix
    .replace(/\s*-\s*recreus$/i, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateRecreousProductLineId(title: string, material?: string | null): string {
  const mat = material || normalizeRecreousMaterial(title) || 'unknown';
  const finish = extractRecreousFinishType(title);
  const finishSuffix = finish !== 'Standard' ? `-${finish.toLowerCase()}` : '';
  
  return `recreus__${mat.toLowerCase().replace(/[^a-z0-9]/g, '-')}__standard${finishSuffix}`;
}

// ============================================================================
// TDS URL PATTERNS (Google Drive folders by product line)
// ============================================================================

export const RECREUS_TDS_PATTERNS: Record<string, string> = {
  'filaflex-60a': 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS',
  'filaflex-70a': 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS',
  'filaflex-82a': 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS',
  'filaflex-95a': 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS',
  'filaflex-foamy': 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS',
  'filaflex-sebs': 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS',
  'conductive-filaflex': 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS',
  'filaflex-purifier': 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS',
  'balena': 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS',
  'reciflex': 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS',
  'pet-g': 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS',
  'pet-g-cf': 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS',
  'pp3d': 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS',
  'pla': 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS',
};

export function matchRecreousTds(title: string): string | null {
  if (!title) return null;
  const normalized = title.toLowerCase().replace(/\s+/g, '-');
  
  for (const [pattern, url] of Object.entries(RECREUS_TDS_PATTERNS)) {
    if (normalized.includes(pattern)) return url;
  }
  
  // Default TDS folder for Recreus products
  return 'https://drive.google.com/drive/folders/1EcYYacEG9MW2q39X5NDMCyhccFPYJcFS';
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const RECREUS_COLOR_MAPPING: Record<string, string> = {
  // Basic colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'natural': '#F5F5DC',
  'transparent': '#FFFFFF',
  'clear': '#FFFFFF',
  
  // Primary colors
  'red': '#DC2626',
  'blue': '#2563EB',
  'green': '#16A34A',
  'yellow': '#EAB308',
  'orange': '#EA580C',
  
  // Blues
  'navy': '#000080',
  'navy blue': '#000080',
  'azure': '#007FFF',
  'aqua': '#00CED1',
  'denim': '#1560BD',
  'blue food grade': '#2563EB',
  
  // Purples
  'lavender': '#E6E6FA',
  'purple': '#9333EA',
  
  // Greens
  'mint': '#98FF98',
  'olive': '#808000',
  
  // Skin tones
  'nude': '#FFCBA4',
  'skin': '#FFCBA4',
  
  // Grays/Browns
  'grey': '#6B7280',
  'gray': '#6B7280',
  'mineral': '#8B8680',
  'dusk': '#6E5E5E',
  'copper gum': '#B87333',
  
  // Metallics
  'metallic green': '#3CB371',
  'metallic gold': '#D4AF37',
  'metallic silver': '#C0C0C0',
  
  // Fluorescent/Neon
  'fluor': '#39FF14',
  'fluor green': '#39FF14',
  'fluor yellow': '#FFFF00',
  'fluor orange': '#FF6600',
  'fluor pink': '#FF1493',
  'fluorescent': '#39FF14',
  'neon': '#39FF14',
  
  // Special
  'pink': '#EC4899',
  'magenta': '#D946EF',
  'coral': '#FF7F50',
  'beige': '#F5F5DC',
  'brown': '#8B4513',
  'gold': '#D4AF37',
  'silver': '#C0C0C0',
};

export function getRecreousColorHex(colorName: string): string | null {
  if (!colorName) return null;
  const normalized = colorName.toLowerCase().trim();
  return RECREUS_COLOR_MAPPING[normalized] || null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface RecreousEnrichmentResult {
  material: string | null;
  finishType: FinishType;
  productLineId: string;
  tdsUrl: string | null;
  colorHex: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  printSpeedMax: number | null;
  isAbrasive: boolean;
  isConductive: boolean;
}

export function enrichRecreousProduct(
  title: string,
  colorName?: string,
  existingMaterial?: string | null
): RecreousEnrichmentResult {
  const material = existingMaterial || normalizeRecreousMaterial(title);
  const settings = getRecreousPrintSettings(material);
  const finishType = extractRecreousFinishType(title, colorName);
  
  return {
    material,
    finishType,
    productLineId: generateRecreousProductLineId(title, material),
    tdsUrl: matchRecreousTds(title),
    colorHex: colorName ? getRecreousColorHex(colorName) : null,
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    printSpeedMax: settings?.printSpeedMax || null,
    isAbrasive: settings?.isAbrasive || false,
    isConductive: settings?.isConductive || false,
  };
}

// ============================================================================
// VARIANT PARSING
// ============================================================================

export interface ParsedVariant {
  color: string | null;
  diameter: number;
  weight: number;
}

export function parseRecreousVariant(variantTitle: string): ParsedVariant {
  // Recreus variants are typically: "Color / Diameter / Weight" or "Color / Weight"
  const parts = variantTitle.split('/').map(p => p.trim());
  
  let color: string | null = null;
  let diameter = 1.75;
  let weight = 500;
  
  for (const part of parts) {
    // Check for diameter
    const diameterMatch = part.match(/(1\.75|2\.85|2\.20|1,75|2,85|2,20)/);
    if (diameterMatch) {
      diameter = parseFloat(diameterMatch[1].replace(',', '.'));
      continue;
    }
    
    // Check for weight
    const weightMatch = part.match(/(\d+)\s*(gr?|kg|gram)/i);
    if (weightMatch) {
      const value = parseInt(weightMatch[1], 10);
      const unit = weightMatch[2].toLowerCase();
      weight = unit.startsWith('k') ? value * 1000 : value;
      continue;
    }
    
    // Assume remaining part is color
    if (!color && part.length > 0 && !/default/i.test(part)) {
      color = part;
    }
  }
  
  return { color, diameter, weight };
}
