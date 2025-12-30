/**
 * Flashforge-specific defaults and utility functions
 * Used by sync-flashforge-products edge function
 */

// ============================================================================
// PRINT SETTINGS BY MATERIAL
// ============================================================================

export interface PrintSettings {
  nozzle_temp_min_c: number;
  nozzle_temp_max_c: number;
  bed_temp_min_c: number;
  bed_temp_max_c: number;
  print_speed_max_mms?: number;
  requires_enclosure?: boolean;
  high_speed_capable?: boolean;
}

export const FLASHFORGE_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Standard PLA variants
  'PLA': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 240,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    print_speed_max_mms: 250,
  },
  'PLA Basic': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 240,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    print_speed_max_mms: 250,
  },
  'PLA Crystal': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 240,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    print_speed_max_mms: 250,
  },
  'PLA Pro': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 240,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    print_speed_max_mms: 250,
  },
  'PLA Matte': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    print_speed_max_mms: 200,
  },
  'PLA Silk': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    print_speed_max_mms: 200,
  },
  // High-Speed PLA
  'HS PLA': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 25,
    bed_temp_max_c: 60,
    print_speed_max_mms: 600,
    high_speed_capable: true,
  },
  // PETG
  'PETG': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 70,
    bed_temp_max_c: 85,
    print_speed_max_mms: 250,
  },
  'HS PETG': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 70,
    bed_temp_max_c: 85,
    print_speed_max_mms: 600,
    high_speed_capable: true,
  },
  // ABS
  'ABS': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 95,
    bed_temp_max_c: 110,
    print_speed_max_mms: 150,
    requires_enclosure: true,
  },
  // ASA
  'ASA': {
    nozzle_temp_min_c: 240,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 90,
    bed_temp_max_c: 110,
    print_speed_max_mms: 150,
    requires_enclosure: true,
  },
  // TPU
  'TPU': {
    nozzle_temp_min_c: 210,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 40,
    bed_temp_max_c: 60,
    print_speed_max_mms: 40,
  },
};

export function getFlashforgePrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  
  const normalized = material.toUpperCase().trim();
  
  // Direct match
  for (const [key, settings] of Object.entries(FLASHFORGE_PRINT_SETTINGS)) {
    if (key.toUpperCase() === normalized) {
      return settings;
    }
  }
  
  // Partial match
  if (normalized.includes('HS PLA') || normalized.includes('HIGH SPEED PLA')) {
    return FLASHFORGE_PRINT_SETTINGS['HS PLA'];
  }
  if (normalized.includes('HS PETG') || normalized.includes('HIGH SPEED PETG')) {
    return FLASHFORGE_PRINT_SETTINGS['HS PETG'];
  }
  if (normalized.includes('SILK')) {
    return FLASHFORGE_PRINT_SETTINGS['PLA Silk'];
  }
  if (normalized.includes('MATTE')) {
    return FLASHFORGE_PRINT_SETTINGS['PLA Matte'];
  }
  if (normalized.includes('CRYSTAL')) {
    return FLASHFORGE_PRINT_SETTINGS['PLA Crystal'];
  }
  if (normalized.includes('PLA')) {
    return FLASHFORGE_PRINT_SETTINGS['PLA'];
  }
  if (normalized.includes('PETG')) {
    return FLASHFORGE_PRINT_SETTINGS['PETG'];
  }
  if (normalized.includes('ABS')) {
    return FLASHFORGE_PRINT_SETTINGS['ABS'];
  }
  if (normalized.includes('ASA')) {
    return FLASHFORGE_PRINT_SETTINGS['ASA'];
  }
  if (normalized.includes('TPU')) {
    return FLASHFORGE_PRINT_SETTINGS['TPU'];
  }
  
  return null;
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 'Silk' | 'Crystal' | 'Matte' | 'Rainbow' | 'MultiColor' | 'Standard';

