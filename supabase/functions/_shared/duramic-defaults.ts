/**
 * DURAMIC 3D BRAND-SPECIFIC DEFAULTS
 * 
 * Configuration for Duramic 3D filament sync pipeline including:
 * - TDS URL patterns (4 official Shopify CDN URLs)
 * - Default print settings by material
 * - Material normalization
 * - Finish type detection
 * - Product line ID generation
 * - Color mapping
 */

// ============================================================================
// TDS URL PATTERNS
// Curated official Shopify CDN URLs for Duramic 3D TDS documents
// ============================================================================

export const DURAMIC_TDS_PATTERNS: Record<string, string> = {
  // PLA variants
  'pla-plus': 'https://cdn.shopifycdn.net/s/files/1/0279/4933/4599/files/Duramic_PLA_Plus_TDS_EN_V1.1.pdf?v=1629881206',
  'pla+': 'https://cdn.shopifycdn.net/s/files/1/0279/4933/4599/files/Duramic_PLA_Plus_TDS_EN_V1.1.pdf?v=1629881206',
  'matte-pla': 'https://cdn.shopifycdn.net/s/files/1/0279/4933/4599/files/Duramic_PLA_TDS_EN_V1.1.pdf?v=1629881206',
  'pla-matte': 'https://cdn.shopifycdn.net/s/files/1/0279/4933/4599/files/Duramic_PLA_TDS_EN_V1.1.pdf?v=1629881206',
  'pla': 'https://cdn.shopifycdn.net/s/files/1/0279/4933/4599/files/Duramic_PLA_TDS_EN_V1.1.pdf?v=1629881206',
  
  // PETG
  'petg': 'https://cdn.shopifycdn.net/s/files/1/0279/4933/4599/files/Duramic_PETG_TDS_V4-G105.pdf?v=1629881207',
  
  // TPU
  'tpu': 'https://cdn.shopifycdn.net/s/files/1/0279/4933/4599/files/Duramic_TPU_TDS_EN_V1.1.pdf?v=1629881207',
};

export function matchDuramicTds(title: string, material?: string | null): { url: string; pattern: string } | null {
  if (!title && !material) return null;
  
  const normalizedTitle = (title || '').toUpperCase();
  const normalizedMaterial = (material || '').toUpperCase();
  const combined = `${normalizedTitle} ${normalizedMaterial}`;
  
  // Sort by key length (longest first) for most specific match
  const sorted = Object.entries(DURAMIC_TDS_PATTERNS).sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, url] of sorted) {
    if (combined.includes(pattern.toUpperCase().replace(/-/g, ' ')) || 
        combined.includes(pattern.toUpperCase().replace(/-/g, ''))) {
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

export const DURAMIC_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Standard materials
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 65 },
  'PLA+': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 65 },
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 80 },
  'TPU': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 40 },
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  
  // Specialty finishes (same base temps as PLA)
  'Silk PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 65 },
  'Matte PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 65 },
  'Glow PLA': { nozzleTempMin: 195, nozzleTempMax: 225, bedTempMin: 50, bedTempMax: 65 },
  'Marble PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 65 },
  'Translucent PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 65 },
};

export function getDuramicPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  
  const normalizedMaterial = material.toUpperCase().trim();
  
  // Direct match
  for (const [key, settings] of Object.entries(DURAMIC_PRINT_SETTINGS)) {
    if (key.toUpperCase() === normalizedMaterial) {
      return settings;
    }
  }
  
  // Partial match for base materials
  if (normalizedMaterial.includes('PLA')) return DURAMIC_PRINT_SETTINGS['PLA'];
  if (normalizedMaterial.includes('PETG')) return DURAMIC_PRINT_SETTINGS['PETG'];
  if (normalizedMaterial.includes('TPU')) return DURAMIC_PRINT_SETTINGS['TPU'];
  if (normalizedMaterial.includes('ABS')) return DURAMIC_PRINT_SETTINGS['ABS'];
  
  return null;
}

// ============================================================================
// FINISH TYPE EXTRACTION
// ============================================================================

export type FinishType = 'Silk' | 'Matte' | 'Glow' | 'Translucent' | 'Marble' | 'Standard';

