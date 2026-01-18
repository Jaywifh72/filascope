/**
 * YOUSU BRAND-SPECIFIC DEFAULTS
 * 
 * Yousu (Guangzhou YOUSU 3D Technology) - Chinese manufacturer with 25+ material types
 * Platform: Custom e-commerce (ysfilament.com) - requires Firecrawl HTML scraping
 * Specialty: Massive material catalog, dual diameter support, specialty finishes
 */

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export interface MaterialPattern {
  pattern: RegExp;
  material: string;
  isAbrasive?: boolean;
  requiresEnclosure?: boolean;
  isConductive?: boolean;
}

export const YOUSU_MATERIAL_PATTERNS: MaterialPattern[] = [
  // High-performance (check first)
  { pattern: /\bpeek\b/i, material: 'PEEK', requiresEnclosure: true },
  { pattern: /\bpei\b|\bultem\b/i, material: 'PEI', requiresEnclosure: true },
  
  // Carbon fiber composites (before base materials)
  { pattern: /pa[\s-]?12[\s-]?cf|pa[\s-]?cf|nylon[\s-]?cf|carbon[\s-]?fiber[\s-]?(?:pa|nylon)/i, material: 'PA-CF', isAbrasive: true, requiresEnclosure: true },
  { pattern: /pp[\s-]?cf|carbon[\s-]?fiber[\s-]?pp/i, material: 'PP-CF', isAbrasive: true },
  { pattern: /pla[\s-]?cf|carbon[\s-]?fiber[\s-]?pla/i, material: 'PLA-CF', isAbrasive: true },
  { pattern: /petg[\s-]?cf|carbon[\s-]?fiber[\s-]?petg/i, material: 'PETG-CF', isAbrasive: true },
  { pattern: /abs[\s-]?cf|carbon[\s-]?fiber[\s-]?abs/i, material: 'ABS-CF', isAbrasive: true, requiresEnclosure: true },
  { pattern: /pc[\s-]?cf|carbon[\s-]?fiber[\s-]?pc/i, material: 'PC-CF', isAbrasive: true, requiresEnclosure: true },
  
  // Enhanced variants
  { pattern: /pla[\s-]?\+|pla[\s-]?plus/i, material: 'PLA+' },
  { pattern: /abs[\s-]?\+|abs[\s-]?plus/i, material: 'ABS+', requiresEnclosure: true },
  { pattern: /(?:fast|high[\s-]?speed|hs)[\s-]?pla/i, material: 'PLA-HS' },
  
  // Specialty
  { pattern: /\bconductive\b/i, material: 'PLA-Conductive', isConductive: true },
  { pattern: /\bmetal[\s-]?fill/i, material: 'PLA-Metal', isAbrasive: true },
  { pattern: /\bpcl\b|low[\s-]?temp/i, material: 'PCL' },
  
  // Engineering plastics
  { pattern: /\bpc\b|polycarbonate/i, material: 'PC', requiresEnclosure: true },
  { pattern: /\bpp\b|polypropylene/i, material: 'PP' },
  { pattern: /\bpom\b|acetal|delrin/i, material: 'POM' },
  { pattern: /\bnylon\b|\bpa\b(?![\s-]?cf)/i, material: 'PA', requiresEnclosure: true },
  { pattern: /\bpvb\b/i, material: 'PVB' },
  { pattern: /\bhips\b/i, material: 'HIPS', requiresEnclosure: true },
  { pattern: /\bpva\b/i, material: 'PVA' },
  { pattern: /\basa\b/i, material: 'ASA', requiresEnclosure: true },
  
  // Base materials (check last)
  { pattern: /\btpu\b|flexible/i, material: 'TPU' },
  { pattern: /\bpetg\b/i, material: 'PETG' },
  { pattern: /\babs\b/i, material: 'ABS', requiresEnclosure: true },
  { pattern: /\bpla\b/i, material: 'PLA' },
];