export const FLASHFORGE_FINISH_PATTERNS: Array<{ pattern: RegExp; finish: FinishType }> = [
  { pattern: /silk\+?\s*rainbow/i, finish: 'Rainbow' },
  { pattern: /silk\+?\s*dual\s*color/i, finish: 'MultiColor' },
  { pattern: /silk\+?/i, finish: 'Silk' },
  { pattern: /crystal/i, finish: 'Crystal' },
  { pattern: /matte/i, finish: 'Matte' },
  { pattern: /rainbow/i, finish: 'Rainbow' },
  { pattern: /multicolor/i, finish: 'MultiColor' },
  { pattern: /dual\s*color/i, finish: 'MultiColor' },
];

export function extractFinishType(title: string): FinishType {
  for (const { pattern, finish } of FLASHFORGE_FINISH_PATTERNS) {
    if (pattern.test(title)) {
      return finish;
    }
  }
  return 'Standard';
}

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export const FLASHFORGE_MATERIAL_MAPPING: Record<string, string> = {
  // PLA variants
  'pla basic': 'PLA',
  'pla-basic': 'PLA',
  'pla crystal': 'PLA',
  'pla-crystal': 'PLA',
  'pla matte': 'PLA',
  'pla-matte': 'PLA',
  'pla pro': 'PLA+',
  'pla-pro': 'PLA+',
  'pla silk': 'PLA',
  'pla silk+': 'PLA',
  'pla-silk': 'PLA',
  'pla multicolor': 'PLA',
  'pla-multicolor': 'PLA',
  'hs pla': 'PLA',
  'hs-pla': 'PLA',
  'high speed pla': 'PLA',
  'high-speed pla': 'PLA',
  // PETG variants
  'hs petg': 'PETG',
  'hs-petg': 'PETG',
  'high speed petg': 'PETG',
  'high-speed petg': 'PETG',
  'petg': 'PETG',
  // ABS
  'abs': 'ABS',
  'abs basic': 'ABS',
  // ASA
  'asa': 'ASA',
  'asa basic': 'ASA',
  // TPU
  'tpu': 'TPU',
  'tpu 95a': 'TPU-95A',
};

export function normalizeFlashforgeMaterial(title: string): string | null {
  const lower = title.toLowerCase();
  
  // Direct mapping check
  for (const [key, value] of Object.entries(FLASHFORGE_MATERIAL_MAPPING)) {
    if (lower.includes(key)) {
      return value;
    }
  }
  
  // Pattern-based detection
  if (/\bhs\s*pla\b/i.test(title) || /high[\s-]?speed\s*pla/i.test(title)) {
    return 'PLA';
  }
  if (/\bhs\s*petg\b/i.test(title) || /high[\s-]?speed\s*petg/i.test(title)) {
    return 'PETG';
  }
  if (/\bpla\b/i.test(title)) {
    return 'PLA';
  }
  if (/\bpetg\b/i.test(title)) {
    return 'PETG';
  }
  if (/\babs\b/i.test(title)) {
    return 'ABS';
  }
  if (/\basa\b/i.test(title)) {
    return 'ASA';
  }
  if (/\btpu\b/i.test(title)) {
    return 'TPU';
  }
  
  return null;
}

// ============================================================================
// HIGH-SPEED DETECTION
// ============================================================================

