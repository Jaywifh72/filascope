/**
 * RECREUS CSV-SEEDED PRODUCT DATA
 * 
 * Processed from manufacturer CSV export
 * Filtered: Pellets, Footwearology editions, PP3D Primer
 * Consumer-focused: 1.75mm, 500g-1kg spools only
 * 
 * Product Lines: 13
 * - TPU-60A (FilaFlex 60A): 3 colors
 * - TPU-70A (FilaFlex 70A): 6 colors
 * - TPU-82A (FilaFlex 82A): 15 colors
 * - TPU-95A (FilaFlex 95A): 11 colors
 * - TPU-FOAM (FilaFlex Foamy): 6 colors
 * - TPU-95A-FOAM (FilaFlex 95 Foamy): 4 colors
 * - TPU-SEBS (FilaFlex SEBS): 2 colors
 * - TPU-Conductive (Conductive FilaFlex): 1 color
 * - TPU-Purifier (FilaFlex Purifier): 1 color
 * - TPU-Bio (Balena FilaFlex): 2 colors
 * - rTPU (Reciflex): 1 color
 * - PETG (PET-G HF): 10 colors
 * - PLA: 3 colors
 * - PP (PP3D): 2 colors
 * 
 * Total: ~67 unique color variants
 */

export interface RecreusProductSeed {
  filamentName: string;
  material: string;
  productLineId: string;
  productUrl: string;
  color: string;
  colorHex: string;
  shoreHardness?: string;
}

// Exclusion patterns for non-consumer products
export const RECREUS_EXCLUSION_PATTERNS = [
  /pellet/i,              // Industrial pellets
  /footwearology/i,       // Limited specialty editions
  /pp3d\s*primer/i,       // Not a filament
  /default\s*title/i,     // Placeholder variants
];

// Check if a product should be excluded
export function shouldExcludeRecreusProduct(title: string): boolean {
  return RECREUS_EXCLUSION_PATTERNS.some(pattern => pattern.test(title));
}

// Enhanced color mapping with all CSV colors + common Spanish names
export const RECREUS_COLOR_MAPPING: Record<string, string> = {
  // Core colors from CSV
  'black': '#1C1C1C',
  'white': '#FFFFFF',
  'natural': '#F5F5DC',
  'transparent': '#FFFFFF',
  'nude': '#E3BC9A',
  'red': '#C41E3A',
  'blue': '#0066CC',
  'green': '#228B22',
  'yellow': '#FFD700',
  'orange': '#FF6B35',
  'denim': '#1560BD',
  'grey': '#808080',
  'gray': '#808080',
  'gold': '#FFD700',
  'magenta': '#D946EF',
  'aqua': '#00CED1',
  'brown': '#8B4513',
  'navy blue': '#0066CC',
  'navy': '#000080',
  'metallic green': '#228B22',
  'damantium blue': '#0066CC',
  'copper gum': '#B87333',
  'blue food grade': '#0066CC',
  'fluoride': '#39FF14',
  'mineral': '#8B8680',
  
  // Spanish color names (for regional store variants)
  'negro': '#1C1C1C',
  'blanco': '#FFFFFF',
  'rojo': '#C41E3A',
  'azul': '#0066CC',
  'verde': '#228B22',
  'amarillo': '#FFD700',
  'naranja': '#FF6B35',
  'transparente': '#FFFFFF',
  'azul marino': '#0066CC',
  'verde metalico': '#228B22',
  
  // Footwearology colors (mapped for completeness even though excluded)
  'oat': '#E8DCC4',
  'dusk': '#6E5E5E',
  'mint': '#98FF98',
  'azure': '#007FFF',
  'lavender': '#E6E6FA',
};

// Get hex code for color name
export function getRecreusColorHex(colorName: string): string {
  if (!colorName) return '#808080';
  const normalized = colorName.toLowerCase().trim();
  return RECREUS_COLOR_MAPPING[normalized] || '#808080';
}

