/**
 * SCRAPER VALIDATION MODULE
 * 
 * Provides validation functions to ensure all scrapers produce consistent output
 * that conforms to the unified filament schema.
 */

import { 
  REGION_CURRENCIES, 
  type RegionCode,
  FILAMENT_SCHEMA 
} from './filament-schema.ts';

// ============================================================================
// SCRAPED PRODUCT INTERFACE
// ============================================================================

/**
 * Standard interface for products returned by all scrapers
 * All scrapers MUST return data in this format for consistency
 */
export interface ScrapedProduct {
  // === Required Fields ===
  productId: string;
  title: string;
  
  // === Pricing ===
  price: number | null;
  compareAtPrice?: number | null;
  currency?: string;
  
  // === URLs ===
  url: string | null;
  imageUrl?: string | null;
  tdsUrl?: string | null;
  
  // === Product Info ===
  material?: string | null;
  colorFamily?: string | null;
  colorHex?: string | null;
  netWeightG?: number | null;
  productLineId?: string | null;
  
  // === Identifiers ===
  mpn?: string | null;
  sku?: string | null;
  barcode?: string | null;
  
  // === Print Settings ===
  nozzleTempMin?: number | null;
  nozzleTempMax?: number | null;
  bedTempMin?: number | null;
  bedTempMax?: number | null;
  
  // === Availability ===
  available?: boolean;
  
  // === Regional Context ===
  region?: string;
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a scraped product against the unified schema
 */
export function validateScrapedProduct(product: ScrapedProduct): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // === Required field validation ===
  if (!product.productId || product.productId.trim() === '') {
    errors.push('Missing or empty productId');
  }
  
  if (!product.title || product.title.trim() === '') {
    errors.push('Missing or empty title');
  }
  
  // === Price validation ===
  if (product.price !== null && product.price !== undefined) {
    if (typeof product.price !== 'number' || isNaN(product.price)) {
      errors.push(`Invalid price type: ${typeof product.price}`);
    } else if (product.price < 0) {
      errors.push(`Negative price: ${product.price}`);
    } else if (product.price > 1000 && product.currency !== 'JPY') {
      warnings.push(`Unusually high price: ${product.price} (expected < 1000 for non-JPY)`);
    }
  }
  
  // === Material validation ===
  if (product.material) {
    const materialField = FILAMENT_SCHEMA.find(f => f.key === 'material');
    const allowedMaterials = materialField?.validation?.allowedValues || [];
    
    if (allowedMaterials.length > 0 && !allowedMaterials.includes(product.material)) {
      warnings.push(`Unknown material: ${product.material}. Allowed: ${allowedMaterials.join(', ')}`);
    }
  }
  
  // === Color family validation ===
  if (product.colorFamily) {
    const colorField = FILAMENT_SCHEMA.find(f => f.key === 'color_family');
    const allowedColors = colorField?.validation?.allowedValues || [];
    
    if (allowedColors.length > 0 && !allowedColors.includes(product.colorFamily)) {
      warnings.push(`Unknown color family: ${product.colorFamily}`);
    }
  }
  
  // === Color hex validation ===
  if (product.colorHex) {
    const hexPattern = /^#?[0-9A-Fa-f]{6}$/;
    if (!hexPattern.test(product.colorHex)) {
      warnings.push(`Invalid color hex format: ${product.colorHex}`);
    }
  }
  
  // === URL validation ===
  if (product.url) {
    try {
      new URL(product.url);
    } catch {
      errors.push(`Invalid product URL: ${product.url}`);
    }
  }
  
  if (product.imageUrl) {
    try {
      new URL(product.imageUrl);
    } catch {
      warnings.push(`Invalid image URL: ${product.imageUrl}`);
    }
  }
  
  if (product.tdsUrl) {
    try {
      new URL(product.tdsUrl);
    } catch {
      warnings.push(`Invalid TDS URL: ${product.tdsUrl}`);
    }
  }
  
  // === Temperature validation ===
  if (product.nozzleTempMin !== null && product.nozzleTempMin !== undefined) {
    if (product.nozzleTempMin < 100 || product.nozzleTempMin > 400) {
      warnings.push(`Unusual nozzle temp min: ${product.nozzleTempMin}°C`);
    }
  }
  
  if (product.nozzleTempMax !== null && product.nozzleTempMax !== undefined) {
    if (product.nozzleTempMax < 100 || product.nozzleTempMax > 450) {
      warnings.push(`Unusual nozzle temp max: ${product.nozzleTempMax}°C`);
    }
  }
  
  if (product.nozzleTempMin && product.nozzleTempMax && product.nozzleTempMin > product.nozzleTempMax) {
    errors.push(`Nozzle temp min (${product.nozzleTempMin}) > max (${product.nozzleTempMax})`);
  }
  
  // === Weight validation ===
  if (product.netWeightG !== null && product.netWeightG !== undefined) {
    if (product.netWeightG < 100 || product.netWeightG > 10000) {
      warnings.push(`Unusual weight: ${product.netWeightG}g (expected 100-10000)`);
    }
  }
  
  // === Region/Currency validation ===
  if (product.region && product.currency) {
    const expectedCurrency = REGION_CURRENCIES[product.region as RegionCode];
    if (expectedCurrency && product.currency !== expectedCurrency) {
      warnings.push(`Currency mismatch: ${product.currency} for region ${product.region} (expected ${expectedCurrency})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a batch of scraped products
 */
export function validateScrapedProducts(products: ScrapedProduct[]): {
  validCount: number;
  invalidCount: number;
  totalWarnings: number;
  results: Array<{ product: ScrapedProduct; validation: ValidationResult }>;
} {
  const results = products.map(product => ({
    product,
    validation: validateScrapedProduct(product),
  }));
  
  return {
    validCount: results.filter(r => r.validation.valid).length,
    invalidCount: results.filter(r => !r.validation.valid).length,
    totalWarnings: results.reduce((sum, r) => sum + r.validation.warnings.length, 0),
    results,
  };
}

/**
 * Validate regional price against expected currency
 */
export function validateRegionalPrice(price: number, region: string, currency?: string): boolean {
  const expectedCurrency = REGION_CURRENCIES[region as RegionCode];
  
  if (!expectedCurrency) {
    console.warn(`Unknown region for price validation: ${region}`);
    return true; // Allow unknown regions
  }
  
  // If currency is provided, verify it matches
  if (currency && currency !== expectedCurrency) {
    console.warn(`Currency mismatch: ${currency} for region ${region} (expected ${expectedCurrency})`);
    return false;
  }
  
  // Validate price range based on currency
  const priceRanges: Record<string, [number, number]> = {
    USD: [0, 500],
    CAD: [0, 700],
    GBP: [0, 400],
    EUR: [0, 500],
    AUD: [0, 800],
    JPY: [0, 50000],
  };
  
  const range = priceRanges[expectedCurrency];
  if (range && (price < range[0] || price > range[1])) {
    console.warn(`Price ${price} ${expectedCurrency} outside expected range ${range[0]}-${range[1]}`);
    return false;
  }
  
  return true;
}
