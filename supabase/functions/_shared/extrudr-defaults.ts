/**
 * Extrudr Brand-Specific Defaults
 * Premium Austrian filament manufacturer - eco-friendly cardboard spools
 * Platform: Custom Next.js (requires Firecrawl HTML scraping)
 */

// ============================================================================
// PRODUCT LINE DEFINITIONS
// ============================================================================

export const EXTRUDR_PRODUCT_LINES = {
  // PLA Family
  'pla-basic': { material: 'PLA', finish: 'Standard', lineId: 'extrudr-pla-basic' },
  'pla-nx2': { material: 'PLA', finish: 'Matte', lineId: 'extrudr-pla-nx2-matt' },
  'pla-cmyk': { material: 'PLA', finish: 'Standard', lineId: 'extrudr-pla-cmyk' },
  
  // Bio-Based Line
  'biofusion': { material: 'PLA', finish: 'Silk', lineId: 'extrudr-biofusion' },
  'greentec': { material: 'BIO', finish: 'Standard', lineId: 'extrudr-greentec' },
  'greentec-pro': { material: 'BIO', finish: 'Standard', lineId: 'extrudr-greentec-pro' },
  'greentec-pro-carbon': { material: 'BIO-CF', finish: 'Standard', lineId: 'extrudr-greentec-pro-carbon', isAbrasive: true },
  'flax': { material: 'PLA-WOOD', finish: 'Wood', lineId: 'extrudr-flax' },
  
  // PETG Family
  'petg': { material: 'PETG', finish: 'Standard', lineId: 'extrudr-petg' },
  'pctg': { material: 'PCTG', finish: 'Standard', lineId: 'extrudr-pctg' },
  'xpetg': { material: 'PETG', finish: 'Standard', lineId: 'extrudr-xpetg' },
  'xpetg-cf': { material: 'PETG-CF', finish: 'Standard', lineId: 'extrudr-xpetg-cf', isAbrasive: true },
  
  // DuraPro Engineering Series
  'durapro-abs': { material: 'ABS', finish: 'Standard', lineId: 'extrudr-durapro-abs', enclosure: true },
  'durapro-abs-cf': { material: 'ABS-CF', finish: 'Standard', lineId: 'extrudr-durapro-abs-cf', isAbrasive: true, enclosure: true },
  'durapro-asa': { material: 'ASA', finish: 'Standard', lineId: 'extrudr-durapro-asa', enclosure: true },
  'durapro-asa-cf': { material: 'ASA-CF', finish: 'Standard', lineId: 'extrudr-durapro-asa-cf', isAbrasive: true, enclosure: true },
  'durapro-asa-gf': { material: 'ASA-GF', finish: 'Standard', lineId: 'extrudr-durapro-asa-gf', isAbrasive: true, enclosure: true },
  'durapro-pa12': { material: 'PA12', finish: 'Standard', lineId: 'extrudr-durapro-pa12', enclosure: true },
  'durapro-pc-pbt': { material: 'PC-PBT', finish: 'Standard', lineId: 'extrudr-durapro-pc-pbt', enclosure: true },
  'durapro-pc-pbt-cf': { material: 'PC-PBT-CF', finish: 'Standard', lineId: 'extrudr-durapro-pc-pbt-cf', isAbrasive: true, enclosure: true },
  
  // FLEX TPU Series (Shore Hardness Grades)
  'flex-semisoft': { material: 'TPU-88A', finish: 'Standard', lineId: 'extrudr-flex-semisoft' },
  'flex-medium': { material: 'TPU-92A', finish: 'Standard', lineId: 'extrudr-flex-medium' },
  'flex-medium-esd': { material: 'TPU-92A', finish: 'Standard', lineId: 'extrudr-flex-medium-esd', isConductive: true },
  'flex-hard': { material: 'TPU-98A', finish: 'Standard', lineId: 'extrudr-flex-hard' },
  'flex-hard-cf': { material: 'TPU-CF', finish: 'Standard', lineId: 'extrudr-flex-hard-cf', isAbrasive: true },
  
  // Specialty
  'pearl': { material: 'PLA', finish: 'Shimmer', lineId: 'extrudr-pearl' },
  'wood': { material: 'PLA-WOOD', finish: 'Wood', lineId: 'extrudr-wood' },
} as const;

// ============================================================================
// TDS URL PATTERNS
// ============================================================================

