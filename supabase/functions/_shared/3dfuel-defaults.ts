/**
 * 3D-FUEL Brand-Specific Defaults and Enrichment Functions
 * 
 * Used by sync-3dfuel-products to apply consistent enrichment rules
 * for 3D-Fuel filament products from their Shopify store.
 */

// ============================================================================
// 3D-FUEL BRAND CONFIGURATION
// ============================================================================

export const BRAND_CONFIG = {
  vendorName: '3D-Fuel',
  brandSlug: '3d-fuel',
  shopifyDomain: '3dfuel.com',
  shopifyApiUrl: 'https://3dfuel.com/products.json',
  defaultDiameter: 1.75,
  defaultWeight: 1000,
  defaultCurrency: 'USD',
  defaultRegion: 'US',
};

// ============================================================================
// 3D-FUEL MATERIAL PATTERNS
// ============================================================================

export const MATERIAL_PATTERNS: Array<{ pattern: RegExp; material: string; finish?: string }> = [
  // Pro/Advanced lines
  { pattern: /\bTough Pro PLA\+/i, material: 'PLA+', finish: 'Matte' },
  { pattern: /\bTough Pro PLA/i, material: 'PLA+', finish: 'Matte' },
  { pattern: /\bStandard PLA\+/i, material: 'PLA+', finish: 'Standard' },
  { pattern: /\bStandard PLA/i, material: 'PLA', finish: 'Standard' },
  { pattern: /\bPro PCTG/i, material: 'PCTG', finish: 'Standard' },
  { pattern: /\bPro PLA/i, material: 'PLA', finish: 'Standard' },
  { pattern: /\bPro HT/i, material: 'PLA-HT', finish: 'Standard' },
  { pattern: /\bPro HTPLA/i, material: 'PLA-HT', finish: 'Standard' },
  { pattern: /\bWorkDay ABS/i, material: 'ABS', finish: 'Standard' },
  { pattern: /\bWorkDay PETG/i, material: 'PETG', finish: 'Standard' },
  
  // Specialty lines
  { pattern: /\bBiome3D/i, material: 'Bioplastic', finish: 'Standard' },
  { pattern: /\bBuzzed/i, material: 'Hemp-PLA', finish: 'Natural' },
  { pattern: /\bEntwined/i, material: 'Hemp-PLA', finish: 'Natural' },
  { pattern: /\bWound Up/i, material: 'Coffee-PLA', finish: 'Natural' },
  { pattern: /\bLandfill/i, material: 'Recycled-PLA', finish: 'Standard' },
  { pattern: /\bc2renew/i, material: 'Recycled-PLA', finish: 'Standard' },
  { pattern: /\bC2 Renew/i, material: 'Recycled-PLA', finish: 'Standard' },
  
  // Generic materials
  { pattern: /\bPLA\+/i, material: 'PLA+' },
  { pattern: /\bPETG/i, material: 'PETG' },
  { pattern: /\bPCTG/i, material: 'PCTG' },
  { pattern: /\bABS/i, material: 'ABS' },
  { pattern: /\bASA/i, material: 'ASA' },
  { pattern: /\bTPU/i, material: 'TPU' },
  { pattern: /\bNylon/i, material: 'Nylon' },
  { pattern: /\bPLA/i, material: 'PLA' },
];

// ============================================================================
// 3D-FUEL COLOR MAPPING (Brand-specific colors)
// ============================================================================

