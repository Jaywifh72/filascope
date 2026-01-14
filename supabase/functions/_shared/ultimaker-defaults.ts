/**
 * ULTIMAKER-SPECIFIC DEFAULTS
 * 
 * Configuration for Ultimaker filaments (2.85mm diameter)
 * Supports three printer series: S-Series, Method Series, Factor Series
 * Platform: Magento (store.ultimaker.com) / Custom CMS (ultimaker.com)
 * 
 * Product Lines: 30 distinct professional-grade materials across 3 series
 * All materials are 750g spools (except some support materials at 350g)
 * All products are 2.85mm diameter (Ultimaker ecosystem)
 */

// ============================================================================
// SERIES DETECTION
// ============================================================================

export type UltimakerSeries = 'S-Series' | 'Method' | 'Factor';

export function detectUltimakerSeries(title: string): UltimakerSeries {
  if (!title) return 'S-Series';
  const normalized = title.toLowerCase();
  
  if (/factor/i.test(normalized)) return 'Factor';
  if (/method/i.test(normalized)) return 'Method';
  return 'S-Series';
}

// ============================================================================
// MATERIAL NORMALIZATION (expanded for all series)
// ============================================================================

export const ULTIMAKER_MATERIAL_PATTERNS: Array<{ pattern: RegExp; material: string }> = [
  // High-performance composites
  { pattern: /pps[\s-]?cf|pps[\s-]?carbon/i, material: 'PPS-CF' },
  { pattern: /pet[\s-]?cf|pet[\s-]?carbon/i, material: 'PET-CF' },
  { pattern: /nylon[\s-]?cf[\s-]?slide/i, material: 'PA-CF' },
  { pattern: /nylon[\s-]?12[\s-]?cf/i, material: 'PA12-CF' },
  { pattern: /nylon[\s-]?cf/i, material: 'PA-CF' },
  { pattern: /abs[\s-]?cf/i, material: 'ABS-CF' },
  
  // Method Series specific materials
  { pattern: /abs[\s-]?r\b/i, material: 'ABS-R' },
  { pattern: /pc[\s-]?abs[\s-]?fr/i, material: 'PC-ABS-FR' },
  { pattern: /pc[\s-]?abs/i, material: 'PC-ABS' },
  { pattern: /rapidrinse/i, material: 'RapidRinse' },
  { pattern: /sr[\s-]?30/i, material: 'SR-30' },
  { pattern: /\basa\b/i, material: 'ASA' },
  
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
// PRINT SETTINGS (expanded for all materials)
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
  // S-Series materials
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
  
  // Method Series materials
  'ABS-R': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 85, bedTempMax: 100, requiresEnclosure: true },
  'ASA': { nozzleTempMin: 235, nozzleTempMax: 255, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'PC-ABS': { nozzleTempMin: 250, nozzleTempMax: 270, bedTempMin: 95, bedTempMax: 110, requiresEnclosure: true },
  'PC-ABS-FR': { nozzleTempMin: 250, nozzleTempMax: 275, bedTempMin: 95, bedTempMax: 115, requiresEnclosure: true },
  'PA12-CF': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 60, bedTempMax: 80, isAbrasive: true, requiresEnclosure: true },
  'ABS-CF': { nozzleTempMin: 245, nozzleTempMax: 265, bedTempMin: 90, bedTempMax: 105, isAbrasive: true, requiresEnclosure: true },
  'RapidRinse': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 60, bedTempMax: 80 },
  'SR-30': { nozzleTempMin: 200, nozzleTempMax: 215, bedTempMin: 60, bedTempMax: 80 },
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
  // Only exception: Silver Metallic color, Pearl colors
  if (/silver\s*metallic/i.test(title)) return 'Metallic';
  if (/pearl/i.test(title)) return 'Metallic';
  
  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID (series-aware)
// ============================================================================

export function generateUltimakerProductLineId(title: string, material?: string | null): string {
  const series = detectUltimakerSeries(title);
  const mat = material || normalizeUltimakerMaterial(title);
  
  if (!mat) {
    return 'ultimaker__s-series__unknown';
  }
  
  // Normalize series and material for URL-safe ID
  const seriesSlug = series.toLowerCase().replace('-', '');
  const materialSlug = mat.toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  return `ultimaker__${seriesSlug}__${materialSlug}`;
}

// ============================================================================
// TDS URL PATTERNS (expanded for all series)
// ============================================================================

// Ultimaker hosts TDS at um-support-files.ultimaker.com
const ULTIMAKER_TDS_BASE = 'https://um-support-files.ultimaker.com/materials/2.85mm/tds';