export const EXTRUDR_TDS_URLS: Record<string, string> = {
  'PLA': 'https://www.extrudr.com/media/tds/pla_nx2_tds_en.pdf',
  'PLA-BASIC': 'https://www.extrudr.com/media/tds/pla_basic_tds_en.pdf',
  'BIOFUSION': 'https://www.extrudr.com/media/tds/biofusion_tds_en.pdf',
  'GREENTEC': 'https://www.extrudr.com/media/tds/greentec_tds_en.pdf',
  'GREENTEC-PRO': 'https://www.extrudr.com/media/tds/greentec_pro_tds_en.pdf',
  'GREENTEC-PRO-CARBON': 'https://www.extrudr.com/media/tds/greentec_pro_carbon_tds_en.pdf',
  'FLAX': 'https://www.extrudr.com/media/tds/flax_tds_en.pdf',
  'PETG': 'https://www.extrudr.com/media/tds/petg_tds_en.pdf',
  'PCTG': 'https://www.extrudr.com/media/tds/pctg_tds_en.pdf',
  'XPETG': 'https://www.extrudr.com/media/tds/xpetg_tds_en.pdf',
  'XPETG-CF': 'https://www.extrudr.com/media/tds/xpetg_cf_tds_en.pdf',
  'ABS': 'https://www.extrudr.com/media/tds/durapro_abs_tds_en.pdf',
  'ABS-CF': 'https://www.extrudr.com/media/tds/durapro_abs_cf_tds_en.pdf',
  'ASA': 'https://www.extrudr.com/media/tds/durapro_asa_tds_en.pdf',
  'ASA-CF': 'https://www.extrudr.com/media/tds/durapro_asa_cf_tds_en.pdf',
  'ASA-GF': 'https://www.extrudr.com/media/tds/durapro_asa_gf_tds_en.pdf',
  'PA12': 'https://www.extrudr.com/media/tds/durapro_pa12_tds_en.pdf',
  'PC-PBT': 'https://www.extrudr.com/media/tds/durapro_pc_pbt_tds_en.pdf',
  'PC-PBT-CF': 'https://www.extrudr.com/media/tds/durapro_pc_pbt_cf_tds_en.pdf',
  'TPU-88A': 'https://www.extrudr.com/media/tds/flex_semisoft_tds_en.pdf',
  'TPU-92A': 'https://www.extrudr.com/media/tds/flex_medium_tds_en.pdf',
  'TPU-92A-ESD': 'https://www.extrudr.com/media/tds/flex_medium_esd_tds_en.pdf',
  'TPU-98A': 'https://www.extrudr.com/media/tds/flex_hard_tds_en.pdf',
  'TPU-CF': 'https://www.extrudr.com/media/tds/flex_hard_cf_tds_en.pdf',
  'PEARL': 'https://www.extrudr.com/media/tds/pearl_tds_en.pdf',
  'WOOD': 'https://www.extrudr.com/media/tds/wood_tds_en.pdf',
};

