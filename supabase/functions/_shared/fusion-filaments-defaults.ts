/**
 * FUSION FILAMENTS BRAND-SPECIFIC DEFAULTS
 * 
 * Science-themed color names, AMS compatibility, cardboard spools.
 * Critical fix: HT-PET+ products miscategorized as TPE -> PETG
 */

// ============================================================================
// TDS URL PATTERNS
// ============================================================================

export const FUSION_TDS_PATTERNS: Record<string, string> = {
  // Fusion Filaments doesn't have public TDS PDFs - specs are on product pages
  // If they add TDS in future, map them here
};

export function matchFusionTds(title: string): { url: string; pattern: string } | null {
  if (!title) return null;
  const normalizedTitle = title.toUpperCase();
  const sorted = Object.entries(FUSION_TDS_PATTERNS).sort((a, b) => b[0].length - a[0].length);
  for (const [pattern, url] of sorted) {
    if (normalizedTitle.includes(pattern.toUpperCase())) return { url, pattern };
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
  highTempCapable?: boolean;
}

export const FUSION_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // HT-PLA+ (3D870 resin - high temp PLA)
  'HTPLA': { nozzleTempMin: 230, nozzleTempMax: 245, bedTempMin: 50, bedTempMax: 75, highTempCapable: true },
  'HT-PLA': { nozzleTempMin: 230, nozzleTempMax: 245, bedTempMin: 50, bedTempMax: 75, highTempCapable: true },
  'HTPLA+': { nozzleTempMin: 230, nozzleTempMax: 245, bedTempMin: 50, bedTempMax: 75, highTempCapable: true },
  
  // Standard PLA
  'PLA': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  
  // High-Speed PLA
  'HSPLA': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60, highSpeedCapable: true, printSpeedMax: 200 },
  'HS-PLA': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60, highSpeedCapable: true, printSpeedMax: 200 },
  
  // HT-PET+ (high temp PETG - CRITICAL: NOT TPE!)
  'HTPET': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 90 },
  'HT-PET': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 90 },
  'HTPET+': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 90 },
  
  // PCTG
  'PCTG': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 85 },
  
  // ASA variants
  'ASA': { nozzleTempMin: 235, nozzleTempMax: 255, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'EASYASA': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 85, bedTempMax: 105, requiresEnclosure: true },
  'EASY-ASA': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 85, bedTempMax: 105, requiresEnclosure: true },
  
  // ABS variants
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'HTABS': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 95, bedTempMax: 115, requiresEnclosure: true, highTempCapable: true },
  'HT-ABS': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 95, bedTempMax: 115, requiresEnclosure: true, highTempCapable: true },
};

export function getFusionPrintSettings(material: string | null, title?: string): PrintSettings | null {
  if (!material && !title) return null;
  
  // Try exact material match first
  if (material) {
    const upperMaterial = material.toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (const [key, settings] of Object.entries(FUSION_PRINT_SETTINGS)) {
      if (key.replace(/[^A-Z0-9]/g, '') === upperMaterial) {
        return settings;
      }
    }
  }
  
  // Try to extract from title
  if (title) {
    const upperTitle = title.toUpperCase();
    
    // Check specific patterns in order of specificity
    if (/HT[\s-]?PET/i.test(upperTitle)) return FUSION_PRINT_SETTINGS['HTPET'];
    if (/HT[\s-]?PLA/i.test(upperTitle)) return FUSION_PRINT_SETTINGS['HTPLA'];
    if (/HT[\s-]?ABS/i.test(upperTitle)) return FUSION_PRINT_SETTINGS['HTABS'];
    if (/HS[\s-]?PLA/i.test(upperTitle)) return FUSION_PRINT_SETTINGS['HSPLA'];
    if (/EASY[\s-]?ASA/i.test(upperTitle)) return FUSION_PRINT_SETTINGS['EASYASA'];
    if (/PCTG/i.test(upperTitle)) return FUSION_PRINT_SETTINGS['PCTG'];
    if (/ASA/i.test(upperTitle)) return FUSION_PRINT_SETTINGS['ASA'];
    if (/ABS/i.test(upperTitle)) return FUSION_PRINT_SETTINGS['ABS'];
    if (/PLA/i.test(upperTitle)) return FUSION_PRINT_SETTINGS['PLA'];
  }
  
  return null;
}

// ============================================================================
// FINISH TYPE EXTRACTION
// ============================================================================

export type FinishType = 'Gloss' | 'Matte' | 'Sparkle' | 'Standard';

