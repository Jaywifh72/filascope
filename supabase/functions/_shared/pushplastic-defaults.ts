/**
 * Push Plastic Brand-Specific Defaults
 * 
 * US-based manufacturer with industrial/pro focus, excellent documentation,
 * and comprehensive TDS PDFs for all materials.
 */

import { getColorHex as getSharedColorHex } from './color-mapping.ts';

// ============================================================================
// PRINT SETTINGS BY MATERIAL
// ============================================================================

export interface PrintSettings {
  nozzle_temp_min_c: number;
  nozzle_temp_max_c: number;
  bed_temp_min_c: number;
  bed_temp_max_c: number;
  fan_min_percent?: number;
  fan_max_percent?: number;
  requires_enclosure?: boolean;
  is_abrasive?: boolean;
  drying_temp_c?: number;
  drying_time_hours?: number;
}

export const PUSHPLASTIC_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Standard PLA
  'pla': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    fan_min_percent: 50,
    fan_max_percent: 100,
    drying_temp_c: 45,
    drying_time_hours: 4,
  },
  // HH Tough PLA (3D870) - Heat Treatable
  'pla-ht': {
    nozzle_temp_min_c: 215,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 70,
    fan_min_percent: 50,
    fan_max_percent: 100,
    drying_temp_c: 45,
    drying_time_hours: 4,
  },
  // HH PLA (3D850) - High Heat
  'pla-hh': {
    nozzle_temp_min_c: 210,
    nozzle_temp_max_c: 225,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    fan_min_percent: 50,
    fan_max_percent: 100,
    drying_temp_c: 45,
    drying_time_hours: 4,
  },
  // PETG
  'petg': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 70,
    bed_temp_max_c: 80,
    fan_min_percent: 0,
    fan_max_percent: 50,
    drying_temp_c: 65,
    drying_time_hours: 4,
  },
  // PCTG
  'pctg': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 70,
    bed_temp_max_c: 80,
    fan_min_percent: 0,
    fan_max_percent: 50,
    drying_temp_c: 65,
    drying_time_hours: 4,
  },
  // ABS
  'abs': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 240,
    bed_temp_min_c: 95,
    bed_temp_max_c: 110,
    fan_min_percent: 0,
    fan_max_percent: 20,
    requires_enclosure: true,
    drying_temp_c: 80,
    drying_time_hours: 4,
  },
  // Carbon Fiber ABS
  'abs-cf': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 95,
    bed_temp_max_c: 110,
    fan_min_percent: 0,
    fan_max_percent: 20,
    requires_enclosure: true,
    is_abrasive: true,
    drying_temp_c: 80,
    drying_time_hours: 4,
  },
  // Carbon Fiber PETG
  'petg-cf': {
    nozzle_temp_min_c: 240,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 70,
    bed_temp_max_c: 85,
    fan_min_percent: 0,
    fan_max_percent: 30,
    is_abrasive: true,
    drying_temp_c: 65,
    drying_time_hours: 4,
  },
  // Carbon Fiber Nylon
  'pa-cf': {
    nozzle_temp_min_c: 250,
    nozzle_temp_max_c: 270,
    bed_temp_min_c: 70,
    bed_temp_max_c: 90,
    fan_min_percent: 0,
    fan_max_percent: 30,
    requires_enclosure: true,
    is_abrasive: true,
    drying_temp_c: 80,
    drying_time_hours: 8,
  },
  // Polycarbonate
  'pc': {
    nozzle_temp_min_c: 270,
    nozzle_temp_max_c: 300,
    bed_temp_min_c: 100,
    bed_temp_max_c: 120,
    fan_min_percent: 0,
    fan_max_percent: 20,
    requires_enclosure: true,
    drying_temp_c: 80,
    drying_time_hours: 8,
  },
  // PC+PBT Blend
  'pc-pbt': {
    nozzle_temp_min_c: 260,
    nozzle_temp_max_c: 290,
    bed_temp_min_c: 100,
    bed_temp_max_c: 110,
    fan_min_percent: 0,
    fan_max_percent: 20,
    requires_enclosure: true,
    drying_temp_c: 80,
    drying_time_hours: 6,
  },
  // Carbon Fiber PC+PBT
  'pc-cf': {
    nozzle_temp_min_c: 270,
    nozzle_temp_max_c: 300,
    bed_temp_min_c: 100,
    bed_temp_max_c: 115,
    fan_min_percent: 0,
    fan_max_percent: 20,
    requires_enclosure: true,
    is_abrasive: true,
    drying_temp_c: 80,
    drying_time_hours: 6,
  },
  // ASA
  'asa': {
    nozzle_temp_min_c: 235,
    nozzle_temp_max_c: 255,
    bed_temp_min_c: 95,
    bed_temp_max_c: 110,
    fan_min_percent: 0,
    fan_max_percent: 30,
    requires_enclosure: true,
    drying_temp_c: 80,
    drying_time_hours: 4,
  },
  // HIPS
  'hips': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 240,
    bed_temp_min_c: 95,
    bed_temp_max_c: 110,
    fan_min_percent: 0,
    fan_max_percent: 20,
    drying_temp_c: 60,
    drying_time_hours: 4,
  },
  // PEI / ULTEM
  'pei': {
    nozzle_temp_min_c: 350,
    nozzle_temp_max_c: 380,
    bed_temp_min_c: 120,
    bed_temp_max_c: 160,
    fan_min_percent: 0,
    fan_max_percent: 0,
    requires_enclosure: true,
    drying_temp_c: 150,
    drying_time_hours: 8,
  },
  // TPU 98A
  'tpu-98a': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 240,
    bed_temp_min_c: 40,
    bed_temp_max_c: 60,
    fan_min_percent: 0,
    fan_max_percent: 50,
    drying_temp_c: 50,
    drying_time_hours: 4,
  },
  // BVOH (Water-Soluble Support)
  'bvoh': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 225,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    fan_min_percent: 50,
    fan_max_percent: 100,
    drying_temp_c: 50,
    drying_time_hours: 4,
  },
  // PMMA / Acrylic
  'pmma': {
    nozzle_temp_min_c: 235,
    nozzle_temp_max_c: 255,
    bed_temp_min_c: 80,
    bed_temp_max_c: 100,
    fan_min_percent: 0,
    fan_max_percent: 30,
    drying_temp_c: 80,
    drying_time_hours: 4,
  },
};

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export const PUSHPLASTIC_MATERIAL_MAPPING: Record<string, string> = {
  // PLA variants
  'pla': 'PLA',
  'pla filament': 'PLA',
  'pla+': 'PLA',
  'matte pla': 'PLA',
  
  // High Heat PLA variants
  'hh tough pla': 'PLA-HT',
  'hh+tough pla': 'PLA-HT',
  'tough pla': 'PLA-HT',
  '3d870': 'PLA-HT',
  'hh pla': 'PLA-HH',
  'high heat pla': 'PLA-HH',
  '3d850': 'PLA-HH',
  
  // PETG variants
  'petg': 'PETG',
  'petg filament': 'PETG',
  'petg+': 'PETG',
  'pctg': 'PCTG',
  'pctg filament': 'PCTG',
  
  // ABS variants
  'abs': 'ABS',
  'abs filament': 'ABS',
  'abs+': 'ABS',
  'matte abs': 'ABS',
  
  // Carbon Fiber variants
  'carbon fiber abs': 'ABS-CF',
  'cf abs': 'ABS-CF',
  'carbon fiber petg': 'PETG-CF',
  'cf petg': 'PETG-CF',
  'carbon fiber nylon': 'PA-CF',
  'cf nylon': 'PA-CF',
  'carbon fiber pc+pbt': 'PC-CF',
  'cf pc+pbt': 'PC-CF',
  'cf pc-pbt': 'PC-CF',
  
  // Engineering plastics
  'polycarbonate': 'PC',
  'pc': 'PC',
  'pc filament': 'PC',
  'pc+pbt': 'PC+PBT',
  'pc-pbt': 'PC+PBT',
  'asa': 'ASA',
  'asa filament': 'ASA',
  
  // Specialty materials
  'ultem': 'PEI',
  'pei': 'PEI',
  'pei 9085': 'PEI',
  'pei 1010': 'PEI',
  'hips': 'HIPS',
  'hips filament': 'HIPS',
  'aquasys': 'BVOH',
  'bvoh': 'BVOH',
  'pmma': 'PMMA',
  'acrylic': 'PMMA',
  
  // TPU
  'tpu': 'TPU-98A',
  'tpu 98a': 'TPU-98A',
  'tpu filament': 'TPU-98A',
};

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 'Standard' | 'Matte' | 'Metallic' | 'Translucent' | 'Fluorescent' | 'Carbon' | 'Filled' | 'Natural';

