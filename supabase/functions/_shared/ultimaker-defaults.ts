/**
 * ULTIMAKER-SPECIFIC DEFAULTS
 * 
 * Configuration for Ultimaker S-Series filaments (2.85mm diameter)
 * Platform: Magento (store.ultimaker.com)
 * 
 * Product Lines: 15+ distinct professional-grade materials
 * All materials are 750g spools with NFC-enabled profiles
 */

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export const ULTIMAKER_MATERIAL_PATTERNS: Array<{ pattern: RegExp; material: string }> = [
  // High-performance composites
  { pattern: /pps[\s-]?cf|pps[\s-]?carbon/i, material: 'PPS-CF' },
  { pattern: /pet[\s-]?cf|pet[\s-]?carbon/i, material: 'PET-CF' },
  { pattern: /nylon[\s-]?cf[\s-]?slide/i, material: 'PA-CF' },
  
  // Enhanced variants
  { pattern: /tough[\s-]?pla/i, material: 'PLA+' },
  { pattern: /cpe\+|cpe[\s-]?plus/i, material: 'CPE+' },
  
  // Standard materials
  { pattern: /\bpla\b/i, material: 'PLA' },
  { pattern: /\bpetg\b/i, material: 'PETG' },
  { pattern: /\babs\b/i, material: 'ABS' },
  { pattern: /\bnylon\b|pa6|pa66|\bpa\b/i, material: 'PA' },
  { pattern: /\bcpe\b/i, material: 'CPE' },
  { pattern: /\bpc\b|polycarbonate/i, material: 'PC' },
  { pattern: /\bpp\b|polypropylene/i, material: 'PP' },
  { pattern: /tpu[\s-]?95a|tpu/i, material: 'TPU-95A' },
  
  // Support materials
  { pattern: /breakaway/i, material: 'Breakaway' },
  { pattern: /\bpva\b/i, material: 'PVA' },
];

export function normalizeUltimakerMaterial(title: string): string | null {
  if (!title) return null;
  
  for (const { pattern, material } of ULTIMAKER_MATERIAL_PATTERNS) {
    if (pattern.test(title)) {
      return material;
    }
  }
  
  return null;
}

// ============================================================================
// PRINT SETTINGS
// ============================================================================

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
}

export const ULTIMAKER_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzleTempMin: 195, nozzleTempMax: 210, bedTempMin: 60, bedTempMax: 60 },
  'PLA+': { nozzleTempMin: 215, nozzleTempMax: 225, bedTempMin: 60, bedTempMax: 60 },
  'PETG': { nozzleTempMin: 225, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 85 },
  'ABS': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 85, bedTempMax: 100, requiresEnclosure: true },
  'PET-CF': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 75, bedTempMax: 95, isAbrasive: true },
  'PA': { nozzleTempMin: 245, nozzleTempMax: 265, bedTempMin: 60, bedTempMax: 70, requiresEnclosure: true },
  'PA-CF': { nozzleTempMin: 255, nozzleTempMax: 275, bedTempMin: 60, bedTempMax: 70, isAbrasive: true, requiresEnclosure: true },
  'CPE': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 65, bedTempMax: 80 },
  'CPE+': { nozzleTempMin: 245, nozzleTempMax: 265, bedTempMin: 75, bedTempMax: 90 },
  'PC': { nozzleTempMin: 260, nozzleTempMax: 285, bedTempMin: 100, bedTempMax: 115, requiresEnclosure: true },
  'PP': { nozzleTempMin: 215, nozzleTempMax: 235, bedTempMin: 70, bedTempMax: 90 },
  'TPU-95A': { nozzleTempMin: 223, nozzleTempMax: 233, bedTempMin: 30, bedTempMax: 60, printSpeedMax: 40 },
  'PPS-CF': { nozzleTempMin: 300, nozzleTempMax: 350, bedTempMin: 120, bedTempMax: 150, isAbrasive: true, requiresEnclosure: true },
  'Breakaway': { nozzleTempMin: 205, nozzleTempMax: 225, bedTempMin: 85, bedTempMax: 100 },
  'PVA': { nozzleTempMin: 195, nozzleTempMax: 215, bedTempMin: 35, bedTempMax: 60 },
};

export function getUltimakerPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  return ULTIMAKER_PRINT_SETTINGS[material] || null;
}

// ============================================================================
// FINISH TYPE
// ============================================================================

export type FinishType = 'Standard' | 'Matte' | 'Metallic';