export function normalizeYousuMaterial(title: string): { 
  material: string | null; 
  isAbrasive: boolean; 
  requiresEnclosure: boolean;
  isConductive: boolean;
} {
  if (!title) return { material: null, isAbrasive: false, requiresEnclosure: false, isConductive: false };
  
  for (const { pattern, material, isAbrasive, requiresEnclosure, isConductive } of YOUSU_MATERIAL_PATTERNS) {
    if (pattern.test(title)) {
      return { 
        material, 
        isAbrasive: isAbrasive || false, 
        requiresEnclosure: requiresEnclosure || false,
        isConductive: isConductive || false
      };
    }
  }
  
  return { material: null, isAbrasive: false, requiresEnclosure: false, isConductive: false };
}

// ============================================================================
// TDS URL MAPPING
// Curated official Yousu TDS PDF URLs (14 products)
// ============================================================================

export const YOUSU_TDS_PATTERNS: Record<string, string> = {
  // PLA variants
  'pla': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-081b.pdf',
  'pla+': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-8e09.pdf',
  'pla-plus': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-8e09.pdf',
  'silk-pla': 'https://ysfilament.com/u_file/2206/13/file/YOUSUSILKPLATDS-81c3.pdf',
  'pla-silk': 'https://ysfilament.com/u_file/2206/13/file/YOUSUSILKPLATDS-81c3.pdf',
  'wood-pla': 'https://ysfilament.com/u_file/2206/14/file/YOUSUWOODTDS-eb4e.pdf',
  'pla-wood': 'https://ysfilament.com/u_file/2206/14/file/YOUSUWOODTDS-eb4e.pdf',
  
  // ABS
  'abs': 'https://ysfilament.com/u_file/2211/09/file/ABSTDS-af53.pdf',
  
  // PETG
  'petg': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPETGTDS-8fb4.pdf',
  
  // Engineering plastics
  'pc': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPCTDS-535a.pdf',
  'polycarbonate': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPCTDS-535a.pdf',
  'pp': 'https://ysfilament.com/u_file/2211/06/file/YOUSU3DPPTDS-4872.pdf',
  'polypropylene': 'https://ysfilament.com/u_file/2211/06/file/YOUSU3DPPTDS-4872.pdf',
  'pom': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPOMTDS-ae63.pdf',
  'hips': 'https://ysfilament.com/u_file/2206/14/file/YOUSUHIPSTDS-c1e5.pdf',
  
  // Nylon
  'nylon': 'https://ysfilament.com/u_file/2206/14/file/YOUSUNylonTDS-38ef.pdf',
  'pa': 'https://ysfilament.com/u_file/2206/14/file/YOUSUNylonTDS-38ef.pdf',
  'pa6': 'https://ysfilament.com/u_file/2206/14/file/YOUSUNylonTDS-38ef.pdf',
  
  // Flexible
  'tpu': 'https://ysfilament.com/u_file/2206/13/file/YOUSU3DTPUTDS-fd35.pdf',
  
  // Support / Specialty
  'pva': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPVATDS-6752.pdf',
  'pvb': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPVBTDS-9c2c.pdf',
};