const FINISH_PATTERNS: Array<{ pattern: RegExp; finish: FinishType }> = [
  { pattern: /\bsilk\b|\bshiny\b/i, finish: 'Silk' },
  { pattern: /\bmatte\b/i, finish: 'Matte' },
  { pattern: /\bglow(?:\s*in\s*(?:the\s*)?dark)?\b/i, finish: 'Glow' },
  { pattern: /\btranslucent\b|\btransparent\b|\bclear\b/i, finish: 'Translucent' },
  { pattern: /\bmarble\b/i, finish: 'Marble' },
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

export const DURAMIC_MATERIAL_MAPPING: Record<string, string> = {
  // Standard materials
  'pla': 'PLA',
  'pla+': 'PLA+',
  'pla plus': 'PLA+',
  'premium pla': 'PLA+',
  'petg': 'PETG',
  'tpu': 'TPU',
  'tpu 95a': 'TPU',
  'tpu95a': 'TPU',
  'flexible': 'TPU',
  'abs': 'ABS',
  
  // Specialty finishes - map to base material
  'silk pla': 'PLA',
  'shiny silk pla': 'PLA',
  'shiny pla': 'PLA',
  'matte pla': 'PLA',
  'glow in the dark': 'PLA',
  'glow pla': 'PLA',
  'translucent pla': 'PLA',
  'marble pla': 'PLA',
  'marble': 'PLA',
  
  // PETG variants
  'translucent petg': 'PETG',
};

export function normalizeDuramicMaterial(title: string): string | null {
  if (!title) return null;
  
  const normalizedTitle = title.toLowerCase().trim();
  
  // Try direct mapping first (longest patterns first)
  const sortedMappings = Object.entries(DURAMIC_MATERIAL_MAPPING)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, material] of sortedMappings) {
    if (normalizedTitle.includes(pattern)) {
      return material;
    }
  }
  
  // Fallback pattern matching
  if (/petg/i.test(normalizedTitle)) return 'PETG';
  if (/pla/i.test(normalizedTitle)) return 'PLA';
  if (/tpu|flexible/i.test(normalizedTitle)) return 'TPU';
  if (/abs/i.test(normalizedTitle)) return 'ABS';
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

const DURAMIC_TITLE_NOISE: RegExp[] = [
  /duramic\s*3d\s*/gi,
  /\b3d\s*print(?:er|ing)?\s*filament\b/gi,
  /\bfilament\b/gi,
  /\b1\.75\s*mm\b/gi,
  /\b2\.85\s*mm\b/gi,
  /\b1\s*kg\s*(?:spool)?\b/gi,
  /\b2\.2\s*lbs?\b/gi,
  /\b0\.5\s*kg\b/gi,
  /dimensional\s*accuracy[^,]*/gi,
  /non-?tangling[^,]*/gi,
  /no-?tangling[^,]*/gi,
  /\+\/?-?\s*0\.0[23]\s*mm/gi,
  /fit\s*most\s*(?:fdm\s*)?(?:3d\s*)?printers?/gi,
  /for\s*(?:fdm\s*)?3d\s*printers?/gi,
  /\(\s*\)/g,
  /,\s*,/g,
];

const PROMOTIONAL_PATTERNS: RegExp[] = [
  /\b(?:\d+\s*)?pack\b/i,
  /\bbundle\b/i,
  /\bcombo\b/i,
  /\bsale\b/i,
  /\bdeal\b/i,
  /\bspecial\b/i,
];