export function extractUltimakerFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  
  // Ultimaker materials are all professional-grade Standard finish
  // Only exception: Silver Metallic color
  if (/silver\s*metallic/i.test(title)) {
    return 'Metallic';
  }
  
  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID
// ============================================================================

export function generateUltimakerProductLineId(title: string, material?: string | null): string {
  const mat = material || normalizeUltimakerMaterial(title);
  
  if (!mat) {
    return 'ultimaker__s-series__unknown';
  }
  
  // Normalize material for URL-safe ID
  const materialSlug = mat.toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  return `ultimaker__s-series__${materialSlug}`;
}

// ============================================================================
// TDS URL PATTERNS
// ============================================================================

// Ultimaker hosts TDS at um-support-files.ultimaker.com
const ULTIMAKER_TDS_BASE = 'https://um-support-files.ultimaker.com/materials/2.85mm/tds';

export const ULTIMAKER_TDS_PATTERNS: Record<string, string> = {
  'PLA': `${ULTIMAKER_TDS_BASE}/PLA/Ultimaker-PLA-TDS.pdf`,
  'PLA+': `${ULTIMAKER_TDS_BASE}/Tough%20PLA/Ultimaker-Tough-PLA-TDS.pdf`,
  'PETG': `${ULTIMAKER_TDS_BASE}/PETG/Ultimaker-PETG-TDS.pdf`,
  'ABS': `${ULTIMAKER_TDS_BASE}/ABS/Ultimaker-ABS-TDS.pdf`,
  'PET-CF': `${ULTIMAKER_TDS_BASE}/PET%20CF/Ultimaker-PET-CF-TDS.pdf`,
  'PA': `${ULTIMAKER_TDS_BASE}/Nylon/Ultimaker-Nylon-TDS.pdf`,
  'PA-CF': `${ULTIMAKER_TDS_BASE}/Nylon%20CF%20Slide/Ultimaker-Nylon-CF-Slide-TDS.pdf`,
  'CPE': `${ULTIMAKER_TDS_BASE}/CPE/Ultimaker-CPE-TDS.pdf`,
  'CPE+': `${ULTIMAKER_TDS_BASE}/CPE%2B/Ultimaker-CPE-Plus-TDS.pdf`,
  'PC': `${ULTIMAKER_TDS_BASE}/PC/Ultimaker-PC-TDS.pdf`,
  'PP': `${ULTIMAKER_TDS_BASE}/PP/Ultimaker-PP-TDS.pdf`,
  'TPU-95A': `${ULTIMAKER_TDS_BASE}/TPU%2095A/Ultimaker-TPU-95A-TDS.pdf`,
  'PPS-CF': `${ULTIMAKER_TDS_BASE}/PPS%20CF/Ultimaker-PPS-CF-TDS.pdf`,
  'Breakaway': `${ULTIMAKER_TDS_BASE}/Breakaway/Ultimaker-Breakaway-TDS.pdf`,
  'PVA': `${ULTIMAKER_TDS_BASE}/PVA/Ultimaker-PVA-TDS.pdf`,
};

