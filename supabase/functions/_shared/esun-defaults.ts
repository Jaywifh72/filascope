/**
 * eSun Brand-Specific Defaults and Utilities
 * 
 * Handles:
 * - Material normalization (ePLA → PLA, etc.)
 * - Print setting lookups
 * - Finish type extraction (Silk Magic, Luminous, Chameleon, etc.)
 * - Title cleaning
 * - Product line ID generation
 * - Color hex mapping
 */

// ============================================================================
// TDS URL PATTERNS
// ============================================================================

export const ESUN_TDS_PATTERNS: Record<string, string> = {
  'pla+': 'https://www.esun3d.com/uploads/eSUN_PLA+-Filament_TDS_V4.0.pdf',
  'pla': 'https://www.esun3d.com/uploads/eSUN_PLA-Basic_TDS_V1.0.pdf',
  'pla-basic': 'https://www.esun3d.com/uploads/eSUN_PLA-Basic_TDS_V1.0.pdf',
  'pla-matte': 'https://www.esun3d.com/uploads/eSUN_ePLA-Matte_TDS_V1.0.pdf',
  'pla-silk': 'https://www.esun3d.com/uploads/eSUN_ePLA-Silk_TDS_V1.0.pdf',
  'pla-lw': 'https://www.esun3d.com/uploads/eSUN_ePLA-LW_TDS_V1.0.pdf',
  'pla-st': 'https://www.esun3d.com/uploads/eSUN_ePLA-ST_TDS_V1.0.pdf',
  'pla-cf': 'https://www.esun3d.com/uploads/eSUN_ePLA-CF_TDS_V1.0.pdf',
  'pla+hs': 'https://www.esun3d.com/uploads/eSUN_PLA+HS_TDS_V1.0.pdf',
  'petg': 'https://www.esun3d.com/uploads/eSUN_PETG_TDS_V4.0.pdf',
  'petg-cf': 'https://www.esun3d.com/uploads/eSUN_ePETG-CF_TDS_V1.0.pdf',
  'petg+hs': 'https://www.esun3d.com/uploads/eSUN_ePETG-HS_TDS_V1.0.pdf',
  'petg-esd': 'https://www.esun3d.com/uploads/eSUN_PETG-ESD_TDS_V1.0.pdf',
  'abs+': 'https://www.esun3d.com/uploads/eSUN_ABS+_TDS_V4.0.pdf',
  'abs-cf': 'https://www.esun3d.com/uploads/eSUN_eABS-CF_TDS_V1.0.pdf',
  'abs+hs': 'https://www.esun3d.com/uploads/eSUN_eABS-HS_TDS_V1.0.pdf',
  'asa+': 'https://www.esun3d.com/uploads/eSUN_eASA_TDS_V1.0.pdf',
  'tpu-95a': 'https://www.esun3d.com/uploads/eSUN_eTPU-95A_TDS_V4.0.pdf',
  'tpu-83a': 'https://www.esun3d.com/uploads/eSUN_eTPE-83A_TDS_V1.0.pdf',
  'tpu-lw': 'https://www.esun3d.com/uploads/eSUN_eTPU-LW_TDS_V1.0.pdf',
  'pa': 'https://www.esun3d.com/uploads/eSUN_ePA_TDS_V1.0.pdf',
  'pa-cf': 'https://www.esun3d.com/uploads/eSUN_ePA-CF_TDS_V1.0.pdf',
  'pa12-cf': 'https://www.esun3d.com/uploads/eSUN_ePA12-CF_TDS_V1.0.pdf',
  'paht-cf': 'https://www.esun3d.com/uploads/eSUN_ePAHT-CF_TDS_V1.0.pdf',
  'pc': 'https://www.esun3d.com/uploads/eSUN_ePC_TDS_V1.0.pdf',
  'pva': 'https://www.esun3d.com/uploads/eSUN_ePVA_TDS_V1.0.pdf',
  'hips': 'https://www.esun3d.com/uploads/eSUN_HIPS_TDS_V1.0.pdf',
};

