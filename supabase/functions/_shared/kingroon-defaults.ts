/**
 * Kingroon-specific defaults and utilities for filament sync
 * 
 * Key characteristics:
 * - Shopify platform with unique "Size / Warehouse / Color" variant structure
 * - No TDS PDFs available - specs embedded in HTML tables
 * - Single global store with warehouse-based fulfillment (US, EU, UK, CA)
 * - All prices in USD regardless of warehouse
 * - Heavy focus on multicolor/effect variants (Silk Rainbow, Tri-color, etc.)
 */

// ============================================================================
// Print Settings by Material
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

export const KINGROON_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Standard PLA
  'PLA': {
    nozzleTempMin: 190,
    nozzleTempMax: 210,
    bedTempMin: 50,
    bedTempMax: 70,
    printSpeedMax: 150,
  },
  'PLA Basic': {
    nozzleTempMin: 190,
    nozzleTempMax: 210,
    bedTempMin: 50,
    bedTempMax: 70,
    printSpeedMax: 150,
  },
  // Silk PLA variants
  'PLA Silk': {
    nozzleTempMin: 195,
    nozzleTempMax: 215,
    bedTempMin: 50,
    bedTempMax: 70,
    printSpeedMax: 120,
  },
  // Matte PLA
  'PLA Matte': {
    nozzleTempMin: 190,
    nozzleTempMax: 210,
    bedTempMin: 50,
    bedTempMax: 70,
    printSpeedMax: 150,
  },
  // Glow PLA
  'PLA-Glow': {
    nozzleTempMin: 200,
    nozzleTempMax: 220,
    bedTempMin: 50,
    bedTempMax: 70,
    printSpeedMax: 100,
  },
  // Marble PLA
  'PLA Marble': {
    nozzleTempMin: 195,
    nozzleTempMax: 215,
    bedTempMin: 50,
    bedTempMax: 70,
    printSpeedMax: 120,
  },
  // PETG
  'PETG': {
    nozzleTempMin: 220,
    nozzleTempMax: 250,
    bedTempMin: 70,
    bedTempMax: 80,
    printSpeedMax: 100,
  },
  // High-Speed PETG
  'HS-PETG': {
    nozzleTempMin: 220,
    nozzleTempMax: 250,
    bedTempMin: 70,
    bedTempMax: 80,
    printSpeedMax: 300,
  },
  // TPU
  'TPU-95A': {
    nozzleTempMin: 210,
    nozzleTempMax: 230,
    bedTempMin: 50,
    bedTempMax: 60,
    printSpeedMax: 40,
  },
  // ABS
  'ABS': {
    nozzleTempMin: 220,
    nozzleTempMax: 260,
    bedTempMin: 100,
    bedTempMax: 110,
    printSpeedMax: 80,
    requiresEnclosure: true,
  },
  // PA (Nylon)
  'PA': {
    nozzleTempMin: 240,
    nozzleTempMax: 270,
    bedTempMin: 70,
    bedTempMax: 90,
    printSpeedMax: 60,
    requiresEnclosure: true,
  },
  // Carbon Fiber variants
  'PA-CF': {
    nozzleTempMin: 245,
    nozzleTempMax: 280,
    bedTempMin: 70,
    bedTempMax: 90,
    printSpeedMax: 60,
    requiresEnclosure: true,
    isAbrasive: true,
  },
  'PLA-CF': {
    nozzleTempMin: 200,
    nozzleTempMax: 230,
    bedTempMin: 50,
    bedTempMax: 70,
    printSpeedMax: 80,
    isAbrasive: true,
  },
  'PETG-CF': {
    nozzleTempMin: 230,
    nozzleTempMax: 260,
    bedTempMin: 70,
    bedTempMax: 85,
    printSpeedMax: 80,
    isAbrasive: true,
  },
  'ABS-CF': {
    nozzleTempMin: 230,
    nozzleTempMax: 270,
    bedTempMin: 100,
    bedTempMax: 110,
    printSpeedMax: 70,
    requiresEnclosure: true,
    isAbrasive: true,
  },
};

export function getKingroonPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  
  const normalizedMaterial = material.trim();
  
  // Direct match
  if (KINGROON_PRINT_SETTINGS[normalizedMaterial]) {
    return KINGROON_PRINT_SETTINGS[normalizedMaterial];
  }
  
  // Partial match
  const upperMaterial = normalizedMaterial.toUpperCase();
  for (const [key, settings] of Object.entries(KINGROON_PRINT_SETTINGS)) {
    if (upperMaterial.includes(key.toUpperCase()) || key.toUpperCase().includes(upperMaterial)) {
      return settings;
    }
  }
  
  // Default to PLA settings
  return KINGROON_PRINT_SETTINGS['PLA'];
}

