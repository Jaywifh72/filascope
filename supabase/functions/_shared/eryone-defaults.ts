/**
 * ERYONE-SPECIFIC DEFAULTS
 * 
 * Brand-specific configuration for Eryone 3D filament products.
 * Handles material normalization, finish detection, print settings, and color mapping.
 */

// ============================================================================
// TDS URL PATTERNS
// ============================================================================

export const ERYONE_TDS_PATTERNS: Record<string, string> = {
  // Standard materials
  'PLA+': 'https://eryone3d.com/pages/pla-plus-tds',
  'PLA': 'https://eryone3d.com/pages/pla-tds',
  'PETG+': 'https://eryone3d.com/pages/petg-plus-tds',
  'PETG': 'https://eryone3d.com/pages/petg-tds',
  'ABS+': 'https://eryone3d.com/pages/abs-plus-tds',
  'ABS': 'https://eryone3d.com/pages/abs-tds',
  'ASA': 'https://eryone3d.com/pages/asa-tds',
  'TPU': 'https://eryone3d.com/pages/tpu-tds',
  // Carbon Fiber variants
  'PLA-CF': 'https://eryone3d.com/pages/pla-cf-tds',
  'PETG-CF': 'https://eryone3d.com/pages/petg-cf-tds',
  'ASA-CF': 'https://eryone3d.com/pages/asa-cf-tds',
  'PA-CF': 'https://eryone3d.com/pages/pa-cf-tds',
  'PP-CF': 'https://eryone3d.com/pages/pp-cf-tds',
  // Engineering
  'PP': 'https://eryone3d.com/pages/pp-tds',
  'PPS': 'https://eryone3d.com/pages/pps-tds',
};

export function matchEryoneTds(title: string): { url: string; pattern: string } | null {
  if (!title) return null;
  const normalizedTitle = title.toUpperCase();
  
  // Sort by pattern length (longest first) for most specific match
  const sorted = Object.entries(ERYONE_TDS_PATTERNS).sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, url] of sorted) {
    if (normalizedTitle.includes(pattern.toUpperCase())) {
      return { url, pattern };
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

export const ERYONE_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Standard PLA variants
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 55, bedTempMax: 70 },
  'PLA+': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 55, bedTempMax: 70, printSpeedMax: 100 },
  'PLA+ HIGH-SPEED': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 55, bedTempMax: 70, printSpeedMax: 300 },
  
  // PETG variants
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 85 },
  'PETG+': { nozzleTempMin: 235, nozzleTempMax: 255, bedTempMin: 70, bedTempMax: 85 },
  'PETG+ HIGH-SPEED': { nozzleTempMin: 235, nozzleTempMax: 265, bedTempMin: 70, bedTempMax: 90, printSpeedMax: 300 },
  'PETG-CF': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 85, isAbrasive: true },
  
  // ABS variants
  'ABS': { nozzleTempMin: 220, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true },
  'ABS+': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true },
  
  // ASA variants
  'ASA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'ASA HIGH-SPEED': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, printSpeedMax: 300 },
  'ASA-CF': { nozzleTempMin: 250, nozzleTempMax: 270, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  
  // TPU variants
  'TPU': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60 },
  'TPU HIGH-SPEED': { nozzleTempMin: 210, nozzleTempMax: 250, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 150 },
  'TPU-85A': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60 },
  'TPU-90A': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60 },
  
  // Carbon Fiber variants
  'PLA-CF': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 55, bedTempMax: 70, isAbrasive: true },
  'PA-CF': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true, isAbrasive: true },
  
  // Engineering materials
  'PP': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 80, bedTempMax: 100 },
  'PP-CF': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 80, bedTempMax: 100, isAbrasive: true },
  'PPS': { nozzleTempMin: 290, nozzleTempMax: 320, bedTempMin: 100, bedTempMax: 130, requiresEnclosure: true },
  
  // Specialty
  'PLA-WOOD': { nozzleTempMin: 180, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 70 },
  'PLA-METAL': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 70, isAbrasive: true },
};