export function isHighSpeedVariant(title: string): boolean {
  return /\bhs\b/i.test(title) || /high[\s-]?speed/i.test(title);
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export const FLASHFORGE_TITLE_NOISE: RegExp[] = [
  /flashforge/gi,
  /filament/gi,
  /1\.75\s*mm/gi,
  /1kg/gi,
  /1\s*kg/gi,
  /\b3d\s*printer?\b/gi,
  /half\s*price\s*when\s*you\s*buy\s*in\s*pairs/gi,
  /buy\s*\d+\s*get\s*\d+/gi,
  /free\s*shipping/gi,
  /\bbasic\b/gi,
  /\bnew\b/gi,
  /\bhot\b/gi,
  /\bsale\b/gi,
  /\s+/g, // Multiple spaces
];

export function cleanFlashforgeTitle(title: string): string {
  let cleaned = title;
  
  for (const pattern of FLASHFORGE_TITLE_NOISE) {
    if (pattern.source === '\\s+') {
      cleaned = cleaned.replace(pattern, ' ');
    } else {
      cleaned = cleaned.replace(pattern, '');
    }
  }
  
  return cleaned.trim().replace(/\s+/g, ' ');
}

// ============================================================================
// VARIANT DETECTION
// ============================================================================

export function isMulticolorVariant(title: string): boolean {
  return /multicolor|multi-color|rainbow|dual\s*color/i.test(title);
}

export function isCrystalVariant(title: string): boolean {
  return /crystal/i.test(title);
}

export function isSilkVariant(title: string): boolean {
  return /silk/i.test(title);
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateFlashforgeProductLineId(
  title: string,
  material?: string | null
): string {
  const parts: string[] = ['flashforge'];
  
  // Determine material
  const normalizedMaterial = material || normalizeFlashforgeMaterial(title);
  if (normalizedMaterial) {
    parts.push(normalizedMaterial.toLowerCase().replace(/[+]/g, '-plus'));
  } else {
    parts.push('unknown');
  }
  
  // Determine variant/finish
  const lower = title.toLowerCase();
  
  // High-speed variants
  if (isHighSpeedVariant(title)) {
    if (isMulticolorVariant(title)) {
      parts.push('hs-multicolor');
    } else if (/rainbow/i.test(title)) {
      parts.push('hs-rainbow');
    } else {
      parts.push('hs');
    }
  }
  // Silk variants
  else if (isSilkVariant(title)) {
    if (/rainbow/i.test(title)) {
      parts.push('silk-rainbow');
    } else if (/dual\s*color/i.test(title)) {
      parts.push('silk-dual');
    } else {
      parts.push('silk');
    }
  }
  // Crystal variant
  else if (isCrystalVariant(title)) {
    parts.push('crystal');
  }
  // Matte variant
  else if (/matte/i.test(title)) {
    parts.push('matte');
  }
  // Multicolor (non-HS, non-silk)
  else if (isMulticolorVariant(title)) {
    parts.push('multicolor');
  }
  // Pro variant
  else if (/\bpro\b/i.test(title)) {
    parts.push('pro');
  }
  // Standard
  else {
    parts.push('standard');
  }
  
  return parts.join('__');
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const FLASHFORGE_COLOR_MAPPING: Record<string, string> = {
  // Basic colors
  'black': '#000000',
  'white': '#FFFFFF',
  'natural': '#F5F5DC',
  'grey': '#808080',
  'gray': '#808080',
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#008000',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'purple': '#800080',
  'pink': '#FFC0CB',
  'brown': '#8B4513',
  'silver': '#C0C0C0',
  'gold': '#FFD700',
  
  // Light variants
  'light green': '#90EE90',
  'light blue': '#ADD8E6',
  'light pink': '#FFB6C1',
  'light grey': '#D3D3D3',
  'light gray': '#D3D3D3',
  
  // Dark variants
  'dark blue': '#00008B',
  'dark green': '#006400',
  'dark grey': '#A9A9A9',
  'dark gray': '#A9A9A9',
  
  // Crystal/Translucent
  'crystal clear': '#E8E8E8',
  'crystal blue': '#87CEEB',
  'crystal green': '#98FB98',
  'rainbow candy': '#FF69B4',
  'mermaid tears': '#7FFFD4',
  'summer reverie': '#FFE4B5',
  
  // Silk colors
  'silk gold': '#DAA520',
  'silk silver': '#C0C0C0',
  'silk bronze': '#CD7F32',
  'silk copper': '#B87333',
  'silk rose gold': '#B76E79',
  'silk champagne': '#F7E7CE',
  
  // Skin tones
  'skin': '#FFDBAC',
  'skin tone': '#FFDBAC',
  
  // Special
  'army green': '#4B5320',
  'navy blue': '#000080',
  'royal blue': '#4169E1',
  'sky blue': '#87CEEB',
  'forest green': '#228B22',
  'lime green': '#32CD32',
  'coral': '#FF7F50',
  'teal': '#008080',
  'cyan': '#00FFFF',
  'magenta': '#FF00FF',
  'maroon': '#800000',
  'olive': '#808000',
  'beige': '#F5F5DC',
  'ivory': '#FFFFF0',
  'cream': '#FFFDD0',
};

export function getFlashforgeColorHex(colorName: string): string | null {
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (FLASHFORGE_COLOR_MAPPING[normalized]) {
    return FLASHFORGE_COLOR_MAPPING[normalized];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(FLASHFORGE_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// NON-FILAMENT DETECTION
// ============================================================================

const NON_FILAMENT_KEYWORDS = [
  'printer',
  'adventurer',
  'creator',
  'guider',
  'dreamer',
  'finder',
  'hunter',
  'enclosure',
  'nozzle',
  'hotend',
  'extruder',
  'bed',
  'plate',
  'sheet',
  'tool',
  'accessory',
  'accessories',
  'part',
  'parts',
  'upgrade',
  'kit',
  'cable',
  'fan',
  'motor',
  'sensor',
  'board',
  'screen',
  'display',
  'cover',
  'door',
  'handle',
  'spool holder',
  'dryer',
  'dry box',
];

const FILAMENT_KEYWORDS = [
  'pla',
  'petg',
  'abs',
  'asa',
  'tpu',
  'filament',
  '1.75mm',
  '1.75 mm',
  'spool',
];

export function isFilamentProduct(title: string, productType?: string): boolean {
  const lower = title.toLowerCase();
  
  // Check for non-filament keywords
  for (const keyword of NON_FILAMENT_KEYWORDS) {
    if (lower.includes(keyword)) {
      // Exception: "spool" in title is OK if it's about filament
      if (keyword === 'spool' && FILAMENT_KEYWORDS.some(fk => lower.includes(fk))) {
        continue;
      }
      return false;
    }
  }
  
  // Must contain at least one filament keyword
  const hasFilamentKeyword = FILAMENT_KEYWORDS.some(keyword => lower.includes(keyword));
  
  // Also check product type if provided
  if (productType) {
    const typeCheck = productType.toLowerCase();
    if (typeCheck.includes('filament') || typeCheck.includes('pla') || typeCheck.includes('petg')) {
      return true;
    }
  }
  
  return hasFilamentKeyword;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface FlashforgeEnrichmentResult {
  material: string | null;
  finish_type: FinishType;
  high_speed_capable: boolean;
  product_line_id: string;
  print_settings: PrintSettings | null;
  color_hex: string | null;
}

export function enrichFlashforgeProduct(
  title: string,
  colorName?: string | null,
  existingMaterial?: string | null
): FlashforgeEnrichmentResult {
  const material = existingMaterial || normalizeFlashforgeMaterial(title);
  const finishType = extractFinishType(title);
  const highSpeed = isHighSpeedVariant(title);
  const productLineId = generateFlashforgeProductLineId(title, material);
  
  // Get print settings based on detected material and variant
  let printSettings: PrintSettings | null = null;
  if (highSpeed && material === 'PLA') {
    printSettings = FLASHFORGE_PRINT_SETTINGS['HS PLA'];
  } else if (highSpeed && material === 'PETG') {
    printSettings = FLASHFORGE_PRINT_SETTINGS['HS PETG'];
  } else if (material) {
    printSettings = getFlashforgePrintSettings(material);
  }
  
  // Get color hex
  const colorHex = colorName ? getFlashforgeColorHex(colorName) : null;
  
  return {
    material,
    finish_type: finishType,
    high_speed_capable: highSpeed,
    product_line_id: productLineId,
    print_settings: printSettings,
    color_hex: colorHex,
  };
}
