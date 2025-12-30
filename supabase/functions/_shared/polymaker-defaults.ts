/**
 * Polymaker-specific defaults and utility functions
 * 
 * Polymaker has an extensive catalog with multiple product lines:
 * - Panchroma (formerly PolyTerra) - Aesthetic PLA line
 * - PolyLite - Entry-level functional
 * - PolyMax - Tough/reinforced
 * - PolySonic - High-speed
 * - PolyFlex - TPU line
 * - Fiberon - Engineering composites
 */

// ============================================================================
// Print Settings by Product Line
// ============================================================================

export interface PrintSettings {
  nozzle_temp_min_c: number;
  nozzle_temp_max_c: number;
  bed_temp_min_c: number;
  bed_temp_max_c: number;
  print_speed_max_mms?: number;
  requires_enclosure?: boolean;
  is_nozzle_abrasive?: boolean;
  high_speed_capable?: boolean;
  fan_min_percent?: number;
  fan_max_percent?: number;
}

export const POLYMAKER_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Panchroma / PolyTerra PLA line
  'panchroma-pla': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    fan_min_percent: 50,
    fan_max_percent: 100,
  },
  // PolyLite PLA
  'polylite-pla': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    fan_min_percent: 50,
    fan_max_percent: 100,
  },
  // PolyMax PLA (tougher)
  'polymax-pla': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
    fan_min_percent: 50,
    fan_max_percent: 100,
  },
  // PolySonic PLA (high-speed)
  'polysonic-pla': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
    print_speed_max_mms: 300,
    high_speed_capable: true,
    fan_min_percent: 50,
    fan_max_percent: 100,
  },
  // PolyLite PLA-CF
  'polylite-pla-cf': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
    is_nozzle_abrasive: true,
    fan_min_percent: 50,
    fan_max_percent: 100,
  },
  // LW-PLA (lightweight)
  'polylite-lw-pla': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
    fan_min_percent: 0,
    fan_max_percent: 50,
  },
  // HT-PLA (high temp)
  'ht-pla': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    fan_min_percent: 50,
    fan_max_percent: 100,
  },
  // HT-PLA-GF
  'ht-pla-gf': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 45,
    bed_temp_max_c: 70,
    is_nozzle_abrasive: true,
    fan_min_percent: 50,
    fan_max_percent: 100,
  },
  // CosPLA
  'cospla': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    fan_min_percent: 50,
    fan_max_percent: 100,
  },
  // Draft PLA (bulk)
  'draft-pla': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    fan_min_percent: 50,
    fan_max_percent: 100,
  },
  // PolyLite PETG
  'polylite-petg': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 70,
    bed_temp_max_c: 80,
    fan_min_percent: 30,
    fan_max_percent: 70,
  },
  // PolyMax PETG
  'polymax-petg': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 70,
    bed_temp_max_c: 80,
    fan_min_percent: 30,
    fan_max_percent: 70,
  },
  // PolyLite ABS
  'polylite-abs': {
    nozzle_temp_min_c: 245,
    nozzle_temp_max_c: 265,
    bed_temp_min_c: 90,
    bed_temp_max_c: 110,
    requires_enclosure: true,
    fan_min_percent: 0,
    fan_max_percent: 30,
  },
  // PolyLite ASA
  'polylite-asa': {
    nozzle_temp_min_c: 240,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 90,
    bed_temp_max_c: 110,
    requires_enclosure: true,
    fan_min_percent: 0,
    fan_max_percent: 30,
  },
  // PolyLite PC
  'polylite-pc': {
    nozzle_temp_min_c: 260,
    nozzle_temp_max_c: 300,
    bed_temp_min_c: 90,
    bed_temp_max_c: 115,
    requires_enclosure: true,
    fan_min_percent: 0,
    fan_max_percent: 30,
  },
  // PC-ABS
  'pc-abs': {
    nozzle_temp_min_c: 250,
    nozzle_temp_max_c: 280,
    bed_temp_min_c: 90,
    bed_temp_max_c: 110,
    requires_enclosure: true,
    fan_min_percent: 0,
    fan_max_percent: 30,
  },
  // PC-PBT
  'pc-pbt': {
    nozzle_temp_min_c: 250,
    nozzle_temp_max_c: 280,
    bed_temp_min_c: 80,
    bed_temp_max_c: 100,
    requires_enclosure: true,
    fan_min_percent: 0,
    fan_max_percent: 30,
  },
  // PolyFlex TPU90
  'polyflex-tpu90': {
    nozzle_temp_min_c: 210,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    fan_min_percent: 20,
    fan_max_percent: 50,
  },
  // PolyFlex TPU95
  'polyflex-tpu95': {
    nozzle_temp_min_c: 210,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    fan_min_percent: 20,
    fan_max_percent: 50,
  },
  // PolyFlex TPU95-HF (high flow/speed)
  'polyflex-tpu95-hf': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 240,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    print_speed_max_mms: 250,
    high_speed_capable: true,
    fan_min_percent: 20,
    fan_max_percent: 50,
  },
  // Fiberon PA12-CF
  'fiberon-pa12-cf': {
    nozzle_temp_min_c: 260,
    nozzle_temp_max_c: 290,
    bed_temp_min_c: 80,
    bed_temp_max_c: 100,
    requires_enclosure: true,
    is_nozzle_abrasive: true,
    fan_min_percent: 0,
    fan_max_percent: 30,
  },
  // Fiberon PA6-CF
  'fiberon-pa6-cf': {
    nozzle_temp_min_c: 260,
    nozzle_temp_max_c: 290,
    bed_temp_min_c: 80,
    bed_temp_max_c: 100,
    requires_enclosure: true,
    is_nozzle_abrasive: true,
    fan_min_percent: 0,
    fan_max_percent: 30,
  },
  // Fiberon PA6-GF
  'fiberon-pa6-gf': {
    nozzle_temp_min_c: 260,
    nozzle_temp_max_c: 290,
    bed_temp_min_c: 80,
    bed_temp_max_c: 100,
    requires_enclosure: true,
    is_nozzle_abrasive: true,
    fan_min_percent: 0,
    fan_max_percent: 30,
  },
  // Fiberon PA612-CF
  'fiberon-pa612-cf': {
    nozzle_temp_min_c: 250,
    nozzle_temp_max_c: 280,
    bed_temp_min_c: 80,
    bed_temp_max_c: 100,
    requires_enclosure: true,
    is_nozzle_abrasive: true,
    fan_min_percent: 0,
    fan_max_percent: 30,
  },
  // Fiberon PA612-ESD
  'fiberon-pa612-esd': {
    nozzle_temp_min_c: 250,
    nozzle_temp_max_c: 280,
    bed_temp_min_c: 80,
    bed_temp_max_c: 100,
    requires_enclosure: true,
    is_nozzle_abrasive: true,
    fan_min_percent: 0,
    fan_max_percent: 30,
  },
  // Fiberon PETG-ESD
  'fiberon-petg-esd': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 70,
    bed_temp_max_c: 85,
    is_nozzle_abrasive: true,
    fan_min_percent: 30,
    fan_max_percent: 70,
  },
  // Fiberon PETG-rCF
  'fiberon-petg-rcf': {
    nozzle_temp_min_c: 240,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 70,
    bed_temp_max_c: 85,
    is_nozzle_abrasive: true,
    fan_min_percent: 30,
    fan_max_percent: 70,
  },
  // Fiberon PET-CF
  'fiberon-pet-cf': {
    nozzle_temp_min_c: 250,
    nozzle_temp_max_c: 280,
    bed_temp_min_c: 70,
    bed_temp_max_c: 90,
    is_nozzle_abrasive: true,
    fan_min_percent: 30,
    fan_max_percent: 70,
  },
  // Fiberon PET-GF
  'fiberon-pet-gf': {
    nozzle_temp_min_c: 250,
    nozzle_temp_max_c: 280,
    bed_temp_min_c: 70,
    bed_temp_max_c: 90,
    is_nozzle_abrasive: true,
    fan_min_percent: 30,
    fan_max_percent: 70,
  },
  // Fiberon ASA-CF
  'fiberon-asa-cf': {
    nozzle_temp_min_c: 250,
    nozzle_temp_max_c: 270,
    bed_temp_min_c: 90,
    bed_temp_max_c: 110,
    requires_enclosure: true,
    is_nozzle_abrasive: true,
    fan_min_percent: 0,
    fan_max_percent: 30,
  },
  // Fiberon PPS-CF
  'fiberon-pps-cf': {
    nozzle_temp_min_c: 280,
    nozzle_temp_max_c: 320,
    bed_temp_min_c: 120,
    bed_temp_max_c: 140,
    requires_enclosure: true,
    is_nozzle_abrasive: true,
    fan_min_percent: 0,
    fan_max_percent: 30,
  },
  // Fiberon PPS-GF
  'fiberon-pps-gf': {
    nozzle_temp_min_c: 280,
    nozzle_temp_max_c: 320,
    bed_temp_min_c: 120,
    bed_temp_max_c: 140,
    requires_enclosure: true,
    is_nozzle_abrasive: true,
    fan_min_percent: 0,
    fan_max_percent: 30,
  },
  // PolyCast
  'polycast': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 25,
    bed_temp_max_c: 70,
    fan_min_percent: 50,
    fan_max_percent: 100,
  },
  // PolySmooth
  'polysmooth': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 25,
    bed_temp_max_c: 70,
    fan_min_percent: 50,
    fan_max_percent: 100,
  },
  // PolyDissolve S1
  'polydissolve': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 210,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
    fan_min_percent: 50,
    fan_max_percent: 100,
  },
  // PolySupport
  'polysupport': {
    nozzle_temp_min_c: 240,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 80,
    bed_temp_max_c: 100,
    fan_min_percent: 30,
    fan_max_percent: 70,
  },
};