export function matchYousuTds(title: string, material?: string | null): { url: string; pattern: string } | null {
  if (!title && !material) return null;
  
  const normalizedTitle = (title || '').toLowerCase();
  const normalizedMaterial = (material || '').toLowerCase();
  const combined = `${normalizedTitle} ${normalizedMaterial}`;
  
  // Sort by key length (longest first) for most specific match
  const sorted = Object.entries(YOUSU_TDS_PATTERNS).sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, url] of sorted) {
    if (combined.includes(pattern.replace(/-/g, ' ')) || 
        combined.includes(pattern.replace(/-/g, '')) ||
        combined.includes(pattern)) {
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
  highSpeedCapable?: boolean;
}

export const YOUSU_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Standard materials
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PLA+': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'PLA-HS': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 45, bedTempMax: 60, highSpeedCapable: true },
  'PLA-CF': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60, isAbrasive: true },
  'PLA-Conductive': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'PLA-Metal': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60, isAbrasive: true },
  
  // PETG
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 85 },
  'PETG-CF': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 85, isAbrasive: true },
  
  // ABS family
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'ABS+': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'ABS-CF': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 95, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'ASA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  
  // Flexible
  'TPU': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 30, bedTempMax: 50, printSpeedMax: 40 },
  
  // Engineering
  'PA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 90, requiresEnclosure: true },
  'PA-CF': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true, isAbrasive: true },
  'PC': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 100, bedTempMax: 120, requiresEnclosure: true },
  'PC-CF': { nozzleTempMin: 270, nozzleTempMax: 290, bedTempMin: 100, bedTempMax: 120, requiresEnclosure: true, isAbrasive: true },
  'PP': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 50, bedTempMax: 70 },
  'PP-CF': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 50, bedTempMax: 70, isAbrasive: true },
  'POM': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 80, bedTempMax: 100 },
  'PVB': { nozzleTempMin: 190, nozzleTempMax: 210, bedTempMin: 50, bedTempMax: 60 },
  'HIPS': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  
  // Support materials
  'PVA': { nozzleTempMin: 180, nozzleTempMax: 210, bedTempMin: 50, bedTempMax: 60 },
  
  // Specialty
  'PCL': { nozzleTempMin: 100, nozzleTempMax: 140, bedTempMin: 25, bedTempMax: 35 },
  
  // High-performance
  'PEI': { nozzleTempMin: 340, nozzleTempMax: 380, bedTempMin: 120, bedTempMax: 160, requiresEnclosure: true },
  'PEEK': { nozzleTempMin: 360, nozzleTempMax: 400, bedTempMin: 120, bedTempMax: 160, requiresEnclosure: true },
};

export function getYousuPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  return YOUSU_PRINT_SETTINGS[material] || null;
}

// ============================================================================
// FINISH TYPE EXTRACTION
// ============================================================================

export type FinishType = 'Silk' | 'Matte' | 'Glow' | 'Rainbow' | 'Multi' | 'Shimmer' | 'Wood' | 'ColorChange' | 'Translucent' | 'Glitter' | 'Standard';