export function getUltimakerTdsUrl(material: string | null): string | null {
  if (!material) return null;
  return ULTIMAKER_TDS_PATTERNS[material] || null;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const ULTIMAKER_COLOR_MAPPING: Record<string, string> = {
  // Standard PLA colors (11 colors)
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'silver metallic': '#C0C0C0',
  'silver': '#C0C0C0',
  'red': '#DC2626',
  'blue': '#2563EB',
  'green': '#16A34A',
  'yellow': '#FACC15',
  'orange': '#EA580C',
  'magenta': '#FF00FF',
  'pearl white': '#F5F5F5',
  'transparent': '#E8E8E8',
  
  // Common engineering colors
  'natural': '#F5E6D3',
  'grey': '#808080',
  'gray': '#808080',
  
  // Material-specific defaults
  'breakaway': '#E8E8E8',
  'pva': '#F5E6D3',
};

export function getUltimakerColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (ULTIMAKER_COLOR_MAPPING[normalized]) {
    return ULTIMAKER_COLOR_MAPPING[normalized];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(ULTIMAKER_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

// Material-specific default colors (for single-color materials)
export const ULTIMAKER_MATERIAL_DEFAULT_COLORS: Record<string, string> = {
  'PPS-CF': '#2D2D2D',
  'PA-CF': '#2D2D2D',
  'PET-CF': '#2D2D2D',
  'Breakaway': '#E8E8E8',
  'PVA': '#F5E6D3',
  'PP': '#F5E6D3',
  'CPE': '#F5E6D3',
  'CPE+': '#F5E6D3',
};

export function getUltimakerMaterialDefaultColor(material: string | null): string | null {
  if (!material) return null;
  return ULTIMAKER_MATERIAL_DEFAULT_COLORS[material] || null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanUltimakerTitle(title: string): string {
  if (!title) return '';
  
  return title
    .replace(/ultimaker\s*/gi, '')
    .replace(/s[\s-]?series\s*/gi, '')
    .replace(/material\s*/gi, '')
    .replace(/filament\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface UltimakerEnrichmentResult {
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
  requiresEnclosure: boolean;
  diameterMm: number;
  netWeightG: number;
  cleanedTitle: string;
}

export function enrichUltimakerProduct(
  title: string,
  colorName?: string | null,
  existingMaterial?: string | null
): UltimakerEnrichmentResult {
  const material = existingMaterial || normalizeUltimakerMaterial(title);
  const settings = getUltimakerPrintSettings(material);
  
  // Get color hex: from color name, or material default
  let colorHex = colorName ? getUltimakerColorHex(colorName) : null;
  if (!colorHex && material) {
    colorHex = getUltimakerMaterialDefaultColor(material);
  }
  
  return {
    material,
    finishType: extractUltimakerFinishType(colorName || title),
    productLineId: generateUltimakerProductLineId(title, material),
    tdsUrl: getUltimakerTdsUrl(material),
    colorHex,
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    printSpeedMax: settings?.printSpeedMax || null,
    isAbrasive: settings?.isAbrasive || false,
    requiresEnclosure: settings?.requiresEnclosure || false,
    diameterMm: 2.85, // All Ultimaker S-Series is 2.85mm
    netWeightG: 750, // All Ultimaker spools are 750g
    cleanedTitle: cleanUltimakerTitle(title),
  };
}

// ============================================================================
// PRODUCT URL PATTERNS
// ============================================================================

export const ULTIMAKER_PRODUCT_URLS: Record<string, string> = {
  'PLA': 'https://store.ultimaker.com/ultimaker-s-series-pla-material',
  'PLA+': 'https://store.ultimaker.com/ultimaker-s-series-tough-pla-material',
  'PETG': 'https://store.ultimaker.com/ultimaker-s-series-petg-material',
  'ABS': 'https://store.ultimaker.com/ultimaker-s-series-abs-material',
  'PET-CF': 'https://store.ultimaker.com/ultimaker-s-series-pet-cf-material',
  'PA': 'https://store.ultimaker.com/ultimaker-s-series-nylon-material',
  'PA-CF': 'https://store.ultimaker.com/ultimaker-s-series-nylon-cf-slide-material',
  'CPE': 'https://store.ultimaker.com/ultimaker-s-series-cpe-material',
  'CPE+': 'https://store.ultimaker.com/ultimaker-s-series-cpe-plus-material',
  'PC': 'https://store.ultimaker.com/ultimaker-s-series-pc-material',
  'PP': 'https://store.ultimaker.com/ultimaker-s-series-pp-material',
  'TPU-95A': 'https://store.ultimaker.com/ultimaker-s-series-tpu-95a-material',
  'PPS-CF': 'https://store.ultimaker.com/ultimaker-s-series-pps-cf-material',
  'Breakaway': 'https://store.ultimaker.com/ultimaker-s-series-breakaway-material',
  'PVA': 'https://store.ultimaker.com/ultimaker-s-series-pva-material',
};

export function getUltimakerProductUrl(material: string | null): string | null {
  if (!material) return null;
  return ULTIMAKER_PRODUCT_URLS[material] || null;
}

// ============================================================================
// PLA COLOR VARIANTS (for variant explosion)
// ============================================================================

export const ULTIMAKER_PLA_COLORS = [
  { name: 'Black', hex: '#1A1A1A' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Silver Metallic', hex: '#C0C0C0' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Yellow', hex: '#FACC15' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Magenta', hex: '#FF00FF' },
  { name: 'Pearl White', hex: '#F5F5F5' },
  { name: 'Transparent', hex: '#E8E8E8' },
];

// Materials with multiple color options
export const ULTIMAKER_MULTI_COLOR_MATERIALS = ['PLA', 'ABS', 'PETG', 'CPE', 'TPU-95A'];

// Materials with single color (Black or Natural)
export const ULTIMAKER_SINGLE_COLOR_MATERIALS = [
  'PLA+', 'PET-CF', 'PA', 'PA-CF', 'CPE+', 'PC', 'PP', 'PPS-CF', 'Breakaway', 'PVA'
];