export function extractFusionFinishType(title: string, appearance?: string, sparkleLevel?: string): FinishType {
  if (!title) return 'Standard';
  
  const upperTitle = title.toUpperCase();
  const upperAppearance = (appearance || '').toUpperCase();
  
  // Check sparkle level first
  if (sparkleLevel && sparkleLevel.toLowerCase() !== 'no sparkle') {
    return 'Sparkle';
  }
  
  // Check appearance attribute
  if (upperAppearance.includes('GLOSS')) return 'Gloss';
  if (upperAppearance.includes('MATTE') || upperAppearance.includes('MATT')) return 'Matte';
  
  // Check title for finish indicators
  if (/\bGLOSS\b/i.test(upperTitle)) return 'Gloss';
  if (/\bMATTE?\b/i.test(upperTitle)) return 'Matte';
  if (/\bSPARKLE\b/i.test(upperTitle)) return 'Sparkle';
  
  // Check category patterns
  if (/ABS[\s-]?GLOSS/i.test(upperTitle)) return 'Gloss';
  if (/ABS[\s-]?MATTE/i.test(upperTitle)) return 'Matte';
  
  return 'Standard';
}

// ============================================================================
// MATERIAL NORMALIZATION - CRITICAL FIX FOR TPE -> PETG
// ============================================================================