export function extractYousuFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  const t = title.toLowerCase();
  
  // Multi-color variants
  if (/tri[\s-]?color|triple[\s-]?color|3[\s-]?color/i.test(t)) return 'Multi';
  if (/dual[\s-]?color|double[\s-]?color|2[\s-]?color|two[\s-]?color/i.test(t)) return 'Multi';
  
  // Specialty finishes
  if (/double[\s-]?layer|chameleon|color[\s-]?shift/i.test(t)) return 'Shimmer';
  if (/color[\s-]?chang|thermochromic|temperature[\s-]?chang/i.test(t)) return 'ColorChange';
  if (/\brainbow\b|gradient/i.test(t)) return 'Rainbow';
  if (/\bsilk\b|satin|pearlescent/i.test(t)) return 'Silk';
  if (/\bglow\b|luminous|phosphorescent/i.test(t)) return 'Glow';
  if (/\bmatte\b/i.test(t)) return 'Matte';
  if (/\bwood\b/i.test(t)) return 'Wood';
  if (/glitter|sparkle/i.test(t)) return 'Glitter';
  if (/clear|transparent|translucent/i.test(t)) return 'Translucent';
  
  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateYousuProductLineId(title: string, material?: string | null): string {
  const mat = material || normalizeYousuMaterial(title).material || 'unknown';
  const finish = extractYousuFinishType(title);
  const t = title.toLowerCase();
  
  // Base: yousu__{material}
  let lineId = `yousu__${mat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  
  // Add finish type for non-standard
  if (finish !== 'Standard') {
    lineId += `__${finish.toLowerCase()}`;
  } else {
    // Check for specific product line indicators
    if (/\bplus\b|\+/i.test(t) && !mat.includes('+')) {
      lineId += '__plus';
    } else if (/high[\s-]?speed|hs\b/i.test(t) && !mat.includes('HS')) {
      lineId += '__fast';
    } else if (/carbon[\s-]?fiber|cf\b/i.test(t) && !mat.includes('CF')) {
      lineId += '__composite';
    } else if (/\bconductive\b/i.test(t)) {
      lineId += '__conductive';
    } else if (/\bmetal\b/i.test(t)) {
      lineId += '__metal';
    } else {
      lineId += '__standard';
    }
  }
  
  // Add diameter if 2.85mm
  if (/2\.85\s*mm|3\.0\s*mm|3mm/i.test(t)) {
    lineId += '__2.85mm';
  }
  
  return lineId;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const YOUSU_COLOR_MAPPING: Record<string, string> = {
  // Basic colors
  'white': 'FFFFFF',
  'black': '000000',
  'red': 'FF0000',
  'blue': '0000FF',
  'green': '00AA00',
  'yellow': 'FFFF00',
  'orange': 'FF8000',
  'purple': '800080',
  'pink': 'FFC0CB',
  'gray': '808080',
  'grey': '808080',
  'brown': '8B4513',
  'beige': 'F5F5DC',
  'ivory': 'FFFFF0',
  'gold': 'FFD700',
  'silver': 'C0C0C0',
  'bronze': 'CD7F32',
  'copper': 'B87333',
  
  // Extended colors
  'navy': '000080',
  'navy blue': '000080',
  'sky blue': '87CEEB',
  'light blue': 'ADD8E6',
  'dark blue': '00008B',
  'royal blue': '4169E1',
  'teal': '008080',
  'cyan': '00FFFF',
  'turquoise': '40E0D0',
  'aqua': '00FFFF',
  'mint': '98FF98',
  'lime': '00FF00',
  'olive': '808000',
  'forest green': '228B22',
  'dark green': '006400',
  'light green': '90EE90',
  'grass green': '7CFC00',
  'maroon': '800000',
  'burgundy': '800020',
  'wine': '722F37',
  'crimson': 'DC143C',
  'coral': 'FF7F50',
  'salmon': 'FA8072',
  'peach': 'FFCBA4',
  'rose': 'FF007F',
  'hot pink': 'FF69B4',
  'magenta': 'FF00FF',
  'lavender': 'E6E6FA',
  'violet': 'EE82EE',
  'plum': 'DDA0DD',
  'indigo': '4B0082',
  'tan': 'D2B48C',
  'khaki': 'C3B091',
  'cream': 'FFFDD0',
  'chocolate': 'D2691E',
  'coffee': '6F4E37',
  'caramel': 'FFD59A',
  
  // Silk metallics
  'silk gold': 'FFD700',
  'silk silver': 'C0C0C0',
  'silk bronze': 'CD7F32',
  'silk copper': 'B87333',
  'silk rose gold': 'B76E79',
  'silk champagne': 'F7E7CE',
  'silk purple': '9370DB',
  'silk blue': '6495ED',
  'silk green': '50C878',
  'silk red': 'DC143C',
  'silk pink': 'FFB6C1',
  'silk white': 'FFFAFA',
  
  // Glow colors
  'glow green': '39FF14',
  'glow blue': '00BFFF',
  'glow orange': 'FF6600',
  'glow pink': 'FF1493',
  'glow yellow': 'FFFF33',
  'glow white': 'F0F0FF',
  
  // Wood tones
  'light wood': 'DEB887',
  'dark wood': '654321',
  'walnut': '5D432C',
  'oak': 'C19A6B',
  'cherry': '7B3F00',
  'bamboo': 'D4C4A8',
  'cedar': 'A0522D',
  
  // Rainbow/Multi (map to starting color)
  'rainbow': 'FF0000',
  'gradient': 'FF0000',
  'multicolor': 'FF0000',
  
  // Transparent/Clear
  'clear': 'FFFFFF',
  'transparent': 'FFFFFF',
  'natural': 'F5F5DC',
  
  // Specialty
  'chameleon': '9966CC',
  'color change': '9966CC',
};

export function getYousuColorHex(colorName: string): string | null {
  if (!colorName) return null;
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (YOUSU_COLOR_MAPPING[normalized]) {
    return YOUSU_COLOR_MAPPING[normalized];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(YOUSU_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanYousuTitle(title: string): string {
  if (!title) return '';
  
  return title
    .replace(/yousu\s*/gi, '')
    .replace(/3d\s*filament/gi, '')
    .replace(/3d\s*printer\s*filament/gi, '')
    .replace(/filament/gi, '')
    .replace(/1\.75\s*mm/gi, '')
    .replace(/2\.85\s*mm/gi, '')
    .replace(/3\.0\s*mm/gi, '')
    .replace(/1\s*kg/gi, '')
    .replace(/0\.5\s*kg/gi, '')
    .replace(/500\s*g/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// DIAMETER EXTRACTION
// ============================================================================

export function extractYousuDiameter(title: string, variantTitle?: string | null): number {
  const combined = `${title} ${variantTitle || ''}`.toLowerCase();
  
  if (/2\.85\s*mm|3\.0\s*mm|3mm\b/i.test(combined)) {
    return 2.85;
  }
  
  return 1.75; // Default
}

// ============================================================================
// COLOR EXTRACTION FROM TITLE
// ============================================================================

export function extractYousuColorFromTitle(title: string, variantTitle?: string | null): string | null {
  const combined = `${title} ${variantTitle || ''}`;
  
  // Try to find color from our mapping
  for (const colorName of Object.keys(YOUSU_COLOR_MAPPING)) {
    const regex = new RegExp(`\\b${colorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(combined)) {
      return colorName.charAt(0).toUpperCase() + colorName.slice(1);
    }
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface YousuEnrichmentResult {
  material: string | null;
  finishType: FinishType;
  productLineId: string;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  printSpeedMax: number | null;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
  isConductive: boolean;
  highSpeedCapable: boolean;
  colorHex: string | null;
  colorName: string | null;
  diameterMm: number;
  cleanedTitle: string;
}

export function enrichYousuProduct(
  title: string, 
  variantTitle?: string | null,
  existingMaterial?: string | null,
  existingColorName?: string | null
): YousuEnrichmentResult {
  const materialInfo = normalizeYousuMaterial(title);
  const material = existingMaterial || materialInfo.material;
  const settings = getYousuPrintSettings(material);
  const finishType = extractYousuFinishType(title);
  const colorName = existingColorName || extractYousuColorFromTitle(title, variantTitle);
  const colorHex = colorName ? getYousuColorHex(colorName) : null;
  
  return {
    material,
    finishType,
    productLineId: generateYousuProductLineId(title, material),
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    printSpeedMax: settings?.printSpeedMax || null,
    isAbrasive: materialInfo.isAbrasive || settings?.isAbrasive || false,
    requiresEnclosure: materialInfo.requiresEnclosure || settings?.requiresEnclosure || false,
    isConductive: materialInfo.isConductive || false,
    highSpeedCapable: settings?.highSpeedCapable || false,
    colorHex,
    colorName,
    diameterMm: extractYousuDiameter(title, variantTitle),
    cleanedTitle: cleanYousuTitle(title),
  };
}

// ============================================================================
// STORE INFORMATION
// ============================================================================

export const YOUSU_STORE_INFO = {
  vendor: 'Yousu',
  platform: 'custom',
  baseUrl: 'https://www.ysfilament.com',
  productsUrl: 'https://www.ysfilament.com/collections/filament',
  defaultCurrency: 'USD',
  defaultDiameter: 1.75,
  defaultWeight: 1000,
  hasApi: false,
  requiresFirecrawl: true,
};

export function getYousuProductUrl(handle: string): string {
  return `${YOUSU_STORE_INFO.baseUrl}/products/${handle}`;
}

// Collection URLs for discovery
export const YOUSU_COLLECTION_URLS = [
  '/collections/filament',
  '/collections/desktop-3d-filament',
  '/collections/functional-3d-filament',
  '/collections/silk-filament',
  '/collections/dual-color-filament',
  '/collections/tri-color-filament',
  '/collections/rainbow-filament',
  '/collections/glow-in-dark-filament',
  '/collections/wood-filament',
  '/collections/carbon-fiber-filament',
  '/collections/tpu-filament',
  '/collections/petg-filament',
  '/collections/abs',
  '/collections/nylon-filament',
  '/collections/pom-filament',
  '/collections/pc-filament',
  '/collections/pei-filament',
  '/collections/peek-filament',
];
