/**
 * ULTIMAKER CSV-SEEDED PRODUCT DATA
 * 
 * Curated from manufacturer catalog - 92 variants across 30 product lines
 * Three printer series: S-Series, Method Series, Factor Series
 * 
 * Architecture: CSV-seeded (delete-then-insert pattern)
 * Currency: USD (US store pricing)
 * Diameter: 2.85mm (all products - Ultimaker ecosystem)
 * Weight: 750g standard, 350g for some support materials
 * 
 * Excludes: Metal Expansion Kit (not filament)
 */

export interface UltimakerSeedProduct {
  series: 'S-Series' | 'Method' | 'Factor';
  material: string;
  color: string;
  productUrl: string;
  weight?: number;
  tdsUrl?: string;
}

// ============================================================================
// PRODUCT SEED DATA (92 variants)
// ============================================================================

export const ULTIMAKER_PRODUCT_SEED: UltimakerSeedProduct[] = [
  // ==== S-SERIES PRODUCTS (53 variants) ====
  
  // S-Series PLA (11 colors)
  { series: 'S-Series', material: 'PLA', color: 'Black', productUrl: 'https://ultimaker.com/materials/s-series-pla/' },
  { series: 'S-Series', material: 'PLA', color: 'Gray', productUrl: 'https://ultimaker.com/materials/s-series-pla/' },
  { series: 'S-Series', material: 'PLA', color: 'True Green', productUrl: 'https://ultimaker.com/materials/s-series-pla/' },
  { series: 'S-Series', material: 'PLA', color: 'True Orange', productUrl: 'https://ultimaker.com/materials/s-series-pla/' },
  { series: 'S-Series', material: 'PLA', color: 'True Red', productUrl: 'https://ultimaker.com/materials/s-series-pla/' },
  { series: 'S-Series', material: 'PLA', color: 'True Yellow', productUrl: 'https://ultimaker.com/materials/s-series-pla/' },
  { series: 'S-Series', material: 'PLA', color: 'White', productUrl: 'https://ultimaker.com/materials/s-series-pla/' },
  { series: 'S-Series', material: 'PLA', color: 'Blue', productUrl: 'https://ultimaker.com/materials/s-series-pla/' },
  { series: 'S-Series', material: 'PLA', color: 'Silver', productUrl: 'https://ultimaker.com/materials/s-series-pla/' },
  { series: 'S-Series', material: 'PLA', color: 'Pearl White', productUrl: 'https://ultimaker.com/materials/s-series-pla/' },
  { series: 'S-Series', material: 'PLA', color: 'Transparent', productUrl: 'https://ultimaker.com/materials/s-series-pla/' },
  
  // S-Series Tough PLA (6 colors)
  { series: 'S-Series', material: 'Tough PLA', color: 'Black', productUrl: 'https://ultimaker.com/materials/s-series-tough-pla/' },
  { series: 'S-Series', material: 'Tough PLA', color: 'White', productUrl: 'https://ultimaker.com/materials/s-series-tough-pla/' },
  { series: 'S-Series', material: 'Tough PLA', color: 'Green', productUrl: 'https://ultimaker.com/materials/s-series-tough-pla/' },
  { series: 'S-Series', material: 'Tough PLA', color: 'Red', productUrl: 'https://ultimaker.com/materials/s-series-tough-pla/' },
  { series: 'S-Series', material: 'Tough PLA', color: 'Yellow', productUrl: 'https://ultimaker.com/materials/s-series-tough-pla/' },
  { series: 'S-Series', material: 'Tough PLA', color: 'Blue', productUrl: 'https://ultimaker.com/materials/s-series-tough-pla/' },
  
  // S-Series PETG (2 colors)
  { series: 'S-Series', material: 'PETG', color: 'Black', productUrl: 'https://ultimaker.com/materials/s-series-petg/' },
  { series: 'S-Series', material: 'PETG', color: 'Transparent', productUrl: 'https://ultimaker.com/materials/s-series-petg/' },
  
  // S-Series ABS (10 colors)
  { series: 'S-Series', material: 'ABS', color: 'Black', productUrl: 'https://ultimaker.com/materials/s-series-abs/' },
  { series: 'S-Series', material: 'ABS', color: 'White', productUrl: 'https://ultimaker.com/materials/s-series-abs/' },
  { series: 'S-Series', material: 'ABS', color: 'Gray', productUrl: 'https://ultimaker.com/materials/s-series-abs/' },
  { series: 'S-Series', material: 'ABS', color: 'Blue', productUrl: 'https://ultimaker.com/materials/s-series-abs/' },
  { series: 'S-Series', material: 'ABS', color: 'Yellow', productUrl: 'https://ultimaker.com/materials/s-series-abs/' },
  { series: 'S-Series', material: 'ABS', color: 'Red', productUrl: 'https://ultimaker.com/materials/s-series-abs/' },
  { series: 'S-Series', material: 'ABS', color: 'Green', productUrl: 'https://ultimaker.com/materials/s-series-abs/' },
  { series: 'S-Series', material: 'ABS', color: 'Orange', productUrl: 'https://ultimaker.com/materials/s-series-abs/' },
  { series: 'S-Series', material: 'ABS', color: 'Silver', productUrl: 'https://ultimaker.com/materials/s-series-abs/' },
  { series: 'S-Series', material: 'ABS', color: 'Pearl Gold', productUrl: 'https://ultimaker.com/materials/s-series-abs/' },
  
  // S-Series PET-CF (1 color)
  { series: 'S-Series', material: 'PET-CF', color: 'Black', productUrl: 'https://ultimaker.com/materials/s-series-pet-carbon-fiber/' },
  
  // S-Series Nylon (2 colors)
  { series: 'S-Series', material: 'Nylon', color: 'Black', productUrl: 'https://ultimaker.com/materials/s-series-nylon/' },
  { series: 'S-Series', material: 'Nylon', color: 'Transparent', productUrl: 'https://ultimaker.com/materials/s-series-nylon/' },
  
  // S-Series Nylon CF Slide (1 color)
  { series: 'S-Series', material: 'Nylon CF', color: 'Black', productUrl: 'https://ultimaker.com/materials/nylon-cf-slide/' },
  
  // S-Series CPE (8 colors)
  { series: 'S-Series', material: 'CPE', color: 'Black', productUrl: 'https://ultimaker.com/materials/s-series-cpe/' },
  { series: 'S-Series', material: 'CPE', color: 'White', productUrl: 'https://ultimaker.com/materials/s-series-cpe/' },
  { series: 'S-Series', material: 'CPE', color: 'Transparent', productUrl: 'https://ultimaker.com/materials/s-series-cpe/' },
  { series: 'S-Series', material: 'CPE', color: 'Yellow', productUrl: 'https://ultimaker.com/materials/s-series-cpe/' },
  { series: 'S-Series', material: 'CPE', color: 'Red', productUrl: 'https://ultimaker.com/materials/s-series-cpe/' },
  { series: 'S-Series', material: 'CPE', color: 'Green', productUrl: 'https://ultimaker.com/materials/s-series-cpe/' },
  { series: 'S-Series', material: 'CPE', color: 'Blue', productUrl: 'https://ultimaker.com/materials/s-series-cpe/' },
  { series: 'S-Series', material: 'CPE', color: 'Dark Gray', productUrl: 'https://ultimaker.com/materials/s-series-cpe/' },
  
  // S-Series CPE+ (3 colors)
  { series: 'S-Series', material: 'CPE+', color: 'Black', productUrl: 'https://ultimaker.com/materials/s-series-cpe-plus/' },
  { series: 'S-Series', material: 'CPE+', color: 'White', productUrl: 'https://ultimaker.com/materials/s-series-cpe-plus/' },
  { series: 'S-Series', material: 'CPE+', color: 'Transparent', productUrl: 'https://ultimaker.com/materials/s-series-cpe-plus/' },
  
  // S-Series PC (3 colors)
  { series: 'S-Series', material: 'PC', color: 'Black', productUrl: 'https://ultimaker.com/materials/s-series-pc/' },
  { series: 'S-Series', material: 'PC', color: 'White', productUrl: 'https://ultimaker.com/materials/s-series-pc/' },
  { series: 'S-Series', material: 'PC', color: 'Transparent', productUrl: 'https://ultimaker.com/materials/s-series-pc/' },
  
  // S-Series PP (1 color)
  { series: 'S-Series', material: 'PP', color: 'Natural', productUrl: 'https://ultimaker.com/materials/s-series-pp/' },
  
  // S-Series TPU 95A (4 colors)
  { series: 'S-Series', material: 'TPU 95A', color: 'Black', productUrl: 'https://ultimaker.com/materials/s-series-tpu-95a/' },
  { series: 'S-Series', material: 'TPU 95A', color: 'White', productUrl: 'https://ultimaker.com/materials/s-series-tpu-95a/' },
  { series: 'S-Series', material: 'TPU 95A', color: 'Red', productUrl: 'https://ultimaker.com/materials/s-series-tpu-95a/' },
  { series: 'S-Series', material: 'TPU 95A', color: 'Blue', productUrl: 'https://ultimaker.com/materials/s-series-tpu-95a/' },
  
  // S-Series PVA (1 color)
  { series: 'S-Series', material: 'PVA', color: 'Natural', productUrl: 'https://ultimaker.com/materials/s-series-pva/' },
  
  // S-Series Breakaway (1 color)
  { series: 'S-Series', material: 'Breakaway', color: 'White', productUrl: 'https://ultimaker.com/materials/s-series-breakaway/' },
  
  // ==== METHOD SERIES PRODUCTS (38 variants) ====
  
  // Method Series PLA (8 colors)
  { series: 'Method', material: 'PLA', color: 'White', productUrl: 'https://ultimaker.com/materials/method-series-pla/' },
  { series: 'Method', material: 'PLA', color: 'Black', productUrl: 'https://ultimaker.com/materials/method-series-pla/' },
  { series: 'Method', material: 'PLA', color: 'Red', productUrl: 'https://ultimaker.com/materials/method-series-pla/' },
  { series: 'Method', material: 'PLA', color: 'Orange', productUrl: 'https://ultimaker.com/materials/method-series-pla/' },
  { series: 'Method', material: 'PLA', color: 'Yellow', productUrl: 'https://ultimaker.com/materials/method-series-pla/' },
  { series: 'Method', material: 'PLA', color: 'Green', productUrl: 'https://ultimaker.com/materials/method-series-pla/' },
  { series: 'Method', material: 'PLA', color: 'Blue', productUrl: 'https://ultimaker.com/materials/method-series-pla/' },
  { series: 'Method', material: 'PLA', color: 'Gray', productUrl: 'https://ultimaker.com/materials/method-series-pla/' },
  
  // Method Series Tough PLA (2 colors)
  { series: 'Method', material: 'Tough PLA', color: 'Stone White', productUrl: 'https://ultimaker.com/materials/method-series-tough-pla/' },
  { series: 'Method', material: 'Tough PLA', color: 'Slate Gray', productUrl: 'https://ultimaker.com/materials/method-series-tough-pla/' },
  
  // Method Series PETG (2 colors)
  { series: 'Method', material: 'PETG', color: 'Black', productUrl: 'https://ultimaker.com/materials/method-series-petg/' },
  { series: 'Method', material: 'PETG', color: 'Translucent Natural', productUrl: 'https://ultimaker.com/materials/method-series-petg/' },
  
  // Method Series ABS (8 colors)
  { series: 'Method', material: 'ABS', color: 'White', productUrl: 'https://ultimaker.com/materials/method-series-abs/' },
  { series: 'Method', material: 'ABS', color: 'Black', productUrl: 'https://ultimaker.com/materials/method-series-abs/' },
  { series: 'Method', material: 'ABS', color: 'Red', productUrl: 'https://ultimaker.com/materials/method-series-abs/' },
  { series: 'Method', material: 'ABS', color: 'Orange', productUrl: 'https://ultimaker.com/materials/method-series-abs/' },
  { series: 'Method', material: 'ABS', color: 'Yellow', productUrl: 'https://ultimaker.com/materials/method-series-abs/' },
  { series: 'Method', material: 'ABS', color: 'Green', productUrl: 'https://ultimaker.com/materials/method-series-abs/' },
  { series: 'Method', material: 'ABS', color: 'Blue', productUrl: 'https://ultimaker.com/materials/method-series-abs/' },
  { series: 'Method', material: 'ABS', color: 'Gray', productUrl: 'https://ultimaker.com/materials/method-series-abs/' },
  
  // Method Series ABS-R (3 colors)
  { series: 'Method', material: 'ABS-R', color: 'White', productUrl: 'https://ultimaker.com/materials/method-series-abs-r/' },
  { series: 'Method', material: 'ABS-R', color: 'Black', productUrl: 'https://ultimaker.com/materials/method-series-abs-r/' },
  { series: 'Method', material: 'ABS-R', color: 'Gray', productUrl: 'https://ultimaker.com/materials/method-series-abs-r/' },
  
  // Method Series ASA (3 colors)
  { series: 'Method', material: 'ASA', color: 'White', productUrl: 'https://ultimaker.com/materials/method-series-asa/' },
  { series: 'Method', material: 'ASA', color: 'Black', productUrl: 'https://ultimaker.com/materials/method-series-asa/' },
  { series: 'Method', material: 'ASA', color: 'Gray', productUrl: 'https://ultimaker.com/materials/method-series-asa/' },
  
  // Method Series Nylon (2 colors)
  { series: 'Method', material: 'Nylon', color: 'Natural', productUrl: 'https://ultimaker.com/materials/method-series-nylon/' },
  { series: 'Method', material: 'Nylon', color: 'Black', productUrl: 'https://ultimaker.com/materials/method-series-nylon/' },
  
  // Method Series PC-ABS (2 colors)
  { series: 'Method', material: 'PC-ABS', color: 'White', productUrl: 'https://ultimaker.com/materials/method-series-pc-abs/' },
  { series: 'Method', material: 'PC-ABS', color: 'Black', productUrl: 'https://ultimaker.com/materials/method-series-pc-abs/' },
  
  // Method Series PC-ABS FR (1 color)
  { series: 'Method', material: 'PC-ABS FR', color: 'Black', productUrl: 'https://ultimaker.com/materials/method-series-pc-abs-fr/' },
  
  // Method Series Nylon 12 CF (1 color)
  { series: 'Method', material: 'Nylon 12 CF', color: 'Black', productUrl: 'https://ultimaker.com/materials/method-series-nylon-12-carbon-fiber/' },
  
  // Method Series ABS CF (1 color)
  { series: 'Method', material: 'ABS CF', color: 'Black', productUrl: 'https://ultimaker.com/materials/method-series-abs-carbon-fiber/' },
  
  // Method Series Nylon CF (1 color)
  { series: 'Method', material: 'Nylon CF', color: 'Black', productUrl: 'https://ultimaker.com/materials/method-series-nylon-carbon-fiber/' },
  
  // Method Series PVA (1 color)
  { series: 'Method', material: 'PVA', color: 'Natural', productUrl: 'https://ultimaker.com/materials/method-series-pva/' },
  
  // Method Series RapidRinse (1 color)
  { series: 'Method', material: 'RapidRinse', color: 'Natural', productUrl: 'https://ultimaker.com/materials/method-series-rapidrinse/' },
  
  // Method Series SR-30 (1 color)
  { series: 'Method', material: 'SR-30', color: 'Natural', productUrl: 'https://ultimaker.com/materials/method-series-sr-30/' },
  
  // ==== FACTOR SERIES PRODUCTS (1 variant) ====
  
  // Factor Series PPS CF (1 color)
  { series: 'Factor', material: 'PPS CF', color: 'Black', productUrl: 'https://ultimaker.com/materials/factor-series-pps-carbon-fiber/' },
];