// ============================================================================
// Material Normalization
// ============================================================================

export const POLYMAKER_MATERIAL_MAPPING: Record<string, string> = {
  // Panchroma / PolyTerra -> PLA
  'panchroma matte pla': 'PLA',
  'panchroma silk pla': 'PLA',
  'panchroma marble pla': 'PLA',
  'panchroma glitter pla': 'PLA',
  'panchroma gradient pla': 'PLA',
  'polyterra pla': 'PLA',
  'polyterra matte pla': 'PLA',
  
  // PolyLite PLA variants
  'polylite pla': 'PLA',
  'polylite pla pro': 'PLA',
  'polylite glow pla': 'PLA',
  'polylite silk pla': 'PLA',
  'polylite galaxy pla': 'PLA',
  'polylite starlight pla': 'PLA',
  'polylite pla-cf': 'PLA-CF',
  'polylite lw-pla': 'LW-PLA',
  'polylite cospla': 'PLA',
  
  // PolyMax
  'polymax pla': 'PLA',
  'polymax petg': 'PETG',
  
  // PolySonic
  'polysonic pla': 'PLA',
  'polysonic pla pro': 'PLA',
  
  // HT-PLA
  'ht-pla': 'PLA',
  'ht pla': 'PLA',
  'ht-pla-gf': 'PLA-GF',
  'ht pla gf': 'PLA-GF',
  
  // PETG
  'polylite petg': 'PETG',
  'polymaker petg': 'PETG',
  
  // ABS
  'polylite abs': 'ABS',
  'polylite neon abs': 'ABS',
  'polylite metallic abs': 'ABS',
  
  // ASA
  'polylite asa': 'ASA',
  'galaxy asa': 'ASA',
  
  // PC
  'polylite pc': 'PC',
  'pc-abs': 'PC-ABS',
  'pc abs': 'PC-ABS',
  'pc-pbt': 'PC-PBT',
  'pc pbt': 'PC-PBT',
  
  // TPU
  'polyflex tpu90': 'TPU-90A',
  'polyflex tpu95': 'TPU-95A',
  'polyflex tpu95-hf': 'TPU-95A',
  'polyflex tpu 90': 'TPU-90A',
  'polyflex tpu 95': 'TPU-95A',
  
  // Fiberon PA
  'fiberon pa12-cf': 'PA12-CF',
  'fiberon pa6-cf': 'PA6-CF',
  'fiberon pa6-gf': 'PA6-GF',
  'fiberon pa612-cf': 'PA612-CF',
  'fiberon pa612-esd': 'PA612',
  'polymide pa12-cf': 'PA12-CF',
  'polymide pa6-cf': 'PA6-CF',
  'polymide pa6-gf': 'PA6-GF',
  'polymide pa612-cf': 'PA612-CF',
  
  // Fiberon PETG/PET
  'fiberon petg-esd': 'PETG',
  'fiberon petg-rcf': 'PETG-CF',
  'fiberon petg-rcf08': 'PETG-CF',
  'fiberon pet-cf': 'PET-CF',
  'fiberon pet-gf': 'PET-GF',
  
  // Fiberon ASA
  'fiberon asa-cf': 'ASA-CF',
  
  // Fiberon PPS
  'fiberon pps-cf': 'PPS-CF',
  'fiberon pps-gf': 'PPS-GF',
  
  // Specialty
  'polycast': 'PVB',
  'polysmooth': 'PVB',
  'polydissolve': 'PVA',
  'polydissolve s1': 'PVA',
  'polysupport': 'Support',
  
  // Draft PLA
  'draft pla': 'PLA',
};

