/**
 * SPECTRUM FILAMENTS - Brand-Specific Defaults
 * 
 * Premium Polish manufacturer with 1,170+ products across 50+ material types.
 * Features ReFill eco-spool system, RAL color codes, and extensive TDS documentation.
 * Platform: IdoSell (Polish e-commerce)
 */

// ============================================================================
// TDS URL PATTERNS
// ============================================================================

export const SPECTRUM_TDS_PATTERNS: Record<string, string> = {
  // PLA Family
  'PLA PREMIUM': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PLA_Premium.pdf',
  'PLA PRO': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PLA_Pro.pdf',
  'PLA TOUGH': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PLA_Tough.pdf',
  'PLA MATT': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PLA_Matt.pdf',
  'PLA SILK': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PLA_Silk.pdf',
  'PLA GLITTER': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PLA_Glitter.pdf',
  'PLA GLOW': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PLA_Glow_in_the_Dark.pdf',
  'PLA CARBON': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PLA_Carbon.pdf',
  'PLA STONE AGE': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PLA_Stone_Age.pdf',
  'PLA THERMOACTIVE': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PLA_Thermoactive.pdf',
  'WOOD': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_Wood.pdf',
  'R-PLA': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_r-PLA.pdf',
  
  // PETG Family
  'PETG PREMIUM': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PET-G_Premium.pdf',
  'PET-G PREMIUM': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PET-G_Premium.pdf',
  'PETG MATT': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PET-G_Matt.pdf',
  'PET-G MATT': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PET-G_Matt.pdf',
  'PETG GLITTER': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PET-G_Glitter.pdf',
  'PETG GLOW': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PET-G_Glow_in_the_Dark.pdf',
  'PETG CARBON': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PET-G_Carbon.pdf',
  'PET-G CARBON': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PET-G_Carbon.pdf',
  'PETG V0': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PET-G_V0.pdf',
  'PET-G V0': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PET-G_V0.pdf',
  
  // Styrene Family
  'SMART ABS': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_smart_ABS.pdf',
  'ABS GP450': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_ABS_GP450.pdf',
  'ASA 275': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_ASA_275.pdf',
  'ASA CONDUCTIVE': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_ASA_Conductive.pdf',
  'HIPS-X': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_HIPS-X.pdf',
  
  // Flexible Family
  'S-FLEX 85A': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_S-Flex_85A.pdf',
  'S-FLEX 90A': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_S-Flex_90A.pdf',
  'S-FLEX 98A': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_S-Flex_98A.pdf',
  
  // Engineering Family
  'PA6 LOW WARP': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PA6_Low_Warp.pdf',
  'PA12 CF15': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PA12_CF15.pdf',
  'POLYCARBONATE': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_Polycarbonate.pdf',
  'PC': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_Polycarbonate.pdf',
  'PVB': 'https://shop.spectrumfilaments.com/data/include/cms/download/tds/EN_TDS_Spectrum_PVB.pdf',
};

export function matchSpectrumTds(title: string): { url: string; pattern: string } | null {
  if (!title) return null;
  const normalizedTitle = title.toUpperCase();
  
  // Sort by length to match more specific patterns first
  const sorted = Object.entries(SPECTRUM_TDS_PATTERNS).sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, url] of sorted) {
    if (normalizedTitle.includes(pattern)) {
      return { url, pattern };
    }
  }
  return null;
}

// ============================================================================
// PRINT SETTINGS (from official Spectrum comparison table)
// ============================================================================

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  requiresDryBox?: boolean;
  isAbrasive?: boolean;
}