export function getEryonePrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  const upperMaterial = material.toUpperCase();
  
  // Direct match first
  if (ERYONE_PRINT_SETTINGS[upperMaterial]) {
    return ERYONE_PRINT_SETTINGS[upperMaterial];
  }
  
  // Partial match for variants
  for (const [key, settings] of Object.entries(ERYONE_PRINT_SETTINGS)) {
    if (upperMaterial.includes(key) || key.includes(upperMaterial)) {
      return settings;
    }
  }
  
  return null;
}

// ============================================================================
// FINISH TYPE EXTRACTION
// ============================================================================

export type FinishType = 'Silk' | 'Matte' | 'Sparkle' | 'Glow' | 'Rainbow' | 'MultiColor' | 'Translucent' | 'Metallic' | 'Marble' | 'Wood' | 'Metal' | 'Standard';

const FINISH_PATTERNS: Array<{ pattern: RegExp; finish: FinishType }> = [
  { pattern: /\bsilk\b/i, finish: 'Silk' },
  { pattern: /\bmatte\b/i, finish: 'Matte' },
  { pattern: /\bgalaxy\b|\bsparkl[ey]\b|\bglitter\b/i, finish: 'Sparkle' },
  { pattern: /\bglow(?:\s*in\s*the\s*dark)?\b|\bluminous\b/i, finish: 'Glow' },
  { pattern: /\brainbow\b|\bsteampunk\b/i, finish: 'Rainbow' },
  { pattern: /\bdual[\s-]*colou?r\b|\bquadruple[\s-]*colou?r\b|\bquad[\s-]*colou?r\b|\bmulti[\s-]*colou?r\b/i, finish: 'MultiColor' },
  { pattern: /\btranslucent\b|\bclear\b|\btransparent\b/i, finish: 'Translucent' },
  { pattern: /\bmetallic\b/i, finish: 'Metallic' },
  { pattern: /\bmarble\b|\bstone\b/i, finish: 'Marble' },
  { pattern: /\bwood\b/i, finish: 'Wood' },
  { pattern: /\bmetal\b(?!lic)/i, finish: 'Metal' },
];

export function extractFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  
  for (const { pattern, finish } of FINISH_PATTERNS) {
    if (pattern.test(title)) {
      return finish;
    }
  }
  
  return 'Standard';
}

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export const ERYONE_MATERIAL_MAPPING: Record<string, string> = {
  // Standard PLA
  'pla': 'PLA',
  'pla+': 'PLA+',
  'pla plus': 'PLA+',
  'pla pro': 'PLA+',
  
  // PETG
  'petg': 'PETG',
  'petg+': 'PETG+',
  'petg plus': 'PETG+',
  'petg pro': 'PETG+',
  
  // ABS
  'abs': 'ABS',
  'abs+': 'ABS+',
  'abs plus': 'ABS+',
  'abs-pc': 'ABS+',
  
  // ASA
  'asa': 'ASA',
  
  // TPU
  'tpu': 'TPU',
  'tpu 85a': 'TPU-85A',
  'tpu 90a': 'TPU-90A',
  'tpu 95a': 'TPU',
  'flexible': 'TPU',
  
  // Carbon Fiber - fix "Other" issues
  'carbon fiber pla': 'PLA-CF',
  'pla carbon fiber': 'PLA-CF',
  'cf pla': 'PLA-CF',
  'pla cf': 'PLA-CF',
  'pla-cf': 'PLA-CF',
  'carbon fiber petg': 'PETG-CF',
  'petg carbon fiber': 'PETG-CF',
  'cf petg': 'PETG-CF',
  'petg cf': 'PETG-CF',
  'petg-cf': 'PETG-CF',
  'asa carbon fiber': 'ASA-CF',
  'asa cf': 'ASA-CF',
  'asa-cf': 'ASA-CF',
  'pa carbon fiber': 'PA-CF',
  'pa cf': 'PA-CF',
  'pa-cf': 'PA-CF',
  'nylon cf': 'PA-CF',
  
  // Engineering
  'pp': 'PP',
  'polypropylene': 'PP',
  'pp cf': 'PP-CF',
  'pp-cf': 'PP-CF',
  'pps': 'PPS',
  
  // Specialty (finish is separate, material is base)
  'pla wood': 'PLA-Wood',
  'wood pla': 'PLA-Wood',
  'wood': 'PLA-Wood',
  'pla metal': 'PLA-Metal',
  'metal pla': 'PLA-Metal',
  'silk pla': 'PLA',
  'matte pla': 'PLA',
  'galaxy pla': 'PLA',
  'glow pla': 'PLA',
};