// ============================================================================
// COLOR HEX MAPPING (all colors from seed)
// ============================================================================

export const ULTIMAKER_COLOR_HEX_MAP: Record<string, string> = {
  // Standard colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'gray': '#808080',
  'grey': '#808080',
  'dark gray': '#404040',
  'dark grey': '#404040',
  'slate gray': '#708090',
  'silver': '#C0C0C0',
  
  // Vibrant colors (True series from S-Series PLA)
  'true green': '#16A34A',
  'true orange': '#EA580C',
  'true red': '#DC2626',
  'true yellow': '#FACC15',
  
  // Standard colors
  'red': '#DC2626',
  'blue': '#2563EB',
  'green': '#16A34A',
  'yellow': '#FACC15',
  'orange': '#EA580C',
  
  // Special colors
  'pearl white': '#F5F5F5',
  'pearl gold': '#D4AF37',
  'stone white': '#E8E8E0',
  'natural': '#F5E6D3',
  'transparent': '#E8E8E8',
  'translucent natural': '#E8E8D0',
};

// ============================================================================
// MATERIAL TO NORMALIZED MATERIAL MAPPING
// ============================================================================

export const ULTIMAKER_MATERIAL_NORMALIZATION: Record<string, string> = {
  // S-Series materials
  'PLA': 'PLA',
  'Tough PLA': 'PLA+',
  'PETG': 'PETG',
  'ABS': 'ABS',
  'PET-CF': 'PET-CF',
  'Nylon': 'PA',
  'Nylon CF': 'PA-CF',
  'CPE': 'CPE',
  'CPE+': 'CPE+',
  'PC': 'PC',
  'PP': 'PP',
  'TPU 95A': 'TPU-95A',
  'PVA': 'PVA',
  'Breakaway': 'Breakaway',
  
  // Method Series materials
  'ABS-R': 'ABS-R',
  'ASA': 'ASA',
  'PC-ABS': 'PC-ABS',
  'PC-ABS FR': 'PC-ABS-FR',
  'Nylon 12 CF': 'PA12-CF',
  'ABS CF': 'ABS-CF',
  'RapidRinse': 'RapidRinse',
  'SR-30': 'SR-30',
  
  // Factor Series materials
  'PPS CF': 'PPS-CF',
};