export const SPECTRUM_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // PLA Family
  'PLA': { nozzleTempMin: 185, nozzleTempMax: 215, bedTempMin: 0, bedTempMax: 45 },
  'PLA PREMIUM': { nozzleTempMin: 185, nozzleTempMax: 215, bedTempMin: 0, bedTempMax: 45 },
  'PLA PRO': { nozzleTempMin: 185, nozzleTempMax: 230, bedTempMin: 0, bedTempMax: 45 },
  'PLA TOUGH': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 0, bedTempMax: 45 },
  'PLA MATT': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 0, bedTempMax: 45 },
  'PLA SILK': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60 },
  'PLA GLITTER': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 20, bedTempMax: 50 },
  'PLA GLOW': { nozzleTempMin: 195, nozzleTempMax: 225, bedTempMin: 20, bedTempMax: 50 },
  'PLA CARBON': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 0, bedTempMax: 45, isAbrasive: true },
  'PLA STONE AGE': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 20, bedTempMax: 50 },
  'PLA THERMOACTIVE': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 20, bedTempMax: 50 },
  'WOOD': { nozzleTempMin: 185, nozzleTempMax: 210, bedTempMin: 20, bedTempMax: 50 },
  'R-PLA': { nozzleTempMin: 185, nozzleTempMax: 215, bedTempMin: 0, bedTempMax: 45 },
  'PLA-CF': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 0, bedTempMax: 45, isAbrasive: true },
  
  // PETG Family
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 255, bedTempMin: 60, bedTempMax: 80 },
  'PETG PREMIUM': { nozzleTempMin: 230, nozzleTempMax: 255, bedTempMin: 60, bedTempMax: 80 },
  'PETG MATT': { nozzleTempMin: 230, nozzleTempMax: 255, bedTempMin: 60, bedTempMax: 80 },
  'PETG GLITTER': { nozzleTempMin: 230, nozzleTempMax: 255, bedTempMin: 60, bedTempMax: 80 },
  'PETG GLOW': { nozzleTempMin: 230, nozzleTempMax: 255, bedTempMin: 60, bedTempMax: 80 },
  'PETG CARBON': { nozzleTempMin: 230, nozzleTempMax: 255, bedTempMin: 60, bedTempMax: 80, isAbrasive: true },
  'PETG V0': { nozzleTempMin: 230, nozzleTempMax: 255, bedTempMin: 60, bedTempMax: 80 },
  'PETG-CF': { nozzleTempMin: 230, nozzleTempMax: 255, bedTempMin: 60, bedTempMax: 80, isAbrasive: true },
  
  // Styrene Family
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 255, bedTempMin: 95, bedTempMax: 110, requiresEnclosure: true },
  'SMART ABS': { nozzleTempMin: 230, nozzleTempMax: 255, bedTempMin: 95, bedTempMax: 110, requiresEnclosure: true },
  'ABS GP450': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 115, requiresEnclosure: true },
  'ASA': { nozzleTempMin: 200, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60, requiresEnclosure: true },
  'ASA 275': { nozzleTempMin: 200, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60, requiresEnclosure: true },
  'ASA CONDUCTIVE': { nozzleTempMin: 200, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60, requiresEnclosure: true },
  'HIPS': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'HIPS-X': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  
  // Flexible Family
  'TPU': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 70, requiresDryBox: true, printSpeedMax: 40 },
  'TPU-85A': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 70, requiresDryBox: true, printSpeedMax: 30 },
  'TPU-90A': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 70, requiresDryBox: true, printSpeedMax: 35 },
  'TPU-98A': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 70, requiresDryBox: true, printSpeedMax: 40 },
  'S-FLEX 85A': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 70, requiresDryBox: true, printSpeedMax: 30 },
  'S-FLEX 90A': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 70, requiresDryBox: true, printSpeedMax: 35 },
  'S-FLEX 98A': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 70, requiresDryBox: true, printSpeedMax: 40 },
  
  // Engineering Family
  'PA': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 85, bedTempMax: 100, requiresEnclosure: true, requiresDryBox: true },
  'PA6': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 85, bedTempMax: 100, requiresEnclosure: true, requiresDryBox: true },
  'PA6 LOW WARP': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 85, bedTempMax: 100, requiresEnclosure: true, requiresDryBox: true },
  'PA12': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true, requiresDryBox: true },
  'PA12-CF': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true, requiresDryBox: true, isAbrasive: true },
  'PA12 CF15': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true, requiresDryBox: true, isAbrasive: true },
  'PC': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 100, bedTempMax: 120, requiresEnclosure: true },
  'POLYCARBONATE': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 100, bedTempMax: 120, requiresEnclosure: true },
  'PVB': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 70 },
};