// ============================================================================
// Finish Type Detection
// ============================================================================

export type FinishType = 'Silk' | 'Matte' | 'Glow' | 'Marble' | 'Standard';

export const KINGROON_FINISH_PATTERNS: Array<{ pattern: RegExp; finish: FinishType }> = [
  { pattern: /silk\s*(rainbow|tri-?color|dual|color)?/i, finish: 'Silk' },
  { pattern: /macaroon/i, finish: 'Silk' },
  { pattern: /candy/i, finish: 'Silk' },
  { pattern: /matte\s*(rainbow)?/i, finish: 'Matte' },
  { pattern: /glow[-\s]?in[-\s]?the[-\s]?dark/i, finish: 'Glow' },
  { pattern: /luminous/i, finish: 'Glow' },
  { pattern: /marble/i, finish: 'Marble' },
];

export function extractFinishType(title: string): FinishType {
  for (const { pattern, finish } of KINGROON_FINISH_PATTERNS) {
    if (pattern.test(title)) {
      return finish;
    }
  }
  return 'Standard';
}

// ============================================================================
// Material Normalization
// ============================================================================

export const KINGROON_MATERIAL_MAPPING: Record<string, string> = {
  // PLA variants
  'pla basic': 'PLA',
  'pla': 'PLA',
  'pla+': 'PLA+',
  'pla pro': 'PLA+',
  'silk pla': 'PLA',
  'silk rainbow pla': 'PLA',
  'silk tri-color pla': 'PLA',
  'silk tricolor pla': 'PLA',
  'silk dual color pla': 'PLA',
  'matte pla': 'PLA',
  'matte rainbow pla': 'PLA',
  'glow-in-the-dark pla': 'PLA-Glow',
  'glow-in-the-dark rainbow pla': 'PLA-Glow',
  'luminous pla': 'PLA-Glow',
  'marble pla': 'PLA',
  'macaroon silk rainbow pla': 'PLA',
  'candy silk rainbow pla': 'PLA',
  'pla-cf': 'PLA-CF',
  'pla cf': 'PLA-CF',
  'pla carbon fiber': 'PLA-CF',
  
  // PETG variants
  'petg': 'PETG',
  'petg basic': 'PETG',
  'hs-petg': 'PETG',
  'hs petg': 'PETG',
  'high speed petg': 'PETG',
  'high-speed petg': 'PETG',
  'petg-cf': 'PETG-CF',
  'petg cf': 'PETG-CF',
  'petg carbon fiber': 'PETG-CF',
  
  // TPU
  'tpu': 'TPU-95A',
  'tpu 95a': 'TPU-95A',
  'tpu-95a': 'TPU-95A',
  'flexible tpu': 'TPU-95A',
  
  // ABS
  'abs': 'ABS',
  'abs basic': 'ABS',
  'abs-cf': 'ABS-CF',
  'abs cf': 'ABS-CF',
  'abs carbon fiber': 'ABS-CF',
  
  // Nylon/PA
  'pa': 'PA',
  'pa nylon': 'PA',
  'nylon': 'PA',
  'pa-cf': 'PA-CF',
  'pa cf': 'PA-CF',
  'pa nylon cf': 'PA-CF',
  'nylon carbon fiber': 'PA-CF',
};

export function normalizeKingroonMaterial(title: string): string | null {
  const lowerTitle = title.toLowerCase();
  
  // Check for carbon fiber first (more specific)
  if (/pa[-\s]?cf|nylon[-\s]?cf|pa[-\s]?carbon/i.test(title)) {
    return 'PA-CF';
  }
  if (/pla[-\s]?cf|pla[-\s]?carbon/i.test(title)) {
    return 'PLA-CF';
  }
  if (/petg[-\s]?cf|petg[-\s]?carbon/i.test(title)) {
    return 'PETG-CF';
  }
  if (/abs[-\s]?cf|abs[-\s]?carbon/i.test(title)) {
    return 'ABS-CF';
  }
  
  // Check for high-speed PETG
  if (/hs[-\s]?petg|high[-\s]?speed[-\s]?petg/i.test(title)) {
    return 'PETG';
  }
  
  // Check for glow variants
  if (/glow[-\s]?in[-\s]?the[-\s]?dark|luminous/i.test(title)) {
    return 'PLA-Glow';
  }
  
  // Direct mapping
  for (const [key, value] of Object.entries(KINGROON_MATERIAL_MAPPING)) {
    if (lowerTitle.includes(key)) {
      return value;
    }
  }
  
  // Fallback pattern matching
  if (/\bpetg\b/i.test(title)) return 'PETG';
  if (/\btpu\b/i.test(title)) return 'TPU-95A';
  if (/\babs\b/i.test(title)) return 'ABS';
  if (/\bpa\b|\bnylon\b/i.test(title)) return 'PA';
  if (/\bpla\b/i.test(title)) return 'PLA';
  
  return null;
}