export function normalizePolymakerMaterial(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  // Check direct mapping
  for (const [pattern, material] of Object.entries(POLYMAKER_MATERIAL_MAPPING)) {
    if (lowerTitle.includes(pattern)) {
      return material;
    }
  }
  
  // Fallback patterns
  if (lowerTitle.includes('pps-cf') || lowerTitle.includes('pps cf')) return 'PPS-CF';
  if (lowerTitle.includes('pps-gf') || lowerTitle.includes('pps gf')) return 'PPS-GF';
  if (lowerTitle.includes('asa-cf') || lowerTitle.includes('asa cf')) return 'ASA-CF';
  if (lowerTitle.includes('pet-cf') || lowerTitle.includes('pet cf')) return 'PET-CF';
  if (lowerTitle.includes('pet-gf') || lowerTitle.includes('pet gf')) return 'PET-GF';
  if (lowerTitle.includes('pa12-cf') || lowerTitle.includes('pa12 cf')) return 'PA12-CF';
  if (lowerTitle.includes('pa6-cf') || lowerTitle.includes('pa6 cf')) return 'PA6-CF';
  if (lowerTitle.includes('pa6-gf') || lowerTitle.includes('pa6 gf')) return 'PA6-GF';
  if (lowerTitle.includes('pa612-cf') || lowerTitle.includes('pa612 cf')) return 'PA612-CF';
  if (lowerTitle.includes('pla-cf') || lowerTitle.includes('pla cf')) return 'PLA-CF';
  if (lowerTitle.includes('pla-gf') || lowerTitle.includes('pla gf')) return 'PLA-GF';
  if (lowerTitle.includes('petg-cf') || lowerTitle.includes('petg cf')) return 'PETG-CF';
  if (lowerTitle.includes('lw-pla') || lowerTitle.includes('lw pla')) return 'LW-PLA';
  if (lowerTitle.includes('tpu') && lowerTitle.includes('90')) return 'TPU-90A';
  if (lowerTitle.includes('tpu') && lowerTitle.includes('95')) return 'TPU-95A';
  if (lowerTitle.includes('tpu')) return 'TPU';
  if (lowerTitle.includes('pc-abs') || lowerTitle.includes('pc abs')) return 'PC-ABS';
  if (lowerTitle.includes('pc-pbt') || lowerTitle.includes('pc pbt')) return 'PC-PBT';
  if (lowerTitle.includes('petg')) return 'PETG';
  if (lowerTitle.includes('abs')) return 'ABS';
  if (lowerTitle.includes('asa')) return 'ASA';
  if (lowerTitle.includes('pla')) return 'PLA';
  if (lowerTitle.includes(' pc') || lowerTitle.includes('pc ')) return 'PC';
  if (lowerTitle.includes('pva') || lowerTitle.includes('dissolve')) return 'PVA';
  if (lowerTitle.includes('pvb') || lowerTitle.includes('smooth') || lowerTitle.includes('cast')) return 'PVB';
  
  return 'PLA'; // Default
}