export function matchEsunTds(title: string): { url: string; pattern: string } | null {
  const lowerTitle = title.toLowerCase();
  
  // Try specific matches first
  const patterns = Object.keys(ESUN_TDS_PATTERNS).sort((a, b) => b.length - a.length);
  
  for (const pattern of patterns) {
    if (lowerTitle.includes(pattern.replace(/-/g, ' ')) || 
        lowerTitle.includes(pattern) ||
        lowerTitle.includes(pattern.replace(/-/g, ''))) {
      return { url: ESUN_TDS_PATTERNS[pattern], pattern };
    }
  }
  
  return null;
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
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
}

export const ESUN_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Standard PLA
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 65 },
  'PLA+': { nozzleTempMin: 205, nozzleTempMax: 225, bedTempMin: 50, bedTempMax: 65 },
  'PLA+HS': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 65, printSpeedMax: 500 },
  'PLA-Matte': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 65 },
  'PLA-Silk': { nozzleTempMin: 195, nozzleTempMax: 225, bedTempMin: 50, bedTempMax: 65 },
  'PLA-LW': { nozzleTempMin: 220, nozzleTempMax: 260, bedTempMin: 45, bedTempMax: 60 },
  'PLA-ST': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 70 },
  'PLA-Glow': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 65 },
  
  // PETG variants
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 80 },
  'PETG+': { nozzleTempMin: 235, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 85, printSpeedMax: 500 },
  'PETG-Matte': { nozzleTempMin: 230, nozzleTempMax: 255, bedTempMin: 70, bedTempMax: 85 },
  'PETG-CF': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 85, isAbrasive: true },
  'PETG-ESD': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 85, isAbrasive: true },
  
  // ABS/ASA
  'ABS+': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 95, bedTempMax: 110, requiresEnclosure: true },
  'ABS+HS': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 95, bedTempMax: 110, printSpeedMax: 300, requiresEnclosure: true },
  'ABS-CF': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 95, bedTempMax: 110, isAbrasive: true, requiresEnclosure: true },
  'ASA': { nozzleTempMin: 235, nozzleTempMax: 255, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  
  // Flex
  'TPU-95A': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60 },
  'TPU-83A': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 30, bedTempMax: 50 },
  'TPU-LW': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60 },
  
  // Engineering
  'PA': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 90 },
  'PA-CF': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 70, bedTempMax: 90, isAbrasive: true },
  'PA12-CF': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 70, bedTempMax: 90, isAbrasive: true },
  'PAHT-CF': { nozzleTempMin: 280, nozzleTempMax: 310, bedTempMin: 80, bedTempMax: 100, isAbrasive: true, requiresEnclosure: true },
  'PC': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 100, bedTempMax: 120, requiresEnclosure: true },
  
  // Composites
  'PLA-CF': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 45, bedTempMax: 65, isAbrasive: true },
  'PLA-Wood': { nozzleTempMin: 180, nozzleTempMax: 220, bedTempMin: 45, bedTempMax: 60 },
  'PLA-Metal': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 65 },
  'PLA-Marble': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 65 },
  
  // Support materials
  'PVA': { nozzleTempMin: 180, nozzleTempMax: 210, bedTempMin: 45, bedTempMax: 60 },
  'HIPS': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110 },
};

export function getEsunPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  
  const normalized = material.toUpperCase().replace(/\s+/g, '-');
  
  // Direct match
  if (ESUN_PRINT_SETTINGS[normalized]) {
    return ESUN_PRINT_SETTINGS[normalized];
  }
  
  // Partial match
  for (const [key, settings] of Object.entries(ESUN_PRINT_SETTINGS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return settings;
    }
  }
  
  return null;
}

// ============================================================================
// FINISH TYPE EXTRACTION
// ============================================================================

type FinishType = 'Standard' | 'Silk' | 'Matte' | 'Glow' | 'Sparkle' | 'Rainbow' | 
  'MultiColor' | 'Metallic' | 'Marble' | 'Wood' | 'Metal' | 'Texture' | 'ColorShift' | 'UV';