export function getSpectrumPrintSettings(material: string | null, title?: string): PrintSettings | null {
  if (!material && !title) return null;
  
  // Try exact material match first
  if (material) {
    const upperMaterial = material.toUpperCase();
    if (SPECTRUM_PRINT_SETTINGS[upperMaterial]) {
      return SPECTRUM_PRINT_SETTINGS[upperMaterial];
    }
  }
  
  // Try matching from title
  if (title) {
    const upperTitle = title.toUpperCase();
    const sorted = Object.keys(SPECTRUM_PRINT_SETTINGS).sort((a, b) => b.length - a.length);
    for (const key of sorted) {
      if (upperTitle.includes(key)) {
        return SPECTRUM_PRINT_SETTINGS[key];
      }
    }
  }
  
  // Fallback to base material
  if (material) {
    const baseMaterial = material.split('-')[0].toUpperCase();
    return SPECTRUM_PRINT_SETTINGS[baseMaterial] || null;
  }
  
  return null;
}

// ============================================================================
// FINISH TYPE EXTRACTION
// ============================================================================

export type FinishType = 'Silk' | 'Matte' | 'Glow' | 'Sparkle' | 'Stone' | 'ColorChange' | 'Transparent' | 'Metallic' | 'Standard';

export function extractSpectrumFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  const t = title.toLowerCase();
  
  if (/\bsilk\b/i.test(t)) return 'Silk';
  if (/\bmatt\b|\bmatte\b/i.test(t)) return 'Matte';
  if (/glow\s*in\s*the\s*dark|glow/i.test(t)) return 'Glow';
  if (/\bglitter\b|\bsparkle\b/i.test(t)) return 'Sparkle';
  if (/stone\s*age/i.test(t)) return 'Stone';
  if (/thermoactive/i.test(t)) return 'ColorChange';
  if (/translucent|transparent|clear/i.test(t)) return 'Transparent';
  if (/metallic|metal/i.test(t)) return 'Metallic';
  
  return 'Standard';
}

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

interface MaterialInfo {
  material: string;
  isTough?: boolean;
  isRecycled?: boolean;
  isAbrasive?: boolean;
  isConductive?: boolean;
  isFlameRetardant?: boolean;
  isFoaming?: boolean;
}