// ============================================================================
// High-Speed Detection
// ============================================================================

export function isHighSpeedVariant(title: string): boolean {
  return /hs[-\s]?petg|high[-\s]?speed/i.test(title);
}

// ============================================================================
// Title Cleaning
// ============================================================================

export const KINGROON_TITLE_NOISE: RegExp[] = [
  /\bkingroon\b/gi,
  /\(fresh\)/gi,
  /\bfresh\b/gi,
  /3d\s*filament/gi,
  /3d\s*printing\s*filament/gi,
  /3d\s*printer\s*filament/gi,
  /\bfilament\b/gi,
  /1\.75\s*mm/gi,
  /1\.75mm/gi,
  /\b1kg\b/gi,
  /\b1\s*kg\b/gi,
  /\b2kg\s*pack\b/gi,
  /\b10kg\s*pack\b/gi,
  /\b10kg\b/gi,
  /\bpack\b/gi,
  /\bbundle\b/gi,
  /\bspool\b/gi,
  /\s+/g, // Multiple spaces
];

export function cleanKingroonTitle(title: string): string {
  let cleaned = title;
  
  for (const pattern of KINGROON_TITLE_NOISE) {
    if (pattern.source === '\\s+') {
      cleaned = cleaned.replace(pattern, ' ');
    } else {
      cleaned = cleaned.replace(pattern, '');
    }
  }
  
  // Remove emojis
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
  
  return cleaned.trim().replace(/\s+/g, ' ');
}

// ============================================================================
// Variant Detection
// ============================================================================

export function isSilkRainbowVariant(title: string): boolean {
  return /silk\s*rainbow/i.test(title);
}

export function isTricolorVariant(title: string): boolean {
  return /tri[-\s]?color/i.test(title);
}

export function isDualColorVariant(title: string): boolean {
  return /dual[-\s]?color/i.test(title);
}

export function isMatteRainbowVariant(title: string): boolean {
  return /matte\s*rainbow/i.test(title);
}

export function isGlowRainbowVariant(title: string): boolean {
  return /glow[-\s]?in[-\s]?the[-\s]?dark\s*rainbow/i.test(title);
}

export function isMacaroonVariant(title: string): boolean {
  return /macaroon/i.test(title);
}

export function isCandyVariant(title: string): boolean {
  return /candy/i.test(title);
}

export function isMarbleVariant(title: string): boolean {
  return /marble/i.test(title);
}

export function isBulkVariant(title: string): boolean {
  return /10kg|10\s*kg/i.test(title);
}

export function isCarbonFiberVariant(title: string): boolean {
  return /[-\s]cf\b|carbon\s*fiber/i.test(title);
}

// ============================================================================
// Warehouse Region Extraction
// ============================================================================

export type WarehouseRegion = 'US' | 'EU' | 'UK' | 'CA' | 'CN' | null;

export function extractWarehouseRegion(variantTitle: string): WarehouseRegion {
  const lowerTitle = variantTitle.toLowerCase();
  
  if (/\/\s*us\s*\/|us\s*warehouse|\bus\b/i.test(variantTitle)) return 'US';
  if (/\/\s*eu\s*\/|eu\s*warehouse|\beu\b/i.test(variantTitle)) return 'EU';
  if (/\/\s*uk\s*\/|uk\s*warehouse|\buk\b/i.test(variantTitle)) return 'UK';
  if (/\/\s*ca\s*\/|ca\s*warehouse|\bcanada\b/i.test(variantTitle)) return 'CA';
  if (/\/\s*cn\s*\/|cn\s*warehouse|china/i.test(variantTitle)) return 'CN';
  
  return null;
}