export function extractPushPlasticFinishType(title: string, material?: string | null): FinishType {
  const titleLower = title.toLowerCase();
  const materialLower = (material || '').toLowerCase();
  
  // Carbon Fiber detection
  if (titleLower.includes('carbon fiber') || titleLower.includes('cf ') || 
      materialLower.includes('-cf') || materialLower.includes('cf')) {
    return 'Carbon';
  }
  
  // Matte finish
  if (titleLower.includes('matte')) {
    return 'Matte';
  }
  
  // Metallic finishes
  if (titleLower.includes('metallic') || titleLower.includes('bronze metallic') ||
      titleLower.includes('gold metallic') || titleLower.includes('silver metallic')) {
    return 'Metallic';
  }
  
  // Translucent / Transparent
  if (titleLower.includes('translucent') || titleLower.includes('trans ') ||
      titleLower.startsWith('trans') || titleLower.includes('transparent') ||
      titleLower.includes('clear')) {
    return 'Translucent';
  }
  
  // Fluorescent
  if (titleLower.includes('fluorescent') || titleLower.includes('flo ') ||
      titleLower.startsWith('flo ')) {
    return 'Fluorescent';
  }
  
  // Granite / Filled
  if (titleLower.includes('granite') || titleLower.includes('stone')) {
    return 'Filled';
  }
  
  // Natural (unpigmented)
  if (titleLower.includes('natural') && !titleLower.includes('natural white')) {
    return 'Natural';
  }
  
  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export interface ProductLineResult {
  productLineId: string;
  settingsKey: string;
}

export function generatePushPlasticProductLineId(title: string, material?: string | null): ProductLineResult {
  const normalizedMaterial = normalizePushPlasticMaterial(title, material);
  const finishType = extractPushPlasticFinishType(title, material);
  const titleLower = title.toLowerCase();
  
  let materialKey = normalizedMaterial.toLowerCase().replace(/[^a-z0-9]/g, '-');
  let variant = 'standard';
  
  // Determine settings key based on normalized material
  const settingsKeyMap: Record<string, string> = {
    'pla': 'pla',
    'pla-ht': 'pla-ht',
    'pla-hh': 'pla-hh',
    'petg': 'petg',
    'pctg': 'pctg',
    'abs': 'abs',
    'abs-cf': 'abs-cf',
    'petg-cf': 'petg-cf',
    'pa-cf': 'pa-cf',
    'pc': 'pc',
    'pc-pbt': 'pc-pbt',
    'pc-cf': 'pc-cf',
    'asa': 'asa',
    'hips': 'hips',
    'pei': 'pei',
    'tpu-98a': 'tpu-98a',
    'bvoh': 'bvoh',
    'pmma': 'pmma',
  };
  
  const settingsKey = settingsKeyMap[materialKey] || 'pla';
  
  // Determine variant based on finish or special characteristics
  if (finishType === 'Matte') {
    variant = 'matte';
  } else if (finishType === 'Translucent') {
    variant = 'translucent';
  } else if (finishType === 'Metallic') {
    variant = 'metallic';
  } else if (finishType === 'Fluorescent') {
    variant = 'fluorescent';
  } else if (materialKey === 'pla-ht') {
    variant = 'tough';
  } else if (materialKey === 'pla-hh') {
    variant = 'high-heat';
  } else if (materialKey === 'bvoh') {
    variant = 'support';
  } else if (materialKey === 'pei') {
    variant = 'ultem';
  } else if (materialKey === 'tpu-98a') {
    variant = '98a';
  }
  
  const productLineId = `push-plastic__${materialKey}__${variant}`;
  
  return { productLineId, settingsKey };
}

// ============================================================================
// MATERIAL NORMALIZATION FUNCTION
// ============================================================================

export function normalizePushPlasticMaterial(title: string, existingMaterial?: string | null): string {
  const titleLower = title.toLowerCase();
  
  // Check for carbon fiber first (most specific)
  if (titleLower.includes('carbon fiber nylon') || titleLower.includes('cf nylon')) {
    return 'PA-CF';
  }
  if (titleLower.includes('carbon fiber pc') || titleLower.includes('cf pc')) {
    return 'PC-CF';
  }
  if (titleLower.includes('carbon fiber petg') || titleLower.includes('cf petg')) {
    return 'PETG-CF';
  }
  if (titleLower.includes('carbon fiber abs') || titleLower.includes('cf abs')) {
    return 'ABS-CF';
  }
  
  // Check for specialty materials
  if (titleLower.includes('ultem') || titleLower.includes('pei')) {
    return 'PEI';
  }
  if (titleLower.includes('aquasys') || titleLower.includes('bvoh')) {
    return 'BVOH';
  }
  if (titleLower.includes('pmma') || titleLower.includes('acrylic')) {
    return 'PMMA';
  }
  
  // Check for high-heat PLA variants
  if (titleLower.includes('hh tough') || titleLower.includes('hh+tough') || titleLower.includes('3d870')) {
    return 'PLA-HT';
  }
  if (titleLower.includes('hh pla') || titleLower.includes('high heat pla') || titleLower.includes('3d850')) {
    return 'PLA-HH';
  }
  
  // Check for PC+PBT
  if (titleLower.includes('pc+pbt') || titleLower.includes('pc-pbt')) {
    return 'PC+PBT';
  }
  
  // Standard materials
  if (titleLower.includes('tpu')) {
    return 'TPU-98A';
  }
  if (titleLower.includes('pctg')) {
    return 'PCTG';
  }
  if (titleLower.includes('petg')) {
    return 'PETG';
  }
  if (titleLower.includes('polycarbonate') || (titleLower.includes(' pc ') && !titleLower.includes('pbt'))) {
    return 'PC';
  }
  if (titleLower.includes('asa')) {
    return 'ASA';
  }
  if (titleLower.includes('hips')) {
    return 'HIPS';
  }
  if (titleLower.includes('abs')) {
    return 'ABS';
  }
  if (titleLower.includes('pla')) {
    return 'PLA';
  }
  
  // Fallback to existing material or default
  if (existingMaterial) {
    const mapped = PUSHPLASTIC_MATERIAL_MAPPING[existingMaterial.toLowerCase()];
    if (mapped) return mapped;
    return existingMaterial;
  }
  
  return 'PLA';
}

// ============================================================================
// TDS URL MAPPING
// ============================================================================

export const PUSHPLASTIC_TDS_URLS: Record<string, string> = {
  'pla': 'https://cdn.shopify.com/s/files/1/0260/7421/files/Push_Plastic_PLA_Technical_Data_sheet.pdf',
  'pla-ht': 'https://cdn.shopify.com/s/files/1/0260/7421/files/TechnicalDataSheet_3D870_monofilament_pdf.pdf',
  'pla-hh': 'https://cdn.shopify.com/s/files/1/0260/7421/files/Push_Plastic_HHPLA_3D850_TDS.pdf',
  'petg': 'https://cdn.shopify.com/s/files/1/0260/7421/files/Push_Plastic_PETG_Technical_Data_sheet_6b420a6b-aea1-47d5-b931-464a8804abb4.pdf',
  'pctg': 'https://cdn.shopify.com/s/files/1/0260/7421/files/Push_Plastic_PCTG_TDS.pdf',
  'abs': 'https://cdn.shopify.com/s/files/1/0260/7421/files/Push_Plastic_ABS_Technical_Data_sheet_8f0e2174-914e-4312-8018-fb4d1a5d2e9b.pdf',
  'abs-cf': 'https://cdn.shopify.com/s/files/1/0260/7421/files/Push_Plastic_CF_ABS_Technical_Data_sheet_fa9bc359-10e2-4ae5-9cdd-853a2b165d73.pdf',
  'petg-cf': 'https://cdn.shopify.com/s/files/1/0260/7421/files/PUSH_PLASTIC_CF_PETG_TDS.pdf',
  'pa-cf': 'https://cdn.shopify.com/s/files/1/0260/7421/files/Push_Plastic_CF_Nylon_Technical_Data_sheet.pdf',
  'pc': 'https://cdn.shopify.com/s/files/1/0260/7421/files/Push_Plastic_PC_Technical_Data_sheet.pdf',
  'pc-pbt': 'https://cdn.shopify.com/s/files/1/0260/7421/files/Push_Plastic_PC_PBT_Technical_Data_sheet_4358a3fc-90a8-40d6-b231-0b064cde3ffc.pdf',
  'pc-cf': 'https://cdn.shopify.com/s/files/1/0260/7421/files/CF_PC_PBT_TDS.pdf',
  'asa': 'https://cdn.shopify.com/s/files/1/0260/7421/files/Push_Plastic_ASA_Technical_Data_sheet.pdf',
  'hips': 'https://cdn.shopify.com/s/files/1/0260/7421/files/Push_Plastic_HIPS_Technical_Data_sheet.pdf',
  'pei': 'https://cdn.shopify.com/s/files/1/0260/7421/files/ULTEM_Resin_9085_Americas_Technical_Data_Sheet.pdf',
  'tpu-98a': 'https://cdn.shopify.com/s/files/1/0260/7421/files/Technical_Data_Sheet_TPU98A_v1.0.pdf',
  'bvoh': 'https://cdn.shopify.com/s/files/1/0260/7421/files/PUSH_PLASTIC_MSDS_BVOH_e4ac411f-36b5-4922-8469-2397c67ee5e0.pdf',
  'pmma': 'https://cdn.shopify.com/s/files/1/0260/7421/files/PMMA_TDS.pdf',
};

export function getPushPlasticTdsUrl(settingsKey: string): string | null {
  return PUSHPLASTIC_TDS_URLS[settingsKey] || null;
}

// ============================================================================
// COLOR MAPPING (Official Push Plastic HEX Colors)
// ============================================================================

export const PUSHPLASTIC_COLOR_MAPPING: Record<string, string> = {
  // Blacks and Grays
  'black': '#1A1A1A',
  'dark grey': '#3D3D3D',
  'dark gray': '#3D3D3D',
  'light grey': '#A0A0A0',
  'light gray': '#A0A0A0',
  'grey': '#808080',
  'gray': '#808080',
  
  // Whites and Naturals
  'white': '#FFFFFF',
  'natural': '#F5F0E6',
  'natural white': '#FAFAFA',
  
  // Reds and Pinks
  'red': '#C62828',
  'pink': '#EC407A',
  'magenta': '#AD1457',
  'terra cotta': '#B85C38',
  
  // Oranges and Browns
  'orange': '#EF6C00',
  'pwalt yellow': '#FFB300',
  'brown': '#5D4037',
  'chavant brown': '#6D4C41',
  'bronze metallic': '#CD7F32',
  
  // Yellows
  'yellow': '#FFEB3B',
  'safety yellow': '#FFCC00',      // Safety Yellow - MUST be distinct from regular yellow
  'fluorescent yellow': '#FFFF00',
  
  // Greens
  'green': '#388E3C',
  'pusch green': '#2E8B2E',        // PUSCH brand green - MUST be distinct from standard green
  'army green': '#4B5320',
  'fatigue green': '#5B6B4F',
  'forest green': '#228B22',
  'lime green': '#76FF03',
  'mint': '#98FF98',
  'seafoam': '#71EEB8',
  'fluorescent green': '#39FF14',
  'neon green': '#39FF14',
  
  // Blues
  'blue': '#1976D2',
  'navy blue': '#0D2C54',
  'ocean blue': '#006994',
  'ultra blue': '#0047AB',
  'electric blue': '#7DF9FF',
  'blue pearl': '#4169E1',
  'dark teal': '#014D4E',
  'light teal': '#20B2AA',
  
  // Purples
  'purple': '#7B1FA2',
  
  // Metallics
  'gold metallic': '#FFD700',
  'silver metallic': '#C0C0C0',
  
  // Translucents
  'translucent amber': '#FFB347',
  'translucent blue': '#87CEEB',
  'translucent green': '#90EE90',
  'translucent grey': '#D3D3D3',
  'translucent gray': '#D3D3D3',
  'translucent pink': '#FFB6C1',
  'translucent red': '#FF6B6B',
  'trans amber': '#FFB347',
  'trans blue': '#87CEEB',
  'trans green': '#90EE90',
  'trans grey': '#D3D3D3',
  'trans pink': '#FFB6C1',
  'trans red': '#FF6B6B',
  'clear': '#F0F8FF',
  
  // Special Colors
  'desert tan': '#D2B48C',
  'flat dark earth': '#A67B5B',
  'granite': '#676767',
  'fluorescent pink': '#FF1493',
};

export function getPushPlasticColorHex(colorName: string): string | null {
  const normalizedName = colorName.toLowerCase().trim();
  
  // Direct match in brand-specific map
  if (PUSHPLASTIC_COLOR_MAPPING[normalizedName]) {
    return PUSHPLASTIC_COLOR_MAPPING[normalizedName];
  }
  
  // Partial match in brand-specific map
  for (const [key, hex] of Object.entries(PUSHPLASTIC_COLOR_MAPPING)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return hex;
    }
  }
  
  // Fallback to shared color mapping
  const sharedHex = getSharedColorHex(normalizedName);
  if (sharedHex) {
    return sharedHex.startsWith('#') ? sharedHex : `#${sharedHex}`;
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export const PUSHPLASTIC_TITLE_NOISE: RegExp[] = [
  /\s*filament\s*/gi,
  /\s*-?\s*\d+(\.\d+)?\s*(g|kg|lb|lbs)\s*/gi,
  /\s*-?\s*(1\.75|2\.85|3\.0)\s*mm\s*/gi,
  /\s*subscription\s*/gi,
  /\s*\(.*?\)\s*/g,
  /\s+/g,
];

export function cleanPushPlasticTitle(title: string): string {
  let cleaned = title;
  
  for (const pattern of PUSHPLASTIC_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  
  return cleaned.trim().replace(/\s+/g, ' ');
}

// ============================================================================
// PRODUCT FILTERING
// ============================================================================

export const PUSHPLASTIC_EXCLUDED_TYPES: string[] = [
  'gift card',
  'gift cards',
  'color tag',
  'color tags',
  'sample',
  'samples',
  'bundle',
  'bundles',
  'accessory',
  'accessories',
  'tool',
  'tools',
  'nozzle',
  'nozzles',
  'dryer',
  'dryers',
  'spool holder',
];

export function isPushPlasticFilamentProduct(title: string, productType?: string): boolean {
  const titleLower = title.toLowerCase();
  const typeLower = (productType || '').toLowerCase();
  
  // Exclude non-filament products
  for (const excluded of PUSHPLASTIC_EXCLUDED_TYPES) {
    if (titleLower.includes(excluded) || typeLower.includes(excluded)) {
      return false;
    }
  }
  
  // Must contain material keywords
  const filamentKeywords = ['pla', 'petg', 'abs', 'asa', 'pc', 'nylon', 'pa', 'tpu', 'hips', 'pei', 'ultem', 'bvoh', 'pmma', 'pctg', 'filament'];
  return filamentKeywords.some(keyword => titleLower.includes(keyword));
}

// ============================================================================
// WEIGHT & DIAMETER EXTRACTION
// ============================================================================

export function extractPushPlasticWeight(variantTitle: string): number | null {
  const match = variantTitle.match(/(\d+(?:\.\d+)?)\s*(g|kg|lb|lbs)/i);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit === 'kg') return value * 1000;
    if (unit === 'lb' || unit === 'lbs') return value * 453.592;
    return value;
  }
  return null;
}

export function extractPushPlasticDiameter(variantTitle: string): number {
  if (variantTitle.includes('2.85') || variantTitle.includes('3.0')) {
    return 2.85;
  }
  return 1.75;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface PushPlasticEnrichmentResult {
  material: string;
  finishType: FinishType;
  productLineId: string;
  settingsKey: string;
  printSettings: PrintSettings | null;
  colorHex: string | null;
  tdsUrl: string | null;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
  cleanedTitle: string;
}

/**
 * Enrich a Push Plastic product with brand-specific defaults.
 * 
 * @param title - Full product title
 * @param existingMaterial - Material if already known
 * @param colorName - Color name extracted from variant (CRITICAL: must be passed for color_hex to work)
 */
export function enrichPushPlasticProduct(
  title: string,
  existingMaterial?: string | null,
  colorName?: string | null
): PushPlasticEnrichmentResult {
  const material = normalizePushPlasticMaterial(title, existingMaterial);
  const finishType = extractPushPlasticFinishType(title, material);
  const { productLineId, settingsKey } = generatePushPlasticProductLineId(title, material);
  const printSettings = PUSHPLASTIC_PRINT_SETTINGS[settingsKey] || null;
  const tdsUrl = getPushPlasticTdsUrl(settingsKey);
  const cleanedTitle = cleanPushPlasticTitle(title);
  
  // Get color hex from the passed color name (primary method)
  let colorHex: string | null = null;
  if (colorName) {
    colorHex = getPushPlasticColorHex(colorName);
  }
  
  // Fallback: try to extract color from title
  if (!colorHex) {
    const titleWords = cleanedTitle.split(' ');
    for (let i = 0; i < titleWords.length; i++) {
      const colorAttempt = titleWords.slice(i).join(' ').toLowerCase();
      const hex = getPushPlasticColorHex(colorAttempt);
      if (hex) {
        colorHex = hex;
        break;
      }
    }
  }
  
  const isAbrasive = printSettings?.is_abrasive || false;
  const requiresEnclosure = printSettings?.requires_enclosure || false;
  
  return {
    material,
    finishType,
    productLineId,
    settingsKey,
    printSettings,
    colorHex: colorHex || null,
    tdsUrl,
    isAbrasive,
    requiresEnclosure,
    cleanedTitle,
  };
}