export function normalizeEryoneMaterial(title: string): string | null {
  if (!title) return null;
  
  const cleaned = title.toLowerCase()
    .replace(/eryone\s*/gi, '')
    .replace(/filament/gi, '')
    .replace(/high[\s-]*speed/gi, '')
    .replace(/\d+\.?\d*\s*mm/gi, '')
    .replace(/\d+\s*kg/gi, '')
    .trim();
  
  // Check direct mappings first (longest match wins)
  const sortedMappings = Object.entries(ERYONE_MATERIAL_MAPPING)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, material] of sortedMappings) {
    if (cleaned.includes(pattern)) {
      return material;
    }
  }
  
  // Fallback pattern matching
  if (/carbon\s*fiber|cf\b/i.test(title)) {
    if (/petg/i.test(title)) return 'PETG-CF';
    if (/asa/i.test(title)) return 'ASA-CF';
    if (/pa\b|nylon/i.test(title)) return 'PA-CF';
    if (/pp\b/i.test(title)) return 'PP-CF';
    return 'PLA-CF';
  }
  
  if (/petg\+|petg\s*plus/i.test(title)) return 'PETG+';
  if (/petg/i.test(title)) return 'PETG';
  if (/pla\+|pla\s*plus/i.test(title)) return 'PLA+';
  if (/pla/i.test(title)) return 'PLA';
  if (/abs\+|abs\s*plus/i.test(title)) return 'ABS+';
  if (/abs/i.test(title)) return 'ABS';
  if (/asa/i.test(title)) return 'ASA';
  if (/tpu\s*85/i.test(title)) return 'TPU-85A';
  if (/tpu\s*90/i.test(title)) return 'TPU-90A';
  if (/tpu|flexible/i.test(title)) return 'TPU';
  if (/pp\b/i.test(title)) return 'PP';
  if (/pps/i.test(title)) return 'PPS';
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

const ERYONE_TITLE_NOISE = [
  /eryone\s*/gi,
  /\b3d\s*print(?:er|ing)?\s*filament\b/gi,
  /\bfilament\b/gi,
  /\b1\.75\s*mm\s*[±+\-]\s*0\.0[35]\s*mm\b/gi,
  /\b1\.75\s*mm\b/gi,
  /\b1\s*kg\b/gi,
  /\b2\.2\s*lbs?\b/gi,
  /\bdimensional\s*accuracy[^,]*/gi,
  /\bfit\s*most\s*fdm\b/gi,
  /\bfor\s*3d\s*printer\b/gi,
  // Bundle/promo patterns
  /\(MOQ:\d+\s*Rolls?,?\s*(?:Can\s*)?Mix(?:able)?\s*(?:Colou?r)?\s*\)/gi,
  /bundle\s*sale[\s-]*/gi,
  /pre-?sale[\s-]*/gi,
  /\+\s*free\s*shipping/gi,
  /\bmoq\s*\d+\b/gi,
  // Regional prefixes
  /\b(?:us|eu|uk|ca)[\s-]*only\b/gi,
  /\(to\s*(?:us|eu|uk|ca)\s*only\)/gi,
  /\(ship\s*to[^)]*\)/gi,
];