export const ULTIMAKER_TDS_PATTERNS: Record<string, string> = {
  // S-Series TDS URLs
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
  
  // Method Series TDS URLs (may differ)
  'ABS-R': `${ULTIMAKER_TDS_BASE}/ABS-R/Ultimaker-ABS-R-TDS.pdf`,
  'ASA': `${ULTIMAKER_TDS_BASE}/ASA/Ultimaker-ASA-TDS.pdf`,
  'PC-ABS': `${ULTIMAKER_TDS_BASE}/PC-ABS/Ultimaker-PC-ABS-TDS.pdf`,
  'PC-ABS-FR': `${ULTIMAKER_TDS_BASE}/PC-ABS-FR/Ultimaker-PC-ABS-FR-TDS.pdf`,
  'PA12-CF': `${ULTIMAKER_TDS_BASE}/Nylon%2012%20CF/Ultimaker-Nylon-12-CF-TDS.pdf`,
  'ABS-CF': `${ULTIMAKER_TDS_BASE}/ABS%20CF/Ultimaker-ABS-CF-TDS.pdf`,
  'RapidRinse': `${ULTIMAKER_TDS_BASE}/RapidRinse/Ultimaker-RapidRinse-TDS.pdf`,
  'SR-30': `${ULTIMAKER_TDS_BASE}/SR-30/Ultimaker-SR-30-TDS.pdf`,
};

export function getUltimakerTdsUrl(material: string | null): string | null {
  if (!material) return null;
  return ULTIMAKER_TDS_PATTERNS[material] || null;
}

// ============================================================================
// COLOR MAPPING (expanded for all colors in seed)
// ============================================================================

export const ULTIMAKER_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'gray': '#808080',
  'grey': '#808080',
  'dark gray': '#404040',
  'dark grey': '#404040',
  'slate gray': '#708090',
  'silver': '#C0C0C0',
  
  // Vibrant "True" colors (S-Series PLA)
  'true green': '#16A34A',
  'true orange': '#EA580C',
  'true red': '#DC2626',
  'true yellow': '#FACC15',
  
  // Standard colors
  'red': '#DC2626',
  'blue': '#2563EB',
  'green': '#16A34A',
  'yellow': '#FACC15',
  'orange': '#EA580C',
  
  // Special colors
  'pearl white': '#F5F5F5',
  'pearl gold': '#D4AF37',
  'stone white': '#E8E8E0',
  'natural': '#F5E6D3',
  'transparent': '#E8E8E8',
  'translucent natural': '#E8E8D0',
  
  // Legacy support
  'silver metallic': '#C0C0C0',
  'magenta': '#FF00FF',
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
  // Carbon fiber materials (black)
  'PPS-CF': '#2D2D2D',
  'PA-CF': '#2D2D2D',
  'PA12-CF': '#2D2D2D',
  'PET-CF': '#2D2D2D',
  'ABS-CF': '#2D2D2D',
  
  // Support/specialty materials
  'Breakaway': '#E8E8E8',
  'PVA': '#F5E6D3',
  'RapidRinse': '#F5E6D3',
  'SR-30': '#F5E6D3',
  
  // Engineering materials (natural/translucent)
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
    .replace(/method[\s-]?series\s*/gi, '')
    .replace(/factor[\s-]?series\s*/gi, '')
    .replace(/material\s*/gi, '')
    .replace(/filament\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION (series-aware)
// ============================================================================

export interface UltimakerEnrichmentResult {
  series: UltimakerSeries;
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
  const series = detectUltimakerSeries(title);
  const material = existingMaterial || normalizeUltimakerMaterial(title);
  const settings = getUltimakerPrintSettings(material);
  
  // Get color hex: from color name, or material default
  let colorHex = colorName ? getUltimakerColorHex(colorName) : null;
  if (!colorHex && material) {
    colorHex = getUltimakerMaterialDefaultColor(material);
  }
  
  return {
    series,
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
    diameterMm: 2.85, // All Ultimaker is 2.85mm
    netWeightG: 750, // Standard spool weight
    cleanedTitle: cleanUltimakerTitle(title),
  };
}

// ============================================================================
// PRODUCT URL PATTERNS (expanded for all series)
// ============================================================================

export const ULTIMAKER_PRODUCT_URLS: Record<string, string> = {
  // S-Series
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
// COLOR VARIANTS BY MATERIAL (from CSV seed analysis)
// ============================================================================

export const ULTIMAKER_PLA_COLORS = [
  { name: 'Black', hex: '#1A1A1A' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'True Red', hex: '#DC2626' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'True Green', hex: '#16A34A' },
  { name: 'True Yellow', hex: '#FACC15' },
  { name: 'True Orange', hex: '#EA580C' },
  { name: 'Pearl White', hex: '#F5F5F5' },
  { name: 'Transparent', hex: '#E8E8E8' },
];

// Materials with multiple color options
export const ULTIMAKER_MULTI_COLOR_MATERIALS = ['PLA', 'ABS', 'CPE', 'TPU-95A', 'PLA+', 'ASA', 'ABS-R'];

// Materials with single/limited colors (for Post Sync Check whitelist)
export const ULTIMAKER_SINGLE_COLOR_MATERIALS = [
  'PET-CF', 'PA-CF', 'PA12-CF', 'ABS-CF', 'PP', 'PPS-CF', 
  'Breakaway', 'PVA', 'RapidRinse', 'SR-30', 'PC-ABS-FR'
];