export const COLOR_HEX_MAP: Record<string, string> = {
  // Military/Tactical (3D-Fuel specialty)
  'coyote': '8B5A2B',
  'coyote brown': '8B5A2B',
  'coyote tan': '8B5A2B',
  'desert tan': 'C19A6B',
  'desert': 'C19A6B',
  'ranger green': '4A5D23',
  'flat dark earth': 'A67B5B',
  'fde': 'A67B5B',
  'od green': '3D4C2D',
  'olive drab': '3D4C2D',
  'battleship grey': '6D6E6A',
  'battleship gray': '6D6E6A',
  'tactical black': '1C1C1C',
  'midnight bronze': '4A3728',
  
  // Nature-inspired
  'lava': 'FF4500',
  'ocean': '006994',
  'arctic': 'E0FFFF',
  'volcano': 'CF1020',
  'glacier': 'DFFFFE',
  'sunshine': 'FFD700',
  'meadow': '7CFC00',
  'storm': '4F5D75',
  'snow': 'FFFAFA',
  'iron': '48494B',
  
  // Industrial/Safety
  'safety orange': 'FF6700',
  'high vis yellow': 'DDFF00',
  'electric blue': '0892D0',
  
  // Recycled/Eco line colors
  'coffee brown': '6F4E37',
  'hemp green': '7B8B6F',
  'natural hemp': 'C3B091',
  'recycled grey': '808080',
  'recycled gray': '808080',
  'eco natural': 'F5F5DC',
  
  // Standard colors
  'standard black': '1A1A1A',
  'standard white': 'FAFAFA',
  'standard grey': '808080',
  'standard gray': '808080',
  'tough black': '1A1A1A',
  'tough white': 'FAFAFA',
  'tough grey': '808080',
  'tough gray': '808080',
  
  // Basic colors
  'black': '1A1A1A',
  'white': 'FFFFFF',
  'grey': '808080',
  'gray': '808080',
  'red': 'DC2626',
  'blue': '2563EB',
  'green': '16A34A',
  'yellow': 'EAB308',
  'orange': 'EA580C',
  'purple': '9333EA',
  'pink': 'EC4899',
  'brown': '92400E',
  'natural': 'F5F5DC',
};

// ============================================================================
// 3D-FUEL FINISH TYPE DETECTION
// ============================================================================