// Material normalization with Shore hardness detection
export function normalizeRecreousMaterial(title: string): { material: string; shoreHardness?: string } {
  const titleLower = title.toLowerCase();
  
  // Specific Shore hardness variants - ORDER MATTERS (most specific first)
  if (/filaflex\s*95\s*foamy|filaflex\s*95\s*a?\s*foamy/i.test(title)) {
    return { material: 'TPU-95A-FOAM', shoreHardness: '95A' };
  }
  if (/filaflex\s*foamy|filaflex\s*foam/i.test(title)) {
    return { material: 'TPU-FOAM', shoreHardness: '82A' };
  }
  if (/filaflex\s*60\s*a/i.test(title)) {
    return { material: 'TPU-60A', shoreHardness: '60A' };
  }
  if (/filaflex\s*70\s*a/i.test(title)) {
    return { material: 'TPU-70A', shoreHardness: '70A' };
  }
  if (/filaflex\s*82\s*a/i.test(title)) {
    return { material: 'TPU-82A', shoreHardness: '82A' };
  }
  if (/filaflex\s*95\s*a\b(?!\s*foamy)/i.test(title)) {
    return { material: 'TPU-95A', shoreHardness: '95A' };
  }
  if (/sebs/i.test(title)) {
    return { material: 'TPU-SEBS' };
  }
  if (/conductive\s*filaflex/i.test(title)) {
    return { material: 'TPU-Conductive' };
  }
  if (/purifier/i.test(title)) {
    return { material: 'TPU-Purifier' };
  }
  if (/balena/i.test(title)) {
    return { material: 'TPU-Bio' };
  }
  if (/reciflex/i.test(title)) {
    return { material: 'rTPU' };
  }
  if (/pet-?g|petg/i.test(title)) {
    return { material: 'PETG' };
  }
  if (/pp-?3d|pp3d/i.test(title)) {
    return { material: 'PP' };
  }
  if (/\bpla\b/i.test(title)) {
    return { material: 'PLA' };
  }
  // Generic TPU fallback
  if (/filaflex/i.test(title)) {
    return { material: 'TPU' };
  }
  
  return { material: 'Unknown' };
}

// Generate product line ID
export function generateRecreusProductLineId(filamentName: string, material?: string): string {
  const mat = material || normalizeRecreousMaterial(filamentName).material;
  const materialSlug = mat.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `recreus__${materialSlug}__standard`;
}