export function getExtrudrTdsUrl(title: string, material: string | null): string | null {
  if (!title) return null;
  const t = title.toUpperCase();
  
  // Specific product line matches first
  if (t.includes('BIOFUSION')) return EXTRUDR_TDS_URLS['BIOFUSION'];
  if (t.includes('GREENTEC PRO CARBON') || t.includes('GREENTEC-PRO-CARBON')) return EXTRUDR_TDS_URLS['GREENTEC-PRO-CARBON'];
  if (t.includes('GREENTEC PRO') || t.includes('GREENTEC-PRO')) return EXTRUDR_TDS_URLS['GREENTEC-PRO'];
  if (t.includes('GREENTEC')) return EXTRUDR_TDS_URLS['GREENTEC'];
  if (t.includes('FLAX')) return EXTRUDR_TDS_URLS['FLAX'];
  if (t.includes('XPETG') && (t.includes('CF') || t.includes('CARBON'))) return EXTRUDR_TDS_URLS['XPETG-CF'];
  if (t.includes('XPETG')) return EXTRUDR_TDS_URLS['XPETG'];
  if (t.includes('PCTG')) return EXTRUDR_TDS_URLS['PCTG'];
  if (t.includes('PC/PBT') || t.includes('PC-PBT')) {
    if (t.includes('CF') || t.includes('CARBON')) return EXTRUDR_TDS_URLS['PC-PBT-CF'];
    return EXTRUDR_TDS_URLS['PC-PBT'];
  }
  if (t.includes('ASA')) {
    if (t.includes('GF') || t.includes('GLASS')) return EXTRUDR_TDS_URLS['ASA-GF'];
    if (t.includes('CF') || t.includes('CARBON')) return EXTRUDR_TDS_URLS['ASA-CF'];
    return EXTRUDR_TDS_URLS['ASA'];
  }
  if (t.includes('ABS')) {
    if (t.includes('CF') || t.includes('CARBON')) return EXTRUDR_TDS_URLS['ABS-CF'];
    return EXTRUDR_TDS_URLS['ABS'];
  }
  if (t.includes('PA12') || t.includes('NYLON')) return EXTRUDR_TDS_URLS['PA12'];
  if (t.includes('FLEX') || t.includes('TPU')) {
    if (t.includes('ESD')) return EXTRUDR_TDS_URLS['TPU-92A-ESD'];
    if (t.includes('CF') || t.includes('CARBON')) return EXTRUDR_TDS_URLS['TPU-CF'];
    if (t.includes('SEMISOFT') || t.includes('88A')) return EXTRUDR_TDS_URLS['TPU-88A'];
    if (t.includes('HARD') || t.includes('98A')) return EXTRUDR_TDS_URLS['TPU-98A'];
    if (t.includes('MEDIUM') || t.includes('92A')) return EXTRUDR_TDS_URLS['TPU-92A'];
    return EXTRUDR_TDS_URLS['TPU-92A']; // Default TPU
  }
  if (t.includes('PEARL')) return EXTRUDR_TDS_URLS['PEARL'];
  if (t.includes('WOOD')) return EXTRUDR_TDS_URLS['WOOD'];
  if (t.includes('NX2') || t.includes('MATT')) return EXTRUDR_TDS_URLS['PLA'];
  if (t.includes('BASIC') && t.includes('PLA')) return EXTRUDR_TDS_URLS['PLA-BASIC'];
  if (t.includes('PETG')) return EXTRUDR_TDS_URLS['PETG'];
  if (t.includes('PLA')) return EXTRUDR_TDS_URLS['PLA'];
  
  // Fallback to material
  if (material) {
    return EXTRUDR_TDS_URLS[material.toUpperCase()] || null;
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

export const EXTRUDR_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 20, bedTempMax: 60 },
  'PLA-NX2': { nozzleTempMin: 195, nozzleTempMax: 225, bedTempMin: 20, bedTempMax: 60 },
  'BIOFUSION': { nozzleTempMin: 195, nozzleTempMax: 225, bedTempMin: 20, bedTempMax: 60 },
  'BIO': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 70 },
  'BIO-CF': { nozzleTempMin: 200, nozzleTempMax: 240, bedTempMin: 50, bedTempMax: 70, isAbrasive: true },
  'PLA-WOOD': { nozzleTempMin: 180, nozzleTempMax: 210, bedTempMin: 20, bedTempMax: 50, printSpeedMax: 60 },
  'PETG': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 60, bedTempMax: 80 },
  'PCTG': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 60, bedTempMax: 80 },
  'PETG-CF': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 60, bedTempMax: 80, isAbrasive: true },
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'ABS-CF': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'ASA': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'ASA-CF': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'ASA-GF': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'PA12': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true },
  'PC-PBT': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'PC-PBT-CF': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'TPU-88A': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 20, bedTempMax: 50, printSpeedMax: 30 },
  'TPU-92A': { nozzleTempMin: 215, nozzleTempMax: 235, bedTempMin: 20, bedTempMax: 50, printSpeedMax: 35 },
  'TPU-98A': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 20, bedTempMax: 50, printSpeedMax: 40 },
  'TPU-CF': { nozzleTempMin: 225, nozzleTempMax: 245, bedTempMin: 30, bedTempMax: 60, printSpeedMax: 35, isAbrasive: true },
};

export function getExtrudrPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  return EXTRUDR_PRINT_SETTINGS[material.toUpperCase()] || null;
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 'Silk' | 'Matte' | 'Shimmer' | 'Wood' | 'Standard';

export function extractExtrudrFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  const t = title.toLowerCase();
  
  if (t.includes('biofusion') || t.includes('silk')) return 'Silk';
  if (t.includes('nx2') || t.includes('matt')) return 'Matte';
  if (t.includes('pearl')) return 'Shimmer';
  if (t.includes('wood') || t.includes('flax')) return 'Wood';
  
  return 'Standard';
}

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

interface MaterialInfo {
  material: string;
  isAbrasive: boolean;
  enclosureRequired: boolean;
  isConductive: boolean;
  shoreHardness?: string;
}