// ============================================================================
// Product Line ID Generation
// ============================================================================

export function generateKingroonProductLineId(title: string, material?: string | null): string {
  const normalizedMaterial = material || normalizeKingroonMaterial(title) || 'pla';
  const lowerMaterial = normalizedMaterial.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  let suffix = 'standard';
  
  // Bulk variants
  if (isBulkVariant(title)) {
    suffix = 'bulk-10kg';
  }
  // Carbon fiber variants
  else if (isCarbonFiberVariant(title)) {
    suffix = 'cf';
  }
  // High-speed variants
  else if (isHighSpeedVariant(title)) {
    suffix = 'hs';
  }
  // Macaroon Silk
  else if (isMacaroonVariant(title)) {
    suffix = 'macaroon';
  }
  // Candy Silk
  else if (isCandyVariant(title)) {
    suffix = 'candy';
  }
  // Marble
  else if (isMarbleVariant(title)) {
    suffix = 'marble';
  }
  // Glow rainbow
  else if (isGlowRainbowVariant(title)) {
    suffix = 'glow-rainbow';
  }
  // Matte rainbow
  else if (isMatteRainbowVariant(title)) {
    suffix = 'matte-rainbow';
  }
  // Tri-color silk
  else if (isTricolorVariant(title)) {
    suffix = 'silk-tricolor';
  }
  // Dual color silk
  else if (isDualColorVariant(title)) {
    suffix = 'silk-dual';
  }
  // Silk rainbow
  else if (isSilkRainbowVariant(title)) {
    suffix = 'silk-rainbow';
  }
  // Basic silk (not rainbow)
  else if (/silk/i.test(title) && !isSilkRainbowVariant(title)) {
    suffix = 'silk';
  }
  // Matte (not rainbow)
  else if (/matte/i.test(title) && !isMatteRainbowVariant(title)) {
    suffix = 'matte';
  }
  // Glow (not rainbow)
  else if (/glow/i.test(title) && !isGlowRainbowVariant(title)) {
    suffix = 'glow';
  }
  
  // Build the base material name without CF suffix (it's in the suffix)
  let baseMaterial = lowerMaterial.replace(/-cf$/, '');
  if (isCarbonFiberVariant(title) && !lowerMaterial.includes('cf')) {
    suffix = 'cf';
  }
  
  return `kingroon__${baseMaterial}__${suffix}`;
}

// ============================================================================
// Color Mapping
// ============================================================================

export const KINGROON_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'white': '#FFFFFF',
  'black': '#1A1A1A',
  'gray': '#808080',
  'grey': '#808080',
  'silver': '#C0C0C0',
  'red': '#E53935',
  'blue': '#1E88E5',
  'green': '#43A047',
  'yellow': '#FDD835',
  'orange': '#FB8C00',
  'purple': '#8E24AA',
  'pink': '#EC407A',
  'brown': '#795548',
  'skin': '#FFCC99',
  'beige': '#F5DEB3',
  'transparent': '#FFFFFF00',
  'clear': '#FFFFFF00',
  'natural': '#F5F5DC',
  
  // Metallic/Silk colors
  'gold': '#FFD700',
  'copper': '#B87333',
  'bronze': '#CD7F32',
  'rose gold': '#B76E79',
  
  // Glow colors
  'glow green': '#39FF14',
  'glow blue': '#00FFFF',
  'glow orange': '#FF6600',
  
  // Multicolor descriptions
  'rainbow': '#FF6B6B',
  'macaroons color': '#FFB6C1',
  'macaroon': '#FFB6C1',
  'candy color': '#FF69B4',
  'candy': '#FF69B4',
  '4 mixed colors': '#FF6B6B',
  'mixed colors': '#FF6B6B',
  'multicolor': '#FF6B6B',
  
  // Marble
  'marble white': '#F0F0F0',
  'marble black': '#2A2A2A',
  'marble gray': '#888888',
  
  // Color combinations (common tri-color/dual patterns)
  'red-blue': '#9B59B6',
  'blue-green': '#00CED1',
  'yellow-orange': '#FFA500',
  'pink-purple': '#DA70D6',
  'gold-silver': '#D4AF37',
};

