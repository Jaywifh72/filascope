/**
 * BRAND-SPECIFIC DEFAULTS TEMPLATE
 * 
 * Copy this file and rename all BRAND_ prefixes to your brand (e.g., SUNLU_).
 * See anycubic-defaults.ts and amolen-defaults.ts for reference implementations.
 */

// TDS URL PATTERNS - Map materials to TDS PDF URLs
export const BRAND_TDS_PATTERNS: Record<string, string> = {
  // 'PLA+': 'https://example.com/tds/pla-plus.pdf',
};

export function matchBrandTds(title: string): { url: string; pattern: string } | null {
  if (!title) return null;
  const normalizedTitle = title.toUpperCase();
  const sorted = Object.entries(BRAND_TDS_PATTERNS).sort((a, b) => b[0].length - a[0].length);
  for (const [pattern, url] of sorted) {
    if (normalizedTitle.includes(pattern.toUpperCase())) return { url, pattern };
  }
  return null;
}

// PRINT SETTINGS
export interface PrintSettings {
  nozzleTempMin: number; nozzleTempMax: number;
  bedTempMin: number; bedTempMax: number;
  printSpeedMax?: number; requiresEnclosure?: boolean; isAbrasive?: boolean;
}

export const BRAND_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 25, bedTempMax: 60 },
  'PETG': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 60, bedTempMax: 80 },
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'TPU': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 30, bedTempMax: 60, printSpeedMax: 50 },
};

export function getBrandPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  return BRAND_PRINT_SETTINGS[material.toUpperCase()] || null;
}

// FINISH TYPE EXTRACTION
export type FinishType = 'Silk' | 'Matte' | 'Glow' | 'Sparkle' | 'Standard';

export function extractFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  if (/\bsilk\b/i.test(title)) return 'Silk';
  if (/\bmatte\b/i.test(title)) return 'Matte';
  if (/glow|luminous/i.test(title)) return 'Glow';
  if (/sparkle|glitter/i.test(title)) return 'Sparkle';
  return 'Standard';
}

// MATERIAL NORMALIZATION
export function normalizeBrandMaterial(title: string): string | null {
  if (!title) return null;
  const t = title.toLowerCase();
  if (/petg/i.test(t)) return 'PETG';
  if (/pla/i.test(t)) return 'PLA';
  if (/abs/i.test(t)) return 'ABS';
  if (/tpu/i.test(t)) return 'TPU';
  return null;
}

// TITLE CLEANING
export function cleanBrandTitle(title: string): string {
  if (!title) return '';
  return title.replace(/christmas\s*sale/gi, '').replace(/\s+/g, ' ').trim();
}

// PRODUCT LINE ID
export function generateBrandProductLineId(title: string, material?: string | null): string {
  const mat = material || normalizeBrandMaterial(title) || 'unknown';
  const finish = extractFinishType(title);
  return `brand-${mat.toLowerCase()}${finish !== 'Standard' ? `-${finish.toLowerCase()}` : ''}`;
}

// COLOR MAPPING
export const BRAND_COLOR_MAPPING: Record<string, string> = {
  'white': 'FFFFFF', 'black': '000000', 'red': 'FF0000', 'blue': '0000FF',
};

export function getBrandColorHex(colorName: string): string | null {
  return BRAND_COLOR_MAPPING[colorName.toLowerCase()] || null;
}

// MAIN ENRICHMENT
export interface BrandEnrichmentResult {
  tdsUrl: string | null; finishType: FinishType; material: string | null;
  nozzleTempMin: number | null; nozzleTempMax: number | null;
  bedTempMin: number | null; bedTempMax: number | null;
  productLineId: string;
}

export function enrichBrandProduct(title: string, existingMaterial?: string | null): BrandEnrichmentResult {
  const material = existingMaterial || normalizeBrandMaterial(title);
  const settings = getBrandPrintSettings(material);
  const tds = matchBrandTds(title);
  return {
    tdsUrl: tds?.url || null,
    finishType: extractFinishType(title),
    material,
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    productLineId: generateBrandProductLineId(title, material),
  };
}