const PROMOTIONAL_PATTERNS = [
  /christmas\s*sale/gi,
  /bundle\s*sale/gi,
  /pre-?sale/gi,
  /free\s*shipping/gi,
  /moq:\s*\d+/gi,
  /flash\s*sale/gi,
  /clearance/gi,
];

export function cleanEryoneTitle(title: string): string {
  if (!title) return '';
  
  let cleaned = title;
  
  for (const pattern of ERYONE_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove leading/trailing punctuation
  cleaned = cleaned.replace(/^[\s,\-–]+|[\s,\-–]+$/g, '');
  
  return cleaned;
}

export function isPromotionalProduct(title: string): boolean {
  if (!title) return false;
  return PROMOTIONAL_PATTERNS.some(pattern => pattern.test(title));
}

export function isMultiPack(title: string): boolean {
  if (!title) return false;
  return /\b(\d+)\s*(?:pack|rolls?|pcs|pieces|kg)\b/i.test(title) && 
         !/\b1\s*(?:kg|roll)\b/i.test(title);
}

export function getPackQuantity(title: string): number {
  if (!title) return 1;
  
  // Check for weight-based packs (3kg, 5kg)
  const weightMatch = title.match(/\b(\d+)\s*kg\b/i);
  if (weightMatch && parseInt(weightMatch[1]) > 1) {
    return parseInt(weightMatch[1]);
  }
  
  // Check for roll count
  const rollMatch = title.match(/\b(\d+)\s*(?:pack|rolls?|pcs)\b/i);
  if (rollMatch) {
    return parseInt(rollMatch[1]);
  }
  
  // Check MOQ bundles
  const moqMatch = title.match(/moq[:\s]*(\d+)/i);
  if (moqMatch) {
    return parseInt(moqMatch[1]);
  }
  
  return 1;
}

export function isHighSpeed(title: string): boolean {
  if (!title) return false;
  return /high[\s-]*speed/i.test(title);
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateEryoneProductLineId(title: string, material?: string | null): string {
  const mat = material || normalizeEryoneMaterial(title) || 'unknown';
  const finish = extractFinishType(title);
  const packQty = getPackQuantity(title);
  const highSpeed = isHighSpeed(title);
  const isPromo = isPromotionalProduct(title);
  
  let lineId = `eryone__${mat.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Add finish type if not standard
  if (finish !== 'Standard') {
    lineId += `__${finish.toLowerCase()}`;
  } else {
    lineId += '__standard';
  }
  
  // Add high-speed suffix
  if (highSpeed) {
    lineId = lineId.replace('__standard', '__high-speed');
    if (!lineId.includes('high-speed')) {
      lineId += '-hs';
    }
  }
  
  // Add pack quantity for bundles
  if (packQty > 1) {
    lineId += `-${packQty}pack`;
  }
  
  // Isolate promotional products
  if (isPromo && !lineId.includes('bundle')) {
    lineId += '__promo';
  }
  
  return lineId;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const ERYONE_COLOR_MAPPING: Record<string, string> = {
  // Basic colors
  'white': 'FFFFFF',
  'black': '000000',
  'red': 'FF0000',
  'blue': '0000FF',
  'green': '00FF00',
  'yellow': 'FFFF00',
  'orange': 'FFA500',
  'purple': '800080',
  'pink': 'FFC0CB',
  'gray': '808080',
  'grey': '808080',
  'brown': '8B4513',
  
  // Eryone-specific colors
  'army green': '4B5320',
  'olive green': '808000',
  'cool white': 'F5F5F5',
  'ivory white': 'FFFFF0',
  'ivory': 'FFFFF0',
  'skin': 'E8BEAC',
  'flesh': 'E8BEAC',
  'burnt titanium': 'CD7F32',
  'galaxy sparkly': '2F1B41',
  'steampunk rainbow': 'CC5500',
  'mint green': '98FF98',
  'sky blue': '87CEEB',
  'navy blue': '000080',
  'royal blue': '4169E1',
  'electric blue': '7DF9FF',
  'cyan': '00FFFF',
  'teal': '008080',
  'magenta': 'FF00FF',
  'coral': 'FF7F50',
  'salmon': 'FA8072',
  'burgundy': '800020',
  'wine': '722F37',
  'lime': '32CD32',
  'forest green': '228B22',
  'dark green': '006400',
  'gold': 'FFD700',
  'silver': 'C0C0C0',
  'bronze': 'CD7F32',
  'copper': 'B87333',
  'rose gold': 'B76E79',
  'champagne': 'F7E7CE',
  'cream': 'FFFDD0',
  'beige': 'F5F5DC',
  'khaki': 'C3B091',
  'tan': 'D2B48C',
  'coffee': '6F4E37',
  'chocolate': 'D2691E',
  
  // Silk variants
  'silk gold': 'FFD700',
  'silk silver': 'C0C0C0',
  'silk copper': 'B87333',
  'silk bronze': 'CD7F32',
  'silk blue': '4682B4',
  'silk red': 'DC143C',
  'silk green': '50C878',
  'silk purple': '9370DB',
  'silk pink': 'FFB6C1',
  
  // Matte variants
  'matte black': '1A1A1A',
  'matte white': 'EEEEEE',
  'matte gray': '808080',
  'matte grey': '808080',
  
  // Translucent
  'translucent': 'E0E0E0',
  'clear': 'F0F0F0',
  'transparent': 'F5F5F5',
  
  // Glow colors
  'glow green': '39FF14',
  'glow blue': '00BFFF',
  
  // Multi-color placeholders
  'dual color': 'MULTI',
  'quadruple color': 'MULTI',
  'quad color': 'MULTI',
  'rainbow': 'MULTI',
};

export function getEryoneColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (ERYONE_COLOR_MAPPING[normalized]) {
    return ERYONE_COLOR_MAPPING[normalized];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(ERYONE_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface EryoneEnrichmentResult {
  tdsUrl: string | null;
  finishType: FinishType;
  material: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  printSpeedMax: number | null;
  requiresEnclosure: boolean;
  isAbrasive: boolean;
  productLineId: string;
  cleanedTitle: string;
  isHighSpeed: boolean;
  packQuantity: number;
}

export function enrichEryoneProduct(
  title: string,
  existingMaterial?: string | null,
  existingTdsUrl?: string | null
): EryoneEnrichmentResult {
  const material = existingMaterial || normalizeEryoneMaterial(title);
  const settings = getEryonePrintSettings(material);
  const tds = existingTdsUrl ? null : matchEryoneTds(title);
  const highSpeed = isHighSpeed(title);
  
  // Get high-speed settings if applicable
  let finalSettings = settings;
  if (highSpeed && material) {
    const hsSettings = getEryonePrintSettings(`${material} HIGH-SPEED`);
    if (hsSettings) finalSettings = hsSettings;
  }
  
  return {
    tdsUrl: existingTdsUrl || tds?.url || null,
    finishType: extractFinishType(title),
    material,
    nozzleTempMin: finalSettings?.nozzleTempMin || null,
    nozzleTempMax: finalSettings?.nozzleTempMax || null,
    bedTempMin: finalSettings?.bedTempMin || null,
    bedTempMax: finalSettings?.bedTempMax || null,
    printSpeedMax: finalSettings?.printSpeedMax || null,
    requiresEnclosure: finalSettings?.requiresEnclosure || false,
    isAbrasive: finalSettings?.isAbrasive || false,
    productLineId: generateEryoneProductLineId(title, material),
    cleanedTitle: cleanEryoneTitle(title),
    isHighSpeed: highSpeed,
    packQuantity: getPackQuantity(title),
  };
}