// CSV-seeded product data (deduplicated unique color variants)
export const RECREUS_PRODUCT_SEED: RecreusProductSeed[] = [
  // ============================================================================
  // TPU-FOAM (FilaFlex Foamy) - 6 colors
  // ============================================================================
  { filamentName: 'Filaflex Foamy', material: 'TPU-FOAM', productLineId: 'recreus__tpu-foam__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-foamy', color: 'Black', colorHex: '#1C1C1C' },
  { filamentName: 'Filaflex Foamy', material: 'TPU-FOAM', productLineId: 'recreus__tpu-foam__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-foamy', color: 'Natural', colorHex: '#F5F5DC' },
  { filamentName: 'Filaflex Foamy', material: 'TPU-FOAM', productLineId: 'recreus__tpu-foam__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-foamy', color: 'Denim', colorHex: '#1560BD' },
  { filamentName: 'Filaflex Foamy', material: 'TPU-FOAM', productLineId: 'recreus__tpu-foam__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-foamy', color: 'Red', colorHex: '#C41E3A' },
  { filamentName: 'Filaflex Foamy', material: 'TPU-FOAM', productLineId: 'recreus__tpu-foam__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-foamy', color: 'Nude', colorHex: '#E3BC9A' },
  { filamentName: 'Filaflex Foamy', material: 'TPU-FOAM', productLineId: 'recreus__tpu-foam__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-foamy', color: 'Orange', colorHex: '#FF6B35' },

  // ============================================================================
  // TPU-95A-FOAM (FilaFlex 95 Foamy) - 4 colors
  // ============================================================================
  { filamentName: 'Filaflex 95 Foamy', material: 'TPU-95A-FOAM', productLineId: 'recreus__tpu-95a-foam__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-95-foamy', color: 'Denim', colorHex: '#1560BD', shoreHardness: '95A' },
  { filamentName: 'Filaflex 95 Foamy', material: 'TPU-95A-FOAM', productLineId: 'recreus__tpu-95a-foam__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-95-foamy', color: 'Black', colorHex: '#1C1C1C', shoreHardness: '95A' },
  { filamentName: 'Filaflex 95 Foamy', material: 'TPU-95A-FOAM', productLineId: 'recreus__tpu-95a-foam__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-95-foamy', color: 'Nude', colorHex: '#E3BC9A', shoreHardness: '95A' },
  { filamentName: 'Filaflex 95 Foamy', material: 'TPU-95A-FOAM', productLineId: 'recreus__tpu-95a-foam__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-95-foamy', color: 'Red', colorHex: '#C41E3A', shoreHardness: '95A' },

  // ============================================================================
  // PP (PP3D) - 2 colors
  // ============================================================================
  { filamentName: 'PP3D', material: 'PP', productLineId: 'recreus__pp__standard', productUrl: 'https://recreus.com/en-en/products/pp-3d', color: 'Black', colorHex: '#1C1C1C' },
  { filamentName: 'PP3D', material: 'PP', productLineId: 'recreus__pp__standard', productUrl: 'https://recreus.com/en-en/products/pp-3d', color: 'Natural', colorHex: '#F5F5DC' },

  // ============================================================================
  // TPU-Bio (Balena FilaFlex) - 2 colors
  // ============================================================================
  { filamentName: 'Balena Filaflex', material: 'TPU-Bio', productLineId: 'recreus__tpu-bio__standard', productUrl: 'https://recreus.com/en-en/products/balena-filaflex', color: 'Natural', colorHex: '#F5F5DC' },
  { filamentName: 'Balena Filaflex', material: 'TPU-Bio', productLineId: 'recreus__tpu-bio__standard', productUrl: 'https://recreus.com/en-en/products/balena-filaflex', color: 'Black', colorHex: '#1C1C1C' },

  // ============================================================================
  // TPU-SEBS (FilaFlex SEBS) - 2 colors
  // ============================================================================
  { filamentName: 'Filaflex SEBS', material: 'TPU-SEBS', productLineId: 'recreus__tpu-sebs__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-sebs', color: 'Black', colorHex: '#1C1C1C' },
  { filamentName: 'Filaflex SEBS', material: 'TPU-SEBS', productLineId: 'recreus__tpu-sebs__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-sebs', color: 'Natural', colorHex: '#F5F5DC' },

  // ============================================================================
  // TPU-Purifier (FilaFlex Purifier) - 1 color
  // ============================================================================
  { filamentName: 'Filaflex Purifier', material: 'TPU-Purifier', productLineId: 'recreus__tpu-purifier__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-purifier', color: 'Mineral', colorHex: '#8B8680' },

  // ============================================================================
  // TPU-Conductive (Conductive FilaFlex) - 1 color
  // ============================================================================
  { filamentName: 'Conductive Filaflex', material: 'TPU-Conductive', productLineId: 'recreus__tpu-conductive__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-conductivo', color: 'Black', colorHex: '#1C1C1C' },

  // ============================================================================
  // rTPU (Reciflex) - 1 color
  // ============================================================================
  { filamentName: 'Reciflex', material: 'rTPU', productLineId: 'recreus__rtpu__standard', productUrl: 'https://recreus.com/en-en/products/reciflex', color: 'Black', colorHex: '#1C1C1C' },

  // ============================================================================
  // PLA - 3 colors
  // ============================================================================
  { filamentName: 'PLA', material: 'PLA', productLineId: 'recreus__pla__standard', productUrl: 'https://recreus.com/en-en/products/pla', color: 'Black', colorHex: '#1C1C1C' },
  { filamentName: 'PLA', material: 'PLA', productLineId: 'recreus__pla__standard', productUrl: 'https://recreus.com/en-en/products/pla', color: 'White', colorHex: '#FFFFFF' },
  { filamentName: 'PLA', material: 'PLA', productLineId: 'recreus__pla__standard', productUrl: 'https://recreus.com/en-en/products/pla', color: 'Red', colorHex: '#C41E3A' },

  // ============================================================================
  // TPU-60A (FilaFlex 60A) - 3 colors
  // ============================================================================
  { filamentName: 'Filaflex 60A', material: 'TPU-60A', productLineId: 'recreus__tpu-60a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-60a', color: 'Black', colorHex: '#1C1C1C', shoreHardness: '60A' },
  { filamentName: 'Filaflex 60A', material: 'TPU-60A', productLineId: 'recreus__tpu-60a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-60a', color: 'White', colorHex: '#FFFFFF', shoreHardness: '60A' },
  { filamentName: 'Filaflex 60A', material: 'TPU-60A', productLineId: 'recreus__tpu-60a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-60a', color: 'Nude', colorHex: '#E3BC9A', shoreHardness: '60A' },

  // ============================================================================
  // TPU-70A (FilaFlex 70A) - 6 colors
  // ============================================================================
  { filamentName: 'Filaflex 70A', material: 'TPU-70A', productLineId: 'recreus__tpu-70a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-70a', color: 'Black', colorHex: '#1C1C1C', shoreHardness: '70A' },
  { filamentName: 'Filaflex 70A', material: 'TPU-70A', productLineId: 'recreus__tpu-70a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-70a', color: 'White', colorHex: '#FFFFFF', shoreHardness: '70A' },
  { filamentName: 'Filaflex 70A', material: 'TPU-70A', productLineId: 'recreus__tpu-70a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-70a', color: 'Transparent', colorHex: '#FFFFFF', shoreHardness: '70A' },
  { filamentName: 'Filaflex 70A', material: 'TPU-70A', productLineId: 'recreus__tpu-70a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-70a', color: 'Red', colorHex: '#C41E3A', shoreHardness: '70A' },
  { filamentName: 'Filaflex 70A', material: 'TPU-70A', productLineId: 'recreus__tpu-70a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-70a', color: 'Navy Blue', colorHex: '#0066CC', shoreHardness: '70A' },
  { filamentName: 'Filaflex 70A', material: 'TPU-70A', productLineId: 'recreus__tpu-70a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-70a', color: 'Nude', colorHex: '#E3BC9A', shoreHardness: '70A' },

  // ============================================================================
  // TPU-82A (FilaFlex 82A) - 15 colors
  // ============================================================================
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'Black', colorHex: '#1C1C1C', shoreHardness: '82A' },
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'White', colorHex: '#FFFFFF', shoreHardness: '82A' },
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'Transparent', colorHex: '#FFFFFF', shoreHardness: '82A' },
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'Nude', colorHex: '#E3BC9A', shoreHardness: '82A' },
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'Red', colorHex: '#C41E3A', shoreHardness: '82A' },
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'Orange', colorHex: '#FF6B35', shoreHardness: '82A' },
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'Blue', colorHex: '#0066CC', shoreHardness: '82A' },
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'Green', colorHex: '#228B22', shoreHardness: '82A' },
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'Yellow', colorHex: '#FFD700', shoreHardness: '82A' },
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'Fluoride', colorHex: '#39FF14', shoreHardness: '82A' },
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'Aqua', colorHex: '#00CED1', shoreHardness: '82A' },
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'Magenta', colorHex: '#D946EF', shoreHardness: '82A' },
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'Brown', colorHex: '#8B4513', shoreHardness: '82A' },
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'Grey', colorHex: '#808080', shoreHardness: '82A' },
  { filamentName: 'Filaflex 82A', material: 'TPU-82A', productLineId: 'recreus__tpu-82a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-82a', color: 'Gold', colorHex: '#FFD700', shoreHardness: '82A' },

  // ============================================================================
  // TPU-95A (FilaFlex 95A) - 11 colors
  // ============================================================================
  { filamentName: 'Filaflex 95A', material: 'TPU-95A', productLineId: 'recreus__tpu-95a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-95a', color: 'Black', colorHex: '#1C1C1C', shoreHardness: '95A' },
  { filamentName: 'Filaflex 95A', material: 'TPU-95A', productLineId: 'recreus__tpu-95a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-95a', color: 'White', colorHex: '#FFFFFF', shoreHardness: '95A' },
  { filamentName: 'Filaflex 95A', material: 'TPU-95A', productLineId: 'recreus__tpu-95a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-95a', color: 'Transparent', colorHex: '#FFFFFF', shoreHardness: '95A' },
  { filamentName: 'Filaflex 95A', material: 'TPU-95A', productLineId: 'recreus__tpu-95a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-95a', color: 'Nude', colorHex: '#E3BC9A', shoreHardness: '95A' },
  { filamentName: 'Filaflex 95A', material: 'TPU-95A', productLineId: 'recreus__tpu-95a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-95a', color: 'Red', colorHex: '#C41E3A', shoreHardness: '95A' },
  { filamentName: 'Filaflex 95A', material: 'TPU-95A', productLineId: 'recreus__tpu-95a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-95a', color: 'Blue', colorHex: '#0066CC', shoreHardness: '95A' },
  { filamentName: 'Filaflex 95A', material: 'TPU-95A', productLineId: 'recreus__tpu-95a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-95a', color: 'Blue Food Grade', colorHex: '#0066CC', shoreHardness: '95A' },
  { filamentName: 'Filaflex 95A', material: 'TPU-95A', productLineId: 'recreus__tpu-95a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-95a', color: 'Green', colorHex: '#228B22', shoreHardness: '95A' },
  { filamentName: 'Filaflex 95A', material: 'TPU-95A', productLineId: 'recreus__tpu-95a__standard', productUrl: 'https://recreus.com/en-en/products/filaflex-95a', color: 'Fluoride', colorHex: '#39FF14', shoreHardness: '95A' },

  // ============================================================================
  // PETG (PET-G HF) - 10 colors
  // ============================================================================
  { filamentName: 'PET-G HF', material: 'PETG', productLineId: 'recreus__petg__standard', productUrl: 'https://recreus.com/en-en/products/pet-g', color: 'Black', colorHex: '#1C1C1C' },
  { filamentName: 'PET-G HF', material: 'PETG', productLineId: 'recreus__petg__standard', productUrl: 'https://recreus.com/en-en/products/pet-g', color: 'White', colorHex: '#FFFFFF' },
  { filamentName: 'PET-G HF', material: 'PETG', productLineId: 'recreus__petg__standard', productUrl: 'https://recreus.com/en-en/products/pet-g', color: 'Transparent', colorHex: '#FFFFFF' },
  { filamentName: 'PET-G HF', material: 'PETG', productLineId: 'recreus__petg__standard', productUrl: 'https://recreus.com/en-en/products/pet-g', color: 'Nude', colorHex: '#E3BC9A' },
  { filamentName: 'PET-G HF', material: 'PETG', productLineId: 'recreus__petg__standard', productUrl: 'https://recreus.com/en-en/products/pet-g', color: 'Red', colorHex: '#C41E3A' },
  { filamentName: 'PET-G HF', material: 'PETG', productLineId: 'recreus__petg__standard', productUrl: 'https://recreus.com/en-en/products/pet-g', color: 'Navy Blue', colorHex: '#0066CC' },
  { filamentName: 'PET-G HF', material: 'PETG', productLineId: 'recreus__petg__standard', productUrl: 'https://recreus.com/en-en/products/pet-g', color: 'Metallic Green', colorHex: '#228B22' },
  { filamentName: 'PET-G HF', material: 'PETG', productLineId: 'recreus__petg__standard', productUrl: 'https://recreus.com/en-en/products/pet-g', color: 'Damantium Blue', colorHex: '#0066CC' },
  { filamentName: 'PET-G HF', material: 'PETG', productLineId: 'recreus__petg__standard', productUrl: 'https://recreus.com/en-en/products/pet-g', color: 'Copper Gum', colorHex: '#B87333' },
  { filamentName: 'PET-G HF', material: 'PETG', productLineId: 'recreus__petg__standard', productUrl: 'https://recreus.com/en-en/products/pet-g', color: 'Blue Food Grade', colorHex: '#0066CC' },
];