// ============================================================================
// Finish Type Detection
// ============================================================================

export type FinishType = 
  | 'Matte' 
  | 'Silk' 
  | 'Marble' 
  | 'Glitter' 
  | 'Gradient' 
  | 'Glow' 
  | 'Carbon'
  | 'Glass Fiber'
  | 'Galaxy'
  | 'Starlight'
  | 'Metallic'
  | 'Neon'
  | 'Standard';

export function extractFinishType(title: string): FinishType {
  const lowerTitle = title.toLowerCase();
  
  // Carbon/Glass fiber (technical)
  if (lowerTitle.includes('-cf') || lowerTitle.includes(' cf') || lowerTitle.includes('carbon')) return 'Carbon';
  if (lowerTitle.includes('-gf') || lowerTitle.includes(' gf') || lowerTitle.includes('glass fiber')) return 'Glass Fiber';
  
  // Aesthetic finishes
  if (lowerTitle.includes('matte') || lowerTitle.includes('muted') || lowerTitle.includes('pastel') || lowerTitle.includes('army')) return 'Matte';
  if (lowerTitle.includes('silk')) return 'Silk';
  if (lowerTitle.includes('marble')) return 'Marble';
  if (lowerTitle.includes('glitter')) return 'Glitter';
  if (lowerTitle.includes('gradient') || lowerTitle.includes('dual color')) return 'Gradient';
  if (lowerTitle.includes('glow')) return 'Glow';
  if (lowerTitle.includes('galaxy')) return 'Galaxy';
  if (lowerTitle.includes('starlight')) return 'Starlight';
  if (lowerTitle.includes('metallic')) return 'Metallic';
  if (lowerTitle.includes('neon')) return 'Neon';
  
  return 'Standard';
}

// ============================================================================
// Title Cleaning
// ============================================================================

