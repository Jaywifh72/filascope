/**
 * Siraya Tech Product Seed Data
 * 
 * CSV-seeded sync pipeline for Siraya Tech engineering and flexible filaments.
 * Source: Manual curation from siraya.tech product catalog
 * 
 * EXCLUDES:
 * - Silicone products (Defiant 15/25) - casting material, not filament
 * - Peopoly products - different brand sold on site
 * - Bulk/industrial products (>5.5kg)
 * - Sample products (<300g)
 * - 2.85mm/3.0mm diameter products
 */

export interface SirayaTechProductSeed {
  filamentName: string;
  material: string;
  productLineId: string;
  productUrl: string;
  color: string;
  colorHex: string;
  productFamily: 'fibreheart' | 'flex' | 'rebound';
  priceUsd?: number;
}

/**
 * Color-to-hex mapping for Siraya Tech products
 * Curated hex codes to ensure unique swatches within product lines
 */
export const SIRAYATECH_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'black': '#1C1C1C',
  'high flow black': '#0A0A0A',  // Slightly different for PETG-CF Pro
  'white': '#FFFFFF',
  'grey': '#808080',
  'gray': '#808080',
  
  // Translucent/clear - distinct from white
  'clear': '#F5F5F5',
  'transparent': '#E8E8E8',
  'translucent': '#EBEBEB',
  
  // Nature colors
  'green': '#228B22',
  'olive green': '#556B2F',
  
  // Military/tactical colors
  'flat dark earth': '#B5A08E',
};

/**
 * Exclusion patterns for non-filament products
 */
export const SIRAYATECH_EXCLUSION_PATTERNS = [
  /silicone/i,         // Defiant silicone products
  /defiant/i,          // Silicone casting material
  /peopoly/i,          // Different brand sold on site
  /default\s*title/i,  // Placeholder variants
  /magneto/i,          // Peopoly Magneto products
  /lancer/i,           // Peopoly Lancer products
];

/**
 * Check if a product should be excluded from sync
 */
export function shouldExcludeSirayaTechProduct(title: string, variantTitle?: string): boolean {
  const combinedText = `${title} ${variantTitle || ''}`.toLowerCase();
  return SIRAYATECH_EXCLUSION_PATTERNS.some(pattern => pattern.test(combinedText));
}

/**
 * Siraya Tech Product Seed Data
 * 21 product lines, ~33 unique color variants
 * Deduplicated by color (regional variants collapsed)
 */