const ESUN_FINISH_PATTERNS: Array<{ pattern: RegExp; finish: FinishType }> = [
  { pattern: /\bsilk\s*magic\b/i, finish: 'MultiColor' },
  { pattern: /\bsilk\s*candy\b/i, finish: 'Silk' },
  { pattern: /\bsilk\s*metal\b/i, finish: 'Metallic' },
  { pattern: /\bsilk\s*rainbow\b/i, finish: 'Rainbow' },
  { pattern: /\bsilk\b/i, finish: 'Silk' },
  { pattern: /\bmatte\b/i, finish: 'Matte' },
  { pattern: /\bluminous\s*rainbow\b/i, finish: 'Glow' },
  { pattern: /\bluminous\b/i, finish: 'Glow' },
  { pattern: /\bstars?\b/i, finish: 'Sparkle' },
  { pattern: /\bsparkl/i, finish: 'Sparkle' },
  { pattern: /\brock\b/i, finish: 'Texture' },
  { pattern: /\bchameleon\b/i, finish: 'ColorShift' },
  { pattern: /\buv\s*color\s*change\b/i, finish: 'UV' },
  { pattern: /\bmagic\b/i, finish: 'MultiColor' },
  { pattern: /\bmarble\b/i, finish: 'Marble' },
  { pattern: /\bwood\b/i, finish: 'Wood' },
  { pattern: /\bmetal(?:lic)?\b/i, finish: 'Metallic' },
  { pattern: /\bglow(?:\s*in\s*the\s*dark)?\b/i, finish: 'Glow' },
  { pattern: /\brainbow\b/i, finish: 'Rainbow' },
];

export function extractEsunFinishType(title: string): FinishType {
  for (const { pattern, finish } of ESUN_FINISH_PATTERNS) {
    if (pattern.test(title)) {
      return finish;
    }
  }
  return 'Standard';
}

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export const ESUN_MATERIAL_MAPPING: Record<string, string> = {
  // PLA variants
  'pla+': 'PLA+',
  'pla pro': 'PLA+',
  'pla plus': 'PLA+',
  'pla-basic': 'PLA',
  'pla basic': 'PLA',
  'epla': 'PLA',
  'epla+': 'PLA+',
  'epla-matte': 'PLA',
  'epla-silk': 'PLA',
  'pla-silk': 'PLA',
  'pla-matte': 'PLA',
  'pla-silk magic': 'PLA',
  'pla-silk candy': 'PLA',
  'pla-silk rainbow': 'PLA',
  'pla-silk metal': 'PLA',
  'pla silk': 'PLA',
  'silk pla': 'PLA',
  'matte pla': 'PLA',
  'pla-luminous': 'PLA-Glow',
  'pla-luminous rainbow': 'PLA-Glow',
  'pla luminous': 'PLA-Glow',
  'pla-lw': 'PLA-LW',
  'pla lw': 'PLA-LW',
  'pla lightweight': 'PLA-LW',
  'pla-st': 'PLA-ST',
  'pla st': 'PLA-ST',
  'pla super tough': 'PLA-ST',
  'pla-lite': 'PLA-Lite',
  'pla lite': 'PLA-Lite',
  'pla-wood': 'PLA-Wood',
  'pla wood': 'PLA-Wood',
  'wood pla': 'PLA-Wood',
  'pla-metal': 'PLA-Metal',
  'pla metal': 'PLA-Metal',
  'pla-marble': 'PLA-Marble',
  'pla marble': 'PLA-Marble',
  'pla-stars': 'PLA',
  'pla stars': 'PLA',
  'pla-rock': 'PLA',
  'pla rock': 'PLA',
  'pla-magic': 'PLA',
  'pla magic': 'PLA',
  'pla-chameleon': 'PLA',
  'pla chameleon': 'PLA',
  'pla-uv': 'PLA',
  'pla uv color change': 'PLA',
  'pla-cf': 'PLA-CF',
  'pla cf': 'PLA-CF',
  'epla-cf': 'PLA-CF',
  'pla+hs': 'PLA+',
  'pla+ hs': 'PLA+',
  'epla+hs': 'PLA+',
  
  // PETG variants
  'petg': 'PETG',
  'petg-basic': 'PETG',
  'petg basic': 'PETG',
  'epetg': 'PETG',
  'petg-matte': 'PETG',
  'petg matte': 'PETG',
  'petg-cf': 'PETG-CF',
  'petg cf': 'PETG-CF',
  'epetg-cf': 'PETG-CF',
  'petg-esd': 'PETG-ESD',
  'petg esd': 'PETG-ESD',
  'petg+hs': 'PETG+',
  'petg+ hs': 'PETG+',
  'epetg-hs': 'PETG+',
  'epetg+hs': 'PETG+',
  
  // ABS/ASA
  'abs+': 'ABS+',
  'abs plus': 'ABS+',
  'eabs': 'ABS+',
  'eabs+': 'ABS+',
  'abs-cf': 'ABS-CF',
  'abs cf': 'ABS-CF',
  'eabs-cf': 'ABS-CF',
  'abs+hs': 'ABS+',
  'abs+ hs': 'ABS+',
  'eabs-pro-hs': 'ABS+',
  'asa+': 'ASA',
  'asa': 'ASA',
  'easa': 'ASA',
  
  // Flex
  'tpu-95a': 'TPU-95A',
  'tpu 95a': 'TPU-95A',
  'etpu-95a': 'TPU-95A',
  'tpu': 'TPU-95A',
  'tpe-83a': 'TPU-83A',
  'tpe 83a': 'TPU-83A',
  'etpe-83a': 'TPU-83A',
  'tpu-lw': 'TPU-LW',
  'tpu lw': 'TPU-LW',
  'etpu-lw': 'TPU-LW',
  
  // Engineering
  'pa': 'PA',
  'nylon': 'PA',
  'epa': 'PA',
  'pa-cf': 'PA-CF',
  'pa cf': 'PA-CF',
  'epa-cf': 'PA-CF',
  'pa12-cf': 'PA12-CF',
  'pa12 cf': 'PA12-CF',
  'epa12-cf': 'PA12-CF',
  'paht-cf': 'PAHT-CF',
  'paht cf': 'PAHT-CF',
  'epaht-cf': 'PAHT-CF',
  'pc': 'PC',
  'epc': 'PC',
  'polycarbonate': 'PC',
  
  // Support
  'pva': 'PVA',
  'epva': 'PVA',
  'hips': 'HIPS',
  
  // PET
  'pet': 'PET',
  'epet': 'PET',
};