export const POLYMAKER_TITLE_NOISE: RegExp[] = [
  /\s*\(Formerly\s+[^)]+\)\s*/gi,
  /\s*\(formerly\s+[^)]+\)\s*/gi,
  /\s*\(New Packaging\)\s*/gi,
  /\s*\(Old Packaging\)\s*/gi,
  /\s*-\s*New Packaging\s*/gi,
  /\s*-\s*Old Packaging\s*/gi,
  /\s*\|\s*HEX Code:[^|]+/gi,
  /\s*\|\s*TD:[^|]+/gi,
  /\s*1\.75mm\s*/gi,
  /\s*2\.85mm\s*/gi,
  /\s*1kg\s*/gi,
  /\s*750g\s*/gi,
  /\s*500g\s*/gi,
  /\s*3kg\s*/gi,
  /\s+{2,}/g,
];

export function cleanPolymakerTitle(title: string): string {
  let cleaned = title;
  
  for (const pattern of POLYMAKER_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  
  return cleaned.trim().replace(/\s+/g, ' ');
}

// ============================================================================
// Product Line ID Generation
// ============================================================================

type ProductLine = 
  | 'panchroma-matte'
  | 'panchroma-silk'
  | 'panchroma-marble'
  | 'panchroma-glitter'
  | 'panchroma-gradient'
  | 'polyterra-matte'
  | 'polylite'
  | 'polylite-silk'
  | 'polylite-glow'
  | 'polylite-galaxy'
  | 'polylite-starlight'
  | 'polymax'
  | 'polysonic'
  | 'polysonic-pro'
  | 'polyflex'
  | 'polyflex-hf'
  | 'fiberon'
  | 'polycast'
  | 'polysmooth'
  | 'polydissolve'
  | 'polysupport'
  | 'ht-pla'
  | 'cospla'
  | 'draft'
  | 'neon'
  | 'metallic'
  | 'galaxy';

function extractProductLine(title: string): ProductLine | null {
  const lower = title.toLowerCase();
  
  // Panchroma line (new branding)
  if (lower.includes('panchroma')) {
    if (lower.includes('silk')) return 'panchroma-silk';
    if (lower.includes('marble')) return 'panchroma-marble';
    if (lower.includes('glitter')) return 'panchroma-glitter';
    if (lower.includes('gradient') || lower.includes('dual')) return 'panchroma-gradient';
    return 'panchroma-matte';
  }
  
  // PolyTerra (old branding -> maps to panchroma)
  if (lower.includes('polyterra')) {
    return 'polyterra-matte';
  }
  
  // PolySonic
  if (lower.includes('polysonic')) {
    if (lower.includes('pro')) return 'polysonic-pro';
    return 'polysonic';
  }
  
  // PolyMax
  if (lower.includes('polymax')) {
    return 'polymax';
  }
  
  // PolyFlex
  if (lower.includes('polyflex')) {
    if (lower.includes('hf') || lower.includes('high flow')) return 'polyflex-hf';
    return 'polyflex';
  }
  
  // Fiberon / PolyMide
  if (lower.includes('fiberon') || lower.includes('polymide')) {
    return 'fiberon';
  }
  
  // Specialty
  if (lower.includes('polycast')) return 'polycast';
  if (lower.includes('polysmooth')) return 'polysmooth';
  if (lower.includes('polydissolve')) return 'polydissolve';
  if (lower.includes('polysupport')) return 'polysupport';
  if (lower.includes('ht-pla') || lower.includes('ht pla')) return 'ht-pla';
  if (lower.includes('cospla')) return 'cospla';
  if (lower.includes('draft')) return 'draft';
  
  // PolyLite special variants
  if (lower.includes('polylite')) {
    if (lower.includes('silk')) return 'polylite-silk';
    if (lower.includes('glow')) return 'polylite-glow';
    if (lower.includes('galaxy')) return 'polylite-galaxy';
    if (lower.includes('starlight')) return 'polylite-starlight';
    if (lower.includes('neon')) return 'neon';
    if (lower.includes('metallic')) return 'metallic';
    return 'polylite';
  }
  
  // Galaxy ASA
  if (lower.includes('galaxy') && lower.includes('asa')) return 'galaxy';
  
  // Neon ABS
  if (lower.includes('neon') && lower.includes('abs')) return 'neon';
  
  // Metallic ABS
  if (lower.includes('metallic') && lower.includes('abs')) return 'metallic';
  
  return null;
}

export function generatePolymakerProductLineId(title: string, material?: string | null): string {
  const normalizedMaterial = (material || normalizePolymakerMaterial(title)).toLowerCase().replace(/\s+/g, '-');
  const productLine = extractProductLine(title);
  
  if (productLine) {
    return `polymaker__${normalizedMaterial}__${productLine}`;
  }
  
  // Fallback: use cleaned title fragment
  const lower = title.toLowerCase();
  let lineFragment = 'standard';
  
  if (lower.includes('silk')) lineFragment = 'silk';
  else if (lower.includes('matte')) lineFragment = 'matte';
  else if (lower.includes('marble')) lineFragment = 'marble';
  else if (lower.includes('glitter')) lineFragment = 'glitter';
  else if (lower.includes('gradient')) lineFragment = 'gradient';
  else if (lower.includes('glow')) lineFragment = 'glow';
  else if (lower.includes('galaxy')) lineFragment = 'galaxy';
  else if (lower.includes('metallic')) lineFragment = 'metallic';
  else if (lower.includes('neon')) lineFragment = 'neon';
  
  return `polymaker__${normalizedMaterial}__${lineFragment}`;
}

// ============================================================================
// TDS URL Patterns
// ============================================================================

// Polymaker uses two TDS URL patterns
export function generatePolymakerTdsUrl(title: string, handle?: string): string | null {
  const productSlug = handle || title.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-');
  
  // New CDN pattern (preferred)
  return `https://cdn.shopify.com/s/files/1/0548/7299/7945/files/TDS_${productSlug}.pdf`;
}

export function generateLegacyTdsUrl(title: string): string | null {
  const productSlug = title.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-');
  
  // Legacy pattern
  return `https://polymaker.com/wp-content/uploads/lana-downloads/${productSlug}_TDS_V5.3.pdf`;
}

// ============================================================================
// Color Mapping
// ============================================================================

export const POLYMAKER_COLOR_MAPPING: Record<string, string> = {
  // Matte/Army colors
  'matte charcoal black': '#2F2E30',
  'matte black': '#1A1A1A',
  'matte white': '#F5F5F5',
  'matte munsell green': '#00A877',
  'matte cotton white': '#FAFAFA',
  'charcoal black': '#2F2E30',
  'cotton white': '#FAFAFA',
  'army beige': '#C2B280',
  'army brown': '#5C4033',
  'army blue': '#4B5D67',
  'army dark green': '#2D4A3E',
  'army green': '#4B5320',
  'army light green': '#8DB600',
  'army orange': '#B5651D',
  'army red': '#7C1C1C',
  'army yellow': '#C4A747',
  
  // Muted colors
  'muted white': '#E8E8E8',
  'muted green': '#7BA17C',
  'muted blue': '#6B8E9F',
  'muted pink': '#E5B4B4',
  'muted purple': '#9B7BB3',
  
  // Pastel colors
  'pastel peach': '#FFCBA4',
  'pastel banana': '#FFF9AE',
  'pastel mint': '#98FF98',
  'pastel sky': '#87CEEB',
  'pastel lavender': '#E6E6FA',
  'pastel pink': '#FFD1DC',
  
  // Standard colors
  'lava red': '#CF1020',
  'sakura pink': '#FFB7C5',
  'savannah yellow': '#F4C430',
  'fossil grey': '#787276',
  'marble white': '#FCFCFC',
  'ice blue': '#99FFFF',
  'slate grey': '#708090',
  'jet black': '#0A0A0A',
  'true black': '#000000',
  'true white': '#FFFFFF',
  'natural': '#D4C4A8',
  'transparent': '#FFFFFF',
  'clear': '#FFFFFF',
  
  // Engineering materials (typically neutral)
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'grey': '#808080',
  'gray': '#808080',
  'natural white': '#F5F5DC',
};

export function getPolymakerColorHex(colorName: string): string | null {
  const normalized = colorName.toLowerCase().trim();
  return POLYMAKER_COLOR_MAPPING[normalized] || null;
}

export function extractColorFromTitle(title: string): string | null {
  const lowerTitle = title.toLowerCase();
  
  for (const colorName of Object.keys(POLYMAKER_COLOR_MAPPING)) {
    if (lowerTitle.includes(colorName)) {
      return colorName;
    }
  }
  
  return null;
}

// Extract HEX from SKU pattern: "CA04015 | HEX Code:#2F2E30 | TD:0.1"
export function extractHexFromSku(sku: string | null): string | null {
  if (!sku) return null;
  
  const hexMatch = sku.match(/HEX\s*Code:\s*#?([0-9A-Fa-f]{6})/i);
  if (hexMatch) {
    return `#${hexMatch[1].toUpperCase()}`;
  }
  
  return null;
}

// Extract Transmission Distance from SKU
export function extractTdFromSku(sku: string | null): number | null {
  if (!sku) return null;
  
  const tdMatch = sku.match(/TD:\s*([\d.]+)/i);
  if (tdMatch) {
    return parseFloat(tdMatch[1]);
  }
  
  return null;
}

// ============================================================================
// Weight/Diameter Extraction
// ============================================================================

export function extractWeightKg(title: string): number {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('3kg') || lowerTitle.includes('3 kg')) return 3.0;
  if (lowerTitle.includes('2kg') || lowerTitle.includes('2 kg')) return 2.0;
  if (lowerTitle.includes('1kg') || lowerTitle.includes('1 kg')) return 1.0;
  if (lowerTitle.includes('750g') || lowerTitle.includes('750 g') || lowerTitle.includes('0.75kg')) return 0.75;
  if (lowerTitle.includes('500g') || lowerTitle.includes('500 g') || lowerTitle.includes('0.5kg')) return 0.5;
  if (lowerTitle.includes('250g') || lowerTitle.includes('250 g') || lowerTitle.includes('0.25kg')) return 0.25;
  
  return 1.0; // Default
}

export function extractDiameterMm(title: string): number {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('2.85') || lowerTitle.includes('3mm') || lowerTitle.includes('3.0mm')) return 2.85;
  
  return 1.75; // Default
}