export function normalizeExtrudrMaterial(title: string): MaterialInfo {
  const t = title.toUpperCase();
  
  // FLEX TPU Series with Shore Hardness
  if (t.includes('FLEX') || t.includes('TPU')) {
    if (t.includes('ESD')) {
      return { material: 'TPU-92A', isAbrasive: false, enclosureRequired: false, isConductive: true, shoreHardness: '92A' };
    }
    if (t.includes('CF') || t.includes('CARBON')) {
      return { material: 'TPU-CF', isAbrasive: true, enclosureRequired: false, isConductive: false, shoreHardness: '98A' };
    }
    if (t.includes('SEMISOFT') || t.includes('88A')) {
      return { material: 'TPU-88A', isAbrasive: false, enclosureRequired: false, isConductive: false, shoreHardness: '88A' };
    }
    if (t.includes('HARD') || t.includes('98A')) {
      return { material: 'TPU-98A', isAbrasive: false, enclosureRequired: false, isConductive: false, shoreHardness: '98A' };
    }
    if (t.includes('MEDIUM') || t.includes('92A')) {
      return { material: 'TPU-92A', isAbrasive: false, enclosureRequired: false, isConductive: false, shoreHardness: '92A' };
    }
    return { material: 'TPU', isAbrasive: false, enclosureRequired: false, isConductive: false };
  }
  
  // GreenTEC Bio-Based Line
  if (t.includes('GREENTEC')) {
    if (t.includes('CARBON') || t.includes('CF')) {
      return { material: 'BIO-CF', isAbrasive: true, enclosureRequired: false, isConductive: false };
    }
    return { material: 'BIO', isAbrasive: false, enclosureRequired: false, isConductive: false };
  }
  
  // Wood/Natural Fiber
  if (t.includes('FLAX') || t.includes('WOOD')) {
    return { material: 'PLA-WOOD', isAbrasive: false, enclosureRequired: false, isConductive: false };
  }
  
  // PC/PBT Blend
  if (t.includes('PC/PBT') || t.includes('PC-PBT')) {
    if (t.includes('CF') || t.includes('CARBON')) {
      return { material: 'PC-PBT-CF', isAbrasive: true, enclosureRequired: true, isConductive: false };
    }
    return { material: 'PC-PBT', isAbrasive: false, enclosureRequired: true, isConductive: false };
  }
  
  // XPETG
  if (t.includes('XPETG')) {
    if (t.includes('CF') || t.includes('CARBON')) {
      return { material: 'PETG-CF', isAbrasive: true, enclosureRequired: false, isConductive: false };
    }
    return { material: 'PETG', isAbrasive: false, enclosureRequired: false, isConductive: false };
  }
  
  // PCTG
  if (t.includes('PCTG')) {
    return { material: 'PCTG', isAbrasive: false, enclosureRequired: false, isConductive: false };
  }
  
  // ASA
  if (t.includes('ASA')) {
    if (t.includes('GF') || t.includes('GLASS')) {
      return { material: 'ASA-GF', isAbrasive: true, enclosureRequired: true, isConductive: false };
    }
    if (t.includes('CF') || t.includes('CARBON')) {
      return { material: 'ASA-CF', isAbrasive: true, enclosureRequired: true, isConductive: false };
    }
    return { material: 'ASA', isAbrasive: false, enclosureRequired: true, isConductive: false };
  }
  
  // ABS
  if (t.includes('ABS')) {
    if (t.includes('CF') || t.includes('CARBON')) {
      return { material: 'ABS-CF', isAbrasive: true, enclosureRequired: true, isConductive: false };
    }
    return { material: 'ABS', isAbrasive: false, enclosureRequired: true, isConductive: false };
  }
  
  // PA12 / Nylon
  if (t.includes('PA12') || t.includes('NYLON')) {
    return { material: 'PA12', isAbrasive: false, enclosureRequired: true, isConductive: false };
  }
  
  // PETG
  if (t.includes('PETG')) {
    return { material: 'PETG', isAbrasive: false, enclosureRequired: false, isConductive: false };
  }
  
  // BioFusion (Silk PLA)
  if (t.includes('BIOFUSION')) {
    return { material: 'PLA', isAbrasive: false, enclosureRequired: false, isConductive: false };
  }
  
  // Pearl (Shimmer PLA)
  if (t.includes('PEARL')) {
    return { material: 'PLA', isAbrasive: false, enclosureRequired: false, isConductive: false };
  }
  
  // PLA (default for remaining)
  if (t.includes('PLA') || t.includes('NX2') || t.includes('BASIC')) {
    return { material: 'PLA', isAbrasive: false, enclosureRequired: false, isConductive: false };
  }
  
  return { material: 'PLA', isAbrasive: false, enclosureRequired: false, isConductive: false };
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateExtrudrProductLineId(title: string): string {
  const t = title.toLowerCase();
  
  // FLEX TPU Series
  if (t.includes('flex') || t.includes('tpu')) {
    if (t.includes('esd')) return 'extrudr-flex-medium-esd';
    if (t.includes('cf') || t.includes('carbon')) return 'extrudr-flex-hard-cf';
    if (t.includes('semisoft') || t.includes('88a')) return 'extrudr-flex-semisoft';
    if (t.includes('hard') || t.includes('98a')) return 'extrudr-flex-hard';
    if (t.includes('medium') || t.includes('92a')) return 'extrudr-flex-medium';
    return 'extrudr-flex';
  }
  
  // GreenTEC Line
  if (t.includes('greentec')) {
    if (t.includes('carbon') || t.includes('cf')) return 'extrudr-greentec-pro-carbon';
    if (t.includes('pro')) return 'extrudr-greentec-pro';
    return 'extrudr-greentec';
  }
  
  // Wood/Natural
  if (t.includes('flax')) return 'extrudr-flax';
  if (t.includes('wood')) return 'extrudr-wood';
  
  // PC/PBT
  if (t.includes('pc/pbt') || t.includes('pc-pbt')) {
    if (t.includes('cf') || t.includes('carbon')) return 'extrudr-durapro-pc-pbt-cf';
    return 'extrudr-durapro-pc-pbt';
  }
  
  // XPETG
  if (t.includes('xpetg')) {
    if (t.includes('cf') || t.includes('carbon')) return 'extrudr-xpetg-cf';
    return 'extrudr-xpetg';
  }
  
  // PCTG
  if (t.includes('pctg')) return 'extrudr-pctg';
  
  // ASA
  if (t.includes('asa')) {
    if (t.includes('gf') || t.includes('glass')) return 'extrudr-durapro-asa-gf';
    if (t.includes('cf') || t.includes('carbon')) return 'extrudr-durapro-asa-cf';
    return 'extrudr-durapro-asa';
  }
  
  // ABS
  if (t.includes('abs')) {
    if (t.includes('cf') || t.includes('carbon')) return 'extrudr-durapro-abs-cf';
    return 'extrudr-durapro-abs';
  }
  
  // PA12
  if (t.includes('pa12') || t.includes('nylon')) return 'extrudr-durapro-pa12';
  
  // PETG
  if (t.includes('petg')) return 'extrudr-petg';
  
  // Specialty PLA
  if (t.includes('biofusion')) return 'extrudr-biofusion';
  if (t.includes('pearl')) return 'extrudr-pearl';
  if (t.includes('nx2') || t.includes('matt')) return 'extrudr-pla-nx2-matt';
  if (t.includes('cmyk')) return 'extrudr-pla-cmyk';
  if (t.includes('basic')) return 'extrudr-pla-basic';
  
  // Default PLA
  if (t.includes('pla')) return 'extrudr-pla';
  
  return 'extrudr-unknown';
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const EXTRUDR_COLOR_MAPPING: Record<string, string> = {
  // Standard Colors
  'white': '#FFFFFF',
  'black': '#000000',
  'grey': '#808080',
  'gray': '#808080',
  'silver': '#C0C0C0',
  'anthracite': '#383838',
  'signal white': '#F4F4F4',
  'traffic white': '#FAF9F6',
  'jet black': '#0A0A0A',
  
  // Reds
  'red': '#FF0000',
  'signal red': '#E52B2B',
  'traffic red': '#C1121C',
  'ruby red': '#9B111E',
  'wine red': '#722F37',
  'raspberry': '#E30B5C',
  'burgundy': '#800020',
  
  // Blues
  'blue': '#0000FF',
  'sky blue': '#87CEEB',
  'ocean blue': '#006994',
  'royal blue': '#4169E1',
  'navy': '#000080',
  'signal blue': '#1E90FF',
  'traffic blue': '#1B4F72',
  'azure': '#007FFF',
  'cobalt': '#0047AB',
  'petrol': '#006C7F',
  
  // Greens
  'green': '#00FF00',
  'signal green': '#00B050',
  'traffic green': '#00873E',
  'lime': '#32CD32',
  'mint': '#98FF98',
  'forest green': '#228B22',
  'olive': '#808000',
  'emerald': '#50C878',
  'grass green': '#7CFC00',
  
  // Yellows/Oranges
  'yellow': '#FFFF00',
  'signal yellow': '#FFD700',
  'traffic yellow': '#F5C400',
  'gold': '#FFD700',
  'orange': '#FFA500',
  'signal orange': '#FF8C00',
  'traffic orange': '#FF6600',
  'neon orange': '#FF6B08',
  'melon': '#FEBAAD',
  
  // Purples/Pinks
  'purple': '#800080',
  'violet': '#8B00FF',
  'magenta': '#FF00FF',
  'pink': '#FFC0CB',
  'rose': '#FF007F',
  'lilac': '#C8A2C8',
  'lavender': '#E6E6FA',
  
  // Browns/Naturals
  'brown': '#8B4513',
  'chocolate': '#7B3F00',
  'terracotta': '#E2725B',
  'natural': '#F5DEB3',
  'beige': '#F5F5DC',
  'sand': '#C2B280',
  'wood': '#DEB887',
  
  // Metallics/Special
  'bronze': '#CD7F32',
  'copper': '#B87333',
  'brass': '#B5A642',
  
  // Translucent
  'transparent': '#FFFFFF',
  'clear': '#FFFFFF',
  'translucent': '#F8F8FF',
  'translucent blue': '#ADD8E6',
  'translucent green': '#90EE90',
  'translucent red': '#FFA07A',
  
  // Neon/Fluorescent
  'neon yellow': '#CCFF00',
  'neon green': '#39FF14',
  'neon pink': '#FF6EC7',
};

export function getExtrudrColorHex(colorName: string): string | null {
  if (!colorName) return null;
  const normalized = colorName.toLowerCase().trim();
  return EXTRUDR_COLOR_MAPPING[normalized] || null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanExtrudrTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/extrudr\s*/gi, '')
    .replace(/\s*filament\s*/gi, ' ')
    .replace(/\s*1\.75\s*mm\s*/gi, '')
    .replace(/\s*2\.85\s*mm\s*/gi, '')
    .replace(/\s*\d+\s*g\s*/gi, '')
    .replace(/\s*\d+\s*kg\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// COLOR EXTRACTION FROM TITLE
// ============================================================================

export function extractExtrudrColorFromTitle(title: string): string | null {
  if (!title) return null;
  const t = title.toLowerCase();
  
  // Check against our color mapping
  for (const color of Object.keys(EXTRUDR_COLOR_MAPPING)) {
    if (t.includes(color)) {
      return color.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface ExtrudrEnrichmentResult {
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
  enclosureRequired: boolean;
  isConductive: boolean;
  colorHex: string | null;
  shoreHardness: string | null;
}

export function enrichExtrudrProduct(
  title: string,
  colorName?: string | null,
  existingMaterial?: string | null
): ExtrudrEnrichmentResult {
  const materialInfo = normalizeExtrudrMaterial(title);
  const material = existingMaterial || materialInfo.material;
  const settings = getExtrudrPrintSettings(material);
  const tdsUrl = getExtrudrTdsUrl(title, material);
  const colorHex = colorName ? getExtrudrColorHex(colorName) : null;
  
  return {
    tdsUrl,
    finishType: extractExtrudrFinishType(title),
    material,
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    printSpeedMax: settings?.printSpeedMax || null,
    productLineId: generateExtrudrProductLineId(title),
    isAbrasive: materialInfo.isAbrasive || settings?.isAbrasive || false,
    enclosureRequired: materialInfo.enclosureRequired || settings?.requiresEnclosure || false,
    isConductive: materialInfo.isConductive,
    colorHex,
    shoreHardness: materialInfo.shoreHardness || null,
  };
}

// ============================================================================
// STORE INFORMATION
// ============================================================================

export const EXTRUDR_STORE_INFO = {
  baseUrl: 'https://www.extrudr.com',
  collectionsUrl: 'https://www.extrudr.com/en/inlt/collection/filament/',
  vendor: 'Extrudr',
  defaultCurrency: 'EUR',
  exchangeRate: 1.08, // EUR to USD
  defaultDiameter: 1.75,
  defaultWeight: 1100, // Extrudr uses 1.1kg spools
  spoolMaterial: 'Cardboard',
  country: 'Austria',
  barcodePrefix: '9010241', // Austrian EAN prefix
};