export function normalizeFusionMaterial(title: string, scrapedMaterial?: string): string | null {
  if (!title && !scrapedMaterial) return null;
  
  const t = (title || '').toLowerCase();
  const m = (scrapedMaterial || '').toLowerCase();
  const combined = `${t} ${m}`;
  
  // CRITICAL: HT-PET+ is PETG, NOT TPE!
  // This fixes the 16 miscategorized products
  if (/ht[\s-]?pet|htpet\+?/i.test(combined)) return 'PETG';
  
  // HT-PLA+ is high-temp PLA
  if (/ht[\s-]?pla|htpla\+?/i.test(combined)) return 'PLA';
  
  // HS-PLA is high-speed PLA
  if (/hs[\s-]?pla|hspla/i.test(combined)) return 'PLA';
  
  // HT-ABS is high-temp ABS
  if (/ht[\s-]?abs|htabs/i.test(combined)) return 'ABS';
  
  // EasyASA is ASA
  if (/easy[\s-]?asa/i.test(combined)) return 'ASA';
  
  // PCTG stays PCTG
  if (/pctg/i.test(combined)) return 'PCTG';
  
  // Standard materials
  if (/\basa\b/i.test(combined)) return 'ASA';
  if (/\babs\b/i.test(combined)) return 'ABS';
  if (/\bpetg\b/i.test(combined)) return 'PETG';
  if (/\bpla\b/i.test(combined)) return 'PLA';
  
  return null;
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateFusionProductLineId(title: string, material?: string | null): string {
  const mat = material || normalizeFusionMaterial(title) || 'unknown';
  const t = (title || '').toLowerCase();
  
  // Determine specific product line
  let productLine = 'standard';
  
  if (/ht[\s-]?pla|htpla\+?/i.test(t)) {
    productLine = 'htpla';
  } else if (/hs[\s-]?pla|hspla/i.test(t)) {
    productLine = 'hspla';
  } else if (/ht[\s-]?pet|htpet\+?/i.test(t)) {
    productLine = 'htpet';
  } else if (/ht[\s-]?abs|htabs/i.test(t)) {
    productLine = 'htabs-matte';
  } else if (/easy[\s-]?asa/i.test(t)) {
    productLine = 'easyasa';
  } else if (/abs[\s-]?gloss/i.test(t)) {
    productLine = 'abs-gloss';
  } else if (/abs[\s-]?matte/i.test(t)) {
    productLine = 'abs-matte';
  } else if (/pctg/i.test(t)) {
    productLine = 'pctg';
  } else if (/\basa\b/i.test(t)) {
    productLine = 'asa';
  }
  
  return `fusionfilaments__${mat.toLowerCase()}__${productLine}`;
}

// ============================================================================
// SCIENCE-THEMED COLOR MAPPING
// ============================================================================

export const FUSION_COLOR_MAPPING: Record<string, string> = {
  // Blacks
  'carbon rod black': '1A1A1A',
  'ionized cobalt black': '1C1C2E',
  'cosmic magnetism grey': '1E0F3C',
  
  // Whites
  'nuclear winter white': 'FFFFFF',
  'electrolytic deuterium': 'E0E7ED',
  'radiated fog': 'D3D3D3',
  
  // Blues
  'cosmic ray blue': '4169E1',
  'cold fusion blue': '00CED1',
  'heavy water blue': '5F9EA0',
  'neutron star blue': '191970',
  
  // Greens
  'radium green': '7CFC00',
  'tritium green': '00FF00',
  'interstellar emerald': '50C878',
  'radioactive green': '32CD32',
  
  // Reds
  'red dwarf': '8B0000',
  'seismic red': 'DC143C',
  'solar flare red': 'FF4500',
  
  // Oranges
  'radioactive orange': 'FF4500',
  'alpha particle orange': 'FF8C00',
  'solar corona orange': 'FF6347',
  
  // Yellows
  'uranium yellow': 'FFFF00',
  'critical mass gold': 'FFD700',
  'gamma ray yellow': 'FFEA00',
  
  // Purples/Magentas
  'geomagnetic mauve': 'E0B0FF',
  'nebula purple': '9370DB',
  'quantum violet': '8A2BE2',
  
  // Pinks
  'proton pink': 'FF69B4',
  'antimatter pink': 'FF1493',
  
  // Greys
  'mushroom cloud grey': '808080',
  'nano tube grey': '696969',
  'graphene grey': '4A4A4A',
  'asteroid grey': 'A9A9A9',
  
  // Naturals
  'nuclide natural': 'F5F5DC',
  'natural': 'F5F5DC',
  'translucent natural': 'FFFAF0',
  
  // Browns
  'meteor brown': '8B4513',
  'cosmic dust brown': 'A0522D',
  
  // Silvers/Metallics
  'ion silver': 'C0C0C0',
  'titanium silver': 'B8B8B8',
  
  // Standard fallbacks
  'black': '000000',
  'white': 'FFFFFF',
  'red': 'FF0000',
  'blue': '0000FF',
  'green': '00FF00',
  'yellow': 'FFFF00',
  'orange': 'FFA500',
  'purple': '800080',
  'pink': 'FFC0CB',
  'grey': '808080',
  'gray': '808080',
};

export function getFusionColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Try exact match
  if (FUSION_COLOR_MAPPING[normalized]) {
    return FUSION_COLOR_MAPPING[normalized];
  }
  
  // Try partial matches
  for (const [key, hex] of Object.entries(FUSION_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  // Extract basic color from compound names
  const basicColors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'grey', 'gray', 'gold', 'silver'];
  for (const color of basicColors) {
    if (normalized.includes(color)) {
      return FUSION_COLOR_MAPPING[color] || null;
    }
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanFusionTitle(title: string): string {
  if (!title) return '';
  
  return title
    // Remove SKU prefix like [870175CRB]
    .replace(/^\s*\[[A-Z0-9]+\]\s*/i, '')
    // Remove weight prefix like "1KG "
    .replace(/^\s*\d+(?:\.?\d*)?\s*(?:KG|G)\s+/i, '')
    // Remove "Filament - " suffix pattern
    .replace(/\s+Filament\s*[-–]\s*/i, ' ')
    // Remove "Filament" word
    .replace(/\s+Filament\s*/i, ' ')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// EXTRACT COLOR FROM TITLE
// ============================================================================

export function extractColorFromTitle(title: string): string | null {
  if (!title) return null;
  
  // Pattern: "Material - Color Name" or "Material Filament - Color Name"
  const dashMatch = title.match(/[-–]\s*([^-–]+)$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface FusionEnrichmentResult {
  tdsUrl: string | null;
  finishType: FinishType;
  material: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  printSpeedMax: number | null;
  productLineId: string;
  colorHex: string | null;
  enclosureRequired: boolean;
  highSpeedCapable: boolean;
  highTempCapable: boolean;
  isAmsCompatible: boolean | null;
  spoolMaterial: string;
}

export function enrichFusionProduct(
  title: string,
  existingMaterial?: string | null,
  appearance?: string,
  sparkleLevel?: string,
  amsCompatible?: string,
  colorName?: string
): FusionEnrichmentResult {
  const material = normalizeFusionMaterial(title, existingMaterial || undefined);
  const settings = getFusionPrintSettings(material, title);
  const tds = matchFusionTds(title);
  const color = colorName || extractColorFromTitle(title);
  
  // Parse AMS compatibility
  let isAmsCompatible: boolean | null = null;
  if (amsCompatible) {
    const lower = amsCompatible.toLowerCase();
    if (lower === 'yes' || lower === 'true') isAmsCompatible = true;
    else if (lower === 'no' || lower === 'false') isAmsCompatible = false;
  }
  
  return {
    tdsUrl: tds?.url || null,
    finishType: extractFusionFinishType(title, appearance, sparkleLevel),
    material,
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    printSpeedMax: settings?.printSpeedMax || null,
    productLineId: generateFusionProductLineId(title, material),
    colorHex: color ? getFusionColorHex(color) : null,
    enclosureRequired: settings?.requiresEnclosure || false,
    highSpeedCapable: settings?.highSpeedCapable || false,
    highTempCapable: settings?.highTempCapable || false,
    isAmsCompatible,
    spoolMaterial: 'Cardboard', // All Fusion Filaments use cardboard spools
  };
}