// ============================================================================
// Shopify Product Filter
// ============================================================================

export function isFilamentProduct(product: {
  title?: string;
  product_type?: string;
  tags?: string[];
  handle?: string;
}): boolean {
  const title = (product.title || '').toLowerCase();
  const productType = (product.product_type || '').toLowerCase();
  const handle = (product.handle || '').toLowerCase();
  const tags = (product.tags || []).map(t => t.toLowerCase());
  
  // Exclude non-filament products
  const excludePatterns = [
    'dry box', 'drybox', 'dryer', 
    'nozzle', 'hotend', 'extruder',
    'plate', 'sheet', 'bed',
    'polisher', 'tank', 'alcohol',
    'accessory', 'accessories',
    'spool holder', 'stand',
    'bundle', 'sample pack',
    'gift card',
  ];
  
  for (const pattern of excludePatterns) {
    if (title.includes(pattern) || handle.includes(pattern)) {
      return false;
    }
  }
  
  // Include if product type or tags indicate filament
  if (productType.includes('filament') || productType.includes('pla') || productType.includes('petg')) {
    return true;
  }
  
  if (tags.some(t => t.includes('filament') || t.includes('pla') || t.includes('petg'))) {
    return true;
  }
  
  // Include if title contains filament material keywords
  const filamentKeywords = [
    'pla', 'petg', 'abs', 'asa', 'tpu', 'pc', 'nylon', 'pa',
    'panchroma', 'polyterra', 'polylite', 'polymax', 'polysonic',
    'polyflex', 'fiberon', 'polymide', 'polycast', 'polysmooth',
    'polydissolve', 'polysupport', 'ht-pla', 'cospla', 'draft',
  ];
  
  return filamentKeywords.some(kw => title.includes(kw) || handle.includes(kw));
}