export const FINISH_PATTERNS: Array<{ pattern: RegExp; finish: string }> = [
  { pattern: /\bsilk\b/i, finish: 'Silk' },
  { pattern: /\bmatte\b/i, finish: 'Matte' },
  { pattern: /\bgloss(y)?\b/i, finish: 'Glossy' },
  { pattern: /\bmetallic\b/i, finish: 'Metallic' },
  { pattern: /\bglow\b/i, finish: 'Glow' },
  { pattern: /\btranslucent\b/i, finish: 'Translucent' },
  { pattern: /\bclear\b/i, finish: 'Translucent' },
  { pattern: /\bnatural\b/i, finish: 'Natural' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract material type from product title
 */
export function extractMaterial(title: string): string {
  for (const { pattern, material } of MATERIAL_PATTERNS) {
    if (pattern.test(title)) {
      return material;
    }
  }
  return 'PLA'; // Default
}

/**
 * Extract finish type from product title
 */
export function extractFinish(title: string): string {
  // First check material patterns for finish
  for (const { pattern, finish } of MATERIAL_PATTERNS) {
    if (pattern.test(title) && finish) {
      return finish;
    }
  }
  
  // Then check explicit finish patterns
  for (const { pattern, finish } of FINISH_PATTERNS) {
    if (pattern.test(title)) {
      return finish;
    }
  }
  
  return 'Standard';
}

/**
 * Extract color name from variant title or option
 */
export function extractColorName(variant: any, productTitle: string): string {
  // Check variant options first
  if (variant.option1) {
    const opt = variant.option1.toLowerCase();
    // Skip diameter values
    if (!opt.includes('mm') && !opt.includes('1.75') && !opt.includes('2.85')) {
      return variant.option1;
    }
  }
  if (variant.option2) {
    const opt = variant.option2.toLowerCase();
    if (!opt.includes('mm') && !opt.includes('1.75') && !opt.includes('2.85')) {
      return variant.option2;
    }
  }
  if (variant.option3) {
    const opt = variant.option3.toLowerCase();
    if (!opt.includes('mm') && !opt.includes('1.75') && !opt.includes('2.85')) {
      return variant.option3;
    }
  }
  
  // Fall back to parsing from title
  const match = productTitle.match(/[-–]\s*(.+?)(?:\s+\d|$)/i);
  return match ? match[1].trim() : 'Default';
}

/**
 * Get hex color from color name using brand-specific mapping
 */
export function getColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Check brand-specific map first
  if (COLOR_HEX_MAP[normalized]) {
    return COLOR_HEX_MAP[normalized];
  }
  
  // Check partial matches
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

/**
 * Extract diameter from variant or default
 */
export function extractDiameter(variant: any): number {
  const options = [variant.option1, variant.option2, variant.option3].filter(Boolean);
  
  for (const opt of options) {
    const lower = opt.toLowerCase();
    if (lower.includes('2.85') || lower.includes('3.0') || lower.includes('3mm')) {
      return 2.85;
    }
    if (lower.includes('1.75') || lower.includes('1.75mm')) {
      return 1.75;
    }
  }
  
  // Check title/sku for diameter hints
  if (variant.sku) {
    if (variant.sku.includes('285') || variant.sku.includes('3.0')) {
      return 2.85;
    }
  }
  
  return BRAND_CONFIG.defaultDiameter;
}

/**
 * Generate product line ID for grouping variants
 */
export function generateProductLineId(productTitle: string): string {
  // Remove color, weight, diameter variations to get base product
  let base = productTitle
    .replace(/\s*[-–]\s*.+$/, '') // Remove color suffix
    .replace(/\s+\d+g\b/gi, '')    // Remove weight
    .replace(/\s+\d+kg\b/gi, '')   // Remove weight
    .replace(/\s+(1\.75|2\.85)\s*mm/gi, '') // Remove diameter
    .replace(/\s+/g, '-')          // Spaces to dashes
    .toLowerCase()
    .trim();
  
  return `3dfuel-${base}`;
}

/**
 * Clean product title for display
 */
export function cleanProductTitle(title: string, colorName: string): string {
  // Keep material and color, format nicely
  const material = extractMaterial(title);
  return `3D-Fuel ${material} - ${colorName}`;
}

/**
 * Extract weight from variant or product title
 */
export function extractWeight(variant: any, productTitle?: string): number {
  const options = [variant.option1, variant.option2, variant.option3].filter(Boolean);
  
  for (const opt of options) {
    const lower = opt.toLowerCase();
    // Match patterns like "500g", "1kg", "2.5kg"
    const gMatch = lower.match(/(\d+(?:\.\d+)?)\s*g\b/);
    if (gMatch) {
      return parseInt(gMatch[1], 10);
    }
    const kgMatch = lower.match(/(\d+(?:\.\d+)?)\s*kg\b/);
    if (kgMatch) {
      return parseFloat(kgMatch[1]) * 1000;
    }
  }
  
  // Check product title for weight (catches "Pro PCTG Sample Coils, 1.75mm, 50g")
  if (productTitle) {
    const titleLower = productTitle.toLowerCase();
    const gMatch = titleLower.match(/(\d+(?:\.\d+)?)\s*g\b/);
    if (gMatch) {
      return parseInt(gMatch[1], 10);
    }
    const kgMatch = titleLower.match(/(\d+(?:\.\d+)?)\s*kg\b/);
    if (kgMatch) {
      return parseFloat(kgMatch[1]) * 1000;
    }
  }
  
  // Check grams in SKU
  if (variant.grams && variant.grams > 100) {
    return variant.grams;
  }
  
  return BRAND_CONFIG.defaultWeight;
}

/**
 * Build TDS URL based on product handle
 */
export function buildTdsUrl(productHandle: string): string | null {
  // 3D-Fuel typically hosts TDS in their CDN
  // Format: https://cdn.shopify.com/s/files/1/0xxx/xxxx/files/TDS-{product}.pdf
  // We return null here as we need to scrape for actual TDS URLs
  return null;
}

/**
 * Apply all enrichments to a variant
 */
export function enrichVariant(variant: any, product: any): Record<string, any> {
  const colorName = extractColorName(variant, product.title);
  const material = extractMaterial(product.title);
  const finish = extractFinish(product.title);
  const diameter = extractDiameter(variant);
  const weight = extractWeight(variant);
  const colorHex = getColorHex(colorName);
  const productLineId = generateProductLineId(product.title);
  
  return {
    material,
    finish_type: finish,
    color_family: colorName,
    color_hex: colorHex ? `#${colorHex}` : null,
    diameter_nominal_mm: diameter,
    net_weight_g: weight,
    product_line_id: productLineId,
    vendor: BRAND_CONFIG.vendorName,
  };
}