// Count of unique product lines
export const RECREUS_PRODUCT_LINE_COUNT = 14;

// Count of unique color variants
export const RECREUS_VARIANT_COUNT = RECREUS_PRODUCT_SEED.length;

// Product line summary for documentation
export const RECREUS_PRODUCT_LINES = {
  'recreus__tpu-foam__standard': { name: 'FilaFlex Foamy', material: 'TPU-FOAM', colors: 6 },
  'recreus__tpu-95a-foam__standard': { name: 'FilaFlex 95 Foamy', material: 'TPU-95A-FOAM', colors: 4 },
  'recreus__pp__standard': { name: 'PP3D', material: 'PP', colors: 2 },
  'recreus__tpu-bio__standard': { name: 'Balena FilaFlex', material: 'TPU-Bio', colors: 2 },
  'recreus__tpu-sebs__standard': { name: 'FilaFlex SEBS', material: 'TPU-SEBS', colors: 2 },
  'recreus__tpu-purifier__standard': { name: 'FilaFlex Purifier', material: 'TPU-Purifier', colors: 1 },
  'recreus__tpu-conductive__standard': { name: 'Conductive FilaFlex', material: 'TPU-Conductive', colors: 1 },
  'recreus__rtpu__standard': { name: 'Reciflex', material: 'rTPU', colors: 1 },
  'recreus__pla__standard': { name: 'PLA', material: 'PLA', colors: 3 },
  'recreus__tpu-60a__standard': { name: 'FilaFlex 60A', material: 'TPU-60A', colors: 3 },
  'recreus__tpu-70a__standard': { name: 'FilaFlex 70A', material: 'TPU-70A', colors: 6 },
  'recreus__tpu-82a__standard': { name: 'FilaFlex 82A', material: 'TPU-82A', colors: 15 },
  'recreus__tpu-95a__standard': { name: 'FilaFlex 95A', material: 'TPU-95A', colors: 9 },
  'recreus__petg__standard': { name: 'PET-G HF', material: 'PETG', colors: 10 },
};

// Default prices by material (EUR, converted to USD at 1.08 rate)
export const RECREUS_DEFAULT_PRICES: Record<string, number> = {
  'TPU-60A': 35.00,
  'TPU-70A': 35.00,
  'TPU-82A': 35.00,
  'TPU-95A': 32.00,
  'TPU-FOAM': 40.00,
  'TPU-95A-FOAM': 40.00,
  'TPU-SEBS': 45.00,
  'TPU-Conductive': 65.00,
  'TPU-Purifier': 45.00,
  'TPU-Bio': 50.00,
  'rTPU': 35.00,
  'PETG': 28.00,
  'PLA': 25.00,
  'PP': 35.00,
};

// Get default price for material
export function getRecreusDefaultPrice(material: string): number {
  return RECREUS_DEFAULT_PRICES[material] || 35.00;
}