export function getKingroonColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const lowerColor = colorName.toLowerCase().trim();
  
  // Direct match
  if (KINGROON_COLOR_MAPPING[lowerColor]) {
    return KINGROON_COLOR_MAPPING[lowerColor];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(KINGROON_COLOR_MAPPING)) {
    if (lowerColor.includes(key) || key.includes(lowerColor)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// Non-Filament Detection
// ============================================================================

const NON_FILAMENT_KEYWORDS = [
  'printer',
  'kp3s',
  'kp5l',
  'klp1',
  'extruder',
  'hotend',
  'nozzle',
  'heat block',
  'thermistor',
  'heating element',
  'stepper motor',
  'timing belt',
  'bearing',
  'enclosure',
  'dry box',
  'dryer',
  'bed',
  'sheet',
  'plate',
  'pei',
  'spring steel',
  'tool',
  'upgrade kit',
  'spare part',
  'cable',
  'fan',
  'power supply',
  'screen',
  'display',
  'motherboard',
  'mainboard',
];

export function isFilamentProduct(title: string, productType?: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerType = (productType || '').toLowerCase();
  
  // Check product type first
  if (lowerType.includes('filament')) return true;
  if (lowerType.includes('printer') || lowerType.includes('accessory') || lowerType.includes('part')) {
    return false;
  }
  
  // Check for non-filament keywords
  for (const keyword of NON_FILAMENT_KEYWORDS) {
    if (lowerTitle.includes(keyword)) {
      // But make sure it's not just in the filament name context
      if (!lowerTitle.includes('filament') && !lowerTitle.includes('pla') && 
          !lowerTitle.includes('petg') && !lowerTitle.includes('tpu') &&
          !lowerTitle.includes('abs') && !lowerTitle.includes('nylon')) {
        return false;
      }
    }
  }
  
  // Positive filament indicators
  if (/\bpla\b|\bpetg\b|\btpu\b|\babs\b|\bnylon\b|\bpa\b|\bfilament\b/i.test(title)) {
    return true;
  }
  
  return false;
}

// ============================================================================
// Variant Title Parsing (Size / Warehouse / Color)
// ============================================================================

export interface ParsedVariant {
  size: string | null;
  warehouse: WarehouseRegion;
  color: string | null;
}

export function parseVariantTitle(variantTitle: string): ParsedVariant {
  // Kingroon uses format: "Size / Warehouse / Color" or variations
  const parts = variantTitle.split('/').map(p => p.trim());
  
  let size: string | null = null;
  let warehouse: WarehouseRegion = null;
  let color: string | null = null;
  
  for (const part of parts) {
    const lowerPart = part.toLowerCase();
    
    // Check for size (e.g., "1KG", "10KG", "2KG Pack")
    if (/\d+\s*(kg|g)\b/i.test(part)) {
      size = part;
    }
    // Check for warehouse
    else if (/^(us|eu|uk|ca|cn|china)$/i.test(part) || /warehouse/i.test(part)) {
      warehouse = extractWarehouseRegion(part);
    }
    // Otherwise it's probably a color
    else if (part && !warehouse) {
      // Skip if it's just a size indicator
      if (!/^\d+/.test(part)) {
        color = part;
      }
    } else if (part && warehouse) {
      // After warehouse, rest is color
      color = part;
    }
  }
  
  // If only one part, it's likely just the color
  if (parts.length === 1 && !size && !warehouse) {
    color = parts[0];
  }
  
  return { size, warehouse, color };
}

// ============================================================================
// Main Enrichment Function
// ============================================================================

export interface KingroonEnrichmentResult {
  material: string | null;
  finishType: FinishType;
  isHighSpeed: boolean;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
  productLineId: string;
  printSettings: PrintSettings | null;
  colorHex: string | null;
  isBulk: boolean;
}

export function enrichKingroonProduct(
  title: string,
  colorName?: string | null,
  existingMaterial?: string | null
): KingroonEnrichmentResult {
  const material = existingMaterial || normalizeKingroonMaterial(title);
  const finishType = extractFinishType(title);
  const isHighSpeed = isHighSpeedVariant(title);
  const productLineId = generateKingroonProductLineId(title, material);
  const printSettings = getKingroonPrintSettings(material);
  const colorHex = colorName ? getKingroonColorHex(colorName) : null;
  const isBulk = isBulkVariant(title);
  
  return {
    material,
    finishType,
    isHighSpeed,
    isAbrasive: printSettings?.isAbrasive || false,
    requiresEnclosure: printSettings?.requiresEnclosure || false,
    productLineId,
    printSettings,
    colorHex,
    isBulk,
  };
}