export function normalizeSpectrumMaterial(title: string): MaterialInfo {
  if (!title) return { material: 'PLA' };
  const t = title.toLowerCase();
  
  // Engineering materials (check first - most specific)
  if (/pa12\s*cf|pa12-cf/i.test(t)) return { material: 'PA12-CF', isAbrasive: true };
  if (/pa6\s*low\s*warp|pa6/i.test(t)) return { material: 'PA6' };
  if (/pa12/i.test(t)) return { material: 'PA12' };
  if (/polycarbonate|\bpc\b/i.test(t)) return { material: 'PC' };
  if (/\bpvb\b/i.test(t)) return { material: 'PVB' };
  
  // Flexible materials
  if (/s-flex\s*85a|85a/i.test(t)) return { material: 'TPU-85A' };
  if (/s-flex\s*90a|90a/i.test(t)) return { material: 'TPU-90A' };
  if (/s-flex\s*98a|98a/i.test(t)) return { material: 'TPU-98A' };
  if (/s-flex|tpu|flexible/i.test(t)) return { material: 'TPU-95A' };
  
  // Styrene family
  if (/asa\s*conductive/i.test(t)) return { material: 'ASA', isConductive: true };
  if (/asa\s*275|asa/i.test(t)) return { material: 'ASA' };
  if (/abs\s*gp450/i.test(t)) return { material: 'ABS' };
  if (/smart\s*abs|\babs\b/i.test(t)) return { material: 'ABS' };
  if (/hips-x|\bhips\b/i.test(t)) return { material: 'HIPS' };
  
  // PETG variants
  if (/pet-?g\s*carbon|petg\s*carbon/i.test(t)) return { material: 'PETG-CF', isAbrasive: true };
  if (/pet-?g\s*v0|petg\s*v0/i.test(t)) return { material: 'PETG', isFlameRetardant: true };
  if (/pet-?g|petg/i.test(t)) return { material: 'PETG' };
  
  // PLA variants (check after PETG to avoid false matches)
  if (/pla\s*carbon|carbon\s*pla/i.test(t)) return { material: 'PLA-CF', isAbrasive: true };
  if (/\bwood\b/i.test(t)) return { material: 'PLA-Wood' };
  if (/r-pla|recycled\s*pla/i.test(t)) return { material: 'rPLA', isRecycled: true };
  if (/pla\s*pro/i.test(t)) return { material: 'PLA', isTough: true };
  if (/pla\s*tough/i.test(t)) return { material: 'PLA+', isTough: true };
  if (/pla/i.test(t)) return { material: 'PLA' };
  
  return { material: 'PLA' };
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanSpectrumTitle(title: string): string {
  if (!title) return '';
  
  return title
    .replace(/filament\s*spectrum/gi, '')
    .replace(/spectrum\s*filament/gi, '')
    .replace(/\b1\.75\s*mm\b/gi, '')
    .replace(/\b2\.85\s*mm\b/gi, '')
    .replace(/\b250\s*g\b/gi, '')
    .replace(/\b500\s*g\b/gi, '')
    .replace(/\b1\s*kg\b/gi, '')
    .replace(/\b2\s*kg\b/gi, '')
    .replace(/\bral\s*\d+\b/gi, '') // Remove RAL codes from display title
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateSpectrumProductLineId(title: string, material?: string | null): string {
  const matInfo = normalizeSpectrumMaterial(title);
  const mat = material || matInfo.material;
  const finish = extractSpectrumFinishType(title);
  const t = title.toLowerCase();
  
  // Determine line variant
  let lineVariant = 'standard';
  
  // PLA Lines
  if (/pla\s*premium/i.test(t)) lineVariant = 'premium';
  else if (/pla\s*pro/i.test(t)) lineVariant = 'pro';
  else if (/pla\s*tough/i.test(t)) lineVariant = 'tough';
  else if (/stone\s*age/i.test(t)) lineVariant = 'stone-age';
  else if (/thermoactive/i.test(t)) lineVariant = 'thermoactive';
  
  // PETG Lines
  else if (/pet-?g\s*premium/i.test(t)) lineVariant = 'premium';
  else if (/pet-?g\s*v0/i.test(t)) lineVariant = 'v0';
  
  // ABS Lines
  else if (/smart\s*abs/i.test(t)) lineVariant = 'smart';
  else if (/abs\s*gp450/i.test(t)) lineVariant = 'gp450';
  
  // ASA Lines
  else if (/asa\s*275/i.test(t)) lineVariant = '275';
  else if (/asa\s*conductive/i.test(t)) lineVariant = 'conductive';
  
  // TPU Lines
  else if (/s-flex\s*85a|85a/i.test(t)) lineVariant = '85a';
  else if (/s-flex\s*90a|90a/i.test(t)) lineVariant = '90a';
  else if (/s-flex\s*98a|98a/i.test(t)) lineVariant = '98a';
  
  // PA Lines
  else if (/pa6\s*low\s*warp/i.test(t)) lineVariant = 'low-warp';
  else if (/pa12\s*cf15/i.test(t)) lineVariant = 'cf15';
  
  // Apply finish to line ID if not standard
  if (finish !== 'Standard' && lineVariant === 'standard') {
    lineVariant = finish.toLowerCase();
  }
  
  return `spectrum__${mat.toLowerCase().replace(/[^a-z0-9]/g, '-')}__${lineVariant}`;
}

// ============================================================================
// RAL COLOR TO HEX MAPPING
// ============================================================================

export const SPECTRUM_RAL_COLORS: Record<string, string> = {
  // Classic RAL colors used by Spectrum
  'RAL 9005': '0A0A0A', // Deep Black
  'RAL 9003': 'F4F4F4', // Polar White
  'RAL 9016': 'F6F6F6', // Traffic White
  'RAL 9007': '8F8F8F', // Grey Aluminium / Silver Star
  'RAL 9006': 'A5A5A5', // White Aluminium
  'RAL 7016': '293133', // Anthracite Grey
  'RAL 7035': 'C3C7CA', // Light Grey
  'RAL 7011': '52595D', // Iron Grey
  
  // Reds
  'RAL 3020': 'CC0000', // Traffic Red / Bloody Red
  'RAL 3003': '9B111E', // Ruby Red
  'RAL 3004': '6B1C23', // Purple Red
  'RAL 3018': 'D53032', // Strawberry Red
  
  // Blues
  'RAL 5015': '2271B3', // Sky Blue / Pacific Blue
  'RAL 5002': '003399', // Ultramarine Blue
  'RAL 5003': '1D1E33', // Sapphire Blue
  'RAL 5010': '0E4780', // Gentian Blue
  'RAL 5012': '3481B8', // Light Blue
  'RAL 5017': '063971', // Traffic Blue
  
  // Greens
  'RAL 6018': '57A639', // Yellow Green / Lime Green
  'RAL 6024': '308446', // Traffic Green
  'RAL 6029': '20603D', // Mint Green
  'RAL 6005': '0F4336', // Moss Green
  'RAL 6038': '00BB2D', // Luminous Green
  
  // Oranges & Yellows
  'RAL 2011': 'EC7C25', // Deep Orange / Lion Orange
  'RAL 2004': 'E25303', // Pure Orange
  'RAL 2003': 'F67828', // Pastel Orange
  'RAL 1018': 'F8E300', // Zinc Yellow / Bahama Yellow
  'RAL 1023': 'FAD201', // Traffic Yellow
  'RAL 1003': 'F5A300', // Signal Yellow
  'RAL 1016': 'EAE600', // Sulfur Yellow
  
  // Purples & Pinks
  'RAL 4006': '903373', // Traffic Purple
  'RAL 4008': '844C82', // Signal Violet
  'RAL 4010': 'C63678', // Telemagenta
  'RAL 3015': 'E8A3B2', // Light Pink
  
  // Browns & Beiges
  'RAL 8017': '3D2B1F', // Chocolate Brown
  'RAL 8003': '7A5230', // Clay Brown
  'RAL 1001': 'D0B592', // Beige
  'RAL 1011': 'AF8050', // Brown Beige
  'RAL 1015': 'E6D2B5', // Light Ivory
};

// Named colors used by Spectrum
export const SPECTRUM_COLOR_MAPPING: Record<string, string> = {
  // Blacks & Whites
  'deep black': '0A0A0A',
  'polar white': 'F4F4F4',
  'signal white': 'FFFFFF',
  'traffic white': 'F6F6F6',
  'silver star': '8F8F8F',
  'grey aluminium': '8F8F8F',
  'dark grey': '3D3D3D',
  'anthracite grey': '293133',
  'light grey': 'C3C7CA',
  'iron grey': '52595D',
  
  // Reds
  'bloody red': 'CC0000',
  'traffic red': 'CC0000',
  'ruby red': '9B111E',
  'wine red': '6B1C23',
  'dragon red': 'B22222',
  'strawberry red': 'D53032',
  
  // Blues
  'pacific blue': '2271B3',
  'sky blue': '2271B3',
  'navy blue': '003399',
  'sapphire blue': '1D1E33',
  'ocean blue': '0E4780',
  'light blue': '3481B8',
  'traffic blue': '063971',
  'royal blue': '002366',
  
  // Greens
  'lime green': '57A639',
  'yellow green': '57A639',
  'traffic green': '308446',
  'mint green': '20603D',
  'moss green': '0F4336',
  'forest green': '228B22',
  'luminous green': '00BB2D',
  
  // Oranges & Yellows
  'lion orange': 'EC7C25',
  'pure orange': 'E25303',
  'pastel orange': 'F67828',
  'bahama yellow': 'F8E300',
  'traffic yellow': 'FAD201',
  'signal yellow': 'F5A300',
  'sulfur yellow': 'EAE600',
  'gold': 'FFD700',
  
  // Purples & Pinks
  'traffic purple': '903373',
  'signal violet': '844C82',
  'telemagenta': 'C63678',
  'pink': 'E8A3B2',
  'light pink': 'E8A3B2',
  'magenta': 'FF00FF',
  'violet': '8B00FF',
  
  // Browns & Beiges
  'chocolate brown': '3D2B1F',
  'clay brown': '7A5230',
  'beige': 'D0B592',
  'brown beige': 'AF8050',
  'light ivory': 'E6D2B5',
  'bronze': 'CD7F32',
  
  // Specialty Colors
  'transparent': 'FFFFFF',
  'natural': 'F5F5DC',
  'crystal': 'E0E0E0',
  'copper': 'B87333',
};

export function getSpectrumColorHex(colorName: string, title?: string): string | null {
  if (!colorName && !title) return null;
  
  const searchText = (colorName || '') + ' ' + (title || '');
  const lower = searchText.toLowerCase();
  
  // Check for RAL code first
  const ralMatch = searchText.match(/ral\s*(\d{4})/i);
  if (ralMatch) {
    const ralCode = `RAL ${ralMatch[1]}`;
    if (SPECTRUM_RAL_COLORS[ralCode]) {
      return SPECTRUM_RAL_COLORS[ralCode];
    }
  }
  
  // Check named colors
  for (const [name, hex] of Object.entries(SPECTRUM_COLOR_MAPPING)) {
    if (lower.includes(name)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// REFILL DETECTION
// ============================================================================

export function isSpectrumRefill(title: string): boolean {
  return /\brefill\b/i.test(title);
}

// ============================================================================
// WEIGHT & DIAMETER EXTRACTION
// ============================================================================

export function extractSpectrumWeight(title: string): number {
  const match = title.match(/(\d+(?:\.\d+)?)\s*(?:kg|g)/i);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = title.toLowerCase().includes('kg') ? 'kg' : 'g';
    return unit === 'kg' ? value * 1000 : value;
  }
  return 1000; // Default 1kg
}

export function extractSpectrumDiameter(title: string): number {
  if (/2\.85\s*mm/i.test(title)) return 2.85;
  if (/3\s*mm/i.test(title) && !/1\.75/i.test(title)) return 2.85;
  return 1.75; // Default
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface SpectrumEnrichmentResult {
  tdsUrl: string | null;
  finishType: FinishType;
  material: string;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  printSpeedMax: number | null;
  productLineId: string;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
  requiresDryBox: boolean;
  isConductive: boolean;
  isFlameRetardant: boolean;
  isRecycled: boolean;
  isTough: boolean;
  isRefill: boolean;
  colorHex: string | null;
  netWeightG: number;
  diameterMm: number;
  cleanedTitle: string;
  spoolMaterial: string | null;
}

export function enrichSpectrumProduct(
  title: string,
  colorName?: string | null,
  existingMaterial?: string | null
): SpectrumEnrichmentResult {
  const matInfo = normalizeSpectrumMaterial(title);
  const material = existingMaterial || matInfo.material;
  const settings = getSpectrumPrintSettings(material, title);
  const tds = matchSpectrumTds(title);
  const isRefill = isSpectrumRefill(title);
  
  return {
    tdsUrl: tds?.url || null,
    finishType: extractSpectrumFinishType(title),
    material,
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    printSpeedMax: settings?.printSpeedMax || null,
    productLineId: generateSpectrumProductLineId(title, material),
    isAbrasive: matInfo.isAbrasive || settings?.isAbrasive || false,
    requiresEnclosure: settings?.requiresEnclosure || false,
    requiresDryBox: settings?.requiresDryBox || false,
    isConductive: matInfo.isConductive || false,
    isFlameRetardant: matInfo.isFlameRetardant || false,
    isRecycled: matInfo.isRecycled || false,
    isTough: matInfo.isTough || false,
    isRefill,
    colorHex: getSpectrumColorHex(colorName || '', title),
    netWeightG: extractSpectrumWeight(title),
    diameterMm: extractSpectrumDiameter(title),
    cleanedTitle: cleanSpectrumTitle(title),
    spoolMaterial: isRefill ? 'cardboard' : null,
  };
}