// ============================================================================
// Print Settings Lookup
// ============================================================================

export function getPrintSettingsKey(title: string, material?: string | null): string | null {
  const lower = title.toLowerCase();
  
  // Product line specific settings
  if (lower.includes('panchroma') || lower.includes('polyterra')) return 'panchroma-pla';
  if (lower.includes('polysonic')) return 'polysonic-pla';
  if (lower.includes('polymax') && lower.includes('pla')) return 'polymax-pla';
  if (lower.includes('polymax') && lower.includes('petg')) return 'polymax-petg';
  if (lower.includes('polyflex') && lower.includes('hf')) return 'polyflex-tpu95-hf';
  if (lower.includes('polyflex') && lower.includes('90')) return 'polyflex-tpu90';
  if (lower.includes('polyflex') && lower.includes('95')) return 'polyflex-tpu95';
  if (lower.includes('polyflex')) return 'polyflex-tpu95';
  if (lower.includes('polylite') && lower.includes('pla-cf')) return 'polylite-pla-cf';
  if (lower.includes('polylite') && lower.includes('lw-pla')) return 'polylite-lw-pla';
  if (lower.includes('polylite') && lower.includes('petg')) return 'polylite-petg';
  if (lower.includes('polylite') && lower.includes('abs')) return 'polylite-abs';
  if (lower.includes('polylite') && lower.includes('asa')) return 'polylite-asa';
  if (lower.includes('polylite') && lower.includes('pc') && !lower.includes('pc-abs')) return 'polylite-pc';
  if (lower.includes('polylite') && lower.includes('pla')) return 'polylite-pla';
  if (lower.includes('cospla')) return 'cospla';
  if (lower.includes('ht-pla-gf') || lower.includes('ht pla gf')) return 'ht-pla-gf';
  if (lower.includes('ht-pla') || lower.includes('ht pla')) return 'ht-pla';
  if (lower.includes('draft')) return 'draft-pla';
  if (lower.includes('pc-abs') || lower.includes('pc abs')) return 'pc-abs';
  if (lower.includes('pc-pbt') || lower.includes('pc pbt')) return 'pc-pbt';
  if (lower.includes('polycast')) return 'polycast';
  if (lower.includes('polysmooth')) return 'polysmooth';
  if (lower.includes('polydissolve')) return 'polydissolve';
  if (lower.includes('polysupport')) return 'polysupport';
  
  // Fiberon materials
  if (lower.includes('fiberon') || lower.includes('polymide')) {
    if (lower.includes('pps-cf') || lower.includes('pps cf')) return 'fiberon-pps-cf';
    if (lower.includes('pps-gf') || lower.includes('pps gf')) return 'fiberon-pps-gf';
    if (lower.includes('asa-cf') || lower.includes('asa cf')) return 'fiberon-asa-cf';
    if (lower.includes('pet-cf') || lower.includes('pet cf')) return 'fiberon-pet-cf';
    if (lower.includes('pet-gf') || lower.includes('pet gf')) return 'fiberon-pet-gf';
    if (lower.includes('petg-esd') || lower.includes('petg esd')) return 'fiberon-petg-esd';
    if (lower.includes('petg-rcf') || lower.includes('rcf')) return 'fiberon-petg-rcf';
    if (lower.includes('pa612-esd') || lower.includes('pa612 esd')) return 'fiberon-pa612-esd';
    if (lower.includes('pa612-cf') || lower.includes('pa612 cf')) return 'fiberon-pa612-cf';
    if (lower.includes('pa12-cf') || lower.includes('pa12 cf')) return 'fiberon-pa12-cf';
    if (lower.includes('pa6-cf') || lower.includes('pa6 cf')) return 'fiberon-pa6-cf';
    if (lower.includes('pa6-gf') || lower.includes('pa6 gf')) return 'fiberon-pa6-gf';
  }
  
  return null;
}