// ============================================================================
// DEFAULT PRICING BY MATERIAL (USD)
// ============================================================================

export const ULTIMAKER_MATERIAL_PRICES: Record<string, number> = {
  // S-Series standard materials
  'PLA': 39.00,
  'PLA+': 49.95,
  'PETG': 44.99,
  'ABS': 44.99,
  'CPE': 59.95,
  'CPE+': 69.95,
  'PC': 69.95,
  'PP': 69.95,
  'PA': 69.95,
  'TPU-95A': 79.00,
  
  // Support materials
  'PVA': 99.95,
  'Breakaway': 69.95,
  
  // Composites
  'PET-CF': 139.00,
  'PA-CF': 99.00,
  
  // Method Series materials
  'ABS-R': 54.99,
  'ASA': 59.95,
  'PC-ABS': 79.95,
  'PC-ABS-FR': 89.95,
  'PA12-CF': 129.00,
  'ABS-CF': 119.00,
  'RapidRinse': 89.95,
  'SR-30': 89.95,
  
  // Factor Series
  'PPS-CF': 110.00,
};

// ============================================================================
// SINGLE-COLOR PRODUCT LINES (for Post Sync Check whitelist)
// ============================================================================

export const ULTIMAKER_SINGLE_COLOR_PRODUCT_LINES: string[] = [
  // S-Series single-color materials
  'ultimaker__s-series__pet-cf',
  'ultimaker__s-series__pa-cf',
  'ultimaker__s-series__pp',
  'ultimaker__s-series__pva',
  'ultimaker__s-series__breakaway',
  
  // Method Series single-color materials
  'ultimaker__method__pc-abs-fr',
  'ultimaker__method__pa12-cf',
  'ultimaker__method__abs-cf',
  'ultimaker__method__pa-cf',
  'ultimaker__method__pva',
  'ultimaker__method__rapidrinse',
  'ultimaker__method__sr-30',
  
  // Factor Series
  'ultimaker__factor__pps-cf',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color hex from color name
 */
export function getUltimakerColorHexFromSeed(colorName: string): string | null {
  if (!colorName) return null;
  const normalized = colorName.toLowerCase().trim();
  return ULTIMAKER_COLOR_HEX_MAP[normalized] || null;
}

/**
 * Get normalized material code from CSV material name
 */
export function getNormalizedUltimakerMaterial(material: string): string {
  return ULTIMAKER_MATERIAL_NORMALIZATION[material] || material;
}

/**
 * Get default price for a material
 */
export function getUltimakerMaterialPrice(material: string): number {
  return ULTIMAKER_MATERIAL_PRICES[material] || 49.95;
}

/**
 * Generate product line ID from series and material
 */
export function generateUltimakerProductLineIdFromSeed(
  series: 'S-Series' | 'Method' | 'Factor',
  material: string
): string {
  const normalizedMaterial = getNormalizedUltimakerMaterial(material);
  const seriesSlug = series.toLowerCase().replace('-', '');
  const materialSlug = normalizedMaterial.toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  return `ultimaker__${seriesSlug}__${materialSlug}`;
}

/**
 * Get color family from color name
 */
export function getUltimakerColorFamily(colorName: string): string {
  const normalized = colorName.toLowerCase().trim();
  
  // Map special colors to base families
  if (normalized.includes('true green') || normalized.includes('green')) return 'Green';
  if (normalized.includes('true orange') || normalized.includes('orange')) return 'Orange';
  if (normalized.includes('true red') || normalized.includes('red')) return 'Red';
  if (normalized.includes('true yellow') || normalized.includes('yellow')) return 'Yellow';
  if (normalized.includes('pearl white') || normalized.includes('stone white') || normalized.includes('white')) return 'White';
  if (normalized.includes('pearl gold') || normalized.includes('gold')) return 'Gold';
  if (normalized.includes('dark gray') || normalized.includes('slate gray') || normalized.includes('gray') || normalized.includes('grey')) return 'Gray';
  if (normalized.includes('silver')) return 'Silver';
  if (normalized.includes('blue')) return 'Blue';
  if (normalized.includes('black')) return 'Black';
  if (normalized.includes('natural') || normalized.includes('translucent')) return 'Natural';
  if (normalized.includes('transparent')) return 'Transparent';
  
  // Default: capitalize first letter
  return colorName.charAt(0).toUpperCase() + colorName.slice(1).toLowerCase();
}

/**
 * Generate unique product ID from seed product
 */
export function generateUltimakerProductId(product: UltimakerSeedProduct): string {
  const series = product.series.toLowerCase().replace('-', '');
  const material = product.material.toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const color = product.color.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  return `ultimaker-${series}-${material}-${color}`;
}

/**
 * Get product line stats from seed
 */
export function getUltimakerProductLineStats(): {
  totalProducts: number;
  productLines: number;
  seriesCounts: Record<string, number>;
} {
  const productLines = new Set<string>();
  const seriesCounts: Record<string, number> = {
    'S-Series': 0,
    'Method': 0,
    'Factor': 0,
  };
  
  for (const product of ULTIMAKER_PRODUCT_SEED) {
    const lineId = generateUltimakerProductLineIdFromSeed(product.series, product.material);
    productLines.add(lineId);
    seriesCounts[product.series]++;
  }
  
  return {
    totalProducts: ULTIMAKER_PRODUCT_SEED.length,
    productLines: productLines.size,
    seriesCounts,
  };
}
