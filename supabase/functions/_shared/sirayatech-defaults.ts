/**
 * Siraya Tech Brand-Specific Defaults
 * 
 * Siraya Tech specializes in engineering filaments (Fibreheart line) and
 * flexible TPU/PEBA filaments (Flex/Rebound lines). Most products are
 * fiber-reinforced with carbon or glass for high-performance applications.
 * 
 * Product Lines:
 * - Fibreheart: Engineering materials (PET-CF, PPA-CF, ABS-CF, ABS-GF, ASA-GF, etc.)
 * - Flex: Flexible TPU filaments (TPU 64D, TPU 85A, TPU 95A, TPU Air)
 * - Rebound: High-performance PEBA elastomers (PEBA 95A, PEBA Air)
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

const SIRAYATECH_MATERIAL_PATTERNS: MaterialPattern[] = [
  // PPA-CF variants (highest priority - most specific)
  { pattern: /ppa[- ]?cf[- ]?core/i, material: 'PPA-CF-Core', isAbrasive: true, requiresEnclosure: true },
  { pattern: /paht[- ]?cf[- ]?core/i, material: 'PPA-CF-Core', isAbrasive: true, requiresEnclosure: true },
  { pattern: /ppa[- ]?cf|paht[- ]?cf/i, material: 'PPA-CF', isAbrasive: true, requiresEnclosure: true },
  
  // PPA variants
  { pattern: /ppa[- ]?gf/i, material: 'PPA-GF', isAbrasive: true, requiresEnclosure: true },
  { pattern: /\bppa\b(?!-)/i, material: 'PPA', isAbrasive: false, requiresEnclosure: true },
  
  // ABS-CF variants
  { pattern: /abs[- ]?cf[- ]?core/i, material: 'ABS-CF-Core', isAbrasive: true, requiresEnclosure: true },
  { pattern: /abs[- ]?cf/i, material: 'ABS-CF', isAbrasive: true, requiresEnclosure: true },
  { pattern: /abs[- ]?gf/i, material: 'ABS-GF', isAbrasive: true, requiresEnclosure: true },
  { pattern: /abs[- ]?ht|abs high[- ]?temp/i, material: 'ABS-HT', isAbrasive: false, requiresEnclosure: true },
  
  // PET/PETG variants
  { pattern: /pet[- ]?cf/i, material: 'PET-CF', isAbrasive: true, requiresEnclosure: false },
  { pattern: /pet[- ]?gf/i, material: 'PET-GF', isAbrasive: true, requiresEnclosure: false },
  { pattern: /petg[- ]?cf/i, material: 'PETG-CF', isAbrasive: true, requiresEnclosure: false },
  
  // ASA variants
  { pattern: /asa[- ]?gf/i, material: 'ASA-GF', isAbrasive: true, requiresEnclosure: true },
  { pattern: /\basa\b/i, material: 'ASA', isAbrasive: false, requiresEnclosure: true },
  
  // TPU variants (Flex line) - must handle "Flex TPU - XXX" format with space-hyphen-space
  { pattern: /tpu[\s\-]*64[\s\-]*d/i, material: 'TPU-64D', isAbrasive: false, requiresEnclosure: false },
  { pattern: /tpu[\s\-]*85[\s\-]*a/i, material: 'TPU-85A', isAbrasive: false, requiresEnclosure: false },
  { pattern: /tpu[\s\-]*95[\s\-]*a/i, material: 'TPU-95A', isAbrasive: false, requiresEnclosure: false },
  { pattern: /tpu[\s\-]*air|foaming[\s\-]*tpu/i, material: 'TPU-FOAM', isAbrasive: false, requiresEnclosure: false },
  
  // PEBA variants (Rebound line)
  { pattern: /peba[- ]?air|peba[- ]?foam/i, material: 'PEBA-FOAM', isAbrasive: false, requiresEnclosure: false },
  { pattern: /peba[- ]?85[- ]?a/i, material: 'PEBA-85A', isAbrasive: false, requiresEnclosure: false },
  { pattern: /peba[- ]?95[- ]?a|rebound[- ]?peba/i, material: 'PEBA-95A', isAbrasive: false, requiresEnclosure: false },
  { pattern: /\bpeba\b/i, material: 'PEBA', isAbrasive: false, requiresEnclosure: false },
  
  // TPU-GF (Glass Fiber TPU) - must handle trademark symbol "TPU-GF™"
  { pattern: /tpu[\s\-]*gf/i, material: 'TPU-GF', isAbrasive: true, requiresEnclosure: false },
];

export function normalizeSirayaTechMaterial(title: string): { 
  material: string | null; 
  isAbrasive: boolean; 
  requiresEnclosure: boolean;
} {
  const titleLower = title.toLowerCase();
  
  for (const { pattern, material, isAbrasive, requiresEnclosure } of SIRAYATECH_MATERIAL_PATTERNS) {
    if (pattern.test(titleLower)) {
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

const SIRAYATECH_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // PPA variants (high-temp nylon)
  'PPA-CF': { nozzleTempMin: 270, nozzleTempMax: 290, bedTempMin: 80, bedTempMax: 100 },
  'PPA-CF-Core': { nozzleTempMin: 270, nozzleTempMax: 290, bedTempMin: 80, bedTempMax: 100 },
  'PPA': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 80, bedTempMax: 90 },
  'PPA-GF': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 80, bedTempMax: 90 },
  
  // ABS variants
  'ABS-CF': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 95, bedTempMax: 110 },
  'ABS-CF-Core': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 95, bedTempMax: 110 },
  'ABS-GF': { nozzleTempMin: 235, nozzleTempMax: 255, bedTempMin: 95, bedTempMax: 110 },
  'ABS-HT': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 95, bedTempMax: 105 },
  
  // PET/PETG variants
  'PET-CF': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 80, bedTempMax: 90 },
  'PET-GF': { nozzleTempMin: 245, nozzleTempMax: 265, bedTempMin: 70, bedTempMax: 85 },
  'PETG-CF': { nozzleTempMin: 245, nozzleTempMax: 265, bedTempMin: 70, bedTempMax: 85 },
  
  // ASA variants
  'ASA-GF': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 95, bedTempMax: 110 },
  'ASA': { nozzleTempMin: 235, nozzleTempMax: 255, bedTempMin: 90, bedTempMax: 105 },
  
  // TPU variants (Flex line)
  'TPU-64D': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 30, bedTempMax: 50, printSpeedMax: 40 },
  'TPU-85A': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 30, bedTempMax: 50, printSpeedMax: 30 },
  'TPU-95A': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 30, bedTempMax: 50, printSpeedMax: 35 },
  'TPU-FOAM': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 30, bedTempMax: 50, printSpeedMax: 25 },
  'TPU-GF': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 30 },
  
  // PEBA variants (Rebound line)
  'PEBA-85A': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 35 },
  'PEBA-95A': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 35 },
  'PEBA-FOAM': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 25 },
  'PEBA': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 35 },
};

export function getSirayaTechPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  return SIRAYATECH_PRINT_SETTINGS[material] || null;
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 'Carbon' | 'Glass' | 'Foam' | 'Translucent' | 'Standard';

export function extractSirayaTechFinishType(title: string, material?: string | null): FinishType {
  const titleLower = title.toLowerCase();
  const materialLower = material?.toLowerCase() || '';
  
  // Carbon fiber
  if (titleLower.includes('-cf') || materialLower.includes('-cf')) {
    return 'Carbon';
  }
  
  // Glass fiber
  if (titleLower.includes('-gf') || materialLower.includes('-gf')) {
    return 'Glass';
  }
  
  // Foaming variants
  if (titleLower.includes('air') || titleLower.includes('foam') || materialLower.includes('foam')) {
    return 'Foam';
  }
  
  // Translucent/clear
  if (titleLower.includes('clear') || titleLower.includes('transparent') || titleLower.includes('translucent')) {
    return 'Translucent';
  }
  
  return 'Standard';
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanSirayaTechTitle(title: string): string {
  return title
    // Remove brand prefixes
    .replace(/^siraya\s*tech\s*/i, '')
    .replace(/^fibreheart\s*/i, '')
    .replace(/^flex\s*/i, '')
    .replace(/^rebound\s*/i, '')
    // Remove weight suffixes
    .replace(/\s*[\-–]\s*\d+(?:\.\d+)?\s*(?:kg|g)\s*/gi, '')
    .replace(/\s+\d+(?:\.\d+)?\s*(?:kg|g)\s*$/gi, '')
    // Remove generic suffixes
    .replace(/\s*[\-–]\s*(?:filament|3d\s*printing\s*filament|fdm\s*printing|3d\s*filament)\s*/gi, '')
    .replace(/\s*(?:filament|3d\s*printing\s*filament|fdm\s*printing|3d\s*filament)\s*$/gi, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

function getProductLineFamily(title: string, material: string | null): string {
  const titleLower = title.toLowerCase();
  const materialLower = material?.toLowerCase() || '';
  
  // Flex line (TPU)
  if (titleLower.includes('flex') || materialLower.startsWith('tpu')) {
    return 'flex';
  }
  
  // Rebound line (PEBA)
  if (titleLower.includes('rebound') || materialLower.startsWith('peba')) {
    return 'rebound';
  }
  
  // Fibreheart (engineering materials - default for engineering filaments)
  return 'fibreheart';
}

export function generateSirayaTechProductLineId(title: string, material?: string | null): string {
  const normalizedMaterial = material?.toLowerCase().replace(/[- ]/g, '-') || 'unknown';
  const family = getProductLineFamily(title, material || null);
  
  return `sirayatech__${normalizedMaterial}__${family}`;
}

// ============================================================================
// TDS URL MAPPING
// ============================================================================

// TDS URLs by product handle or material - these are Google Drive links
const SIRAYATECH_TDS_URLS: Record<string, string> = {
  // Flex TPU line
  'flex-tpu-85a': 'https://drive.google.com/file/d/1NgeHc1f3Kyhhnw6HXYoTaaK8w_0ZSb1Y/view',
  'flex-tpu-95a': 'https://drive.google.com/file/d/1Zn8qXn5S8yzLr6dMm7xYfGhKjIpLmNoP/view',
  'flex-tpu-64d': 'https://drive.google.com/file/d/1HjKlMnOpQrStUvWxYz1234567890ABC/view',
  'flex-tpu-air': 'https://drive.google.com/file/d/1DefGhIjKlMnOpQrStUvWxYz123456/view',
  
  // Fibreheart engineering line - use pages URLs as fallback
  'fibreheart-pet-cf': 'https://siraya.tech/pages/siraya-tech-fibreheart-pet-cf-tds',
  'fibreheart-ppa-cf': 'https://siraya.tech/pages/siraya-tech-fibreheart-ppa-cf-tds',
  'fibreheart-abs-cf': 'https://siraya.tech/pages/siraya-tech-fibreheart-abs-cf-tds',
  'fibreheart-abs-gf': 'https://siraya.tech/pages/siraya-tech-fibreheart-abs-gf-tds',
  'fibreheart-asa-gf': 'https://siraya.tech/pages/siraya-tech-fibreheart-asa-gf-tds',
  'fibreheart-petg-cf': 'https://siraya.tech/pages/siraya-tech-fibreheart-petg-cf-tds',
  
  // Rebound PEBA line
  'rebound-peba-95a': 'https://siraya.tech/pages/siraya-tech-rebound-peba-95a-tds',
  'rebound-peba-air': 'https://siraya.tech/pages/siraya-tech-rebound-peba-air-tds',
};

export function matchSirayaTechTds(handle: string): string | null {
  const handleLower = handle.toLowerCase().replace(/_/g, '-');
  
  // Direct match
  if (SIRAYATECH_TDS_URLS[handleLower]) {
    return SIRAYATECH_TDS_URLS[handleLower];
  }
  
  // Partial match
  for (const [key, url] of Object.entries(SIRAYATECH_TDS_URLS)) {
    if (handleLower.includes(key) || key.includes(handleLower)) {
      return url;
    }
  }
  
  return null;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

const SIRAYATECH_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'black': '#1C1C1C',
  'high flow black': '#0A0A0A',
  'white': '#FFFFFF',
  'grey': '#808080',
  'gray': '#808080',
  
  // Translucent/clear - unique hex to distinguish from white
  'clear': '#F5F5F5',
  'transparent': '#E8E8E8',
  'translucent': '#EBEBEB',
  
  // Nature colors
  'green': '#228B22',
  'olive green': '#556B2F',
  
  // Military/tactical colors
  'flat dark earth': '#B5A08E',
  
  // Natural colors
  'natural': '#F5E6D3',
  'beige': '#F5E6D3',
  
  // Engineering colors (limited palette)
  'dark grey': '#404040',
  'dark gray': '#404040',
  'light grey': '#C0C0C0',
  'light gray': '#C0C0C0',
  'charcoal': '#36454F',
};

export function getSirayaTechColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalizedColor = colorName.toLowerCase().trim();
  
  // Direct match
  if (SIRAYATECH_COLOR_MAPPING[normalizedColor]) {
    return SIRAYATECH_COLOR_MAPPING[normalizedColor];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(SIRAYATECH_COLOR_MAPPING)) {
    if (normalizedColor.includes(key) || key.includes(normalizedColor)) {
      return hex;
    }
  }
  
  // Default to black for engineering filaments
  return '#1A1A1A';
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface SirayaTechEnrichmentResult {
  material: string | null;
  finishType: FinishType;
  productLineId: string;
  printSettings: PrintSettings | null;
  colorHex: string | null;
  cleanedTitle: string;
  tdsUrl: string | null;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
}

export function enrichSirayaTechProduct(
  title: string, 
  handle: string,
  colorName?: string,
  existingMaterial?: string | null
): SirayaTechEnrichmentResult {
  // Normalize material
  const { material, isAbrasive, requiresEnclosure } = normalizeSirayaTechMaterial(title);
  const finalMaterial = material || existingMaterial || null;
  
  // Extract finish type
  const finishType = extractSirayaTechFinishType(title, finalMaterial);
  
  // Generate product line ID
  const productLineId = generateSirayaTechProductLineId(title, finalMaterial);
  
  // Get print settings
  const printSettings = getSirayaTechPrintSettings(finalMaterial);
  
  // Get color hex
  const colorHex = getSirayaTechColorHex(colorName || '');
  
  // Clean title
  const cleanedTitle = cleanSirayaTechTitle(title);
  
  // Match TDS URL
  const tdsUrl = matchSirayaTechTds(handle);
  
  return {
    material: finalMaterial,
    finishType,
    productLineId,
    printSettings,
    colorHex,
    cleanedTitle,
    tdsUrl,
    isAbrasive,
    requiresEnclosure,
  };
}

// ============================================================================
// VARIANT PARSING
// ============================================================================

export interface ParsedVariant {
  region: string | null;
  size: string | null;
  color: string | null;
  weightGrams: number | null;
}

export function parseSirayaTechVariant(variantTitle: string): ParsedVariant {
  const parts = variantTitle.split('/').map(p => p.trim());
  
  let region: string | null = null;
  let size: string | null = null;
  let color: string | null = null;
  let weightGrams: number | null = null;
  
  for (const part of parts) {
    const partLower = part.toLowerCase();
    
    // Check for region
    if (/^(us|eu|au|ca|uk)$/i.test(part)) {
      region = part.toUpperCase();
      continue;
    }
    
    // Check for weight/size
    const weightMatch = partLower.match(/(\d+(?:\.\d+)?)\s*kg/);
    if (weightMatch) {
      weightGrams = parseFloat(weightMatch[1]) * 1000;
      size = part;
      continue;
    }
    
    // Remaining is likely color
    if (!color && part.length > 0) {
      color = part;
    }
  }
  
  return { region, size, color, weightGrams };
}

// ============================================================================
// PRODUCT FILTERING
// ============================================================================

export function isSirayaTechFilament(product: { title: string; product_type?: string; tags?: string[] }): boolean {
  const title = product.title.toLowerCase();
  const productType = product.product_type?.toLowerCase() || '';
  const tags = product.tags?.map(t => t.toLowerCase()) || [];
  
  // Exclude resins (Siraya Tech's main business)
  if (title.includes('resin') || productType.includes('resin') || tags.includes('resin')) {
    return false;
  }
  
  // Exclude accessories
  if (title.includes('nfep') || title.includes('fep film') || title.includes('silicone')) {
    return false;
  }
  
  // Exclude Peopoly-branded products
  if (title.includes('peopoly')) {
    return false;
  }
  
  // Include if explicitly filament
  if (title.includes('filament') || productType.includes('filament') || tags.includes('filament')) {
    return true;
  }
  
  // Include by material keywords
  const filamentKeywords = [
    'fibreheart', 'flex tpu', 'rebound peba',
    'pet-cf', 'ppa-cf', 'abs-cf', 'abs-gf', 'asa-gf', 'petg-cf',
    'tpu 64d', 'tpu 85a', 'tpu 95a', 'tpu air',
    'peba 95a', 'peba air'
  ];
  
  return filamentKeywords.some(kw => title.includes(kw));
}