export function cleanDuramicTitle(title: string): string {
  if (!title) return '';
  
  let cleaned = title;
  
  // Remove noise patterns
  for (const pattern of DURAMIC_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  
  // Clean up whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove trailing/leading punctuation
  cleaned = cleaned.replace(/^[,\-\s]+|[,\-\s]+$/g, '');
  
  return cleaned;
}

export function isPromotionalProduct(title: string): boolean {
  if (!title) return false;
  return PROMOTIONAL_PATTERNS.some(pattern => pattern.test(title));
}

export function isMultiPack(title: string): boolean {
  if (!title) return false;
  return /\b(\d+)\s*(?:pack|pcs?|pieces?)\b/i.test(title) || 
         /\bpack\s*of\s*(\d+)\b/i.test(title);
}

export function getPackQuantity(title: string): number {
  if (!title) return 1;
  
  const match = title.match(/\b(\d+)\s*(?:pack|pcs?|pieces?)\b/i) ||
                title.match(/\bpack\s*of\s*(\d+)\b/i);
  
  if (match && match[1]) {
    const qty = parseInt(match[1], 10);
    if (qty >= 2 && qty <= 20) return qty;
  }
  
  return 1;
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateDuramicProductLineId(title: string, material?: string | null): string {
  const mat = material || normalizeDuramicMaterial(title) || 'unknown';
  const finish = extractFinishType(title);
  const packQty = getPackQuantity(title);
  
  let lineId = `duramic-3d__${mat.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  
  // Add finish type suffix
  if (finish !== 'Standard') {
    lineId += `__${finish.toLowerCase()}`;
  } else {
    lineId += '__standard';
  }
  
  // Add pack quantity suffix for multi-packs
  if (packQty > 1) {
    lineId += `__${packQty}pack`;
  }
  
  return lineId;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const DURAMIC_COLOR_MAPPING: Record<string, string> = {
  // Blues
  'cyan blue': '00BFFF',
  'cyanblue': '00BFFF',
  'cyan': '00FFFF',
  'electric blue': '7DF9FF',
  'army blue': '4B5320',
  'navy blue': '000080',
  'sky blue': '87CEEB',
  'blue': '0066CC',
  'light blue': 'ADD8E6',
  'dark blue': '00008B',
  
  // Greens
  'lime green': '32CD32',
  'army green': '4B5320',
  'forest green': '228B22',
  'green': '00AA00',
  'light green': '90EE90',
  'dark green': '006400',
  'olive': '808000',
  
  // Reds/Pinks
  'red': 'CC0000',
  'translucent red': 'FF6B6B',
  'magenta': 'FF00FF',
  'pink': 'FFC0CB',
  'hot pink': 'FF69B4',
  
  // Oranges/Yellows
  'orange': 'FF6600',
  'yellow': 'FFCC00',
  'gold': 'FFD700',
  
  // Purples
  'purple': '800080',
  'violet': 'EE82EE',
  
  // Neutrals
  'white': 'FFFFFF',
  'black': '1A1A1A',
  'grey': '808080',
  'gray': '808080',
  'silver': 'C0C0C0',
  
  // Translucent/Clear
  'translucent': 'F5F5F5',
  'translucent green': '90EE90',
  'translucent blue': '87CEEB',
  'clear': 'F0F0F0',
  
  // Specialty
  'marble': 'E8E8E8',
  'wood': 'DEB887',
  
  // Metallics
  'shiny bronze': 'CD7F32',
  'metallic silver': 'C0C0C0',
  'metallic gold': 'D4AF37',
  'bronze': 'CD7F32',
  'copper': 'B87333',
  
  // Silk/Shiny variants
  'shiny silver': 'C0C0C0',
  'shiny gold': 'FFD700',
  'shiny copper': 'B87333',
  'shiny blue': '4169E1',
  'shiny green': '32CD32',
  'shiny red': 'DC143C',
};

export function getDuramicColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (DURAMIC_COLOR_MAPPING[normalized]) {
    return DURAMIC_COLOR_MAPPING[normalized];
  }
  
  // Partial match (remove common prefixes/suffixes)
  const cleanedColor = normalized
    .replace(/^(shiny|silk|matte|translucent|glow)\s*/i, '')
    .replace(/\s*(filament|pla|petg|tpu|abs)$/i, '')
    .trim();
  
  if (DURAMIC_COLOR_MAPPING[cleanedColor]) {
    return DURAMIC_COLOR_MAPPING[cleanedColor];
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface DuramicEnrichmentResult {
  tdsUrl: string | null;
  finishType: FinishType;
  material: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  productLineId: string;
  cleanedTitle: string;
  isMultiPack: boolean;
  packQuantity: number;
}

export function enrichDuramicProduct(
  title: string,
  existingMaterial?: string | null,
  existingTdsUrl?: string | null
): DuramicEnrichmentResult {
  const material = existingMaterial || normalizeDuramicMaterial(title);
  const finishType = extractFinishType(title);
  const settings = getDuramicPrintSettings(material);
  const tds = existingTdsUrl || matchDuramicTds(title)?.url || null;
  
  return {
    tdsUrl: tds,
    finishType,
    material,
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    productLineId: generateDuramicProductLineId(title, material),
    cleanedTitle: cleanDuramicTitle(title),
    isMultiPack: isMultiPack(title),
    packQuantity: getPackQuantity(title),
  };
}