export const SIRAYATECH_PRODUCT_SEED: SirayaTechProductSeed[] = [
  // ==================== FIBREHEART ENGINEERING LINE ====================
  
  // TPU-GF (Glass Fiber)
  {
    filamentName: 'Fibreheart TPU-GF',
    material: 'TPU-GF',
    productLineId: 'sirayatech__tpu-gf__fibreheart',
    productUrl: 'https://siraya.tech/products/fibreheart-tpu-gf-15-glass-fiber-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'fibreheart',
    priceUsd: 39.99,
  },
  
  // PETG-CF Pro (High Flow)
  {
    filamentName: 'Fibreheart PETG-CF Pro',
    material: 'PETG-CF',
    productLineId: 'sirayatech__petg-cf-pro__fibreheart',
    productUrl: 'https://siraya.tech/products/fibreheart-petg-cf-pro-hf-high-speed-carbon-fiber-petg',
    color: 'High Flow Black',
    colorHex: '#0A0A0A',
    productFamily: 'fibreheart',
    priceUsd: 34.99,
  },
  
  // PETG-CF (Standard)
  {
    filamentName: 'Fibreheart PETG-CF',
    material: 'PETG-CF',
    productLineId: 'sirayatech__petg-cf__fibreheart',
    productUrl: 'https://siraya.tech/products/fibreheart-petg-cf-hf-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'fibreheart',
    priceUsd: 29.99,
  },
  
  // PPA-GF
  {
    filamentName: 'Fibreheart PPA-GF',
    material: 'PPA-GF',
    productLineId: 'sirayatech__ppa-gf__fibreheart',
    productUrl: 'https://siraya.tech/products/fibreheart-ppa-gf-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'fibreheart',
    priceUsd: 49.99,
  },
  
  // ABS HT HF (High Temp, High Flow)
  {
    filamentName: 'Fibreheart ABS HT HF',
    material: 'ABS-HT',
    productLineId: 'sirayatech__abs-ht__fibreheart',
    productUrl: 'https://siraya.tech/products/fibreheart-abs-high-temp-high-flow-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'fibreheart',
    priceUsd: 24.99,
  },
  {
    filamentName: 'Fibreheart ABS HT HF',
    material: 'ABS-HT',
    productLineId: 'sirayatech__abs-ht__fibreheart',
    productUrl: 'https://siraya.tech/products/fibreheart-abs-high-temp-high-flow-filament',
    color: 'White',
    colorHex: '#FFFFFF',
    productFamily: 'fibreheart',
    priceUsd: 24.99,
  },
  
  // ABS-CF Core
  {
    filamentName: 'Fibreheart ABS-CF Core',
    material: 'ABS-CF-Core',
    productLineId: 'sirayatech__abs-cf-core__fibreheart',
    productUrl: 'https://siraya.tech/products/siraya-tech-fibreheart-abs-cf-core-3d-filament-fdm-printing',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'fibreheart',
    priceUsd: 44.99,
  },
  
  // ABS-CF
  {
    filamentName: 'Fibreheart ABS-CF',
    material: 'ABS-CF',
    productLineId: 'sirayatech__abs-cf__fibreheart',
    productUrl: 'https://siraya.tech/products/siraya-tech-fibreheart-abs-cf-3d-printing-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'fibreheart',
    priceUsd: 34.99,
  },
  
  // ABS-GF (3 colors)
  {
    filamentName: 'Fibreheart ABS-GF',
    material: 'ABS-GF',
    productLineId: 'sirayatech__abs-gf__fibreheart',
    productUrl: 'https://siraya.tech/products/fibreheart-abs-gf-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'fibreheart',
    priceUsd: 29.99,
  },
  {
    filamentName: 'Fibreheart ABS-GF',
    material: 'ABS-GF',
    productLineId: 'sirayatech__abs-gf__fibreheart',
    productUrl: 'https://siraya.tech/products/fibreheart-abs-gf-filament',
    color: 'Grey',
    colorHex: '#808080',
    productFamily: 'fibreheart',
    priceUsd: 29.99,
  },
  {
    filamentName: 'Fibreheart ABS-GF',
    material: 'ABS-GF',
    productLineId: 'sirayatech__abs-gf__fibreheart',
    productUrl: 'https://siraya.tech/products/fibreheart-abs-gf-filament',
    color: 'White',
    colorHex: '#FFFFFF',
    productFamily: 'fibreheart',
    priceUsd: 29.99,
  },
  
  // ASA-GF (2 colors)
  {
    filamentName: 'Fibreheart ASA-GF',
    material: 'ASA-GF',
    productLineId: 'sirayatech__asa-gf__fibreheart',
    productUrl: 'https://siraya.tech/products/siraya-tech-fibreheart-asa-gf-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'fibreheart',
    priceUsd: 34.99,
  },
  {
    filamentName: 'Fibreheart ASA-GF',
    material: 'ASA-GF',
    productLineId: 'sirayatech__asa-gf__fibreheart',
    productUrl: 'https://siraya.tech/products/siraya-tech-fibreheart-asa-gf-filament',
    color: 'White',
    colorHex: '#FFFFFF',
    productFamily: 'fibreheart',
    priceUsd: 34.99,
  },
  
  // PET-CF
  {
    filamentName: 'Fibreheart PET-CF',
    material: 'PET-CF',
    productLineId: 'sirayatech__pet-cf__fibreheart',
    productUrl: 'https://siraya.tech/products/siraya-tech-fibreheart-pet-cf-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'fibreheart',
    priceUsd: 39.99,
  },
  
  // PET-GF (4 colors)
  {
    filamentName: 'Fibreheart PET-GF',
    material: 'PET-GF',
    productLineId: 'sirayatech__pet-gf__fibreheart',
    productUrl: 'https://siraya.tech/products/siraya-tech-fibreheart-pet-gf-3dprintingfilament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'fibreheart',
    priceUsd: 29.99,
  },
  {
    filamentName: 'Fibreheart PET-GF',
    material: 'PET-GF',
    productLineId: 'sirayatech__pet-gf__fibreheart',
    productUrl: 'https://siraya.tech/products/siraya-tech-fibreheart-pet-gf-3dprintingfilament',
    color: 'White',
    colorHex: '#FFFFFF',
    productFamily: 'fibreheart',
    priceUsd: 29.99,
  },
  {
    filamentName: 'Fibreheart PET-GF',
    material: 'PET-GF',
    productLineId: 'sirayatech__pet-gf__fibreheart',
    productUrl: 'https://siraya.tech/products/siraya-tech-fibreheart-pet-gf-3dprintingfilament',
    color: 'Olive Green',
    colorHex: '#556B2F',
    productFamily: 'fibreheart',
    priceUsd: 29.99,
  },
  {
    filamentName: 'Fibreheart PET-GF',
    material: 'PET-GF',
    productLineId: 'sirayatech__pet-gf__fibreheart',
    productUrl: 'https://siraya.tech/products/siraya-tech-fibreheart-pet-gf-3dprintingfilament',
    color: 'Flat Dark Earth',
    colorHex: '#B5A08E',
    productFamily: 'fibreheart',
    priceUsd: 29.99,
  },
  
  // PPA (Plain)
  {
    filamentName: 'Fibreheart PPA',
    material: 'PPA',
    productLineId: 'sirayatech__ppa__fibreheart',
    productUrl: 'https://siraya.tech/products/siraya-tech-fibreheart-ppa-3d-printing-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'fibreheart',
    priceUsd: 44.99,
  },
  
  // PPA-CF
  {
    filamentName: 'Fibreheart PPA-CF',
    material: 'PPA-CF',
    productLineId: 'sirayatech__ppa-cf__fibreheart',
    productUrl: 'https://siraya.tech/products/siraya-tech-fibreheart-paht-cf-colors-1-75mm-ppacf-filament-fdmprinting',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'fibreheart',
    priceUsd: 49.99,
  },
  
  // PPA-CF Core
  {
    filamentName: 'Fibreheart PPA-CF Core',
    material: 'PPA-CF-Core',
    productLineId: 'sirayatech__ppa-cf-core__fibreheart',
    productUrl: 'https://siraya.tech/products/siraya-tech-fibreheart-ppa-nylon-based-paht-cf-core-3d-printing-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'fibreheart',
    priceUsd: 54.99,
  },
  
  // ==================== FLEX TPU LINE ====================
  
  // TPU 64D (2 colors)
  {
    filamentName: 'Flex TPU 64D',
    material: 'TPU-64D',
    productLineId: 'sirayatech__tpu-64d__flex',
    productUrl: 'https://siraya.tech/products/flex-tpu-64d-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'flex',
    priceUsd: 34.99,
  },
  {
    filamentName: 'Flex TPU 64D',
    material: 'TPU-64D',
    productLineId: 'sirayatech__tpu-64d__flex',
    productUrl: 'https://siraya.tech/products/flex-tpu-64d-filament',
    color: 'White',
    colorHex: '#FFFFFF',
    productFamily: 'flex',
    priceUsd: 34.99,
  },
  
  // TPU 85A (4 colors)
  {
    filamentName: 'Flex TPU 85A',
    material: 'TPU-85A',
    productLineId: 'sirayatech__tpu-85a__flex',
    productUrl: 'https://siraya.tech/products/flex-tpu-85a-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'flex',
    priceUsd: 34.99,
  },
  {
    filamentName: 'Flex TPU 85A',
    material: 'TPU-85A',
    productLineId: 'sirayatech__tpu-85a__flex',
    productUrl: 'https://siraya.tech/products/flex-tpu-85a-filament',
    color: 'White',
    colorHex: '#FFFFFF',
    productFamily: 'flex',
    priceUsd: 34.99,
  },
  {
    filamentName: 'Flex TPU 85A',
    material: 'TPU-85A',
    productLineId: 'sirayatech__tpu-85a__flex',
    productUrl: 'https://siraya.tech/products/flex-tpu-85a-filament',
    color: 'Clear',
    colorHex: '#F5F5F5',
    productFamily: 'flex',
    priceUsd: 34.99,
  },
  {
    filamentName: 'Flex TPU 85A',
    material: 'TPU-85A',
    productLineId: 'sirayatech__tpu-85a__flex',
    productUrl: 'https://siraya.tech/products/flex-tpu-85a-filament',
    color: 'Green',
    colorHex: '#228B22',
    productFamily: 'flex',
    priceUsd: 34.99,
  },
  
  // TPU 95A (1 color)
  {
    filamentName: 'Flex TPU 95A',
    material: 'TPU-95A',
    productLineId: 'sirayatech__tpu-95a__flex',
    productUrl: 'https://siraya.tech/products/siraya-tech-flex-tpu-95a-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'flex',
    priceUsd: 29.99,
  },
  
  // TPU Air (Foaming) - 3 colors
  {
    filamentName: 'Flex TPU Air',
    material: 'TPU-FOAM',
    productLineId: 'sirayatech__tpu-foam__flex',
    productUrl: 'https://siraya.tech/products/flex-tpu-air-65a-82a-foaming-flexible-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'flex',
    priceUsd: 39.99,
  },
  {
    filamentName: 'Flex TPU Air',
    material: 'TPU-FOAM',
    productLineId: 'sirayatech__tpu-foam__flex',
    productUrl: 'https://siraya.tech/products/flex-tpu-air-65a-82a-foaming-flexible-filament',
    color: 'White',
    colorHex: '#FFFFFF',
    productFamily: 'flex',
    priceUsd: 39.99,
  },
  {
    filamentName: 'Flex TPU Air',
    material: 'TPU-FOAM',
    productLineId: 'sirayatech__tpu-foam__flex',
    productUrl: 'https://siraya.tech/products/flex-tpu-air-65a-82a-foaming-flexible-filament',
    color: 'Green',
    colorHex: '#228B22',
    productFamily: 'flex',
    priceUsd: 39.99,
  },
  
  // ==================== REBOUND PEBA LINE ====================
  
  // PEBA 85A
  {
    filamentName: 'Rebound PEBA 85A',
    material: 'PEBA-85A',
    productLineId: 'sirayatech__peba-85a__rebound',
    productUrl: 'https://siraya.tech/products/fibreheart-rebound-peba-85a-black-elastic-flexible-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'rebound',
    priceUsd: 49.99,
  },
  
  // PEBA 95A
  {
    filamentName: 'Rebound PEBA 95A',
    material: 'PEBA-95A',
    productLineId: 'sirayatech__peba-95a__rebound',
    productUrl: 'https://siraya.tech/products/fibreheart-rebound-peba-95a-black-elastic-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'rebound',
    priceUsd: 49.99,
  },
  
  // PEBA Air (Foaming)
  {
    filamentName: 'Rebound PEBA Air',
    material: 'PEBA-FOAM',
    productLineId: 'sirayatech__peba-foam__rebound',
    productUrl: 'https://siraya.tech/products/siraya-tech-rebound-peba-air-70a-95a-foamed-elastic-filament',
    color: 'Black',
    colorHex: '#1C1C1C',
    productFamily: 'rebound',
    priceUsd: 54.99,
  },
];

/**
 * Get unique product line count
 */
export function getSirayaTechProductLineCount(): number {
  const uniqueLines = new Set(SIRAYATECH_PRODUCT_SEED.map(p => p.productLineId));
  return uniqueLines.size;
}

/**
 * Get total variant count
 */
export function getSirayaTechVariantCount(): number {
  return SIRAYATECH_PRODUCT_SEED.length;
}

/**
 * Get color hex from seed data or fallback mapping
 */
export function getSirayaTechColorHexFromSeed(colorName: string): string | null {
  // First check the mapping
  const normalizedColor = colorName.toLowerCase().trim();
  if (SIRAYATECH_COLOR_MAPPING[normalizedColor]) {
    return SIRAYATECH_COLOR_MAPPING[normalizedColor];
  }
  
  // Check partial matches
  for (const [key, hex] of Object.entries(SIRAYATECH_COLOR_MAPPING)) {
    if (normalizedColor.includes(key) || key.includes(normalizedColor)) {
      return hex;
    }
  }
  
  // Default to black for engineering materials
  return '#1C1C1C';
}