export function normalizeEsunMaterial(title: string): string | null {
  const lowerTitle = title.toLowerCase()
    .replace(/filament/gi, '')
    .replace(/1\.75\s*mm/gi, '')
    .replace(/2\.85\s*mm/gi, '')
    .replace(/3\.0\s*mm/gi, '')
    .trim();
  
  // Check for high-speed variants first
  if (/\bhs\b|high[\s-]*speed/i.test(title)) {
    if (/pla\+/i.test(title) || /pla\s*plus/i.test(title)) return 'PLA+';
    if (/petg/i.test(title)) return 'PETG+';
    if (/abs/i.test(title)) return 'ABS+';
    if (/asa/i.test(title)) return 'ASA';
  }
  
  // Direct mapping lookup
  for (const [pattern, material] of Object.entries(ESUN_MATERIAL_MAPPING)) {
    if (lowerTitle.includes(pattern)) {
      return material;
    }
  }
  
  // Fallback pattern matching
  if (/pla\+|pla\s*plus|pla\s*pro/i.test(title)) return 'PLA+';
  if (/petg.*cf|cf.*petg/i.test(title)) return 'PETG-CF';
  if (/pla.*cf|cf.*pla/i.test(title)) return 'PLA-CF';
  if (/abs.*cf|cf.*abs/i.test(title)) return 'ABS-CF';
  if (/pa.*cf|cf.*pa|nylon.*cf/i.test(title)) return 'PA-CF';
  if (/petg/i.test(title)) return 'PETG';
  if (/pla/i.test(title)) return 'PLA';
  if (/abs/i.test(title)) return 'ABS+';
  if (/asa/i.test(title)) return 'ASA';
  if (/tpu|tpe/i.test(title)) return 'TPU-95A';
  if (/\bpa\b|nylon/i.test(title)) return 'PA';
  if (/\bpc\b|polycarbonate/i.test(title)) return 'PC';
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

const ESUN_TITLE_NOISE: RegExp[] = [
  /\besun\b\s*/gi,
  /\b1\.75\s*mm\b/gi,
  /\b2\.85\s*mm\b/gi,
  /\b3d\s*(?:printer\s*)?filament\b/gi,
  /\bfilament\b/gi,
  /\b1\s*kg\b/gi,
  /\b0\.75\s*kg\b/gi,
  /\b3\s*kg\s*spool\b/gi,
  /\b10\s*rolls?\b/gi,
  /\b4\s*pcs?\b/gi,
  /\brefilament\b/gi,
  /\bespooln\+?\b/gi,
  /\bcmyk\s*bundle\b/gi,
  /\bdimensional\s*accuracy[^,]*/gi,
  /±\s*0\.0[35]\s*mm/gi,
  /\b2\.2\s*lbs?\b/gi,
  /\(us\s*only\)/gi,
  /\(eu\s*only\)/gi,
  /\bfree\s*shipping\b/gi,
];

const ESUN_PROMOTIONAL_PATTERNS: RegExp[] = [
  /\bbundle\b/gi,
  /\bcmyk\b/gi,
  /\b10\s*rolls?\b/gi,
  /\b3\s*kg\b/gi,
  /\bsample\s*pack\b/gi,
  /\bstarter\s*kit\b/gi,
];

export function cleanEsunTitle(title: string): string {
  let cleaned = title;
  
  for (const pattern of ESUN_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  
  // Clean up extra whitespace and punctuation
  cleaned = cleaned
    .replace(/\s*[-–—]\s*$/, '')
    .replace(/\s*[,;|:]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
}

export function isEsunPromotionalProduct(title: string): boolean {
  return ESUN_PROMOTIONAL_PATTERNS.some(pattern => pattern.test(title));
}

export function isEsunRefilament(title: string): boolean {
  return /refilament/i.test(title);
}

export function isEsunHighSpeed(title: string): boolean {
  return /\bhs\b|high[\s-]*speed/i.test(title);
}

export function getEsunPackQuantity(title: string): number {
  const rollMatch = title.match(/(\d+)\s*rolls?/i);
  if (rollMatch) return parseInt(rollMatch[1], 10);
  
  const pcsMatch = title.match(/(\d+)\s*pcs?/i);
  if (pcsMatch) return parseInt(pcsMatch[1], 10);
  
  const kgMatch = title.match(/(\d+)\s*kg\s*spool/i);
  if (kgMatch) return parseInt(kgMatch[1], 10);
  
  return 1;
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateEsunProductLineId(title: string, material?: string | null): string {
  const baseMaterial = material || normalizeEsunMaterial(title) || 'unknown';
  const finishType = extractEsunFinishType(title);
  const isHighSpeed = isEsunHighSpeed(title);
  const isRefilament = isEsunRefilament(title);
  const packQty = getEsunPackQuantity(title);
  
  let lineId = `esun__${baseMaterial.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  
  // Add finish type suffix
  if (finishType !== 'Standard') {
    const finishSuffix = finishType.toLowerCase().replace(/\s+/g, '-');
    
    // Check for specific silk variants
    if (/silk\s*magic/i.test(title)) {
      lineId += '__silk-magic';
    } else if (/silk\s*candy/i.test(title)) {
      lineId += '__silk-candy';
    } else if (/silk\s*metal/i.test(title)) {
      lineId += '__silk-metal';
    } else if (/silk\s*rainbow/i.test(title)) {
      lineId += '__silk-rainbow';
    } else if (/luminous\s*rainbow/i.test(title)) {
      lineId += '__luminous-rainbow';
    } else {
      lineId += `__${finishSuffix}`;
    }
  } else if (isHighSpeed) {
    lineId += '__high-speed';
  } else if (isRefilament) {
    lineId += '__refilament';
  } else {
    lineId += '__standard';
  }
  
  // Add pack size suffix for bundles
  if (packQty > 1) {
    lineId += `_${packQty}pack`;
  }
  
  // Check for 3kg spool
  if (/3\s*kg\s*spool/i.test(title)) {
    lineId = lineId.replace(/__standard$/, '__3kg');
  }
  
  return lineId;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const ESUN_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'black': '1A1A1A',
  'solid black': '0A0A0A',
  'white': 'FFFFFF',
  'solid white': 'FFFFFF',
  'cold white': 'F8F8FF',
  'warm white': 'FAF0E6',
  'bone white': 'F9F2E7',
  'natural': 'F5E6D3',
  
  // Grays
  'grey': '808080',
  'gray': '808080',
  'light grey': 'D3D3D3',
  'light gray': 'D3D3D3',
  'dark grey': '404040',
  'dark gray': '404040',
  'silver': 'C0C0C0',
  
  // Reds
  'red': 'DC143C',
  'fire engine red': 'CE2029',
  'wine red': '722F37',
  'magenta': 'FF00FF',
  'pink': 'FFC0CB',
  'orange': 'FF6600',
  
  // Yellows
  'yellow': 'FFD700',
  'gold': 'FFD700',
  'lemon yellow': 'FFF44F',
  
  // Greens
  'green': '228B22',
  'peak green': '228B22',
  'pine green': '2A6139',
  'olive green': '808000',
  'grass green': '7CFC00',
  
  // Blues
  'blue': '0066CC',
  'dark blue': '00008B',
  'light blue': 'ADD8E6',
  'water blue': '00BFFF',
  'sky blue': '87CEEB',
  'cyan': '00FFFF',
  
  // Purples
  'purple': '800080',
  'violet': 'EE82EE',
  
  // Browns
  'brown': '8B4513',
  'chocolate': 'D2691E',
  
  // Silk variants
  'silk gold': 'FFD700',
  'silk silver': 'C0C0C0',
  'silk bronze': 'CD7F32',
  'silk copper': 'B87333',
  'silk rose gold': 'B76E79',
  
  // Luminous/Glow
  'luminous green': '39FF14',
  'luminous blue': '00FFFF',
  'luminous orange': 'FF6600',
  
  // Composite colors
  'carbon black': '1A1A1A',
  'wood brown': 'DEB887',
};

export function getEsunColorHex(colorName: string): string | null {
  const lowerColor = colorName.toLowerCase().trim();
  
  // Direct match
  if (ESUN_COLOR_MAPPING[lowerColor]) {
    return ESUN_COLOR_MAPPING[lowerColor];
  }
  
  // Partial match
  for (const [name, hex] of Object.entries(ESUN_COLOR_MAPPING)) {
    if (lowerColor.includes(name) || name.includes(lowerColor)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface EsunEnrichmentResult {
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
  isHighSpeed: boolean;
  isRefilament: boolean;
  tdsUrl: string | null;
  cleanedTitle: string;
}

export function enrichEsunProduct(
  title: string,
  existingMaterial?: string | null,
  existingTdsUrl?: string | null
): EsunEnrichmentResult {
  const material = existingMaterial || normalizeEsunMaterial(title);
  const finishType = extractEsunFinishType(title);
  const productLineId = generateEsunProductLineId(title, material);
  const printSettings = getEsunPrintSettings(material);
  const tdsMatch = matchEsunTds(title);
  
  return {
    material,
    finishType,
    productLineId,
    nozzleTempMin: printSettings?.nozzleTempMin || null,
    nozzleTempMax: printSettings?.nozzleTempMax || null,
    bedTempMin: printSettings?.bedTempMin || null,
    bedTempMax: printSettings?.bedTempMax || null,
    printSpeedMax: printSettings?.printSpeedMax || null,
    isAbrasive: printSettings?.isAbrasive || false,
    requiresEnclosure: printSettings?.requiresEnclosure || false,
    isHighSpeed: isEsunHighSpeed(title),
    isRefilament: isEsunRefilament(title),
    tdsUrl: existingTdsUrl || tdsMatch?.url || null,
    cleanedTitle: cleanEsunTitle(title),
  };
}