// ============================================================================
// Main Enrichment Function
// ============================================================================

export interface PolymakerEnrichmentResult {
  material: string;
  finish_type: FinishType;
  product_line_id: string;
  cleaned_title: string;
  weight_kg: number;
  diameter_mm: number;
  color_hex: string | null;
  transmission_distance: number | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  print_speed_max_mms: number | null;
  is_nozzle_abrasive: boolean;
  requires_enclosure: boolean;
  high_speed_capable: boolean;
  fan_min_percent: number | null;
  fan_max_percent: number | null;
}

export function enrichPolymakerProduct(
  title: string, 
  sku?: string | null,
  existingMaterial?: string | null
): PolymakerEnrichmentResult {
  const material = existingMaterial || normalizePolymakerMaterial(title);
  const finishType = extractFinishType(title);
  const productLineId = generatePolymakerProductLineId(title, material);
  const cleanedTitle = cleanPolymakerTitle(title);
  const weightKg = extractWeightKg(title);
  const diameterMm = extractDiameterMm(title);
  
  // Extract HEX and TD from SKU
  const skuVal = sku ?? null;
  const colorHex = extractHexFromSku(skuVal) || getPolymakerColorHex(extractColorFromTitle(title) || '');
  const transmissionDistance = extractTdFromSku(skuVal);
  
  // Get print settings
  const settingsKey = getPrintSettingsKey(title, material);
  const settings = settingsKey ? POLYMAKER_PRINT_SETTINGS[settingsKey] : null;
  
  const isAbrasive = settings?.is_nozzle_abrasive ?? (finishType === 'Carbon' || finishType === 'Glass Fiber');
  
  return {
    material,
    finish_type: finishType,
    product_line_id: productLineId,
    cleaned_title: cleanedTitle,
    weight_kg: weightKg,
    diameter_mm: diameterMm,
    color_hex: colorHex,
    transmission_distance: transmissionDistance,
    nozzle_temp_min_c: settings?.nozzle_temp_min_c ?? null,
    nozzle_temp_max_c: settings?.nozzle_temp_max_c ?? null,
    bed_temp_min_c: settings?.bed_temp_min_c ?? null,
    bed_temp_max_c: settings?.bed_temp_max_c ?? null,
    print_speed_max_mms: settings?.print_speed_max_mms ?? null,
    is_nozzle_abrasive: isAbrasive,
    requires_enclosure: settings?.requires_enclosure ?? false,
    high_speed_capable: settings?.high_speed_capable ?? false,
    fan_min_percent: settings?.fan_min_percent ?? null,
    fan_max_percent: settings?.fan_max_percent ?? null,
  };
}
